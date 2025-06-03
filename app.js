/**
 * Cold Call Roleplay Trainer - Core Application Class
 * Main application orchestrator and state management
 */

// Global Application State
class ColdCallTrainer {
    constructor() {
        // Core state
        this.currentUser = null;
        this.currentModule = null;
        this.currentMode = null;
        this.currentProgress = 0;
        this.maxProgress = 10;
        this.isCallActive = false;
        this.callStartTime = null;
        this.totalPracticeTime = 0;
        
        // Initialize managers
        this.userManager = new UserManager(this);
        this.moduleManager = new ModuleManager(this);
        this.callManager = new CallManager(this);
        this.speechManager = new SpeechManager(this);
        this.characterManager = new CharacterManager(this);
        this.uiManager = new UIManager(this);
        this.progressManager = new ProgressManager(this);
        this.audioManager = new AudioManager(this);
        
        this.init();
    }
    
    async init() {
        console.log('🎯 Cold Call Trainer initializing...');
        
        try {
            // Initialize all managers
            await this.audioManager.init();
            await this.speechManager.init();
            this.uiManager.init();
            this.characterManager.init();
            this.moduleManager.init();
            this.progressManager.loadProgress();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.uiManager.updateUI();
            
            console.log('✅ Cold Call Trainer initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.uiManager.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.isCallActive) {
                e.preventDefault();
                e.returnValue = 'You have an active call. Are you sure you want to leave?';
            }
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.speechManager.isRecording) {
                this.speechManager.stopListening();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            this.uiManager.showSuccess('Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.uiManager.showError('Connection lost - some features may not work');
        });
    }
    
    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (this.isCallActive && !this.speechManager.continuousListening) {
                    this.speechManager.toggleListening();
                }
                break;
            case 'Escape':
                if (this.isCallActive) {
                    this.callManager.endCall();
                } else {
                    this.uiManager.showModuleDashboard();
                }
                break;
        }
    }
    
    // Public API methods for global functions
    startTraining() {
        return this.userManager.startTraining();
    }
    
    startModule(moduleId, mode) {
        return this.moduleManager.startModule(moduleId, mode);
    }
    
    endCall() {
        return this.callManager.endCall();
    }
    
    toggleMute() {
        return this.callManager.toggleMute();
    }
    
    toggleSpeaker() {
        return this.callManager.toggleSpeaker();
    }
    
    showKeypad() {
        return this.callManager.showKeypad();
    }
    
    closeFeedbackModal() {
        return this.uiManager.closeFeedbackModal();
    }
    
    nextCall() {
        return this.callManager.nextCall();
    }
    
    hideUnlockNotice() {
        return this.uiManager.hideUnlockNotice();
    }
    
    // State getters
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentModule() {
        return this.currentModule;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    getCurrentProgress() {
        return this.currentProgress;
    }
    
    getMaxProgress() {
        return this.maxProgress;
    }
    
    isInCall() {
        return this.isCallActive;
    }
    
    // State setters
    setCurrentUser(user) {
        this.currentUser = user;
    }
    
    setCurrentModule(moduleId) {
        this.currentModule = moduleId;
    }
    
    setCurrentMode(mode) {
        this.currentMode = mode;
    }
    
    setCurrentProgress(progress) {
        this.currentProgress = progress;
    }
    
    setMaxProgress(maxProgress) {
        this.maxProgress = maxProgress;
    }
    
    setCallActive(active) {
        this.isCallActive = active;
    }
    
    setCallStartTime(time) {
        this.callStartTime = time;
    }
    
    // Utility methods
    logActivity(action, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            user: this.currentUser?.name || 'Anonymous',
            ...data
        };
        
        console.log('📊 Activity:', logEntry);
        
        try {
            const logs = JSON.parse(localStorage.getItem('coldCallLogs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('coldCallLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

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

/**
 * Call Manager - Handles call flow, progression, and phone interface
 */

export class CallManager {
    constructor(app) {
        this.app = app;
        this.callTimer = null;
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.warmupQuestions = [];
    }
    
    initializeCall() {
        const currentCharacter = this.app.characterManager.selectRandomCharacter();
        this.app.characterManager.setCurrentCharacter(currentCharacter);
        
        this.app.setCallActive(true);
        this.app.setCallStartTime(Date.now());
        this.app.speechManager.continuousListening = true;
        
        // Reset call-specific data
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.app.speechManager.clearSessionData();
        
        // Show phone interface
        document.getElementById('moduleDashboard').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'flex';
        
        this.setupPhoneUI();
        this.startCallSequence();
    }
    
    setupPhoneUI() {
        const character = this.app.characterManager.getCurrentCharacter();
        const module = this.app.moduleManager.modules[this.app.getCurrentModule()];
        
        // Update contact info
        document.getElementById('contactImage').src = character.image;
        document.getElementById('contactName').textContent = character.name;
        document.getElementById('contactTitle').textContent = character.title;
        document.getElementById('contactCompany').textContent = character.company;
        
        // Update module info
        document.getElementById('moduleType').textContent = `${this.app.getCurrentMode().toUpperCase()} Mode`;
        document.getElementById('moduleDescription').textContent = module.description;
        
        // Setup progress display
        if (this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend') {
            document.getElementById('callProgressContainer').style.display = 'block';
            this.updateCallProgress();
        } else {
            document.getElementById('callProgressContainer').style.display = 'none';
        }
        
        // Reset UI state
        document.getElementById('callStatus').querySelector('.status-text').textContent = 'Dialing...';
        document.getElementById('callTimer').textContent = '00:00';
        document.getElementById('voiceStatus').textContent = 'Connecting...';
        
        this.app.uiManager.resetVoiceVisualizer();
        
        // Fix hangup button positioning (G1)
        this.fixHangupButtonPosition();
    }
    
    fixHangupButtonPosition() {
        const hangupBtn = document.querySelector('.decline-btn');
        if (hangupBtn) {
            // Ensure hangup button stays within phone boundaries
            hangupBtn.style.position = 'relative';
            hangupBtn.style.zIndex = '10';
            hangupBtn.style.margin = '0 auto';
            hangupBtn.style.maxWidth = '80px';
            hangupBtn.style.maxHeight = '80px';
            
            console.log('📱 Fixed hangup button positioning');
        }
    }
    
    startCallSequence() {
        this.updateCallStatus('Dialing...');
        this.app.audioManager.playDialTone();
        
        setTimeout(() => {
            // Simulate scenarios
            const scenarios = ['ring', 'ring', 'ring', 'no_answer', 'ring'];
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            
            if (scenario === 'no_answer') {
                this.handleNoAnswer();
            } else {
                this.startRinging();
            }
        }, 2000);
    }
    
    handleNoAnswer() {
        this.updateCallStatus('No answer...');
        this.app.audioManager.stopAudio();
        
        setTimeout(() => {
            this.updateCallStatus('Redialing...');
            setTimeout(() => {
                this.startRinging();
            }, 1500);
        }, 3000);
    }
    
    startRinging() {
        this.updateCallStatus('Ringing...');
        this.app.audioManager.playRingTone();
        
        // Add call animation
        document.getElementById('callAnimation').classList.add('active');
        
        setTimeout(() => {
            this.answerCall();
        }, 3000 + Math.random() * 3000);
    }
    
    answerCall() {
        this.app.audioManager.stopAudio();
        document.getElementById('callAnimation').classList.remove('active');
        
        this.updateCallStatus('Connected');
        this.startCallTimer();
        this.app.speechManager.updateVoiceStatus('AI is speaking...');
        
        setTimeout(() => {
            this.startConversation();
        }, 1000);
    }
    
    startConversation() {
        const welcomeMessage = this.generateWelcomeMessage();
        this.app.speechManager.speakAI(welcomeMessage);
        
        setTimeout(() => {
            if (this.app.isInCall()) {
                this.app.speechManager.startContinuousListening();
            }
        }, 2000);
    }
    
    generateWelcomeMessage() {
        const character = this.app.characterManager.getCurrentCharacter();
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            return this.generateWarmupMessage(character);
        }
        
        const welcomeMessages = {
            opener: [
                `Hello, this is ${character.name}. I'm quite busy, so make this quick.`,
                `${character.name} speaking. What do you want?`,
                `This is ${character.name}. I don't have much time, what's this about?`,
                `${character.name} here. I wasn't expecting a call.`
            ],
            pitch: [
                `Hi, this is ${character.name}. Go ahead with your pitch.`,
                `${character.name} speaking. I'll give you two minutes, what's your pitch?`,
                `This is ${character.name}. You've got my attention, now pitch me.`,
                `${character.name} here. I'm listening, what are you selling?`
            ],
            fullcall: [
                `Hello, this is ${character.name}.`,
                `${character.name} speaking, who is this?`,
                `This is ${character.name}, how can I help you?`,
                `${character.name} here, what's this regarding?`
            ],
            powerhour: [
                `Call ${this.app.getCurrentProgress() + 1}. Hello, this is ${character.name}. You've got 30 seconds.`,
                `Power Hour Call ${this.app.getCurrentProgress() + 1}. This is ${character.name}, make it quick.`,
                `${character.name} speaking. I'm between meetings, talk fast.`,
                `Call ${this.app.getCurrentProgress() + 1} of 10. ${character.name} here, what do you want?`
            ]
        };
        
        const messages = welcomeMessages[currentModule] || welcomeMessages.opener;
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    generateWarmupMessage(character) {
        const warmupPrompts = [
            "Give me your opener.",
            "What's your pitch in one sentence?",
            "Ask me for a meeting.",
            "Handle this objection: 'What's this about?'",
            "Handle this objection: 'I'm not interested.'",
            "Handle this objection: 'Send me an email.'",
            "Handle this objection: 'We don't take cold calls.'",
            "Handle this objection: 'Now is not a good time.'",
            "Handle this objection: 'I have a meeting.'",
            "Handle this objection: 'Can you call me later?'",
            "Handle this objection: 'Who gave you this number?'",
            "Handle this objection: 'What are you trying to sell me?'",
            "Handle this objection: 'Is this a sales call?'",
            "Handle this objection: 'We are ok for the moment.'",
            "Handle this objection: 'We're not looking for anything.'",
            "Handle this objection: 'How long is this going to take?'",
            "Handle this objection: 'What company are you calling from?'",
            "Handle this objection: 'I never heard of you.'",
            "Handle this objection: 'It's too expensive for us.'",
            "Handle this objection: 'We have no budget right now.'",
            "Handle this objection: 'Your competitor is cheaper.'",
            "Handle this objection: 'This isn't a good time.'",
            "Handle this objection: 'We've already set this year's budget.'",
            "Handle this objection: 'Call me back next quarter.'",
            "Handle this objection: 'We already use a competitor.'"
        ];
        
        // Shuffle questions for randomness
        if (this.warmupQuestions.length === 0) {
            this.warmupQuestions = [...warmupPrompts].sort(() => Math.random() - 0.5);
        }
        
        const questionNumber = this.app.getCurrentProgress() + 1;
        const currentQuestion = this.warmupQuestions[this.app.getCurrentProgress()];
        
        return `Welcome to warm-up training! I'm ${character.name}. Question ${questionNumber} of 25: ${currentQuestion}`;
    }
    
    handleSuccessfulInteraction() {
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        this.updateCallProgress();
        
        const currentModule = this.app.getCurrentModule();
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        console.log(`✅ Progress: ${currentProgress}/${maxProgress} in ${this.app.getCurrentMode()} mode`);
        
        if (currentModule === 'warmup') {
            this.correctAnswers++;
            this.handleWarmupProgress();
        } else if (currentProgress >= maxProgress) {
            console.log(`🎯 Reached max progress - completing ${this.app.getCurrentMode()} mode`);
            this.completeCurrentCall();
        } else {
            this.showQuickSuccess();
        }
    }
    
    handleWarmupProgress() {
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        // Update score display
        this.updateWarmupScore();
        
        if (currentProgress >= maxProgress) {
            // Warmup complete - check score
            this.completeWarmupChallenge();
        } else {
            // Continue to next question
            this.showQuickSuccess();
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.askNextWarmupQuestion();
                }
            }, 2000);
        }
    }
    
    completeWarmupChallenge() {
        const module = this.app.moduleManager.modules.warmup;
        const score = this.correctAnswers;
        const passingScore = module.passingScore;
        
        // Set the score as current progress for saving
        this.app.setCurrentProgress(score);
        
        const passed = score >= passingScore;
        
        setTimeout(() => {
            this.endCall(true);
            
            if (passed) {
                this.app.moduleManager.completeModule('warmup', 'practice');
            } else {
                this.app.uiManager.showError(`Challenge failed. Score: ${score}/25. Need ${passingScore} to pass. Try again!`);
            }
        }, 2000);
    }
    
    askNextWarmupQuestion() {
        const currentIndex = this.app.getCurrentProgress();
        if (currentIndex < this.warmupQuestions.length) {
            const nextQuestion = this.warmupQuestions[currentIndex];
            const questionNumber = currentIndex + 1;
            
            this.app.speechManager.speakAI(`Question ${questionNumber} of 25: ${nextQuestion}`);
        }
    }
    
    updateWarmupScore() {
        const currentProgress = this.app.getCurrentProgress();
        
        // Update voice status to show score
        this.app.speechManager.updateVoiceStatus(`Score: ${this.correctAnswers}/${currentProgress}`);
        
        // Update call progress to show questions completed
        const progressPercent = (currentProgress / 25) * 100;
        document.getElementById('callProgressFill').style.width = `${progressPercent}%`;
        document.getElementById('callProgressText').textContent = `${this.correctAnswers}/${currentProgress}`;
    }
    
    handleTimeoutNext() {
        // Move to next question without marking as correct
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        if (currentProgress >= maxProgress) {
            this.completeWarmupChallenge();
        } else {
            this.askNextWarmupQuestion();
        }
    }
    
    handleSkipNext() {
        // Same as timeout - move to next without marking correct
        this.handleTimeoutNext();
    }
    
    completeCurrentCall() {
        this.app.progressManager.saveProgress();
        
        setTimeout(() => {
            this.endCall(true);
            this.app.moduleManager.completeModule(this.app.getCurrentModule(), this.app.getCurrentMode());
        }, 2000);
    }
    
    showQuickSuccess() {
        this.app.speechManager.updateVoiceStatus('Great response! Continuing...');
        setTimeout(() => {
            if (this.app.isInCall()) {
                this.app.speechManager.updateVoiceStatus('Your turn - keep going');
            }
        }, 2000);
    }
    
    updateCallProgress() {
        if (this.app.getCurrentMode() === 'practice' && this.app.getCurrentModule() !== 'warmup') return;
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        const progressPercent = (currentProgress / maxProgress) * 100;
        
        document.getElementById('callProgressFill').style.width = `${progressPercent}%`;
        
        if (this.app.getCurrentModule() === 'warmup') {
            document.getElementById('callProgressText').textContent = `${this.correctAnswers}/${currentProgress}`;
        } else {
            document.getElementById('callProgressText').textContent = `${currentProgress}/${maxProgress}`;
        }
    }
    
    updateCallStatus(status) {
        const statusEl = document.getElementById('callStatus').querySelector('.status-text');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }
    
    startCallTimer() {
        this.callTimer = setInterval(() => {
            if (!this.app.callStartTime) return;
            
            const elapsed = Date.now() - this.app.callStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timerEl = document.getElementById('callTimer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    endCall(completed = false) {
        this.app.setCallActive(false);
        this.app.speechManager.continuousListening = false;
        this.app.speechManager.stopListening();
        this.app.speechManager.stopCurrentSpeech();
        this.app.audioManager.stopAudio();
        
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        // Track call duration
        if (this.app.callStartTime) {
            const callDuration = Date.now() - this.app.callStartTime;
            this.app.totalPracticeTime += callDuration;
            this.app.progressManager.saveProgress();
        }
        
        this.app.audioManager.playHangupTone();
        
        setTimeout(() => {
            if (completed) {
                this.showCompletionMessage();
            } else {
                this.showCallSummary();
            }
        }, 1000);
        
        this.app.logActivity('call_ended', { 
            module: this.app.getCurrentModule(), 
            mode: this.app.getCurrentMode(), 
            progress: this.app.getCurrentProgress(),
            completed 
        });
    }
    
    showCallSummary() {
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            this.showWarmupSummary();
        } else {
            this.app.uiManager.showModuleDashboard();
        }
    }
    
    showWarmupSummary() {
        const skipped = this.app.speechManager.getSkippedQuestions();
        const timeouts = this.app.speechManager.getTimeoutResponses();
        const score = this.correctAnswers;
        const totalQuestions = this.app.getCurrentProgress();
        
        let summaryContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2rem; font-weight: bold; color: ${score >= 18 ? '#4CAF50' : '#f44336'};">
                    ${score}/${totalQuestions}
                </div>
                <div>Questions Answered Correctly</div>
            </div>
        `;
        
        if (skipped.length > 0) {
            summaryContent += `
                <div style="margin-bottom: 15px;">
                    <strong>Skipped Questions (${skipped.length}):</strong>
                    <ul style="text-align: left; margin-top: 10px;">
                        ${skipped.map(q => `<li>Question ${q.questionNumber}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (timeouts.length > 0) {
            summaryContent += `
                <div style="margin-bottom: 15px;">
                    <strong>Too Slow Responses (${timeouts.length}):</strong>
                    <ul style="text-align: left; margin-top: 10px;">
                        ${timeouts.map(t => `<li>Question ${t.questionNumber}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        const passed = score >= 18;
        if (passed) {
            summaryContent += `<div style="color: #4CAF50; font-weight: bold;">🎉 Challenge Passed! Next module unlocked.</div>`;
        } else {
            summaryContent += `<div style="color: #f44336; font-weight: bold;">Need 18/25 to pass. Try again!</div>`;
        }
        
        this.app.uiManager.showFeedbackModal('Warm-up Challenge Complete', summaryContent);
    }
    
    showCompletionMessage() {
        const module = this.app.moduleManager.modules[this.app.getCurrentModule()];
        const mode = this.app.getCurrentMode();
        
        let title, message;
        
        if (mode === 'legend') {
            title = 'Legend Complete!';
            message = `Congratulations! You've completed ${module.name} in Legend mode. You're a master!`;
        } else if (mode === 'marathon') {
            title = 'Marathon Complete!';
            message = `Excellent work! You've completed the ${module.name} marathon. Legend mode is now available!`;
        } else {
            title = 'Practice Complete!';
            message = `Great job! You've completed ${module.name}. Ready for the marathon?`;
        }
        
        this.app.uiManager.showFeedbackModal(title, message);
    }
    
    nextCall() {
        this.app.uiManager.closeFeedbackModal();
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        if (currentProgress < maxProgress && this.app.getCurrentMode() !== 'practice') {
            // Continue current module
            this.initializeCall();
        } else {
            // Return to dashboard
            this.app.uiManager.showModuleDashboard();
        }
    }
    
    // Call control methods
    toggleMute() {
        console.log('🔇 Mute toggled');
        // Implementation for mute functionality
    }
    
    toggleSpeaker() {
        console.log('🔊 Speaker toggled');
        // Implementation for speaker functionality
    }
    
    showKeypad() {
        console.log('⌨️ Keypad shown');
        // Implementation for keypad functionality
    }
    
    // Hangup functionality for all roleplays
    addHangupButton() {
        // Ensure hangup button is properly positioned within phone boundaries
        const hangupBtn = document.querySelector('.decline-btn');
        if (hangupBtn) {
            hangupBtn.style.position = 'relative';
            hangupBtn.style.zIndex = '10';
        }
    }
    
    handleHangup() {
        if (this.app.isInCall()) {
            // Provide AI coaching based on current performance
            this.provideHangupCoaching();
            this.endCall(false);
        }
    }
    
    provideHangupCoaching() {
        const currentModule = this.app.getCurrentModule();
        const currentProgress = this.app.getCurrentProgress();
        
        let coachingMessage = "Call ended early. ";
        
        switch (currentModule) {
            case 'opener':
                coachingMessage += "Focus on your opening line and handling early objections. Practice building rapport quickly.";
                break;
            case 'pitch':
                coachingMessage += "Work on your pitch delivery and objection handling. Make sure to ask for the meeting.";
                break;
            case 'warmup':
                coachingMessage += `You completed ${currentProgress} questions. Practice the fundamentals more.`;
                break;
            case 'fullcall':
                coachingMessage += "Complete cold calls require persistence. Practice each component separately first.";
                break;
            case 'powerhour':
                coachingMessage += "Power hour requires stamina. Build up your skills with individual modules first.";
                break;
        }
        
        this.app.uiManager.showFeedbackModal('Coaching Feedback', coachingMessage);
    }
}


/**
 * Character Manager - Handles AI character selection and behavior
 */

export class CharacterManager {
    constructor(app) {
        this.app = app;
        this.characters = {};
        this.currentCharacter = null;
    }
    
    init() {
        this.characters = this.initializeCharacters();
        console.log('👥 Character Manager initialized');
    }
    
    initializeCharacters() {
        return {
            male: [
                {
                    id: 'david_chen',
                    name: 'David Chen',
                    title: 'VP of Sales',
                    company: 'TechCorp Solutions',
                    voice: 'Matthew',
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
                    personality: 'analytical, skeptical, busy',
                    market: 'usa'
                },
                {
                    id: 'james_wilson',
                    name: 'James Wilson',
                    title: 'Operations Director',
                    company: 'Global Manufacturing Ltd',
                    voice: 'Joey',
                    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                    personality: 'friendly, cautious, detail-oriented',
                    market: 'uk'
                },
                {
                    id: 'marcus_berg',
                    name: 'Marcus Berg',
                    title: 'Geschäftsführer',
                    company: 'Deutsche Industrie GmbH',
                    voice: 'Hans',
                    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
                    personality: 'direct, efficient, formal',
                    market: 'germany'
                },
                {
                    id: 'pierre_dubois',
                    name: 'Pierre Dubois',
                    title: 'Directeur Commercial',
                    company: 'Entreprise Française SA',
                    voice: 'Mathieu',
                    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
                    personality: 'charming, sophisticated, discerning',
                    market: 'france'
                },
                {
                    id: 'connor_murphy',
                    name: 'Connor Murphy',
                    title: 'Business Development Manager',
                    company: 'Aussie Enterprises Pty',
                    voice: 'Russell',
                    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
                    personality: 'laid-back, friendly, straightforward',
                    market: 'australia'
                }
            ],
            female: [
                {
                    id: 'sarah_mitchell',
                    name: 'Sarah Mitchell',
                    title: 'Chief Marketing Officer',
                    company: 'Innovation Dynamics',
                    voice: 'Joanna',
                    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
                    personality: 'strategic, busy, results-focused',
                    market: 'usa'
                },
                {
                    id: 'emily_thompson',
                    name: 'Emily Thompson',
                    title: 'Finance Director',
                    company: 'British Financial Services',
                    voice: 'Emma',
                    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
                    personality: 'analytical, cautious, professional',
                    market: 'uk'
                },
                {
                    id: 'anna_mueller',
                    name: 'Anna Müller',
                    title: 'Leiterin Einkauf',
                    company: 'Bavarian Solutions AG',
                    voice: 'Marlene',
                    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
                    personality: 'thorough, methodical, quality-focused',
                    market: 'germany'
                },
                {
                    id: 'marie_laurent',
                    name: 'Marie Laurent',
                    title: 'Directrice des Opérations',
                    company: 'Lyon Technologies SARL',
                    voice: 'Celine',
                    image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
                    personality: 'elegant, discerning, relationship-focused',
                    market: 'france'
                },
                {
                    id: 'rebecca_wilson',
                    name: 'Rebecca Wilson',
                    title: 'Regional Sales Director',
                    company: 'Melbourne Trading Co',
                    voice: 'Nicole',
                    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
                    personality: 'energetic, approachable, goal-oriented',
                    market: 'australia'
                }
            ]
        };
    }
    
    selectRandomCharacter() {
        const user = this.app.getCurrentUser();
        const targetMarket = user?.targetMarket || 'usa';
        
        const allCharacters = [...this.characters.male, ...this.characters.female];
        const marketCharacters = allCharacters.filter(char => char.market === targetMarket);
        
        // If no characters for specific market, use all characters
        const availableCharacters = marketCharacters.length > 0 ? marketCharacters : allCharacters;
        
        // Update character job title and company based on user's prospect selection
        const selectedCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        
        // Customize character based on user selections
        return this.customizeCharacter(selectedCharacter);
    }
    
    customizeCharacter(character) {
        const user = this.app.getCurrentUser();
        if (!user) return character;
        
        const customizedCharacter = { ...character };
        
        // Update job title if user selected specific prospect job title
        if (user.prospectJobTitle && user.prospectJobTitle !== 'other') {
            customizedCharacter.title = this.getJobTitleText(user.prospectJobTitle);
        }
        
        // Update company based on industry
        if (user.prospectIndustry && user.prospectIndustry !== 'other') {
            customizedCharacter.company = this.generateCompanyName(user.prospectIndustry);
        }
        
        // Add custom behavior if specified
        if (user.customBehavior) {
            customizedCharacter.personality += `, ${user.customBehavior}`;
        }
        
        return customizedCharacter;
    }
    
    getJobTitleText(jobTitleKey) {
        const jobTitleMap = {
            'brand_communications_manager': 'Brand/Communications Manager',
            'ceo_chief_executive_officer': 'CEO (Chief Executive Officer)',
            'cfo_chief_financial_officer': 'CFO (Chief Financial Officer)',
            'cio_chief_information_officer': 'CIO (Chief Information Officer)',
            'coo_chief_operating_officer': 'COO (Chief Operating Officer)',
            'content_marketing_manager': 'Content Marketing Manager',
            'cto_chief_technology_officer': 'CTO (Chief Technology Officer)',
            'demand_generation_manager': 'Demand Generation Manager',
            'digital_marketing_manager': 'Digital Marketing Manager',
            'engineering_manager': 'Engineering Manager',
            'finance_director': 'Finance Director',
            'founder___owner___managing_director__md_': 'Founder / Owner / Managing Director (MD)',
            'head_of_product': 'Head of Product',
            'purchasing_manager': 'Purchasing Manager',
            'r_d_product_development_manager': 'R&D/Product Development Manager',
            'sales_manager': 'Sales Manager',
            'sales_operations_manager': 'Sales Operations Manager',
            'social_media_manager': 'Social Media Manager',
            'ux_ui_design_lead': 'UX/UI Design Lead',
            'vp_of_finance': 'VP of Finance',
            'vp_of_hr': 'VP of HR',
            'vp_of_it_engineering': 'VP of IT/Engineering',
            'vp_of_marketing': 'VP of Marketing',
            'vp_of_sales': 'VP of Sales'
        };
        
        return jobTitleMap[jobTitleKey] || 'Business Executive';
    }
    
    generateCompanyName(industryKey) {
        const industryCompanies = {
            'education___e_learning': ['EduTech Solutions', 'Learning Dynamics Inc', 'Academic Excellence Corp'],
            'energy___utilities': ['PowerGrid Systems', 'Energy Solutions Ltd', 'Utility Innovations Co'],
            'finance___banking': ['Financial Services Group', 'Capital Partners LLC', 'Banking Solutions Inc'],
            'government___public_sector': ['Public Services Agency', 'Government Solutions Corp', 'Civic Technology Ltd'],
            'healthcare___life_sciences': ['HealthTech Innovations', 'Medical Solutions Group', 'BioLife Sciences'],
            'hospitality___travel': ['Travel Excellence Inc', 'Hospitality Partners', 'Tourism Solutions Corp'],
            'information_technology___services': ['TechCorp Solutions', 'IT Services Group', 'Digital Innovations Ltd'],
            'logistics__transportation___supply_chain': ['LogiTech Systems', 'Transport Solutions Inc', 'Supply Chain Dynamics'],
            'manufacturing___industrial': ['Industrial Partners LLC', 'Manufacturing Excellence', 'Production Systems Corp'],
            'media___entertainment': ['Media Dynamics Group', 'Entertainment Solutions', 'Creative Productions Inc'],
            'non_profit___associations': ['Community Partners', 'Social Impact Organization', 'Nonprofit Alliance'],
            'professional_services__legal__accounting__consulting_': ['Professional Partners LLC', 'Business Solutions Group', 'Consulting Excellence Inc'],
            'real_estate___property_management': ['Property Solutions Corp', 'Real Estate Partners', 'Development Group LLC'],
            'retail___e_commerce': ['Retail Innovations Inc', 'E-Commerce Solutions', 'Shopping Excellence Corp'],
            'telecommunications': ['TeleComm Systems', 'Communications Group', 'Network Solutions Inc']
        };
        
        const companies = industryCompanies[industryKey] || ['Business Solutions Corp', 'Industry Leaders Inc', 'Professional Services LLC'];
        return companies[Math.floor(Math.random() * companies.length)];
    }
    
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    setCurrentCharacter(character) {
        this.currentCharacter = character;
    }
    
    buildSystemPrompt(moduleId, context) {
        const character = this.currentCharacter;
        const user = this.app.getCurrentUser();
        
        if (!character) return this.getDefaultPrompt(moduleId);
        
        const basePrompt = `You are ${character.name}, ${character.title} at ${character.company}. Your personality: ${character.personality}.`;
        
        const modulePrompts = {
            warmup: this.buildWarmupPrompt(character, context),
            opener: this.buildOpenerPrompt(character, context),
            pitch: this.buildPitchPrompt(character, context),
            fullcall: this.buildFullCallPrompt(character, context),
            powerhour: this.buildPowerHourPrompt(character, context)
        };
        
        const moduleSpecificPrompt = modulePrompts[moduleId] || modulePrompts.opener;
        
        // Add industry-specific behavior
        let industryContext = '';
        if (user?.prospectIndustry && user.prospectIndustry !== 'other') {
            industryContext = this.getIndustryContext(user.prospectIndustry);
        }
        
        return `${basePrompt}\n\n${moduleSpecificPrompt}\n\n${industryContext}\n\nContext: ${context}`;
    }
    
    buildWarmupPrompt(character, context) {
        return `You're running Module 3 - Warm-Up Quickfire training.

PURPOSE: Rapid-fire warm-up so the rep practices every key line before live dialing. Ask 25 prompts in random order.

FLOW: Pick random prompts from the master list. After each response, immediately give the next prompt. No detailed coaching during drill.

PROMPTS INCLUDE:
- Give your opener
- What's your pitch in one sentence?  
- Ask me for a meeting
- Handle objections like: "What's this about?", "I'm not interested", "Send me an email"
- Post-pitch objections like: "It's too expensive", "We have no budget", "Your competitor is cheaper"

Keep responses brief and immediately move to the next prompt.`;
    }
    
    buildOpenerPrompt(character, context) {
        return `You're running Module 1 - Opener + Early Objection Practice.

PURPOSE: Pressure-test the sales rep's opener and early-objection handling. The drill STOPS after the first objection is handled.

FLOW LOGIC:
- START in slow mode. Wait for the rep's opener.
- Respond with ONE random early objection from the list.
- Judge using RUBRIC: (1) Shows empathy (2) Non-argumentative language (3) Addresses/reframes objection (4) Ends with forward-moving question.
- If PASS: "Great! Want another objection?" If fail: coaching feedback.
- Mode progression: slow (6 passes) → marathon (10 objections) → legend (15 objections)

EARLY OBJECTIONS: "What's this about?", "I'm not interested", "We don't take cold calls", "Now is not a good time", "I have a meeting", "Can you call me later?", "Send me an email", "Who gave you this number?", "What are you trying to sell me?", "Is this a sales call?", "We are ok for the moment", "We're not looking for anything", "How long is this going to take?", "What company are you calling from?", "I never heard of you"

Current progress: ${this.app.getCurrentProgress()}/${this.app.getMaxProgress()}. Mode: ${this.app.getCurrentMode()}.`;
    }
    
    buildPitchPrompt(character, context) {
        return `You're running Module 2 - Pitch + Post-Pitch Objection + Meeting.

PURPOSE: Practice delivering a pitch, handling post-pitch objections, and booking a meeting.

FLOW LOGIC:
1. AI says: "Go ahead with your pitch" if learner hasn't pitched yet
2. After pitch, give ONE objection from remaining list
3. Learner must: (a) Address/reframe objection AND (b) Ask for a meeting
4. When AI agrees to meeting, ALWAYS reject first suggested time slot: "That slot doesn't work for me"
5. Accept second time slot, then say "Great, see you then! Ready for another pitch?"

POST-PITCH OBJECTIONS: "It's too expensive for us", "We have no budget right now", "Your competitor is cheaper", "This isn't a good time", "We've already set this year's budget", "Call me back next quarter", "We already use a competitor", "How exactly are you better?", "I've never heard of your company", "I'm not the decision-maker", "I need approval from my team", "How long does this take to implement?"

Current progress: ${this.app.getCurrentProgress()}/${this.app.getMaxProgress()}. Mode: ${this.app.getCurrentMode()}.`;
    }
    
    buildFullCallPrompt(character, context) {
        return `You're running Module 4 - Full Cold-Call simulation.

PURPOSE: Simulate a live cold-call from hello to meeting booking. Learner must clear every gate in order:
1. Handle early objection after opener
2. Deliver a pitch  
3. Handle post-pitch objection
4. Ask for meeting → prospect agrees
5. Negotiate day & time (first slot rejected, second accepted)

PASS CRITERIA: 
- Early objection: empathy + non-argumentative + address/reframe + forward question
- Post-pitch: same criteria + meeting ask
- Meeting negotiation: first slot rejected, second accepted

You may use mild profanity if feeling hostile. Act like a real business prospect - sometimes interested, sometimes skeptical, with natural interruptions and reactions.

Current stage: opener. Turn count: ${this.app.getCurrentProgress()}/25.`;
    }
    
    buildPowerHourPrompt(character, context) {
        return `You're running Module 5 - Power Hour (10 back-to-back cold calls).

PURPOSE: Run ten cold-call simulations in one session. Each call follows the full "Opener → Pitch → Meeting" flow.

CALL FLOW: Same as Module 4 but faster pace. Each call has 15-turn cap. After every call: instant score (0-4), micro-coaching, auto-start next call.

SCORING:
0 = fail early objection
1 = fail first post-pitch objection  
2 = handled objections but no meeting ask
3 = meeting agreed but no firm time
4 = meeting booked (second slot accepted)

You're prospect #${this.app.getCurrentProgress() + 1} of 10. Be challenging but fair. Use time pressure.`;
    }
    
    getIndustryContext(industryKey) {
        const industryContexts = {
            'education___e_learning': 'You work in education technology. You care about student outcomes, learning analytics, and budget constraints typical of educational institutions.',
            'energy___utilities': 'You work in energy/utilities. You focus on grid reliability, regulatory compliance, sustainability initiatives, and long-term infrastructure planning.',
            'finance___banking': 'You work in financial services. You prioritize security, regulatory compliance, risk management, and customer data protection.',
            'government___public_sector': 'You work in government/public sector. You focus on public service delivery, budget accountability, transparency, and citizen satisfaction.',
            'healthcare___life_sciences': 'You work in healthcare. You prioritize patient outcomes, HIPAA compliance, clinical efficiency, and cost management.',
            'hospitality___travel': 'You work in hospitality/travel. You focus on customer experience, seasonal fluctuations, booking optimization, and guest satisfaction.',
            'information_technology___services': 'You work in IT services. You care about technical specifications, scalability, integration capabilities, and technical support.',
            'logistics__transportation___supply_chain': 'You work in logistics/supply chain. You focus on efficiency, cost optimization, delivery reliability, and inventory management.',
            'manufacturing___industrial': 'You work in manufacturing. You prioritize production efficiency, quality control, supply chain reliability, and operational safety.',
            'media___entertainment': 'You work in media/entertainment. You focus on audience engagement, content quality, distribution channels, and creative production.',
            'non_profit___associations': 'You work in nonprofit sector. You prioritize mission impact, budget constraints, donor relations, and community outcomes.',
            'professional_services__legal__accounting__consulting_': 'You work in professional services. You focus on client outcomes, billing efficiency, expertise demonstration, and service quality.',
            'real_estate___property_management': 'You work in real estate/property management. You focus on property values, tenant satisfaction, maintenance costs, and market trends.',
            'retail___e_commerce': 'You work in retail/e-commerce. You prioritize customer experience, sales conversion, inventory management, and competitive pricing.',
            'telecommunications': 'You work in telecommunications. You focus on network reliability, bandwidth needs, service uptime, and technical infrastructure.'
        };
        
        return industryContexts[industryKey] || 'You work in a professional business environment with standard business concerns about ROI, efficiency, and growth.';
    }
    
    getDefaultPrompt(moduleId) {
        return `You are a business professional participating in a cold call training simulation. Act as a realistic prospect for Module ${moduleId}. Be appropriately challenging but fair in your responses.`;
    }
    
    // Utility methods for character management
    getCharactersByMarket(market) {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return allCharacters.filter(char => char.market === market);
    }
    
    getAvailableVoices() {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return [...new Set(allCharacters.map(char => char.voice))];
    }
    
    getCharacterPersonalities() {
        const allCharacters = [...this.characters.male, ...this.characters.female];
        return [...new Set(allCharacters.map(char => char.personality))];
    }
    
    // Character behavior adaptation based on user progress
    adaptCharacterBehavior() {
        if (!this.currentCharacter) return;
        
        const user = this.app.getCurrentUser();
        const moduleProgress = this.app.moduleManager.getModuleProgress(this.app.getCurrentModule());
        
        // Make character more challenging as user progresses
        if (moduleProgress.marathon >= 5) {
            this.currentCharacter.personality += ', more demanding';
        }
        
        if (moduleProgress.legend) {
            this.currentCharacter.personality += ', expert-level challenging';
        }
    }
    
    // Dynamic personality adjustments
    adjustPersonalityForModule(moduleId) {
        if (!this.currentCharacter) return;
        
        const modulePersonalities = {
            warmup: 'patient, instructional',
            opener: 'busy, skeptical',
            pitch: 'analytical, questioning',
            fullcall: 'realistic, varied mood',
            powerhour: 'time-pressured, direct'
        };
        
        const modulePersonality = modulePersonalities[moduleId];
        if (modulePersonality) {
            this.currentCharacter.personality += `, ${modulePersonality}`;
        }
    }
}
/**
 * Module Manager - Handles module progression, unlocking, and state management
 */

export class ModuleManager {
    constructor(app) {
        this.app = app;
        this.modules = {};
        this.moduleProgress = {};
    }
    
    init() {
        this.modules = this.initializeModules();
        this.moduleProgress = this.app.progressManager.loadProgress().modules || {};
        console.log('📚 Module Manager initialized');
    }
    
    initializeModules() {
        return {
            opener: {
                id: 'opener',
                name: 'Opener + Early Objections',
                description: 'Practice delivering your opener and managing the objection.',
                detailedDescription: 'When you get confident you can do the marathon which is 10 and if you pass then you unlock the Pitch + Objections + Close roleplay for 24 hours.',
                order: 1,
                unlocked: true, // Always available
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: true,
                hasLegend: true
            },
            pitch: {
                id: 'pitch',
                name: 'Pitch + Objections + Close',
                description: 'Practice delivering your pitch, managing the objections and pushing for the meeting.',
                detailedDescription: 'When you feel confident go for the marathon which is 10 in a row and if you pass you unlock the warm up challenge for 24 hours.',
                order: 2,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: true,
                hasLegend: true
            },
            warmup: {
                id: 'warmup',
                name: 'Warm-up Challenge',
                description: 'The warm up challenge is perfect to do before cold calling because you will get a series of questions that you must know for any part of the cold call such as What is your pitch? Respond to early objections I have in a meeting. How do you ask for a meeting? etc.',
                detailedDescription: 'If you pass the challenge you will unlock the Full Cold Call Simulator for 24 hours.',
                order: 3,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false, // No marathon mode for warmup
                hasLegend: false, // No legend mode for warmup
                totalQuestions: 25,
                passingScore: 18
            },
            fullcall: {
                id: 'fullcall',
                name: 'Full Cold Call Simulation',
                description: 'Think you are ready to do an entire cold call and book a meeting. This is a simulation from start to finish.',
                detailedDescription: 'Practice until you book a meeting. When you book a meeting you will unlock The Power Hour Challenge for 24 hours.',
                order: 4,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false, // No marathon mode for fullcall
                hasLegend: false // No legend mode for fullcall
            },
            powerhour: {
                id: 'powerhour',
                name: 'Power Hour Challenge',
                description: 'How many meetings can you book with 10 calls. The Power Hour Challenge is 10 calls in a row. Are you ready for the challenge?',
                detailedDescription: '',
                order: 5,
                unlocked: false,
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false,
                hasMarathon: false, // No marathon mode for powerhour
                hasLegend: false // No legend mode for powerhour
            }
        };
    }
    
    startModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) {
            this.app.uiManager.showError('Module not found.');
            return;
        }
        
        // Check access permissions
        if (!this.app.userManager.hasAccessToModule(moduleId)) {
            this.app.uiManager.showError('You do not have access to this module.');
            return;
        }
        
        if (!module.unlocked) {
            this.app.uiManager.showError('This module is not yet unlocked.');
            return;
        }
        
        // Validate mode availability
        if (mode === 'marathon' && !module.hasMarathon) {
            this.app.uiManager.showError('Marathon mode is not available for this module.');
            return;
        }
        
        if (mode === 'legend') {
            if (!module.hasLegend) {
                this.app.uiManager.showError('Legend mode is not available for this module.');
                return;
            }
            if (!module.legendAvailable) {
                this.app.uiManager.showError('Complete the marathon first to unlock Legend Mode.');
                return;
            }
            if (module.legendCompleted) {
                this.app.uiManager.showError('Legend Mode can only be completed once.');
                return;
            }
        }
        
        // Set up module parameters
        this.app.setCurrentModule(moduleId);
        this.app.setCurrentMode(mode);
        this.app.setCurrentProgress(0);
        
        // Set max progress based on module and mode
        const maxProgress = this.getMaxProgress(moduleId, mode);
        this.app.setMaxProgress(maxProgress);
        
        this.app.logActivity('module_started', { 
            module: moduleId, 
            mode, 
            maxProgress 
        });
        
        // Initialize the call
        this.app.callManager.initializeCall();
    }
    
    getMaxProgress(moduleId, mode) {
        const module = this.modules[moduleId];
        
        switch (mode) {
            case 'marathon':
                return 10;
            case 'legend':
                return moduleId === 'warmup' ? 25 : 18;
            case 'practice':
                return moduleId === 'warmup' ? 25 : 1;
            default:
                return 1;
        }
    }
    
    completeModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        console.log(`🎯 Completing module: ${moduleId} in ${mode} mode`);
        
        if (mode === 'marathon') {
            module.marathonCompleted = true;
            module.legendAvailable = true;
            
            // Unlock next module based on new order
            this.unlockNextModule(moduleId);
            
            this.app.uiManager.showSuccess(`🎉 Marathon completed! Legend Mode unlocked and next module available.`);
            
        } else if (mode === 'legend') {
            module.legendCompleted = true;
            this.app.uiManager.showSuccess(`🏆 Legend Mode completed! You're a master of ${module.name}!`);
            
        } else if (mode === 'practice') {
            // Handle special cases for practice mode
            if (moduleId === 'warmup') {
                const score = this.app.getCurrentProgress();
                if (score >= module.passingScore) {
                    this.unlockNextModule(moduleId);
                    this.app.uiManager.showSuccess(`🎉 Challenge passed! Score: ${score}/${module.totalQuestions}. Next module unlocked!`);
                } else {
                    this.app.uiManager.showError(`Challenge failed. Score: ${score}/${module.totalQuestions}. Need ${module.passingScore} to pass.`);
                }
            } else {
                // For other modules, practice completion unlocks next module
                this.unlockNextModule(moduleId);
                this.app.uiManager.showSuccess(`🎉 Practice completed! Next module unlocked.`);
            }
        }
        
        // Update progress and save
        this.updateModuleProgress(moduleId, mode);
        this.app.progressManager.saveProgress();
        
        // Update UI
        this.app.uiManager.updateModuleUI();
        this.app.uiManager.updateProgressStats();
        
        this.app.logActivity('module_completed', { module: moduleId, mode });
    }
    
    unlockNextModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        
        if (currentIndex >= 0 && currentIndex < moduleOrder.length - 1) {
            const nextModuleId = moduleOrder[currentIndex + 1];
            const nextModule = this.modules[nextModuleId];
            
            if (nextModule) {
                const user = this.app.getCurrentUser();
                
                // Handle different access levels
                if (user.accessLevel === 'unlimited') {
                    nextModule.unlocked = true;
                } else if (user.accessLevel === 'unlimited_locked') {
                    this.app.userManager.unlockModuleTemporarily(nextModuleId);
                } else if (user.accessLevel === 'limited') {
                    this.app.userManager.unlockModulePermanently(nextModuleId);
                }
                
                console.log(`🔓 Unlocked next module: ${nextModuleId}`);
            }
        }
    }
    
    updateModuleProgress(moduleId, mode) {
        if (!this.moduleProgress[moduleId]) {
            this.moduleProgress[moduleId] = { 
                marathon: 0, 
                practice: 0, 
                legend: false,
                warmupScore: 0
            };
        }
        
        const progress = this.moduleProgress[moduleId];
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        switch (mode) {
            case 'marathon':
                progress.marathon = Math.max(progress.marathon, currentProgress);
                if (currentProgress >= maxProgress) {
                    this.modules[moduleId].marathonCompleted = true;
                    this.modules[moduleId].legendAvailable = true;
                }
                break;
                
            case 'legend':
                if (currentProgress >= maxProgress) {
                    progress.legend = true;
                    this.modules[moduleId].legendCompleted = true;
                }
                break;
                
            case 'practice':
                progress.practice = Math.max(progress.practice, currentProgress);
                if (moduleId === 'warmup') {
                    progress.warmupScore = currentProgress;
                }
                break;
        }
    }
    
    getPreviousModule(moduleId) {
        const moduleOrder = ['opener', 'pitch', 'warmup', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        return currentIndex > 0 ? this.modules[moduleOrder[currentIndex - 1]] : null;
    }
    
    getModuleByOrder(order) {
        return Object.values(this.modules).find(module => module.order === order);
    }
    
    getAllModules() {
        return Object.values(this.modules).sort((a, b) => a.order - b.order);
    }
    
    getUnlockedModules() {
        return Object.values(this.modules).filter(module => module.unlocked);
    }
    
    isModuleUnlocked(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return false;
        
        return module.unlocked || this.app.userManager.hasAccessToModule(moduleId);
    }
    
    getModuleProgress(moduleId) {
        return this.moduleProgress[moduleId] || { 
            marathon: 0, 
            practice: 0, 
            legend: false,
            warmupScore: 0
        };
    }
    
    resetModule(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        module.marathonCompleted = false;
        module.legendAvailable = false;
        module.legendCompleted = false;
        
        if (moduleId !== 'opener') {
            module.unlocked = false;
        }
        
        this.moduleProgress[moduleId] = { 
            marathon: 0, 
            practice: 0, 
            legend: false,
            warmupScore: 0
        };
        
        console.log(`🔄 Reset module: ${moduleId}`);
    }
    
    resetAllModules() {
        Object.keys(this.modules).forEach(moduleId => {
            this.resetModule(moduleId);
        });
        
        // Ensure opener is always unlocked
        this.modules.opener.unlocked = true;
        
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        
        console.log('🔄 All modules reset');
    }
    
    // Debug and utility methods
    debugStates() {
        console.log('🔍 DEBUG: Current Module States');
        console.log('================================');
        Object.entries(this.modules).forEach(([id, module]) => {
            console.log(`${id.toUpperCase()}:`, {
                unlocked: module.unlocked,
                marathonCompleted: module.marathonCompleted,
                legendAvailable: module.legendAvailable,
                legendCompleted: module.legendCompleted,
                hasMarathon: module.hasMarathon,
                hasLegend: module.hasLegend
            });
        });
        
        console.log('\n🔍 DEBUG: Module Progress');
        console.log('==========================');
        console.log(this.moduleProgress);
    }
    
    forceUnlock(moduleId) {
        const module = this.modules[moduleId];
        if (!module) {
            console.log(`❌ Module not found: ${moduleId}`);
            return;
        }
        
        module.unlocked = true;
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        console.log(`✅ Force unlocked module: ${moduleId}`);
    }
    
    forceCompleteMarathon(moduleId) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        module.marathonCompleted = true;
        module.legendAvailable = true;
        
        if (!this.moduleProgress[moduleId]) {
            this.moduleProgress[moduleId] = { marathon: 0, practice: 0, legend: false };
        }
        this.moduleProgress[moduleId].marathon = 10;
        
        this.unlockNextModule(moduleId);
        this.app.progressManager.saveProgress();
        this.app.uiManager.updateModuleUI();
        
        console.log(`✅ Force completed marathon for: ${moduleId}`);
    }
    
    getModuleStats() {
        const stats = {
            totalModules: Object.keys(this.modules).length,
            unlockedModules: this.getUnlockedModules().length,
            completedMarathons: Object.values(this.modules).filter(m => m.marathonCompleted).length,
            completedLegends: Object.values(this.modules).filter(m => m.legendCompleted).length
        };
        
        return stats;
    }
}
/**
 * Progress Manager - Handles saving/loading progress and statistics
 */

export class ProgressManager {
    constructor(app) {
        this.app = app;
        this.saveKey = 'coldCallTrainerData';
        this.logsKey = 'coldCallLogs';
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const data = JSON.parse(saved);
                
                // Load user data
                if (data.user) {
                    this.app.setCurrentUser(data.user);
                }
                
                // Load practice time
                if (data.practiceTime) {
                    this.app.totalPracticeTime = data.practiceTime;
                }
                
                // Load module states
                if (data.modules) {
                    Object.assign(this.app.moduleManager.modules, data.modules);
                }
                
                console.log('💾 Progress loaded:', data);
                return data;
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
        
        return { modules: {}, progress: {}, practiceTime: 0 };
    }
    
    saveProgress() {
        try {
            const saveData = {
                modules: this.app.moduleManager.modules,
                progress: this.app.moduleManager.moduleProgress,
                practiceTime: this.app.totalPracticeTime,
                user: this.app.getCurrentUser(),
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('💾 Progress saved:', saveData);
            
            return true;
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }
    
    resetAll() {
        try {
            // Reset modules to initial state
            this.app.moduleManager.resetAllModules();
            
            // Reset practice time
            this.app.totalPracticeTime = 0;
            
            // Clear user manager usage tracking
            if (this.app.userManager) {
                this.app.userManager.usageTracking = {
                    sessionTime: 0,
                    totalUsage: 0,
                    lastReset: null
                };
            }
            
            // Save the reset state
            this.saveProgress();
            
            // Update UI
            this.app.uiManager.updateModuleUI();
            this.app.uiManager.updateProgressStats();
            
            console.log('🔄 All progress reset');
            return true;
        } catch (error) {
            console.error('Failed to reset progress:', error);
            return false;
        }
    }
    
    exportProgress() {
        try {
            const data = {
                ...this.loadProgress(),
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cold-call-trainer-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to export progress:', error);
            return false;
        }
    }
    
    importProgress(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!this.validateProgressData(data)) {
                        reject(new Error('Invalid progress data format'));
                        return;
                    }
                    
                    // Import the data
                    localStorage.setItem(this.saveKey, JSON.stringify(data));
                    
                    // Reload the application state
                    location.reload();
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    validateProgressData(data) {
        // Basic validation of imported data
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['modules', 'progress', 'practiceTime'];
        return requiredFields.every(field => field in data);
    }
    
    getStatistics() {
        const data = this.loadProgress();
        const logs = this.getLogs();
        
        const stats = {
            totalSessions: logs.filter(log => log.action === 'user_registered').length,
            totalCalls: logs.filter(log => log.action === 'call_ended').length,
            completedModules: logs.filter(log => log.action === 'module_completed').length,
            totalPracticeTime: Math.floor((data.practiceTime || 0) / (1000 * 60)), // in minutes
            moduleStats: this.getModuleStatistics(data.modules || {}),
            recentActivity: logs.slice(-10), // Last 10 activities
            streaks: this.calculateStreaks(logs),
            averageSessionTime: this.calculateAverageSessionTime(logs)
        };
        
        return stats;
    }
    
    getModuleStatistics(modules) {
        const moduleStats = {};
        
        Object.entries(modules).forEach(([moduleId, module]) => {
            moduleStats[moduleId] = {
                unlocked: module.unlocked || false,
                marathonCompleted: module.marathonCompleted || false,
                legendCompleted: module.legendCompleted || false,
                practiceTime: 0, // Would need to track per-module time
                attempts: 0 // Would need to track attempts
            };
        });
        
        return moduleStats;
    }
    
    calculateStreaks(logs) {
        const dailyActivity = {};
        
        logs.forEach(log => {
            const date = new Date(log.timestamp).toDateString();
            dailyActivity[date] = true;
        });
        
        const dates = Object.keys(dailyActivity).sort();
        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate = null;
        
        dates.forEach(date => {
            const currentDate = new Date(date);
            
            if (lastDate) {
                const daysDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff === 1) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            
            lastDate = currentDate;
        });
        
        maxStreak = Math.max(maxStreak, currentStreak);
        
        return {
            current: currentStreak,
            longest: maxStreak
        };
    }
    
    calculateAverageSessionTime(logs) {
        const sessionStarts = logs.filter(log => log.action === 'module_started');
        const sessionEnds = logs.filter(log => log.action === 'call_ended');
        
        if (sessionStarts.length === 0 || sessionEnds.length === 0) return 0;
        
        let totalSessionTime = 0;
        let sessionCount = 0;
        
        sessionStarts.forEach((start, index) => {
            const correspondingEnd = sessionEnds.find(end => 
                new Date(end.timestamp) > new Date(start.timestamp) &&
                end.module === start.module
            );
            
            if (correspondingEnd) {
                const sessionTime = new Date(correspondingEnd.timestamp) - new Date(start.timestamp);
                totalSessionTime += sessionTime;
                sessionCount++;
            }
        });
        
        return sessionCount > 0 ? Math.floor(totalSessionTime / (sessionCount * 1000 * 60)) : 0; // Average in minutes
    }
    
    getLogs() {
        try {
            return JSON.parse(localStorage.getItem(this.logsKey) || '[]');
        } catch (error) {
            console.error('Failed to load logs:', error);
            return [];
        }
    }
    
    clearLogs() {
        try {
            localStorage.removeItem(this.logsKey);
            console.log('📊 Activity logs cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear logs:', error);
            return false;
        }
    }
    
    // Backup and restore functionality
    createBackup() {
        const backupData = {
            progress: this.loadProgress(),
            logs: this.getLogs(),
            backup_date: new Date().toISOString(),
            app_version: '2.0.0'
        };
        
        return backupData;
    }
    
    restoreFromBackup(backupData) {
        try {
            if (!backupData || !backupData.progress) {
                throw new Error('Invalid backup data');
            }
            
            // Restore progress
            localStorage.setItem(this.saveKey, JSON.stringify(backupData.progress));
            
            // Restore logs if available
            if (backupData.logs) {
                localStorage.setItem(this.logsKey, JSON.stringify(backupData.logs));
            }
            
            console.log('🔄 Backup restored successfully');
            return true;
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return false;
        }
    }
    
    // Data migration for version updates
    migrateData(fromVersion, toVersion) {
        console.log(`🔄 Migrating data from ${fromVersion} to ${toVersion}`);
        
        const data = this.loadProgress();
        
        // Example migration logic (would be version-specific)
        if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
            // Add new fields, restructure data, etc.
            data.version = '2.0.0';
            data.migrated = new Date().toISOString();
        }
        
        // Save migrated data
        localStorage.setItem(this.saveKey, JSON.stringify(data));
        
        return true;
    }
    
    // Storage quota management
    checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => {
                const used = estimate.usage || 0;
                const quota = estimate.quota || 0;
                const percentUsed = quota > 0 ? (used / quota) * 100 : 0;
                
                return {
                    used: used,
                    quota: quota,
                    percentUsed: percentUsed,
                    available: quota - used
                };
            });
        }
        
        return Promise.resolve(null);
    }
    
    cleanupOldData() {
        try {
            const logs = this.getLogs();
            
            // Keep only last 1000 log entries
            if (logs.length > 1000) {
                const trimmedLogs = logs.slice(-1000);
                localStorage.setItem(this.logsKey, JSON.stringify(trimmedLogs));
                console.log(`📊 Cleaned up ${logs.length - 1000} old log entries`);
            }
            
            // Remove temporary data older than 7 days
            const tempKeys = Object.keys(localStorage).filter(key => key.startsWith('temp_'));
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            tempKeys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < weekAgo) {
                        localStorage.removeItem(key);
                        console.log(`🗑️ Removed old temporary data: ${key}`);
                    }
                } catch (e) {
                    // If we can't parse it, remove it
                    localStorage.removeItem(key);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Failed to cleanup old data:', error);
            return false;
        }
    }
}
/**
 * Speech Manager - Handles speech recognition and text-to-speech
 */

export class SpeechManager {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.isRecording = false;
        this.isSpeaking = false;
        this.continuousListening = false;
        this.speechStartTime = null;
        this.lastInteractionTime = Date.now();
        
        // Repeat loop system
        this.isInRepeatLoop = false;
        this.repeatTarget = '';
        this.repeatType = '';
        this.repeatAttempts = 0;
        this.maxRepeatAttempts = 3;
        
        // Timeout system
        this.responseTimeout = null;
        this.timeoutDuration = 5000; // 5 seconds
        this.timeoutResponses = [];
        this.skippedQuestions = [];
    }
    
    async init() {
        this.initializeSpeechRecognition();
        console.log('🎤 Speech Manager initialized');
    }
    
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Speech recognition started');
                this.updateVoiceStatus('Listening...');
                this.startResponseTimeout();
            };
            
            this.recognition.onresult = (event) => {
                this.clearResponseTimeout();
                
                const lastResultIndex = event.results.length - 1;
                const result = event.results[lastResultIndex][0];
                const transcript = result.transcript.trim();
                const confidence = result.confidence || 0.8;
                
                console.log('🗣️ User said:', transcript, 'Confidence:', confidence);
                
                if (transcript && transcript.length > 2) {
                    // Check for skip command
                    if (this.isSkipCommand(transcript)) {
                        this.handleSkipCommand();
                        return;
                    }
                    
                    // Check if we're in a repeat loop
                    if (this.isInRepeatLoop) {
                        this.handleRepeatAttempt(transcript, confidence);
                    } else {
                        this.handleUserInput(transcript, confidence);
                    }
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('🚫 Speech recognition error:', event.error);
                this.clearResponseTimeout();
                this.handleSpeechError(event.error);
            };
            
            this.recognition.onend = () => {
                this.clearResponseTimeout();
                if (this.continuousListening && this.app.isInCall() && !this.isSpeaking) {
                    setTimeout(() => {
                        if (this.continuousListening && this.app.isInCall() && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 100);
                }
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    }
    
    startResponseTimeout() {
        this.clearResponseTimeout();
        
        this.responseTimeout = setTimeout(() => {
            if (this.isRecording) {
                this.handleTimeout();
            }
        }, this.timeoutDuration);
    }
    
    clearResponseTimeout() {
        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
    }
    
    handleTimeout() {
        console.log('⏰ Response timeout');
        this.stopListening();
        
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            // Track timeout for warmup
            this.timeoutResponses.push({
                questionNumber: this.app.getCurrentProgress() + 1,
                timestamp: new Date().toISOString()
            });
            
            this.updateVoiceStatus('Too slow! Moving to next question...');
            
            // Move to next question after brief pause
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.callManager.handleTimeoutNext();
                }
            }, 2000);
        } else {
            this.updateVoiceStatus('Too slow - please respond faster');
            this.speakAI("I didn't hear anything. Please try again and speak more clearly.");
        }
    }
    
    isSkipCommand(transcript) {
        const skipCommands = ['next question', 'skip', 'next', 'pass'];
        const lowerTranscript = transcript.toLowerCase();
        return skipCommands.some(command => lowerTranscript.includes(command));
    }
    
    handleSkipCommand() {
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            this.skippedQuestions.push({
                questionNumber: this.app.getCurrentProgress() + 1,
                timestamp: new Date().toISOString()
            });
            
            this.updateVoiceStatus('Question skipped. Moving to next...');
            
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.callManager.handleSkipNext();
                }
            }, 1500);
        } else {
            this.updateVoiceStatus('Skip not available in this mode');
        }
    }
    
    startContinuousListening() {
        if (!this.recognition || this.isSpeaking) return;
        
        this.continuousListening = true;
        this.startListening();
        this.updateVoiceStatus('Your turn - speak naturally');
    }
    
    startListening() {
        if (!this.recognition || this.isRecording || this.isSpeaking) return;
        
        try {
            this.isRecording = true;
            this.speechStartTime = Date.now();
            this.recognition.start();
            this.app.uiManager.activateVoiceVisualizer();
        } catch (error) {
            console.error('Failed to start listening:', error);
            this.isRecording = false;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.clearResponseTimeout();
            this.app.uiManager.deactivateVoiceVisualizer();
        }
    }
    
    toggleListening() {
        if (this.isRecording) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    handleUserInput(transcript, confidence = 0.8) {
        if (!this.app.isInCall()) return;
        
        // Track speaking time
        if (this.speechStartTime) {
            const speakingTime = Date.now() - this.speechStartTime;
            this.app.totalPracticeTime += speakingTime;
            this.app.progressManager.saveProgress();
        }
        
        this.lastInteractionTime = Date.now();
        this.updateVoiceStatus('Processing...');
        
        this.app.logActivity('user_input', { 
            transcript, 
            confidence,
            module: this.app.getCurrentModule(), 
            progress: this.app.getCurrentProgress() 
        });
        
        // Generate AI response
        this.generateAIResponse(transcript, confidence);
    }
    
    handleRepeatAttempt(transcript, confidence) {
        console.log(`🔄 Repeat attempt: "${transcript}" vs target: "${this.repeatTarget}"`);
        
        this.repeatAttempts++;
        
        const similarity = this.calculateSimilarity(transcript.toLowerCase(), this.repeatTarget.toLowerCase());
        const minConfidence = 0.8;
        const minSimilarity = 0.8;
        
        if (confidence >= minConfidence && similarity >= minSimilarity) {
            this.exitRepeatLoop(true);
            this.updateVoiceStatus('Great! Moving on...');
            
            setTimeout(() => {
                if (this.app.isInCall() && this.continuousListening) {
                    this.startListening();
                }
            }, 1000);
        } else if (this.repeatAttempts >= this.maxRepeatAttempts) {
            this.exitRepeatLoop(false);
            this.updateVoiceStatus('Let\'s continue...');
            
            setTimeout(() => {
                if (this.app.isInCall() && this.continuousListening) {
                    this.startListening();
                }
            }, 1000);
        } else {
            const feedback = confidence < minConfidence ? 
                'Try speaking more clearly.' : 
                'Try to match the pronunciation exactly.';
                
            this.updateVoiceStatus(feedback);
            this.speakAI(`${feedback} Please repeat: "${this.repeatTarget}"`);
        }
    }
    
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    startRepeatLoop(target, type = 'pronunciation') {
        console.log(`🔄 Starting repeat loop for: "${target}" (${type})`);
        
        this.isInRepeatLoop = true;
        this.repeatTarget = target;
        this.repeatType = type;
        this.repeatAttempts = 0;
        
        this.updateVoiceStatus(`Repeat: "${target}"`);
    }
    
    exitRepeatLoop(success) {
        console.log(`🔄 Exiting repeat loop. Success: ${success}`);
        
        this.isInRepeatLoop = false;
        this.repeatTarget = '';
        this.repeatType = '';
        this.repeatAttempts = 0;
        
        if (success) {
            this.app.uiManager.showQuickSuccess();
        }
    }
    
    async generateAIResponse(userInput, confidence = 0.8) {
        try {
            const prompt = this.buildGPTPrompt(userInput);
            const response = await this.callOpenAI(prompt);
            
            const parsedResponse = this.parseAIResponse(response);
            
            // Check for repeat cues
            const repeatMatch = parsedResponse.message.match(/Please repeat:\s*[""'']([^""'']+)[""'']/i);
            
            if (repeatMatch) {
                const targetPhrase = repeatMatch[1];
                this.startRepeatLoop(targetPhrase, 'pronunciation');
                this.speakAI(parsedResponse.message);
                return;
            }
            
            // Speak the AI response
            this.speakAI(parsedResponse.message);
            
            // Handle progression
            if (parsedResponse.success && (this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend')) {
                this.app.callManager.handleSuccessfulInteraction();
            } else if (parsedResponse.feedback) {
                this.app.uiManager.showCallFeedback(parsedResponse.feedback, parsedResponse.success);
            }
            
        } catch (error) {
            console.error('AI Response Error:', error);
            this.speakAI("I'm sorry, could you repeat that? I didn't catch what you said.");
            
            setTimeout(() => {
                if (this.app.isInCall() && this.continuousListening) {
                    this.startListening();
                }
            }, 2000);
        }
    }
    
    buildGPTPrompt(userInput) {
        const currentCharacter = this.app.characterManager.getCurrentCharacter();
        const currentModule = this.app.getCurrentModule();
        const context = this.getConversationContext();
        
        // Get system prompt from character manager
        const systemPrompt = this.app.characterManager.buildSystemPrompt(currentModule, context);
        
        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userInput
            }
        ];
        
        // Add evaluation instruction for marathon/legend modes
        if (this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend') {
            messages[0].content += '\n\nIMPORTANT: After your response, evaluate the user\'s input and provide feedback in this format: "FEEDBACK: [SUCCESS/RETRY] - [brief explanation]"';
        }
        
        return messages;
    }
    
    getConversationContext() {
        const contexts = {
            warmup: "This is a warm-up exercise. The caller needs quick practice.",
            opener: "This is opener practice. Evaluate their greeting, name introduction, and reason for calling.",
            pitch: "This is pitch practice. Evaluate if they presented benefits, specifics, and engagement.",
            fullcall: "This is a complete cold call simulation. Act like a real prospect.",
            powerhour: "This is rapid-fire practice. Create urgency and time pressure."
        };
        
        return contexts[this.app.getCurrentModule()] || contexts.warmup;
    }
    
    async callOpenAI(messages) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    model: 'gpt-3.5-turbo',
                    max_tokens: 150,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.fallback) {
                    console.warn('🔄 Using fallback AI response');
                    return this.generateFallbackResponse();
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.warn('⚠️ OpenAI API failed, using fallback:', error);
            return this.generateFallbackResponse();
        }
    }
    
    generateFallbackResponse() {
        const currentModule = this.app.getCurrentModule();
        const progress = this.app.getCurrentProgress();
        
        const fallbackResponses = {
            warmup: [
                "Give me your opener.",
                "What's your pitch in one sentence?",
                "Ask me for a meeting.",
                "Handle this: 'What's this about?'",
                "Handle this: 'I'm not interested.'",
                "Handle this: 'Send me an email.'",
                "Handle this: 'We don't take cold calls.'",
                "Handle this: 'It's too expensive.'",
                "Handle this: 'We have no budget.'"
            ],
            opener: [
                "What's this about?",
                "I'm not interested.",
                "We don't take cold calls.",
                "Now is not a good time.",
                "I have a meeting.",
                "Can you call me later?",
                "Send me an email.",
                "Who gave you this number?",
                "What are you trying to sell me?",
                "Is this a sales call?"
            ],
            pitch: [
                "Go ahead with your pitch.",
                "It's too expensive for us.",
                "We have no budget for this right now.",
                "Your competitor is cheaper.",
                "This isn't a good time.",
                "We already use a competitor and we're happy.",
                "How exactly are you better than the competition?",
                "I've never heard of your company."
            ],
            fullcall: [
                "Hello, who is this?",
                "What's this about?",
                "I'm quite busy right now.",
                "Go ahead with your pitch.",
                "That sounds expensive.",
                "I need to think about it."
            ],
            powerhour: [
                `Call ${progress + 1}. Hello, make it quick.`,
                "What's this about?",
                "Not interested, thanks.",
                "Your price is too high.",
                "I'm hanging up now."
            ]
        };
        
        const responses = fallbackResponses[currentModule] || fallbackResponses.warmup;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Add feedback for marathon/legend modes
        if ((this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend') && currentModule !== 'warmup') {
            const feedbackOptions = [
                "FEEDBACK: SUCCESS - Good approach, keep going!",
                "FEEDBACK: RETRY - Try to be more specific about the value you provide.",
                "FEEDBACK: SUCCESS - Nice opener with clear reason for calling.",
                "FEEDBACK: RETRY - Consider asking a question to engage me more."
            ];
            
            const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
            return `${response} ${feedback}`;
        }
        
        return response;
    }
    
    parseAIResponse(response) {
        const feedbackMatch = response.match(/FEEDBACK:\s*(SUCCESS|RETRY)\s*-\s*(.+?)(?:\n|$)/i);
        
        let message = response;
        let feedback = null;
        let success = false;
        
        if (feedbackMatch) {
            message = response.replace(/FEEDBACK:.*$/im, '').trim();
            feedback = feedbackMatch[2].trim();
            success = feedbackMatch[1].toUpperCase() === 'SUCCESS';
        }
        
        return { message, feedback, success };
    }
    
    async speakAI(text) {
        if (this.isSpeaking) {
            this.stopCurrentSpeech();
        }
        
        this.isSpeaking = true;
        this.updateVoiceStatus('AI is speaking...');
        this.stopListening();
        
        try {
            const currentCharacter = this.app.characterManager.getCurrentCharacter();
            const audioUrl = await this.synthesizeSpeech(text, currentCharacter?.voice || 'Joanna');
            
            if (audioUrl === 'fallback://browser-speech-synthesis') {
                return;
            }
            
            this.app.audioManager.playAISpeech(audioUrl, () => {
                this.isSpeaking = false;
                setTimeout(() => {
                    if (this.app.isInCall() && this.continuousListening) {
                        this.startListening();
                    }
                }, 500);
            });
            
        } catch (error) {
            console.error('Speech synthesis error:', error);
            this.isSpeaking = false;
            this.updateVoiceStatus(`AI: "${text}"`);
            
            setTimeout(() => {
                if (this.app.isInCall() && this.continuousListening) {
                    this.startListening();
                }
            }, 2000);
        }
    }
    
    async synthesizeSpeech(text, voice = 'Joanna') {
        try {
            const response = await fetch('/api/synthesize-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice,
                    format: 'mp3'
                })
            });
            
            if (!response.ok) {
                if (response.status === 500) {
                    const errorData = await response.json();
                    if (errorData.fallback) {
                        console.warn('🔄 Falling back to browser speech synthesis');
                        return this.synthesizeSpeechFallback(text);
                    }
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
            
        } catch (error) {
            console.warn('⚠️ Server speech synthesis failed, using fallback:', error);
            return this.synthesizeSpeechFallback(text);
        }
    }
    
    synthesizeSpeechFallback(text) {
        return new Promise((resolve, reject) => {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                
                const voices = speechSynthesis.getVoices();
                const currentCharacter = this.app.characterManager.getCurrentCharacter();
                
                const preferredVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes(currentCharacter?.voice.toLowerCase()) ||
                    voice.lang.startsWith(this.app.getCurrentUser()?.targetMarket === 'uk' ? 'en-GB' : 'en-US')
                );
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
                
                utterance.rate = this.app.getCurrentModule() === 'powerhour' ? 1.2 : 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                utterance.onend = () => {
                    this.isSpeaking = false;
                    setTimeout(() => {
                        if (this.app.isInCall() && this.continuousListening) {
                            this.startListening();
                        }
                    }, 500);
                };
                
                utterance.onerror = (error) => {
                    console.error('Speech synthesis fallback error:', error);
                    this.isSpeaking = false;
                    reject(error);
                };
                
                speechSynthesis.speak(utterance);
                resolve('fallback://browser-speech-synthesis');
            } else {
                reject(new Error('No speech synthesis available'));
            }
        });
    }
    
    stopCurrentSpeech() {
        this.app.audioManager.stopCurrentSpeech();
        this.isSpeaking = false;
    }
    
    updateVoiceStatus(status) {
        const voiceStatusEl = document.getElementById('voiceStatus');
        if (voiceStatusEl) {
            voiceStatusEl.textContent = status;
        }
    }
    
    handleSpeechError(error) {
        console.error('Speech recognition error:', error);
        
        const errorMessages = {
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'no-speech': 'No speech detected. Please speak clearly.',
            'network': 'Network error. Please check your connection.',
            'audio-capture': 'Microphone not available. Please check your device.',
            'aborted': 'Speech recognition was stopped.',
            'service-not-allowed': 'Speech recognition service not allowed.'
        };
        
        const message = errorMessages[error] || 'Speech recognition error occurred.';
        this.updateVoiceStatus(message);
        
        if (this.app.isInCall() && this.continuousListening) {
            setTimeout(() => {
                this.startListening();
            }, 2000);
        }
    }
    
    getSkippedQuestions() {
        return this.skippedQuestions;
    }
    
    getTimeoutResponses() {
        return this.timeoutResponses;
    }
    
    clearSessionData() {
        this.skippedQuestions = [];
        this.timeoutResponses = [];
        this.isInRepeatLoop = false;
        this.clearResponseTimeout();
    }
    
    cleanup() {
        this.stopListening();
        this.stopCurrentSpeech();
        this.clearResponseTimeout();
        this.continuousListening = false;
        this.clearSessionData();
    }
}
/**
 * User Manager - Handles user registration, authentication, and access levels
 */

export class UserManager {
    constructor(app) {
        this.app = app;
        this.accessLevels = {
            UNLIMITED: 'unlimited',
            UNLIMITED_LOCKED: 'unlimited_locked', 
            LIMITED: 'limited'
        };
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: 0,
            lastReset: null
        };
    }
    
    startTraining() {
        const firstName = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const prospectJobTitle = document.getElementById('prospectJobTitle').value;
        const prospectIndustry = document.getElementById('prospectIndustry')?.value || '';
        const targetMarket = document.getElementById('targetMarket').value;
        const customBehavior = document.getElementById('customBehavior')?.value.trim() || '';
        
        if (!firstName || !email || !prospectJobTitle || !targetMarket) {
            this.app.uiManager.showError('Please fill in all required fields to continue.');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.app.uiManager.showError('Please enter a valid email address.');
            return;
        }
        
        // Get custom job title if "other" was selected
        let finalJobTitle = prospectJobTitle;
        if (prospectJobTitle === 'other') {
            const customJobTitle = document.getElementById('customJobTitle')?.value.trim();
            if (!customJobTitle) {
                this.app.uiManager.showError('Please specify the custom job title.');
                return;
            }
            finalJobTitle = customJobTitle;
        }
        
        // Get custom industry if "other" was selected
        let finalIndustry = prospectIndustry;
        if (prospectIndustry === 'other') {
            const customIndustry = document.getElementById('customIndustry')?.value.trim();
            if (!customIndustry) {
                this.app.uiManager.showError('Please specify the custom industry.');
                return;
            }
            finalIndustry = customIndustry;
        }
        
        const user = {
            firstName,
            email,
            prospectJobTitle: finalJobTitle,
            prospectIndustry: finalIndustry,
            targetMarket,
            customBehavior,
            startTime: new Date().toISOString(),
            accessLevel: this.determineAccessLevel(email), // Default logic
            emailVerified: false
        };
        
        // For now, skip email verification in demo mode
        // In production, this would trigger email verification
        this.completeRegistration(user);
    }
    
    async sendEmailVerification(email, firstName) {
        // This would integrate with an email service
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        
        try {
            // Store verification code temporarily
            sessionStorage.setItem('verificationCode', verificationCode.toString());
            sessionStorage.setItem('pendingUser', JSON.stringify({ email, firstName }));
            
            // In production, send actual email here
            console.log(`📧 Verification code for ${email}: ${verificationCode}`);
            
            // Show verification form
            this.showVerificationForm();
            
            return true;
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return false;
        }
    }
    
    showVerificationForm() {
        // Hide registration form
        document.getElementById('userForm').style.display = 'none';
        
        // Show verification form (would need to be added to HTML)
        const verificationHTML = `
            <div id="verificationForm" class="user-form">
                <h3>Verify Your Email</h3>
                <p>We've sent a 6-digit code to your email address.</p>
                <div class="form-group">
                    <label for="verificationCode">Verification Code:</label>
                    <input type="text" id="verificationCode" placeholder="Enter 6-digit code" maxlength="6" required>
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="showRegistrationForm()">Back</button>
                    <button class="btn btn-primary" onclick="verifyEmailCode()">Verify</button>
                </div>
                <p style="text-align: center; margin-top: 15px;">
                    <a href="#" onclick="resendVerificationCode()">Resend Code</a>
                </p>
            </div>
        `;
        
        document.getElementById('userForm').insertAdjacentHTML('afterend', verificationHTML);
    }
    
    verifyEmailCode() {
        const enteredCode = document.getElementById('verificationCode').value.trim();
        const storedCode = sessionStorage.getItem('verificationCode');
        const pendingUser = JSON.parse(sessionStorage.getItem('pendingUser') || '{}');
        
        if (enteredCode === storedCode) {
            // Clean up verification data
            sessionStorage.removeItem('verificationCode');
            sessionStorage.removeItem('pendingUser');
            
            // Complete registration
            const user = {
                ...pendingUser,
                emailVerified: true,
                accessLevel: this.determineAccessLevel(pendingUser.email)
            };
            
            this.completeRegistration(user);
        } else {
            this.app.uiManager.showError('Invalid verification code. Please try again.');
        }
    }
    
    completeRegistration(user) {
        this.app.setCurrentUser(user);
        this.app.logActivity('user_registered', { user });
        
        // Send lead data to backend/CRM
        this.captureLeadData(user);
        
        // Initialize usage tracking
        this.initializeUsageTracking(user);
        
        this.app.uiManager.showModuleDashboard();
    }
    
    async captureLeadData(user) {
        try {
            // In production, this would send to your CRM/database
            const leadData = {
                firstName: user.firstName,
                email: user.email,
                prospectJobTitle: user.prospectJobTitle,
                prospectIndustry: user.prospectIndustry,
                targetMarket: user.targetMarket,
                customBehavior: user.customBehavior,
                timestamp: user.startTime,
                source: 'cold-call-trainer'
            };
            
            console.log('📧 Lead captured:', leadData);
            
            // Store locally for now
            const leads = JSON.parse(localStorage.getItem('capturedLeads') || '[]');
            leads.push(leadData);
            localStorage.setItem('capturedLeads', JSON.stringify(leads));
            
            // In production, send to backend
            // await fetch('/api/capture-lead', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(leadData)
            // });
            
        } catch (error) {
            console.error('Failed to capture lead data:', error);
        }
    }
    
    determineAccessLevel(email) {
        // Default logic - in production this would check against a database
        // For demo purposes, all users get unlimited access
        return this.accessLevels.UNLIMITED;
        
        // Example logic:
        // if (email.includes('premium')) return this.accessLevels.UNLIMITED;
        // if (email.includes('trial')) return this.accessLevels.UNLIMITED_LOCKED;
        // return this.accessLevels.LIMITED;
    }
    
    initializeUsageTracking(user) {
        this.usageTracking = {
            sessionTime: 0,
            totalUsage: this.loadUserUsage(user.email),
            lastReset: this.getLastResetDate(user.email),
            accessLevel: user.accessLevel
        };
        
        // Start session timer
        this.startSessionTimer();
    }
    
    startSessionTimer() {
        this.sessionStartTime = Date.now();
        
        // Update usage every minute
        this.usageTimer = setInterval(() => {
            this.updateUsage();
        }, 60000); // 1 minute
    }
    
    updateUsage() {
        if (!this.sessionStartTime) return;
        
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.sessionStartTime;
        
        this.usageTracking.sessionTime = sessionDuration;
        this.usageTracking.totalUsage += sessionDuration;
        
        // Check usage limits
        this.checkUsageLimits();
        
        // Save usage
        this.saveUserUsage();
    }
    
    checkUsageLimits() {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        const hourlyUsage = this.usageTracking.totalUsage / (1000 * 60 * 60);
        
        switch (user.accessLevel) {
            case this.accessLevels.UNLIMITED:
            case this.accessLevels.UNLIMITED_LOCKED:
                if (hourlyUsage >= 50) { // 50 hours per month
                    this.handleUsageLimitReached('monthly');
                }
                break;
                
            case this.accessLevels.LIMITED:
                if (hourlyUsage >= 3) { // 3 hours total
                    this.handleUsageLimitReached('lifetime');
                }
                break;
        }
    }
    
    handleUsageLimitReached(limitType) {
        const message = limitType === 'monthly' 
            ? 'You have reached your monthly usage limit of 50 hours. Your access will reset next month.'
            : 'You have reached your lifetime usage limit of 3 hours. Please upgrade for continued access.';
            
        this.app.uiManager.showError(message);
        
        // Disable access to locked modules
        if (this.app.isInCall()) {
            this.app.callManager.endCall();
        }
    }
    
    hasAccessToModule(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return false;
        
        // Check usage limits first
        const hourlyUsage = this.usageTracking.totalUsage / (1000 * 60 * 60);
        
        switch (user.accessLevel) {
            case this.accessLevels.UNLIMITED:
                return hourlyUsage < 50; // All modules if under limit
                
            case this.accessLevels.UNLIMITED_LOCKED:
                if (hourlyUsage >= 50) return false;
                // Only opener module or temporarily unlocked modules
                return moduleId === 'opener' || this.isTemporarilyUnlocked(moduleId);
                
            case this.accessLevels.LIMITED:
                if (hourlyUsage >= 3) return false;
                // Only opener module, permanent unlocks
                return moduleId === 'opener' || this.isPermanentlyUnlocked(moduleId);
                
            default:
                return false;
        }
    }
    
    isTemporarilyUnlocked(moduleId) {
        const unlockData = JSON.parse(localStorage.getItem('temporaryUnlocks') || '{}');
        const unlock = unlockData[moduleId];
        
        if (!unlock) return false;
        
        const unlockTime = new Date(unlock.unlockedAt);
        const now = new Date();
        const hoursElapsed = (now - unlockTime) / (1000 * 60 * 60);
        
        return hoursElapsed < 24; // 24-hour unlock
    }
    
    isPermanentlyUnlocked(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return false;
        
        const unlockedModules = JSON.parse(localStorage.getItem(`permanentUnlocks_${user.email}`) || '[]');
        return unlockedModules.includes(moduleId);
    }
    
    unlockModuleTemporarily(moduleId) {
        const unlockData = JSON.parse(localStorage.getItem('temporaryUnlocks') || '{}');
        unlockData[moduleId] = {
            unlockedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('temporaryUnlocks', JSON.stringify(unlockData));
        
        this.app.logActivity('module_unlocked_temporarily', { moduleId });
    }
    
    unlockModulePermanently(moduleId) {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        const unlockedModules = JSON.parse(localStorage.getItem(`permanentUnlocks_${user.email}`) || '[]');
        if (!unlockedModules.includes(moduleId)) {
            unlockedModules.push(moduleId);
            localStorage.setItem(`permanentUnlocks_${user.email}`, JSON.stringify(unlockedModules));
        }
        
        this.app.logActivity('module_unlocked_permanently', { moduleId });
    }
    
    loadUserUsage(email) {
        try {
            const usageData = JSON.parse(localStorage.getItem(`usage_${email}`) || '{}');
            return usageData.totalUsage || 0;
        } catch (error) {
            console.error('Failed to load user usage:', error);
            return 0;
        }
    }
    
    saveUserUsage() {
        const user = this.app.getCurrentUser();
        if (!user) return;
        
        try {
            const usageData = {
                totalUsage: this.usageTracking.totalUsage,
                lastUpdated: new Date().toISOString(),
                accessLevel: user.accessLevel
            };
            
            localStorage.setItem(`usage_${user.email}`, JSON.stringify(usageData));
        } catch (error) {
            console.error('Failed to save user usage:', error);
        }
    }
    
    getLastResetDate(email) {
        try {
            const usageData = JSON.parse(localStorage.getItem(`usage_${email}`) || '{}');
            return usageData.lastReset || new Date().toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    cleanup() {
        if (this.usageTimer) {
            clearInterval(this.usageTimer);
        }
        this.updateUsage(); // Final usage update
    }
}
/**
 * UI Manager - Handles all user interface updates and interactions
 */

export class UIManager {
    constructor(app) {
        this.app = app;
    }
    
    init() {
        this.setupUIElements();
        this.createProspectJobTitleDropdown();
        this.createProspectIndustryDropdown();
        this.addCustomBehaviorField();
        this.addAnimationStyles();
        console.log('🎨 UI Manager initialized');
    }
    
    setupUIElements() {
        // Update header text
        this.updateHeaderText();
        
        // Update form labels
        this.updateFormLabels();
    }
    
    updateHeaderText() {
        const headerTitle = document.querySelector('.header h1');
        const headerSubtitle = document.querySelector('.header p');
        
        if (headerTitle) {
            headerTitle.textContent = 'AI-Powered English Cold Calling Coach for Non-Native Speakers';
        }
        
        if (headerSubtitle) {
            headerSubtitle.textContent = 'Practice real-world tech sales roleplays and sharpen your objection-handling, pitch, and closing skills in English.';
        }
        
        // Also update the document title
        document.title = 'AI-Powered English Cold Calling Coach for Non-Native Speakers';
    }
    
    updateFormLabels() {
        const nameLabel = document.querySelector('label[for="userName"]');
        if (nameLabel) {
            nameLabel.textContent = 'First Name:';
        }
        
        const nameInput = document.getElementById('userName');
        if (nameInput) {
            nameInput.placeholder = 'Enter your first name';
        }
    }
    
    createProspectJobTitleDropdown() {
        // Find the job title form group and select element
        const jobTitleSelect = document.getElementById('jobTitle');
        if (!jobTitleSelect) {
            console.warn('⚠️ Job title select element not found');
            return;
        }
        
        const jobTitles = [
            'Brand/Communications Manager',
            'CEO (Chief Executive Officer)',
            'CFO (Chief Financial Officer)',
            'CIO (Chief Information Officer)',
            'COO (Chief Operating Officer)',
            'Content Marketing Manager',
            'CTO (Chief Technology Officer)',
            'Demand Generation Manager',
            'Digital Marketing Manager',
            'Engineering Manager',
            'Finance Director',
            'Founder / Owner / Managing Director (MD)',
            'Head of Product',
            'Purchasing Manager',
            'R&D/Product Development Manager',
            'Sales Manager',
            'Sales Operations Manager',
            'Social Media Manager',
            'UX/UI Design Lead',
            'VP of Finance',
            'VP of HR',
            'VP of IT/Engineering',
            'VP of Marketing',
            'VP of Sales'
        ];
        
        // Update the select element ID and attributes
        jobTitleSelect.id = 'prospectJobTitle';
        
        // Update label
        const label = jobTitleSelect.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.textContent = 'Prospect Job Title:';
            label.setAttribute('for', 'prospectJobTitle');
        }
        
        // Clear existing options and add new ones
        jobTitleSelect.innerHTML = '<option value="">Select prospect job title</option>';
        
        // Add all job title options in alphabetical order
        jobTitles.sort().forEach(title => {
            const option = document.createElement('option');
            option.value = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = title;
            jobTitleSelect.appendChild(option);
        });
        
        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        jobTitleSelect.appendChild(otherOption);
        
        // Add event listener for "Other" selection
        jobTitleSelect.addEventListener('change', (e) => {
            this.handleJobTitleChange(e.target.value);
        });
        
        console.log('✅ Prospect job title dropdown populated with', jobTitles.length, 'options');
    }
    
    createProspectIndustryDropdown() {
        const jobTitleSelect = document.getElementById('prospectJobTitle');
        if (!jobTitleSelect) {
            console.warn('⚠️ Job title select not found, cannot create industry dropdown');
            return;
        }
        
        const jobTitleContainer = jobTitleSelect.closest('.form-group');
        if (!jobTitleContainer) {
            console.warn('⚠️ Job title container not found');
            return;
        }
        
        const industries = [
            'Education & e-Learning',
            'Energy & Utilities',
            'Finance & Banking',
            'Government & Public Sector',
            'Healthcare & Life Sciences',
            'Hospitality & Travel',
            'Information Technology & Services',
            'Logistics, Transportation & Supply Chain',
            'Manufacturing & Industrial',
            'Media & Entertainment',
            'Non-Profit & Associations',
            'Professional Services (Legal, Accounting, Consulting)',
            'Real Estate & Property Management',
            'Retail & e-Commerce',
            'Telecommunications'
        ];
        
        // Create industry dropdown
        const industryGroup = document.createElement('div');
        industryGroup.className = 'form-group';
        
        const industryLabel = document.createElement('label');
        industryLabel.setAttribute('for', 'prospectIndustry');
        industryLabel.textContent = 'Prospect Industry:';
        
        const industrySelect = document.createElement('select');
        industrySelect.id = 'prospectIndustry';
        industrySelect.required = true;
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select prospect industry';
        industrySelect.appendChild(defaultOption);
        
        // Add industry options in alphabetical order
        industries.sort().forEach(industry => {
            const option = document.createElement('option');
            option.value = industry.toLowerCase().replace(/[^a-z0-9]/g, '_');
            option.textContent = industry;
            industrySelect.appendChild(option);
        });
        
        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Please specify)';
        industrySelect.appendChild(otherOption);
        
        // Add event listener for "Other" selection
        industrySelect.addEventListener('change', (e) => {
            this.handleIndustryChange(e.target.value);
        });
        
        industryGroup.appendChild(industryLabel);
        industryGroup.appendChild(industrySelect);
        
        // Insert after job title group
        jobTitleContainer.insertAdjacentElement('afterend', industryGroup);
        
        console.log('✅ Prospect industry dropdown created with', industries.length, 'options');
    }
    
    addCustomBehaviorField() {
        // Wait for industry dropdown to be created first
        setTimeout(() => {
            const industrySelect = document.getElementById('prospectIndustry');
            if (!industrySelect) {
                console.warn('⚠️ Industry select not found, cannot create custom behavior field');
                return;
            }
            
            const industryContainer = industrySelect.closest('.form-group');
            if (!industryContainer) {
                console.warn('⚠️ Industry container not found');
                return;
            }
            
            const customGroup = document.createElement('div');
            customGroup.className = 'form-group';
            
            const customLabel = document.createElement('label');
            customLabel.setAttribute('for', 'customBehavior');
            customLabel.textContent = 'Additional AI Behavior (Optional):';
            
            const customTextarea = document.createElement('textarea');
            customTextarea.id = 'customBehavior';
            customTextarea.placeholder = 'e.g., "Act more skeptical", "Be very busy", "Show interest in cost savings"...';
            customTextarea.rows = 3;
            customTextarea.style.cssText = `
                width: 100%;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                font-size: 1rem;
                font-family: inherit;
                background: #f8f9fa;
                resize: vertical;
                min-height: 80px;
            `;
            
            customTextarea.addEventListener('focus', () => {
                customTextarea.style.borderColor = '#667eea';
                customTextarea.style.background = 'white';
                customTextarea.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            });
            
            customTextarea.addEventListener('blur', () => {
                customTextarea.style.borderColor = '#e2e8f0';
                customTextarea.style.background = '#f8f9fa';
                customTextarea.style.boxShadow = 'none';
            });
            
            customGroup.appendChild(customLabel);
            customGroup.appendChild(customTextarea);
            
            // Insert after industry group
            industryContainer.insertAdjacentElement('afterend', customGroup);
            
            console.log('✅ Custom behavior field created');
        }, 100); // Small delay to ensure industry dropdown exists
    }
    
    handleJobTitleChange(value) {
        this.removeCustomInput('customJobTitle');
        
        if (value === 'other') {
            this.addCustomInput('prospectJobTitle', 'customJobTitle', 'Please specify the job title:');
        }
    }
    
    handleIndustryChange(value) {
        this.removeCustomInput('customIndustry');
        
        if (value === 'other') {
            this.addCustomInput('prospectIndustry', 'customIndustry', 'Please specify the industry:');
        }
    }
    
    addCustomInput(afterElementId, inputId, labelText) {
        const afterElement = document.getElementById(afterElementId);
        if (!afterElement) return;
        
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.id = inputId;
        customInput.placeholder = 'Enter custom value';
        customInput.required = true;
        customInput.style.cssText = `
            width: 100%;
            padding: 12px;
            border: 2px solid #667eea;
            border-radius: 8px;
            margin-top: 10px;
            font-size: 0.9rem;
        `;
        
        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.cssText = `
            margin-top: 10px;
            font-size: 0.9rem;
            color: #667eea;
            font-weight: 600;
        `;
        
        afterElement.parentNode.appendChild(label);
        afterElement.parentNode.appendChild(customInput);
    }
    
    removeCustomInput(inputId) {
        const existingInput = document.getElementById(inputId);
        if (existingInput) {
            const label = existingInput.previousElementSibling;
            if (label) label.remove();
            existingInput.remove();
        }
    }
    
    showModuleDashboard() {
        document.getElementById('userForm').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'none';
        document.getElementById('moduleDashboard').style.display = 'block';
        
        this.updateModuleUI();
        this.updateProgressStats();
    }
    
    updateModuleUI() {
        console.log('🔄 Updating module UI...');
        
        const modules = this.app.moduleManager.getAllModules();
        
        modules.forEach(module => {
            const card = document.getElementById(`module-${module.id}`);
            if (!card) {
                console.warn(`⚠️ Module card not found: module-${module.id}`);
                return;
            }
            
            this.updateModuleCard(card, module);
        });
        
        console.log('✅ Module UI update complete');
    }
    
    updateModuleCard(card, module) {
        const statusIcon = card.querySelector(`#status-${module.id} .lock-icon`);
        const progressFill = card.querySelector(`#progress-${module.id}`);
        const progressText = card.querySelector(`#progressText-${module.id}`);
        const practiceBtn = card.querySelector('.btn-practice');
        const marathonBtn = card.querySelector('.btn-marathon');
        const legendBtn = card.querySelector('.btn-legend');
        
        // Update lock status and access
        const hasAccess = this.app.userManager.hasAccessToModule(module.id);
        const isUnlocked = module.unlocked || hasAccess;
        
        if (isUnlocked) {
            card.classList.remove('locked');
            if (statusIcon) statusIcon.textContent = '🔓';
            
            // Enable practice button
            if (practiceBtn) practiceBtn.disabled = false;
            
            // Handle marathon button - only show for modules that have marathon
            if (marathonBtn) {
                if (module.hasMarathon) {
                    marathonBtn.disabled = false;
                    marathonBtn.style.display = 'inline-block';
                    // Fix marathon button text centering
                    marathonBtn.style.textAlign = 'center';
                    marathonBtn.style.whiteSpace = 'nowrap';
                    marathonBtn.style.overflow = 'hidden';
                } else {
                    marathonBtn.style.display = 'none';
                }
            }
            
            // Handle legend button - REMOVE from UI (F1)
            if (legendBtn) {
                legendBtn.style.display = 'none';
            }
        } else {
            card.classList.add('locked');
            if (statusIcon) statusIcon.textContent = '🔒';
            
            // Disable all buttons
            if (practiceBtn) practiceBtn.disabled = true;
            if (marathonBtn) marathonBtn.disabled = true;
            if (legendBtn) legendBtn.disabled = true;
        }
        
        // Update progress display
        this.updateModuleProgress(module, progressFill, progressText, isUnlocked);
        
        // Update descriptions
        this.updateModuleDescription(card, module);
    }
    
    updateModuleProgress(module, progressFill, progressText, isUnlocked) {
        const progress = this.app.moduleManager.getModuleProgress(module.id);
        
        if (isUnlocked) {
            let progressPercent = 0;
            let progressLabel = '';
            
            if (module.id === 'warmup') {
                // Warmup shows question progress
                const score = progress.warmupScore || 0;
                progressPercent = (score / module.totalQuestions) * 100;
                progressLabel = `${score}/${module.totalQuestions} Questions`;
                if (score >= module.passingScore) {
                    progressLabel += ' ✓';
                }
            } else if (module.hasMarathon) {
                // Marathon modules show marathon progress
                const marathonProgress = Math.min(progress.marathon, 10);
                progressPercent = (marathonProgress / 10) * 100;
                progressLabel = `${marathonProgress}/10 Marathon`;
                if (module.marathonCompleted) {
                    progressLabel += ' ✓';
                }
            } else {
                // Other modules show completion status
                progressPercent = progress.practice > 0 ? 100 : 0;
                progressLabel = progress.practice > 0 ? 'Completed ✓' : 'Not Started';
            }
            
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
            }
            
            if (progressText) {
                progressText.textContent = progressLabel;
            }
        } else {
            // Locked state
            if (progressFill) {
                progressFill.style.width = '0%';
            }
            
            if (progressText) {
                const prevModule = this.app.moduleManager.getPreviousModule(module.id);
                progressText.textContent = prevModule 
                    ? `Pass the Marathon of ${prevModule.name} to unlock this roleplay`
                    : 'Locked';
            }
        }
    }
    
    updateModuleDescription(card, module) {
        const descriptionEl = card.querySelector('p');
        if (descriptionEl && module.detailedDescription) {
            descriptionEl.textContent = module.detailedDescription;
        }
    }
    
    updateProgressStats() {
        const practiceMinutes = Math.floor(this.app.totalPracticeTime / (1000 * 60));
        const unlockedCount = this.app.moduleManager.getUnlockedModules().length;
        
        const practiceTimeEl = document.getElementById('totalPracticeTime');
        const unlockedModulesEl = document.getElementById('unlockedModules');
        
        if (practiceTimeEl) practiceTimeEl.textContent = `${practiceMinutes}m`;
        if (unlockedModulesEl) unlockedModulesEl.textContent = `${unlockedCount}/5`;
        
        // Check for 30-minute unlock
        if (practiceMinutes >= 30 && !this.allModulesUnlocked()) {
            this.show30MinuteUnlock();
        }
    }
    
    allModulesUnlocked() {
        return this.app.moduleManager.getUnlockedModules().length === 5;
    }
    
    show30MinuteUnlock() {
        const unlockNotice = document.getElementById('unlockNotice');
        if (unlockNotice) {
            unlockNotice.style.display = 'block';
        }
    }
    
    hideUnlockNotice() {
        const unlockNotice = document.getElementById('unlockNotice');
        if (unlockNotice) {
            unlockNotice.style.display = 'none';
        }
    }
    
    // Notification system
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                break;
            default:
                notification.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    // Modal management
    showFeedbackModal(title, content) {
        const modal = document.getElementById('feedbackModal');
        const titleEl = document.getElementById('feedbackTitle');
        const contentEl = document.getElementById('feedbackContent');
        
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;
        if (modal) modal.style.display = 'flex';
    }
    
    closeFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        if (modal) modal.style.display = 'none';
        this.showModuleDashboard();
    }
    
    // Add missing UI helper methods
    activateVoiceVisualizer() {
        const visualizer = document.getElementById('voiceVisualizer');
        if (visualizer) {
            visualizer.classList.add('active');
        }
    }
    
    deactivateVoiceVisualizer() {
        const visualizer = document.getElementById('voiceVisualizer');
        if (visualizer) {
            visualizer.classList.remove('active');
        }
    }
    
    resetVoiceVisualizer() {
        this.deactivateVoiceVisualizer();
    }
    
    showQuickSuccess() {
        const feedback = document.createElement('div');
        feedback.className = 'quick-success';
        feedback.textContent = '✓ Great response!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }
    
    showCallFeedback(feedback, success) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `call-feedback ${success ? 'success' : 'error'}`;
        feedbackEl.textContent = feedback;
        feedbackEl.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 15px;
            border-radius: 8px;
            color: white;
            font-size: 0.9rem;
            z-index: 100;
            max-width: 280px;
            text-align: center;
            background: ${success ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
        `;
        
        const phoneInterface = document.getElementById('phoneInterface');
        if (phoneInterface) {
            phoneInterface.appendChild(feedbackEl);
            
            setTimeout(() => {
                feedbackEl.remove();
            }, 3000);
        }
    }
    
    // Additional CSS for animations and Phase 1 fixes
    addAnimationStyles() {
        if (!document.getElementById('uiAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'uiAnimationStyles';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                
                .quick-success {
                    pointer-events: none;
                }
                
                .call-feedback {
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                
                /* Fix marathon button text centering (F2) */
                .btn-marathon {
                    text-align: center !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 8px 12px !important;
                }
                
                /* Phone interface improvements (G1) */
                .call-btn.decline-btn {
                    position: relative !important;
                    z-index: 10 !important;
                    margin: 0 auto !important;
                    max-width: 80px !important;
                    max-height: 80px !important;
                }
                
                .call-actions {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    padding: 0 20px !important;
                }
                
                /* Better locked state indicators (G1) */
                .module-card.locked {
                    opacity: 0.6;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                }
                
                .module-card.locked .progress-text {
                    font-weight: 600;
                    color: #6c757d;
                    background: rgba(108, 117, 125, 0.1);
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.85rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Global app instance
let app;

// Global Functions for HTML onclick handlers
window.startTraining = function() {
    app?.startTraining();
};

window.startModule = function(moduleId, mode) {
    app?.startModule(moduleId, mode);
};

window.endCall = function() {
    app?.endCall();
};

window.toggleMute = function() {
    app?.toggleMute();
};

window.toggleSpeaker = function() {
    app?.toggleSpeaker();
};

window.showKeypad = function() {
    app?.showKeypad();
};

window.closeFeedbackModal = function() {
    app?.closeFeedbackModal();
};

window.nextCall = function() {
    app?.nextCall();
};

window.hideUnlockNotice = function() {
    app?.hideUnlockNotice();
};

// Debug functions
window.debugModuleStates = function() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.moduleManager.debugStates();
};

window.forceUnlockModule = function(moduleId) {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.moduleManager.forceUnlock(moduleId);
};

window.resetAllProgress = function() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    app.progressManager.resetAll();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Cold Call Roleplay Trainer Loading...');
    
    // Browser compatibility check
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Speech recognition not supported');
        // Show compatibility notice
    }
    
    // Initialize the main application
    app = new ColdCallTrainer();
    
    // Mobile optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('📱 Mobile device detected - applying optimizations');
        // Apply mobile-specific optimizations
    }
    
    console.log('✅ Cold Call Roleplay Trainer Loaded Successfully!');
});

// Error boundary
window.addEventListener('error', function(event) {
    console.error('❌ Unhandled error:', event.error);
    if (app) {
        app.uiManager.showError('An unexpected error occurred. Please refresh if issues persist.');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    if (app) {
        app.uiManager.showError('Connection or processing error. Please try again.');
    }
});

// Export for testing
export { ColdCallTrainer };