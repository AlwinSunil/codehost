"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const presets = {
  VITEJS: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDirectory: "dist",
  },
  CRA: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDirectory: "build",
  },
};

const isValidPath = (path, pattern, invalidChars) => {
  const trimmedPath = path.trim();
  return (
    !invalidChars.test(trimmedPath) &&
    pattern.test(trimmedPath) &&
    !trimmedPath.includes("..")
  );
};

const isValidCommand = (command) => {
  const maliciousPatterns = [/;.*$/, /&&.*$/, /(\|\|)/, /(\&\&)/];
  return (
    !command.includes("..") &&
    !maliciousPatterns.some((pattern) => pattern.test(command)) &&
    !command.includes("|")
  );
};

const isValidOutputDir = (dir) =>
  !dir.includes(" ") && !dir.includes("..") && !dir.includes("/");

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

    // Apply preset defaults if preset is changing
    if (changes.preset && changes.preset !== project.preset) {
      const presetDefaults = presets[changes.preset];
      updatedChanges = { ...updatedChanges, ...presetDefaults, ...changes };
    }

    // Validate changes
    if (
      updatedChanges.rootDir &&
      !isValidPath(
        updatedChanges.rootDir,
        /^([.]{1}\/|\/)?([a-zA-Z0-9_-]+\/?)*$/,
        /[<>:"|?*\\]/,
      )
    ) {
      return { success: false, error: "Invalid root directory path" };
    }

    if (
      updatedChanges.buildCommand &&
      !isValidCommand(updatedChanges.buildCommand)
    ) {
      return { success: false, error: "Invalid build command" };
    }

    if (
      updatedChanges.installCommand &&
      !isValidCommand(updatedChanges.installCommand)
    ) {
      return { success: false, error: "Invalid install command" };
    }

    if (
      updatedChanges.outputDir &&
      !isValidOutputDir(updatedChanges.outputDir)
    ) {
      return { success: false, error: "Invalid output directory" };
    }

    // Filter out undefined or null values
    const validUpdates = Object.fromEntries(
      Object.entries(updatedChanges).filter(([_, value]) => value != null),
    );

    // Update project with validated changes
    await prisma.project.update({
      where: { id: projectId },
      data: validUpdates,
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
