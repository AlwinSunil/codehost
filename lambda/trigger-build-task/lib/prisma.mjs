import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;

// Handle graceful shutdown
process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	process.exit(0);
});
