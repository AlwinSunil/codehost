import clsx from "clsx";
import Link from "next/link";

export const metadata = {
  title: "Dashboard - CodeHost",
  description:
    "Dashboard for CodeHost. CodeHost is a platform for developers to host frontend code",
};

import { authConfig, prisma } from "@/lib/auth";
import { getServerSession } from "next-auth";

const handleGithubLink = (url) => {
  const urlParts = url.split("/");
  if (urlParts.length < 5) {
    throw new Error("Invalid GitHub URL");
  }
  return `${urlParts[3]}/${urlParts[4]}`;
};

export default async function DashboardHome() {
  const session = await getServerSession(authConfig);

  const projects = await prisma.project.findMany({
    where: {
      userId: session?.user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-3 py-4 pb-5 md:col-span-2 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
        <h1 className="col-span-3 font-sans text-2xl font-semibold">
          Deploy new project
        </h1>
        <Link
          href="/new"
          className="flex w-full justify-center gap-3 bg-black px-2 py-2 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
            <line x1="12" x2="12" y1="8" y2="16" />
            <line x1="8" x2="16" y1="12" y2="12" />
          </svg>
          <span>New Project</span>
        </Link>
      </div>
      <hr />
      <h1 className="col-span-3 mt-5 font-sans text-2xl font-semibold">
        Your Projects
      </h1>
      <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            href={`/project/${project.id}`}
            className="group flex w-full flex-col gap-2.5 border bg-white p-4 text-black hover:cursor-pointer hover:border-gray-300"
            key={project.id}
          >
            <div className="flex items-center gap-2">
              <img
                className="h-8 w-8 rounded-full border bg-gray-50 p-1 group-hover:bg-white"
                src={project.avatar}
                alt={project.name}
              />
              <span className="font-semibold">{project.name}</span>
              <span
                className={clsx(
                  "ml-auto h-fit w-fit px-1 text-xs font-semibold",
                  project.status === "ACTIVE" &&
                    "border border-emerald-200 bg-emerald-50 text-emerald-500",
                  project.status === "FAILED" &&
                    "border border-red-200 bg-red-50 text-red-500",
                )}
              >
                {project.status}
              </span>
            </div>
            <hr className="border-gray-200" />
            <span className="flex w-fit items-center gap-1.5 rounded-full border bg-gray-100 px-2.5 py-1 pr-3 font-sans text-xs font-medium text-black">
              <svg
                aria-label="github"
                viewBox="0 0 14 14"
                className="h-4 w-4 fill-black"
              >
                <path d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z"></path>
              </svg>
              {handleGithubLink(project.repoLink)}
            </span>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="col-span-3 border p-4 text-sm font-medium text-gray-600">
            You have no projects yet. Create a new project to get started.
          </p>
        )}
      </div>
    </>
  );
}
