"use server";

import { getServerSession } from "next-auth";

import { prisma, authConfig } from "@/lib/auth";

import { verifyRepoAccess } from "./helpers/verifyRepoAccess";
import { addJobToBuildQueue } from "./helpers/addJobToBuildQueue";

export async function createProject(repoUrl, branch) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    const isValidRepo = await verifyRepoAccess(repoUrl, branch);

    if (!isValidRepo) {
      throw new Error("Invalid repository or branch");
    }

    const [, , , owner, repo] = repoUrl.split("/");

    // Create a new project in the database
    const project = await prisma.project.create({
      data: {
        name: repo,
        repoLink: repoUrl,
        branch: branch,
        status: "ACTIVE",
        userId: userId,
      },
    });

    // Create a new task in the database
    const task = await prisma.task.create({
      data: {
        status: "ON_QUEUE",
        userId: userId,
        projectId: project.id,
        completedAt: null,
      },
    });

    // Add the job to the AWS queue
    const queueResponse = await addJobToBuildQueue(
      task.id,
      repoUrl,
      branch,
      userId,
    );
  } catch (error) {
    console.error("Error adding job to queue:", error);
    throw error;
  }
}
