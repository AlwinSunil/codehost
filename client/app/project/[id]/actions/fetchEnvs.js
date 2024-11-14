"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchEnvs(projectId) {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    const envs = await prisma.environmentVariables.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        key: true,
        value: true,
        id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!envs || envs.length === 0) {
      return {
        success: true,
        message: "No environment variables found for this project.",
      };
    }

    return { success: true, envs, message: "Environment variables fetched." };
  } catch (error) {
    console.error("Error fetching environment variables:", error);
    return {
      success: false,
      message: "Failed to fetch environment variables.",
    };
  }
}
