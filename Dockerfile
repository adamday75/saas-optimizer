# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy only the package manifest first – speeds up caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy rest of the app
COPY . .

# Use pm2-runtime to keep the process alive
CMD ["pm2-runtime", "pm2ecosystem.config.js"]
