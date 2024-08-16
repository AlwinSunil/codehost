import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient();
const queueUrl = process.env.SQS_QUEUE_URL;

function startBuildTaskContainer(taskData) {
	console.log(`Starting container process for task: ${taskData.TaskId}`);
	console.log(`Repository URL: ${taskData.RepoUrl}`);
	console.log(`Branch: ${taskData.Branch}`);
	console.log(`User ID: ${taskData.UserId}`);
	console.log("Container process started successfully");
}

export const handler = async (event) => {
	for (const record of event.Records) {
		const messageAttributes = record.messageAttributes;
		const taskData = {
			TaskId: messageAttributes.TaskId.stringValue,
			RepoUrl: messageAttributes.RepoUrl.stringValue,
			Branch: messageAttributes.Branch.stringValue,
			UserId: messageAttributes.UserId.stringValue,
		};

		startBuildTaskContainer(taskData);

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

	return {
		statusCode: 200,
		body: JSON.stringify("Function executed successfully"),
	};
};
