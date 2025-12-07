from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import Track
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
            'user_ip': '/api/user-ip',
            'track_like': '/api/tracks/like',
            'track_is_liked': '/api/tracks/is-liked'
        }
    })

@app.route('/api/user-ip', methods=['GET'])
def get_user_ip():
    """Get the client's IP address."""
    # Get IP from various headers, fallback to remote_addr
    ip = request.headers.get('X-Forwarded-For')
    if ip:
        ip = ip.split(',')[0].strip()
    else:
        ip = request.headers.get('X-Real-IP', request.remote_addr)

    return jsonify({'status': 'success', 'ip': ip})

@app.route('/api/tracks/like', methods=['POST'])
def like_track():
    """Toggle like status for a track."""
    data = request.get_json()
    track_identifier = data.get('track_identifier')
    user_fingerprint = data.get('user_fingerprint')

    if not track_identifier or not user_fingerprint:
        return jsonify({'status': 'error', 'message': 'Missing track_identifier or user_fingerprint'}), 400

    # Check if already liked
    is_liked = Track.is_liked_by_user(track_identifier, user_fingerprint)

    if is_liked:
        # Unlike the track
        Track.unlike_track(track_identifier, user_fingerprint)
        liked = False
    else:
        # Like the track
        Track.like_track(track_identifier, user_fingerprint)
        liked = True

    # Get updated like count
    like_count = Track.get_like_count(track_identifier)

    return jsonify({
        'status': 'success',
        'liked': liked,
        'like_count': like_count
    })

@app.route('/api/tracks/is-liked', methods=['POST'])
def is_track_liked():
    """Check if current user has liked a track."""
    data = request.get_json()
    track_identifier = data.get('track_identifier')
    user_fingerprint = data.get('user_fingerprint')

    if not track_identifier or not user_fingerprint:
        return jsonify({'status': 'error', 'message': 'Missing track_identifier or user_fingerprint'}), 400

    is_liked = Track.is_liked_by_user(track_identifier, user_fingerprint)
    like_count = Track.get_like_count(track_identifier)

    return jsonify({
        'status': 'success',
        'liked': is_liked,
        'like_count': like_count
    })

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=(Config.FLASK_ENV == 'development')
    )
