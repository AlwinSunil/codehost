import express from "express";
import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { createClient } from "redis";
import {
	S3Client,
	ListObjectsV2Command,
	DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const projectId = process.env.PROJECT_ID;

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
	process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const DEPLOYMENT_DIR_NAME = process.env.DEPLOYMENT_DIR_NAME;

const prisma = new PrismaClient();
const logsRedisClient = createClient();

const domainRedisClient = new Redis({
	url: process.env.UPSTASH_REDIS_URL,
	token: process.env.UPSTASH_REDIS_TOKEN,
});

const s3Client = new S3Client({
	region: "auto",
	endpoint: CLOUDFLARE_R2_ENDPOINT,
	credentials: {
		accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
		secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
	},
});

async function initRedis() {
	try {
		await logsRedisClient.connect();
		console.log("Connected to Redis");
	} catch (error) {
		handleError(`Failed to connect to Redis: ${error.message}`);
	}
}

function handleError(message) {
	console.error(`ERROR:INTERNAL_STATUS_SERVER: ${message}`);
	process.exit(1);
}

async function updateTaskStatus(taskId, status) {
	try {
		const updatedTask = await prisma.task.update({
			where: { id: taskId },
			data: { status, lastUpdated: new Date() },
		});
		if (status === "FAILED" || status === "COMPLETED") {
			await prisma.ongoingJob.deleteMany({
				where: { taskId: taskId },
			});

			if (status === "COMPLETED") {
				const updatedProject = await prisma.project.update({
					where: { id: projectId },
					data: { productionTaskId: taskId },
					select: {
						id: true,
						subdomain: true,
					},
				});

				await cleanupOldDeployments(projectId);

				await domainRedisClient.del(updatedProject.subdomain);
				console.log(
					`Deleted Redis key for subdomain: ${updatedProject.subdomain}`
				);
			}
		}
		return updatedTask;
	} catch (error) {
		handleError(`Error updating task status: ${error.message}`);
	}
}

async function cleanupOldDeployments(projectId) {
	try {
		const lastTwoCompletedTasks = await prisma.task.findMany({
			where: {
				projectId: projectId,
				status: "COMPLETED",
			},
			orderBy: {
				completedAt: "asc",
			},
			take: 2,
			select: {
				id: true,
			},
		});

		const tasksToKeep = new Set(
			lastTwoCompletedTasks.map((task) => task.id)
		);

		const prefix = `${process.env.DEPLOYMENT_DIR_NAME}/${projectId}/`;
		const listParams = {
			Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
			Prefix: prefix,
			Delimiter: "/",
		};

		const listCommand = new ListObjectsV2Command(listParams);
		const listedObjects = await s3Client.send(listCommand);

		if (!listedObjects.CommonPrefixes) {
			console.log("No deployments found to clean up.");
			return;
		}

		const allTaskIds = listedObjects.CommonPrefixes.map(
			(prefix) => prefix.Prefix.split("/")[2]
		);

		const foldersToDelete = allTaskIds.filter(
			(taskId) => !tasksToKeep.has(taskId)
		);

		for (const taskId of foldersToDelete) {
			await deleteTaskDeployment(projectId, taskId);
		}
	} catch (error) {
		console.error(`Error cleaning up old deployments: ${error.message}`);
	}
}

async function deleteTaskDeployment(projectId, taskId) {
	const prefix = `${DEPLOYMENT_DIR_NAME}/${projectId}/${taskId}/`;
	let continuationToken = undefined;

	do {
		const listParams = {
			Bucket: CLOUDFLARE_R2_BUCKET_NAME,
			Prefix: prefix,
			ContinuationToken: continuationToken,
		};

		const listCommand = new ListObjectsV2Command(listParams);
		const listedObjects = await s3Client.send(listCommand);

		if (listedObjects.Contents && listedObjects.Contents.length > 0) {
			const deleteParams = {
				Bucket: CLOUDFLARE_R2_BUCKET_NAME,
				Delete: {
					Objects: listedObjects.Contents.map((obj) => ({
						Key: obj.Key,
					})),
				},
			};

			const deleteCommand = new DeleteObjectsCommand(deleteParams);
			await s3Client.send(deleteCommand);
		}

		continuationToken = listedObjects.NextContinuationToken;
	} while (continuationToken);

	console.log(`Deleted deployment for task ${taskId}`);
}

async function processLogs() {
	try {
		const logs = await logsRedisClient.lRange("logs", 0, -1);
		if (logs.length > 0) {
			const taskId = process.env.TASK_ID;

			if (!taskId) {
				throw new Error("TASK_ID environment variable is not set");
			}

			const processedLogs = logs.map((logEntry) => {
				const parsedLog = JSON.parse(logEntry);
				return {
					taskId,
					log: parsedLog.log,
					loggedAt: new Date(parsedLog.timestamp),
				};
			});

			await prisma.taskLogs.createMany({
				data: processedLogs,
			});

			await logsRedisClient.lTrim("logs", logs.length, -1);
		}
	} catch (error) {
		console.error(
			`ERROR:INTERNAL_STATUS_SERVER: Error processing logs: ${error.message}`
		);
	}
}

const app = express();
app.use(express.json());

app.post("/api/task/update", async (req, res) => {
	try {
		const { taskId, status } = req.body;
		if (!taskId || !status) {
			return res.status(400).json({
				error: "ERROR:INTERNAL_STATUS_SERVER: taskId and status are required",
			});
		}
		const updatedTask = await updateTaskStatus(taskId, status);
		res.status(200).json({
			message: "Task status updated",
			task: updatedTask,
		});
	} catch (error) {
		console.error(
			`ERROR:INTERNAL_STATUS_SERVER: Failed to update task status: ${error.message}`
		);
		res.status(500).json({
			error: "ERROR:INTERNAL_STATUS_SERVER: Failed to update task status",
		});
	}
});

app.post("/api/task/log", async (req, res) => {
	try {
		const taskId = process.env.TASK_ID;
		if (!taskId) {
			return res.status(400).json({
				error: "ERROR:INTERNAL_STATUS_SERVER: TASK_ID environment variable is required",
			});
		}

		let { log } = req.body;
		const timestamp = new Date().toISOString();

		const logEntry = JSON.stringify({ log, timestamp });
		await logsRedisClient.lPush("logs", logEntry);

		res.status(200).json({
			message: "Log added",
			log: { taskId, log, timestamp },
		});
	} catch (error) {
		console.error(
			`ERROR:INTERNAL_STATUS_SERVER: Failed to add log: ${error.message}`
		);
		res.status(500).json({
			error: "ERROR:INTERNAL_STATUS_SERVER: Failed to add log",
		});
	}
});

app.get("/health", (req, res) => {
	res.status(200).send("Server is healthy");
});

(async () => {
	try {
		await prisma.$connect();
		await initRedis();
		app.listen(3000, () => {
			console.log("Server is running on port 3000");
		});
		setInterval(processLogs, 3000); // Process logs every 3 seconds
	} catch (error) {
		handleError("Internal error during startup");
	}
})();

// Global unhandled rejection and exception handlers
process.on("unhandledRejection", (reason, promise) => {
	handleError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on("uncaughtException", (error) => {
	handleError(`Uncaught Exception: ${error.message}`);
});
