const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const { sqsClient } = require("@/lib/aws");

const queueUrl = process.env.AWS_BUILD_SQS_URL;

export async function addJobToBuildQueue(
  taskId,
  projectId,
  userId,
  repoUrl,
  branch,
  rootDir,
  preset,
  installCommand,
  buildCommand,
  outputDir,
) {
  try {
    // Prepare the message to be sent to the queue
    const message = {
      taskId,
      projectId,
      userId,
      repoUrl,
      branch,
      rootDir,
      preset,
      installCommand,
      buildCommand,
      outputDir,
    };

    console.log("Message:", message);

    // Create the SendMessageCommand
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        TaskId: {
          DataType: "String",
          StringValue: taskId,
        },
        ProjectId: {
          DataType: "String",
          StringValue: projectId,
        },
        UserId: {
          DataType: "String",
          StringValue: userId,
        },
        RepoUrl: {
          DataType: "String",
          StringValue: repoUrl,
        },
        Branch: {
          DataType: "String",
          StringValue: branch,
        },
        RootDir: {
          DataType: "String",
          StringValue: rootDir,
        },
        Preset: {
          DataType: "String",
          StringValue: preset,
        },
        InstallCommand: {
          DataType: "String",
          StringValue: installCommand,
        },
        BuildCommand: {
          DataType: "String",
          StringValue: buildCommand,
        },
        OutputDir: {
          DataType: "String",
          StringValue: outputDir,
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
