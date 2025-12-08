# Multi-stage Dockerfile for Radio Elgean
# Supports both development and production builds

# ===== FRONTEND BUILD STAGE =====
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/server.js ./
COPY frontend/views ./views
COPY frontend/public ./public

# ===== BACKEND BUILD STAGE =====
FROM python:3.11-slim AS backend-builder
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --user --no-cache-dir -r requirements.txt

# ===== DEVELOPMENT IMAGE =====
FROM node:18-alpine AS development

WORKDIR /app

# Install Python in development image
RUN apk add --no-cache python3 py3-pip

# Copy frontend
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci

WORKDIR /app

# Copy backend
COPY backend ./backend
# Install directly since container is already isolated
RUN pip install --no-cache-dir --break-system-packages -r backend/requirements.txt

# Copy database
COPY database ./database

# Copy entrypoint
COPY entrypoint-dev.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Install nodemon for development
RUN npm install -g nodemon

ENV NODE_ENV=development
ENV FLASK_ENV=development

EXPOSE 3000 5001
ENTRYPOINT ["./entrypoint.sh"]

# ===== PRODUCTION IMAGE =====
FROM node:18-alpine AS production

WORKDIR /app

# Install Python runtime and pip
RUN apk add --no-cache python3 py3-pip

# Copy frontend from builder
COPY --from=frontend-builder /app/frontend ./frontend

# Copy backend
COPY backend ./backend

# Install Python dependencies
RUN pip install --no-cache-dir --break-system-packages -r backend/requirements.txt

# Copy database
COPY database ./database

# Copy entrypoint
COPY entrypoint-prod.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV FLASK_ENV=production

EXPOSE 3000 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["./entrypoint.sh"]
