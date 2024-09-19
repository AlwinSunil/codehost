"use server";

import { prisma } from "@/lib/prisma";

export async function fetchTasks(projectId, skip = 0, take = 10, userId) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      userId,
      OngoingJob: { isNot: null },
    },
    include: {
      OngoingJob: true,
      user: true,
    },
    orderBy: [{ startedAt: "desc" }, { lastUpdated: "desc" }],
    skip: parseInt(skip),
    take: parseInt(take),
  });

  return tasks;
}
