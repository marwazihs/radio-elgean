# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Elgean is a full-stack web application featuring a live radio streaming player. The application uses a three-tier architecture with Express.js serving the frontend, Flask providing a REST API backend, and SQLite for data persistence.

**Current Status:** The radio streaming feature (on `streaming-station` branch) streams directly from CloudFront CDN to the browser using HLS.js. Metadata integration (Phase 1) is complete, displaying real-time track information and recently played history. The Flask backend is running but not currently integrated into the streaming workflow.

## Running the Application

### Quick Start (All Services)
```bash
./start.sh
```
This script automatically:
- Initializes the database if needed
- Creates Python venv and installs dependencies
- Starts Flask on port 5001
- Installs Node dependencies
- Starts Express on port 3000

### Manual Start (Individual Services)

**Database Initialization:**
```bash
cd database && python3 init_db.py && cd ..
```

**Flask Backend (Port 5001):**
```bash
cd backend
source venv/bin/activate
FLASK_PORT=5001 python app.py
```

**Express Frontend (Port 3000):**
```bash
cd frontend
npm start                    # Production
npm run dev                  # Development with nodemon
```

### Docker Start (Development)

**Start all services in Docker with hot-reload:**
```bash
docker-compose up --build
```

This builds the development image and starts both services with volume mounts for live code reloading.

**Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:5001

### Docker Start (Production)

**Build and run production container:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Access the application:**
- Frontend: http://localhost:8080
- API: http://localhost:5001

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Stop containers:**
```bash
docker-compose -f docker-compose.prod.yml down
```

## Architecture

### Three-Layer Architecture

1. **Frontend (Express.js)**
   - Serves static assets (HTML, CSS, JS) from `frontend/public/`
   - Renders EJS templates from `frontend/views/`
   - Can proxy API requests to Flask backend
   - Entry point: `frontend/server.js`

2. **Backend (Flask API)**
   - REST API on port 5001
   - Models in `backend/models.py` (Track model for like feature)
   - Database utilities in `backend/db_utils.py`
   - Configuration managed via `backend/config.py` (reads from .env)
   - Entry point: `backend/app.py`

3. **Database (SQLite)**
   - Located at `database/radio_elgean.db` (not in git)
   - Schema defined in `database/schema.sql`
   - Initialized via `database/init_db.py`

### Radio Streaming Architecture

The radio player streams HLS content directly from CloudFront CDN:

```
CloudFront CDN (https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8)
    ↓
Browser (HLS.js library)
    ↓
HTML5 Audio Element
```

**Key Files:**
- `frontend/views/index.ejs` - Radio player UI
- `frontend/public/js/player.js` - HLS streaming logic, volume controls, keyboard shortcuts
- `frontend/public/css/style.css` - Radio Calico brand styling

**Radio Player Features:**
- HLS.js for cross-browser streaming (native HLS for Safari)
- Start/Stop button (not pause - always connects to live stream position)
- Dynamic album art display from CloudFront
- Volume persistence via localStorage
- Keyboard shortcuts: Space (start/stop stream), M (mute), Arrow keys (volume)
- Auto-recovery from network/media errors
- Real-time metadata display (now playing, recently played history)
- Collapsible Recently Played widget

### Metadata Integration

The application fetches real-time stream metadata from CloudFront to display current track information and listening history.

**Metadata Flow:**
```
CloudFront (metadatav2.json)
    ↓ [every 15 seconds]
Express Proxy (/api/metadata)
    ↓
Frontend (player.js)
    ↓
Update UI (Now Playing + Recently Played)
```

**Metadata Endpoint:**
- `GET /api/metadata` - Proxy endpoint in `frontend/server.js` that fetches from CloudFront
- Returns JSON with: artist, title, album, date, prev_artist_1-5, prev_title_1-5, bit_depth, sample_rate, content flags

**Implemented Features (Phase 1):**
1. **Dynamic Now Playing Display** - Shows current track as "Artist - Title" with smooth fade-in animation when track changes
2. **Recently Played History Widget** - Collapsible widget displaying last 5 tracks with numbered list, styled with brand colors
3. **Album Art Display** - Shows dynamic album artwork from CloudFront (cover.jpg), updates with each track change
4. **Start/Stop Stream Control** - Replaces traditional play/pause; always reconnects to live stream position to maintain sync with metadata

**Design Decisions:**
- **No Progress Bar:** Live radio streams don't provide timing metadata, so progress bars would be misleading. The metadata API only provides track info, not duration or elapsed time. This ensures accurate UI without false information.
- **Start/Stop (not Pause):** When stopped, the stream fully disconnects. When started again, it reconnects to the live stream position (not the paused position). This maintains sync between audio, metadata, and album art.

**Implementation Details:**
- Polling interval: 15 seconds (balances freshness vs. API load)
- Functions in `player.js`:
  - `initMetadata()` - Starts polling on page load
  - `fetchMetadata()` - Fetches from Express proxy
  - `updateNowPlaying()` - Updates current track display and refreshes album art with cache-busting timestamp
  - `updateRecentlyPlayed()` - Updates history list
  - `toggleRecentlyPlayed()` - Expands/collapses widget
  - `toggleStream()` - Starts/stops live stream connection (reconnects to live edge)
- Widget styling in `style.css` (lines 354-483)
- Album art styling in `style.css` (lines 78-99)

### Like Feature (Phase 2)

Users can like/unlike tracks currently playing on the radio. Each like is tracked per user (identified by IP + browser fingerprint) and persists in the database.

**Like System Architecture:**
```
Browser (fingerprint.js)
    ↓ [Generate unique user ID]
    ↓ [IP + Browser Fingerprint hash]
Frontend (player.js)
    ↓ [Toggle like on button click]
    ↓ [POST /api/tracks/like]
Flask Backend (app.py)
    ↓ [Check existing like, toggle status]
    ↓ [Store in database]
SQLite (track_likes table)
    ↓ [One user can only like each track once]
    ↓ [Return updated like count]
```

**Database Schema:**
```sql
CREATE TABLE track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,
    user_fingerprint TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);
```

**Backend API Endpoints:**
- `GET /api/user-ip` - Returns client IP address for fingerprinting
- `POST /api/tracks/like` - Toggle like status (like/unlike)
  - Request: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`
- `POST /api/tracks/is-liked` - Check if user liked a track
  - Request: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`

**Frontend Implementation:**
- `frontend/public/js/fingerprint.js` - Browser fingerprinting library
  - Generates unique user ID from: user agent, screen resolution, timezone, canvas fingerprint, WebGL info, IP address
  - Stores fingerprint in localStorage for consistency
- `player.js` functions:
  - `initializeLikeFeature()` - Initialize user fingerprint on page load
  - `generateTrackIdentifier()` - Create unique track ID from artist + title
  - `toggleLike()` - Handle like button clicks, communicate with backend
  - `checkAndUpdateLikeStatus()` - Check like status when track changes
  - `updateLikeUI()` - Update button state and like count display
- Integration: Like status checked automatically when metadata changes (new track)

**UI/UX:**
- Heart icon button (44px) positioned between track info and status indicator
- Displays like count next to icon
- Heart is outlined (charcoal) when not liked
- Heart fills red (#E63946) with glow effect when liked
- Hover effect: scales up 15%, background tints mint
- Click animation: heartbeat pulse when liking
- Fully responsive design, resizes on mobile

**Key Features:**
- One like per user per track (UNIQUE constraint in database)
- Global like count shown (all users' likes combined)
- User-specific like state persists across sessions (localStorage + database)
- Different users (different IPs/browsers) have separate like histories
- Graceful fallback if API unavailable (local UI toggle still works)

**Files:**
- Created: `frontend/public/js/fingerprint.js`
- Modified: `database/schema.sql`, `backend/models.py`, `backend/app.py`, `frontend/views/index.ejs`, `frontend/public/css/style.css`, `frontend/public/js/player.js`, `frontend/server.js`

**Future Roadmap:**
See `ROADMAP.md` for planned features including content badges, audio quality verification, track statistics, favorites system, and more.

### Design System

The radio player follows **Radio Calico Brand Guidelines** (`radio-style/RadioCalico_Style_Guide.txt`):
- **Colors:** Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Charcoal (#231F20), Cream (#F5EADA)
- **Typography:** Montserrat (headings), Open Sans (body text)
- **Controls:** Circular buttons ≥40px, responsive for mobile

## Database Schema

**track_likes:**
- id (PK), track_identifier, user_fingerprint, created_at
- UNIQUE(track_identifier, user_fingerprint) - Ensures one like per user per track

Access via `models.py` methods:
- Track: `Track.like_track()`, `Track.unlike_track()`, `Track.is_liked_by_user()`, `Track.get_like_count()`

## Environment Configuration

### Port Configuration (Important)

**Flask must run on port 5001** (not 5000) because macOS AirPlay Receiver blocks port 5000.

**frontend/.env:**
```
PORT=3000
FLASK_API_URL=http://localhost:5001
```

**backend/.env:**
```
FLASK_ENV=development
FLASK_PORT=5001
SECRET_KEY=your-secret-key-here
```

## Git Workflow

- `master` - Initial commit with foundational structure
- `streaming-station` - Radio streaming feature (current development branch)

## Project Documentation

- **ROADMAP.md** - Product roadmap for metadata integration features, organized in phases with priorities, effort estimates, success metrics, and release schedule. Phase 1 (Now Playing + Recently Played) is complete.
- **CLAUDE.md** (this file) - Technical documentation for future Claude Code sessions

## Key Patterns

### Flask API Endpoints
- All endpoints return JSON with `{status, message, data}` structure
- CORS enabled for cross-origin requests
- Error responses include status codes (400, 404, 500)

### Express Routing
- Static files auto-served from `frontend/public/`
- EJS templates rendered with `res.render('template', {data})`
- Can proxy to Flask via axios (see `/api/data` endpoint in server.js)
- `/api/metadata` endpoint proxies CloudFront metadata for radio player

### Database Access
- Connection helper: `get_db_connection()` returns sqlite3 connection with Row factory
- Models use static methods (no ORM)
- Manual SQL queries with parameter binding for safety

## Common Gotchas

1. **Port 5000 Conflict:** Always use port 5001 for Flask due to macOS AirPlay
2. **Virtual Environments:** Flask requires venv activation; backend/.env is read via python-dotenv
3. **Static Assets:** Changes to CSS/JS require browser refresh; Express serves from /public
4. **Database Location:** SQLite file is in database/, not backend/
5. **HLS Streaming:** Player.js handles both HLS.js (Chrome/Firefox) and native HLS (Safari)
6. **Metadata Polling:** Metadata updates every 15 seconds; check browser console for fetch errors if track info not updating
7. **Start/Stop vs Play/Pause:** The button is "Start/Stop" (not play/pause) - stopping fully disconnects the stream, restarting reconnects to the live position. This prevents sync issues between audio, metadata, and album art.
8. **Album Art Caching:** Album art URL includes timestamp query parameter (`?t=timestamp`) to force fresh downloads when track changes
9. **No Progress Bar:** Intentionally removed - live streams don't provide duration/elapsed time metadata, so any progress bar would be misleading
