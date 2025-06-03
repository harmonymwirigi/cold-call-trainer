/**
 * Audio Manager - Handles all audio playback and phone sounds
 */

export class AudioManager {
    constructor(app) {
        this.app = app;
        this.audioElements = {
            dial: null,
            ring: null,
            hangup: null,
            currentSpeech: null
        };
    }
    
    async init() {
        this.initializePhoneSounds();
        console.log('🔊 Audio Manager initialized');
    }
    
    initializePhoneSounds() {
        // Create audio elements for phone sounds
        this.audioElements.dial = this.createPhoneTone('dial', [350, 440], 0.5);
        this.audioElements.ring = this.createPhoneTone('ring', [440, 480], 1.0, true);
        this.audioElements.hangup = this.createPhoneTone('hangup', [480, 620], 0.5);
    }
    
    createPhoneTone(type, frequencies, duration, loop = false) {
        try {
            // Use Web Audio API for better phone tones
            if (window.AudioContext || window.webkitAudioContext) {
                return this.createWebAudioTone(frequencies, duration, loop);
            } else {
                // Fallback to simple audio element
                return this.createSimpleAudioTone(type, frequencies, duration, loop);
            }
        } catch (error) {
            console.warn('Failed to create audio tone:', error);
            return this.createSilentAudio();
        }
    }
    
    createWebAudioTone(frequencies, duration, loop = false) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        return {
            play: () => {
                try {
                    const oscillators = frequencies.map(freq => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                        
                        oscillator.start(audioContext.currentTime);
                        
                        if (!loop) {
                            oscillator.stop(audioContext.currentTime + duration);
                        }
                        
                        return { oscillator, gainNode };
                    });
                    
                    return {
                        stop: () => {
                            oscillators.forEach(({ oscillator }) => {
                                try {
                                    oscillator.stop();
                                } catch (e) {
                                    // Oscillator might already be stopped
                                }
                            });
                        }
                    };
                } catch (error) {
                    console.warn('Web Audio playback failed:', error);
                    return { stop: () => {} };
                }
            },
            pause: () => {},
            currentTime: 0,
            loop: loop
        };
    }
    
    createSimpleAudioTone(type, frequencies, duration, loop = false) {
        const audio = new Audio();
        
        try {
            // Generate simple WAV data
            const sampleRate = 8000;
            const samples = sampleRate * duration;
            const buffer = new ArrayBuffer(44 + samples * 2);
            const view = new DataView(buffer);
            
            // WAV header
            this.writeWAVHeader(view, samples, sampleRate);
            
            // Generate audio data
            for (let i = 0; i < samples; i++) {
                let sample = 0;
                frequencies.forEach(freq => {
                    sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
                });
                const amplitude = Math.floor((sample / frequencies.length) * 8191); // Reduced volume
                view.setInt16(44 + i * 2, amplitude, true);
            }
            
            const blob = new Blob([buffer], { type: 'audio/wav' });
            audio.src = URL.createObjectURL(blob);
            audio.loop = loop;
            
            return audio;
        } catch (error) {
            console.warn('Failed to create simple audio tone:', error);
            return this.createSilentAudio();
        }
    }
    
    writeWAVHeader(view, samples, sampleRate) {
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);
    }
    
    createSilentAudio() {
        // Fallback silent audio
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAAAQAAAAAAAAAAAQAAABhQAABAAAAAAZGF0YQQAAAA=';
        return audio;
    }
    
    playDialTone() {
        this.stopAudio();
        if (this.audioElements.dial) {
            try {
                this.audioElements.dial.play();
            } catch (error) {
                console.warn('Failed to play dial tone:', error);
            }
        }
    }
    
    playRingTone() {
        this.stopAudio();
        if (this.audioElements.ring) {
            try {
                this.audioElements.ring.play();
            } catch (error) {
                console.warn('Failed to play ring tone:', error);
            }
        }
    }
    
    playHangupTone() {
        this.stopAudio();
        if (this.audioElements.hangup) {
            try {
                this.audioElements.hangup.play();
            } catch (error) {
                console.warn('Failed to play hangup tone:', error);
            }
        }
    }
    
    playAISpeech(audioUrl, onEndCallback) {
        this.stopCurrentSpeech();
        
        try {
            this.audioElements.currentSpeech = new Audio(audioUrl);
            
            this.audioElements.currentSpeech.onended = () => {
                this.audioElements.currentSpeech = null;
                if (onEndCallback) onEndCallback();
            };
            
            this.audioElements.currentSpeech.onerror = (error) => {
                console.error('AI speech playback error:', error);
                this.audioElements.currentSpeech = null;
                if (onEndCallback) onEndCallback();
            };
            
            this.audioElements.currentSpeech.play();
        } catch (error) {
            console.error('Failed to play AI speech:', error);
            if (onEndCallback) onEndCallback();
        }
    }
    
    stopCurrentSpeech() {
        if (this.audioElements.currentSpeech) {
            try {
                this.audioElements.currentSpeech.pause();
                this.audioElements.currentSpeech.currentTime = 0;
                this.audioElements.currentSpeech = null;
            } catch (error) {
                console.warn('Failed to stop current speech:', error);
            }
        }
    }
    
    stopAudio() {
        Object.values(this.audioElements).forEach(audio => {
            if (audio && typeof audio.pause === 'function') {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch (error) {
                    console.warn('Failed to stop audio:', error);
                }
            } else if (audio && typeof audio.stop === 'function') {
                try {
                    audio.stop();
                } catch (error) {
                    console.warn('Failed to stop Web Audio:', error);
                }
            }
        });
    }
    
    setVolume(volume) {
        // Set volume for all audio elements (0.0 to 1.0)
        const clampedVolume = Math.max(0, Math.min(1, volume));
        
        Object.values(this.audioElements).forEach(audio => {
            if (audio && 'volume' in audio) {
                audio.volume = clampedVolume;
            }
        });
    }
    
    mute() {
        this.setVolume(0);
    }
    
    unmute() {
        this.setVolume(1);
    }
    
    // Audio context management for better mobile support
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
        return Promise.resolve();
    }
    
    // Preload audio for better performance
    preloadAudio() {
        return Promise.all([
            this.preloadPhoneTones(),
            this.testAudioCapabilities()
        ]);
    }
    
    preloadPhoneTones() {
        return new Promise((resolve) => {
            // Phone tones are generated, not loaded
            resolve();
        });
    }
    
    testAudioCapabilities() {
        return new Promise((resolve) => {
            const capabilities = {
                webAudio: !!(window.AudioContext || window.webkitAudioContext),
                htmlAudio: !!window.Audio,
                speechSynthesis: !!window.speechSynthesis,
                mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            };
            
            console.log('🔊 Audio capabilities:', capabilities);
            resolve(capabilities);
        });
    }
    
    // Error handling and fallbacks
    handleAudioError(error, context) {
        console.error(`Audio error in ${context}:`, error);
        
        // Show user-friendly error message
        if (error.name === 'NotAllowedError') {
            this.app.uiManager.showWarning('Audio permission denied. Please allow audio access for the best experience.');
        } else if (error.name === 'NotSupportedError') {
            this.app.uiManager.showWarning('Audio not supported on this device. Some features may not work.');
        } else {
            this.app.uiManager.showWarning('Audio playback issue. Please check your device settings.');
        }
    }
    
    // Mobile-specific audio handling
    initializeMobileAudio() {
        if (this.isMobileDevice()) {
            // Mobile devices often require user interaction to enable audio
            document.addEventListener('touchstart', this.enableMobileAudio.bind(this), { once: true });
            document.addEventListener('click', this.enableMobileAudio.bind(this), { once: true });
        }
    }
    
    enableMobileAudio() {
        // Resume audio context and play silent audio to unlock
        this.resumeAudioContext();
        
        // Play silent audio to unlock audio on iOS
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAAAQAAAAAAAAAAAQAAABhQAABAAAAAAZGF0YQQAAAA=');
        silentAudio.play().catch(() => {
            // Ignore errors for silent audio
        });
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Audio quality management
    adjustAudioQuality(quality) {
        // quality: 'low', 'medium', 'high'
        const qualitySettings = {
            low: { sampleRate: 8000, bitRate: 64 },
            medium: { sampleRate: 16000, bitRate: 128 },
            high: { sampleRate: 44100, bitRate: 256 }
        };
        
        const settings = qualitySettings[quality] || qualitySettings.medium;
        this.currentAudioQuality = settings;
        
        console.log(`🔊 Audio quality set to ${quality}:`, settings);
    }
    
    // Audio feedback for UI interactions
    playUISound(type) {
        const uiSounds = {
            click: () => this.playShortBeep(800, 0.1),
            success: () => this.playShortBeep(1000, 0.2),
            error: () => this.playShortBeep(400, 0.3),
            notification: () => this.playShortBeep(600, 0.15)
        };
        
        if (uiSounds[type]) {
            uiSounds[type]();
        }
    }
    
    playShortBeep(frequency, duration) {
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }
        } catch (error) {
            console.warn('Failed to play UI sound:', error);
        }
    }
    
    // Cleanup and resource management
    cleanup() {
        this.stopAudio();
        
        // Clean up Web Audio resources
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Revoke object URLs to free memory
        Object.values(this.audioElements).forEach(audio => {
            if (audio && audio.src && audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(audio.src);
            }
        });
        
        this.audioElements = {
            dial: null,
            ring: null,
            hangup: null,
            currentSpeech: null
        };
    }
}