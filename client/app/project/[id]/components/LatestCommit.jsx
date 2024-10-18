"use client";

import { useState } from "react";

import { toast } from "sonner";

import deployLatestCommit from "../actions/deployLatestCommit";
import getLatestCommit from "../actions/getLatestCommit";
import { useTaskRefetch } from "../Context/TaskRefetchContext";

export default function LatestCommit({ project }) {
  const { refetchTasks } = useTaskRefetch();

  const [latestCommit, setLatestCommit] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetLatestCommits = async () => {
    setLoading(true);
    try {
      const response = await getLatestCommit(
        project.id,
        project.repoLink,
        project.branch,
      );

      if (response.success) {
        if (response.newCommits) {
          setLatestCommit({
            hash: response.commitHash,
            message: response.commitMessage,
          });
          toast.success("New commit found!", { duration: 2000 });
        } else {
          toast.info(response.message, { duration: 2000 });
        }
      } else {
        toast.error(response.message || "Failed to fetch commits", {
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error("Error fetching commits", { duration: 2000 });
    } finally {
      setLoading(false);
      refetchTasks();
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    try {
      const response = await deployLatestCommit(
        project.id,
        project.repoLink,
        project.branch,
      );

      if (response.success) {
        toast.success("Deployment started successfully", { duration: 2000 });
        refetchTasks();
        setLatestCommit(null);
      } else {
        toast.error(response.message || "Failed to start deployment", {
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error("Error starting deployment", { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 border-l pl-4">
      {project.status === "PAUSED" ? (
        <p className="italic">
          Activate project in settings to make url accessable and for new
          deployments
        </p>
      ) : (
        <>
          {latestCommit ? (
            <>
              <div className="flex items-center gap-6">
                <span>Latest Commit: </span>
                <a
                  href={`${project.repoLink}/commit/${latestCommit.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-80 items-center gap-4 hover:underline"
                >
                  <p className="flex items-center gap-1 text-xs text-black group-hover:underline">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-black"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <line x1="3" x2="9" y1="12" y2="12" />
                      <line x1="15" x2="21" y1="12" y2="12" />
                    </svg>
                    {latestCommit.hash.substring(0, 7)}
                  </p>
                  <p className="w-fit truncate font-mono text-xs text-gray-700">
                    {latestCommit.message}
                  </p>
                </a>
              </div>
              <button
                className="bg-black px-2 py-1 text-white"
                onClick={handleDeploy}
                disabled={loading}
              >
                Deploy change
              </button>
              <button
                className="h-max border border-gray-400 p-1 hover:border-gray-500 hover:bg-gray-50 disabled:opacity-50"
                onClick={handleGetLatestCommits}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </button>
              <span className="font-normal">
                *Deploys the latest commit; not updated in real-time.
              </span>
            </>
          ) : (
            <>
              <p>Got new commits? Check for new commits and deploy</p>
              <button
                className="bg-black px-2 py-1 text-white disabled:bg-gray-500"
                onClick={handleGetLatestCommits}
                disabled={loading}
              >
                {loading ? "Loading..." : "Get latest commit"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
