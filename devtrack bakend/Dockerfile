# Base image
FROM node:18-alpine

# Working directory set karein
WORKDIR /app

# Dependencies copy & install
COPY package*.json ./
RUN npm install --production

# Application code copy
COPY . .

# Environment port expose
EXPOSE 5000

# Server start command
CMD ["node", "server.js"]