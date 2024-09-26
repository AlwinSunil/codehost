"use client";

import clsx from "clsx";
import { toast } from "sonner";

import ProjectSettings from "./ProjectSettings";

export const copyToClipboard = (deployedURL) => {
  navigator.clipboard.writeText(deployedURL);
  toast.info("Copied to clipboard!", { duration: 1000 });
};

export const isLocal = process.env.NODE_ENV === "development";
export const protocol = isLocal ? "http" : "https";

export const displayURL = (subdomain) => {
  return `${subdomain}.${process.env.NEXT_PUBLIC_BASE_URL}`;
};

export const deployedURL = (subdomain) => {
  return `${protocol}://${subdomain}.${process.env.NEXT_PUBLIC_BASE_URL}`;
};

export default function ProjectHeader({ project }) {
  return (
    <>
      <div className="relative flex justify-center gap-5 pb-6 pt-6">
        <img
          src={`https://api.dicebear.com/9.x/bottts/svg?seed=${project?.name}`}
          className="h-20 w-20 rounded-full border bg-gray-50 p-2"
          alt="Profile Picture"
        />
        <div className="flex min-w-80 flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{project?.name}</h1>
            <span
              className={clsx(
                "mr-auto h-fit w-fit px-1 text-xs font-semibold",
                project.status === "ACTIVE" &&
                  "border border-emerald-200 bg-emerald-50 text-emerald-500",
                project.status === "PAUSED" &&
                  "border border-yellow-200 bg-yellow-50 text-yellow-500",
              )}
            >
              {project.status}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <a
              href={deployedURL(project?.subdomain)}
              className="flex h-6 items-center justify-center rounded-sm border border-gray-200 px-2 font-sans text-sm shadow-inner hover:cursor-pointer hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {displayURL(project?.subdomain)}
            </a>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 cursor-pointer items-center justify-center rounded-sm border border-gray-200 p-1 text-black shadow-inner hover:bg-gray-50"
              onClick={() => copyToClipboard(deployedURL)}
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v4" />
              <path d="M21 14H11" />
              <path d="m15 10-4 4 4 4" />
            </svg>
          </div>
          {project.status === "PAUSED" ? (
            <p className="mt-1 font-sans text-xs leading-4 tracking-tight text-gray-600">
              *Activate project in settings to make url accessable and for new
              deployments
            </p>
          ) : null}
        </div>
        <ProjectSettings project={project} />
      </div>
    </>
  );
}
