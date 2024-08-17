FROM node:lts-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY script.sh /app/script.sh
COPY print_files.js /app/print_files.js

RUN chmod +x /app/script.sh

ENTRYPOINT ["/app/script.sh"]