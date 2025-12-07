-- Radio Elgean Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Radio Stations Table
CREATE TABLE IF NOT EXISTS radio_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    frequency TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track Likes Table
CREATE TABLE IF NOT EXISTS track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,
    user_fingerprint TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);

-- Sample Data
INSERT INTO users (username, email) VALUES
    ('admin', 'admin@radioelgean.com'),
    ('dj_mike', 'mike@radioelgean.com')
ON CONFLICT(username) DO NOTHING;

INSERT INTO radio_stations (name, frequency, description) VALUES
    ('Radio Elgean FM', '98.5 FM', 'Main station broadcasting popular music'),
    ('Radio Elgean Jazz', '101.2 FM', 'Smooth jazz and blues')
ON CONFLICT DO NOTHING;
