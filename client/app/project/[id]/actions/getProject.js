"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getProject(id) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: id },
    });

    if (!project) {
      return { success: false, message: "Project not found" };
    }

    return { success: true, project: project, message: "Project fetched" };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { success: false, message: "Failed to fetch project" };
  }
}
