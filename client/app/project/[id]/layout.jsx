import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";

import ProjectHeader from "./components/ProjectHeader";
import { ProjectProvider } from "./Context/ProjectContext";
import { TaskRefetchProvider } from "./Context/TaskRefetchContext";

export default async function Project({ children, params }) {
  const session = await getServerSession(authConfig);

  if (!session) {
    return (
      <div className="mb-12 flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
        You are not logged in.
      </div>
    );
  }

  const { id } = params;

  return (
    <TaskRefetchProvider>
      <ProjectProvider id={id}>
        <div className="mb-12 flex min-h-[calc(100vh-7rem)] flex-col gap-1 px-4 py-3 md:px-10">
          <ProjectHeader />
          {children}
        </div>
      </ProjectProvider>
    </TaskRefetchProvider>
  );
}
