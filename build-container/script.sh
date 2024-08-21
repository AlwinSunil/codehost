#!/bin/sh

if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION environment variable is not set."
  exit 1
fi

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "Error: AWS_ACCESS_KEY_ID environment variable is not set."
  exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS_SECRET_ACCESS_KEY environment variable is not set."
  exit 1
fi

if [ -z "$S3_BUCKET_NAME" ]; then
  echo "Error: S3_BUCKET_NAME environment variable is not set."
  exit 1
fi

if [ -z "$DEPLOYMENT_DIR_NAME" ]; then
  echo "Error: DEPLOYMENT_DIR_NAME environment variable is not set."
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is not set."
  exit 1
fi

# Check for necessary environment variables
if [ -z "$REPO_URL" ]; then
  echo "Error: REPO_URL environment variable is not set."
  exit 1
fi

if [ -z "$BRANCH_NAME" ]; then
  echo "Error: BRANCH_NAME environment variable is not set."
  exit 1
fi

if [ -z "$BUILD_DIR" ]; then
  echo "Error: BUILD_DIR environment variable is not set."
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is not set."
  exit 1
fi

# Create directory for repository
mkdir -p /app/repo

# Clone the repository and checkout the specified branch
git clone "$REPO_URL" /app/repo && cd /app/repo && git checkout "$BRANCH_NAME"

# Check if Node.js is installed
if ! command -v node >/dev/null; then
  echo "Node.js is not installed. Please install Node.js to proceed."
  exit 1
fi

# Install dependencies
echo "Starting npm install..."
npm install || exit 1
echo "npm install completed."

# Build the project
echo "Starting build..."
npm run build || {
  echo "Build failed."
  exit 1
}

echo "Build completed."

node /app/handleBuildFiles.mjs
