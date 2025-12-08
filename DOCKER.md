# Docker Deployment Guide - Radio Elgean

This document provides instructions for building and running Radio Elgean in Docker containers with separate development and production configurations.

## Quick Start

### Development Environment

Run the development environment with hot-reload support:

```bash
docker-compose up --build
```

This will:
- Build the development image with hot-reload capabilities
- Start both Flask backend (port 5001) and Express frontend (port 3000)
- Mount source code volumes for live updates
- Enable nodemon for frontend changes
- Enable Flask debug mode

Access the application at: **http://localhost:3000**

### Production Environment

Run the production environment with optimized images:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

This will:
- Build the optimized production image
- Start both services with proper resource limits
- Enable automatic restart on failure
- Include health checks
- Minimize image size and dependencies

## Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build pattern to create two separate target images:

```
Dockerfile
├── Stage 1: frontend-builder
│   └── Builds minimal Node.js dependencies
├── Stage 2: backend-builder
│   └── Builds minimal Python dependencies
├── Target 1: development
│   ├── Full Node and Python with dev tools
│   ├── Code mounted as volumes
│   └── ~1.2GB image size
└── Target 2: production
    ├── Only runtime dependencies
    ├── Pre-built code copied in
    └── ~500MB image size
```

### Service Architecture

Both services run in a single container with coordinated startup:

```
Container
├── Flask Backend (port 5001)
│   └── SQLite database at /app/database
└── Express Frontend (port 3000)
    └── Proxies to Flask backend
```

## Configuration

### Development Configuration (`.env.development`)

```
NODE_ENV=development
FLASK_ENV=development
PORT=3000
FLASK_API_URL=http://localhost:5001
FLASK_PORT=5001
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=true
LOG_LEVEL=debug
```

### Production Configuration (`.env.production`)

```
NODE_ENV=production
FLASK_ENV=production
PORT=3000
FLASK_API_URL=http://localhost:5001
FLASK_PORT=5001
SECRET_KEY=<CHANGE-TO-STRONG-SECRET>
DEBUG=false
LOG_LEVEL=warning
```

**Important:** Before deploying to production, update `.env.production` with your own secret key:

```bash
# Generate a strong secret key
openssl rand -hex 32
# Copy the output and update SECRET_KEY in .env.production
```

## File Structure

```
radio-elgean/
├── Dockerfile                 # Multi-stage build for dev and prod
├── docker-compose.yml         # Development orchestration
├── docker-compose.prod.yml    # Production orchestration
├── .dockerignore              # Files to exclude from Docker build
├── .env.development           # Development environment variables
├── .env.production            # Production environment variables
├── docker/
│   ├── entrypoint-dev.sh     # Development startup script
│   └── entrypoint-prod.sh    # Production startup script
├── frontend/
│   ├── server.js             # Express server
│   ├── package.json          # Node dependencies
│   ├── public/               # Static assets
│   └── views/                # EJS templates
├── backend/
│   ├── app.py                # Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── models.py             # Database models
│   └── config.py             # Configuration
└── database/
    ├── init_db.py            # Database initialization
    └── schema.sql            # Database schema
```

## Build Commands

### Development Build

```bash
# Build the development image
docker build --target development -t radio-elgean:dev .

# Run the development container
docker run -it \
  -p 3000:3000 \
  -p 5001:5001 \
  -v $(pwd)/frontend:/app/frontend \
  -v $(pwd)/backend:/app/backend \
  -v $(pwd)/database:/app/database \
  -v /app/frontend/node_modules \
  -v /app/backend/venv \
  radio-elgean:dev
```

### Production Build

```bash
# Build the production image
docker build --target production -t radio-elgean:prod .

# Run the production container
docker run -d \
  --restart always \
  -p 3000:3000 \
  -p 5001:5001 \
  -v $(pwd)/data:/app/database \
  --name radio-elgean-prod \
  radio-elgean:prod
```

## Docker Compose Usage

### Development

```bash
# Start development environment with auto-rebuild on code changes
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove images and volumes
docker-compose down -v
```

### Production

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check health status
docker-compose -f docker-compose.prod.yml ps
```

## Deployment Scenarios

### Local Development

```bash
# Clone or pull the repository
git clone <repo-url>
cd radio-elgean

# Start dev environment
docker-compose up

# Access at http://localhost:3000
```

### Staging Server

```bash
# Build production image
docker build --target production -t radio-elgean:latest .

# Save image for transfer
docker save radio-elgean:latest | gzip > radio-elgean.tar.gz

# On staging server, load and run
docker load < radio-elgean.tar.gz
docker-compose -f docker-compose.prod.yml up -d
```

### Production Server (Docker Hub)

```bash
# Build and tag image
docker build --target production -t myregistry/radio-elgean:1.0.0 .
docker build --target production -t myregistry/radio-elgean:latest .

# Push to registry
docker push myregistry/radio-elgean:1.0.0
docker push myregistry/radio-elgean:latest

# On production server, pull and run
docker pull myregistry/radio-elgean:latest
docker-compose -f docker-compose.prod.yml up -d
```

## Networking

### Development Network

Services communicate via Docker bridge network named `radio-network`:
- Frontend can reach backend at `http://radio-elgean:5001`
- Frontend container port 3000 maps to host 3000
- Backend container port 5001 maps to host 5001

### Production Network

Same `radio-network` with:
- Service restart policy: `always`
- Health checks every 30 seconds
- Isolated from other containers

## Volumes

### Development Volumes

| Mount Point | Host Path | Purpose |
|---|---|---|
| `/app/frontend` | `./frontend` | Frontend source code (hot-reload) |
| `/app/backend` | `./backend` | Backend source code (hot-reload) |
| `/app/database` | `./database` | Database files |
| `/app/frontend/node_modules` | Named volume | Preserve node_modules |
| `/app/backend/venv` | Named volume | Preserve virtual environment |

### Production Volumes

| Mount Point | Host Path | Purpose |
|---|---|---|
| `/app/database` | `./data` | Database files (persistent) |

## Health Checks

### Development

No health check (for flexibility during development).

### Production

Runs every 30 seconds:
```bash
wget --quiet --tries=1 --spider http://localhost:3000
```

Fails after 3 consecutive failures with 10-second timeout.

## Resource Limits (Production)

```yaml
CPU Limits:   1.0 core (hard), 0.5 core (reservation)
Memory Limits: 512 MB (hard), 256 MB (reservation)
```

Adjust in `docker-compose.prod.yml` based on your infrastructure.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or use different ports in docker-compose
# Edit ports section: "3001:3000" and "5002:5001"
```

### Database Lock Error

```bash
# Remove and reinitialize database
rm database/radio_elgean.db
docker-compose up

# Or in production
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  python3 database/init_db.py
```

## Database Initialization

The entrypoint scripts (`entrypoint-dev.sh` and `entrypoint-prod.sh`) automatically handle database initialization on container startup.

### Automatic Database Initialization

When the container starts, the entrypoint script:

1. **Checks for database file**: If `/app/database/radio_elgean.db` doesn't exist, it creates it
2. **Checks for required tables**: Uses SQLite to verify if the `track_likes` table exists
3. **Initializes schema if needed**: If tables are missing, applies `database/schema.sql`

### Database Schema

The radio player application requires one main table:

```sql
CREATE TABLE IF NOT EXISTS track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,  -- Format: "Artist|Title"
    user_fingerprint TEXT NOT NULL,  -- Hashed browser fingerprint
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);
```

This table stores user likes for tracks using browser fingerprinting for anonymous user tracking.

### Initialization Process

**Development Environment:**
- Database is mounted from `./database` to `/app/database`
- First run: Creates database and initializes schema automatically
- Subsequent runs: Checks if table exists, only initializes if missing
- Can use either `schema.sql` or `init_db.py` for initialization

**Production Environment:**
- Database is mounted from `./data` to `/app/database`
- First run: Creates database and initializes schema automatically
- Subsequent runs: Checks if table exists, only initializes if missing
- Uses `schema.sql` for schema initialization (more reliable)

### Manual Database Reset

If you need to reset the database:

**Development:**
```bash
rm database/radio_elgean.db
docker-compose down
docker-compose up --build
```

**Production:**
```bash
rm data/radio_elgean.db
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build
```

### Verifying Database Tables

To check if tables were created successfully:

```bash
# Development
docker-compose exec radio-elgean sqlite3 database/radio_elgean.db ".tables"

# Production
docker-compose -f docker-compose.prod.yml exec radio-elgean sqlite3 database/radio_elgean.db ".tables"
```

Should output: `track_likes`

### Troubleshooting Database Issues

**No such table: track_likes**

If you encounter this error after updating the code:
1. The table initialization may have failed
2. Check container logs: `docker-compose logs radio-elgean`
3. Verify schema file exists: `database/schema.sql`
4. Reset database and restart container (see "Manual Database Reset" above)

### Container Won't Start

```bash
# Check logs
docker-compose logs radio-elgean

# Or for production
docker-compose -f docker-compose.prod.yml logs radio-elgean

# Rebuild without cache
docker-compose up --build --no-cache
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase limits in docker-compose.prod.yml
# Or reduce number of concurrent requests
```

### Network Issues

```bash
# Test connectivity between containers
docker-compose exec radio-elgean ping localhost

# Check network
docker network ls
docker network inspect radio-network

# Restart network
docker-compose down
docker network prune
docker-compose up
```

## Performance Optimization

### Development Build Size

The development image is ~1.2GB and includes dev dependencies. This is intentional for a full development experience.

### Production Build Size

The production image is ~500MB with only runtime dependencies. To further optimize:

1. **Use Alpine Linux**: Already using alpine for smaller base image
2. **Multi-stage builds**: Already implemented
3. **Remove unnecessary files**: Configure in `.dockerignore`

### Runtime Performance

```bash
# Monitor resource usage
docker stats radio-elgean-prod

# Check container processes
docker exec radio-elgean-prod ps aux

# Profile database queries
# Check Flask logs with LOG_LEVEL=debug
```

## Security Considerations

1. **Secret Key**: Change `SECRET_KEY` in `.env.production`
2. **Image Registry**: Use private registry for production images
3. **Network**: Use custom network (already configured)
4. **Secrets Management**: Consider using Docker Secrets or external secret manager
5. **Logging**: Monitor container logs for security events
6. **Updates**: Regularly update base images and dependencies

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Push

on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build production image
        run: docker build --target production -t radio-elgean:latest .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag radio-elgean:latest myregistry/radio-elgean:latest
          docker push myregistry/radio-elgean:latest
```

## Maintenance

### Regular Updates

```bash
# Update base images
docker pull node:18-alpine
docker pull python:3.11-slim

# Rebuild
docker-compose build --no-cache

# Test
docker-compose up

# Push updates
docker push myregistry/radio-elgean:latest
```

### Cleaning Up

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (be careful!)
docker system prune -a
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Node.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Best Practices for Python in Docker](https://docs.docker.com/language/python/)
- [Container Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
