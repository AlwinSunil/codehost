import { octokit } from "@/lib/octokit";

const getGithubRepoAndBranch = async (repoUrl) => {
  const [, , , owner, repo] = repoUrl.split("/");

  await octokit.repos.get({ owner, repo });

  // Get all branches
  const { data: branches } = await octokit.repos.listBranches({
    owner,
    repo,
  });

  return {
    repo,
    branches,
  };
};

export default getGithubRepoAndBranch;
