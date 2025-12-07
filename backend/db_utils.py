import sqlite3
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database by executing schema.sql"""
    import os

    # Get path to schema.sql
    schema_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'database',
        'schema.sql'
    )

    if not os.path.exists(schema_path):
        print(f"Error: schema.sql not found at {schema_path}")
        return

    # Execute schema.sql
    conn = get_db_connection()
    cursor = conn.cursor()

    with open(schema_path, 'r') as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)

    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
