The application is no longer running. When you want to start it again, you can use:

# Start Flask backend
cd backend && source venv/bin/activate && FLASK_PORT=5001 python app.py

# In a new terminal, start Express frontend
cd frontend && npm start

Or use the convenient startup script:
./start.sh