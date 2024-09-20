import express from "express";
import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";

const prisma = new PrismaClient();
const redisClient = createClient();

async function initRedis() {
	try {
		await redisClient.connect();
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
		}
		return updatedTask;
	} catch (error) {
		handleError(`Error updating task status: ${error.message}`);
	}
}

async function processLogs() {
	try {
		const logs = await redisClient.lRange("logs", 0, -1);
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

			await redisClient.lTrim("logs", logs.length, -1);
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
		await redisClient.lPush("logs", logEntry);

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
