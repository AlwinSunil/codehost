"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

import { fetchTaskDetailsAndLogs } from "./actions/fetchTaskDetailsAndLogs";
import { useProject } from "../Context/ProjectContext";

const statusClasses = {
  IN_QUEUE: "border-yellow-400 bg-yellow-100 text-yellow-700",
  STARTING: "border-blue-400 bg-blue-100 text-blue-700",
  BUILDING: "border-purple-400 bg-purple-100 text-purple-700",
  COMPLETED: "border-green-400 bg-green-100 text-green-700",
  DEPLOYED: "border-teal-400 bg-teal-100 text-teal-700",
  FAILED: "border-red-400 bg-red-100 text-red-700",
};

export default function Task(props) {
  const params = use(props.params);
  const { project, error } = useProject();

  const logsRef = useRef(null);

  const [data, setData] = useState({
    logs: [],
    status: "PENDING",
    error: null,
    lastFetchedTime: null,
    taskDetails: null,
    taskDuration: null,
  });
  const [isFetching, setIsFetching] = useState(true);

  const fetch = useCallback(async () => {
    if (data.status === "COMPLETED" || data.status === "FAILED") {
      return;
    }

    try {
      setIsFetching(true);

      // Pass the last log time to the server action to get only new logs
      const response = await fetchTaskDetailsAndLogs(
        params.taskId,
        data.lastFetchedTime,
      );

      if (response.success) {
        setData((prevData) => {
          const startTime = new Date(response.task.startedAt);
          const endTime = new Date(response.task.lastUpdated);
          const duration = Math.floor((endTime - startTime) / 1000);

          return {
            ...prevData,
            taskDetails: response.task,
            // Append new logs to the existing logs
            logs: [...prevData.logs, ...response.logs],
            status: response.task.status,
            lastFetchedTime:
              response.logs.length > 0
                ? response.logs[response.logs.length - 1].loggedAt // Update last fetched time
                : prevData.lastFetchedTime,
            taskDuration: duration,
          };
        });
      }
    } catch (err) {
      console.error(err);
      setData((prevData) => ({
        ...prevData,
        error: "Failed to fetch task details and logs",
      }));
    } finally {
      setIsFetching(false);
    }
  }, [params.taskId, data.status, data.lastFetchedTime]);

  useEffect(() => {
    fetch();

    const intervalId = setInterval(() => {
      if (data.status !== "COMPLETED" && data.status !== "FAILED") {
        fetch();
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, [fetch, data.status]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [data.logs]);

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!error && !project) {
    return <div className="py-3 text-lg font-semibold">Loading...</div>;
  }

  return (
    <div>
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
        {data.taskDetails ? (
          <div className="flex flex-col gap-4 border p-5 pt-4">
            <div className="grid grid-cols-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <span className="font-sans text-sm text-gray-600">Source</span>
                <a
                  href={`${project.repoLink}/commit/${data.taskDetails.commitHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex w-fit items-center gap-4 text-sm"
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium text-black group-hover:underline">
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
                    {data.taskDetails.commitHash.slice(0, 7)}
                  </p>
                  <p className="w-72 truncate text-xs text-gray-700">
                    {data.taskDetails.commitMessage}
                  </p>
                </a>
              </div>
              <p className="col-span-1 row-span-1 flex flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Created at</span>
                <span className="font-medium tracking-tight">
                  {new Date(data.taskDetails.startedAt).toLocaleString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                    },
                  )}
                </span>
              </p>
            </div>
            <div className="flex">
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Status</span>
                <span
                  className={clsx(
                    "w-fit rounded-sm border px-2 text-sm font-semibold tracking-tight shadow-inner",
                    statusClasses[data.taskDetails.status] ||
                      "border-gray-200 bg-gray-50 text-gray-500",
                  )}
                >
                  {data.taskDetails.status}
                </span>
              </p>
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(data.taskDetails.lastUpdated), {
                    addSuffix: true,
                  })}
                </span>
              </p>
              <p className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-sans text-gray-600">Duration</span>
                <span className="font-medium tracking-normal">
                  {data.taskDuration
                    ? formatDuration(data.taskDuration)
                    : "--m --s"}
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

        {isFetching && (
          <p className="text-sm font-medium text-gray-600">Fetching logs...</p>
        )}

        {!data.error && data.logs.length > 0 && (
          <div
            ref={logsRef}
            className="h-96 overflow-y-scroll border bg-gray-50 px-4 py-2"
          >
            {data.logs.map((log, index) => (
              <div
                key={index}
                className="flex gap-2 border-b border-gray-300 px-2 py-1.5 last:border-0"
              >
                <span className="w-60 text-xs font-medium">
                  {new Date(log.loggedAt).toLocaleString()}
                </span>
                <span className="text-xs text-gray-600">{log.log}</span>
              </div>
            ))}
          </div>
        )}

        {!data.error && !isFetching && data.logs.length === 0 && (
          <p className="text-sm text-gray-600">No logs available.</p>
        )}

        {data.error && (
          <p className="text-sm font-medium text-red-500">{data.error}</p>
        )}
      </div>
    </div>
  );
}
