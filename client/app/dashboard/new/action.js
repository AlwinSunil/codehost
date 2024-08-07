"use server";

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

export async function validateAndFetchBranches(prevState, formData) {
  const repoUrl = formData.get("repoUrl");
  const [, , , owner, repo] = repoUrl.split("/");

  try {
    // Check if the repository exists and is public
    await octokit.repos.get({ owner, repo });

    // Get all branches
    const { data: branches } = await octokit.repos.listBranches({
      owner,
      repo,
    });

    return {
      branches: branches.map((branch) => branch.name),
      error: null,
    };
  } catch (error) {
    if (error.status === 404) {
      return { branches: [], error: "Repository not found or is private" };
    }
    return {
      branches: [],
      error: "An error occurred while fetching repository data",
    };
  }
}
