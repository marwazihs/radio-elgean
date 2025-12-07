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
