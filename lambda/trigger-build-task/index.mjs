import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { prisma } from "./lib/prisma.js";

const sqs = new SQSClient();
const ecs = new ECSClient();

const queueUrl = process.env.SQS_QUEUE_URL;
const clusterArn = process.env.CLUSTER_ARN;

const startBuildTaskContainer = async (taskData) => {
	console.log(`Starting container process for task: ${taskData.TaskId}`);
	console.log(`${taskData.RepoUrl} | ${taskData.Branch}`);
	console.log(
		`User ID: ${taskData.UserId} | Project ID: ${taskData.ProjectId}`
	);
	console.log(
		`${taskData.Preset} | ${taskData.InstallCommand} | ${taskData.BuildCommand} | ${taskData.OutputDir}`
	);
	console.log(`Build Command: ${taskData.BuildCommand}`);
	console.log("Container process started successfully");

	// Update task status in the database
	await prisma.task.update({
		where: { id: taskData.TaskId },
		data: { status: "STARTING" },
	});

	// Run ECS EC2 task
	const runTaskParams = {
		cluster: clusterArn,
		taskDefinition: "codehost-build-container", // Replace with your task definition
		launchType: "EC2", // Changed from FARGATE to EC2
		overrides: {
			containerOverrides: [
				{
					name: `${taskData.TaskId}-build`, // Replace with your container name
					environment: [
						{ name: "PROJECT_ID", value: taskData.ProjectId },
						{ name: "REPO_URL", value: taskData.RepoUrl },
						{ name: "BRANCH_NAME", value: taskData.Branch },
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
		networkConfiguration: {
			awsvpcConfiguration: {
				subnets: ["your-subnet-id"], // Replace with your subnet ID
				assignPublicIp: "ENABLED",
			},
		},
	};

	try {
		const runTaskResponse = await ecs.send(
			new RunTaskCommand(runTaskParams)
		);
		console.log("ECS EC2 task started:", runTaskResponse.tasks[0].taskArn);
	} catch (error) {
		console.error("Error starting ECS EC2 task:", error);
		// Update task status to FAILED in the database
		await prisma.task.update({
			where: { id: taskData.TaskId },
			data: { status: "FAILED" },
		});
		throw error;
	}
};

export const handler = async (event) => {
	for (const record of event.Records) {
		const messageAttributes = record.messageAttributes;
		const taskData = {
			TaskId: messageAttributes.TaskId.stringValue,
			ProjectId: messageAttributes.ProjectId.stringValue,
			UserId: messageAttributes.UserId.stringValue,
			RepoUrl: messageAttributes.RepoUrl.stringValue,
			Branch: messageAttributes.Branch.stringValue,
			Preset: messageAttributes.Preset.stringValue,
			InstallCommand: messageAttributes.InstallCommand.stringValue,
			BuildCommand: messageAttributes.BuildCommand.stringValue,
			OutputDir: messageAttributes.OutputDir.stringValue,
		};

		await startBuildTaskContainer(taskData);

		const deleteParams = {
			QueueUrl: queueUrl,
			ReceiptHandle: record.receiptHandle,
		};

		try {
			await sqs.send(new DeleteMessageCommand(deleteParams));
			console.log("Message processed and deleted.");
		} catch (error) {
			console.error("Error deleting message:", error);
		}
	}

	await prisma.$disconnect();

	return {
		statusCode: 200,
		body: JSON.stringify("Function executed successfully"),
	};
};
