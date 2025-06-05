/**
 * Call Manager - Complete Final Version
 * Combines all fixes: Ring control, hangup button, conversation flow, and warmup summary
 */

export class CallManager {
    constructor(app) {
        this.app = app;
        this.callTimer = null;
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.warmupQuestions = [];
        
        // CRITICAL FIX: Track ring state to prevent infinite ringing
        this.isRinging = false;
        this.ringTimeout = null;
        this.callSequenceActive = false;
        
        // CRITICAL FIX: Track conversation flow state
        this.conversationState = {
            stage: 'opener', // 'opener', 'objection', 'pitch', 'meeting', 'complete'
            openerDelivered: false,
            objectionHandled: false,
            pitchDelivered: false,
            meetingRequested: false,
            objectionCount: 0
        };
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
        
        // CRITICAL FIX: Reset call sequence state
        this.callSequenceActive = true;
        this.isRinging = false;
        
        // CRITICAL FIX: Reset conversation state
        this.resetConversationState();
        
        // Show phone interface
        document.getElementById('moduleDashboard').style.display = 'none';
        document.getElementById('phoneInterface').style.display = 'flex';
        
        this.setupPhoneUI();
        this.startCallSequence();
    }
    
    // CRITICAL FIX: Reset conversation state for each call
    resetConversationState() {
        this.conversationState = {
            stage: 'opener',
            openerDelivered: false,
            objectionHandled: false,
            pitchDelivered: false,
            meetingRequested: false,
            objectionCount: 0
        };
        
        console.log('🔄 Conversation state reset:', this.conversationState);
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
        if (this.app.getCurrentModule() === 'warmup') {
            document.getElementById('callProgressContainer').style.display = 'block';
            this.updateWarmupProgress();
            this.addSkipButton();
        } else if (this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend') {
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
        
        // CRITICAL FIX: Ensure hangup button is properly positioned
        this.fixHangupButtonPosition();
    }
    
    addSkipButton() {
        const voiceStatus = document.getElementById('voiceStatus');
        if (!voiceStatus) return;
        
        // Remove existing skip button
        const existingSkipBtn = document.getElementById('skipQuestionBtn');
        if (existingSkipBtn) {
            existingSkipBtn.remove();
        }
        
        // Create skip button with proper styling
        const skipButton = document.createElement('button');
        skipButton.id = 'skipQuestionBtn';
        skipButton.textContent = 'NEXT QUESTION';
        skipButton.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            display: block;
            margin-left: auto;
            margin-right: auto;
        `;
        
        skipButton.addEventListener('mouseover', () => {
            skipButton.style.background = 'rgba(255, 255, 255, 0.3)';
            skipButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        });
        
        skipButton.addEventListener('mouseout', () => {
            skipButton.style.background = 'rgba(255, 255, 255, 0.2)';
            skipButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        });
        
        skipButton.addEventListener('click', () => {
            this.handleSkipQuestion();
        });
        
        voiceStatus.parentNode.insertBefore(skipButton, voiceStatus.nextSibling);
    }
    
    handleSkipQuestion() {
        if (this.app.getCurrentModule() !== 'warmup') return;
        
        this.app.speechManager.skippedQuestions.push({
            questionNumber: this.app.getCurrentProgress() + 1,
            timestamp: new Date().toISOString(),
            questionText: this.getCurrentQuestionText(),
            method: 'button_click'
        });
        
        this.app.speechManager.updateVoiceStatus('⏭️ Question skipped. Moving to next...');
        
        setTimeout(() => {
            this.handleWarmupNext();
        }, 1000);
    }
    
    getCurrentQuestionText() {
        const currentIndex = this.app.getCurrentProgress();
        if (this.warmupQuestions && this.warmupQuestions[currentIndex]) {
            return this.warmupQuestions[currentIndex];
        }
        return `Question ${currentIndex + 1}`;
    }
    
    // CRITICAL FIX: Enhanced hangup button positioning
    fixHangupButtonPosition() {
        const hangupBtn = document.querySelector('.decline-btn');
        if (hangupBtn) {
            // Ensure the button is properly contained within the phone interface
            hangupBtn.style.position = 'relative';
            hangupBtn.style.zIndex = '10';
            hangupBtn.style.margin = '0 auto';
            hangupBtn.style.display = 'flex';
            hangupBtn.style.alignItems = 'center';
            hangupBtn.style.justifyContent = 'center';
            
            // Ensure parent container has proper layout
            const callActions = hangupBtn.closest('.call-actions');
            if (callActions) {
                callActions.style.display = 'flex';
                callActions.style.justifyContent = 'center';
                callActions.style.alignItems = 'center';
                callActions.style.padding = '0 30px';
                callActions.style.minHeight = '90px';
            }
            
            console.log('📱 Fixed hangup button positioning');
        }
    }
    
    startCallSequence() {
        if (!this.callSequenceActive) return;
        
        this.updateCallStatus('Dialing...');
        this.app.audioManager.playDialTone();
        
        setTimeout(() => {
            if (!this.callSequenceActive) return;
            
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
        if (!this.callSequenceActive) return;
        
        this.updateCallStatus('No answer...');
        this.app.audioManager.stopAudio();
        
        setTimeout(() => {
            if (!this.callSequenceActive) return;
            
            this.updateCallStatus('Redialing...');
            setTimeout(() => {
                if (this.callSequenceActive) {
                    this.startRinging();
                }
            }, 1500);
        }, 3000);
    }
    
    // CRITICAL FIX: Better ring control with timeout
    startRinging() {
        if (!this.callSequenceActive) return;
        
        this.updateCallStatus('Ringing...');
        this.isRinging = true;
        
        // Start ring tone
        this.app.audioManager.playRingTone();
        
        // Add call animation
        const callAnimation = document.getElementById('callAnimation');
        if (callAnimation) {
            callAnimation.classList.add('active');
        }
        
        // CRITICAL FIX: Set timeout to automatically answer after reasonable time
        const ringDuration = 3000 + Math.random() * 4000; // 3-7 seconds
        
        this.ringTimeout = setTimeout(() => {
            if (this.callSequenceActive && this.isRinging) {
                this.answerCall();
            }
        }, ringDuration);
    }
    
    // CRITICAL FIX: Properly stop ringing when call is answered
    answerCall() {
        if (!this.callSequenceActive) return;
        
        console.log('📞 Call answered - stopping ring');
        
        // CRITICAL FIX: Stop ringing immediately
        this.isRinging = false;
        this.app.audioManager.stopAudio(); // This will stop the ring tone
        
        // Clear ring timeout
        if (this.ringTimeout) {
            clearTimeout(this.ringTimeout);
            this.ringTimeout = null;
        }
        
        // Remove call animation
        const callAnimation = document.getElementById('callAnimation');
        if (callAnimation) {
            callAnimation.classList.remove('active');
        }
        
        this.updateCallStatus('Connected');
        this.startCallTimer();
        this.app.speechManager.updateVoiceStatus('AI is speaking...');
        
        setTimeout(() => {
            if (this.callSequenceActive) {
                this.startConversation();
            }
        }, 1000);
    }
    
    startConversation() {
        if (!this.callSequenceActive) return;
        
        const welcomeMessage = this.generateWelcomeMessage();
        this.app.speechManager.speakAI(welcomeMessage);
        
        setTimeout(() => {
            if (this.app.isInCall() && this.callSequenceActive) {
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
        
        // CRITICAL FIX: Different welcome messages based on module and conversation state
        if (currentModule === 'opener') {
            // Opener module: Start with natural greeting, expect opener
            return this.generateOpenerWelcomeMessage(character);
        }
        
        const welcomeMessages = {
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
    
    // CRITICAL FIX: Opener module welcome message
    generateOpenerWelcomeMessage(character) {
        const openerGreetings = [
            `Hello, this is ${character.name}.`,
            `${character.name} speaking.`,
            `This is ${character.name}, how can I help you?`,
            `${character.name} here.`,
            `Hello, ${character.name} speaking. Who is this?`
        ];
        
        return openerGreetings[Math.floor(Math.random() * openerGreetings.length)];
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
        
        if (this.warmupQuestions.length === 0) {
            this.warmupQuestions = [...warmupPrompts].sort(() => Math.random() - 0.5);
        }
        
        const questionNumber = this.app.getCurrentProgress() + 1;
        const currentQuestion = this.warmupQuestions[this.app.getCurrentProgress()];
        
        return `Welcome to warm-up training! I'm ${character.name}. Question ${questionNumber} of 25: ${currentQuestion}`;
    }
    
    // CRITICAL FIX: Enhanced handleSuccessfulInteraction with conversation flow logic
    handleSuccessfulInteraction(userInput, aiResponse) {
        const currentModule = this.app.getCurrentModule();
        
        // Handle different modules differently
        if (currentModule === 'warmup') {
            this.handleWarmupInteraction();
        } else if (currentModule === 'opener') {
            this.handleOpenerFlowInteraction(userInput, aiResponse);
        } else {
            this.handleStandardInteraction();
        }
    }
    
    // CRITICAL FIX: Handle opener flow progression
    handleOpenerFlowInteraction(userInput, aiResponse) {
        const currentMode = this.app.getCurrentMode();
        
        console.log('🔄 Opener Flow - Current State:', this.conversationState);
        console.log('🔄 User Input:', userInput);
        console.log('🔄 AI Response:', aiResponse);
        
        // Analyze what stage we're in based on the conversation
        if (currentMode === 'practice') {
            this.handleOpenerPracticeFlow(userInput, aiResponse);
        } else if (currentMode === 'marathon') {
            this.handleOpenerMarathonFlow(userInput, aiResponse);
        }
    }
    
    // CRITICAL FIX: Handle practice mode - complete flow
    handleOpenerPracticeFlow(userInput, aiResponse) {
        // In practice mode, go through complete flow: opener → objection → pitch → meeting
        
        if (this.conversationState.stage === 'opener' && !this.conversationState.openerDelivered) {
            // User just delivered opener, AI should give objection
            this.conversationState.openerDelivered = true;
            this.conversationState.stage = 'objection';
            console.log('✅ Opener delivered, moving to objection stage');
            
        } else if (this.conversationState.stage === 'objection' && !this.conversationState.objectionHandled) {
            // User handled objection, now ask for pitch
            this.conversationState.objectionHandled = true;
            this.conversationState.stage = 'pitch';
            console.log('✅ Objection handled, moving to pitch stage');
            
            // AI should ask for pitch
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.speechManager.speakAI("Good response! Now give me your pitch.");
                }
            }, 1000);
            
        } else if (this.conversationState.stage === 'pitch' && !this.conversationState.pitchDelivered) {
            // User delivered pitch, ask for meeting
            this.conversationState.pitchDelivered = true;
            this.conversationState.stage = 'meeting';
            console.log('✅ Pitch delivered, moving to meeting stage');
            
            // AI should respond to pitch and allow meeting ask
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.speechManager.speakAI("Interesting. What exactly are you proposing?");
                }
            }, 1000);
            
        } else if (this.conversationState.stage === 'meeting' && !this.conversationState.meetingRequested) {
            // User asked for meeting, complete the practice
            this.conversationState.meetingRequested = true;
            this.conversationState.stage = 'complete';
            console.log('✅ Meeting requested, practice complete');
            
            // Complete the practice session
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.speechManager.speakAI("Alright, let me check my calendar. Good work on that complete flow!");
                    setTimeout(() => {
                        this.completeCurrentCall();
                    }, 2000);
                }
            }, 1000);
        }
    }
    
    // CRITICAL FIX: Handle marathon mode - objection practice
    handleOpenerMarathonFlow(userInput, aiResponse) {
        // In marathon mode, focus on opener + objection handling (multiple objections)
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        console.log(`✅ Marathon Progress: ${currentProgress}/${maxProgress}`);
        
        this.updateCallProgress();
        
        if (currentProgress >= maxProgress) {
            console.log(`🎯 Marathon complete!`);
            this.completeCurrentCall();
        } else {
            this.showQuickSuccess();
            // Continue with next objection
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.generateNextMarathonObjection();
                }
            }, 2000);
        }
    }
    
    // CRITICAL FIX: Generate next objection for marathon mode
    generateNextMarathonObjection() {
        const objections = [
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
            "We're not looking for anything.",
            "How long is this going to take?",
            "What company are you calling from?",
            "I never heard of you."
        ];
        
        const randomObjection = objections[Math.floor(Math.random() * objections.length)];
        this.app.speechManager.speakAI(`Handle this objection: "${randomObjection}"`);
    }
    
    handleWarmupInteraction() {
        this.correctAnswers++;
        this.handleWarmupProgress();
    }
    
    handleStandardInteraction() {
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        this.updateCallProgress();
        
        if (currentProgress >= maxProgress) {
            this.completeCurrentCall();
        } else {
            this.showQuickSuccess();
        }
    }
    
    handleWarmupProgress() {
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        this.updateWarmupProgress();
        
        if (currentProgress >= maxProgress) {
            this.completeWarmupChallenge();
        } else {
            this.showQuickSuccess();
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.askNextWarmupQuestion();
                }
            }, 2000);
        }
    }
    
    updateWarmupProgress() {
        const currentProgress = this.app.getCurrentProgress();
        const totalQuestions = 25;
        const score = this.correctAnswers;
        
        const progressPercent = (currentProgress / totalQuestions) * 100;
        const progressFill = document.getElementById('callProgressFill');
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
        
        const progressText = document.getElementById('callProgressText');
        if (progressText) {
            progressText.textContent = `${score}/${currentProgress}`;
        }
        
        this.app.speechManager.updateVoiceStatus(`Score: ${score}/${currentProgress} | Question ${currentProgress + 1}/25`);
        
        console.log(`📊 Warmup Progress: ${score}/${currentProgress} (${progressPercent.toFixed(1)}%)`);
    }
    
    completeWarmupChallenge() {
        const module = this.app.moduleManager.modules.warmup;
        const score = this.correctAnswers;
        const passingScore = module.passingScore;
        const totalQuestions = this.app.getCurrentProgress();
        
        this.app.setCurrentProgress(score);
        
        const passed = score >= passingScore;
        
        console.log(`🎯 Warmup Challenge Complete: ${score}/${totalQuestions} (Need ${passingScore} to pass: ${passed ? 'PASSED' : 'FAILED'})`);
        
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
    
    handleTimeoutNext() {
        this.handleWarmupNext();
    }
    
    handleSkipNext() {
        this.handleWarmupNext();
    }
    
    handleWarmupNext() {
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        this.updateWarmupProgress();
        
        if (currentProgress >= maxProgress) {
            this.completeWarmupChallenge();
        } else {
            this.askNextWarmupQuestion();
        }
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
                if (this.app.getCurrentModule() === 'warmup') {
                    this.app.speechManager.updateVoiceStatus(`Score: ${this.correctAnswers}/${this.app.getCurrentProgress()} | Next question coming...`);
                } else {
                    this.app.speechManager.updateVoiceStatus('Your turn - keep going');
                }
            }
        }, 2000);
    }
    
    updateCallProgress() {
        if (this.app.getCurrentMode() === 'practice' && this.app.getCurrentModule() !== 'warmup') return;
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        const progressPercent = (currentProgress / maxProgress) * 100;
        
        const progressFill = document.getElementById('callProgressFill');
        const progressText = document.getElementById('callProgressText');
        
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
        if (progressText) {
            progressText.textContent = `${currentProgress}/${maxProgress}`;
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
    
    // CRITICAL FIX: Enhanced endCall method with proper cleanup
    endCall(completed = false) {
        console.log('📞 Ending call, completed:', completed);
        
        // CRITICAL FIX: Stop call sequence immediately
        this.callSequenceActive = false;
        this.isRinging = false;
        
        // Clear any pending timeouts
        if (this.ringTimeout) {
            clearTimeout(this.ringTimeout);
            this.ringTimeout = null;
        }
        
        // Stop all audio immediately
        this.app.audioManager.stopAudio();
        
        // Stop speech and listening
        this.app.setCallActive(false);
        this.app.speechManager.continuousListening = false;
        this.app.speechManager.stopListening();
        this.app.speechManager.stopCurrentSpeech();
        
        // Stop call timer
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        // Remove skip button
        const skipBtn = document.getElementById('skipQuestionBtn');
        if (skipBtn) {
            skipBtn.remove();
        }
        
        // Remove call animation
        const callAnimation = document.getElementById('callAnimation');
        if (callAnimation) {
            callAnimation.classList.remove('active');
        }
        
        // Update practice time
        if (this.app.callStartTime) {
            const callDuration = Date.now() - this.app.callStartTime;
            this.app.totalPracticeTime += callDuration;
            this.app.progressManager.saveProgress();
        }
        
        // Play hangup tone
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
            completed,
            conversationState: this.conversationState
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
    
    // COMPLETE: showWarmupSummary method with full breakdown
    showWarmupSummary() {
        const skipped = this.app.speechManager.getSkippedQuestions();
        const timeouts = this.app.speechManager.getTimeoutResponses();
        const score = this.correctAnswers;
        const totalQuestions = this.app.getCurrentProgress();
        const passingScore = 18;
        
        let summaryContent = `
            <div class="warmup-summary">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div class="summary-score">
                        <div class="score-display ${score >= passingScore ? 'passed' : 'failed'}">
                            ${score}/${totalQuestions}
                        </div>
                        <div style="margin-bottom: 10px;">Questions Answered Correctly</div>
                        <div style="font-size: 0.9rem; color: #6c757d;">
                            ${score >= passingScore ? '🎉 PASSED' : '❌ FAILED'} (Need ${passingScore}/25 to pass)
                        </div>
                    </div>
                </div>
        `;
        
        // Performance breakdown
        const correctAnswered = score;
        const incorrectAnswered = totalQuestions - score - skipped.length - timeouts.length;
        
        if (totalQuestions > 0) {
            summaryContent += `
                <div class="summary-breakdown">
                    <h4>📊 Performance Breakdown:</h4>
                    <div style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>✅ Correct:</span> <span style="font-weight: 600; color: #4CAF50;">${correctAnswered}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>❌ Incorrect:</span> <span style="font-weight: 600; color: #f44336;">${Math.max(0, incorrectAnswered)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>⏭️ Skipped:</span> <span style="font-weight: 600; color: #ff9800;">${skipped.length}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>⏰ Too Slow:</span> <span style="font-weight: 600; color: #9c27b0;">${timeouts.length}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Detailed skipped questions
        if (skipped.length > 0) {
            summaryContent += `
                <div class="summary-breakdown">
                    <h4>⏭️ Skipped Questions (${skipped.length}):</h4>
                    <ul class="summary-list">
                        ${skipped.map(q => `
                            <li>
                                <span class="question-number">Q${q.questionNumber}:</span> 
                                ${q.questionText || `Question ${q.questionNumber}`}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Detailed timeout questions  
        if (timeouts.length > 0) {
            summaryContent += `
                <div class="summary-breakdown">
                    <h4>⏰ Too Slow Responses (${timeouts.length}):</h4>
                    <ul class="summary-list">
                        ${timeouts.map(t => `
                            <li>
                                <span class="question-number">Q${t.questionNumber}:</span> 
                                ${t.questionText || `Question ${t.questionNumber}`}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Performance recommendations
        summaryContent += `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <strong>💡 Recommendations:</strong><br>
                ${this.generateWarmupRecommendations(score, skipped.length, timeouts.length, totalQuestions)}
            </div>
        `;
        
        const passed = score >= passingScore;
        if (passed) {
            summaryContent += `
                <div style="color: #4CAF50; font-weight: bold; text-align: center; font-size: 1.1rem; margin-top: 15px;">
                    🎉 Challenge Passed! Next module unlocked.
                </div>
            `;
        } else {
            summaryContent += `
                <div style="color: #f44336; font-weight: bold; text-align: center; font-size: 1.1rem; margin-top: 15px;">
                    Need ${passingScore}/25 to pass. Try again!
                </div>
            `;
        }
        
        summaryContent += `</div>`;
        
        this.app.uiManager.showFeedbackModal('Warm-up Challenge Complete', summaryContent);
    }
    generateWarmupRecommendations(score, skippedCount, timeoutCount, total) {
        const recommendations = [];
        
        if (score < 10) {
            recommendations.push("Focus on learning the basic cold calling fundamentals first");
        } else if (score < 15) {
            recommendations.push("Practice your objection handling responses");
        } else if (score < 18) {
            recommendations.push("You're close! Review your pitch and meeting request techniques");
        } else {
            recommendations.push("Excellent fundamentals! You're ready for advanced challenges");
        }
        
        if (skippedCount > 5) {
            recommendations.push("Try to answer more questions instead of skipping - it builds confidence");
        }
        
        if (timeoutCount > 5) {
            recommendations.push("Work on responding faster - practice makes your responses more natural");
        }
        
        if (skippedCount === 0 && timeoutCount === 0) {
            recommendations.push("Perfect completion! You answered every question within the time limit");
        }
        
        return recommendations.join(". ");
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
        // Add actual mute functionality here if needed
    }
    
    toggleSpeaker() {
        console.log('🔊 Speaker toggled');
        // Add actual speaker functionality here if needed
    }
    
    showKeypad() {
        console.log('⌨️ Keypad shown');
        // Add actual keypad functionality here if needed
    }
    
    // CRITICAL FIX: Enhanced hangup handling
    handleHangup() {
        if (this.app.isInCall()) {
            console.log('📞 User initiated hangup');
            this.provideHangupCoaching();
            this.endCall(false);
        } else {
            console.log('📞 Hangup called but no active call');
        }
    }
    
    provideHangupCoaching() {
        const currentModule = this.app.getCurrentModule();
        const currentProgress = this.app.getCurrentProgress();
        
        let coachingMessage = "Call ended early. ";
        
        switch (currentModule) {
            case 'opener':
                if (this.conversationState.stage === 'opener') {
                    coachingMessage += "Work on your opening line. Introduce yourself clearly with your name, company, and reason for calling.";
                } else if (this.conversationState.stage === 'objection') {
                    coachingMessage += "Good opener! Now focus on objection handling. Show empathy, don't argue, and ask questions to move forward.";
                } else if (this.conversationState.stage === 'pitch') {
                    coachingMessage += "Great objection handling! Work on delivering a concise, benefit-focused pitch.";
                } else {
                    coachingMessage += "You're doing well with the flow. Practice asking for specific meeting times.";
                }
                break;
            case 'pitch':
                coachingMessage += "Work on your pitch delivery and objection handling. Make sure to ask for the meeting.";
                break;
            case 'warmup':
                coachingMessage += `You completed ${currentProgress} questions with ${this.correctAnswers} correct answers. Practice the fundamentals more.`;
                break;
            case 'fullcall':
                coachingMessage += "Complete cold calls require persistence. Practice each component separately first.";
                break;
            case 'powerhour':
                coachingMessage += "Power hour requires stamina. Build up your skills with individual modules first.";
                break;
            default:
                coachingMessage += "Keep practicing to improve your cold calling skills.";
                break;
        }
        
        this.app.uiManager.showFeedbackModal('Coaching Feedback', coachingMessage);
    }
    
    // ADDITIONAL: Methods for debugging and testing
    debugCallState() {
        console.log('🔍 Call Manager Debug State:');
        console.log('- Call Active:', this.app.isInCall());
        console.log('- Call Sequence Active:', this.callSequenceActive);
        console.log('- Is Ringing:', this.isRinging);
        console.log('- Ring Timeout:', this.ringTimeout);
        console.log('- Current Module:', this.app.getCurrentModule());
        console.log('- Current Mode:', this.app.getCurrentMode());
        console.log('- Current Progress:', this.app.getCurrentProgress());
        console.log('- Conversation State:', this.conversationState);
        console.log('- Correct Answers:', this.correctAnswers);
    }
    
    // ADDITIONAL: Force end call for emergency situations
    forceEndCall() {
        console.log('🚨 Force ending call');
        this.callSequenceActive = false;
        this.isRinging = false;
        
        // Clear all timeouts
        if (this.ringTimeout) {
            clearTimeout(this.ringTimeout);
            this.ringTimeout = null;
        }
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        // Stop all audio and speech
        this.app.audioManager.stopAudio();
        this.app.speechManager.stopListening();
        this.app.speechManager.stopCurrentSpeech();
        
        // Clean up UI
        const skipBtn = document.getElementById('skipQuestionBtn');
        if (skipBtn) skipBtn.remove();
        
        const callAnimation = document.getElementById('callAnimation');
        if (callAnimation) callAnimation.classList.remove('active');
        
        // Set app state
        this.app.setCallActive(false);
        this.app.speechManager.continuousListening = false;
        
        // Return to dashboard
        this.app.uiManager.showModuleDashboard();
    }
}