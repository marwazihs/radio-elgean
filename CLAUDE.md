# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Elgean is a full-stack web application featuring a live radio streaming player. The application uses a three-tier architecture with Express.js serving the frontend, Flask providing a REST API backend, and SQLite for data persistence.

**Current Status:** The radio streaming feature (on `streaming-station` branch) streams directly from CloudFront CDN to the browser using HLS.js. The Flask backend is running but not currently integrated into the streaming workflow.

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

## Architecture

### Three-Layer Architecture

1. **Frontend (Express.js)**
   - Serves static assets (HTML, CSS, JS) from `frontend/public/`
   - Renders EJS templates from `frontend/views/`
   - Can proxy API requests to Flask backend
   - Entry point: `frontend/server.js`

2. **Backend (Flask API)**
   - REST API on port 5001
   - Models in `backend/models.py` (User, RadioStation)
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
- Volume persistence via localStorage
- Keyboard shortcuts: Space (play/pause), M (mute), Arrow keys (volume)
- Auto-recovery from network/media errors

### Design System

The radio player follows **Radio Calico Brand Guidelines** (`radio-style/RadioCalico_Style_Guide.txt`):
- **Colors:** Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Charcoal (#231F20), Cream (#F5EADA)
- **Typography:** Montserrat (headings), Open Sans (body text)
- **Controls:** Circular buttons ≥40px, responsive for mobile

## Database Schema

**users:**
- id (PK), username (unique), email (unique), created_at

**radio_stations:**
- id (PK), name, frequency, description, created_at

Access via `models.py` methods: `User.get_all()`, `User.create()`, `RadioStation.get_all()`, etc.

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

## Key Patterns

### Flask API Endpoints
- All endpoints return JSON with `{status, message, data}` structure
- CORS enabled for cross-origin requests
- Error responses include status codes (400, 404, 500)

### Express Routing
- Static files auto-served from `frontend/public/`
- EJS templates rendered with `res.render('template', {data})`
- Can proxy to Flask via axios (see `/api/data` endpoint in server.js)

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
