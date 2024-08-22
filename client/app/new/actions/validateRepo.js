"use server";

import getGithubRepoAndBranch from "./helpers/getGithubRepoAndBranch";

export async function validateAndFetchBranches(prevState, formData) {
  const repoUrl = formData.get("repoUrl");

  try {
    const { branches } = await getGithubRepoAndBranch(repoUrl);

    console.log(branches);

    return {
      branches: branches.map((branch) => branch.name),
      url: repoUrl,
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
