"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function editEnvForProject(envId, projectId, payload) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "User not authenticated" };
  }

  console.log("Editing env:", envId, projectId, payload);

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
      return { success: false, message: "Environment variable not found" };
    }

    if (env.projectId !== projectId) {
      return {
        success: false,
        message: "Environment variable not associated with project",
      };
    }

    const updatedEnv = await prisma.environmentVariables.update({
      where: {
        id: envId,
      },
      data: {
        key: payload.key,
        value: payload.value,
      },
    });

    return {
      success: true,
      message: `Environment variable '${updatedEnv.key}' updated successfully`,
      env: updatedEnv,
    };
  } catch (error) {
    console.error("Error updating environment variable:", error);
    return {
      success: false,
      message: "Failed to update environment variable",
    };
  }
}
