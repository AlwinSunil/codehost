"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

import { fetchLatestTask } from "../actions/fetchLatestTask";
import { useTaskRefetch } from "../Context/TaskRefetchContext";

const statusClasses = {
  IN_QUEUE: "border-yellow-400 bg-yellow-100 text-yellow-700",
  STARTING: "border-blue-400 bg-blue-100 text-blue-700",
  BUILDING: "border-purple-400 bg-purple-100 text-purple-700",
  COMPLETED: "border-green-400 bg-green-100 text-green-700",
  DEPLOYED: "border-teal-400 bg-teal-100 text-teal-700",
  FAILED: "border-red-400 bg-red-100 text-red-700",
};

export default function LatestTask({ projectId }) {
  const { version } = useTaskRefetch();

  const [latestTask, setLatestTask] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let pollingInterval;

    async function getLatestTask() {
      try {
        const response = await fetchLatestTask(projectId);
        if (!response || !response.success) {
          setError(response?.error || "No tasks found for this project.");
          clearInterval(pollingInterval);
        } else {
          setLatestTask(response.task);
          setError(null);
          if (
            response.task.status === "COMPLETED" ||
            response.task.status === "DEPLOYED" ||
            response.task.status === "FAILED"
          ) {
            clearInterval(pollingInterval);
          }
        }
      } catch (err) {
        setError("Failed to fetch the latest task.");
        clearInterval(pollingInterval);
      }
    }

    // Clear the existing polling interval if it exists
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start a new polling interval
    pollingInterval = setInterval(getLatestTask, 2000);

    // Cleanup function to clear the interval when the component unmounts or version changes
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [version, projectId]);

  if (error) {
    return (
      <div className="flex items-center border px-4 py-2">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!latestTask) {
    return <div className="flex items-center border px-4 py-2">Loading...</div>;
  }

  return (
    <div className="flex items-center border">
      <span className="w-fit border-r py-2 pl-4 text-base font-semibold capitalize leading-5 tracking-tight">
        Latest deployment
      </span>
      <Link
        href={`/project/${projectId}/${latestTask.id}`}
        className="group flex w-full items-center justify-between gap-2 px-4 py-6 hover:cursor-pointer hover:bg-gray-50/50 md:px-10"
      >
        <p className="flex items-center gap-1.5 text-sm text-black group-hover:underline">
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
          {latestTask.commitHash.slice(0, 7)}
        </p>
        <p className="w-72 truncate text-xs text-gray-700">
          {latestTask.commitMessage}
        </p>
        <p
          className={clsx(
            "rounded-sm border px-2 text-sm font-semibold tracking-tight shadow-inner",
            statusClasses[latestTask?.status] ||
              "border-gray-200 bg-gray-50 text-gray-500",
          )}
        >
          {latestTask.status}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium tracking-tight text-gray-800">
            {formatDistanceToNow(new Date(latestTask.lastUpdated), {
              addSuffix: true,
            })}
          </span>
          <p className="h-fit truncate rounded-full border bg-white px-2 font-sans text-xs text-gray-600">
            {new Date(latestTask.startedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })}
          </p>
        </div>
      </Link>
    </div>
  );
}
