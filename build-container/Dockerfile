FROM node:lts-slim

# Install necessary packages and clean up
RUN apt-get update && apt-get install -y git curl redis-server jq && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Install Prisma CLI globally
RUN npm install -g prisma

# Copy Prisma schema and other application files
COPY prisma ./prisma
COPY updateTaskServer.js /app/updateTaskServer.js
COPY handleBuildFiles.js /app/handleBuildFiles.js
COPY script.sh /app/script.sh

# Run Prisma generate and clean up
RUN prisma generate && npm uninstall -g prisma && rm -rf /app/prisma

# Make the script executable and convert line endings to Unix-style
RUN chmod +x /app/script.sh && sed -i 's/\r$//' /app/script.sh

# Ensure Redis is running before starting the script
CMD service redis-server start && /app/script.sh
