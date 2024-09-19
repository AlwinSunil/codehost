import { octokit } from "@/lib/octokit";

const getGithubRepoAndBranch = async (repoUrl) => {
  const [, , , owner, repo] = repoUrl.split("/");

  const details = await octokit.repos.get({ owner, repo });

  // Get all branches
  const { data: branches } = await octokit.repos.listBranches({
    owner,
    repo,
  });

  return {
    repo: details.data.full_name,
    branches,
  };
};

export default getGithubRepoAndBranch;
