FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 8000

# Start the application
CMD ["npm", "start"]
