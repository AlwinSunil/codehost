"use server";

import { getServerSession } from "next-auth/next";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/upstash";

export async function updateSubdomain(projectId, subdomain) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  subdomain = subdomain.toLowerCase();

  if (subdomain === "delivery") {
    return { success: false, message: "This is a reserved subdomain" };
  }

  try {
    // Find the current project for the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: currentUserId,
      },
    });

    if (!project) {
      return { success: false, message: "Project not found or not authorized" };
    }

    if (project.subdomain === subdomain) {
      return {
        success: false,
        message: "Subdomain is the same as the current one",
      };
    }

    const existingSubdomain = await prisma.project.findFirst({
      where: {
        subdomain: subdomain,
        NOT: { id: projectId },
      },
    });

    if (existingSubdomain) {
      return { success: false, message: "This subdomain is already in use" };
    }

    await redis.del(project.subdomain);

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        subdomain: subdomain,
      },
    });

    return {
      success: true,
      message: `Subdomain for project ${projectId} updated successfully`,
    };
  } catch (error) {
    console.error("Error updating subdomain:", error);
    return {
      success: false,
      message: "An error occurred while updating the project",
    };
  }
}
