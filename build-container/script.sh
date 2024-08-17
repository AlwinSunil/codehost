#!/bin/sh

if [ -z "$REPO_URL" ]; then
  echo "Error: REPO_URL environment variable is not set."
  exit 1
fi

if [ -z "$BRANCH_NAME" ]; then
  echo "Error: BRANCH_NAME environment variable is not set."
  exit 1
fi

mkdir -p /app/repo

# Clone the repository and checkout the specified branch
git clone "$REPO_URL" /app/repo && cd /app/repo && git checkout "$BRANCH_NAME"

if ! command -v node > /dev/null; then
  echo "Node.js is not installed. Please install Node.js to proceed."
  exit 1
fi

# Install dependencies and build the project
npm install && npm run build

# Run business logic
node /app/print_files.js