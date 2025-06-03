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