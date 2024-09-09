import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { formatDistanceToNow } from "date-fns";
import ProjectHeader from "@/app/components/ProjectHeader";
import { notFound } from "next/navigation";
import clsx from "clsx";
import LatestCommit from "./components/LatestCommit";
import TaskList from "./components/TaskList";
import { fetchTasks } from "./actions/fetchTasks";

const statusClasses = {
  ON_QUEUE: "border-gray-200 bg-gray-50 text-gray-900 shadow-gray-100",
  STARTING: "border-blue-200 bg-blue-50 text-blue-600 shadow-blue-100",
  BUILDING: "border-yellow-200 bg-yellow-50 text-yellow-600 shadow-yellow-100",
  COMPLETED: "border-green-200 bg-green-50 text-green-600 shadow-green-100",
  DEPLOYED: "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-indigo-100",
  FAILED: "border-red-200 bg-red-50 text-red-600 shadow-red-100",
};

const handleGithubLink = (url) => {
  const urlParts = url.split("/");
  if (urlParts.length < 5) {
    throw new Error("Invalid GitHub URL");
  }
  return `${urlParts[3]}/${urlParts[4]}`;
};

export default async function Project({ children, params }) {
  const session = await getServerSession(authConfig);
  if (!session) {
    return <div>You are not logged in.</div>;
  }

  const { id } = params;
  const currentUserId = session?.user?.id;

  const project = await prisma.project.findUnique({
    where: { id: id },
  });

  if (!project) {
    notFound();
  }

  const initialTasks = await fetchTasks(id, 0, 10, currentUserId);
  const latestTask = initialTasks[0];

  return (
    <div className="mb-12 flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
      <ProjectHeader project={project} />
      {/* Project ribbon */}
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
              {project?.branch}
            </p>
          </div>
          <LatestCommit project={project} />
        </div>
      </div>
      {/* Latest deployment ribbon */}
      <div className="flex items-center border">
        <span className="w-fit border-r py-2 pl-4 text-base font-semibold capitalize leading-5 tracking-tight">
          Latest deployment
        </span>
        <div className="group flex w-full items-center justify-between gap-2 px-4 py-6 hover:cursor-pointer hover:bg-gray-50/50 md:px-10">
          <p className="flex items-center gap-1.5 text-sm text-black group-hover:underline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-black"
            >
              <circle cx="12" cy="12" r="3" />
              <line x1="3" x2="9" y1="12" y2="12" />
              <line x1="15" x2="21" y1="12" y2="12" />
            </svg>
            {latestTask.commitHash.slice(0, 7)}
          </p>
          <p className="w-72 truncate text-xs text-gray-700">
            {latestTask.commitMessage}
          </p>
          <p
            className={clsx(
              "rounded-sm border px-2 text-sm font-semibold tracking-tight shadow-inner",
              statusClasses[latestTask?.status] ||
                "border-gray-200 bg-gray-50 text-gray-500",
            )}
          >
            {latestTask.status}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium tracking-tight text-gray-800">
              {formatDistanceToNow(new Date(latestTask.lastUpdated), {
                addSuffix: true,
              })}
            </span>
            <p className="h-fit truncate rounded-full border bg-white px-2 font-sans text-xs text-gray-600">
              {new Date(latestTask.startedAt).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
      <TaskList
        projectId={id}
        currentUserId={currentUserId}
        initialTasks={initialTasks}
      />
    </div>
  );
}
