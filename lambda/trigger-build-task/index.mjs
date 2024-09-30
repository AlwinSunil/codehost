import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import {
	ECSClient,
	RunTaskCommand,
	DescribeClustersCommand,
} from "@aws-sdk/client-ecs";
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
		const currentTimestamp = new Date().toISOString();
		await client.sql`UPDATE "Task" SET "status" = ${status}, "lastUpdated" = ${currentTimestamp} WHERE id = ${taskId};`;
	} catch (error) {
		console.error(`Failed to update status for task ${taskId}:`, error);
		throw error;
	}
};

const removeOngoingJobByTaskId = async (taskId) => {
	try {
		const ongoingJobQuery =
			await client.sql`SELECT * FROM "OngoingJob" WHERE "taskId" = ${taskId} FOR UPDATE;`;

		if (ongoingJobQuery.rowCount === 0) {
			console.log(`No ongoing job found for task ID: ${taskId}`);
			return;
		}

		const ongoingJobId = ongoingJobQuery.rows[0].id;

		await client.sql`DELETE FROM "OngoingJob" WHERE "id" = ${ongoingJobId};`;

		console.log(
			`Removed ongoing job with ID: ${ongoingJobId} for task ID: ${taskId}`
		);
	} catch (error) {
		console.error("Error removing ongoing job:", error);
	}
};

const isEc2Available = async () => {
	try {
		const describeClustersParams = {
			clusters: [clusterArn],
			include: ["STATISTICS"],
		};
		const describeClustersResponse = await ecs.send(
			new DescribeClustersCommand(describeClustersParams)
		);
		const cluster = describeClustersResponse.clusters[0];

		const ec2InstanceCount = cluster.registeredContainerInstancesCount;
		console.log(`Available EC2 instances: ${ec2InstanceCount}`);

		return ec2InstanceCount > 0;
	} catch (error) {
		console.error("Error describing ECS cluster:", error);
		return false;
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

	const ec2Available = await isEc2Available();
	if (!ec2Available) {
		console.log(
			"No EC2 instances are available. Keeping message in the queue for retry."
		);
		return;
	}

	// Run ECS EC2 task
	const runTaskParams = {
		cluster: clusterArn,
		taskDefinition: "CodeHost-build-task",
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
		// Update task status to 'STARTING'
		await updateTaskStatus(taskData.TaskId, "STARTING");

		const runTaskResponse = await ecs.send(
			new RunTaskCommand(runTaskParams)
		);
		console.log("ECS EC2 task started:", runTaskResponse.tasks[0].taskArn);

		const deleteParams = {
			QueueUrl: queueUrl,
			ReceiptHandle: receiptHandle,
		};

		await sqs.send(new DeleteMessageCommand(deleteParams));
		console.log("Message processed and deleted.");
	} catch (error) {
		console.error("Error starting ECS EC2 task:", error);

		await updateTaskStatus(taskData.TaskId, "FAILED");
		await removeOngoingJobByTaskId(taskData.TaskId);

		console.log("Message will remain in the queue for retries.");
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

		// Start the ECS task
		await startBuildTaskContainer(taskData, record.receiptHandle);
	}

	if (client) {
		await client.release();
		client = null;
	}

	return {
		statusCode: 200,
		body: JSON.stringify("Function executed successfully"),
	};
};
