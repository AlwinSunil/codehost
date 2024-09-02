"use client";

import { toast } from "sonner";
import ProjectSettings from "./ProjectSettings";

export default function ProjectHeader({ project }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(project?.repoLink);
    toast.info("Copied to clipboard!", { duration: 1000 });
  };

  return (
    <>
      <div className="relative flex justify-center gap-6 pb-6 pt-6">
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
            <p className="rounded-full bg-blue-50 px-2 font-sans text-xs font-semibold text-blue-600">
              {project?.branch}
            </p>
          </div>
        </div>
        <ProjectSettings project={project} />
      </div>
    </>
  );
}
