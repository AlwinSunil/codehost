import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { db } from "@vercel/postgres";

const sqs = new SQSClient();
const ecs = new ECSClient();

const queueUrl = process.env.SQS_QUEUE_URL;
const clusterArn = process.env.CLUSTER_ARN;

let client;

const initDb = async () => {
	if (!client) {
		client = await db.connect();
	}
};

const updateTaskStatus = async (taskId, status) => {
	try {
		await client.sql`UPDATE "Task" SET "status" = ${status}, "lastUpdated" = NOW() WHERE id = ${taskId};`;
	} catch (error) {
		console.error(`Failed to update status for task ${taskId}:`, error);
		throw error;
	}
};

const startBuildTaskContainer = async (taskData, receiptHandle) => {
	console.log(`Starting container process for task: ${taskData.TaskId}`);
	console.log(
		`${taskData.RepoUrl} | ${taskData.Branch} | ${taskData.RootDir}`
	);
	console.log(
		`User ID: ${taskData.UserId} | Project ID: ${taskData.ProjectId}`
	);
	console.log(
		`${taskData.Preset} | ${taskData.InstallCommand} | ${taskData.BuildCommand} | ${taskData.OutputDir}`
	);
	console.log(`Build Command: ${taskData.BuildCommand}`);

	// Run ECS EC2 task
	const runTaskParams = {
		cluster: clusterArn,
		taskDefinition: "codehost-build-task",
		launchType: "EC2",
		overrides: {
			containerOverrides: [
				{
					name: "codehost-build-container",
					environment: [
						{ name: "TASK_ID", value: taskData.TaskId },
						{ name: "PROJECT_ID", value: taskData.ProjectId },
						{ name: "REPO_URL", value: taskData.RepoUrl },
						{ name: "BRANCH_NAME", value: taskData.Branch },
						{ name: "ROOT_DIR", value: taskData.RootDir },
						{ name: "PRESET", value: taskData.Preset },
						{
							name: "INSTALL_COMMAND",
							value: taskData.InstallCommand,
						},
						{ name: "BUILD_COMMAND", value: taskData.BuildCommand },
						{ name: "OUTPUT_DIR", value: taskData.OutputDir },
					],
				},
			],
		},
	};

	try {
		const runTaskResponse = await ecs.send(
			new RunTaskCommand(runTaskParams)
		);
		console.log("ECS EC2 task started:", runTaskResponse.tasks[0].taskArn);
	} catch (error) {
		console.error("Error starting ECS EC2 task:", error);

		// Update task status in the database to 'FAILED'
		await updateTaskStatus(taskData.TaskId, "FAILED");

		// Delete the message from the queue
		const deleteParams = {
			QueueUrl: queueUrl,
			ReceiptHandle: receiptHandle,
		};

		try {
			await sqs.send(new DeleteMessageCommand(deleteParams));
			console.log("Message processed and deleted.");
		} catch (deleteError) {
			console.error("Error deleting message:", deleteError);
		}

		throw error;
	}
};

export const handler = async (event) => {
	await initDb();

	for (const record of event.Records) {
		const messageAttributes = record.messageAttributes;
		const taskData = {
			TaskId: messageAttributes.TaskId.stringValue,
			ProjectId: messageAttributes.ProjectId.stringValue,
			UserId: messageAttributes.UserId.stringValue,
			RepoUrl: messageAttributes.RepoUrl.stringValue,
			Branch: messageAttributes.Branch.stringValue,
			RootDir: messageAttributes.RootDir.stringValue,
			Preset: messageAttributes.Preset.stringValue,
			InstallCommand: messageAttributes.InstallCommand.stringValue,
			BuildCommand: messageAttributes.BuildCommand.stringValue,
			OutputDir: messageAttributes.OutputDir.stringValue,
		};

		// Update task status to 'STARTING'
		await updateTaskStatus(taskData.TaskId, "STARTING");

		// Start the ECS task
		await startBuildTaskContainer(taskData, record.receiptHandle);
	}

	return {
		statusCode: 200,
		body: JSON.stringify("Function executed successfully"),
	};
};
