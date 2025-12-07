import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'radio_elgean.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'database', 'schema.sql')

def init_database():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    with open(SCHEMA_PATH, 'r') as f:
        schema = f.read()
        cursor.executescript(schema)

    conn.commit()
    conn.close()

    print(f"Database initialized successfully at: {DATABASE_PATH}")

if __name__ == '__main__':
    init_database()
