import express from "express";
import { db } from "@vercel/postgres";

let clientPool = null;

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
		const updateQuery = `UPDATE "Task"
            SET "status" = $1, "lastUpdated" = NOW()
            WHERE id = $2 RETURNING *`;
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
		handleError("Failed to update task status");
	}
});

app.get("/health", (req, res) => {
	res.status(200).send("Server is healthy");
});

(async () => {
	try {
		await initDbConnection();
		app.listen(3000, () => {
			console.log("Server is running on port 3000");
		});
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
