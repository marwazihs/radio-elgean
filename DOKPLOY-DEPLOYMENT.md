# Deploying Radio Elgean to VPS using Dokploy

This guide provides complete step-by-step instructions for deploying Radio Elgean to a Virtual Private Server (VPS) using Dokploy - a self-hosted Platform as a Service (PaaS) that simplifies Docker deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: VPS Setup and Dokploy Installation](#phase-1-vps-setup-and-dokploy-installation)
3. [Phase 2: Configure Dokploy for Radio Elgean](#phase-2-configure-dokploy-for-radio-elgean)
4. [Phase 3: Environment Variables Configuration](#phase-3-environment-variables-configuration)
5. [Phase 4: Port and Domain Configuration](#phase-4-port-and-domain-configuration)
6. [Phase 5: Deployment Execution](#phase-5-deployment-execution)
7. [Phase 6: Post-Deployment Configuration](#phase-6-post-deployment-configuration)
8. [Phase 7: Monitoring and Maintenance](#phase-7-monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Alternative: Manual Docker Deployment](#alternative-manual-docker-deployment)

## Prerequisites

### VPS Requirements

- **Operating System**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **Resources**: Minimum 2GB RAM, 2 CPU cores
- **Storage**: 20GB+ available disk space
- **Access**: Root or sudo privileges
- **Network**: Public IP address
- **Domain** (optional but recommended): Custom domain for SSL/HTTPS

### Local Requirements

- SSH client to access VPS
- GitHub repository with latest code pushed
- Domain DNS access (if using custom domain)

### Important: No Code Changes Required

Your Radio Elgean application is already fully production-ready for Dokploy deployment:

- ✅ `docker-compose.prod.yml` - Production configuration ready
- ✅ `Dockerfile` with production target - Optimized build (~500MB)
- ✅ Environment variables properly implemented in code
- ✅ Database auto-initialization configured
- ✅ Health checks and resource limits set
- ✅ Volume persistence configured

## Phase 1: VPS Setup and Dokploy Installation

### 1.1 Connect to VPS

```bash
ssh root@YOUR_VPS_IP
# Or if using non-root user:
ssh your_username@YOUR_VPS_IP
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Dokploy

Dokploy provides an automated installation script that handles all dependencies:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

This script will automatically:
- Install Docker Engine and Docker Compose
- Install Dokploy and its dependencies
- Set up Traefik reverse proxy for routing
- Configure SSL certificate provisioning (Let's Encrypt)
- Start Dokploy service on port 3000

**Installation typically takes 2-5 minutes.**

### 1.4 Access Dokploy Dashboard

Once installation completes, access the dashboard:

```
http://YOUR_VPS_IP:3000
```

**First-time Setup:**
1. Create your admin account (username, email, password)
2. Complete the onboarding wizard
3. You'll see the Dokploy dashboard

## Phase 2: Configure Dokploy for Radio Elgean

### 2.1 Create New Project

1. Click **"New Project"** button
2. Fill in project details:
   - **Name**: `radio-elgean`
   - **Description**: "Live Radio Streaming Player"
3. Click **"Create Project"**

### 2.2 Add Application

1. Inside your project, click **"Add Application"**
2. Select application type:
   - **Type**: "Docker Compose"
   - **Name**: `radio-elgean-app`
3. Click **"Create Application"**

### 2.3 Connect GitHub Repository

1. Navigate to **"Source"** or **"Git"** tab
2. Configure repository settings:
   - **Repository URL**: `https://github.com/marwazihs/radio-elgean.git`
   - **Branch**: `master`
   - **Auto-deploy on push**: Enable (optional - redeploys automatically when you push to GitHub)
3. Click **"Save"**

### 2.4 Configure Build Settings

1. Navigate to **"Build"** or **"Docker"** tab
2. Configure build settings:
   - **Dockerfile path**: `./Dockerfile`
   - **Build target**: `production`
   - **Docker Compose file**: `docker-compose.prod.yml`
3. Click **"Save"**

## Phase 3: Environment Variables Configuration

### 3.1 Generate SECRET_KEY

On your local machine or VPS, generate a strong secret key:

```bash
openssl rand -hex 32
```

Copy the output (e.g., `a3f5d9e8c2b7a1f4e6d8c3b9a5e7f2d4c8b6a9e3f7d1c5b8a4e9f6d2c7b3a8e5f1d9`)

### 3.2 Add Environment Variables in Dokploy

1. Navigate to **"Environment Variables"** or **"Config"** tab
2. Click **"Add Variable"** and add each of the following:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Node.js environment mode |
| `FLASK_ENV` | `production` | Flask environment mode |
| `PORT` | `3000` | Frontend Express server port |
| `FLASK_PORT` | `5001` | Backend Flask API port |
| `SECRET_KEY` | `<your-generated-key>` | Secret key for Flask sessions (paste from 3.1) |
| `DEBUG` | `false` | Disable debug mode in production |
| `LOG_LEVEL` | `warning` | Minimal logging for production |

3. Click **"Save"** after adding all variables

**Security Note:** Never commit the actual `.env.production` file to git. The SECRET_KEY should remain secret.

## Phase 4: Port and Domain Configuration

### 4.1 Configure Ports in Dokploy

1. Navigate to **"Ports"** or **"Network"** tab
2. Configure port mappings:
   - **Frontend (Internal)**: 3000 → **External**: 80 (HTTP) / 443 (HTTPS)
   - **Backend (Internal)**: 5001 → **External**: 5001

### 4.2 Option A - Using Custom Domain (Recommended)

**Step 1: Add Domain in Dokploy**
1. Navigate to **"Domains"** tab
2. Click **"Add Domain"**
3. Enter your domain: `radio.yourdomain.com`
4. Enable **"SSL/HTTPS"** (Dokploy will auto-provision Let's Encrypt certificate)
5. Click **"Save"**

**Step 2: Configure DNS at Your Domain Registrar**

Add an A record pointing to your VPS IP:

```
Type:  A
Name:  radio (or @ for root domain)
Value: YOUR_VPS_IP
TTL:   3600
```

**Example DNS Configuration:**
- **GoDaddy**: DNS Management → Add Record → Type A → Host: radio → Points to: YOUR_VPS_IP
- **Cloudflare**: DNS → Add Record → Type A → Name: radio → IPv4 address: YOUR_VPS_IP
- **Namecheap**: Advanced DNS → Add New Record → Type A → Host: radio → Value: YOUR_VPS_IP

**Step 3: Wait for DNS Propagation**
- DNS changes typically take 5-15 minutes
- Check propagation: `nslookup radio.yourdomain.com`

**Step 4: SSL Certificate Provisioning**
- Dokploy automatically requests Let's Encrypt certificate
- Certificate provisioning takes 1-3 minutes
- Verify HTTPS works: `https://radio.yourdomain.com`

### 4.3 Option B - Using IP Address Only

If you don't have a domain, access via IP:

```
http://YOUR_VPS_IP
```

**Note:** SSL/HTTPS requires a domain name. IP-only deployments use HTTP.

## Phase 5: Deployment Execution

### 5.1 Trigger Initial Deployment

1. Navigate to your application in Dokploy
2. Click the **"Deploy"** button (usually green)
3. Dokploy will execute the following automatically:
   - Clone repository from GitHub
   - Build Docker image using `Dockerfile` with `production` target
   - Pull base images (Node.js, Python)
   - Run `docker-compose.prod.yml`
   - Initialize SQLite database (automatic via entrypoint script)
   - Start Flask backend on port 5001
   - Start Express frontend on port 3000
   - Configure Traefik reverse proxy routes
   - Provision SSL certificate (if domain configured)

**Deployment typically takes 3-7 minutes on first run.**

### 5.2 Monitor Deployment Progress

**Real-time Logs:**
1. Navigate to **"Logs"** tab in Dokploy
2. Watch build and startup logs in real-time
3. Look for success indicators:
   ```
   ✓ Database initialized successfully
   ✓ Flask backend starting on port 5001
   ✓ Express frontend starting on port 3000
   ✓ Health check passed
   ```

**Deployment Status:**
- **Building**: Docker image is being built
- **Starting**: Containers are starting up
- **Running**: Application is live
- **Healthy**: Health checks passing

### 5.3 Verify Deployment

**Test Frontend (Web Interface):**

```bash
# Using IP
curl http://YOUR_VPS_IP

# Using domain
curl https://radio.yourdomain.com
```

Expected: HTML response with radio player interface

**Test Backend API:**

```bash
# Using IP
curl http://YOUR_VPS_IP:5001

# Using domain
curl https://radio.yourdomain.com:5001
```

Expected response:
```json
{
  "status": "ok",
  "message": "Flask API is running"
}
```

**Test Like Feature API:**

```bash
curl -X POST http://YOUR_VPS_IP:5001/api/tracks/is-liked \
  -H "Content-Type: application/json" \
  -d '{"track_identifier": "test|track", "user_fingerprint": "test123"}'
```

Expected response:
```json
{
  "status": "success",
  "liked": false,
  "like_count": 0
}
```

**Open in Browser:**
- Navigate to `http://YOUR_VPS_IP` or `https://radio.yourdomain.com`
- Verify radio player loads
- Click Start to test HLS streaming
- Verify metadata updates (artist, title, album art)
- Test like button functionality

## Phase 6: Post-Deployment Configuration

### 6.1 Configure Firewall

Secure your VPS by configuring UFW (Uncomplicated Firewall):

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Allow SSH (port 22) - IMPORTANT: Don't lock yourself out!
sudo ufw allow 22/tcp

# Allow Dokploy dashboard (port 3000)
sudo ufw allow 3000/tcp

# Allow Flask API (port 5001) - optional, if direct access needed
sudo ufw allow 5001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Security Warning:** Always allow SSH (port 22) before enabling UFW, or you may lock yourself out of the VPS.

### 6.2 Set Up Auto-Deployment (Optional)

Enable automatic redeployment when you push code to GitHub:

1. In Dokploy, navigate to **"Settings"** or **"Git"** tab
2. Enable **"Auto Deploy on Push"**
3. Dokploy will provide a webhook URL
4. Add webhook to GitHub repository:
   - Go to GitHub repo → Settings → Webhooks → Add webhook
   - Paste Dokploy webhook URL
   - Content type: `application/json`
   - Events: `Just the push event`
   - Click **"Add webhook"**

Now whenever you push to master branch, Dokploy automatically redeploys.

### 6.3 Configure Database Backups

**Create Backup Script:**

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Create backup directory
mkdir -p /root/backups

# Create backup script
nano /root/backup-radio.sh
```

Add the following content:

```bash
#!/bin/bash
# Radio Elgean Database Backup Script

# Configuration
BACKUP_DIR="/root/backups"
DATA_DIR="/var/lib/dokploy/data/radio-elgean"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="radio-elgean-backup-${DATE}.tar.gz"

# Create backup
cd "$DATA_DIR" || exit 1
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" data/radio_elgean.db

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "radio-elgean-backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

Make script executable:

```bash
chmod +x /root/backup-radio.sh
```

**Test Backup:**

```bash
/root/backup-radio.sh
ls -lh /root/backups/
```

**Schedule Automatic Backups with Cron:**

```bash
crontab -e
```

Add daily backup at 2 AM:

```
0 2 * * * /root/backup-radio.sh >> /var/log/radio-backup.log 2>&1
```

**Restore from Backup:**

```bash
# Stop application
docker-compose -f /path/to/docker-compose.prod.yml down

# Extract backup
cd /var/lib/dokploy/data/radio-elgean
tar -xzf /root/backups/radio-elgean-backup-YYYYMMDD_HHMMSS.tar.gz

# Restart application
docker-compose -f /path/to/docker-compose.prod.yml up -d
```

## Phase 7: Monitoring and Maintenance

### 7.1 Access and Monitor Logs

**Via Dokploy Dashboard:**
1. Navigate to your application
2. Click **"Logs"** tab
3. View real-time logs with filtering options
4. Filter by service: frontend (Express) or backend (Flask)

**Via SSH and Docker:**

```bash
# View all logs
docker logs radio-elgean-prod

# Follow logs in real-time
docker logs -f radio-elgean-prod

# View last 100 lines
docker logs --tail 100 radio-elgean-prod

# Filter Flask logs
docker logs radio-elgean-prod 2>&1 | grep "Flask"

# Filter Express logs
docker logs radio-elgean-prod 2>&1 | grep "Express"
```

### 7.2 Resource Monitoring

**In Dokploy Dashboard:**
- View CPU usage, memory usage, and disk usage
- Set up alerts for resource thresholds
- Monitor container health status

**Via SSH:**

```bash
# Container resource usage
docker stats radio-elgean-prod

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

### 7.3 Update and Redeploy Application

**Option A - Auto-Deploy (if configured in Phase 6.2):**

```bash
# On your local machine, make changes and push
git add .
git commit -m "Update feature"
git push origin master

# Dokploy automatically detects push and redeploys
```

**Option B - Manual Deploy via Dokploy Dashboard:**

1. Navigate to your application in Dokploy
2. Click **"Deploy"** button
3. Dokploy pulls latest code and rebuilds

**Option C - Manual Deploy via SSH:**

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Navigate to application directory
cd /var/lib/dokploy/apps/radio-elgean

# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### 7.4 Application Health Checks

The application includes built-in health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

**Check Health Status:**

```bash
docker inspect radio-elgean-prod --format='{{.State.Health.Status}}'
# Should return: healthy
```

## Troubleshooting

This section covers the most common deployment issues and their solutions.

### Issue 1: Port 80 Already in Use

**Symptoms:**
- Deployment fails with "port 80 already allocated" error
- Cannot bind to port 80

**Solution:**

```bash
# Check what's using port 80
sudo lsof -i :80

# Common culprits: Apache or Nginx
# Stop Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or stop Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Redeploy application
```

### Issue 2: .env.production File Not Found Error

**Symptoms:**
- Error message: "env file `/etc/dokploy/compose/.../code/.env.production` not found"
- Docker command failed during deployment
- Dokploy cannot find environment file

**Root Cause:**
- The `.env.production` file is not committed to git (correctly, as it contains secrets)
- Dokploy is looking for this file on disk during deployment

**Solution:**

Option A (Recommended - Configure in Dokploy UI):
1. Navigate to your application in Dokploy
2. Go to **Environment Variables** section
3. Add these variables directly:
   ```
   NODE_ENV=production
   FLASK_ENV=production
   PORT=3000
   FLASK_PORT=5001
   SECRET_KEY=<your-generated-secret>
   DEBUG=false
   LOG_LEVEL=warning
   ```
4. Save and redeploy

Option B (Alternative - Already Fixed in Latest Code):
- Update to latest `docker-compose.prod.yml` which removes the `env_file` reference
- Dokploy will inject environment variables through the UI

To update to the latest version:
```bash
git pull origin master
```

---

### Issue 3: Database Not Initializing

**Symptoms:**
- API returns "no such table: track_likes" error
- Like feature doesn't work
- Logs show database errors

**Solution:**

```bash
# Check container logs
docker logs radio-elgean-prod 2>&1 | grep -i "database"

# Look for:
# [✓] Database initialized successfully
# [✓] Database tables exist

# If not found, restart container
docker restart radio-elgean-prod

# If still failing, check database directory permissions
docker exec radio-elgean-prod ls -la /app/database/
```

### Issue 4: SSL Certificate Not Provisioning

**Symptoms:**
- HTTPS not working after 10+ minutes
- Browser shows "Certificate error" or "Not secure"

**Solution:**

```bash
# 1. Verify DNS is correct
nslookup radio.yourdomain.com
# Should return YOUR_VPS_IP

# 2. Check DNS propagation
dig radio.yourdomain.com +short
# Should return YOUR_VPS_IP

# 3. Verify HTTP works first (before SSL)
curl http://radio.yourdomain.com
# Should return HTML

# 4. Check Traefik logs
docker logs traefik 2>&1 | grep -i "certificate"

# 5. Wait 5-10 minutes for DNS propagation
# SSL provisioning requires DNS to be fully propagated

# 6. Force certificate refresh in Dokploy
# Navigate to Domains → Delete domain → Re-add domain with SSL enabled
```

**Common Causes:**
- DNS not propagated yet (wait 10-15 minutes)
- A record pointing to wrong IP
- Domain not accessible via HTTP first
- Let's Encrypt rate limit reached (100 certs/week per domain)

### Issue 5: Application Not Accessible

**Symptoms:**
- Cannot access application via browser
- Connection timeout or refused

**Solution:**

```bash
# 1. Check if container is running
docker ps | grep radio-elgean
# Should show radio-elgean-prod with "Up" status

# 2. Check container health
docker inspect radio-elgean-prod --format='{{.State.Health.Status}}'
# Should return: healthy

# 3. Check if ports are listening
sudo netstat -tlnp | grep -E "80|3000|5001"
# Should show ports 80, 3000, 5001 in LISTEN state

# 4. Test locally on VPS
curl http://localhost:3000
# Should return HTML

# 5. Check firewall
sudo ufw status
# Ensure ports 80, 443 are allowed

# 6. Check application logs
docker logs -f radio-elgean-prod
# Look for errors
```

### Issue 6: Metadata Not Updating

**Symptoms:**
- Now Playing shows "Loading..."
- Album art not changing
- Recently Played widget empty

**Solution:**

```bash
# 1. Check CloudFront metadata endpoint
curl https://d3d4yli4hf5bmh.cloudfront.net/metadata/metadatav2.json

# Should return JSON with artist, title, etc.

# 2. Check browser console for errors
# Open Developer Tools → Console tab
# Look for: "Failed to fetch metadata" errors

# 3. Check Express proxy endpoint
curl http://YOUR_VPS_IP/api/metadata

# Should return metadata JSON

# 4. Verify Express server is running
docker logs radio-elgean-prod 2>&1 | grep "Express"
# Look for: "Express server listening on port 3000"
```

### Issue 7: Backend API Not Responding

**Symptoms:**
- Like feature doesn't work
- API endpoints return errors
- /api/user-ip returns 502 Bad Gateway

**Solution:**

```bash
# 1. Check if Flask is running
docker logs radio-elgean-prod 2>&1 | grep "Flask"
# Look for: "Flask backend running on port 5001"

# 2. Test Flask directly
docker exec radio-elgean-prod curl http://localhost:5001
# Should return: {"status": "ok", "message": "Flask API is running"}

# 3. Check Flask process
docker exec radio-elgean-prod ps aux | grep python
# Should show Flask process running

# 4. Check database file exists
docker exec radio-elgean-prod ls -la /app/database/
# Should show radio_elgean.db file

# 5. Restart container
docker restart radio-elgean-prod
```

### Issue 8: High Memory Usage

**Symptoms:**
- Container using >512MB memory
- VPS running slow
- OOM (Out of Memory) errors

**Solution:**

```bash
# 1. Check current memory usage
docker stats radio-elgean-prod

# 2. Adjust memory limits in docker-compose.prod.yml
# Edit file and change:
#   limits:
#     memory: 768M  # Increase from 512M

# 3. Redeploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Monitor logs for memory issues
docker logs -f radio-elgean-prod 2>&1 | grep -i "memory"
```

## Alternative: Manual Docker Deployment

If Dokploy installation fails or you prefer manual control, deploy directly with Docker Compose:

### Step 1: Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone repository
git clone https://github.com/marwazihs/radio-elgean.git
cd radio-elgean
```

### Step 3: Configure Environment

```bash
# Create production environment file
nano .env.production
```

Add environment variables:

```
NODE_ENV=production
FLASK_ENV=production
PORT=3000
FLASK_PORT=5001
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DEBUG=false
LOG_LEVEL=warning
```

### Step 4: Deploy

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Verify containers are running
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 5: Verify Deployment

```bash
# Test frontend
curl http://localhost

# Test backend
curl http://localhost:5001

# Open in browser
# Navigate to http://YOUR_VPS_IP
```

### Step 6: Set Up Reverse Proxy (Optional)

If you want HTTPS without Dokploy, install Nginx:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/radio-elgean
```

Add configuration:

```nginx
server {
    listen 80;
    server_name radio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site and install SSL:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/radio-elgean /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d radio.yourdomain.com

# Auto-renewal is configured automatically
```

## Success Checklist

Use this checklist to verify successful deployment:

- [ ] Dokploy installed and accessible at `http://YOUR_VPS_IP:3000`
- [ ] Radio Elgean project created in Dokploy
- [ ] Application connected to GitHub repository
- [ ] Environment variables configured (SECRET_KEY, ports, etc.)
- [ ] Deployment triggered and completed successfully
- [ ] Frontend accessible at `http://YOUR_VPS_IP` or `https://radio.yourdomain.com`
- [ ] Backend API responding at `/api/` endpoints
- [ ] Radio player loads and starts streaming
- [ ] Metadata updates showing current track and recently played
- [ ] Album art displays and updates with track changes
- [ ] Like button functional (heart fills, count increases)
- [ ] Database persisting likes correctly
- [ ] SSL certificate provisioned (if using domain)
- [ ] Health checks passing (container shows "healthy" status)
- [ ] Firewall configured (ports 80, 443, 22, 3000 allowed)
- [ ] Auto-deployment configured (optional)
- [ ] Database backups scheduled (optional)

## Additional Resources

- **Dokploy Documentation**: https://docs.dokploy.com
- **Dokploy GitHub**: https://github.com/Dokploy/dokploy
- **Docker Documentation**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org
- **Radio Elgean GitHub**: https://github.com/marwazihs/radio-elgean

## Support

If you encounter issues not covered in this guide:

1. Check Dokploy logs in the dashboard
2. Check application logs: `docker logs radio-elgean-prod`
3. Review the [Troubleshooting](#troubleshooting) section
4. Open an issue on the GitHub repository
5. Consult Dokploy documentation

## Next Steps After Deployment

1. **Test Thoroughly**: Test all features (streaming, metadata, likes)
2. **Monitor Performance**: Watch resource usage and logs for first 24 hours
3. **Set Up Backups**: Configure automated database backups
4. **Enable Auto-Deploy**: Connect GitHub webhook for automatic updates
5. **Configure Alerts**: Set up monitoring alerts for downtime or high resource usage
6. **Document Custom Changes**: Keep notes of any custom configurations
7. **Plan Updates**: Schedule regular maintenance windows for updates

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2025-12-15
**Application Version**: Phase 2 (Metadata + Like Feature)
