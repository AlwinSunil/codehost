"use client";

import React from "react";
import { useSession } from "next-auth/react";

import LatestCommit from "./components/LatestCommit";
import LatestTask from "./components/LatestTask";
import TaskList from "./components/TaskList";
import { useProject } from "./context/ProjectContext";

const handleGithubLink = (url) => {
  const urlParts = url.split("/");
  if (urlParts.length < 5) {
    throw new Error("Invalid GitHub URL");
  }
  return `${urlParts[3]}/${urlParts[4]}`;
};

export default function Project() {
  const { data: session } = useSession();
  const project = useProject();

  console.log("project", project);

  if (!project) {
    return <div>Loading...</div>;
  }

  const currentUserId = session?.user?.id;

  return (
    <>
      <div className="mb-4 flex divide-x border-y py-2.5">
        <div className="flex w-fit items-center px-2 font-sans text-xs font-medium text-black">
          <div className="flex items-center gap-1.5 pr-3">
            <a
              href={project.repoLink}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-1.5"
            >
              <svg
                aria-label="github"
                viewBox="0 0 14 14"
                className="h-4 w-4 fill-black"
              >
                <path d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z"></path>
              </svg>
              <p className="group-hover:underline">
                {handleGithubLink(project.repoLink)}
              </p>
            </a>
            <p className="w-fit rounded-full bg-blue-50 px-2 font-sans text-xs font-semibold text-blue-600">
              {project.branch}
            </p>
          </div>
          <LatestCommit project={project} />
        </div>
      </div>
      {/* Latest deployment ribbon */}
      <LatestTask projectId={project.id} />
      {/* Deployment tasks list */}
      <TaskList projectId={project.id} currentUserId={currentUserId} />
    </>
  );
}
