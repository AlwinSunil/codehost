"use server";

import { getServerSession } from "next-auth/next";
import { prisma, authConfig } from "@/lib/auth";

export async function deleteProject(projectId) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  try {
    return await prisma.$transaction(async (prisma) => {
      const projectWithOngoingJobs = await prisma.project.findUnique({
        where: {
          id: projectId,
          userId: currentUserId,
        },
        include: {
          tasks: {
            where: {
              AND: [{ OngoingJob: { isNot: null } }, { userId: currentUserId }],
            },
            include: {
              OngoingJob: true,
            },
          },
        },
      });

      if (!projectWithOngoingJobs) {
        return { success: false, message: "Project not found or unauthorized" };
      }

      if (projectWithOngoingJobs.tasks.length > 0) {
        return {
          success: false,
          message:
            "Project has ongoing deployments. Stop on going deployment to delete the project.",
        };
      }

      await prisma.task.deleteMany({
        where: {
          projectId: projectId,
        },
      });

      await prisma.project.delete({
        where: {
          id: projectId,
        },
      });

      return {
        success: true,
        message: `Project ${projectId} deleted successfully`,
      };
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      message: "An error occurred while deleting the project",
    };
  }
}
