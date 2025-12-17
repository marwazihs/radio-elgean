#!/usr/bin/env python3
"""
Test script to verify like feature database operations
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from db_utils import get_db_connection, init_db
from models import Track
from config import Config

def test_database_operations():
    """Test database operations for like feature"""

    print("=" * 60)
    print("LIKE FEATURE DATABASE TEST")
    print("=" * 60)

    # Check if database exists
    if not os.path.exists(Config.DATABASE_PATH):
        print(f"\n❌ Database not found at: {Config.DATABASE_PATH}")
        print("Initializing database...")
        init_db()
        print("✓ Database initialized")
    else:
        print(f"✓ Database found at: {Config.DATABASE_PATH}")

    # Test data
    test_track = "test artist|test song"
    test_user = "test_fingerprint_12345"

    print(f"\n{'='*60}")
    print("TEST 1: Check initial like count")
    print("=" * 60)
    count = Track.get_like_count(test_track)
    print(f"Initial like count: {count}")
    print(f"Type: {type(count)}")

    print(f"\n{'='*60}")
    print("TEST 2: Like a track")
    print("=" * 60)
    result = Track.like_track(test_track, test_user)
    print(f"Like result: {result}")
    count_after_like = Track.get_like_count(test_track)
    print(f"Like count after liking: {count_after_like}")
    print(f"Type: {type(count_after_like)}")

    print(f"\n{'='*60}")
    print("TEST 3: Check if liked")
    print("=" * 60)
    is_liked = Track.is_liked_by_user(test_track, test_user)
    print(f"Is liked: {is_liked}")

    print(f"\n{'='*60}")
    print("TEST 4: Unlike a track")
    print("=" * 60)
    result = Track.unlike_track(test_track, test_user)
    print(f"Unlike result: {result}")
    count_after_unlike = Track.get_like_count(test_track)
    print(f"Like count after unliking: {count_after_unlike}")
    print(f"Type: {type(count_after_unlike)}")

    print(f"\n{'='*60}")
    print("TEST 5: Like again (to verify toggle)")
    print("=" * 60)
    result = Track.like_track(test_track, test_user)
    print(f"Like result: {result}")
    count_final = Track.get_like_count(test_track)
    print(f"Final like count: {count_final}")
    print(f"Type: {type(count_final)}")

    # Query database directly to verify
    print(f"\n{'='*60}")
    print("TEST 6: Direct database query")
    print("=" * 60)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM track_likes WHERE track_identifier = ?", (test_track,))
    rows = cursor.fetchall()
    print(f"Records in database: {len(rows)}")
    for row in rows:
        print(f"  - ID: {row['id']}, Track: {row['track_identifier']}, User: {row['user_fingerprint']}")

    cursor.execute("SELECT COUNT(*) as count FROM track_likes WHERE track_identifier = ?", (test_track,))
    result = cursor.fetchone()
    print(f"\nDirect COUNT query result: {result}")
    print(f"Type: {type(result)}")
    print(f"As dict: {dict(result)}")
    print(f"Count value: {dict(result)['count']}")
    conn.close()

    # Cleanup
    print(f"\n{'='*60}")
    print("CLEANUP")
    print("=" * 60)
    Track.unlike_track(test_track, test_user)
    print("✓ Test data cleaned up")

    print(f"\n{'='*60}")
    print("ALL TESTS COMPLETED")
    print("=" * 60)

if __name__ == '__main__':
    test_database_operations()
