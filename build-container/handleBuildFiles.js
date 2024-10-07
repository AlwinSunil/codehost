import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import mime from "mime-types";

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
	process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const DEPLOYMENT_DIR_NAME = process.env.DEPLOYMENT_DIR_NAME;

const outputDirectory = process.env.OUTPUT_DIR;
const projectId = process.env.PROJECT_ID;
const taskId = process.env.TASK_ID;

console.log(`Build directory for the project: ${outputDirectory}`);

const storageClient = new S3Client({
	region: "auto",
	endpoint: CLOUDFLARE_R2_ENDPOINT,
	credentials: {
		accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
		secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
	},
});

// Set concurrency limit for uploads
const limit = pLimit(25);

let totalFiles = 0;
let uploadedFiles = 0;

function countFiles(dir) {
	const items = fs.readdirSync(dir);
	items.forEach((item) => {
		const itemPath = path.join(dir, item);
		const stats = fs.statSync(itemPath);
		if (stats.isDirectory()) {
			countFiles(itemPath);
		} else {
			totalFiles += 1;
		}
	});
}

async function uploadFileToS3(filePath, key) {
	const fileStream = fs.createReadStream(filePath);
	const uploadParams = {
		Bucket: CLOUDFLARE_R2_BUCKET_NAME,
		Key: key,
		Body: fileStream,
		ContentType: mime.lookup(filePath) || "application/octet-stream",
	};
	await storageClient.send(new PutObjectCommand(uploadParams));
	uploadedFiles += 1;
}

async function uploadDirectoryToS3(dir, basePath = "") {
	const items = fs.readdirSync(dir);
	const uploadPromises = items.map((item) => {
		const itemPath = path.join(dir, item);
		const stats = fs.statSync(itemPath);
		if (stats.isDirectory()) {
			return limit(() =>
				uploadDirectoryToS3(itemPath, `${basePath}${item}/`)
			);
		} else {
			const key = `${DEPLOYMENT_DIR_NAME}/${projectId}/${taskId}/${basePath}${item}`;
			return limit(() => uploadFileToS3(itemPath, key));
		}
	});
	await Promise.all(uploadPromises);
}

function displayProgress() {
	const progress = ((uploadedFiles / totalFiles) * 100).toFixed(2);
	console.log(
		`Progress: ${progress}% (${uploadedFiles}/${totalFiles} files moved for deployment)`
	);
}

(async () => {
	try {
		// Count total files before uploading
		countFiles(outputDirectory);
		console.log(
			`Started moving files from ${outputDirectory} for deployment.`
		);

		// Display progress every second
		const progressInterval = setInterval(displayProgress, 1000);

		await uploadDirectoryToS3(outputDirectory);

		clearInterval(progressInterval);
		displayProgress();
		console.log("Files successfully moved for deployment.");

		process.exit(0);
	} catch (err) {
		console.error(
			`Error during moving files for deployment: ${err.message}`
		);
		process.exit(1);
	}
})();
