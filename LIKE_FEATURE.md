# Like Feature Implementation

## Overview
Added a user like feature for radio tracks, allowing users to like/unlike the currently playing track. Users are uniquely identified using a combination of IP address and browser fingerprinting to prevent multiple likes from the same user.

## Architecture

### User Identification System
**File:** `frontend/public/js/fingerprint.js`

The system creates a unique user ID by combining:
1. **Browser Fingerprint** - Generated from:
   - User Agent
   - Browser Language & Platform
   - Screen Resolution & Color Depth
   - Timezone
   - Hardware Concurrency & Device Memory
   - Canvas fingerprint (visual rendering)
   - WebGL fingerprint (GPU info)

2. **IP Address** - Fetched from server endpoint to combine with browser fingerprint

The combined fingerprint is stored in localStorage for consistency across sessions.

```javascript
// Get user fingerprint
const userFingerprint = await userFingerprint.getFingerprintId();
// Returns: "ipHash-browserFingerprintHash"
```

### Database Schema
**File:** `database/schema.sql`

```sql
CREATE TABLE track_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_identifier TEXT NOT NULL,
    user_fingerprint TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_identifier, user_fingerprint)
);
```

**Key Design:**
- `UNIQUE(track_identifier, user_fingerprint)` ensures one user can only like each track once
- `track_identifier` format: `"artist|title"` (lowercase) for consistency

### Backend API Endpoints
**File:** `backend/app.py`

#### 1. Get User IP
```
GET /api/user-ip
Response: { status: 'success', ip: '192.168.1.1' }
```

#### 2. Toggle Like (Like/Unlike)
```
POST /api/tracks/like
Body: {
    track_identifier: "artist|title",
    user_fingerprint: "hash-value"
}
Response: {
    status: 'success',
    liked: true,
    like_count: 42
}
```

#### 3. Check Like Status
```
POST /api/tracks/is-liked
Body: {
    track_identifier: "artist|title",
    user_fingerprint: "hash-value"
}
Response: {
    status: 'success',
    liked: true,
    like_count: 42
}
```

#### 4. Get Like Count
```
GET /api/tracks/like-count/<track_identifier>
Response: {
    status: 'success',
    track_identifier: "artist|title",
    like_count: 42
}
```

### Backend Models
**File:** `backend/models.py`

New `Track` class with static methods:
- `like_track(track_identifier, user_fingerprint)` - Add a like
- `unlike_track(track_identifier, user_fingerprint)` - Remove a like
- `is_liked_by_user(track_identifier, user_fingerprint)` - Check if user liked track
- `get_like_count(track_identifier)` - Get total likes for a track
- `get_track_likes(track_identifier)` - Get detailed like info

### Frontend UI
**File:** `frontend/views/index.ejs`

Like button placed in the "now-playing" section with:
- Heart icon (outline when not liked, filled and red when liked)
- Like count display
- Responsive to track changes

```html
<div class="like-section">
    <button id="likeBtn" class="like-btn" aria-label="Like this track">
        <svg class="like-icon" viewBox="0 0 24 24" width="28" height="28">
            <!-- Heart icon path -->
        </svg>
    </button>
    <span id="likeCount" class="like-count">0</span>
</div>
```

### Frontend Styling
**File:** `frontend/public/css/style.css`

Key styles:
- `.like-section` - Container with mint background
- `.like-btn` - Circular button with hover effects
- `.like-btn.liked` - Red filled state when liked
- `.like-count` - Like count display

Colors used:
- Default: Charcoal (#231F20)
- Liked: Red (#E63946) with glow effect
- Background: Mint (#D8F2D5)

### Frontend Logic
**File:** `frontend/public/js/player.js`

Key functions:
- `initializeLikeFeature()` - Initialize user fingerprint on page load
- `generateTrackIdentifier(metadata)` - Create track ID from artist + title
- `toggleLike()` - Handle like/unlike button click
- `checkAndUpdateLikeStatus(trackIdentifier)` - Check like status when track changes
- `updateLikeUI(count, liked)` - Update UI with like count and state

**Flow:**
1. Page loads → Initialize fingerprint
2. Metadata fetched → Generate track identifier
3. Check like status from backend → Update UI
4. User clicks like button → Toggle like/unlike → Fetch updated count

## Usage

### Starting the Application
```bash
./start.sh
```

This starts:
- Flask backend on port 5001
- Express frontend on port 3000

### Testing the Feature

1. **Open the player** at `http://localhost:3000`
2. **Wait for metadata** to load (shows current track)
3. **Click the heart icon** to like the current track
4. **Heart fills red** and like count increases
5. **Click again** to unlike (heart outline returns)
6. **Refresh page** - Like state persists (based on fingerprint)
7. **Switch to different browser/device** - Like history is separate

## API Communication

### Frontend to Backend Flow
```
Browser (fingerprint.js)
    ↓
Generate user fingerprint (stored in localStorage)
    ↓
Player (player.js)
    ↓
User clicks like button
    ↓
POST /api/tracks/like (to Flask backend on localhost:5001)
    ↓
Backend validates and stores/removes like
    ↓
Return updated like count
    ↓
Update UI (heart color + count)
```

## Error Handling

- **Fingerprint generation fails**: Uses browser fingerprint only (no IP)
- **API call fails**: Falls back to local toggle (UI still responds)
- **Track identifier missing**: Like button disabled until valid track loads
- **Database constraint violation**: Gracefully handled, returns existing like count

## Security Notes

1. **User Identification**: Uses fingerprinting, not authentication
   - No passwords or accounts required
   - Based on device/browser characteristics + IP
   - Can be spoofed but prevents casual multiple-likes

2. **CORS**: Enabled on Flask backend for cross-origin requests

3. **Database**: No sensitive user data stored
   - Only fingerprint hash (not reversible to real user)
   - Only track identifier and timestamp

## Files Modified/Created

### Created:
- `frontend/public/js/fingerprint.js` - Browser fingerprinting library
- `LIKE_FEATURE.md` - This documentation

### Modified:
- `database/schema.sql` - Added track_likes table
- `backend/models.py` - Added Track class
- `backend/app.py` - Added 4 API endpoints + user-ip endpoint
- `frontend/views/index.ejs` - Added like button UI
- `frontend/public/css/style.css` - Added like button styling
- `frontend/public/js/player.js` - Added like functionality
- `frontend/server.js` - Added user-ip endpoint

## Future Enhancements

1. **User Accounts** - Replace fingerprinting with real authentication
2. **Like History** - Show user's liked tracks across sessions
3. **Analytics** - Track most-liked tracks over time
4. **Trending** - Show trending tracks based on recent likes
5. **Social Features** - Share liked tracks, see friends' likes
6. **Notifications** - Alert when liked track is playing again

## Testing Checklist

- [ ] Like button appears on page load
- [ ] Heart icon is empty (outline) initially
- [ ] Clicking heart fills it red and like count increases by 1
- [ ] Clicking again makes heart empty and like count decreases by 1
- [ ] Like state persists after page refresh
- [ ] Like state is specific per track (different tracks have different like states)
- [ ] Like state is specific per user (different browsers/IPs have different states)
- [ ] Works on mobile and desktop
- [ ] Responsive styling looks good at all screen sizes
- [ ] No console errors
- [ ] Backend receives correct data
- [ ] Database stores likes correctly
