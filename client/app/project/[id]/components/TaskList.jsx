"use client";

import { useState } from "react";
import { fetchTasks } from "../actions/fetchTasks";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

const statusClasses = {
  ON_QUEUE: "border-gray-200 bg-gray-50 text-gray-900 shadow-gray-100",
  STARTING: "border-blue-200 bg-blue-50 text-blue-600 shadow-blue-100",
  BUILDING: "border-yellow-200 bg-yellow-50 text-yellow-600 shadow-yellow-100",
  COMPLETED: "border-green-200 bg-green-50 text-green-600 shadow-green-100",
  DEPLOYED: "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-indigo-100",
  FAILED: "border-red-200 bg-red-50 text-red-600 shadow-red-100",
};

function TaskItem({ task }) {
  return (
    <div className="flex flex-row items-center gap-4 border-b px-8 py-4 last:border-b-0">
      <p className="w-52 overflow-hidden text-sm font-medium">
        {task.id.slice(0, 10)}
      </p>
      <div className="w-36">
        <p
          className={clsx(
            "w-fit rounded-sm border px-2 text-sm font-semibold tracking-tight shadow-inner",
            statusClasses[task.status] ||
              "border-gray-200 bg-gray-50 text-gray-500",
          )}
        >
          {task.status}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-gray-500"
          >
            <line x1="6" x2="6" y1="3" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
          {task.branch}
        </p>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 font-mono">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-gray-500"
            >
              <circle cx="12" cy="12" r="3" />
              <line x1="3" x2="9" y1="12" y2="12" />
              <line x1="15" x2="21" y1="12" y2="12" />
            </svg>
            <span>{task.commitHash.slice(0, 7)}</span>
          </div>
          <p className="w-72 truncate text-xs text-gray-700">
            {task.commitMessage}
          </p>
        </div>
      </div>
      <p className="ml-auto w-fit text-xs text-gray-600">
        {formatDistanceToNow(new Date(task.lastUpdated), { addSuffix: true })}
      </p>
    </div>
  );
}

export default function TaskList({ projectId, currentUserId, initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [hasMore, setHasMore] = useState(false);

  const loadMoreTasks = async () => {
    try {
      const fetchedTasks = await fetchTasks(
        projectId,
        tasks.length,
        10,
        currentUserId,
      );
      setTasks((prevTasks) => [...prevTasks, ...fetchedTasks]);
      setHasMore(fetchedTasks.length > 0);
    } catch (error) {
      console.error("Error loading more tasks:", error);
    }
  };

  return (
    <div className="mt-7">
      <h2 className="mb-4 text-lg font-semibold">Deployment tasks</h2>

      <div className="flex flex-col border">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={loadMoreTasks}
          disabled={loading}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
