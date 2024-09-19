"use server";

import getGithubRepoAndBranch from "./helpers/getGithubRepoAndBranch";

export async function validateAndFetchBranches(repoUrl) {
  try {
    const { repo, branches } = await getGithubRepoAndBranch(repoUrl);

    return {
      branches: branches.map((branch) => branch.name),
      url: repoUrl,
      repo: repo,
      error: null,
      succes: true,
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        branches: [],
        error: "An invalid or prvate repository",
        succes: false,
      };
    }
    return {
      branches: [],
      error: "An error occurred while fetching repository data",
      succes: false,
    };
  }
}
