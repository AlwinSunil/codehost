"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

import { fetchTasks } from "../actions/fetchTasks";
import { useTaskRefetch } from "../context/TaskRefetchContext";

const statusClasses = {
  ON_QUEUE: "border-gray-200 bg-gray-50 text-gray-900 shadow-gray-100",
  STARTING: "border-blue-200 bg-blue-50 text-blue-600 shadow-blue-100",
  BUILDING: "border-yellow-200 bg-yellow-50 text-yellow-600 shadow-yellow-100",
  COMPLETED: "border-green-200 bg-green-50 text-green-600 shadow-green-100",
  DEPLOYED: "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-indigo-100",
  FAILED: "border-red-200 bg-red-50 text-red-600 shadow-red-100",
};

function TaskItem({ projectId, task }) {
  return (
    <Link
      href={`/project/${projectId}/${task.id}`}
      className="flex flex-row items-center gap-4 border-b px-8 py-5 last:border-b-0"
    >
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
      <p className="ml-auto w-fit text-xs text-gray-600">
        {formatDistanceToNow(new Date(task.lastUpdated), { addSuffix: true })}
      </p>
    </Link>
  );
}

export default function TaskList({ projectId, currentUserId }) {
  const { version } = useTaskRefetch();

  const [tasks, setTasks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchTasksData = async (startIndex, limit) => {
    setLoading(true);
    try {
      const fetchedTasks = await fetchTasks(
        projectId,
        startIndex,
        limit,
        currentUserId,
      );
      return fetchedTasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialTasks = async () => {
      const fetchedTasks = await fetchTasksData(1, 10);
      setTasks(fetchedTasks);
      setHasMore(fetchedTasks.length === 10);
    };

    fetchInitialTasks();
  }, [projectId, version]);

  const loadMoreTasks = async () => {
    if (loading) return;
    const newTasks = await fetchTasksData(tasks.length + 1, 10);
    setTasks((prevTasks) => [...prevTasks, ...newTasks]);
    setHasMore(newTasks.length === 10);
  };

  return (
    <div className="mt-5 flex flex-col">
      <h2 className="mb-2.5 text-lg font-semibold">Other Deployment tasks</h2>
      <div className="flex flex-col border">
        {tasks.length === 0 && !loading ? (
          <div className="flex items-center px-4 py-2">No other tasks</div>
        ) : (
          tasks.map((task) => (
            <TaskItem projectId={projectId} key={task.id} task={task} />
          ))
        )}
        {loading && (
          <div className="flex items-center px-4 py-2">Loading...</div>
        )}
      </div>

      {hasMore && !loading && (
        <button
          onClick={loadMoreTasks}
          disabled={loading}
          className="mx-auto mt-4 bg-black px-3 py-1 text-xs font-medium text-white disabled:bg-gray-500"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
