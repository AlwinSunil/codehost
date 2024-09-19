"use server";

import { getServerSession } from "next-auth/next";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchTaskLogs(taskId, lastLogTime) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { status: true },
  });

  console.log("task id data", task);

  if (!task) {
    throw new Error("Task not found.");
  }

  const logs = await prisma.taskLogs.findMany({
    where: {
      taskId: taskId,
      loggedAt: lastLogTime ? { gt: new Date(lastLogTime) } : undefined,
    },
    orderBy: {
      loggedAt: "asc",
    },
  });

  return {
    logs: logs.map((log) => ({
      loggedAt: log.loggedAt,
      log: log.log,
    })),
    status: task.status,
  };
}
