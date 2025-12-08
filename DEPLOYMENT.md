# Radio Elgean Deployment Guide

This guide provides step-by-step instructions for deploying Radio Elgean to different environments using Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Cloud Deployments](#cloud-deployments)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Software

- **Docker** (version 20.10+)
  ```bash
  # Install on macOS
  brew install docker
  # Or download Docker Desktop from https://www.docker.com/products/docker-desktop
  ```

- **Docker Compose** (version 1.29+)
  ```bash
  # Usually included with Docker Desktop
  docker-compose --version
  ```

- **Git**
  ```bash
  brew install git
  ```

### System Requirements

| Environment | CPU | RAM | Disk |
|---|---|---|---|
| Development | 2 cores | 4 GB | 5 GB |
| Staging | 2 cores | 4 GB | 10 GB |
| Production | 4+ cores | 8 GB+ | 20 GB+ |

## Local Development

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd radio-elgean

# 2. Ensure you're on the master branch
git checkout master

# 3. Build and start development environment
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5001
```

### Development Features

- **Hot Reload**: Code changes automatically reload in the browser
- **Debug Mode**: Flask debug mode enabled for better error messages
- **Volume Mounts**: Source code mounted directly in container
- **Detailed Logging**: Enhanced logging for development

### Useful Development Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f radio-elgean

# Stop services
docker-compose down

# Remove volumes and start fresh
docker-compose down -v

# Rebuild without cache
docker-compose up --build --no-cache

# Execute command in container
docker-compose exec radio-elgean sh

# Reinitialize database
docker-compose exec radio-elgean python3 database/init_db.py
```

### Troubleshooting Development

**Port Already in Use:**
```bash
# Find and kill process
lsof -i :3000
lsof -i :5001
kill -9 <PID>

# Or change ports in docker-compose.yml
```

**Database Lock:**
```bash
# Remove database and reinitialize
rm database/radio_elgean.db
docker-compose up
```

**Module Not Found:**
```bash
# Rebuild with fresh dependencies
docker-compose down -v
docker-compose up --build --no-cache
```

## Staging Deployment

### Deploy to Staging Server

Staging is used for testing before production release.

#### Prerequisites

- Linux server (Ubuntu 22.04 LTS recommended)
- Docker installed
- SSH access to server
- Domain/IP for accessing application

#### Step-by-Step Deployment

```bash
# 1. SSH into staging server
ssh user@staging.server.com

# 2. Clone repository
git clone <repository-url>
cd radio-elgean

# 3. Configure environment
cp .env.production .env.staging
# Edit .env.staging with staging values
nano .env.staging

# 4. Create production compose file variant
cat > docker-compose.staging.yml << 'EOF'
version: '3.8'
services:
  radio-elgean:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: radio-elgean-staging
    restart: always
    ports:
      - "3000:3000"
      - "5001:5001"
    volumes:
      - ./data:/app/database
    environment:
      - NODE_ENV=production
      - FLASK_ENV=production
    env_file:
      - .env.staging
    networks:
      - radio-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  radio-network:
    driver: bridge
EOF

# 5. Start staging environment
docker-compose -f docker-compose.staging.yml up -d --build

# 6. Verify deployment
docker-compose -f docker-compose.staging.yml ps
docker-compose -f docker-compose.staging.yml logs
```

#### Testing Staging

```bash
# Check if services are running
curl http://localhost:3000
curl http://localhost:5001

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Run tests or manual validation
# ...

# Stop for updates
docker-compose -f docker-compose.staging.yml down

# Redeploy after code changes
git pull
docker-compose -f docker-compose.staging.yml up -d --build
```

## Production Deployment

### Architecture Recommendations

For production, consider using:

- **Container Orchestration**: Kubernetes, Docker Swarm, or ECS
- **Reverse Proxy**: Nginx with SSL/TLS termination
- **Load Balancing**: Distribute traffic across multiple instances
- **Persistent Storage**: Separate database volume
- **Monitoring**: Container health checks and alerting
- **Backup**: Regular database backups

### Simple Production Deployment

This is suitable for small to medium deployments on a single server.

#### Prerequisites

- Ubuntu 22.04 LTS server
- Docker and Docker Compose installed
- Domain name (with DNS configured)
- SSL certificate (Let's Encrypt recommended)

#### Deployment Steps

```bash
# 1. SSH into production server
ssh user@prod.server.com

# 2. Clone repository
git clone <repository-url>
cd radio-elgean

# 3. Create production environment file
cp .env.production .env.prod
# IMPORTANT: Update with production values
nano .env.prod

# Update SECRET_KEY
SECRET_KEY=$(openssl rand -hex 32)
sed -i "s/change-this-to-a-strong-random-secret-in-production/$SECRET_KEY/" .env.prod

# 4. Create data directory for persistent storage
mkdir -p data
chmod 755 data

# 5. Build production image
docker build --target production -t radio-elgean:latest .

# 6. Start production environment
docker-compose -f docker-compose.prod.yml up -d

# 7. Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs

# 8. Test application
curl http://localhost:3000
curl http://localhost:5001/api/user-ip
```

#### Adding SSL/TLS with Nginx

```bash
# 1. Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx configuration
sudo tee /etc/nginx/sites-available/radio-elgean > /dev/null <<'EOF'
upstream radio_frontend {
    server localhost:3000;
}

upstream radio_api {
    server localhost:5001;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://radio_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://radio_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/radio-elgean /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 4. Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# 5. Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Update .env.prod with HTTPS URL
FLASK_API_URL=https://yourdomain.com/api
# Update in .env.prod and restart containers
docker-compose -f docker-compose.prod.yml restart
```

### Production Monitoring

```bash
# Monitor container resource usage
docker stats

# View logs with timestamps
docker-compose -f docker-compose.prod.yml logs --timestamps -f

# Check container health
docker-compose -f docker-compose.prod.yml ps

# Inspect container
docker inspect radio-elgean-prod
```

### Production Updates

```bash
# 1. Pull latest changes
git pull origin master

# 2. Build new image
docker build --target production -t radio-elgean:latest .

# 3. Stop current container
docker-compose -f docker-compose.prod.yml down

# 4. Start with new image
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### Backup & Recovery

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  cp database/radio_elgean.db data/radio_elgean.db.backup

# Or with timestamp
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  cp database/radio_elgean.db data/radio_elgean.db.$(date +%Y%m%d_%H%M%S).backup

# Restore from backup
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  cp data/radio_elgean.db.backup database/radio_elgean.db

# Automated daily backups with cron
# 1. Create backup script
cat > /home/user/backup-radio-elgean.sh << 'EOF'
#!/bin/bash
cd /home/user/radio-elgean
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  cp database/radio_elgean.db data/radio_elgean.db.$(date +%Y%m%d_%H%M%S).backup
# Keep only last 30 days
find data -name "*.backup" -mtime +30 -delete
EOF

chmod +x /home/user/backup-radio-elgean.sh

# 2. Add to crontab
crontab -e
# Add: 0 2 * * * /home/user/backup-radio-elgean.sh
```

## Cloud Deployments

### AWS ECS with Fargate

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name radio-elgean

# 2. Build and push image
docker build --target production -t radio-elgean:latest .
docker tag radio-elgean:latest <account-id>.dkr.ecr.<region>.amazonaws.com/radio-elgean:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/radio-elgean:latest

# 3. Create ECS cluster and task definition
# See AWS documentation for detailed steps
```

### Google Cloud Run

```bash
# 1. Build for Cloud Run
gcloud builds submit --tag gcr.io/<project-id>/radio-elgean

# 2. Deploy
gcloud run deploy radio-elgean \
  --image gcr.io/<project-id>/radio-elgean \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --memory 512M
```

### Azure Container Instances

```bash
# 1. Push to Azure Container Registry
az acr build --registry <registry-name> \
  --image radio-elgean:latest .

# 2. Deploy container
az container create \
  --resource-group <group-name> \
  --name radio-elgean \
  --image <registry-name>.azurecr.io/radio-elgean:latest \
  --ports 3000 5001 \
  --memory 1
```

### DigitalOcean App Platform

```bash
# 1. Create app.yaml
cat > app.yaml << 'EOF'
name: radio-elgean
services:
- name: web
  github:
    repo: <github-user>/radio-elgean
    branch: master
  build_command: docker build --target production -t radio-elgean:latest .
  http_port: 3000
EOF

# 2. Deploy
doctl apps create --spec app.yaml
```

## Monitoring & Maintenance

### Health Checks

```bash
# Frontend health
curl -s http://localhost:3000 | head -20

# API health
curl -s http://localhost:5001 | jq

# Database connectivity
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  python3 -c "from backend.db_utils import get_db_connection; get_db_connection()"
```

### Logging

```bash
# View current logs
docker-compose -f docker-compose.prod.yml logs

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f

# Logs for specific time range
docker-compose -f docker-compose.prod.yml logs --since 2024-01-01
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# CPU and memory usage
docker stats radio-elgean-prod --no-stream

# Disk usage
du -sh data/
```

### Database Maintenance

```bash
# Check database integrity
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  sqlite3 database/radio_elgean.db "PRAGMA integrity_check;"

# Optimize database
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  sqlite3 database/radio_elgean.db "VACUUM;"

# Get database statistics
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  sqlite3 database/radio_elgean.db ".tables"
```

### Regular Maintenance Tasks

| Task | Frequency | Command |
|---|---|---|
| Backup database | Daily | See backup section |
| Update dependencies | Monthly | `git pull && docker-compose build --no-cache` |
| Check disk space | Weekly | `df -h` |
| Review logs | Daily | `docker-compose logs` |
| Security updates | As needed | `apt update && apt upgrade` |

## Security Best Practices

1. **Secrets Management**
   - Use `.env.production` for secrets
   - Never commit sensitive data
   - Rotate SECRET_KEY regularly

2. **Network Security**
   - Use HTTPS/TLS in production
   - Enable firewall rules
   - Use private Docker networks

3. **Access Control**
   - Restrict SSH access
   - Use key-based authentication
   - Monitor who has access

4. **Container Security**
   - Regularly update base images
   - Scan images for vulnerabilities
   - Run containers as non-root user

5. **Data Protection**
   - Regular backups
   - Encrypted connections
   - Database access restrictions

## Troubleshooting Production Issues

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs radio-elgean

# Common issues:
# - Port already in use: netstat -tlnp | grep LISTEN
# - Permission denied: sudo chown -R $USER: data/
# - Disk full: df -h
```

### Application Slow

```bash
# Check resources
docker stats radio-elgean-prod

# Check database
sqlite3 data/radio_elgean.db ".tables"
sqlite3 data/radio_elgean.db "SELECT COUNT(*) FROM track_likes;"

# Check network
docker network inspect radio-network
```

### Database Issues

```bash
# Recover corrupted database
docker-compose -f docker-compose.prod.yml down
rm data/radio_elgean.db
docker-compose -f docker-compose.prod.yml up -d

# Check specific issues
docker-compose -f docker-compose.prod.yml exec radio-elgean \
  sqlite3 database/radio_elgean.db "PRAGMA quick_check;"
```

## Getting Help

- Check [DOCKER.md](DOCKER.md) for Docker-specific questions
- Review container logs: `docker-compose logs -f`
- Inspect running containers: `docker ps -a`
- Check system resources: `docker stats`
