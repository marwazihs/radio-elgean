// Browser Fingerprinting - Generate unique user identifier
// Uses IP (from server) + browser fingerprint to create a unique user ID

class UserFingerprint {
    constructor() {
        this.fingerprintId = null;
    }

    /**
     * Generate a unique browser fingerprint based on user agent, canvas, and screen data
     */
    generateFingerprint() {
        const components = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            screenColorDepth: window.screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            canvas: this.getCanvasFingerprint(),
            webgl: this.getWebGLFingerprint(),
        };

        return this.hashObject(components);
    }

    /**
     * Generate canvas-based fingerprint
     */
    getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Radio Elgean', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Radio Elgean', 4, 17);
            return canvas.toDataURL().substring(0, 50); // First 50 chars of canvas data
        } catch (e) {
            return 'canvas-unavailable';
        }
    }

    /**
     * Generate WebGL-based fingerprint
     */
    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'webgl-unavailable';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).substring(0, 30);
            }
            return 'webgl-supported';
        } catch (e) {
            return 'webgl-unavailable';
        }
    }

    /**
     * Simple hash function for object data
     */
    hashObject(obj) {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Get or create fingerprint ID
     */
    async getFingerprintId() {
        if (this.fingerprintId) {
            return this.fingerprintId;
        }

        // Try to get from localStorage first
        const stored = localStorage.getItem('radioUserFingerprint');
        if (stored) {
            this.fingerprintId = stored;
            return this.fingerprintId;
        }

        // Generate new fingerprint
        const browserFingerprint = this.generateFingerprint();

        // Get IP from server
        try {
            const response = await fetch('/api/user-ip');
            const data = await response.json();
            const ipHash = this.hashSimple(data.ip || 'no-ip');

            // Combine IP + browser fingerprint
            this.fingerprintId = `${ipHash}-${browserFingerprint}`;
        } catch (e) {
            console.warn('Could not fetch IP, using browser fingerprint only');
            this.fingerprintId = browserFingerprint;
        }

        // Store in localStorage for consistency
        try {
            localStorage.setItem('radioUserFingerprint', this.fingerprintId);
        } catch (e) {
            console.warn('Could not store fingerprint in localStorage');
        }

        return this.fingerprintId;
    }

    /**
     * Simple hash for IP address
     */
    hashSimple(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}

// Create global instance
const userFingerprint = new UserFingerprint();
