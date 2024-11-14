import getGithubRepoAndBranch from "./getGithubRepoAndBranch";

export async function verifyRepoAccess(repoUrl, givenBranch) {
  try {
    const { branches } = await getGithubRepoAndBranch(repoUrl);

    if (!branches.find((branch) => branch.name === givenBranch)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying repository access:", error);
    return false;
  }
}
