"use server";

import { getServerSession } from "next-auth/next";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ProjectStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
};

export async function changeStatus(projectId, status) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  try {
    return await prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: currentUserId,
        },
      });

      if (!project) {
        return { success: false, message: "Project not found or unauthorized" };
      }

      if (project.status === status) {
        return {
          success: false,
          message: `Project is already ${status}`,
        };
      }

      await prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          status: status,
        },
      });

      return {
        success: true,
        message: `Project ${status === ProjectStatus.ACTIVE ? "activated" : "disabled"} successfully`,
      };
    });
  } catch (error) {
    console.error("Error changing project status:", error);
    return {
      success: false,
      message: "An error occurred while changing the project status",
    };
  }
}
