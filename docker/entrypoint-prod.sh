#!/bin/sh
set -e

echo "=========================================="
echo "Radio Elgean - Production Environment"
echo "=========================================="
echo ""

# Initialize database if it doesn't exist
if [ ! -f "database/radio_elgean.db" ]; then
    echo "[*] Initializing database..."
    cd database
    python3 init_db.py
    cd ..
    echo "[✓] Database initialized"
    echo ""
fi

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
