#!/bin/sh

# Path to the named pipe
PIPE=/tmp/logpipe
mkfifo "$PIPE"

# Function to send logs to the API
send_log() {
  local log_message=$1
  local response

  # Create JSON payload with jq
  json_payload=$(jq -n --arg log "$log_message" '{"log": $log}')

  # Send the log to the API
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "$json_payload" \
    http://localhost:3000/api/task/log)

  echo "LOG: $log_message"

  if [ "$response" -ne 200 ]; then
    echo "ERROR:INTERNAL_STATUS_SERVER: Failed to send log to API. HTTP status code: $response"
    exit 1
  fi
}

# Function to update build status
update_build_status() {
  local status=$1
  if ! curl -s -o /dev/null -X POST -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\", \"status\":\"$status\"}" \
    http://localhost:3000/api/task/update; then
    echo "Failed to update build status to $status"
    update_build_status "FAILED"
    exit 1
  fi
}

# Function to check if an environment variable is set
check_internal_env_var() {
  local var_name=$1
  local var_value=$2

  if [ -z "$var_value" ]; then
    echo "Error: $var_name environment variable is not set."
    update_build_status "FAILED"
    exit 1
  fi
}

check_project_env_var() {
  local var_name=$1
  local var_value=$2

  if [ -z "$var_value" ]; then
    echo "Error: $var_name is not set or available. Please ensure it is set."
    update_build_status "FAILED"
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
    update_build_status "FAILED"
    exit 1
  fi
}

# Start the task status server
echo "Starting task status server..."
node /app/updateTaskServer.js &

# Start a background process to read from the named pipe and send logs
(while IFS= read -r line; do send_log "$line"; done <"$PIPE") &

# Redirect stdout and stderr to the named pipe
exec >"$PIPE" 2>&1

# Wait for the server to start and become healthy
server_ready=false
for i in $(seq 1 4); do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/health | grep -q "200"; then
    server_ready=true
    break
  fi
  sleep 2
done

if [ "$server_ready" = false ]; then
  echo "Error: Task status server did not become healthy in given time."
  exit 1
fi

# Update status to BUILDING at the start
update_build_status "BUILDING"

# Required environment variables
check_internal_env_var "AWS_REGION" "$AWS_REGION"
check_internal_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
check_internal_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
check_internal_env_var "S3_BUCKET_NAME" "$S3_BUCKET_NAME"
check_internal_env_var "DEPLOYMENT_DIR_NAME" "$DEPLOYMENT_DIR_NAME"
check_internal_env_var "POSTGRES_PRISMA_URL" "$POSTGRES_PRISMA_URL"
check_internal_env_var "POSTGRES_URL_NON_POOLING" "$POSTGRES_URL_NON_POOLING"

# Check and validate other variables
check_project_env_var "PROJECT_ID" "$PROJECT_ID"
check_project_env_var "TASK_ID" "$TASK_ID"
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
if ! git clone --depth 1 "$REPO_URL" /app/repo || ! cd /app/repo || ! git checkout "$BRANCH_NAME"; then
  echo "Error: Failed to clone repository or checkout branch."
  update_build_status "FAILED"
  exit 1
fi

# Validate ROOT_DIR
if [ -z "$ROOT_DIR" ] || [ ! -d "$ROOT_DIR" ]; then
  echo "Error: The specified root directory '$ROOT_DIR' does not exist or is empty."
  update_build_status "FAILED"
  exit 1
fi

# Move to ROOT_DIR
if ! cd "$ROOT_DIR"; then
  echo "Error: Failed to change to root directory '$ROOT_DIR'."
  update_build_status "FAILED"
  exit 1
fi

# Check if Node.js is installed
if ! command -v node >/dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to proceed."
  update_build_status "FAILED"
  exit 1
fi

echo "Starting npm install..."
if ! eval "$INSTALL_COMMAND"; then
  echo "Error: npm install failed."
  update_build_status "FAILED"
  exit 1
fi

echo "Starting build..."
if ! eval "$BUILD_COMMAND"; then
  echo "Error: Build failed. Make sure 'build' script is defined in package.json."
  update_build_status "FAILED"
  exit 1
fi

# Validate OUTPUT_DIR
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Error: The specified output directory '$OUTPUT_DIR' does not exist."
  update_build_status "FAILED"
  exit 1
fi

echo "Starting file upload process..."
if node /app/handleBuildFiles.js; then
  update_build_status "COMPLETED"
  echo "Build completed successfully."
else
  echo "Error: File upload process failed."
  update_build_status "FAILED"
  exit 1
fi

# Clean up
rm "$PIPE"
