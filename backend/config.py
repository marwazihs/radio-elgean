import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'radio_elgean.db')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DATABASE_PATH = DATABASE_PATH
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    PORT = int(os.environ.get('FLASK_PORT', 5000))
