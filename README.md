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
│   ├── models.py                # User, RadioStation, Track models
│   ├── db_utils.py              # Database connection utilities
│   ├── config.py                # Configuration management
│   └── requirements.txt
├── database/                     # SQLite database
│   ├── schema.sql               # Database schema (users, stations, track_likes)
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

**User & Station Management:**
- `GET /` - API info and available endpoints
- `GET /api/data` - Get summary data (user and station counts)
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/<id>` - Get user by ID
- `GET /api/stations` - Get all radio stations
- `POST /api/stations` - Create a new station
- `GET /api/stations/<id>` - Get station by ID

**Like Feature Endpoints:**
- `POST /api/tracks/like` - Toggle like/unlike for a track
  - Body: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`
- `POST /api/tracks/is-liked` - Check if user liked a track
  - Body: `{track_identifier, user_fingerprint}`
  - Response: `{status, liked, like_count}`
- `GET /api/tracks/like-count/<track_identifier>` - Get total likes for a track
  - Response: `{status, track_identifier, like_count}`
- `GET /api/user-ip` - Get client IP address
  - Response: `{status, ip}`

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

**Frontend (.env):**
```
PORT=3000
FLASK_API_URL=http://localhost:5001
```

**Backend (.env):**
```
FLASK_ENV=development
FLASK_PORT=5001
SECRET_KEY=your-secret-key-here
```

## Database Schema

### users Table
- `id` - Primary key (INTEGER)
- `username` - Unique username (TEXT)
- `email` - Unique email (TEXT)
- `created_at` - Creation timestamp (TIMESTAMP)

### radio_stations Table
- `id` - Primary key (INTEGER)
- `name` - Station name (TEXT)
- `frequency` - Radio frequency (TEXT)
- `description` - Station description (TEXT)
- `created_at` - Creation timestamp (TIMESTAMP)

### track_likes Table
- `id` - Primary key (INTEGER)
- `track_identifier` - Unique track ID in format "artist|title" (TEXT)
- `user_fingerprint` - Hashed user fingerprint + IP (TEXT)
- `created_at` - Creation timestamp (TIMESTAMP)
- **UNIQUE Constraint**: `(track_identifier, user_fingerprint)` - Prevents duplicate likes

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
