# Frontend Dockerfile for local development
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose Vite dev server port (matches vite.config.ts)
EXPOSE 8080

# Start the dev server with host flag to allow external connections
CMD ["npm", "run", "dev", "--", "--host"]
