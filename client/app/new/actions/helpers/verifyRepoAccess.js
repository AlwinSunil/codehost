import getGithubRepoAndBranch from "./getGithubRepoAndBranch";

export async function verifyRepoAccess(repoUrl, givenBranch) {
  try {
    const { branches } = await getGithubRepoAndBranch(repoUrl);

    console.log("branches", branches);

    if (!branches.find((branch) => branch.name === givenBranch)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying repository access:", error);
    return false;
  }
}
