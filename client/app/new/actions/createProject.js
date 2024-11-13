"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { octokit } from "@/lib/octokit";
import { prisma } from "@/lib/prisma";
import { addJobToBuildQueue } from "@/helpers/addJobToBuildQueue";

const presets = {
  VITEJS: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "dist",
  },
  CRA: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "build",
  },
};

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

export async function createProject(
  repoUrl,
  branch,
  rootDir,
  projectPreset,
  projectConfig,
  envs,
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user.id;
    const [, , , owner, repo] = repoUrl.split("/");

    let latestCommit;
    try {
      latestCommit = await getLatestCommit(owner, repo, branch);
    } catch (error) {
      console.error("Error getting latest commit:", error);
      return { success: false, error: "Invalid repository or branch" };
    }

    const subdomain = generateSubdomain(repo);
    const avatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${Math.random()}`;

    const installCommand = projectConfig.installCommand.allowOverride
      ? projectConfig.installCommand.value
      : presets[projectPreset]?.installCommand;

    const buildCommand = projectConfig.buildCommand.allowOverride
      ? projectConfig.buildCommand.value
      : presets[projectPreset]?.buildCommand;

    const outputDir = projectConfig.outputDir.allowOverride
      ? projectConfig.outputDir.value
      : presets[projectPreset]?.outputDir;

    if (!installCommand || !buildCommand || !outputDir) {
      throw new Error("Missing required commands for project setup.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    if (user.ongoingJobId) {
      const ongoingJob = await prisma.ongoingJob.findUnique({
        where: { id: user.ongoingJobId },
      });
      return {
        success: false,
        ongoingJobProjectId: ongoingJob.projectId,
        error:
          "You already have an ongoing build job. Please wait for it to finish.",
      };
    }

    return await prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          name: repo,
          repoLink: repoUrl,
          branch,
          status: "ACTIVE",
          userId,
          subdomain,
          avatar,
          rootDir,
          preset: projectPreset,
          installCommand,
          buildCommand,
          outputDir: outputDir,
          EnvironmentVariables: {
            create: envs.map(({ key, value }) => ({
              key,
              value,
            })),
          },
        },
      });

      const task = await prisma.task.create({
        data: {
          status: "IN_QUEUE",
          commitHash: latestCommit.sha,
          commitMessage: latestCommit.commit.message,
          userId,
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
        where: { id: userId },
        data: { ongoingJobId: ongoingJob.id },
      });

      await addJobToBuildQueue(
        task.id,
        project.id,
        userId,
        repoUrl,
        branch,
        rootDir,
        projectPreset,
        installCommand,
        buildCommand,
        outputDir,
      );

      return { success: true, id: project.id };
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: error.message };
  }
}
