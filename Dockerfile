# Frontend Dockerfile
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (for serving)
RUN npm ci --only=production

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Install a simple server to serve the built files
RUN npm install -g vite

# Expose port
EXPOSE 5173

# Start the dev server (for local development)
CMD ["npm", "run", "dev", "--", "--host"]
