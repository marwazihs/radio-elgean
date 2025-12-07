// Radio Elgean - HLS Player
// Stream URL: https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8

const STREAM_URL = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';

// DOM Elements
const audio = document.getElementById('radioStream');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const statusIndicator = document.getElementById('statusIndicator');

// State
let hls = null;
let isPlaying = false;
let isMuted = false;
let lastVolume = 70;

// Initialize player on page load
document.addEventListener('DOMContentLoaded', () => {
    initPlayer();
    setupEventListeners();
    loadSavedVolume();
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
            updateStatus('ready', 'Ready to play');
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
        updateStatus('ready', 'Ready to play');
    } else {
        updateStatus('error', 'HLS not supported in this browser');
        console.error('HLS is not supported in this browser');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlayPause);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);

    // Audio events
    audio.addEventListener('playing', () => {
        isPlaying = true;
        playPauseBtn.classList.add('playing');
        playPauseBtn.setAttribute('aria-label', 'Pause');
        updateStatus('playing', 'Now playing');
        document.querySelector('.status-dot').classList.add('playing');
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        playPauseBtn.classList.remove('playing');
        playPauseBtn.setAttribute('aria-label', 'Play');
        updateStatus('ready', 'Paused');
        document.querySelector('.status-dot').classList.remove('playing');
    });

    audio.addEventListener('waiting', () => {
        playPauseBtn.classList.add('loading');
        updateStatus('loading', 'Buffering...');
    });

    audio.addEventListener('canplay', () => {
        playPauseBtn.classList.remove('loading');
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        updateStatus('error', 'Playback failed');
        document.querySelector('.status-dot').classList.add('error');
    });
}

// Toggle Play/Pause
async function togglePlayPause() {
    try {
        if (isPlaying) {
            audio.pause();
        } else {
            playPauseBtn.classList.add('loading');
            updateStatus('loading', 'Connecting...');
            await audio.play();
        }
    } catch (error) {
        console.error('Playback error:', error);
        playPauseBtn.classList.remove('loading');

        if (error.name === 'NotAllowedError') {
            updateStatus('error', 'Click to start playback');
        } else {
            updateStatus('error', 'Failed to play stream');
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
    // Space bar to play/pause
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (hls) {
        hls.destroy();
    }
});
