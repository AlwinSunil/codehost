"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/upstash";

export async function rollbackDeployment(projectId, targetTaskId, type) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Fetch the project with 2 completed tasks
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

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const completedTasks = project.tasks;
    if (completedTasks.length < 1) {
      return {
        success: false,
        error: "No completed deployments available",
      };
    }

    const latestDeployment = completedTasks[0];
    const previousDeployment = completedTasks[1] || null; // Check if there's a previous one

    if (type === "previous") {
      if (!previousDeployment) {
        return { success: false, error: "No previous deployment available" };
      }

      if (targetTaskId && targetTaskId !== previousDeployment.id) {
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

      await prisma.project.update({
        where: { id: projectId },
        data: { productionTaskId: previousDeployment.id },
      });
    } else if (type === "latest") {
      if (targetTaskId && targetTaskId !== latestDeployment.id) {
        return {
          success: false,
          error: "Specified target deployment is not the latest deployment",
        };
      }

      if (latestDeployment.id === project.productionTaskId) {
        return {
          success: false,
          error: "Latest deployment is already in production",
        };
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { productionTaskId: latestDeployment.id },
      });
    } else {
      return { success: false, error: "Invalid rollback type specified" };
    }

    await redis.del(project.subdomain);

    return {
      success: true,
      message: `Successfully rolled back to the ${type} deployment`,
    };
  } catch (error) {
    console.error("Error during rollback:", error);
    return { success: false, error: "Failed to rollback the deployment" };
  }
}
