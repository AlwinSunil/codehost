"use server";

import { addJobToBuildQueue } from "@/helpers/addJobToBuildQueue";

import { prisma } from "@/lib/prisma";

import getLatestCommit from "./getLatestCommit";

export default async function deployLatestCommit(id, repo, branch) {
  try {
    const latestCommit = await getLatestCommit(id, repo, branch);

    if (!latestCommit.newCommits) {
      return { success: false, message: "No new commits to deploy" };
    }

    return await prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        return { success: false, message: "Project not found" };
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
