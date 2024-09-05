FROM node:lts-slim

# Install necessary packages
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
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

# Set the script as the entry point
ENTRYPOINT [ "/app/script.sh" ]
