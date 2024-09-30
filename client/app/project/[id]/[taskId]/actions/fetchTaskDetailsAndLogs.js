"use server";

import { getServerSession } from "next-auth/next";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchTaskDetailsAndLogs(taskId, lastLogTime = null) {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    const userId = session.user.id;

    const [taskDetails, logs] = await Promise.all([
      prisma.task.findFirst({
        where: { id: taskId, userId },
      }),
      prisma.taskLogs.findMany({
        where: {
          taskId,
          loggedAt: lastLogTime ? { gt: new Date(lastLogTime) } : undefined,
        },
        orderBy: { loggedAt: "asc" },
      }),
    ]);

    if (!taskDetails) {
      return { success: false, error: "Task not found" };
    }

    return {
      success: true,
      task: taskDetails,
      logs: logs.map((log) => ({
        loggedAt: log.loggedAt,
        log: log.log,
      })),
      status: taskDetails.status,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
