#!/bin/sh

# Function to check if an environment variable is set
check_internal_env_var() {
  local var_name=$1
  local var_value=$2

  if [ -z "$var_value" ]; then
    echo "Error: $var_name environment variable is not set."
    exit 1
  fi
}

check_project_env_var() {
  local var_name=$1
  local var_value=$2

  if [ -z "$var_value" ]; then
    echo "Error: $var_name is not set or available. Please ensure it is set."
    exit 1
  fi
}

# Function to validate environment variables for malicious content
validate_project_env() {
  local var_name=$1
  local var_value=$2

  # Forbidden patterns: block command injection, special characters, and dangerous commands
  forbidden_patterns='(&&|\|\||;|`|>|<|\$|cat|less|more|printenv|env|rm|mv|curl|wget)'

  if echo "$var_value" | grep -E "$forbidden_patterns" >/dev/null; then
    echo "Error: Potentially malicious content detected in $var_name."
    exit 1
  fi
}

# Required environment variables
check_internal_env_var "AWS_REGION" "$AWS_REGION"
check_internal_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
check_internal_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
check_internal_env_var "S3_BUCKET_NAME" "$S3_BUCKET_NAME"
check_internal_env_var "DEPLOYMENT_DIR_NAME" "$DEPLOYMENT_DIR_NAME"

# Check and validate other variables
check_project_env_var "PROJECT_ID" "$PROJECT_ID"
check_project_env_var "REPO_URL" "$REPO_URL"
check_project_env_var "BRANCH_NAME" "$BRANCH_NAME"
check_project_env_var "ROOT_DIR" "$ROOT_DIR"
check_project_env_var "INSTALL_COMMAND" "$INSTALL_COMMAND"
check_project_env_var "BUILD_COMMAND" "$BUILD_COMMAND"
check_project_env_var "OUTPUT_DIR" "$OUTPUT_DIR"

validate_project_env "REPO_URL" "$REPO_URL"
validate_project_env "BRANCH_NAME" "$BRANCH_NAME"
validate_project_env "INSTALL_COMMAND" "$INSTALL_COMMAND"
validate_project_env "BUILD_COMMAND" "$BUILD_COMMAND"
validate_project_env "OUTPUT_DIR" "$OUTPUT_DIR"

# Create directory for repository
mkdir -p /app/repo

# Clone the repository and checkout the specified branch
git clone --depth 1 "$REPO_URL" /app/repo && cd /app/repo && git checkout "$BRANCH_NAME" || {
  echo "Error: Failed to clone repository or checkout branch."
  exit 1
}

# Validate ROOT_DIR
if [ -z "$ROOT_DIR" ] || [ ! -d "$ROOT_DIR" ]; then
  echo "Error: The specified root directory '$ROOT_DIR' does not exist or is empty."
  exit 1
fi

# Move to ROOT_DIR
cd "$ROOT_DIR" || {
  echo "Error: Failed to change to root directory '$ROOT_DIR'."
  exit 1
}

# Check if Node.js is installed
if ! command -v node >/dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to proceed."
  exit 1
fi

# Install dependencies
echo "Starting npm install..."
if ! "$INSTALL_COMMAND"; then
  echo "Error: npm install failed."
  exit 1
fi
echo "npm install completed."

# Build the project
echo "Starting build..."
if ! "$BUILD_COMMAND"; then
  echo "Error: Build failed."
  exit 1
fi
echo "Build completed."

# Validate OUTPUT_DIR
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Error: The specified output directory '$OUTPUT_DIR' does not exist."
  exit 1
fi

# Run additional script
node /app/handleBuildFiles.mjs || {
  echo "Error: Failed to handle build files."
  exit 1
}

echo "Build completed successfully."
