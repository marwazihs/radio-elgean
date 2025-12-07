# Radio Elgean Product Roadmap

## Overview

This roadmap outlines planned features for Radio Elgean's streaming platform, leveraging metadata from the stream host to enhance user experience and engagement.

## Metadata Source

Stream metadata available at: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`

**Available Data:**
- Current track information (artist, title, album, date)
- Previous 5 tracks played
- Audio quality specs (bit depth, sample rate)
- Content flags (new release, summer, video games, explicit)

---

## Phase 1: Core Experience (Week 1) ✅

### 1.1 Dynamic Now Playing Display ✅
**Status:** In Progress
**Priority:** High
**Effort:** Small

**Description:**
Replace static "Radio Elgean Live" text with real-time track information fetched from metadata API.

**Features:**
- Poll metadata every 15 seconds
- Display artist and track title dynamically
- Show album name or release year
- Smooth transition animation when track changes

**Technical:**
- Add `/api/metadata` endpoint in Express
- Implement polling in player.js
- Update DOM elements with track info

### 1.2 Recently Played History Widget ✅
**Status:** In Progress
**Priority:** High
**Effort:** Small

**Description:**
Display the last 5 songs that played, helping users who tuned in late discover what they missed.

**Features:**
- Show previous 5 tracks in clean list
- Include artist and title for each
- Collapsible/expandable section
- Fade-in animation

**Technical:**
- Parse `prev_artist_1-5` and `prev_title_1-5` from metadata
- Create widget component below player
- Style with brand colors

### 1.3 Content Badges
**Status:** Planned
**Priority:** Medium
**Effort:** Small

**Description:**
Visual indicators showing special content types.

**Features:**
- 🆕 New Release badge
- ☀️ Summer Vibes badge
- 🎮 Video Game Music badge
- 🅴 Explicit Content badge

---

## Phase 2: Enhanced Experience (Week 2-3)

### 2.1 Audio Quality Verification
**Status:** Planned
**Priority:** Medium
**Effort:** Small

**Description:**
Display actual streaming quality from metadata instead of static text.

**Features:**
- Show real-time bit depth and sample rate
- Update quality badge dynamically
- Tooltip explaining audio specs

### 2.2 Track Change Notifications
**Status:** Planned
**Priority:** Medium
**Effort:** Small

**Description:**
Subtle toast notifications when songs change.

**Features:**
- Corner notification on track change
- Auto-dismiss after 5 seconds
- Non-intrusive design
- Animation effects

### 2.3 Search & Discover Links
**Status:** Planned
**Priority:** Medium
**Effort:** Medium

**Description:**
Quick links to search for tracks on major streaming platforms.

**Features:**
- Spotify search link
- Apple Music search link
- YouTube search link
- Show on hover (desktop) or tap (mobile)

---

## Phase 3: Backend Integration (Month 2)

### 3.1 Listening History Database
**Status:** Planned
**Priority:** High
**Effort:** Large

**Description:**
Store user listening history in SQLite database.

**Technical Requirements:**
- Create `listening_history` table
- Flask endpoint: `POST /api/history`
- Track: song_id, timestamp, duration, user_session
- Privacy considerations

**Features:**
- Personal listening history page
- "You listened to X tracks this week"
- Export listening data

### 3.2 Favorite Tracks System
**Status:** Planned
**Priority:** Medium
**Effort:** Medium

**Description:**
Allow users to save and manage favorite tracks.

**Technical Requirements:**
- Create `user_favorites` table
- Flask endpoints: POST/GET/DELETE `/api/favorites`
- User authentication (optional)

**Features:**
- Heart icon next to current track
- Favorites page with all saved tracks
- Remove from favorites
- Share favorites list

### 3.3 Track Statistics & Charts
**Status:** Planned
**Priority:** Low
**Effort:** Large

**Description:**
Aggregate statistics showing popular tracks and trends.

**Features:**
- Most played tracks (week/month/all-time)
- Trending songs
- Genre breakdown using metadata flags
- Charts page with visualizations

---

## Phase 4: Advanced Features (Month 3+)

### 4.1 Playlist Export
**Status:** Planned
**Priority:** Low
**Effort:** Medium

**Description:**
Export recently played tracks as playlists.

**Features:**
- "Export Last Hour" button
- Generate M3U playlist file
- Spotify playlist integration (API)
- Text file export with track list

### 4.2 Genre Detection & Recommendations
**Status:** Planned
**Priority:** Low
**Effort:** Large

**Description:**
Smart categorization using metadata flags.

**Features:**
- "You're listening to Video Game music" message
- Genre-based recommendations
- Mood detection
- Similar track suggestions

### 4.3 Listener Analytics Dashboard
**Status:** Planned
**Priority:** Low
**Effort:** Large

**Description:**
Real-time listener statistics and insights.

**Features:**
- Current listener count
- Peak listening times graph
- Geographic distribution (if available)
- Popular times to tune in

---

## Technical Architecture

### Metadata Flow
```
CloudFront (metadatav2.json)
    ↓
Express Proxy (/api/metadata)
    ↓ [Cache 15s]
Frontend (player.js)
    ↓
Update UI
```

### Database Schema (Phase 3)

**listening_history:**
- id (PK)
- track_title
- track_artist
- played_at
- session_id
- duration_seconds

**user_favorites:**
- id (PK)
- user_id (FK)
- track_title
- track_artist
- added_at

**track_statistics:**
- id (PK)
- track_title
- track_artist
- play_count
- last_played

---

## Success Metrics

### Phase 1
- ✅ Metadata updates every 15 seconds
- ✅ < 100ms UI update latency
- ✅ Zero failed metadata fetches

### Phase 2
- 30% of users engage with search links
- Positive feedback on notifications
- Increased session duration

### Phase 3
- 40% of active users save favorites
- 500+ tracks in listening history database
- 20% of users view their history

---

## Dependencies

**Phase 1:**
- Express.js (existing)
- CloudFront metadata API

**Phase 2:**
- No new dependencies

**Phase 3:**
- Flask backend (existing)
- SQLite database (existing)
- User authentication system (new)

**Phase 4:**
- Spotify Web API
- Chart.js or similar visualization library
- Analytics platform

---

## Release Schedule

| Phase | Features | Target | Status |
|-------|----------|--------|--------|
| 1.1 | Now Playing + History | Week 1 | 🟡 In Progress |
| 1.2 | Content Badges | Week 1 | ⚪ Planned |
| 2.x | Enhanced Experience | Week 2-3 | ⚪ Planned |
| 3.x | Backend Integration | Month 2 | ⚪ Planned |
| 4.x | Advanced Features | Month 3+ | ⚪ Planned |

---

## Notes

- All features designed with mobile-first approach
- Follows Radio Calico brand guidelines
- Privacy-conscious design (opt-in tracking)
- Graceful degradation if metadata unavailable
- Accessibility considerations (ARIA labels, keyboard navigation)

---

**Last Updated:** 2025-12-07
**Version:** 1.0
**Maintainer:** Radio Elgean Development Team
