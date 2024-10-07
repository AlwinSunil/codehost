"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function fetchTasks(projectId, skip = 0, take = 10, userId) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, error: "User not authenticated" };
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      userId,
    },
    include: {
      OngoingJob: true,
    },
    orderBy: [{ startedAt: "desc" }, { lastUpdated: "desc" }],
    skip: parseInt(skip),
    take: parseInt(take),
  });

  return tasks;
}
