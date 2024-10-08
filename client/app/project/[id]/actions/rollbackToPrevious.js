"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/upstash";

export async function rollbackToPrevious(projectId, targetTask) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Fetch the project with only the two most recent completed tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { status: "COMPLETED" },
          orderBy: { lastUpdated: "desc" },
          take: 2,
        },
      },
    });

    console.log(project);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.tasks.length < 2) {
      return {
        success: false,
        error: "Not enough completed deployments to rollback",
      };
    }

    const [latestDeployment, previousDeployment] = project.tasks;

    if (targetTask && targetTask !== previousDeployment.id) {
      return {
        success: false,
        error: "Specified target deployment is not the previous deployment",
      };
    }

    if (latestDeployment.id === previousDeployment.id) {
      return {
        success: false,
        error: "Cannot rollback to the current deployment",
      };
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { productionTaskId: previousDeployment.id },
    });

    await redis.del(updatedProject.subdomain);

    return {
      success: true,
      message: "Successfully rolled back to the previous deployment",
      updatedProject,
    };
  } catch (error) {
    console.error("Error during rollback:", error);
    return {
      success: false,
      error: "Failed to rollback to the previous deployment",
    };
  }
}
