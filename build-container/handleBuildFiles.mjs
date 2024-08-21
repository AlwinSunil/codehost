import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pLimit from "p-limit";

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const DEPLOYMENT_DIR_NAME = process.env.DEPLOYMENT_DIR_NAME;

const buildDirectory = process.env.BUILD_DIR;
const projectId = process.env.PROJECT_ID;

console.log(`Build directory for the project: ${buildDirectory}`);

// Initialize S3 client
const s3Client = new S3Client({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

// Set concurrency limit
const limit = pLimit(25);

let totalFiles = 0;
let uploadedFiles = 0;

// Count files in the directory
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

// Upload file to S3
async function uploadFileToS3(filePath, key) {
	try {
		const fileStream = fs.createReadStream(filePath);
		const uploadParams = {
			Bucket: S3_BUCKET_NAME,
			Key: key,
			Body: fileStream,
		};
		await s3Client.send(new PutObjectCommand(uploadParams));
		uploadedFiles += 1;
	} catch (err) {
		console.error(`Error uploading ${key}: ${err.message}`);
	}
}

// Upload directory to S3
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

// Display progress
function displayProgress() {
	const progress = ((uploadedFiles / totalFiles) * 100).toFixed(2);
	console.log(
		`Progress: ${progress}% (${uploadedFiles}/${totalFiles} files moved for deployment)`
	);
}

// Count total files
countFiles(buildDirectory);
console.log(`Started moving files from ${buildDirectory} for deployment.`);

// Start progress display every second
const progressInterval = setInterval(displayProgress, 1000);

// Start the upload
uploadDirectoryToS3(buildDirectory)
	.then(() => {
		clearInterval(progressInterval);
		displayProgress();
		console.log("Files successfully moved for deployment.");
	})
	.catch((err) => {
		clearInterval(progressInterval);
		console.error(`Error during upload: ${err.message}`);
	});
