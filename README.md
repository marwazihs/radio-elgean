# Radio Elgean - Live Radio Streaming Player

A full-stack live radio streaming application built with Express.js, Flask, and SQLite, featuring HLS streaming from CloudFront CDN, real-time metadata integration, and user engagement features.

## Project Status

**Current Version**: Phase 2 (Metadata + Like Feature)
- ✅ HLS radio streaming player with start/stop controls
- ✅ Real-time track metadata display (now playing, recently played)
- ✅ User like/unlike feature with browser fingerprinting
- ✅ Album art display from CDN
- ✅ Volume controls with persistence
- ✅ Keyboard shortcuts and accessibility

## Project Structure

```
radio-elgean/
├── frontend/                     # Express.js web server
│   ├── public/
│   │   ├── css/style.css        # Radio Calico brand styling
│   │   └── js/
│   │       ├── player.js        # HLS streaming & UI logic
│   │       └── fingerprint.js   # Browser fingerprinting for user ID
│   ├── views/index.ejs          # Radio player UI template
│   ├── server.js                # Express server & API proxy
│   └── package.json
├── backend/                      # Flask REST API (Port 5001)
│   ├── app.py                   # Flask application with API endpoints
│   ├── models.py                # Track model for like feature
│   ├── db_utils.py              # Database connection utilities
│   ├── config.py                # Configuration management
│   └── requirements.txt
├── database/                     # SQLite database
│   ├── schema.sql               # Database schema (track_likes table only)
│   ├── init_db.py               # Database initialization
│   └── radio_elgean.db          # SQLite database file (generated)
├── LIKE_FEATURE.md              # Like feature documentation
├── CLAUDE.md                    # Technical documentation for developers
└── README.md
```

## Technology Stack

- **Frontend**: Express.js (Node.js) with EJS templates
- **Streaming**: HLS.js library with CloudFront CDN
- **Backend API**: Flask (Python) with CORS support
- **Database**: SQLite with Python sqlite3
- **Design System**: Radio Calico brand guidelines
- **User Identification**: Browser fingerprinting (IP + device characteristics)

## Quick Start

### One-Command Setup (All Services)

```bash
./start.sh
```

This script automatically:
- Initializes the database
- Creates Python virtual environment
- Installs Flask dependencies
- Starts Flask backend (port 5001)
- Installs Node dependencies
- Starts Express frontend (port 3000)

Then open `http://localhost:3000` in your browser.

### Manual Setup

**1. Initialize Database:**
```bash
cd database
python3 init_db.py
cd ..
```

**2. Start Flask Backend (Port 5001):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
FLASK_PORT=5001 python app.py
```

**3. Start Express Frontend (Port 3000):**
```bash
cd frontend
npm install
npm start
```

**Note:** Flask must run on port 5001 (not 5000) because macOS blocks port 5000 for AirPlay.

## Installation Using Docker

Docker allows you to run Radio Elgean in self-contained containers without installing dependencies locally. Complete setup from download to deployment.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker and Docker Compose)
- Minimum 2GB free disk space (production image ~500MB, development image ~1.2GB)
- 512MB RAM available for containers

### 1. Download & Setup

**Clone or download the repository:**
```bash
# Clone the repository
git clone https://github.com/marwazihs/radio-elgean.git
cd radio-elgean

# Or download and extract the ZIP file
unzip radio-elgean.zip
cd radio-elgean
```

**Verify Docker is running:**
```bash
docker --version
docker-compose --version
```

### 2. Environment Configuration

**Create production environment file (`.env.production`):**
```bash
# Production Configuration
NODE_ENV=production
FLASK_ENV=production

# Frontend Configuration
PORT=3000
FLASK_API_URL=http://localhost:5001

# Backend Configuration
FLASK_PORT=5001
# IMPORTANT: Change this to a strong random secret before production deployment
SECRET_KEY=your-strong-random-secret-key-change-this
DEBUG=false
LOG_LEVEL=warning
```

**Generate a strong secret key (optional but recommended):**
```bash
openssl rand -hex 32
# Copy the output and update SECRET_KEY in .env.production
```

### 3. Development Environment (with hot-reload)

**Start all services with hot-reload support:**
```bash
docker-compose up --build
```

This will:
- Build the development image (~1.2GB)
- Start Flask backend on port 5001
- Start Express frontend on port 3000
- Enable live reload for code changes
- Mount source code as volumes for real-time development

**Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:5001

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f radio-elgean
```

**Stop services:**
```bash
docker-compose down
```

### 4. Production Environment

**Build production image (~500MB):**
```bash
docker-compose -f docker-compose.prod.yml build
```

**Run production container:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

The `-d` flag runs containers in background (detached mode).

**Access the application:**
- Frontend: http://localhost
- API: http://localhost:5001

**Customizing the Frontend Port:**

By default, the production container exposes the frontend on port 80. To use a different port:

1. **Edit `docker-compose.prod.yml`:**
```bash
nano docker-compose.prod.yml
```

2. **Find the ports section and change the host port:**
```yaml
services:
  radio-elgean:
    ports:
      - "8080:3000"    # Change "80" to "8080" (or any port you want)
      - "5001:5001"
```

3. **Restart the container:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

4. **Access at the new port:**
```
http://localhost:8080
```

**Common Port Configurations:**
- Port 80: Standard HTTP (default in this setup, requires sudo/elevated privileges to bind)
- Port 3000-9000: Development/staging environments
- Port 8080: Standard alternative HTTP port

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Check container status:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

**Stop services:**
```bash
docker-compose -f docker-compose.prod.yml down
```

### 5. Server Deployment (Linux/Cloud)

**On a remote server (Ubuntu/Debian example):**

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone repository
git clone https://github.com/marwazihs/radio-elgean.git
cd radio-elgean

# 4. Configure environment
nano .env.production
# Update SECRET_KEY and other settings as needed

# 5. Start production containers
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl http://localhost  # Should return HTML
```

### 6. Database Initialization

The database automatically initializes on first container startup. No manual initialization needed.

**To reset database in production:**
```bash
# Stop containers
docker-compose -f docker-compose.prod.yml down

# Remove persistent data
rm -rf ./data/radio_elgean.db

# Restart (database will be recreated)
docker-compose -f docker-compose.prod.yml up -d
```

### 7. Troubleshooting

**Port already in use:**
```bash
# Check what's using the port
lsof -i :80  # or :3000, :5001

# Use different ports in docker-compose files
# Edit docker-compose.prod.yml and change ports:
#   - "8080:3000"  # Use 8080 instead of 80
```

**Database initialization failed:**
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs radio-elgean

# Verify database file permissions
docker-compose -f docker-compose.prod.yml exec radio-elgean ls -la /app/database/
```

**Containers won't start:**
```bash
# Rebuild without cache
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build --no-cache

# Check Docker daemon
docker ps
```

### 8. Docker Commands Reference

```bash
# Build only
docker-compose -f docker-compose.prod.yml build

# Start in foreground (see logs)
docker-compose -f docker-compose.prod.yml up

# Start in background
docker-compose -f docker-compose.prod.yml up -d

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Stop services
docker-compose -f docker-compose.prod.yml down

# View running containers
docker ps
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## Features

### 🎙️ Live Radio Streaming
- HLS.js streaming from CloudFront CDN
- Start/Stop button (always connects to live stream position)
- Automatic error recovery with retry logic
- Network error handling and reconnection

### 📊 Real-Time Metadata
- Updates every 15 seconds
- Shows currently playing track (Artist - Title)
- Displays last 5 recently played tracks
- Dynamic album artwork from CDN
- Collapsible Recently Played widget

### ❤️ Like Feature (Phase 2)
- Click heart icon to like/unlike tracks
- Heart fills red when liked
- Instagram-style like counter
- One like per user per track (enforced by database)
- Creative user identification (IP + browser fingerprint)
- Persistent storage in SQLite database
- Automatic like status checking on track changes

### 🎚️ Audio Controls
- Volume slider with visual feedback
- Mute/unmute button
- Volume persistence via localStorage
- Keyboard shortcuts:
  - **Space**: Start/Stop stream
  - **M**: Mute/Unmute
  - **↑/↓**: Adjust volume (+/- 5%)

### 📱 Responsive Design
- Mobile-optimized interface
- Accessible button sizes (≥40px)
- Radio Calico brand color scheme
- Works on all modern browsers

## API Endpoints

### Flask Backend (Port 5001)

- `GET /` - API info and available endpoints
- `GET /api/user-ip` - Get client IP address
  - Response: `{status, ip}`
- `POST /api/tracks/like` - Toggle like/unlike for a track
  - Body: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`
- `POST /api/tracks/is-liked` - Check if user liked a track
  - Body: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`

### Express Frontend (Port 3000)

**Pages & Resources:**
- `GET /` - Radio player page
- `GET /css/style.css` - Player styling
- `GET /js/player.js` - Player logic and HLS streaming
- `GET /js/fingerprint.js` - Browser fingerprinting library

**API Proxy Endpoints:**
- `GET /api/metadata` - Proxy to CloudFront metadata (updated every 15 seconds)
  - Response: `{artist, title, album, date, prev_artist_1-5, prev_title_1-5, ...}`
- `GET /api/data` - Proxy to Flask `/api/data`
- `GET /api/user-ip` - Proxy to Flask user IP endpoint

## Development

### Run Services Individually

**Flask Backend (Development Mode):**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
export FLASK_ENV=development
FLASK_PORT=5001 python app.py
```

**Express Frontend (Development with Nodemon):**
```bash
cd frontend
npm run dev
```

### Environment Variables

The application supports flexible port configuration through environment variables.

**Frontend (.env):**
```
PORT=3000
FLASK_API_URL=http://localhost:5001
```

- `PORT` - Frontend server port (default: 3000)
- `FLASK_API_URL` - Backend API URL (default: http://localhost:5001)

**Backend (.env):**
```
FLASK_ENV=development
FLASK_PORT=5001
SECRET_KEY=your-secret-key-here
```

- `FLASK_PORT` - Backend API port (default: 5001)
- `FLASK_ENV` - Environment mode: development or production
- `SECRET_KEY` - Secret key for session management

#### Port Configuration

**Frontend (Express.js):**
- Environment variable: `PORT`
- Default: 3000
- Read from: `frontend/server.js` line 8

**Backend (Flask):**
- Environment variable: `FLASK_PORT`
- Default: 5001
- Read from: `backend/config.py` line 11

**Override ports at runtime:**

```bash
# Frontend with custom port
PORT=8000 npm start

# Backend with custom port
FLASK_PORT=8001 python app.py

# Docker: Set PORT via environment
docker-compose up --build -e PORT=8000

# Docker: Edit docker-compose.yml or docker-compose.prod.yml
# environment:
#   - PORT=8000
#   - FLASK_PORT=8001
```

**Examples:**

Development on custom ports:
```bash
# Terminal 1 - Backend on 8001
FLASK_PORT=8001 python app.py

# Terminal 2 - Frontend on 8000
PORT=8000 npm start

# Access at: http://localhost:8000 (and update FLASK_API_URL if needed)
```

Production on standard HTTP port:
```bash
# In docker-compose.prod.yml, currently set to:
# ports:
#   - "80:3000"      # Frontend on port 80
#   - "5001:5001"    # Backend on port 5001

docker-compose -f docker-compose.prod.yml up -d
# Access at: http://localhost (port 80)
```

Temporary port override:
```bash
PORT=9000 FLASK_PORT=9001 docker-compose up --build
```

## Database Schema

### track_likes Table
The application uses a single table to track anonymous user engagement with tracks:

- `id` - Primary key (INTEGER)
- `track_identifier` - Unique track ID in format "artist|title" (TEXT)
- `user_fingerprint` - Hashed user fingerprint + IP (TEXT)
- `created_at` - Creation timestamp (TIMESTAMP)
- **UNIQUE Constraint**: `(track_identifier, user_fingerprint)` - Prevents duplicate likes per user per track

## Testing the Like Feature

1. Start both services (`./start.sh`)
2. Open `http://localhost:3000` in your browser
3. Wait for metadata to load (shows current track)
4. Click the heart icon to like the current track
5. Heart fills red and like count increases
6. Click again to unlike (heart outline returns)
7. Refresh the page - like state persists (based on your fingerprint)
8. Switch to a different browser/device - like state will be separate

For comprehensive testing instructions, see [LIKE_FEATURE.md](./LIKE_FEATURE.md).

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Detailed technical documentation for developers
  - Architecture overview
  - Setup instructions with environment configuration
  - Radio streaming implementation details
  - Metadata integration workflow
  - Like feature architecture and design decisions
  - Common gotchas and troubleshooting

- **[LIKE_FEATURE.md](./LIKE_FEATURE.md)** - Complete like feature documentation
  - User identification system (fingerprinting)
  - Database schema and constraints
  - API endpoint specifications
  - Backend models and implementation
  - Frontend UI and styling
  - Testing checklist
  - Security notes

## Future Roadmap

- [ ] User authentication and accounts
- [ ] Like/favorite history per user
- [ ] Track statistics and analytics
- [ ] Trending tracks dashboard
- [ ] Social sharing features
- [ ] Playlist management
- [ ] Audio quality verification
- [ ] Content badges (new, popular, trending)
- [ ] Push notifications
- [ ] Mobile app
