"use server";

import { octokit } from "@/lib/octokit";
import { prisma } from "@/lib/prisma";

export default async function getLatestCommit(id, repo, branch) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return {
        success: false,
        newCommits: false,
        message: "Project not found",
      };
    }

    const latestTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: [{ startedAt: "desc" }, { lastUpdated: "desc" }],
    });

    if (!latestTask) {
      return { success: false, newCommits: false, message: "No tasks found" };
    }

    const { data: latestCommit } = await octokit.repos.getCommit({
      owner: repo.split("/")[3],
      repo: repo.split("/")[4],
      ref: branch,
    });

    const latestCommitHash = latestCommit.sha;
    const latestCommitMessage = latestCommit.commit.message;

    const newCommits = latestCommitHash !== latestTask.commitHash;

    return {
      success: true,
      newCommits,
      commitHash: latestCommitHash,
      commitMessage: latestCommitMessage,
      message: newCommits
        ? "New commits found"
        : `No new commits for ${repo.split("/")[3]}/${repo.split("/")[4]} from branch ${branch}`,
    };
  } catch (error) {
    console.error("Error fetching commits:", error);
    return {
      success: false,
      newCommits: false,
      message: "Error: " + error.message,
    };
  }
}
