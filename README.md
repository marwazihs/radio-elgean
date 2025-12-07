# Radio Elgean Web Application

A full-stack web application built with Express.js, Flask, and SQLite.

## Project Structure

```
radio-elgean/
├── frontend/              # Express.js webserver
│   ├── public/           # Static files (CSS, JS)
│   ├── views/            # EJS templates
│   ├── routes/           # Express routes
│   ├── server.js         # Main Express server
│   └── package.json      # Node dependencies
├── backend/               # Flask API
│   ├── app.py            # Main Flask application
│   ├── models.py         # Database models
│   ├── db_utils.py       # Database utilities
│   ├── config.py         # Configuration
│   └── requirements.txt  # Python dependencies
├── database/              # SQLite database
│   ├── schema.sql        # Database schema
│   └── init_db.py        # Database initialization
└── README.md
```

## Technology Stack

- **Frontend Server**: Express.js (Node.js)
- **Backend API**: Flask (Python)
- **Database**: SQLite
- **Template Engine**: EJS

## Setup Instructions

### 1. Initialize the Database

```bash
cd database
python3 init_db.py
cd ..
```

### 2. Set Up Flask Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Flask API will run on `http://localhost:5001`

### 3. Set Up Express Frontend

```bash
cd frontend
npm install
npm start
```

The Express server will run on `http://localhost:3000`

## API Endpoints

### Flask API (Port 5001)

- `GET /` - API info
- `GET /api/data` - Get summary data
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `GET /api/stations` - Get all radio stations
- `POST /api/stations` - Create a new station
- `GET /api/stations/:id` - Get station by ID

### Express Frontend (Port 3000)

- `GET /` - Main page
- `GET /api/data` - Proxy to Flask API

## Development

### Run Flask in Development Mode

```bash
cd backend
export FLASK_ENV=development  # On Windows: set FLASK_ENV=development
python app.py
```

### Run Express with Nodemon

```bash
cd frontend
npm run dev
```

## Environment Variables

### Frontend (.env)
```
PORT=3000
FLASK_API_URL=http://localhost:5001
```

### Backend (.env)
```
FLASK_ENV=development
FLASK_PORT=5001
SECRET_KEY=your-secret-key-here
```

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `created_at`: Timestamp

### Radio Stations Table
- `id`: Primary key
- `name`: Station name
- `frequency`: Radio frequency
- `description`: Station description
- `created_at`: Timestamp

## Testing the Application

1. Start the Flask backend
2. Start the Express frontend
3. Open `http://localhost:3000` in your browser
4. Click "Fetch Data from API" to test the connection

## Next Steps

- Add authentication and authorization
- Implement CRUD operations for all entities
- Add input validation and error handling
- Create additional frontend pages
- Add API documentation
- Implement logging
- Add unit and integration tests
