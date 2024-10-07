import { SQSClient, ChangeMessageVisibilityCommand } from "@aws-sdk/client-sqs";
import {
	ECSClient,
	RunTaskCommand,
	DescribeClustersCommand,
	ListTasksCommand,
} from "@aws-sdk/client-ecs";
import { db } from "@vercel/postgres";

const sqs = new SQSClient();
const ecs = new ECSClient();

const queueUrl = process.env.SQS_QUEUE_URL;
const clusterArn = process.env.CLUSTER_ARN;
const MAX_RUNNING_TASKS = process.env.MAX_RUNNING_TASKS || 2;

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

const changeMessageVisibility = async (receiptHandle, visibilityTimeout) => {
	const params = {
		QueueUrl: queueUrl,
		ReceiptHandle: receiptHandle,
		VisibilityTimeout: visibilityTimeout,
	};

	try {
		await sqs.send(new ChangeMessageVisibilityCommand(params));
		console.log(
			`Changed message visibility to ${visibilityTimeout} seconds`
		);
	} catch (error) {
		console.error("Error changing message visibility:", error);
		throw error;
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

const getRunningTasksCount = async () => {
	try {
		const listTasksParams = {
			cluster: clusterArn,
			desiredStatus: "RUNNING",
		};
		const listTasksResponse = await ecs.send(
			new ListTasksCommand(listTasksParams)
		);
		return listTasksResponse.taskArns.length;
	} catch (error) {
		console.error("Error getting running tasks count:", error);
		throw error;
	}
};

const startBuildTaskContainer = async (taskData) => {
	console.log(
		`Attempting to start container process for task: ${taskData.TaskId}`
	);
	console.log(`Repository URL: ${taskData.RepoUrl}`);
	console.log(`Preset: ${taskData.Preset}`);

	const ec2Available = await isEc2Available();
	if (!ec2Available) {
		throw new Error(
			`NO_CONTAINER: No EC2 instances available for task ${taskData.TaskId}.`
		);
	}

	const runningTasksCount = await getRunningTasksCount();
	if (runningTasksCount >= MAX_RUNNING_TASKS) {
		await updateTaskStatus(taskData.TaskId, "IN_QUEUE");
		throw new Error(
			`MAX_TASKS_REACHED: Maximum number of running tasks (${MAX_RUNNING_TASKS}) reached for task ${taskData.TaskId}.`
		);
	}

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
		await updateTaskStatus(taskData.TaskId, "STARTING");
		const runTaskResponse = await ecs.send(
			new RunTaskCommand(runTaskParams)
		);
		console.log("ECS EC2 task started:", runTaskResponse);
		return { status: "SUCCESS", taskId: taskData.TaskId };
	} catch (error) {
		console.error("Error starting ECS EC2 task:", error);
		await updateTaskStatus(taskData.TaskId, "FAILED");
		await removeOngoingJobByTaskId(taskData.TaskId);
		return { status: "FAILED", taskId: taskData.TaskId };
	}
};

export const handler = async (event) => {
	await initDb();

	try {
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

			try {
				const result = await startBuildTaskContainer(taskData);
				if (result.status === "FAILED") {
					console.log(
						`Task ${result.taskId} failed to start. Status set to FAILED.`
					);
				}
			} catch (error) {
				if (
					error.message.startsWith("NO_CONTAINER") ||
					error.message.startsWith("MAX_TASKS_REACHED")
				) {
					console.error(
						"No container or max tasks reached:",
						error.message
					);

					// Change visibility to 10 seconds
					await changeMessageVisibility(record.receiptHandle, 10);

					// Throw error to exit Lambda early after setting visibility
					throw new Error(error.message);
				} else {
					console.error("Error processing task:", error);
				}
			}
		}

		console.log("All tasks processed");
		return {
			statusCode: 200,
			body: JSON.stringify("Function executed successfully"),
		};
	} catch (error) {
		console.error("Error in Lambda handler:", error);
		throw error;
	} finally {
		if (client) {
			await client.release();
			client = null;
		}
	}
};
