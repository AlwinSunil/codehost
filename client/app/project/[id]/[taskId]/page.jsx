"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

import { fetchTaskDetails as fetchTaskDetailsAction } from "./actions/fetchTaskDetails";
import { fetchTaskLogs } from "./actions/fetchTaskLogs";
import { useProject } from "../Context/ProjectContext";

const statusClasses = {
  ON_QUEUE: "border-yellow-400 bg-yellow-100 text-yellow-700",
  STARTING: "border-blue-400 bg-blue-100 text-blue-700",
  BUILDING: "border-purple-400 bg-purple-100 text-purple-700",
  COMPLETED: "border-green-400 bg-green-100 text-green-700",
  DEPLOYED: "border-teal-400 bg-teal-100 text-teal-700",
  FAILED: "border-red-400 bg-red-100 text-red-700",
};

export default function Task({ params }) {
  const router = useRouter();
  const project = useProject();

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [error, setError] = useState(null);
  const [lastFetchedTime, setLastFetchedTime] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);

  const fetchLogs = async (taskId, lastLogTime) => {
    if (!taskDetails) return; // Only fetch logs if taskDetails are available

    try {
      setIsFetching(true);
      const data = await fetchTaskLogs(taskId, lastLogTime);
      const { logs: newLogs, status: taskStatus } = data;

      if (data.success) {
        if (newLogs.length > 0) {
          setLogs((prevLogs) => [...prevLogs, ...newLogs]);
          setLastFetchedTime(newLogs[newLogs.length - 1].loggedAt); // Update last fetched time
        }
        setStatus(taskStatus);
      } else {
        setError(data.error);
      }
      setIsFetching(false);
    } catch (err) {
      setError(err.message);
      setIsFetching(false);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await fetchTaskDetailsAction(taskId);

      if (response && response.success) {
        console.log("Fetched task details successfully:", response.task);
        setTaskDetails(response.task);
        setError(null);
      } else {
        console.error("Error fetching task details:", response?.error);
        setError(response?.error || "Task details not found.");
        if (response?.error === "Task not found") {
          router.push("/not-found");
        }
      }
    } catch (err) {
      console.error("An error occurred:", err);
      setError("Failed to fetch task details.");
    }
  };

  useEffect(() => {
    fetchTaskDetails(params.taskId);
  }, [params.taskId]);

  useEffect(() => {
    if (taskDetails) {
      fetchLogs(params.taskId, null); // Fetch logs once taskDetails are available
    }
  }, [taskDetails, params.taskId]);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") {
      return; // Stop polling if the task is completed or failed
    }

    // Poll every 3500 milliseconds for updates
    const intervalId = setInterval(() => {
      if (!isFetching && taskDetails) {
        fetchLogs(params.taskId, lastFetchedTime); // Pass the last fetched log time
      }
    }, 3500);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [params.taskId, status, lastFetchedTime, isFetching, taskDetails]);

  return (
    <div className="">
      <hr className="mb-2.5 border-gray-200" />
      <div className="mb-2.5">
        <div className="flex items-center gap-3 divide-x">
          <Link
            href={`/project/${params.id}/`}
            className="ml-2 flex items-center gap-0.5 bg-black px-2 py-1 pr-2.5 text-xs font-medium text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 15h-6v4l-7-7 7-7v4h6v6z" />
            </svg>
            Back
          </Link>
          <div className="pl-2.5 text-base">
            <span className="mr-4 font-semibold">Deployment task</span>
            <span className="text-sm text-gray-600">#{params.taskId}</span>
          </div>
        </div>
      </div>

      <hr className="mb-4 border-gray-200" />

      {/* Task Details */}
      <div className="mb-4">
        <h2 className="mb-2.5 text-lg font-semibold">Task details</h2>
        {taskDetails ? (
          <div className="flex flex-col gap-4 border p-5 pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-sm text-gray-600">Source</span>
              <a
                href={`${project.repoLink}/commit/${taskDetails.commitHash}`}
                target="_blank"
                rel="noreferrer"
                className="group flex w-fit items-center gap-4 text-sm"
              >
                <p className="flex items-center gap-1.5 text-black group-hover:underline">
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
                  {taskDetails.commitHash.slice(0, 7)}
                </p>
                <p className="w-72 truncate text-xs text-gray-700">
                  {taskDetails.commitMessage}
                </p>
              </a>
            </div>

            <div className="flex">
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Status</span>
                <span
                  className={clsx(
                    "w-fit rounded-sm border px-2 text-sm font-semibold tracking-tight shadow-inner",
                    statusClasses[taskDetails.status] ||
                      "border-gray-200 bg-gray-50 text-gray-500",
                  )}
                >
                  {taskDetails.status}
                </span>
              </p>
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(taskDetails.lastUpdated), {
                    addSuffix: true,
                  })}
                </span>
              </p>
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Started at</span>
                <span className="font-medium tracking-tight">
                  {new Date(taskDetails.startedAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    second: "numeric",
                  })}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="border p-5 text-sm text-gray-600">
            Loading task details...
          </p>
        )}
      </div>

      {/* Task Logs */}
      <div className="border p-4">
        <h2 className="mb-2.5 text-lg font-semibold">Deployment task logs</h2>

        {isFetching ? (
          <p className="text-sm font-medium text-gray-600">Fetching logs...</p>
        ) : !error && logs.length > 0 ? (
          <div className="h-96 overflow-y-scroll border bg-gray-50 px-4 py-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex gap-2 border-b border-gray-300 px-2 py-1.5 last:border-0"
              >
                <span className="w-60 text-xs font-medium">
                  {new Date(log.loggedAt).toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">{log.message}</span>
              </div>
            ))}
          </div>
        ) : null}

        {!error && !isFetching && logs.length === 0 && (
          <p className="text-sm text-gray-600">No logs available.</p>
        )}

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>
    </div>
  );
}
