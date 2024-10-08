"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

import { fetchTasks } from "../actions/fetchTasks";
import { rollbackToPrevious } from "../actions/rollbackToPrevious";
import { useProject } from "../Context/ProjectContext";
import { useTaskRefetch } from "../Context/TaskRefetchContext";

const statusClasses = {
  IN_QUEUE: "border-gray-200 bg-gray-50 text-gray-900 shadow-gray-100",
  STARTING: "border-blue-200 bg-blue-50 text-blue-600 shadow-blue-100",
  BUILDING: "border-yellow-200 bg-yellow-50 text-yellow-600 shadow-yellow-100",
  COMPLETED: "border-green-200 bg-green-50 text-green-600 shadow-green-100",
  DEPLOYED: "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-indigo-100",
  FAILED: "border-red-200 bg-red-50 text-red-600 shadow-red-100",
};

function TaskItem({ projectId, task, prodTaskId }) {
  const isCurrentTaskProd = task.id === prodTaskId;

  return (
    <Link
      href={`/project/${projectId}/${task.id}`}
      className="flex flex-row items-center gap-4 px-8 py-5 hover:bg-gray-50/50"
    >
      <div className="flex w-52 gap-2 overflow-hidden text-sm text-gray-700">
        <p>#{task.id.slice(0, 10)}</p>
        {isCurrentTaskProd && (
          <div className="flex w-fit items-center gap-1 rounded-full bg-blue-100 p-0.5 pl-1 pr-2.5 text-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m16 12-4-4-4 4" />
              <path d="M12 16V8" />
            </svg>
            <p className="font-sans text-xs font-medium">Current</p>
          </div>
        )}
      </div>
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
  const router = useRouter();

  const { version } = useTaskRefetch();
  const project = useProject();

  const [tasks, setTasks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [revertLoading, setRevertLoading] = useState(false);

  const [lastSuccessfulDeployment, setLastSuccessfulDeployment] =
    useState(null);

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

  useEffect(() => {
    const previousDeployment = findPreviousDeployment(tasks);
    setLastSuccessfulDeployment(previousDeployment);
  }, [tasks]);

  const findPreviousDeployment = (tasks) => {
    const successfulTasks = tasks.filter((task) => task.status === "COMPLETED");
    return successfulTasks.length > 0 ? successfulTasks[0] : null;
  };

  const loadMoreTasks = async () => {
    if (loading) return;
    const newTasks = await fetchTasksData(tasks.length + 1, 10);
    setTasks((prevTasks) => [...prevTasks, ...newTasks]);
    setHasMore(newTasks.length === 10);
  };

  const previousDeployment = tasks && tasks[0];

  const handleRollbackToPrevious = async (projectId, targetTask) => {
    setRevertLoading(true);
    try {
      const rollbackResponse = await rollbackToPrevious(projectId, targetTask);
      console.log(rollbackResponse);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setRevertLoading(false);
    }
  };

  console.log(previousDeployment);

  return (
    <div className="mt-5 flex flex-col">
      <h2 className="mb-2.5 text-lg font-semibold">Other Deployment tasks</h2>
      <div className="flex flex-col border">
        {tasks.length === 0 && !loading ? (
          <div className="flex items-center px-4 py-2">No other tasks</div>
        ) : (
          tasks.map((task) => (
            <div className="flex flex-col border-b last:border-b-0">
              <TaskItem
                projectId={projectId}
                key={task.id}
                task={task}
                prodTaskId={project.productionTaskId}
              />
              {lastSuccessfulDeployment &&
                lastSuccessfulDeployment.id === task.id &&
                project.productionTaskId != task.id && (
                  <>
                    <hr className="mx-4 mb-3" />
                    <div className="mx-4 mb-3 mt-0 flex w-fit items-center gap-3 pl-3 font-sans text-xs">
                      <p className="font-medium">
                        Rollback active deployment to this task
                      </p>
                      <span className="text-gray-700">
                        #{task.id.slice(0, 10)}
                      </span>
                      <button
                        className="flex gap-1.5 bg-black px-2 py-1 text-white disabled:bg-gray-500"
                        disabled={revertLoading}
                        onClick={() =>
                          handleRollbackToPrevious(projectId, task.id)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <path d="M9 14 4 9l5-5" />
                          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                        </svg>{" "}
                        {revertLoading ? "Loading..." : "Instant rollback"}
                      </button>
                    </div>
                  </>
                )}
            </div>
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
