"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const isValidEnvKey = (key) => {
  // Key must start with a letter/underscore, contain only letters, numbers, and underscores, and be 1-100 chars long
  const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]{0,99}$/;
  return envKeyRegex.test(key);
};

const isValidEnvValue = (value) => {
  // Value must not be empty, contain control characters, or have leading/trailing spaces
  return (
    value?.trim() === value &&
    value.length > 0 &&
    !/[\x00-\x1F\x7F]/.test(value)
  );
};

export async function addEnvsForProject(projectId, payload) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { success: false, message: "Project not found" };
    }

    if (project.userId !== session.user.id) {
      return { success: false, message: "You do not own this project" };
    }

    const validEnvVars = payload.filter(({ key, value }) => {
      return isValidEnvKey(key) && isValidEnvValue(value);
    });

    if (validEnvVars.length === 0) {
      return {
        success: false,
        message: "No valid environment variables to add",
      };
    }

    await prisma.environmentVariables.createMany({
      data: validEnvVars.map(({ key, value }) => ({
        key,
        value,
        projectId: project.id,
      })),
    });

    return {
      success: true,
      message: "Environment variables added successfully",
    };
  } catch (error) {
    console.error("Error adding envs to project:", error);
    return { success: false, message: "Failed to add environment variables" };
  }
}
