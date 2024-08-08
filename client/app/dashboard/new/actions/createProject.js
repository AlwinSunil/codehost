"use server";

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { prisma } from "@/lib/auth";
import { getServerSession } from "next-auth";

const sqsClient = new SQSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

import { authConfig } from "@/lib/auth";

const queueUrl = process.env.AWS_BUILD_SQS_URL;

export async function createProject(repoUrl, branch, userId) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    // Create a new task in the database
    const task = await prisma.task.create({
      data: {
        repoLink: repoUrl,
        branch: branch,
        status: "ON_QUEUE",
        userId: userId,
        startedAt: null,
        completedAt: null,
      },
    });

    // Add the job to the AWS queue
    const queueResponse = await addJobToAWSQueue(
      task.id,
      repoUrl,
      branch,
      userId,
    );

    // Return the task details
    return {
      id: task.id,
      status: task.status,
      repoLink: task.repoLink,
      branch: task.branch,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    };
  } catch (error) {
    console.error("Error adding job to queue:", error);
    throw error;
  }
}

async function addJobToAWSQueue(taskId, repoUrl, branch, userId) {
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
