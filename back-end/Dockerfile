FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose backend port (change if your app uses a different one)
EXPOSE 5000

# Start the backend
CMD ["node", "server.js"]
