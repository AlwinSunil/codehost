"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidCommand } from "@/helpers/isValidCommand";
import { isValidPath } from "@/helpers/isValidPath";

const presets = {
  VITEJS: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "dist",
  },
  CRA: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "build",
  },
};

export async function updateProjectConfig(projectId, changes) {
  const session = await getServerSession(authConfig);
  if (!session?.user)
    return { success: false, error: "User not authenticated" };

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return { success: false, error: "Project not found" };

    if (project.userId !== session.user.id)
      return { success: false, error: "You do not own this project" };

    let updatedChanges = { ...changes };

    if (changes.preset && changes.preset !== project.preset) {
      const presetDefaults = presets[changes.preset];
      updatedChanges = { ...updatedChanges, ...presetDefaults, ...changes };
    }

    let error = null;
    Object.entries(updatedChanges).forEach(([field, value]) => {
      switch (field) {
        case "rootDir":
        case "outputDir":
          if (!isValidPath(value)) {
            error = `Invalid path for ${field}`;
          }
          break;

        case "installCommand":
        case "buildCommand":
          const commandValidation = isValidCommand(value);
          if (!commandValidation.valid) {
            error = commandValidation.error;
          }
          break;
      }
    });

    if (error) return { success: false, error };

    await prisma.project.update({
      where: { id: projectId },
      data: updatedChanges,
    });

    return {
      success: true,
      message: "Project configuration updated successfully",
    };
  } catch (error) {
    console.error("Error during updateProjectConfig:", error);
    return { success: false, error: "Failed to update project config" };
  }
}
