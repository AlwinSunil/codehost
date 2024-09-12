import express from "express";
import { db } from "@vercel/postgres";
import { createClient } from "redis";

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
	process.exit(1);
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
			const insertQuery = `
		  INSERT INTO "TaskLogs" (id, "createdAt", "taskId", log)
		  VALUES (uuid_generate_v4(), CURRENT_TIMESTAMP, $1, $2)
		`;
			const taskId = process.env.TASK_ID;

			if (!taskId) {
				throw new Error("TASK_ID environment variable is not set");
			}

			let lastLogWasWhitespace = false;

			for (const logEntry of logs) {
				let parsedLog;
				try {
					parsedLog = JSON.parse(logEntry);
				} catch (e) {
					console.error(`Error parsing log entry: ${logEntry}`);
					handleError("Error parsing log entry");
				}

				const logText = parsedLog.log;

				const isCurrentWhitespace = logText.trim() === "";

				if (isCurrentWhitespace && lastLogWasWhitespace) {
					continue;
				}

				lastLogWasWhitespace = isCurrentWhitespace;

				await client.query(insertQuery, [taskId, logText]);
			}

			await client.query("COMMIT");
			await redisClient.lTrim("logs", logs.length, -1);
		}
	} catch (error) {
		await client.query("ROLLBACK");
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

		const logEntry = JSON.stringify({ log });
		await redisClient.lPush("logs", logEntry);

		res.status(200).json({
			message: "Log added",
			log: { taskId, log },
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
		setInterval(processLogs, 3000); // Process logs every 2 seconds
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
