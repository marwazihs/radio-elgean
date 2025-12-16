#!/bin/sh
set -e

echo "=========================================="
echo "Radio Elgean - Production Environment"
echo "=========================================="
echo ""

# Initialize database and schema
echo "[*] Checking database..."

# Use Python to check and initialize database
python3 << 'EOF'
import sqlite3
import os

db_path = "/app/database/radio_elgean.db"

# Database schema SQL (embedded directly)
schema_sql = """
-- Track Likes Table
-- Stores anonymous user likes for tracks using browser fingerprinting
CREATE TABLE IF NOT EXISTS track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,  -- Format: "Artist|Title"
    user_fingerprint TEXT NOT NULL,  -- Hashed browser fingerprint
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);
"""

# Create database directory if it doesn't exist
db_dir = os.path.dirname(db_path)
if not os.path.exists(db_dir):
    os.makedirs(db_dir, exist_ok=True)
    print(f"[*] Created database directory: {db_dir}")

# Create database file if it doesn't exist
if not os.path.exists(db_path):
    print("[*] Database file not found, creating new database...")
    open(db_path, 'a').close()

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if track_likes table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='track_likes'")
    table_exists = cursor.fetchone()

    if not table_exists:
        print("[*] Initializing database schema...")
        cursor.executescript(schema_sql)
        conn.commit()
        print("[✓] Database schema initialized")
    else:
        print("[✓] Database already initialized with all required tables")

    conn.close()
except Exception as e:
    print(f"[!] Error during database initialization: {e}")

EOF

echo ""

# Start Flask backend in background
echo "[*] Starting Flask API backend on port 5001..."
cd backend

# Install dependencies (should be pre-installed in image)
pip install --quiet --user -r requirements.txt 2>/dev/null || true

# Start Flask
FLASK_PORT=5001 python -u app.py &
FLASK_PID=$!
cd ..

echo "[✓] Flask API started (PID: $FLASK_PID)"
echo ""

# Wait for Flask to be ready
sleep 2

echo "[*] Starting Express frontend on port 3000..."
cd frontend

# Install dependencies if they don't exist (shouldn't happen in prod)
if [ ! -d "node_modules" ]; then
    npm ci --only=production
fi

# Start Express in production mode
npm start &
EXPRESS_PID=$!
cd ..

echo "[✓] Express frontend started (PID: $EXPRESS_PID)"
echo ""

# Show startup information
echo "=========================================="
echo "Radio Elgean is running in production"
echo "=========================================="
echo ""
echo "Frontend:  http://localhost:3000"
echo "API:       http://localhost:5001"
echo ""

# Trap signals for graceful shutdown
trap "echo ''; echo 'Shutting down gracefully...'; kill -TERM $FLASK_PID $EXPRESS_PID 2>/dev/null; wait 2>/dev/null; echo 'Shutdown complete'; exit" INT TERM

# Wait for both processes
wait $FLASK_PID $EXPRESS_PID 2>/dev/null
