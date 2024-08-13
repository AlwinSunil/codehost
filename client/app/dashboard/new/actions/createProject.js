"use server";

import { getServerSession } from "next-auth";

import { prisma, authConfig } from "@/lib/auth";

import { verifyRepoAccess } from "./helpers/verifyRepoAccess";
import { addJobToBuildQueue } from "./helpers/addJobToBuildQueue";

import { octokit } from "@/lib/octokit";

const getLatestCommit = async (owner, repo, branch) => {
  const { data: commit } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: branch,
  });

  return commit;
};

export async function createProject(repoUrl, branch) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user) {
      return { sucess: false, error: "User not authenticated" };
    }

    const userId = session.user.id;
    const [, , , owner, repo] = repoUrl.split("/");

    let latestCommit;

    try {
      latestCommit = await getLatestCommit(owner, repo, branch);
    } catch (error) {
      console.error("Error getting latest commit:", error);
      return { sucess: false, error: "Invalid repository or branch" };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user.ongoingJobId) {
      return {
        sucess: false,
        error: "You already have an ongoing job. Please wait for it to finish.",
      };
    }

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
        commitHash: latestCommit.sha,
        commitMessage: latestCommit.commit.message,
        userId: userId,
        projectId: project.id,
        completedAt: null,
      },
    });

    // Add the job to the AWS queue
    await addJobToBuildQueue(task.id, repoUrl, branch, userId);

    const ongoingJob = await prisma.ongoingJob.create({
      data: {
        taskId: task.id,
        projectId: project.id,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ongoingJobId: ongoingJob.id,
      },
    });

    return { sucess: true, id: project.id };
  } catch (error) {
    console.error("Error adding job to queue:", error);
    return { sucess: false, error: error.message };
  }
}
