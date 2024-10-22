"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function removeEnvFromProject(envId, projectId) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const env = await prisma.environmentVariables.findUnique({
      where: {
        id: envId,
      },
      include: {
        project: true,
      },
    });

    if (!env) {
      return { success: false, message: `${env.key} not found` };
    }

    if (env.projectId !== projectId) {
      return {
        success: false,
        message: `${env.key} not associated with project`,
      };
    }

    await prisma.environmentVariables.delete({
      where: {
        id: envId,
      },
    });

    return {
      success: true,
      message: `${env.key} removed from project`,
    };
  } catch (error) {
    console.error("Error removing env from project:", error);
    return { success: false, message: "Failed to remove env from project" };
  }
}
