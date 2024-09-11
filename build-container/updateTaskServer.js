import express from "express";
import { db } from "@vercel/postgres";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

const redisClient = createClient();
let clientPool = null;

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
	process.exit(1); // Ensure this is the desired behavior
}

async function initDbConnection() {
	try {
		clientPool = await db.connect();
	} catch (error) {
		handleError(`Failed to connect to the database: ${error.message}`);
	}
}

async function getClient() {
	if (clientPool === null) {
		await initDbConnection();
	}
	return clientPool;
}

async function updateTaskStatus(taskId, status) {
	const client = await getClient();
	try {
		await client.query("BEGIN");
		const updateQuery = `UPDATE "Task" SET "status" = $1, "lastUpdated" = NOW() WHERE id = $2 RETURNING *`;
		const result = await client.query(updateQuery, [status, taskId]);
		if (result.rowCount === 0) {
			throw new Error("No active task found to update");
		}
		await client.query("COMMIT");
		return result.rows[0];
	} catch (error) {
		await client.query("ROLLBACK");
		handleError(`Error updating task status: ${error.message}`);
	}
}

async function processLogs() {
	const client = await getClient();
	try {
		const logs = await redisClient.lRange("logs", 0, -1);
		if (logs.length > 0) {
			await client.query("BEGIN");
			const insertQuery = `INSERT INTO "TaskLogs" (id, "createdAt", "taskId", "log") VALUES ($1, $2, $3, $4)`;
			const taskId = process.env.TASK_ID;
			for (const log of logs) {
				const logEntry = JSON.parse(log);
				const { log: text, timestamp } = logEntry;
				await client.query(insertQuery, [
					uuidv4(),
					timestamp,
					taskId,
					text,
				]);
			}
			await client.query("COMMIT");
			await redisClient.lTrim("logs", logs.length, -1); // Remove processed logs only if transaction succeeds
		}
	} catch (error) {
		await client.query("ROLLBACK");
		console.error(
			`ERROR:INTERNAL_STATUS_SERVER: Error processing logs: ${error.message}`
		);
		// Consider adding retry logic or additional handling here
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

		const logEntry = JSON.stringify({
			log,
			timestamp,
		});
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
		await initDbConnection();
		await initRedis();
		app.listen(3000, () => {
			console.log("Server is running on port 3000");
		});
		setInterval(processLogs, 2000); // Process logs every 2 seconds
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
