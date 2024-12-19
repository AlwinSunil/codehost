FROM node:lts-alpine

WORKDIR /usr/src/app

# Install OpenSSL 1.1 and other required dependencies
RUN apk add --no-cache openssl zlib

# Verify OpenSSL version for compatibility
RUN ln -sf /usr/lib/libcrypto.so.1.1 /usr/lib/libcrypto.so && \
    ln -sf /usr/lib/libssl.so.1.1 /usr/lib/libssl.so

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Generate Prisma Client for Alpine Linux
RUN npx prisma generate

# Expose the application port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
