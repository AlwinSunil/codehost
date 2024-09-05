import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";
import mime from "mime-types";

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const DEPLOYMENT_DIR_NAME = process.env.DEPLOYMENT_DIR_NAME;

const outputDirectory = process.env.OUTPUT_DIR;
const projectId = process.env.PROJECT_ID;

console.log(`Build directory for the project: ${outputDirectory}`);

const s3Client = new S3Client({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
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
		Bucket: S3_BUCKET_NAME,
		Key: key,
		Body: fileStream,
		ContentType: mime.lookup(filePath) || "application/octet-stream",
	};
	await s3Client.send(new PutObjectCommand(uploadParams));
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
			const key = `${DEPLOYMENT_DIR_NAME}/${projectId}/${basePath}${item}`;
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
