"use server";

import { getServerSession } from "next-auth";

import { authConfig } from "@/lib/auth";

const restrictedEnvKeys = new Set([
  "BUILD_COMMAND",
  "NODE_VERSION",
  "HOSTNAME",
  "ROOT_DIR",
  "YARN_VERSION",
  "HOME",
  "INSTALL_COMMAND",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_ENDPOINT",
  "REPO_URL",
  "POSTGRES_URL_NON_POOLING",
  "OUTPUT_DIR",
  "UPSTASH_REDIS_TOKEN",
  "TASK_ID",
  "PATH",
  "PROJECT_ID",
  "DEPLOYMENT_DIR_NAME",
  "UPSTASH_REDIS_URL",
  "PWD",
  "POSTGRES_PRISMA_URL",
  "CLOUDFLARE_R2_BUCKET_NAME",
  "BRANCH_NAME",
]);

export async function validateEnvs(envs) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return { success: false, error: "User not authenticated" };
    }

    const invalidEnvs = [];
    const seenEnvs = new Set();
    const duplicateEnvs = new Set();

    for (const env of envs) {
      if (restrictedEnvKeys.has(env.key)) {
        invalidEnvs.push(env.key);
      }
      if (seenEnvs.has(env.key)) {
        duplicateEnvs.add(env.key);
      } else {
        seenEnvs.add(env.key);
      }
    }

    let message = "";
    if (invalidEnvs.length > 0) {
      message += `Invalid environment variables found: ${invalidEnvs.join(", ")}.`;
    }

    if (duplicateEnvs.size > 0) {
      if (message) {
        message += " ";
      }
      message += `Duplicate environment variables found: ${Array.from(duplicateEnvs).join(", ")}.`;
    }

    if (message) {
      return {
        success: false,
        message,
      };
    }

    return { success: true, message: "Environment variables are valid" };
  } catch (error) {
    return { success: false, message: "Error validating envs" };
  }
}
