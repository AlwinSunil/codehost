import express from "express";
import path from "path";

import prisma from "./lib/prisma.js";
import proxyRoutes from "./routes/proxy.js";
import logger from "./middlewares/logger.js";
import rateLimiter from "./middlewares/rateLimiter.js";

const app = express();
const PORT = 8000;

app.use(rateLimiter);
app.use(logger);

app.use(proxyRoutes(prisma));

app.get("/notfound", (req, res) => {
	res.status(404).sendFile(
		path.join(process.cwd(), "views", "notfound.html")
	);
});

// Catch-all middleware for unmatched routes
app.use((req, res, next) => {
	res.redirect("/notfound");
});

app.use((err, req, res, next) => {
	console.error("Server error:", err);
	res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
