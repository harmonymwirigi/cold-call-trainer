/**
 * Call Manager - Handles call flow, progression, and phone interface
 * Phase 2 Update: Enhanced warm-up challenge with proper scoring and timeout features
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
        
        // Setup progress display - Phase 2 E1: Proper warmup progress
        if (this.app.getCurrentModule() === 'warmup') {
            document.getElementById('callProgressContainer').style.display = 'block';
            this.updateWarmupProgress();
            this.addSkipButton(); // Phase 2 E2: Add skip functionality
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
        
        // Fix hangup button positioning (Phase 1 G1)
        this.fixHangupButtonPosition();
    }
    
    // Phase 2 E2: Add skip button for warm-up challenge
    addSkipButton() {
        const voiceStatus = document.getElementById('voiceStatus');
        if (!voiceStatus) return;
        
        // Remove existing skip button
        const existingSkipBtn = document.getElementById('skipQuestionBtn');
        if (existingSkipBtn) {
            existingSkipBtn.remove();
        }
        
        // Create skip button
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
        
        // Insert after voice status
        voiceStatus.parentNode.insertBefore(skipButton, voiceStatus.nextSibling);
    }
    
    // Phase 2 E2: Handle skip question functionality
    handleSkipQuestion() {
        if (this.app.getCurrentModule() !== 'warmup') return;
        
        // Record the skip
        this.app.speechManager.skippedQuestions.push({
            questionNumber: this.app.getCurrentProgress() + 1,
            timestamp: new Date().toISOString()
        });
        
        this.app.speechManager.updateVoiceStatus('Question skipped...');
        
        // Move to next question
        setTimeout(() => {
            this.handleWarmupNext();
        }, 1000);
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
        // Phase 2 E1: Complete set of 25 warmup questions
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
        
        const currentModule = this.app.getCurrentModule();
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        console.log(`✅ Progress: ${currentProgress}/${maxProgress} in ${this.app.getCurrentMode()} mode`);
        
        if (currentModule === 'warmup') {
            this.correctAnswers++;
            this.handleWarmupProgress();
        } else {
            this.updateCallProgress();
            
            if (currentProgress >= maxProgress) {
                console.log(`🎯 Reached max progress - completing ${this.app.getCurrentMode()} mode`);
                this.completeCurrentCall();
            } else {
                this.showQuickSuccess();
            }
        }
    }
    
    handleWarmupProgress() {
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        // Phase 2 E1: Update live score counter
        this.updateWarmupProgress();
        
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
    
    // Phase 2 E1: Enhanced warmup progress display
    updateWarmupProgress() {
        const currentProgress = this.app.getCurrentProgress();
        const totalQuestions = 25; // Phase 2 E1: Fixed to 25 questions
        const score = this.correctAnswers;
        
        // Update progress bar
        const progressPercent = (currentProgress / totalQuestions) * 100;
        const progressFill = document.getElementById('callProgressFill');
        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }
        
        // Phase 2 E1: Live score counter format "correct/attempted"
        const progressText = document.getElementById('callProgressText');
        if (progressText) {
            progressText.textContent = `${score}/${currentProgress}`;
        }
        
        // Update voice status with current score
        this.app.speechManager.updateVoiceStatus(`Score: ${score}/${currentProgress} | Question ${currentProgress + 1}/25`);
        
        console.log(`📊 Warmup Progress: ${score}/${currentProgress} (${progressPercent.toFixed(1)}%)`);
    }
    
    completeWarmupChallenge() {
        const module = this.app.moduleManager.modules.warmup;
        const score = this.correctAnswers;
        const passingScore = module.passingScore; // 18/25 needed to pass
        const totalQuestions = this.app.getCurrentProgress();
        
        // Set the score as current progress for saving
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
    
    // Phase 2 E2: Handle timeout with proper progression
    handleTimeoutNext() {
        this.handleWarmupNext();
    }
    
    // Phase 2 E2: Handle skip with proper progression
    handleSkipNext() {
        this.handleWarmupNext();
    }
    
    // Phase 2 E2: Common method for moving to next question (timeout/skip)
    handleWarmupNext() {
        // Move to next question without marking as correct
        this.app.setCurrentProgress(this.app.getCurrentProgress() + 1);
        
        const currentProgress = this.app.getCurrentProgress();
        const maxProgress = this.app.getMaxProgress();
        
        // Update progress display
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
        
        document.getElementById('callProgressFill').style.width = `${progressPercent}%`;
        document.getElementById('callProgressText').textContent = `${currentProgress}/${maxProgress}`;
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
        
        // Remove skip button if it exists
        const skipBtn = document.getElementById('skipQuestionBtn');
        if (skipBtn) {
            skipBtn.remove();
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
    
    // Phase 2 E2: Enhanced warmup summary with skip/timeout details
    showWarmupSummary() {
        const skipped = this.app.speechManager.getSkippedQuestions();
        const timeouts = this.app.speechManager.getTimeoutResponses();
        const score = this.correctAnswers;
        const totalQuestions = this.app.getCurrentProgress();
        const passingScore = 18;
        
        let summaryContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2rem; font-weight: bold; color: ${score >= passingScore ? '#4CAF50' : '#f44336'};">
                    ${score}/${totalQuestions}
                </div>
                <div style="margin-bottom: 10px;">Questions Answered Correctly</div>
                <div style="font-size: 0.9rem; color: #6c757d;">
                    ${score >= passingScore ? '🎉 PASSED' : '❌ FAILED'} (Need ${passingScore}/25 to pass)
                </div>
            </div>
        `;
        
        // Phase 2 E2: Show skipped questions summary
        if (skipped.length > 0) {
            summaryContent += `
                <div style="margin-bottom: 15px; text-align: left;">
                    <strong>⏭️ Skipped Questions (${skipped.length}):</strong>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        ${skipped.map(q => `<li>Question ${q.questionNumber}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Phase 2 E2: Show timeout questions summary
        if (timeouts.length > 0) {
            summaryContent += `
                <div style="margin-bottom: 15px; text-align: left;">
                    <strong>⏰ Too Slow Responses (${timeouts.length}):</strong>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        ${timeouts.map(t => `<li>Question ${t.questionNumber}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Performance breakdown
        const correctAnswered = score;
        const incorrectAnswered = totalQuestions - score - skipped.length - timeouts.length;
        
        if (totalQuestions > 0) {
            summaryContent += `
                <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                    <strong>📊 Performance Breakdown:</strong>
                    <div style="margin-top: 10px;">
                        <div>✅ Correct: ${correctAnswered}</div>
                        <div>❌ Incorrect: ${incorrectAnswered}</div>
                        <div>⏭️ Skipped: ${skipped.length}</div>
                        <div>⏰ Too Slow: ${timeouts.length}</div>
                    </div>
                </div>
            `;
        }
        
        const passed = score >= passingScore;
        if (passed) {
            summaryContent += `<div style="color: #4CAF50; font-weight: bold; text-align: center; font-size: 1.1rem;">🎉 Challenge Passed! Next module unlocked.</div>`;
        } else {
            summaryContent += `<div style="color: #f44336; font-weight: bold; text-align: center; font-size: 1.1rem;">Need ${passingScore}/25 to pass. Try again!</div>`;
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
                coachingMessage += `You completed ${currentProgress} questions with ${this.correctAnswers} correct answers. Practice the fundamentals more.`;
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