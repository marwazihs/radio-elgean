-- Radio Elgean Database Schema

-- Track Likes Table
-- Stores anonymous user likes for tracks using browser fingerprinting
CREATE TABLE IF NOT EXISTS track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,  -- Format: "Artist|Title"
    user_fingerprint TEXT NOT NULL,  -- Hashed browser fingerprint
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);
