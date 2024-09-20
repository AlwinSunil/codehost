"use server";

import { getServerSession } from "next-auth/next";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchTaskDetails(taskId) {
  const session = await getServerSession(authConfig);

  // Check if the user is authenticated
  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  const userId = session.user.id;

  try {
    const taskDetails = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!taskDetails) {
      return { success: false, error: "Task not found" };
    }

    console.log("Task details:", taskDetails);

    return { success: true, task: taskDetails };
  } catch (error) {
    console.error("Error fetching task details:", error);
    return { success: false, error: "Failed to fetch task details." };
  }
}
