#!/bin/bash

echo "Starting Radio Elgean Application..."
echo ""

# Initialize database if it doesn't exist
if [ ! -f "database/radio_elgean.db" ]; then
    echo "Initializing database..."
    cd database
    python3 init_db.py
    cd ..
    echo ""
fi

# Start Flask backend in background
echo "Starting Flask API backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
FLASK_PORT=5001 python app.py &
FLASK_PID=$!
cd ..

echo "Flask API started on http://localhost:5001"
echo ""

# Wait for Flask to start
sleep 2

# Start Express frontend
echo "Starting Express frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi
npm start &
EXPRESS_PID=$!
cd ..

echo "Express server started on http://localhost:3000"
echo ""
echo "Application is running!"
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and kill both processes
trap "echo 'Shutting down...'; kill $FLASK_PID $EXPRESS_PID; exit" INT

wait
