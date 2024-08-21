FROM node:lts-slim

# Install necessary packages
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY handleBuildFiles.mjs /app/handleBuildFiles.mjs
COPY script.sh /app/script.sh

# Make the script executable
RUN chmod +x /app/script.sh

# Set the script as the entry point
ENTRYPOINT [ "/app/script.sh" ]
