# Multi-service Dockerfile for Tax Assistance AI
# Combines Backend API, Frontend, and RAG Chatbot in a single container
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

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend ./

# Copy RAG chatbot code
COPY Backend/RAG_CHATBOT ./rag

# Install RAG Python dependencies (using --break-system-packages for Alpine)
RUN cd rag && pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Build RAG vector database
RUN cd rag && python3 rebuild_vector_db.py

# Create necessary directories
RUN mkdir -p uploads logs

# Set environment variables
ENV RAG_SERVER_URL=http://localhost:5555
ENV FLASK_PORT=5555

# Expose port (Render sets PORT environment variable)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start both RAG server and backend
CMD ["sh", "-c", "cd rag && python3 flask_server.py & npm start"]