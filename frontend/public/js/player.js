// Radio Elgean - HLS Player
// Stream URL: https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8

const STREAM_URL = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';

// DOM Elements
const audio = document.getElementById('radioStream');
const streamBtn = document.getElementById('streamBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const statusIndicator = document.getElementById('statusIndicator');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const albumArt = document.getElementById('albumArt');
const recentlyPlayedToggle = document.getElementById('recentlyPlayedToggle');
const recentlyPlayedContent = document.getElementById('recentlyPlayedContent');
const historyList = document.getElementById('historyList');

// State
let hls = null;
let isStreaming = false;
let isMuted = false;
let lastVolume = 70;
let metadataInterval = null;
let lastTrackTitle = '';

// Initialize player on page load
document.addEventListener('DOMContentLoaded', () => {
    initPlayer();
    setupEventListeners();
    loadSavedVolume();
    initMetadata();
});

// Initialize HLS Player
function initPlayer() {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(STREAM_URL);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest loaded successfully');
            updateStatus('ready', 'Ready to stream');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        updateStatus('error', 'Network error. Retrying...');
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        updateStatus('error', 'Media error. Recovering...');
                        hls.recoverMediaError();
                        break;
                    default:
                        updateStatus('error', 'Playback error');
                        hls.destroy();
                        break;
                }
            }
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        audio.src = STREAM_URL;
        updateStatus('ready', 'Ready to stream');
    } else {
        updateStatus('error', 'HLS not supported in this browser');
        console.error('HLS is not supported in this browser');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    streamBtn.addEventListener('click', toggleStream);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);
    recentlyPlayedToggle.addEventListener('click', toggleRecentlyPlayed);

    // Audio events
    audio.addEventListener('playing', () => {
        isStreaming = true;
        streamBtn.classList.add('streaming');
        streamBtn.setAttribute('aria-label', 'Stop Stream');
        updateStatus('playing', 'Now streaming');
        document.querySelector('.status-dot').classList.add('playing');
    });

    audio.addEventListener('pause', () => {
        isStreaming = false;
        streamBtn.classList.remove('streaming');
        streamBtn.setAttribute('aria-label', 'Start Stream');
        updateStatus('ready', 'Stream stopped');
        document.querySelector('.status-dot').classList.remove('playing');
    });

    audio.addEventListener('waiting', () => {
        streamBtn.classList.add('loading');
        updateStatus('loading', 'Buffering...');
    });

    audio.addEventListener('canplay', () => {
        streamBtn.classList.remove('loading');
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        updateStatus('error', 'Stream error');
        document.querySelector('.status-dot').classList.add('error');
    });
}

// Toggle Stream (Start/Stop)
async function toggleStream() {
    try {
        if (isStreaming) {
            // Stop stream completely
            audio.pause();
            audio.currentTime = 0;

            // Reload HLS stream to reset to live position
            if (hls) {
                hls.stopLoad();
            }
        } else {
            // Start stream from live position
            streamBtn.classList.add('loading');
            updateStatus('loading', 'Connecting to live stream...');

            // Reload stream to ensure we're at the live edge
            if (hls) {
                hls.startLoad();
            }

            await audio.play();
        }
    } catch (error) {
        console.error('Stream error:', error);
        streamBtn.classList.remove('loading');

        if (error.name === 'NotAllowedError') {
            updateStatus('error', 'Click to start stream');
        } else {
            updateStatus('error', 'Failed to connect to stream');
        }
    }
}

// Toggle Mute
function toggleMute() {
    if (isMuted) {
        audio.volume = lastVolume / 100;
        volumeSlider.value = lastVolume;
        volumeValue.textContent = lastVolume + '%';
        muteBtn.classList.remove('muted');
        muteBtn.setAttribute('aria-label', 'Mute');
        isMuted = false;
    } else {
        lastVolume = volumeSlider.value;
        audio.volume = 0;
        volumeSlider.value = 0;
        volumeValue.textContent = '0%';
        muteBtn.classList.add('muted');
        muteBtn.setAttribute('aria-label', 'Unmute');
        isMuted = true;
    }
    saveVolume();
}

// Handle Volume Change
function handleVolumeChange(e) {
    const volume = e.target.value;
    audio.volume = volume / 100;
    volumeValue.textContent = volume + '%';

    // Update mute state
    if (volume == 0) {
        muteBtn.classList.add('muted');
        isMuted = true;
    } else {
        muteBtn.classList.remove('muted');
        isMuted = false;
        lastVolume = volume;
    }

    saveVolume();
}

// Update Status Display
function updateStatus(status, message) {
    const statusText = statusIndicator.querySelector('.status-text');
    const statusDot = statusIndicator.querySelector('.status-dot');

    statusText.textContent = message;

    // Reset classes
    statusDot.classList.remove('playing', 'error');

    // Add appropriate class
    if (status === 'playing') {
        statusDot.classList.add('playing');
    } else if (status === 'error') {
        statusDot.classList.add('error');
    }
}

// Save volume to localStorage
function saveVolume() {
    try {
        localStorage.setItem('radioVolume', volumeSlider.value);
        localStorage.setItem('radioMuted', isMuted);
    } catch (e) {
        console.warn('Could not save volume to localStorage:', e);
    }
}

// Load saved volume from localStorage
function loadSavedVolume() {
    try {
        const savedVolume = localStorage.getItem('radioVolume');
        const savedMuted = localStorage.getItem('radioMuted');

        if (savedVolume !== null) {
            const volume = parseInt(savedVolume);
            volumeSlider.value = volume;
            volumeValue.textContent = volume + '%';
            audio.volume = volume / 100;
            lastVolume = volume;
        }

        if (savedMuted === 'true') {
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeValue.textContent = '0%';
            muteBtn.classList.add('muted');
            isMuted = true;
        }
    } catch (e) {
        console.warn('Could not load volume from localStorage:', e);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to start/stop stream
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleStream();
    }

    // M to mute/unmute
    if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
    }

    // Arrow keys for volume
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVolume = Math.min(100, parseInt(volumeSlider.value) + 5);
        volumeSlider.value = newVolume;
        handleVolumeChange({ target: volumeSlider });
    }

    if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVolume = Math.max(0, parseInt(volumeSlider.value) - 5);
        volumeSlider.value = newVolume;
        handleVolumeChange({ target: volumeSlider });
    }
});

// Metadata Functions
function initMetadata() {
    fetchMetadata(); // Fetch immediately
    metadataInterval = setInterval(fetchMetadata, 15000); // Then every 15 seconds
}

async function fetchMetadata() {
    try {
        const response = await fetch('/api/metadata');
        if (!response.ok) throw new Error('Metadata fetch failed');

        const metadata = await response.json();
        updateNowPlaying(metadata);
        updateRecentlyPlayed(metadata);
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
}

function updateNowPlaying(metadata) {
    if (!metadata || !metadata.artist || !metadata.title) return;

    const newTitle = `${metadata.artist} - ${metadata.title}`;

    // Only update if track changed
    if (newTitle !== lastTrackTitle) {
        trackTitle.textContent = newTitle;
        lastTrackTitle = newTitle;

        // Add fade animation
        trackTitle.classList.add('track-update');
        setTimeout(() => trackTitle.classList.remove('track-update'), 500);

        // Refresh album art with cache-busting timestamp
        const timestamp = new Date().getTime();
        albumArt.src = `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg?t=${timestamp}`;
    }

    // Update artist/album info
    if (metadata.album && metadata.album !== metadata.title) {
        trackArtist.textContent = metadata.album;
    } else if (metadata.date) {
        trackArtist.textContent = metadata.date;
    } else {
        trackArtist.textContent = 'Crystal Clear Audio';
    }
}

function updateRecentlyPlayed(metadata) {
    if (!metadata) return;

    const tracks = [];
    for (let i = 1; i <= 5; i++) {
        const artist = metadata[`prev_artist_${i}`];
        const title = metadata[`prev_title_${i}`];
        if (artist && title) {
            tracks.push({ artist, title });
        }
    }

    if (tracks.length === 0) {
        historyList.innerHTML = '<div class="no-history">No history available</div>';
        return;
    }

    historyList.innerHTML = tracks.map((track, index) => `
        <div class="history-item">
            <div class="history-number">${index + 1}</div>
            <div class="history-track">
                <div class="history-title">${track.title}</div>
                <div class="history-artist">${track.artist}</div>
            </div>
        </div>
    `).join('');
}

function toggleRecentlyPlayed() {
    const isHidden = recentlyPlayedContent.classList.contains('hidden');

    if (isHidden) {
        recentlyPlayedContent.classList.remove('hidden');
        recentlyPlayedToggle.classList.add('expanded');
    } else {
        recentlyPlayedContent.classList.add('hidden');
        recentlyPlayedToggle.classList.remove('expanded');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (hls) {
        hls.destroy();
    }
    if (metadataInterval) {
        clearInterval(metadataInterval);
    }
});
