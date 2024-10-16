import Link from "next/link";

import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

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

export default TaskItem;
