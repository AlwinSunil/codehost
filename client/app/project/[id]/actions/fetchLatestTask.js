"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchLatestTask(projectId) {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  const userId = session.user.id;

  try {
    const latestTask = await prisma.task.findFirst({
      where: {
        projectId,
        userId,
      },
      orderBy: [{ startedAt: "desc" }, { lastUpdated: "desc" }],
    });

    if (!latestTask) {
      return { success: false, error: "No tasks found for this project." };
    }

    console.log("latestTask", latestTask);

    return { success: true, task: latestTask };
  } catch (error) {
    console.error("Error fetching latest task:", error);
    return { success: false, error: "Failed to fetch latest task." };
  }
}
