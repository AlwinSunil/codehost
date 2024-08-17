const fs = require("fs");
const path = require("path");

const directoryToList = process.env.BUILD_DIR || "dist";

function listFiles(dir, indent = "") {
	try {
		// Read the contents of the directory
		const items = fs.readdirSync(dir);

		items.forEach((item) => {
			const itemPath = path.join(dir, item);
			const stats = fs.statSync(itemPath);

			if (stats.isDirectory()) {
				// Recursively list files in subdirectories
				listFiles(itemPath, `${indent}${item}/`);
			} else {
				// Print file names
				console.log(`${indent}${item}`);
			}
		});
	} catch (err) {
		console.error(`Error reading directory ${dir}: ${err.message}`);
	}
}

listFiles(directoryToList);
