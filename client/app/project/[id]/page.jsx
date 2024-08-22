import { authConfig, prisma } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { formatDistanceToNow } from "date-fns";
import ProjectHeader from "@/app/components/ProjectHeader";
import { notFound } from "next/navigation";

export default async function Project({ params }) {
  const session = await getServerSession(authConfig);
  if (!session) {
    return <div>You are not logged in.</div>;
  }

  const currentUserId = session?.user?.id;
  const { id } = params;

  const project = await prisma.project.findUnique({
    where: {
      id: id,
    },
    include: {
      tasks: {
        where: {
          AND: [{ OngoingJob: { isNot: null } }, { userId: currentUserId }],
        },
        include: {
          OngoingJob: true,
          user: true,
        },
        take: 1,
      },
    },
  });

  // Redirect to not found if the project does not exist
  if (!project) {
    notFound();
  }

  const latestTask = project?.tasks[0];

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
      <ProjectHeader project={project} />
      <div className="flex items-center gap-4 border-b px-4 py-2">
        <span className="mb-0.5 border-r text-base font-medium capitalize leading-4 tracking-tight">
          Latest task
        </span>
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2 md:px-10">
          <p className="text-sm">{latestTask.id.slice(0, 6)}</p>
          <p className="rounded-sm border border-gray-200 bg-gray-100 px-2 text-sm font-semibold tracking-tight shadow-inner">
            {latestTask.status}
          </p>
          <div className="flex gap-1.5">
            <span className="text-xs font-medium tracking-tight text-gray-800">
              {formatDistanceToNow(new Date(latestTask.lastUpdated), {
                addSuffix: true,
              })}
            </span>
            <p className="rounded-full border px-2 font-sans text-xs text-gray-600">
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
    </div>
  );
}
