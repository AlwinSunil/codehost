"use client";

import { toast } from "sonner";

export default function ProjectHeader({ project }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(project?.repoLink);
    toast.info("Copied to clipboard!", { duration: 1000 });
  };

  return (
    <>
      <div className="relative flex justify-center gap-6 border-b pb-6 pt-6">
        <img
          src={`https://api.dicebear.com/9.x/bottts/svg?seed=${project?.name}`}
          className="h-20 w-20 rounded-full border bg-gray-50 p-2"
          alt="Profile Picture"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{project?.name}</h1>
          <div className="flex items-center gap-1.5">
            <p
              className="rounded-sm border border-gray-200 bg-gray-50 px-2 text-sm tracking-tight shadow-inner hover:cursor-pointer hover:bg-gray-100"
              onClick={() => copyToClipboard(project?.repoLink)}
            >
              {project?.repoLink}
            </p>
            <p className="rounded-full bg-blue-50 px-2 font-sans text-xs font-semibold text-blue-500">
              {project?.branch}
            </p>
          </div>
        </div>
        <button className="my-auto flex h-fit w-fit rounded-full border p-2 text-xs font-medium hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </>
  );
}
