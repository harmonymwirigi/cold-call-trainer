/**
 * Cold Call Roleplay Trainer - Main Application
 * Enhanced with module gating, phone UI, and improved features
 */

// Global Application State
class ColdCallTrainer {
    constructor() {
        this.currentUser = null;
        this.currentModule = null;
        this.currentMode = null; // 'practice', 'marathon', 'legend'
        this.currentProgress = 0;
        this.maxProgress = 10;
        this.isCallActive = false;
        this.isRecording = false;
        this.isSpeaking = false;
        this.callStartTime = null;
        this.totalPracticeTime = 0;
        this.continuousListening = false;
        
        // Character system
        this.characters = this.initializeCharacters();
        this.currentCharacter = null;
        
        // Audio elements
        this.audioElements = {
            dial: null,
            ring: null,
            hangup: null,
            currentSpeech: null
        };
        
        // Speech recognition
        this.recognition = null;
        this.initializeSpeechRecognition();
        
        // Module configurations
        this.modules = this.initializeModules();
        this.moduleProgress = this.loadProgress();
        
        // Voice timing
        this.speechStartTime = null;
        this.lastInteractionTime = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('🎯 Cold Call Trainer initialized');
        this.setupEventListeners();
        this.initializeAudio();
        this.updateUI();
        
        // Check for 30-minute unlock
        if (this.totalPracticeTime >= 30 * 60 * 1000) {
            this.unlockAllModules();
        }
    }
    
    initializeCharacters() {
        return {
            // Male Characters
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
            // Female Characters
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
    
    initializeModules() {
        return {
            warmup: {
                id: 'warmup',
                name: 'Warm-Up Challenge',
                description: 'Rapid-fire warm-up so you practice every key line before live dialing',
                order: 1,
                unlocked: true, // Always unlocked
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false
            },
            opener: {
                id: 'opener',
                name: 'Opener + Early Objections',
                description: 'Pressure-test your opener and early-objection handling skills',
                order: 2,
                unlocked: true, // Unlocked for testing
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false
            },
            pitch: {
                id: 'pitch',
                name: 'Pitch + Post-Pitch Objections',
                description: 'Practice delivering pitches, handling objections, and booking meetings',
                order: 3,
                unlocked: true, // Unlocked for testing
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false
            },
            fullcall: {
                id: 'fullcall',
                name: 'Full Cold Call Simulation',
                description: 'Complete cold-call from opener to meeting booking',
                order: 4,
                unlocked: true, // Unlocked for testing
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false
            },
            powerhour: {
                id: 'powerhour',
                name: 'Power Hour Challenge',
                description: 'Ten back-to-back cold calls to build stamina and consistency',
                order: 5,
                unlocked: true, // Unlocked for testing
                marathonCompleted: false,
                legendAvailable: false,
                legendCompleted: false
            }
        };
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
            };
            
            this.recognition.onresult = (event) => {
                const lastResultIndex = event.results.length - 1;
                const result = event.results[lastResultIndex][0];
                const transcript = result.transcript.trim();
                const confidence = result.confidence || 0.8; // Fallback confidence
                
                console.log('🗣️ User said:', transcript, 'Confidence:', confidence);
                
                if (transcript && transcript.length > 2) {
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
                this.handleSpeechError(event.error);
            };
            
            this.recognition.onend = () => {
                if (this.continuousListening && this.isCallActive) {
                    // Restart recognition if we're in continuous mode
                    setTimeout(() => {
                        if (this.continuousListening && this.isCallActive && !this.isSpeaking) {
                            this.startListening();
                        }
                    }, 100);
                }
            };
        } else {
            console.warn('Speech recognition not supported');
        }
        
        // Initialize repeat loop variables
        this.isInRepeatLoop = false;
        this.repeatTarget = '';
        this.repeatType = ''; // 'grammar', 'vocabulary', 'pronunciation'
        this.repeatAttempts = 0;
        this.maxRepeatAttempts = 3;
    }
    
    initializeAudio() {
        // Create audio elements for phone sounds using simple approach
        this.audioElements.dial = this.createSimpleAudioElement('dial');
        this.audioElements.ring = this.createSimpleAudioElement('ring');
        this.audioElements.hangup = this.createSimpleAudioElement('hangup');
    }
    
    createSimpleAudioElement(type) {
        const audio = new Audio();
        
        // Use data URLs for simple tones
        const sampleRate = 8000; // Lower sample rate for smaller files
        const duration = type === 'ring' ? 1.0 : 0.5;
        const samples = sampleRate * duration;
        
        // Generate simple sine wave
        const frequencies = {
            'dial': [350, 440],
            'ring': [440, 480],
            'hangup': [480, 620]
        };
        
        const freqs = frequencies[type] || [440];
        const buffer = new ArrayBuffer(44 + samples * 2); // WAV header + PCM data
        const view = new DataView(buffer);
        
        // WAV header
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
        
        // Generate audio data
        for (let i = 0; i < samples; i++) {
            let sample = 0;
            freqs.forEach(freq => {
                sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
            });
            const amplitude = Math.floor((sample / freqs.length) * 16383);
            view.setInt16(44 + i * 2, amplitude, true);
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' });
        audio.src = URL.createObjectURL(blob);
        
        if (type === 'ring') {
            audio.loop = true;
        }
        
        return audio;
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
            if (document.hidden && this.isRecording) {
                this.stopListening();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.isCallActive && !this.continuousListening) {
                        this.toggleListening();
                    }
                    break;
                case 'Escape':
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.showModuleDashboard();
                    }
                    break;
            }
        });
    }
    
    // User Registration and Setup
    startTraining() {
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const jobTitle = document.getElementById('jobTitle').value;
        const targetMarket = document.getElementById('targetMarket').value;
        
        if (!name || !email || !jobTitle || !targetMarket) {
            this.showError('Please fill in all fields to continue.');
            return;
        }
        
        this.currentUser = {
            name,
            email,
            jobTitle,
            targetMarket,
            startTime: new Date().toISOString()
        };
        
        this.logActivity('user_registered', { user: this.currentUser });
        this.showModuleDashboard();
    }
    
    showModuleDashboard() {
        document.getElementById('userForm').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'none';
        document.getElementById('moduleDashboard').style.display = 'block';
        
        this.updateModuleUI();
        this.updateProgressStats();
    }
    
    updateModuleUI() {
        console.log('🔄 Updating module UI with current states:', this.modules);
        
        Object.values(this.modules).forEach(module => {
            const card = document.getElementById(`module-${module.id}`);
            const statusIcon = document.getElementById(`status-${module.id}`);
            const progressFill = document.getElementById(`progress-${module.id}`);
            const progressText = document.getElementById(`progressText-${module.id}`);
            const legendBtn = document.getElementById(`legend-${module.id}`);
            
            if (!card) {
                console.warn(`⚠️ Module card not found: module-${module.id}`);
                return;
            }
            
            console.log(`📋 Updating module ${module.id}:`, {
                unlocked: module.unlocked,
                marathonCompleted: module.marathonCompleted,
                legendAvailable: module.legendAvailable,
                legendCompleted: module.legendCompleted
            });
            
            // Update lock status
            if (module.unlocked) {
                card.classList.remove('locked');
                statusIcon.innerHTML = '🔓';
                
                // Enable buttons
                const buttons = card.querySelectorAll('.btn');
                buttons.forEach(btn => {
                    if (!btn.id || !btn.id.includes('legend') || module.legendAvailable) {
                        btn.disabled = false;
                        console.log(`✅ Enabled button: ${btn.textContent} for ${module.id}`);
                    } else {
                        console.log(`❌ Legend button still disabled for ${module.id}`);
                    }
                });
            } else {
                card.classList.add('locked');
                statusIcon.innerHTML = '🔒';
                
                // Disable buttons
                const buttons = card.querySelectorAll('.btn');
                buttons.forEach(btn => {
                    btn.disabled = true;
                    console.log(`🔒 Disabled button: ${btn.textContent} for ${module.id}`);
                });
            }
            
            // Update progress
            const progress = this.moduleProgress[module.id] || { marathon: 0, practice: 0 };
            const marathonProgress = Math.min(progress.marathon, 10);
            const progressPercent = (marathonProgress / 10) * 100;
            
            if (progressFill) {
                progressFill.style.width = `${progressPercent}%`;
            }
            
            if (progressText) {
                if (module.unlocked) {
                    progressText.textContent = `${marathonProgress}/10 Marathon`;
                    if (module.marathonCompleted) {
                        progressText.textContent += ' ✓';
                    }
                } else {
                    const prevModule = this.getPreviousModule(module.id);
                    progressText.textContent = prevModule ? `Complete ${prevModule.name} to unlock` : 'Locked';
                }
            }
            
            // Update Legend button
            if (legendBtn) {
                if (module.legendAvailable && !module.legendCompleted) {
                    legendBtn.disabled = false;
                    legendBtn.textContent = 'Legend Mode';
                    console.log(`🏆 Legend mode available for ${module.id}`);
                } else if (module.legendCompleted) {
                    legendBtn.disabled = true;
                    legendBtn.textContent = 'Legend Complete ✓';
                } else {
                    legendBtn.disabled = true;
                    legendBtn.textContent = 'Legend Mode';
                }
            }
        });
        
        console.log('✅ Module UI update complete');
    }
    
    updateProgressStats() {
        const practiceMinutes = Math.floor(this.totalPracticeTime / (1000 * 60));
        const unlockedCount = Object.values(this.modules).filter(m => m.unlocked).length;
        
        document.getElementById('totalPracticeTime').textContent = `${practiceMinutes}m`;
        document.getElementById('unlockedModules').textContent = `${unlockedCount}/5`;
        
        // Check for 30-minute unlock
        if (practiceMinutes >= 30 && !this.allModulesUnlocked()) {
            this.show30MinuteUnlock();
        }
    }
    
    // Module Management
    startModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module || !module.unlocked) {
            this.showError('This module is not yet unlocked.');
            return;
        }
        
        if (mode === 'legend' && !module.legendAvailable) {
            this.showError('Complete the marathon first to unlock Legend Mode.');
            return;
        }
        
        if (mode === 'legend' && module.legendCompleted) {
            this.showError('Legend Mode can only be completed once.');
            return;
        }
        
        this.currentModule = moduleId;
        this.currentMode = mode;
        this.currentProgress = 0;
        this.maxProgress = mode === 'marathon' ? 10 : (mode === 'legend' ? 18 : 1);
        
        this.logActivity('module_started', { module: moduleId, mode, maxProgress: this.maxProgress });
        this.initializeCall();
    }
    
    getPreviousModule(moduleId) {
        const moduleOrder = ['warmup', 'opener', 'pitch', 'fullcall', 'powerhour'];
        const currentIndex = moduleOrder.indexOf(moduleId);
        return currentIndex > 0 ? this.modules[moduleOrder[currentIndex - 1]] : null;
    }
    
    completeModule(moduleId, mode) {
        const module = this.modules[moduleId];
        if (!module) return;
        
        console.log(`🎯 Completing module: ${moduleId} in ${mode} mode`);
        
        if (mode === 'marathon') {
            module.marathonCompleted = true;
            module.legendAvailable = true;
            
            // Unlock next module
            const moduleOrder = ['warmup', 'opener', 'pitch', 'fullcall', 'powerhour'];
            const currentIndex = moduleOrder.indexOf(moduleId);
            if (currentIndex < moduleOrder.length - 1) {
                const nextModuleId = moduleOrder[currentIndex + 1];
                this.modules[nextModuleId].unlocked = true;
                console.log(`🔓 Unlocked next module: ${nextModuleId}`);
            }
            
            this.showSuccess(`🎉 Marathon completed! Legend Mode unlocked and next module available.`);
        } else if (mode === 'legend') {
            module.legendCompleted = true;
            this.showSuccess(`🏆 Legend Mode completed! You're a master of ${module.name}!`);
        }
        
        // Force save progress immediately
        this.saveProgress();
        
        // Update UI immediately  
        this.updateModuleUI();
        this.updateProgressStats();
        
        this.logActivity('module_completed', { module: moduleId, mode });
        
        console.log('📊 Current module states:', this.modules);
    }
    
    // Character and Call Management
    selectRandomCharacter() {
        const market = this.currentUser?.targetMarket || 'usa';
        const allCharacters = [...this.characters.male, ...this.characters.female];
        const marketCharacters = allCharacters.filter(char => char.market === market);
        
        // If no characters for specific market, use all characters
        const availableCharacters = marketCharacters.length > 0 ? marketCharacters : allCharacters;
        
        return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    }
    
    initializeCall() {
        this.currentCharacter = this.selectRandomCharacter();
        this.isCallActive = true;
        this.callStartTime = Date.now();
        this.continuousListening = true;
        
        document.getElementById('moduleDashboard').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'flex';
        
        this.setupPhoneUI();
        this.startCallSequence();
    }
    
    setupPhoneUI() {
        const char = this.currentCharacter;
        const module = this.modules[this.currentModule];
        
        // Update contact info
        document.getElementById('contactImage').src = char.image;
        document.getElementById('contactName').textContent = char.name;
        document.getElementById('contactTitle').textContent = char.title;
        document.getElementById('contactCompany').textContent = char.company;
        
        // Update module info
        document.getElementById('moduleType').textContent = `${this.currentMode.toUpperCase()} Mode`;
        document.getElementById('moduleDescription').textContent = module.description;
        
        // Setup progress if needed
        if (this.currentMode === 'marathon' || this.currentMode === 'legend') {
            document.getElementById('callProgressContainer').style.display = 'block';
            this.updateCallProgress();
        } else {
            document.getElementById('callProgressContainer').style.display = 'none';
        }
        
        // Reset UI state
        document.getElementById('callStatus').querySelector('.status-text').textContent = 'Dialing...';
        document.getElementById('callTimer').textContent = '00:00';
        document.getElementById('voiceStatus').textContent = 'Connecting...';
        
        this.resetVoiceVisualizer();
    }
    
    startCallSequence() {
        this.updateCallStatus('Dialing...');
        this.playDialTone();
        
        setTimeout(() => {
            // Simulate ring or no answer scenarios
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
        this.stopAudio();
        
        setTimeout(() => {
            this.updateCallStatus('Redialing...');
            setTimeout(() => {
                this.startRinging();
            }, 1500);
        }, 3000);
    }
    
    startRinging() {
        this.updateCallStatus('Ringing...');
        this.playRingTone();
        
        // Add call animation
        document.getElementById('callAnimation').classList.add('active');
        
        setTimeout(() => {
            this.answerCall();
        }, 3000 + Math.random() * 3000); // 3-6 seconds
    }
    
    answerCall() {
        this.stopAudio();
        document.getElementById('callAnimation').classList.remove('active');
        
        this.updateCallStatus('Connected');
        this.startCallTimer();
        this.updateVoiceStatus('AI is speaking...');
        
        // Start the conversation
        setTimeout(() => {
            this.startConversation();
        }, 1000);
    }
    
    startConversation() {
        const welcomeMessage = this.generateWelcomeMessage();
        this.speakAI(welcomeMessage);
        
        // Start continuous listening after AI speaks
        setTimeout(() => {
            if (this.isCallActive) {
                this.startContinuousListening();
            }
        }, 2000);
    }
    
    generateWelcomeMessage() {
        const char = this.currentCharacter;
        const module = this.currentModule;
        
        const welcomeMessages = {
            warmup: [
                `Welcome to warm-up training! I'm ${char.name}. I'll give you 25 rapid-fire prompts. Ready? Here's your first one:`,
                `Hi, I'm ${char.name}. Let's do some quick warm-up drills. I'll give you different scenarios to practice. Starting now:`,
                `${char.name} here. Time for rapid-fire practice! I'll throw different prompts at you. First up:`
            ],
            opener: [
                `Hello, this is ${char.name}. I'm quite busy, so make this quick.`,
                `${char.name} speaking. What do you want?`,
                `This is ${char.name}. I don't have much time, what's this about?`,
                `${char.name} here. I wasn't expecting a call.`
            ],
            pitch: [
                `Hi, this is ${char.name}. Go ahead with your pitch.`,
                `${char.name} speaking. I'll give you two minutes, what's your pitch?`,
                `This is ${char.name}. You've got my attention, now pitch me.`,
                `${char.name} here. I'm listening, what are you selling?`
            ],
            fullcall: [
                `Hello, this is ${char.name}.`,
                `${char.name} speaking, who is this?`,
                `This is ${char.name}, how can I help you?`,
                `${char.name} here, what's this regarding?`
            ],
            powerhour: [
                `Call 1. Hello, this is ${char.name}. You've got 30 seconds.`,
                `Power Hour Call 1. This is ${char.name}, make it quick.`,
                `${char.name} speaking. I'm between meetings, talk fast.`,
                `Call 1 of 10. ${char.name} here, what do you want?`
            ]
        };
        
        const messages = welcomeMessages[module] || welcomeMessages.warmup;
        let selectedMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Add first prompt for warmup
        if (module === 'warmup') {
            const firstPrompts = [
                "Give me your opener.",
                "What's your pitch in one sentence?",
                "Ask me for a meeting.",
                "Handle this objection: 'What's this about?'"
            ];
            const firstPrompt = firstPrompts[Math.floor(Math.random() * firstPrompts.length)];
            selectedMessage += ` ${firstPrompt}`;
        }
        
        return selectedMessage;
    }
    
    // Speech and Audio Management
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
            this.activateVoiceVisualizer();
        } catch (error) {
            console.error('Failed to start listening:', error);
            this.isRecording = false;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.deactivateVoiceVisualizer();
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
        if (!this.isCallActive) return;
        
        // Track speaking time
        if (this.speechStartTime) {
            const speakingTime = Date.now() - this.speechStartTime;
            this.totalPracticeTime += speakingTime;
            this.saveProgress();
        }
        
        this.lastInteractionTime = Date.now();
        this.updateVoiceStatus('Processing...');
        this.logActivity('user_input', { 
            transcript, 
            confidence,
            module: this.currentModule, 
            progress: this.currentProgress 
        });
        
        // Generate AI response
        this.generateAIResponse(transcript, confidence);
    }
    
    handleRepeatAttempt(transcript, confidence) {
        console.log(`🔄 Repeat attempt: "${transcript}" (confidence: ${confidence}) vs target: "${this.repeatTarget}"`);
        
        this.repeatAttempts++;
        
        // Calculate similarity and confidence check
        const similarity = this.calculateSimilarity(transcript.toLowerCase(), this.repeatTarget.toLowerCase());
        const minConfidence = 0.8;
        const minSimilarity = 0.8;
        
        console.log(`📊 Similarity: ${similarity}, Confidence: ${confidence}`);
        
        if (confidence >= minConfidence && similarity >= minSimilarity) {
            // Success! Exit repeat loop
            this.exitRepeatLoop(true);
            this.updateVoiceStatus('Great! Moving on...');
            
            setTimeout(() => {
                if (this.isCallActive && this.continuousListening) {
                    this.startListening();
                }
            }, 1000);
        } else if (this.repeatAttempts >= this.maxRepeatAttempts) {
            // Max attempts reached, continue anyway
            this.exitRepeatLoop(false);
            this.updateVoiceStatus('Let\'s continue...');
            
            setTimeout(() => {
                if (this.isCallActive && this.continuousListening) {
                    this.startListening();
                }
            }, 1000);
        } else {
            // Try again
            const feedback = confidence < minConfidence ? 
                'Try speaking more clearly.' : 
                'Try to match the pronunciation exactly.';
                
            this.updateVoiceStatus(feedback);
            this.speakAI(`${feedback} Please repeat: "${this.repeatTarget}"`);
        }
    }
    
    calculateSimilarity(str1, str2) {
        // Simple similarity calculation using Levenshtein distance
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
            this.showQuickSuccess();
        }
    }
    
    async generateAIResponse(userInput, confidence = 0.8) {
        try {
            const prompt = this.buildGPTPrompt(userInput);
            const response = await this.callOpenAI(prompt);
            
            // Parse response for feedback and next action
            const parsedResponse = this.parseAIResponse(response);
            
            // Check for repeat cues in the response
            const repeatMatch = parsedResponse.message.match(/Please repeat:\s*[""'']([^""'']+)[""'']/i);
            
            if (repeatMatch) {
                const targetPhrase = repeatMatch[1];
                console.log('🔄 Detected repeat cue:', targetPhrase);
                
                // Start repeat loop
                this.startRepeatLoop(targetPhrase, 'pronunciation');
                
                // Speak the instruction
                this.speakAI(parsedResponse.message);
                return;
            }
            
            // Speak the AI response
            this.speakAI(parsedResponse.message);
            
            // Handle progression logic
            if (parsedResponse.success && (this.currentMode === 'marathon' || this.currentMode === 'legend')) {
                this.handleSuccessfulInteraction();
            } else if (parsedResponse.feedback) {
                this.showCallFeedback(parsedResponse.feedback, parsedResponse.success);
            }
            
        } catch (error) {
            console.error('AI Response Error:', error);
            this.speakAI("I'm sorry, could you repeat that? I didn't catch what you said.");
            
            setTimeout(() => {
                if (this.isCallActive && this.continuousListening) {
                    this.startListening();
                }
            }, 2000);
        }
    }
    
    buildGPTPrompt(userInput) {
        const char = this.currentCharacter;
        const module = this.modules[this.currentModule];
        const context = this.getConversationContext();
        
        // Enhanced system prompts based on the new detailed prompts
        const systemPrompts = {
            warmup: `You are ${char.name}, ${char.personality}. You're running Module 3 - Warm-Up Quickfire training.
            
PURPOSE: Rapid-fire warm-up so the rep practices every key line before live dialing. Ask 25 prompts in random order.

FLOW: Pick random prompts from the master list. After each response, immediately give the next prompt. No detailed coaching during drill.

PROMPTS INCLUDE:
- Give your opener
- What's your pitch in one sentence?  
- Ask me for a meeting
- Handle objections like: "What's this about?", "I'm not interested", "Send me an email"
- Post-pitch objections like: "It's too expensive", "We have no budget", "Your competitor is cheaper"

Keep responses brief and immediately move to the next prompt. Personality: ${char.personality}.`,

            opener: `You are ${char.name}, a ${char.title} at ${char.company}. You're running Module 1 - Opener + Early Objection Practice.

PURPOSE: Pressure-test the sales rep's opener and early-objection handling. The drill STOPS after the first objection is handled.

FLOW LOGIC:
- START in slow mode. Wait for the rep's opener.
- Respond with ONE random early objection from the list.
- Judge using RUBRIC: (1) Shows empathy (2) Non-argumentative language (3) Addresses/reframes objection (4) Ends with forward-moving question.
- If PASS: "Great! Want another objection?" If fail: coaching feedback.
- Mode progression: slow (6 passes) → marathon (10 objections) → legend (15 objections)

EARLY OBJECTIONS: "What's this about?", "I'm not interested", "We don't take cold calls", "Now is not a good time", "I have a meeting", "Can you call me later?", "Send me an email", "Who gave you this number?", "What are you trying to sell me?", "Is this a sales call?", "We are ok for the moment", "We're not looking for anything", "How long is this going to take?", "What company are you calling from?", "I never heard of you"

Current progress: ${this.currentProgress}/${this.maxProgress}. Mode: ${this.currentMode}. Personality: ${char.personality}.`,

            pitch: `You are ${char.name}, a ${char.title} at ${char.company}. You're running Module 2 - Pitch + Post-Pitch Objection + Meeting.

PURPOSE: Practice delivering a pitch, handling post-pitch objections, and booking a meeting.

FLOW LOGIC:
1. AI says: "Go ahead with your pitch" if learner hasn't pitched yet
2. After pitch, give ONE objection from remaining list
3. Learner must: (a) Address/reframe objection AND (b) Ask for a meeting
4. When AI agrees to meeting, ALWAYS reject first suggested time slot: "That slot doesn't work for me"
5. Accept second time slot, then say "Great, see you then! Ready for another pitch?"

POST-PITCH OBJECTIONS: "It's too expensive for us", "We have no budget right now", "Your competitor is cheaper", "This isn't a good time", "We've already set this year's budget", "Call me back next quarter", "We already use a competitor", "How exactly are you better?", "I've never heard of your company", "I'm not the decision-maker", "I need approval from my team", "How long does this take to implement?"

Current progress: ${this.currentProgress}/${this.maxProgress}. Mode: ${this.currentMode}. Personality: ${char.personality}.`,

            fullcall: `You are ${char.name}, a ${char.title} at ${char.company}. You're running Module 4 - Full Cold-Call simulation.

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

Current stage: opener. Turn count: ${this.currentProgress}/25. Personality: ${char.personality}.`,

            powerhour: `You are ${char.name}, a ${char.title} at ${char.company}. You're running Module 5 - Power Hour (10 back-to-back cold calls).

PURPOSE: Run ten cold-call simulations in one session. Each call follows the full "Opener → Pitch → Meeting" flow.

CALL FLOW: Same as Module 4 but faster pace. Each call has 15-turn cap. After every call: instant score (0-4), micro-coaching, auto-start next call.

SCORING:
0 = fail early objection
1 = fail first post-pitch objection  
2 = handled objections but no meeting ask
3 = meeting agreed but no firm time
4 = meeting booked (second slot accepted)

You're prospect #${this.currentProgress + 1} of 10. Be challenging but fair. Use time pressure. Personality: ${char.personality}.`
        };
        
        const messages = [
            {
                role: "system",
                content: systemPrompts[this.currentModule] + `\n\nContext: ${context}`
            },
            {
                role: "user",
                content: userInput
            }
        ];
        
        // Add evaluation instruction for marathon/legend modes
        if (this.currentMode === 'marathon' || this.currentMode === 'legend') {
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
        
        return contexts[this.currentModule] || contexts.warmup;
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
        const char = this.currentCharacter;
        const module = this.currentModule;
        const progress = this.currentProgress;
        
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
                "Is this a sales call?",
                "We are ok for the moment.",
                "We're not looking for anything right now.",
                "How long is this going to take?",
                "What company are you calling from?",
                "I never heard of you."
            ],
            pitch: [
                "Go ahead with your pitch.",
                "It's too expensive for us.",
                "We have no budget for this right now.",
                "Your competitor is cheaper.",
                "This isn't a good time.",
                "We've already set this year's budget.",
                "Call me back next quarter.",
                "We already use a competitor and we're happy.",
                "How exactly are you better than the competition?",
                "I've never heard of your company.",
                "I'm not the decision-maker.",
                "I need approval from my team first.",
                "How long does this take to implement?",
                "What happens if this doesn't work as promised?"
            ],
            fullcall: [
                "Hello, this is " + char.name + ".",
                "What's this about?",
                "I'm quite busy right now.",
                "Go ahead with your pitch.",
                "That sounds expensive.",
                "I need to think about it.",
                "That time doesn't work for me.", // First slot rejection
                "Great, see you then!" // Second slot acceptance
            ],
            powerhour: [
                "Call " + (progress + 1) + ". Hello, this is " + char.name + ".",
                "Make it quick, I have another meeting.",
                "What's this about?",
                "Not interested, thanks.",
                "Your price is too high.",
                "I'm hanging up now.",
                "That time doesn't work.",
                "Fine, let's meet then."
            ]
        };
        
        const responses = fallbackResponses[module] || fallbackResponses.warmup;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Add feedback for marathon/legend modes
        if ((this.currentMode === 'marathon' || this.currentMode === 'legend') && module !== 'warmup') {
            const feedbackOptions = [
                "FEEDBACK: SUCCESS - Good approach, keep going!",
                "FEEDBACK: RETRY - Try to be more specific about the value you provide.",
                "FEEDBACK: SUCCESS - Nice opener with clear reason for calling.",
                "FEEDBACK: RETRY - Consider asking a question to engage me more.",
                "FEEDBACK: SUCCESS - You addressed my concern well.",
                "FEEDBACK: RETRY - I need more empathy in your response."
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
        this.stopListening(); // Stop listening while AI speaks
        
        try {
            const audioUrl = await this.synthesizeSpeech(text);
            
            // Check if we're using fallback speech synthesis
            if (audioUrl === 'fallback://browser-speech-synthesis') {
                // Browser speech synthesis is already playing, just wait
                return;
            }
            
            this.audioElements.currentSpeech = new Audio(audioUrl);
            this.audioElements.currentSpeech.onended = () => {
                this.isSpeaking = false;
                
                // Resume listening after AI finishes speaking
                setTimeout(() => {
                    if (this.isCallActive && this.continuousListening) {
                        this.startListening();
                    }
                }, 500);
            };
            
            this.audioElements.currentSpeech.onerror = () => {
                this.isSpeaking = false;
                console.error('Audio playback error');
                
                // Try fallback if audio fails
                this.synthesizeSpeechFallback(text).catch(() => {
                    // Final fallback: show text
                    this.updateVoiceStatus(`AI: "${text}"`);
                    setTimeout(() => {
                        if (this.isCallActive && this.continuousListening) {
                            this.startListening();
                        }
                    }, 2000);
                });
            };
            
            await this.audioElements.currentSpeech.play();
            
        } catch (error) {
            console.error('Speech synthesis error:', error);
            this.isSpeaking = false;
            
            // Fallback: show text and continue
            this.updateVoiceStatus(`AI: "${text}"`);
            setTimeout(() => {
                if (this.isCallActive && this.continuousListening) {
                    this.startListening();
                }
            }, 2000);
        }
    }
    
    async synthesizeSpeech(text) {
        try {
            const response = await fetch('/api/synthesize-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice: this.currentCharacter.voice,
                    format: 'mp3'
                })
            });
            
            if (!response.ok) {
                // Check if it's a configuration error
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
            // Use browser's built-in speech synthesis as fallback
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Try to find a voice that matches the character
                const voices = speechSynthesis.getVoices();
                const preferredVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes(this.currentCharacter.voice.toLowerCase()) ||
                    voice.lang.startsWith(this.currentUser?.targetMarket === 'uk' ? 'en-GB' : 'en-US')
                );
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
                
                utterance.rate = this.currentModule === 'powerhour' ? 1.2 : 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                utterance.onend = () => {
                    this.isSpeaking = false;
                    setTimeout(() => {
                        if (this.isCallActive && this.continuousListening) {
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
                
                // Return a placeholder URL since we're using direct speech synthesis
                resolve('fallback://browser-speech-synthesis');
            } else {
                reject(new Error('No speech synthesis available'));
            }
        });
    }
    
    stopCurrentSpeech() {
        if (this.audioElements.currentSpeech) {
            this.audioElements.currentSpeech.pause();
            this.audioElements.currentSpeech = null;
        }
        this.isSpeaking = false;
    }
    
    // Call Progress and UI Management
    handleSuccessfulInteraction() {
        this.currentProgress++;
        this.updateCallProgress();
        
        console.log(`✅ Progress: ${this.currentProgress}/${this.maxProgress} in ${this.currentMode} mode`);
        
        if (this.currentProgress >= this.maxProgress) {
            console.log(`🎯 Reached max progress - completing ${this.currentMode} mode`);
            this.completeCurrentCall();
        } else {
            this.showQuickSuccess();
        }
    }
    
    completeCurrentCall() {
        // Save progress immediately before showing completion
        this.saveProgress();
        
        setTimeout(() => {
            this.endCall(true);
            this.completeModule(this.currentModule, this.currentMode);
        }, 2000);
    }
    
    showQuickSuccess() {
        this.updateVoiceStatus('Great response! Continuing...');
        setTimeout(() => {
            if (this.isCallActive) {
                this.updateVoiceStatus('Your turn - keep going');
            }
        }, 2000);
    }
    
    updateCallProgress() {
        if (this.currentMode === 'practice') return;
        
        const progressPercent = (this.currentProgress / this.maxProgress) * 100;
        document.getElementById('callProgressFill').style.width = `${progressPercent}%`;
        document.getElementById('callProgressText').textContent = `${this.currentProgress}/${this.maxProgress}`;
    }
    
    updateCallStatus(status) {
        document.getElementById('callStatus').querySelector('.status-text').textContent = status;
    }
    
    updateVoiceStatus(status) {
        document.getElementById('voiceStatus').textContent = status;
    }
    
    startCallTimer() {
        this.callTimer = setInterval(() => {
            if (!this.callStartTime) return;
            
            const elapsed = Date.now() - this.callStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('callTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    activateVoiceVisualizer() {
        document.getElementById('voiceVisualizer').classList.add('active');
    }
    
    deactivateVoiceVisualizer() {
        document.getElementById('voiceVisualizer').classList.remove('active');
    }
    
    resetVoiceVisualizer() {
        this.deactivateVoiceVisualizer();
    }
    
    // Call Control Functions
    endCall(completed = false) {
        this.isCallActive = false;
        this.continuousListening = false;
        this.stopListening();
        this.stopCurrentSpeech();
        this.stopAudio();
        
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        // Track call duration
        if (this.callStartTime) {
            const callDuration = Date.now() - this.callStartTime;
            this.totalPracticeTime += callDuration;
            this.saveProgress();
        }
        
        this.playHangupTone();
        
        setTimeout(() => {
            if (completed) {
                this.showCompletionMessage();
            } else {
                this.showModuleDashboard();
            }
        }, 1000);
        
        this.logActivity('call_ended', { 
            module: this.currentModule, 
            mode: this.currentMode, 
            progress: this.currentProgress,
            completed 
        });
    }
    
    toggleMute() {
        // Implement mute functionality
        console.log('Mute toggled');
    }
    
    toggleSpeaker() {
        // Implement speaker functionality
        console.log('Speaker toggled');
    }
    
    showKeypad() {
        // Implement keypad functionality
        console.log('Keypad shown');
    }
    
    // Audio Control
    playDialTone() {
        this.stopAudio();
        if (this.audioElements.dial) {
            this.audioElements.dial.play().catch(console.error);
        }
    }
    
    playRingTone() {
        this.stopAudio();
        if (this.audioElements.ring) {
            this.audioElements.ring.play().catch(console.error);
        }
    }
    
    playHangupTone() {
        this.stopAudio();
        if (this.audioElements.hangup) {
            this.audioElements.hangup.play().catch(console.error);
        }
    }
    
    stopAudio() {
        Object.values(this.audioElements).forEach(audio => {
            if (audio && typeof audio.pause === 'function') {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
    
    // Progress Management
    saveProgress() {
        if (!this.moduleProgress[this.currentModule]) {
            this.moduleProgress[this.currentModule] = { marathon: 0, practice: 0, legend: false };
        }
        
        if (this.currentMode === 'marathon') {
            this.moduleProgress[this.currentModule].marathon = Math.max(
                this.moduleProgress[this.currentModule].marathon,
                this.currentProgress
            );
            
            // Mark marathon as completed if we reached max progress
            if (this.currentProgress >= this.maxProgress) {
                this.modules[this.currentModule].marathonCompleted = true;
                this.modules[this.currentModule].legendAvailable = true;
            }
        } else if (this.currentMode === 'legend' && this.currentProgress >= this.maxProgress) {
            this.moduleProgress[this.currentModule].legend = true;
            this.modules[this.currentModule].legendCompleted = true;
        }
        
        const saveData = {
            modules: this.modules,
            progress: this.moduleProgress,
            practiceTime: this.totalPracticeTime,
            user: this.currentUser
        };
        
        try {
            localStorage.setItem('coldCallTrainerData', JSON.stringify(saveData));
            console.log('💾 Progress saved:', saveData);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('coldCallTrainerData');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.modules) {
                    Object.assign(this.modules, data.modules);
                }
                
                if (data.practiceTime) {
                    this.totalPracticeTime = data.practiceTime;
                }
                
                if (data.user) {
                    this.currentUser = data.user;
                }
                
                return data.progress || {};
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
        
        return {};
    }
    
    // Special Features
    unlockAllModules() {
        Object.values(this.modules).forEach(module => {
            module.unlocked = true;
            if (module.marathonCompleted) {
                module.legendAvailable = true;
            }
        });
        
        this.saveProgress();
        this.updateModuleUI();
        this.logActivity('all_modules_unlocked', { reason: '30_minute_practice' });
    }
    
    show30MinuteUnlock() {
        document.getElementById('unlockNotice').style.display = 'block';
        this.unlockAllModules();
    }
    
    hide30MinuteUnlock() {
        document.getElementById('unlockNotice').style.display = 'none';
    }
    
    allModulesUnlocked() {
        return Object.values(this.modules).every(m => m.unlocked);
    }
    
    // UI Helpers
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
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
            default:
                notification.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
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
        
        document.getElementById('phoneInterface').appendChild(feedbackEl);
        
        setTimeout(() => {
            feedbackEl.remove();
        }, 3000);
    }
    
    showCompletionMessage() {
        const module = this.modules[this.currentModule];
        const title = this.currentMode === 'legend' ? 'Legend Complete!' : 'Marathon Complete!';
        const message = `Congratulations! You've completed ${module.name} in ${this.currentMode} mode.`;
        
        this.showFeedbackModal(title, message);
    }
    
    showFeedbackModal(title, content) {
        document.getElementById('feedbackTitle').textContent = title;
        document.getElementById('feedbackContent').innerHTML = content;
        document.getElementById('feedbackModal').style.display = 'flex';
    }
    
    closeFeedbackModal() {
        document.getElementById('feedbackModal').style.display = 'none';
        this.showModuleDashboard();
    }
    
    nextCall() {
        this.closeFeedbackModal();
        
        if (this.currentProgress < this.maxProgress) {
            // Continue current module
            this.initializeCall();
        } else {
            // Return to dashboard
            this.showModuleDashboard();
        }
    }
    
    // Error Handling
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
        
        if (this.isCallActive && this.continuousListening) {
            setTimeout(() => {
                this.startListening();
            }, 2000);
        }
    }
    
    // Logging and Analytics
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
    
    // Initialize app when DOM is ready
    updateUI() {
        if (this.currentUser) {
            this.showModuleDashboard();
        }
    }
}

// Global Functions for HTML onclick handlers
let app;

function startTraining() {
    app.startTraining();
}

function startModule(moduleId, mode) {
    app.startModule(moduleId, mode);
}

function endCall() {
    app.endCall();
}

function answerCall() {
    app.answerCall();
}

function toggleMute() {
    app.toggleMute();
}

function toggleSpeaker() {
    app.toggleSpeaker();
}

function showKeypad() {
    app.showKeypad();
}

function closeFeedbackModal() {
    app.closeFeedbackModal();
}

function nextCall() {
    app.nextCall();
}

function hideUnlockNotice() {
    app.hide30MinuteUnlock();
}

// Debug functions for troubleshooting
function debugModuleStates() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    console.log('🔍 DEBUG: Current Module States');
    console.log('================================');
    Object.entries(app.modules).forEach(([id, module]) => {
        console.log(`${id.toUpperCase()}:`, {
            unlocked: module.unlocked,
            marathonCompleted: module.marathonCompleted,
            legendAvailable: module.legendAvailable,
            legendCompleted: module.legendCompleted
        });
    });
    
    console.log('\n🔍 DEBUG: Module Progress');
    console.log('==========================');
    console.log(app.moduleProgress);
    
    console.log('\n🔍 DEBUG: Current User');
    console.log('=======================');
    console.log(app.currentUser);
}

function forceUnlockModule(moduleId) {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    if (app.modules[moduleId]) {
        app.modules[moduleId].unlocked = true;
        app.saveProgress();
        app.updateModuleUI();
        console.log(`✅ Force unlocked module: ${moduleId}`);
    } else {
        console.log(`❌ Module not found: ${moduleId}`);
    }
}

function resetAllProgress() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    // Reset modules to initial state
    Object.keys(app.modules).forEach(moduleId => {
        app.modules[moduleId].unlocked = moduleId === 'warmup'; // Only warmup unlocked
        app.modules[moduleId].marathonCompleted = false;
        app.modules[moduleId].legendAvailable = false;
        app.modules[moduleId].legendCompleted = false;
    });
    
    // Clear progress
    app.moduleProgress = {};
    app.totalPracticeTime = 0;
    
    // Save and update
    app.saveProgress();
    app.updateModuleUI();
    app.updateProgressStats();
    
    console.log('🔄 All progress reset');
}

function completeModule1() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    // Force complete warmup module
    app.modules.warmup.marathonCompleted = true;
    app.modules.warmup.legendAvailable = true;
    app.modules.opener.unlocked = true;
    
    // Update progress
    if (!app.moduleProgress.warmup) {
        app.moduleProgress.warmup = { marathon: 0, practice: 0, legend: false };
    }
    app.moduleProgress.warmup.marathon = 10;
    
    app.saveProgress();
    app.updateModuleUI();
    app.updateProgressStats();
    
    console.log('✅ Forced completion of Module 1 (Warmup)');
}

function testRepeatLoop() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    // Simulate a repeat loop
    app.startRepeatLoop('Hello, how are you today?', 'pronunciation');
    console.log('🔄 Started test repeat loop');
    console.log('💡 Say "Hello, how are you today?" to test the confidence checking');
}

function testAllModules() {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    // Unlock and enable legend for all modules
    Object.keys(app.modules).forEach(moduleId => {
        app.modules[moduleId].unlocked = true;
        app.modules[moduleId].marathonCompleted = true;
        app.modules[moduleId].legendAvailable = true;
        
        if (!app.moduleProgress[moduleId]) {
            app.moduleProgress[moduleId] = { marathon: 0, practice: 0, legend: false };
        }
        app.moduleProgress[moduleId].marathon = 10;
    });
    
    app.saveProgress();
    app.updateModuleUI();
    app.updateProgressStats();
    
    console.log('✅ All modules unlocked and completed for testing');
}

function simulateHighConfidence() {
    if (!app || !app.isInRepeatLoop) {
        console.log('Not in repeat loop or app not ready');
        return;
    }
    
    // Simulate high confidence response
    app.handleRepeatAttempt(app.repeatTarget, 0.95);
    console.log('✅ Simulated high confidence repeat');
}

function getPromptPreview(moduleId) {
    if (!app) {
        console.log('App not initialized yet');
        return;
    }
    
    // Temporarily set module to see prompt
    const originalModule = app.currentModule;
    const originalCharacter = app.currentCharacter;
    
    app.currentModule = moduleId;
    app.currentCharacter = app.selectRandomCharacter();
    
    const prompt = app.buildGPTPrompt('Hello, this is a test input');
    console.log(`📋 ${moduleId.toUpperCase()} Module Prompt Preview:`);
    console.log('=====================================');
    console.log(prompt[0].content);
    
    // Restore original state
    app.currentModule = originalModule;
    app.currentCharacter = originalCharacter;
}

// Enhanced API functions for the updated server endpoints
async function callGPTAPI(messages) {
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
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('GPT API Error:', error);
        throw error;
    }
}

async function synthesizeSpeechAPI(text, voice = 'Joanna', format = 'mp3') {
    try {
        const response = await fetch('/api/synthesize-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                voice,
                format,
                textType: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
    } catch (error) {
        console.error('Speech Synthesis Error:', error);
        throw error;
    }
}

// Health check function
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('📊 Server Status:', data);
        return data;
    } catch (error) {
        console.error('❌ Server health check failed:', error);
        
        // Fallback: try to check individual endpoints
        try {
            const chatTest = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
            });
            
            const speechTest = await fetch('/api/synthesize-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: 'test', voice: 'Joanna' })
            });
            
            return {
                status: 'PARTIAL',
                env: {
                    openai: chatTest.status !== 404,
                    aws: speechTest.status !== 404
                }
            };
        } catch (fallbackError) {
            console.warn('⚠️ Fallback health check also failed');
            return null;
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Cold Call Roleplay Trainer Loading...');
    
    // Check browser compatibility
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Speech recognition not supported in this browser');
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            text-align: center;
            max-width: 400px;
        `;
        notice.innerHTML = `
            <strong>Browser Compatibility Notice</strong><br>
            Please use Chrome, Edge, or Safari for the best experience with voice recognition.
        `;
        document.body.appendChild(notice);
        
        setTimeout(() => notice.remove(), 8000);
    }
    
    // Initialize the main application
    app = new ColdCallTrainer();
    
    // Check server configuration
    checkServerHealth().then(health => {
        if (health) {
            if (!health.env || !health.env.openai) {
                console.warn('⚠️ OpenAI not configured - Demo mode active');
            }
            if (!health.env || !health.env.aws) {
                console.warn('⚠️ AWS Polly not configured - Demo mode active');
            }
        }
    }).catch(error => {
        console.warn('⚠️ Could not check server health - continuing in demo mode');
    });
    
    // Mobile-specific optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        console.log('📱 Mobile device detected - applying optimizations');
        
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (window.innerWidth < 768) {
                    const viewport = document.querySelector('meta[name=viewport]');
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name=viewport]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            });
        });
        
        // Touch optimization for buttons
        const buttons = document.querySelectorAll('.btn, .call-btn, .control-btn');
        buttons.forEach(button => {
            button.style.touchAction = 'manipulation';
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            button.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
        
        // Request microphone permission early on mobile
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Don't actually request yet, just prepare for it
            console.log('📱 Microphone API available');
        }
    }
    
    // Keyboard shortcuts setup
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return; // Don't interfere with form inputs
        }
        
        switch(e.key) {
            case ' ': // Spacebar
                e.preventDefault();
                if (app && app.isCallActive && !app.continuousListening) {
                    app.toggleListening();
                }
                break;
            case 'Escape':
                if (app && app.isCallActive) {
                    app.endCall();
                } else if (document.getElementById('feedbackModal').style.display !== 'none') {
                    app.closeFeedbackModal();
                }
                break;
            case 'h': // Home
                if (app && !app.isCallActive) {
                    app.showModuleDashboard();
                }
                break;
        }
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (app && document.hidden && app.isRecording) {
            console.log('📱 Page hidden - pausing speech recognition');
            app.stopListening();
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', function() {
        console.log('🌐 Connection restored');
        if (app) {
            app.showSuccess('Connection restored');
        }
    });
    
    window.addEventListener('offline', function() {
        console.log('📡 Connection lost');
        if (app) {
            app.showError('Connection lost - some features may not work');
        }
    });
    
    // Performance monitoring
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
                console.log(`📊 Page load time: ${entry.loadEventEnd - entry.loadEventStart}ms`);
            }
        });
    });
    
    if (window.PerformanceObserver) {
        observer.observe({entryTypes: ['navigation']});
    }
    
    // Logo click counter for stats (Easter egg)
    let logoClicks = 0;
    const logo = document.querySelector('.header h1');
    if (logo) {
        logo.addEventListener('click', function() {
            logoClicks++;
            if (logoClicks >= 5) {
                showTrainingStats();
                logoClicks = 0;
            }
        });
    }
    
    console.log('✅ Cold Call Roleplay Trainer Loaded Successfully!');
});

// Training statistics function (Easter egg)
function showTrainingStats() {
    try {
        const logs = JSON.parse(localStorage.getItem('coldCallLogs') || '[]');
        const trainerData = JSON.parse(localStorage.getItem('coldCallTrainerData') || '{}');
        
        const stats = {
            totalSessions: logs.filter(log => log.action === 'user_registered').length,
            totalCalls: logs.filter(log => log.action === 'call_ended').length,
            completedModules: logs.filter(log => log.action === 'module_completed').length,
            totalPracticeTime: Math.floor((trainerData.practiceTime || 0) / (1000 * 60)),
            avgSessionLength: 0
        };
        
        // Calculate average session length
        const sessionStarts = logs.filter(log => log.action === 'call_started');
        const sessionEnds = logs.filter(log => log.action === 'call_ended');
        if (sessionStarts.length && sessionEnds.length) {
            const totalSessionTime = sessionEnds.reduce((total, end, index) => {
                const start = sessionStarts[index];
                if (start) {
                    return total + (new Date(end.timestamp) - new Date(start.timestamp));
                }
                return total;
            }, 0);
            stats.avgSessionLength = Math.floor(totalSessionTime / (sessionStarts.length * 1000 * 60));
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Training Statistics</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center;">
                        <div>
                            <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${stats.totalSessions}</div>
                            <div style="color: #6c757d;">Training Sessions</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${stats.totalCalls}</div>
                            <div style="color: #6c757d;">Total Calls</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${stats.completedModules}</div>
                            <div style="color: #6c757d;">Modules Completed</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${stats.totalPracticeTime}m</div>
                            <div style="color: #6c757d;">Total Practice Time</div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                        <strong>Keep up the great work! 🎯</strong><br>
                        <span style="color: #6c757d;">Every minute of practice makes you better at cold calling.</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error showing stats:', error);
        alert('Stats not available');
    }
}

// Error boundary for unhandled errors
window.addEventListener('error', function(event) {
    console.error('❌ Unhandled error:', event.error);
    
    if (app) {
        app.showError('An unexpected error occurred. Please refresh the page if issues persist.');
    }
});

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    
    if (app) {
        app.showError('Connection or processing error. Please try again.');
    }
});

// Service Worker registration for offline support (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js').then(function(registration) {
        //     console.log('✅ Service Worker registered');
        // }).catch(function(error) {
        //     console.log('❌ Service Worker registration failed');
        // });
    });
}

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColdCallTrainer };
}