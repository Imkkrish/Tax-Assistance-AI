# Multi-service Dockerfile for Tax Assistance AI
# Combines Backend API and Frontend in a single container
FROM node:18-alpine as frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY Frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY Frontend/ ./

# Build frontend
RUN npm run build

# Backend stage
FROM node:18-alpine as backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY Backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source
COPY Backend/ ./

# Copy built frontend to backend's dist directory
COPY --from=frontend-build /app/frontend/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend ./

# Create necessary directories
RUN mkdir -p uploads logs

# Expose port (Render sets PORT environment variable)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
