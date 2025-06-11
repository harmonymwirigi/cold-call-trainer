/**
 * Speech Manager - Enhanced with proper conversation flow handling
 * CRITICAL FIX: Added missing methods and better error handling
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
        
        // Enhanced timeout system
        this.responseTimeout = null;
        this.timeoutDuration = 5000;
        this.timeoutResponses = [];
        this.skippedQuestions = [];
        this.timeoutCountdown = null;
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
                    if (this.isSkipCommand(transcript)) {
                        this.handleSkipCommand();
                        return;
                    }
                    
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
        
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            this.startTimeoutCountdown();
        }
        
        this.responseTimeout = setTimeout(() => {
            if (this.isRecording) {
                this.handleTimeout();
            }
        }, this.timeoutDuration);
    }
    
    startTimeoutCountdown() {
        let timeLeft = Math.floor(this.timeoutDuration / 1000);
        
        const updateCountdown = () => {
            if (timeLeft > 0 && this.isRecording) {
                this.updateVoiceStatus(`Listening... (${timeLeft}s)`);
                timeLeft--;
                this.timeoutCountdown = setTimeout(updateCountdown, 1000);
            }
        };
        
        updateCountdown();
    }
    
    clearResponseTimeout() {
        if (this.responseTimeout) {
            clearTimeout(this.responseTimeout);
            this.responseTimeout = null;
        }
        
        if (this.timeoutCountdown) {
            clearTimeout(this.timeoutCountdown);
            this.timeoutCountdown = null;
        }
    }
    
    handleTimeout() {
        console.log('⏰ Response timeout - 5 seconds elapsed');
        this.stopListening();
        
        const currentModule = this.app.getCurrentModule();
        
        if (currentModule === 'warmup') {
            this.timeoutResponses.push({
                questionNumber: this.app.getCurrentProgress() + 1,
                timestamp: new Date().toISOString(),
                questionText: this.getCurrentQuestionText()
            });
            
            this.updateVoiceStatus('⏰ Too slow! Moving to next question...');
            
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.callManager.handleTimeoutNext();
                }
            }, 1500);
        } else {
            this.updateVoiceStatus('Too slow - please respond faster');
            this.speakAI("I didn't hear anything. Please try again and speak more clearly.");
        }
    }
    
    getCurrentQuestionText() {
        const currentIndex = this.app.getCurrentProgress();
        if (this.app.callManager.warmupQuestions && this.app.callManager.warmupQuestions[currentIndex]) {
            return this.app.callManager.warmupQuestions[currentIndex];
        }
        return `Question ${currentIndex + 1}`;
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
                timestamp: new Date().toISOString(),
                questionText: this.getCurrentQuestionText(),
                method: 'voice_command'
            });
            
            this.updateVoiceStatus('⏭️ Question skipped. Moving to next...');
            
            setTimeout(() => {
                if (this.app.isInCall()) {
                    this.app.callManager.handleSkipNext();
                }
            }, 1000);
        } else {
            this.updateVoiceStatus('Skip not available in this mode');
        }
    }
    
    startContinuousListening() {
        if (!this.recognition || this.isSpeaking) return;
        
        this.continuousListening = true;
        this.startListening();
        
        const currentModule = this.app.getCurrentModule();
        if (currentModule === 'warmup') {
            this.updateVoiceStatus('Your turn - speak clearly (5s timeout)');
        } else {
            this.updateVoiceStatus('Your turn - speak naturally');
        }
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
            progress: this.app.getCurrentProgress(),
            responseTime: this.speechStartTime ? Date.now() - this.speechStartTime : 0
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
    
    // CRITICAL FIX: Add missing shouldProgress method
    shouldProgress() {
    return true; // Always progress to avoid hanging up
}
    
    // CRITICAL FIX: Improved handleFallbackResponse that doesn't end the call
handleFallbackResponse(userInput = '', confidence = 0.8) {
    const currentModule = this.app.getCurrentModule();
    const currentMode = this.app.getCurrentMode();
    const conversationState = this.app.callManager.conversationState;
    
    console.log('🔄 Using fallback response for:', {
        module: currentModule,
        mode: currentMode,
        stage: conversationState?.stage,
        userInput: userInput.substring(0, 30) + '...'
    });
    
    let fallbackResponse;
    
    if (currentModule === 'opener') {
        fallbackResponse = this.generateOpenerFallbackResponse(conversationState, userInput);
    } else {
        fallbackResponse = this.generateGeneralFallbackResponse(currentModule, userInput);
    }
    
    // Parse the fallback response
    const parsedResponse = this.parseAIResponse(fallbackResponse);
    
    console.log('🔄 Fallback response:', parsedResponse.message);
    
    // Speak the AI response
    this.speakAI(parsedResponse.message);
    
    // CRITICAL FIX: Always treat fallback as successful to continue conversation
    setTimeout(() => {
        if (this.app.isInCall()) {
            console.log('✅ Processing fallback as successful interaction');
            this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
        }
    }, 1500);
}

    shouldProgressFallback(userInput, currentModule) {
    const inputLength = userInput.trim().length;
    
    // Basic checks for reasonable input
    if (inputLength < 10) return false;
    
    const lowerInput = userInput.toLowerCase();
    
    // Check for basic opener elements
    if (currentModule === 'opener') {
        const hasGreeting = lowerInput.includes('hi') || lowerInput.includes('hello') || lowerInput.includes('good');
        const hasName = lowerInput.includes('my name') || lowerInput.includes('this is') || lowerInput.includes('i\'m');
        const hasReason = lowerInput.includes('calling') || lowerInput.includes('reaching') || lowerInput.includes('about');
        
        return (hasGreeting || hasName || hasReason) && inputLength > 20;
    }
    
    // For other modules, be more lenient
    return inputLength > 15 && !lowerInput.includes('um') && !lowerInput.includes('uh');
}
generateGeneralFallbackResponse(currentModule, userInput = '') {
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
        pitch: [
            "Go ahead with your pitch. FEEDBACK: SUCCESS - Continue with your presentation.",
            "It's too expensive for us. FEEDBACK: SUCCESS - Handle this pricing objection.",
            "We have no budget for this right now. FEEDBACK: SUCCESS - Address the budget concern.",
            "Your competitor is cheaper. FEEDBACK: SUCCESS - Differentiate your value.",
            "This isn't a good time. FEEDBACK: SUCCESS - Handle the timing objection."
        ],
        fullcall: [
            "Hello, who is this? FEEDBACK: SUCCESS - Start with your opener.",
            "What's this about? FEEDBACK: SUCCESS - Handle this objection.",
            "I'm quite busy right now. FEEDBACK: SUCCESS - Respect their time.",
            "Go ahead with your pitch. FEEDBACK: SUCCESS - Deliver your value proposition.",
            "That sounds expensive. FEEDBACK: SUCCESS - Address the cost concern."
        ],
        powerhour: [
            `Call ${progress + 1}. Hello, make it quick. FEEDBACK: SUCCESS - Be concise and direct.`,
            "What's this about? FEEDBACK: SUCCESS - Quick explanation needed.",
            "Not interested, thanks. FEEDBACK: SUCCESS - Handle the brush-off.",
            "Your price is too high. FEEDBACK: SUCCESS - Justify your value quickly."
        ]
    };
    
    const responses = fallbackResponses[currentModule] || fallbackResponses.warmup;
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return response;
}
   async generateAIResponse(userInput, confidence = 0.8) {
    try {
        console.log('🤖 Generating AI response for:', userInput.substring(0, 50) + '...');
        
        const prompt = this.buildGPTPrompt(userInput);
        const response = await this.callOpenAI(prompt);
        
        if (!response) {
            console.warn('⚠️ No response from OpenAI, using fallback');
            this.handleFallbackResponse(userInput, confidence);
            return;
        }
        
        const parsedResponse = this.parseAIResponse(response);
        console.log('✅ AI Response parsed:', parsedResponse.message);
        
        // Speak the AI response
        this.speakAI(parsedResponse.message);
        
        // CRITICAL FIX: Always handle as successful interaction to continue conversation
        setTimeout(() => {
            if (this.app.isInCall()) {
                console.log('✅ Processing as successful interaction');
                this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ AI Response Error:', error);
        console.log('🔄 Using fallback response due to error');
        this.handleFallbackResponse(userInput, confidence);
    }
}
    // Add this evaluation method to SpeechManager.js:
   evaluateUserResponse(userInput, confidence) {
    const inputLength = userInput.trim().length;
    
    console.log('🔍 Evaluating user response:', {
        inputLength,
        confidence,
        content: userInput.substring(0, 30) + '...'
    });
    
    // Be very lenient to keep conversation flowing
    if (inputLength > 3 && confidence > 0.3) {
        return { success: true, shouldHangup: false };
    }
    
    // Only consider hanging up for completely empty responses
    if (inputLength < 2) {
        return { success: false, shouldHangup: false }; // Still don't hang up
    }
    
    return { success: true, shouldHangup: false };
}

    evaluateOpenerResponse(userInput, conversationState, soundsNatural) {
        const lowerInput = userInput.toLowerCase();
        
        if (conversationState.stage === 'opener') {
            // Opener evaluation
            const hasIntroduction = lowerInput.includes('my name') || lowerInput.includes('this is');
            const hasReason = lowerInput.includes('calling') || lowerInput.includes('reaching out');
            const hasQuestion = userInput.includes('?') || lowerInput.includes('can i') || lowerInput.includes('would you');
            const isReasonableLength = userInput.length > 30 && userInput.length < 200;
            
            const passCount = [hasIntroduction, hasReason, hasQuestion, isReasonableLength].filter(Boolean).length;
            
            return {
                success: passCount >= 3,
                shouldHangup: passCount < 2 || !soundsNatural
            };
        }
        
        if (conversationState.stage === 'objection') {
            // Objection handling evaluation
            const acknowledges = lowerInput.includes('understand') || lowerInput.includes('appreciate') || 
                                lowerInput.includes('totally') || lowerInput.includes('makes sense');
            const notDefensive = !lowerInput.includes('but') || !lowerInput.includes('however');
            const hasQuestion = userInput.includes('?');
            
            return {
                success: acknowledges && notDefensive && hasQuestion && soundsNatural,
                shouldHangup: !acknowledges || !hasQuestion
            };
        }
        
        return { success: true, shouldHangup: false };
    }

    evaluatePitchResponse(userInput, conversationState, soundsNatural) {
        const lowerInput = userInput.toLowerCase();
        
        // Pitch evaluation
        const isReasonableLength = userInput.length > 50 && userInput.length < 300;
        const hasBenefits = lowerInput.includes('help') || lowerInput.includes('save') || 
                          lowerInput.includes('increase') || lowerInput.includes('improve');
        const notTooTechnical = !lowerInput.includes('leverage') && !lowerInput.includes('optimize');
        
        return {
            success: isReasonableLength && hasBenefits && notTooTechnical && soundsNatural,
            shouldHangup: !isReasonableLength || !hasBenefits
        };
    }

    evaluateFullCallResponse(userInput, conversationState, soundsNatural) {
        // More lenient evaluation for full call simulation
        return {
            success: soundsNatural && userInput.length > 20,
            shouldHangup: !soundsNatural || userInput.length < 10
        };
    }

    evaluatePowerHourResponse(userInput, soundsNatural) {
        // Strict evaluation for power hour
        const isQuick = userInput.length < 150; // Must be concise
        const isConfident = !userInput.toLowerCase().includes('um') && 
                           !userInput.toLowerCase().includes('uh');
        
        return {
            success: soundsNatural && isQuick && isConfident,
            shouldHangup: !isQuick || !isConfident
        };
    }
    
    buildGPTPrompt(userInput) {
    const currentCharacter = this.app.characterManager.getCurrentCharacter();
    const currentModule = this.app.getCurrentModule();
    const currentMode = this.app.getCurrentMode();
    const conversationState = this.app.callManager.conversationState;
    
    let systemPrompt = `You are ${currentCharacter.name}, ${currentCharacter.title} at ${currentCharacter.company}.

IMPORTANT INSTRUCTIONS:
1. You are receiving a COLD CALL from a salesperson
2. Act like a real business professional who gets interrupted by cold calls
3. Be realistic but not immediately hostile
4. This is ${currentModule} practice in ${currentMode} mode

CONVERSATION STAGE: ${conversationState?.stage || 'opener'}
`;

    if (currentModule === 'opener') {
        if (conversationState?.stage === 'opener') {
            systemPrompt += `
STAGE: OPENER - The caller should introduce themselves with name, company, and reason for calling.
- If they give a good opener, respond with a common early objection
- If they give a weak opener, ask them to clarify who they are
- Don't hang up immediately unless they're very unprofessional`;
        } else if (conversationState?.stage === 'objection') {
            systemPrompt += `
STAGE: OBJECTION HANDLING - You just gave an objection. The caller should handle it with empathy.
- If they show empathy and ask questions, be more receptive
- If they argue or are defensive, be more resistant
- Don't hang up unless they're rude`;
        }
    }
    
    systemPrompt += `

Keep responses under 30 words. Be natural and realistic.
After your response, add: "FEEDBACK: SUCCESS - [brief tip]" if they did well, or "FEEDBACK: RETRY - [what to improve]" if they need work.`;

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
    
    return messages;
}
    
    getConversationContext() {
        const currentModule = this.app.getCurrentModule();
        const conversationState = this.app.callManager.conversationState;
        
        const contexts = {
            warmup: "This is a warm-up exercise. The caller needs quick practice with rapid-fire questions.",
            opener: `This is opener practice. Current conversation stage: ${conversationState?.stage || 'opener'}. ${this.getOpenerStageContext(conversationState)}`,
            pitch: "This is pitch practice. Evaluate if they presented benefits, specifics, and engagement.",
            fullcall: "This is a complete cold call simulation. Act like a real prospect.",
            powerhour: "This is rapid-fire practice. Create urgency and time pressure."
        };
        
        return contexts[currentModule] || contexts.warmup;
    }
    
    getOpenerStageContext(conversationState) {
        if (!conversationState) return "Expecting an opener.";
        
        switch (conversationState.stage) {
            case 'opener':
                return "Expecting the caller to deliver their opening line with name, company, and reason for calling.";
            case 'objection':
                return "Give an early objection. Evaluate if they show empathy, don't argue, and ask questions.";
            case 'pitch':
                return "They handled the objection. Now let them pitch and evaluate their value proposition.";
            case 'meeting':
                return "They pitched. Now let them ask for a meeting and negotiate time.";
            case 'complete':
                return "Call flow complete. Wrap up positively.";
            default:
                return "Continue the natural conversation flow.";
        }
    }
    
    // CRITICAL FIX: Ensure callOpenAI handles errors properly
async callOpenAI(messages) {
    try {
        console.log('📡 Calling OpenAI API...');
        
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
            console.warn(`⚠️ API response not OK: ${response.status}`);
            
            // Try to get error details
            try {
                const errorData = await response.json();
                console.log('📄 Error details:', errorData);
                
                if (errorData.fallback) {
                    console.log('🔄 API indicated fallback should be used');
                    return null; // This will trigger fallback
                }
            } catch (e) {
                console.warn('Could not parse error response');
            }
            
            return null; // Trigger fallback
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.warn('⚠️ Invalid OpenAI response structure');
            return null; // Trigger fallback
        }
        
        console.log('✅ OpenAI API successful');
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('❌ OpenAI API call failed:', error);
        return null; // This will trigger fallback
    }
}

    
    generateFallbackResponse() {
        const currentModule = this.app.getCurrentModule();
        const progress = this.app.getCurrentProgress();
        const conversationState = this.app.callManager.conversationState;
        
        if (currentModule === 'opener') {
            return this.generateOpenerFallbackResponse(conversationState);
        }
        
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
    
   generateOpenerFallbackResponse(conversationState, userInput = '') {
    if (!conversationState) {
        conversationState = { stage: 'opener' };
    }
    
    const lowerInput = userInput.toLowerCase();
    
    console.log('🔄 Generating opener fallback for stage:', conversationState.stage);
    
    switch (conversationState.stage) {
        case 'opener':
            // Check if user gave any kind of greeting or introduction
            const hasGreeting = lowerInput.includes('hi') || lowerInput.includes('hello') || 
                               lowerInput.includes('good') || lowerInput.includes('how are you');
            const hasName = lowerInput.includes('name') || lowerInput.includes('this is') || 
                           lowerInput.includes('i\'m') || lowerInput.includes('my name');
            
            if (hasGreeting || hasName || userInput.length > 10) {
                // Good enough opener - give an objection to move forward
                const objections = [
                    "What's this about exactly? FEEDBACK: SUCCESS - Good greeting! Now handle this objection.",
                    "I'm quite busy right now. What do you need? FEEDBACK: SUCCESS - Nice start! Address my time concern.",
                    "Who is this and why are you calling? FEEDBACK: SUCCESS - Continue with your introduction.",
                    "Is this a sales call? FEEDBACK: SUCCESS - Good opener! Handle this question directly."
                ];
                return objections[Math.floor(Math.random() * objections.length)];
            } else {
                // Encourage them to try again
                return "Hello? Who is this? FEEDBACK: RETRY - Start with a clear greeting and introduction.";
            }
            
        case 'objection':
            // User should handle objection - be encouraging
            const handlesObjection = lowerInput.includes('understand') || lowerInput.includes('appreciate') ||
                                   lowerInput.includes('respect') || lowerInput.includes('know') ||
                                   lowerInput.includes('realize') || userInput.length > 15;
            
            if (handlesObjection) {
                return "That makes sense. What exactly are you offering? FEEDBACK: SUCCESS - Good objection handling! Now pitch me.";
            } else {
                return "I really don't have time for this. FEEDBACK: RETRY - Show empathy first, then explain your value.";
            }
            
        case 'pitch':
            // User should deliver pitch
            const hasPitchElements = lowerInput.includes('help') || lowerInput.includes('save') ||
                                   lowerInput.includes('improve') || lowerInput.includes('solution') ||
                                   lowerInput.includes('benefit') || userInput.length > 20;
            
            if (hasPitchElements) {
                return "That sounds interesting. How would we get started? FEEDBACK: SUCCESS - Good pitch! Now ask for a meeting.";
            } else {
                return "I don't understand what you're selling. FEEDBACK: RETRY - Be clearer about your value proposition.";
            }
            
        case 'meeting':
            // User should ask for meeting
            const asksMeeting = lowerInput.includes('meeting') || lowerInput.includes('call') ||
                              lowerInput.includes('discuss') || lowerInput.includes('available') ||
                              lowerInput.includes('time') || lowerInput.includes('schedule');
            
            if (asksMeeting) {
                return "Let me check my calendar. Great conversation! FEEDBACK: SUCCESS - Perfect meeting request!";
            } else {
                return "So what's the next step? FEEDBACK: RETRY - Ask for a specific meeting time.";
            }
            
        default:
            return "Hello, I'm listening. Go ahead. FEEDBACK: SUCCESS - Continue with your opener.";
    }
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
    
    getSessionStatistics() {
        const totalQuestions = this.app.getCurrentProgress();
        const skippedCount = this.skippedQuestions.length;
        const timeoutCount = this.timeoutResponses.length;
        const correctCount = this.app.callManager?.correctAnswers || 0;
        const incorrectCount = totalQuestions - correctCount - skippedCount - timeoutCount;
        
        return {
            total: totalQuestions,
            correct: correctCount,
            incorrect: Math.max(0, incorrectCount),
            skipped: skippedCount,
            timeouts: timeoutCount,
            accuracy: totalQuestions > 0 ? (correctCount / totalQuestions * 100).toFixed(1) : 0,
            responseRate: totalQuestions > 0 ? ((totalQuestions - skippedCount - timeoutCount) / totalQuestions * 100).toFixed(1) : 0
        };
    }
    
    clearSessionData() {
        this.skippedQuestions = [];
        this.timeoutResponses = [];
        this.isInRepeatLoop = false;
        this.clearResponseTimeout();
        
        console.log('🧹 Speech session data cleared');
    }
    // Add these methods to SpeechManager.js

evaluateRoleplay1Response(userInput, conversationStage) {
    const lowerInput = userInput.toLowerCase();
    const inputLength = userInput.length;
    
    // Track pronunciation issues
    this.trackPronunciationIssues(userInput);
    
    switch (conversationStage) {
        case 'opener':
            return this.evaluateOpenerRoleplay1(userInput);
            
        case 'objection':
            return this.evaluateObjectionHandlingRoleplay1(userInput);
            
        case 'pitch':
            return this.evaluateMiniPitchRoleplay1(userInput);
            
        case 'discovery':
            return this.evaluateUncoveringPainRoleplay1(userInput);
            
        default:
            return { pass: false, failReason: 'Unknown stage' };
    }
}

evaluateOpenerRoleplay1(userInput) {
    const lowerInput = userInput.toLowerCase();
    let passCount = 0;
    const failReasons = [];
    
    // Check 1: Clear cold call opener
    const hasColdCallPattern = 
        lowerInput.includes('cold call') ||
        lowerInput.includes('reaching out') ||
        lowerInput.includes('calling from') ||
        lowerInput.includes('reason for') ||
        lowerInput.includes('why i\'m calling');
    
    if (hasColdCallPattern) passCount++;
    else failReasons.push('No clear cold call opener');
    
    // Check 2: Casual, confident tone (contractions and short phrases)
    const hasContractions = /\b(i'm|you're|we're|it's|that's|don't|won't|can't|couldn't|wouldn't|shouldn't|I'd|you'd|we'd)\b/i.test(userInput);
    const sentenceCount = userInput.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = userInput.split(' ').length / sentenceCount;
    
    if (hasContractions && avgWordsPerSentence < 15) passCount++;
    else failReasons.push('Too formal or long-winded');
    
    // Check 3: Demonstrates empathy
    const hasEmpathy = 
        lowerInput.includes('out of the blue') ||
        lowerInput.includes('don\'t know me') ||
        lowerInput.includes('you don\'t know me') ||
        lowerInput.includes('cold call') ||
        lowerInput.includes('feel free to hang up') ||
        lowerInput.includes('caught you off guard') ||
        lowerInput.includes('interrupting') ||
        lowerInput.includes('random') ||
        lowerInput.includes('unexpected');
    
    if (hasEmpathy) passCount++;
    else failReasons.push('No empathy shown');
    
    // Check 4: Ends with soft question
    const endsWithQuestion = userInput.trim().endsWith('?');
    const hasSoftQuestion = 
        lowerInput.includes('can i') ||
        lowerInput.includes('could i') ||
        lowerInput.includes('would you') ||
        lowerInput.includes('is it okay') ||
        lowerInput.includes('mind if');
    
    if (endsWithQuestion && hasSoftQuestion) passCount++;
    else failReasons.push('No soft question at end');
    
    // Auto-fail conditions
    const isTooLong = userInput.length > 200;
    const isRobotic = !hasContractions && !hasEmpathy;
    const isPushy = lowerInput.includes('must') || lowerInput.includes('need to') || lowerInput.includes('have to');
    
    if (isTooLong || isRobotic || isPushy || !endsWithQuestion) {
        return { 
            pass: false, 
            failReason: isTooLong ? 'Too long' : isRobotic ? 'Robotic/formal' : isPushy ? 'Too pushy' : 'No question',
            details: failReasons
        };
    }
    
    // Need 3 of 4 to pass
    return { 
        pass: passCount >= 3, 
        passCount,
        failReason: passCount < 3 ? failReasons.join(', ') : null,
        details: failReasons
    };
}

evaluateObjectionHandlingRoleplay1(userInput) {
    const lowerInput = userInput.toLowerCase();
    let passCount = 0;
    const failReasons = [];
    
    // Check 1: Acknowledges calmly
    const hasAcknowledgment = 
        lowerInput.includes('fair enough') ||
        lowerInput.includes('totally get that') ||
        lowerInput.includes('i get it') ||
        lowerInput.includes('i understand') ||
        lowerInput.includes('makes sense') ||
        lowerInput.includes('i hear you') ||
        lowerInput.includes('absolutely') ||
        lowerInput.includes('of course');
    
    if (hasAcknowledgment) passCount++;
    else failReasons.push('No calm acknowledgment');
    
    // Check 2: Doesn't argue or pitch
    const hasArgument = 
        lowerInput.includes('but') ||
        lowerInput.includes('however') ||
        lowerInput.includes('actually');
    
    const hasPitch = 
        lowerInput.includes('product') ||
        lowerInput.includes('solution') ||
        lowerInput.includes('service') ||
        lowerInput.includes('offer') ||
        lowerInput.includes('feature');
    
    if (!hasArgument && !hasPitch) passCount++;
    else failReasons.push('Argues or pitches too early');
    
    // Check 3: Reframes or buys time in 1 sentence
    const sentenceCount = userInput.split(/[.!?]+/).filter(s => s.trim()).length;
    const hasReframe = 
        lowerInput.includes('quick') ||
        lowerInput.includes('brief') ||
        lowerInput.includes('30 seconds') ||
        lowerInput.includes('one minute') ||
        lowerInput.includes('real quick');
    
    if (sentenceCount <= 2 && hasReframe) passCount++;
    else failReasons.push('Too long or no reframe');
    
    // Check 4: Ends with forward-moving question
    const endsWithQuestion = userInput.trim().endsWith('?');
    const hasForwardQuestion = 
        lowerInput.includes('would') ||
        lowerInput.includes('could') ||
        lowerInput.includes('can i') ||
        lowerInput.includes('what if') ||
        lowerInput.includes('how about');
    
    if (endsWithQuestion && hasForwardQuestion) passCount++;
    else failReasons.push('No forward-moving question');
    
    // Auto-fail conditions
    const isDefensive = lowerInput.includes('sorry') || lowerInput.includes('apologize');
    const isPushy = lowerInput.includes('you need') || lowerInput.includes('you must');
    const ignoresObjection = !hasAcknowledgment;
    
    if (isDefensive || isPushy || ignoresObjection || !endsWithQuestion) {
        return { 
            pass: false, 
            failReason: isDefensive ? 'Too apologetic' : isPushy ? 'Too pushy' : ignoresObjection ? 'Ignores objection' : 'No question',
            details: failReasons
        };
    }
    
    // Need 3 of 4 to pass
    return { 
        pass: passCount >= 3, 
        passCount,
        failReason: passCount < 3 ? failReasons.join(', ') : null,
        details: failReasons
    };
}

evaluateMiniPitchRoleplay1(userInput) {
    const lowerInput = userInput.toLowerCase();
    let passCount = 0;
    const failReasons = [];
    
    // Check 1: Short (1-2 sentences)
    const sentenceCount = userInput.split(/[.!?]+/).filter(s => s.trim()).length;
    if (sentenceCount <= 2) passCount++;
    else failReasons.push('Too long');
    
    // Check 2: Focuses on problem solved or outcome delivered
    const hasOutcome = 
        lowerInput.includes('help') ||
        lowerInput.includes('save') ||
        lowerInput.includes('reduce') ||
        lowerInput.includes('increase') ||
        lowerInput.includes('improve') ||
        lowerInput.includes('solve') ||
        lowerInput.includes('eliminate') ||
        lowerInput.includes('avoid');
    
    if (hasOutcome) passCount++;
    else failReasons.push('No clear outcome/benefit');
    
    // Check 3: Simple English (no jargon or buzzwords)
    const hasJargon = 
        lowerInput.includes('leverage') ||
        lowerInput.includes('synergy') ||
        lowerInput.includes('paradigm') ||
        lowerInput.includes('ecosystem') ||
        lowerInput.includes('bandwidth') ||
        lowerInput.includes('scalable') ||
        lowerInput.includes('cutting-edge') ||
        lowerInput.includes('best-in-class');
    
    if (!hasJargon) passCount++;
    else failReasons.push('Too much jargon');
    
    // Check 4: Sounds natural (using contractions, conversational)
    const hasContractions = /\b(we're|you're|it's|that's|we've|you've)\b/i.test(userInput);
    const soundsNatural = hasContractions && userInput.length < 150;
    
    if (soundsNatural) passCount++;
    else failReasons.push('Sounds scripted');
    
    // Auto-fail conditions
    const tooLong = sentenceCount > 3 || userInput.length > 200;
    const hasFeatures = lowerInput.includes('feature') || lowerInput.includes('functionality');
    const isVague = !hasOutcome;
    
    if (tooLong || hasFeatures || isVague) {
        return { 
            pass: false, 
            failReason: tooLong ? 'Too long/detailed' : hasFeatures ? 'Features not outcomes' : 'Too vague',
            details: failReasons
        };
    }
    
    // Need 3 of 4 to pass
    return { 
        pass: passCount >= 3, 
        passCount,
        failReason: passCount < 3 ? failReasons.join(', ') : null,
        details: failReasons
    };
}

evaluateUncoveringPainRoleplay1(userInput) {
    const lowerInput = userInput.toLowerCase();
    let passCount = 0;
    const failReasons = [];
    
    // Check 1: Asks a short question tied to the pitch
    const hasQuestion = userInput.includes('?');
    const isShort = userInput.length < 100;
    
    if (hasQuestion && isShort) passCount++;
    else failReasons.push('No short question');
    
    // Check 2: Question is open/curious
    const isOpenQuestion = 
        lowerInput.includes('how') ||
        lowerInput.includes('what') ||
        lowerInput.includes('when') ||
        lowerInput.includes('where') ||
        lowerInput.includes('curious');
    
    const hasCuriosityMarkers = 
        lowerInput.includes('currently') ||
        lowerInput.includes('right now') ||
        lowerInput.includes('at the moment') ||
        lowerInput.includes('today');
    
    if (isOpenQuestion || hasCuriosityMarkers) passCount++;
    else failReasons.push('Not open/curious enough');
    
    // Check 3: Tone is soft and non-pushy
    const isPushy = 
        lowerInput.includes('need to') ||
        lowerInput.includes('must') ||
        lowerInput.includes('should') ||
        lowerInput.includes('have to');
    
    if (!isPushy && isShort) passCount++;
    else failReasons.push('Too pushy');
    
    // Auto-fail conditions
    if (!hasQuestion) {
        return { 
            pass: false, 
            failReason: 'No question asked',
            details: failReasons
        };
    }
    
    const tooBroad = lowerInput.includes('tell me about') || lowerInput.includes('what are all');
    const tooDiscovery = userInput.split('?').length > 2; // Multiple questions
    
    if (tooBroad || tooDiscovery) {
        return { 
            pass: false, 
            failReason: tooBroad ? 'Question too broad' : 'Too many questions',
            details: failReasons
        };
    }
    
    // Need 2 of 3 to pass
    return { 
        pass: passCount >= 2, 
        passCount,
        failReason: passCount < 2 ? failReasons.join(', ') : null,
        details: failReasons
    };
}

// Track pronunciation issues for coaching
trackPronunciationIssues(userInput) {
    if (!this.pronunciationLog) {
        this.pronunciationLog = [];
    }
    
    // This would integrate with actual ASR confidence scores
    // For now, we'll track common pronunciation issues
    const commonMispronunciations = {
        'schedule': 'sked-jool',
        'comfortable': 'kumf-ter-bull',
        'literature': 'lit-er-uh-chur',
        'especially': 'eh-spesh-uh-lee',
        'colleague': 'kol-eeg',
        'hierarchy': 'high-er-ar-kee',
        'specifically': 'speh-sif-ik-lee'
    };
    
    Object.keys(commonMispronunciations).forEach(word => {
        if (userInput.toLowerCase().includes(word)) {
            this.pronunciationLog.push({
                word,
                phonetic: commonMispronunciations[word],
                confidence: 0.65 // Simulated low confidence
            });
        }
    });
}

// Generate coaching feedback after call
generateRoleplay1Coaching(callHistory, finalOutcome) {
    const coaching = {
        sales: null,
        grammar: null,
        vocabulary: null,
        pronunciation: null
    };
    
    // Sales coaching based on outcome
    if (finalOutcome.stage === 'opener' && !finalOutcome.pass) {
        coaching.sales = this.generateOpenerCoaching(finalOutcome.failReason);
    } else if (finalOutcome.stage === 'objection' && !finalOutcome.pass) {
        coaching.sales = this.generateObjectionCoaching(finalOutcome.failReason);
    } else if (finalOutcome.stage === 'pitch' && !finalOutcome.pass) {
        coaching.sales = this.generatePitchCoaching(finalOutcome.failReason);
    } else {
        coaching.sales = "Great job with the cold call flow!";
    }
    
    // Grammar coaching (simulated - would use actual grammar checking)
    const grammarIssues = this.checkGrammarIssues(callHistory);
    coaching.grammar = grammarIssues.length > 0 ? grammarIssues[0] : "Excellent grammar throughout!";
    
    // Vocabulary coaching
    const vocabularyIssues = this.checkVocabularyIssues(callHistory);
    coaching.vocabulary = vocabularyIssues.length > 0 ? vocabularyIssues[0] : "Great word choice!";
    
    // Pronunciation coaching
    if (this.pronunciationLog && this.pronunciationLog.length > 0) {
        const issue = this.pronunciationLog[0];
        coaching.pronunciation = `Word mispronounced: "${issue.word}"\nSay it like: "${issue.phonetic}"`;
    } else {
        coaching.pronunciation = "Clear pronunciation!";
    }
    
    return coaching;
}

generateOpenerCoaching(failReason) {
    const coachingMap = {
        'No clear cold call opener': 'Start with "Hi [Name], I\'m calling from [Company]" to be clear.',
        'Too formal or long-winded': 'Use contractions like "I\'m" instead of "I am". Keep it short!',
        'No empathy shown': 'Add "I know this is out of the blue" to show you understand.',
        'No soft question at end': 'End with "Can I tell you why I\'m calling?" to get permission.',
        'Too long': 'Keep your opener under 30 words. Get to the point quickly.',
        'Robotic/formal': 'Sound more natural. Imagine calling a friend.',
        'Too pushy': 'Replace "You need to" with "Would you be open to".',
        'No question': 'Always end with a question to engage the prospect.'
    };
    
    return coachingMap[failReason] || 'Work on making your opener sound more natural and conversational.';
}

generateObjectionCoaching(failReason) {
    const coachingMap = {
        'No calm acknowledgment': 'Start with "I totally get that" or "Fair enough" to show understanding.',
        'Argues or pitches too early': 'Don\'t use "but" or pitch yet. Just acknowledge first.',
        'Too long or no reframe': 'Keep it to one sentence: "I hear you - can I share something quick?"',
        'No forward-moving question': 'End with "Would you be open to..." to move forward.',
        'Too apologetic': 'Don\'t say sorry. Say "I understand" instead.',
        'Too pushy': 'Replace "You need" with "What if I could".',
        'Ignores objection': 'Always acknowledge what they said first.'
    };
    
    return coachingMap[failReason] || 'Focus on acknowledging their concern before moving forward.';
}

generatePitchCoaching(failReason) {
    const coachingMap = {
        'Too long': 'Keep your pitch to 1-2 sentences maximum. Be brief!',
        'No clear outcome/benefit': 'Focus on results: "We help companies save..." not features.',
        'Too much jargon': 'Use simple words. Say "help" not "leverage".',
        'Sounds scripted': 'Use contractions and speak naturally, like in normal conversation.',
        'Too long/detailed': 'Cut your pitch in half. Less is more.',
        'Features not outcomes': 'Talk about benefits (save time) not features (has dashboard).',
        'Too vague': 'Be specific: "reduce costs by 30%" not "improve efficiency".'
    };
    
    return coachingMap[failReason] || 'Make your pitch shorter and focus on clear benefits.';
}

checkGrammarIssues(callHistory) {
    const issues = [];
    
    // Common grammar mistakes for non-native speakers
    if (callHistory.includes('can assist the meeting')) {
        issues.push('You said: "We can assist the meeting."\nSay: "We can attend the meeting."\nBecause \'assist\' in Spanish means \'attend\', but in English it means \'help\'.');
    }
    
    if (callHistory.includes('explain you')) {
        issues.push('You said: "Let me explain you."\nSay: "Let me explain to you."\nBecause \'explain\' needs \'to\' before the person.');
    }
    
    return issues;
}

checkVocabularyIssues(callHistory) {
    const issues = [];
    
    // Common vocabulary mistakes
    if (callHistory.includes('win a meeting')) {
        issues.push('You said: "win a meeting."\nSay: "book a meeting."\nBecause \'win\' is not natural here.');
    }
    
    if (callHistory.includes('make a meeting')) {
        issues.push('You said: "make a meeting."\nSay: "schedule a meeting."\nBecause \'make\' doesn\'t fit with meetings.');
    }
    
    return issues;
}
    cleanup() {
        this.stopListening();
        this.stopCurrentSpeech();
        this.clearResponseTimeout();
        this.continuousListening = false;
        this.clearSessionData();
        
        console.log('🧹 Speech Manager cleanup complete');
    }
}