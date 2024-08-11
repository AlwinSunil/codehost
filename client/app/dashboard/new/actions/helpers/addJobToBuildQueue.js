const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const { sqsClient } = require("@/lib/aws");

const queueUrl = process.env.AWS_BUILD_SQS_URL;

export async function addJobToBuildQueue(taskId, repoUrl, branch, userId) {
  try {
    // Prepare the message to be sent to the queue
    const message = {
      taskId,
      repoUrl,
      branch,
      userId,
    };

    // Create the SendMessageCommand
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        TaskId: {
          DataType: "String",
          StringValue: taskId,
        },
        RepoUrl: {
          DataType: "String",
          StringValue: repoUrl,
        },
        Branch: {
          DataType: "String",
          StringValue: branch,
        },
        UserId: {
          DataType: "String",
          StringValue: userId,
        },
      },
      MessageGroupId: `user-${userId}`,
      MessageDeduplicationId: `${taskId}-${userId}`,
    });

    // Send the message to the SQS queue
    const response = await sqsClient.send(command);

    console.log("Message sent to the queue:", response.MessageId);
    return response;
  } catch (error) {
    console.error("Error adding job to the queue:", error);
    throw error;
  }
}
