FROM node:lts-slim

# Install necessary packages
RUN apt-get update && apt-get install -y git curl redis-server jq && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY updateTaskServer.js /app/updateTaskServer.js
COPY handleBuildFiles.js /app/handleBuildFiles.js
COPY script.sh /app/script.sh

# Make the script executable
RUN chmod +x /app/script.sh

# Convert to Unix-style line endings
RUN sed -i 's/\r$//' /app/script.sh

# Ensure Redis is running before starting the script
CMD service redis-server start && /app/script.sh
