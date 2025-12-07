from db_utils import get_db_connection

class User:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        users = conn.execute('SELECT * FROM users').fetchall()
        conn.close()
        return [dict(user) for user in users]

    @staticmethod
    def get_by_id(user_id):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        return dict(user) if user else None

    @staticmethod
    def create(username, email):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email) VALUES (?, ?)',
            (username, email)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id

class RadioStation:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        stations = conn.execute('SELECT * FROM radio_stations').fetchall()
        conn.close()
        return [dict(station) for station in stations]

    @staticmethod
    def get_by_id(station_id):
        conn = get_db_connection()
        station = conn.execute('SELECT * FROM radio_stations WHERE id = ?', (station_id,)).fetchone()
        conn.close()
        return dict(station) if station else None

    @staticmethod
    def create(name, frequency, description):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO radio_stations (name, frequency, description) VALUES (?, ?, ?)',
            (name, frequency, description)
        )
        conn.commit()
        station_id = cursor.lastrowid
        conn.close()
        return station_id

class Track:
    @staticmethod
    def like_track(track_identifier, user_fingerprint):
        """
        Add a like for a track by a user.
        Returns True if successfully liked, False if already liked.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO track_likes (track_identifier, user_fingerprint) VALUES (?, ?)',
                (track_identifier, user_fingerprint)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            conn.close()
            # If it's a unique constraint violation, the user already liked this track
            if 'UNIQUE constraint failed' in str(e):
                return False
            raise e

    @staticmethod
    def unlike_track(track_identifier, user_fingerprint):
        """
        Remove a like for a track by a user.
        Returns True if successfully unliked, False if not previously liked.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM track_likes WHERE track_identifier = ? AND user_fingerprint = ?',
            (track_identifier, user_fingerprint)
        )
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted

    @staticmethod
    def is_liked_by_user(track_identifier, user_fingerprint):
        """
        Check if a track is liked by a specific user.
        """
        conn = get_db_connection()
        result = conn.execute(
            'SELECT 1 FROM track_likes WHERE track_identifier = ? AND user_fingerprint = ? LIMIT 1',
            (track_identifier, user_fingerprint)
        ).fetchone()
        conn.close()
        return result is not None

    @staticmethod
    def get_like_count(track_identifier):
        """
        Get the total number of likes for a track.
        """
        conn = get_db_connection()
        result = conn.execute(
            'SELECT COUNT(*) as count FROM track_likes WHERE track_identifier = ?',
            (track_identifier,)
        ).fetchone()
        conn.close()
        return dict(result)['count'] if result else 0

    @staticmethod
    def get_track_likes(track_identifier):
        """
        Get detailed like information for a track.
        """
        conn = get_db_connection()
        likes = conn.execute(
            'SELECT user_fingerprint, created_at FROM track_likes WHERE track_identifier = ? ORDER BY created_at DESC',
            (track_identifier,)
        ).fetchall()
        conn.close()
        return [dict(like) for like in likes]
