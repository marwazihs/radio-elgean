#!/bin/sh
set -e

echo "=========================================="
echo "Radio Elgean - Development Environment"
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

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "[*] Creating Python virtual environment..."
    python3 -m venv venv
fi

. venv/bin/activate

# Install/upgrade dependencies
pip install --quiet -r requirements.txt

# Start Flask with hot-reload
FLASK_PORT=5001 python -u app.py &
FLASK_PID=$!
cd ..

echo "[✓] Flask API started (PID: $FLASK_PID)"
echo ""

# Wait a moment for Flask to initialize
sleep 3

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[*] Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "[✓] Frontend dependencies installed"
else
    echo "[✓] Frontend dependencies already installed"
fi

echo ""

# Start Express frontend with nodemon for hot-reload
echo "[*] Starting Express frontend on port 3000..."
cd frontend
npm run dev &
EXPRESS_PID=$!
cd ..

echo "[✓] Express frontend started (PID: $EXPRESS_PID)"
echo ""

# Show startup information
echo "=========================================="
echo "Radio Elgean is running!"
echo "=========================================="
echo ""
echo "Frontend:  http://localhost:3000"
echo "API:       http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C and kill both processes
trap "echo ''; echo 'Shutting down...'; kill $FLASK_PID $EXPRESS_PID 2>/dev/null; wait 2>/dev/null; echo 'Shutdown complete'; exit" INT TERM

# Wait for both processes
wait $FLASK_PID $EXPRESS_PID 2>/dev/null
