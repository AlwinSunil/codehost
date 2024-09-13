import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ProjectHeader from "./components/ProjectHeader";
import { ProjectProvider } from "./context/ProjectContext";
import { TaskRefetchProvider } from "./context/TaskRefetchContext";

export default async function Project({ children, params }) {
  const session = await getServerSession(authConfig);
  if (!session) {
    return <div>You are not logged in.</div>;
  }

  const { id } = params;

  const project = await prisma.project.findUnique({
    where: { id: id },
  });

  if (!project) {
    notFound();
  }

  return (
    <TaskRefetchProvider>
      <ProjectProvider project={project}>
        <div className="mb-12 flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
          <ProjectHeader project={project} />
          {children}
        </div>
      </ProjectProvider>
    </TaskRefetchProvider>
  );
}
