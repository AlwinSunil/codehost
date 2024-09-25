"use server";

import { addJobToBuildQueue } from "@/helpers/addJobToBuildQueue";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import getLatestCommit from "./getLatestCommit";

export default async function deployLatestCommit(id, repo, branch) {
  try {
    const latestCommit = await getLatestCommit(id, repo, branch);

    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user.id;

    if (!latestCommit.newCommits) {
      return { success: false, message: "No new commits to deploy" };
    }

    return await prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id, userId },
      });

      if (!project) {
        return { success: false, message: "Project not found" };
      }

      if (project.status === "PAUSED") {
        return {
          success: false,
          message: "Project is paused, therefore cannot be deployed",
        };
      }

      const task = await prisma.task.create({
        data: {
          status: "ON_QUEUE",
          commitHash: latestCommit.commitHash,
          commitMessage: latestCommit.commitMessage,
          userId: project.userId,
          projectId: project.id,
          completedAt: null,
        },
      });

      const ongoingJob = await prisma.ongoingJob.create({
        data: {
          taskId: task.id,
          projectId: project.id,
        },
      });

      await prisma.user.update({
        where: { id: project.userId },
        data: { ongoingJobId: ongoingJob.id },
      });

      await addJobToBuildQueue(
        task.id,
        project.id,
        project.userId,
        project.repoLink,
        branch,
        project.rootDir,
        project.preset,
        project.installCommand,
        project.buildCommand,
        project.outputDir,
      );

      return { success: true, message: "Task started successfully" };
    });
  } catch (error) {
    console.error("Error starting deployment:", error);
    return { success: false, message: error.message };
  }
}
