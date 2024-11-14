"use server";

import { getServerSession } from "next-auth/next";

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/upstash";

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

// Function to delete files from the R2 _deployments folder based on projectId
async function deleteFilesFromR2(projectId) {
  const prefix = `_deployments/${projectId}/`;

  // List all objects in the folder
  const listParams = {
    Bucket: CLOUDFLARE_R2_BUCKET_NAME,
    Prefix: prefix,
  };

  try {
    // Fetch the list of objects
    const listedObjects = await r2Client.send(
      new ListObjectsV2Command(listParams),
    );

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`No files found under prefix ${prefix} for deletion.`);
      return;
    }

    // Extract the keys of the objects to delete
    const deleteParams = {
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map((item) => ({ Key: item.Key })),
      },
    };

    // Send delete command to remove all listed objects
    await r2Client.send(new DeleteObjectsCommand(deleteParams));
    console.log(`Successfully deleted all files under ${prefix}.`);
  } catch (error) {
    console.error(
      `Error deleting files from R2 for project ${projectId}:`,
      error,
    );
  }
}

export async function deleteProject(projectId) {
  const session = await getServerSession(authConfig);
  if (!session || !session.user) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  try {
    return await prisma.$transaction(async (prisma) => {
      const projectWithOngoingJobs = await prisma.project.findUnique({
        where: {
          id: projectId,
          userId: currentUserId,
        },
        include: {
          tasks: {
            where: {
              AND: [{ OngoingJob: { isNot: null } }, { userId: currentUserId }],
            },
            include: {
              OngoingJob: true,
            },
          },
        },
      });

      if (!projectWithOngoingJobs) {
        return { success: false, message: "Project not found or unauthorized" };
      }

      if (projectWithOngoingJobs.tasks.length > 0) {
        return {
          success: false,
          message:
            "Project has ongoing deployments. Stop ongoing deployments to delete the project.",
        };
      }

      const tasks = await prisma.task.findMany({
        where: {
          projectId: projectId,
          userId: currentUserId,
        },
        select: {
          id: true,
        },
      });

      const taskIds = tasks.map((task) => task.id);

      await prisma.taskLogs.deleteMany({
        where: {
          taskId: {
            in: taskIds,
          },
        },
      });

      await prisma.task.deleteMany({
        where: {
          id: {
            in: taskIds,
          },
        },
      });

      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

      await redis.del(project.subdomain);

      await prisma.environmentVariables.deleteMany({
        where: { projectId },
      });

      await prisma.project.delete({
        where: {
          id: projectId,
        },
      });

      await deleteFilesFromR2(projectId);

      return {
        success: true,
        message: `Project ${projectId} deleted successfully.`,
      };
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      message: "An error occurred while deleting the project",
    };
  }
}
