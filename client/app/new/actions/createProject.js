"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";
import { prisma, authConfig } from "@/lib/auth";
import { octokit } from "@/lib/octokit";
import { addJobToBuildQueue } from "./helpers/addJobToBuildQueue";

const generateSubdomain = (repo) => {
  const randomLetters = crypto
    .randomBytes(5)
    .toString("base64")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 5)
    .toLowerCase();

  return `${repo}-${randomLetters}`;
};

const getLatestCommit = async (owner, repo, branch) => {
  const { data: commit } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: branch,
  });

  return commit;
};

export async function createProject(prevState, formData) {
  const repoUrl = formData.get("repoUrl");
  const branch = formData.get("branch");

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
      const ongoingJob = await prisma.ongoingJob.findUnique({
        where: {
          id: user.ongoingJobId,
        },
      });

      return {
        sucess: false,
        ongoingJobProjectId: ongoingJob.projectId,
        error:
          "You already have an ongoing build job. Please wait for it to finish.",
      };
    }

    const subdomain = generateSubdomain(repo);

    // Generate a random avatar
    const avatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${Math.random()}`;

    const project = await prisma.project.create({
      data: {
        name: repo,
        repoLink: repoUrl,
        branch: branch,
        status: "ACTIVE",
        userId: userId,
        subdomain: subdomain,
        avatar: avatar,
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
