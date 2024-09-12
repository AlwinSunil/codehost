"use client";

export default function Task({ params }) {
  return (
    <div className="">
      <hr className="mb-2.5 border-gray-200" />
      <div className="mb-2.5">
        <div className="flex items-center gap-3 divide-x">
          <button className="ml-2 flex items-center gap-0.5 bg-black px-2 py-1 pr-2.5 text-xs font-medium text-white">
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
          </button>
          <div className="pl-2.5 text-base">
            <span className="mr-4 font-semibold">Deployment task</span>
            <span className="text-sm font-medium text-gray-500">
              #{params.taskId}
            </span>
          </div>
        </div>
      </div>
      <hr className="mb-4 border-gray-200" />
      <div className="border p-4">
        <h2 className="mb-2.5 text-lg font-semibold">Deployment task logs</h2>
        <div className="border bg-gray-50 px-4 py-2">
          <div className="flex gap-2 border-b border-gray-300 px-2 py-1.5 last:border-0">
            <span className="w-60 text-xs font-medium">Logs</span>
            <span className="flex-auto text-xs text-gray-700">
              ag iahsdu hasjdha
            </span>
          </div>
          <div className="flex gap-2 border-b border-gray-300 px-2 py-1.5 last:border-0">
            <span className="w-60 text-xs font-medium">Logs</span>
            <span className="flex-auto text-xs text-gray-700">
              ag iahsdu hasjdha
            </span>
          </div>
          <div className="flex gap-2 border-b border-gray-300 px-2 py-1.5 last:border-0">
            <span className="w-60 text-xs font-medium">Logs</span>
            <span className="flex-auto text-xs text-gray-700">
              ag iahsdu hasjdha
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
