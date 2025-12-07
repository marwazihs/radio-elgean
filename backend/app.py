from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import User, RadioStation
from db_utils import init_db
import os

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

if not os.path.exists(Config.DATABASE_PATH):
    print("Initializing database...")
    init_db()

@app.route('/')
def index():
    return jsonify({
        'message': 'Radio Elgean Flask API',
        'version': '1.0.0',
        'endpoints': {
            'data': '/api/data',
            'users': '/api/users',
            'stations': '/api/stations'
        }
    })

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({
        'status': 'success',
        'message': 'Data from Flask API',
        'data': {
            'users_count': len(User.get_all()),
            'stations_count': len(RadioStation.get_all())
        }
    })

@app.route('/api/users', methods=['GET', 'POST'])
def users():
    if request.method == 'GET':
        users = User.get_all()
        return jsonify({'status': 'success', 'data': users})

    elif request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')

        if not username or not email:
            return jsonify({'status': 'error', 'message': 'Username and email required'}), 400

        try:
            user_id = User.create(username, email)
            return jsonify({'status': 'success', 'message': 'User created', 'id': user_id}), 201
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.get_by_id(user_id)
    if user:
        return jsonify({'status': 'success', 'data': user})
    return jsonify({'status': 'error', 'message': 'User not found'}), 404

@app.route('/api/stations', methods=['GET', 'POST'])
def stations():
    if request.method == 'GET':
        stations = RadioStation.get_all()
        return jsonify({'status': 'success', 'data': stations})

    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        frequency = data.get('frequency')
        description = data.get('description')

        if not name:
            return jsonify({'status': 'error', 'message': 'Station name required'}), 400

        try:
            station_id = RadioStation.create(name, frequency, description)
            return jsonify({'status': 'success', 'message': 'Station created', 'id': station_id}), 201
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stations/<int:station_id>', methods=['GET'])
def get_station(station_id):
    station = RadioStation.get_by_id(station_id)
    if station:
        return jsonify({'status': 'success', 'data': station})
    return jsonify({'status': 'error', 'message': 'Station not found'}), 404

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=(Config.FLASK_ENV == 'development')
    )
