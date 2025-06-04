/**
 * Speech Manager - Enhanced with proper conversation flow handling
 * Critical Fix: Handle opener flow interaction properly
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
            
            // CRITICAL FIX: Enhanced progression handling with user input context
            this.handleProgressionLogic(userInput, parsedResponse, confidence);
            
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
    
    // CRITICAL FIX: Enhanced progression logic
    handleProgressionLogic(userInput, parsedResponse, confidence) {
        const currentModule = this.app.getCurrentModule();
        const currentMode = this.app.getCurrentMode();
        
        console.log('🔄 Progression Logic:', {
            module: currentModule,
            mode: currentMode,
            userInput,
            response: parsedResponse.message,
            success: parsedResponse.success
        });
        
        // Different handling for different modules
        if (currentModule === 'warmup') {
            // Warmup: Simple success handling
            if (parsedResponse.success || this.isCorrectWarmupResponse(userInput)) {
                this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
            }
        } else if (currentModule === 'opener') {
            // Opener: Complex flow handling
            this.handleOpenerProgression(userInput, parsedResponse, confidence);
        } else {
            // Other modules: Standard handling
            if (parsedResponse.success || (currentMode === 'marathon' || currentMode === 'legend')) {
                this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
            } else if (parsedResponse.feedback) {
                this.app.uiManager.showCallFeedback(parsedResponse.feedback, parsedResponse.success);
            }
        }
    }
    
    // CRITICAL FIX: Handle opener module progression
    handleOpenerProgression(userInput, parsedResponse, confidence) {
        const currentMode = this.app.getCurrentMode();
        
        // Analyze user input to determine what they said
        const inputAnalysis = this.analyzeUserInput(userInput);
        
        console.log('🔄 Opener Analysis:', inputAnalysis);
        
        // For practice mode: progression through complete flow
        if (currentMode === 'practice') {
            if (inputAnalysis.type === 'opener' || inputAnalysis.type === 'objection_response' || 
                inputAnalysis.type === 'pitch' || inputAnalysis.type === 'meeting_request') {
                
                // Pass the analysis to call manager for flow control
                this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
            }
        } 
        // For marathon mode: objection handling practice
        else if (currentMode === 'marathon') {
            if (inputAnalysis.type === 'opener' || inputAnalysis.type === 'objection_response') {
                this.app.callManager.handleSuccessfulInteraction(userInput, parsedResponse.message);
            }
        }
    }
    
    // CRITICAL FIX: Analyze user input to understand intent
    analyzeUserInput(input) {
        const lowerInput = input.toLowerCase();
        
        // Check for opener indicators
        const openerIndicators = ['hi', 'hello', 'my name is', 'this is', 'calling from', 'i\'m calling'];
        const hasOpenerIndicators = openerIndicators.some(indicator => lowerInput.includes(indicator));
        
        // Check for objection response indicators
        const objectionIndicators = ['understand', 'appreciate', 'respect', 'i hear you', 'makes sense'];
        const hasObjectionIndicators = objectionIndicators.some(indicator => lowerInput.includes(indicator));
        
        // Check for pitch indicators
        const pitchIndicators = ['help', 'solution', 'benefit', 'value', 'save', 'improve', 'increase'];
        const hasPitchIndicators = pitchIndicators.some(indicator => lowerInput.includes(indicator));
        
        // Check for meeting request indicators
        const meetingIndicators = ['meeting', 'call', 'discuss', 'chat', 'available', 'time', 'schedule'];
        const hasMeetingIndicators = meetingIndicators.some(indicator => lowerInput.includes(indicator));
        
        // Determine the most likely type
        if (hasOpenerIndicators) {
            return { type: 'opener', confidence: 0.8 };
        } else if (hasObjectionIndicators) {
            return { type: 'objection_response', confidence: 0.7 };
        } else if (hasPitchIndicators) {
            return { type: 'pitch', confidence: 0.7 };
        } else if (hasMeetingIndicators) {
            return { type: 'meeting_request', confidence: 0.6 };
        } else {
            return { type: 'general', confidence: 0.5 };
        }
    }
    
    // CRITICAL FIX: Better warmup response detection
    isCorrectWarmupResponse(input) {
        const lowerInput = input.toLowerCase();
        
        // Basic indicators of a reasonable response
        const responseIndicators = [
            'hi', 'hello', 'my name', 'calling', 'understand', 'appreciate',
            'meeting', 'discuss', 'help', 'solution', 'benefit', 'value'
        ];
        
        return responseIndicators.some(indicator => lowerInput.includes(indicator)) && input.length > 10;
    }
    
    buildGPTPrompt(userInput) {
        const currentCharacter = this.app.characterManager.getCurrentCharacter();
        const currentModule = this.app.getCurrentModule();
        const context = this.getConversationContext();
        
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
        
        // Add evaluation instruction for marathon/legend modes or opener practice
        if (this.app.getCurrentMode() === 'marathon' || this.app.getCurrentMode() === 'legend' || 
           (currentModule === 'opener' && this.app.getCurrentMode() === 'practice')) {
            messages[0].content += '\n\nIMPORTANT: After your response, evaluate the user\'s input and provide feedback in this format: "FEEDBACK: [SUCCESS/RETRY] - [brief explanation]"';
        }
        
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
    
    // CRITICAL FIX: Context for opener stages
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
    
    // CRITICAL FIX: Opener-specific fallback responses
    generateOpenerFallbackResponse(conversationState) {
        if (!conversationState) conversationState = { stage: 'opener' };
        
        switch (conversationState.stage) {
            case 'opener':
                const objections = [
                    "What's this about? FEEDBACK: SUCCESS - Now handle this objection with empathy.",
                    "I'm not interested. FEEDBACK: SUCCESS - Good opener, now address this objection.",
                    "We don't take cold calls. FEEDBACK: SUCCESS - Handle this common objection.",
                    "Now is not a good time. FEEDBACK: SUCCESS - Address their timing concern."
                ];
                return objections[Math.floor(Math.random() * objections.length)];
                
            case 'objection':
                return "Good response! Now give me your pitch. FEEDBACK: SUCCESS - Nice objection handling.";
                
            case 'pitch':
                return "Interesting. What exactly are you proposing? FEEDBACK: SUCCESS - Good pitch delivery.";
                
            case 'meeting':
                return "Let me check my calendar. Good work! FEEDBACK: SUCCESS - Complete flow executed well.";
                
            default:
                return "Hello, who is this? FEEDBACK: SUCCESS - Start with your opener.";
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
    
    cleanup() {
        this.stopListening();
        this.stopCurrentSpeech();
        this.clearResponseTimeout();
        this.continuousListening = false;
        this.clearSessionData();
        
        console.log('🧹 Speech Manager cleanup complete');
    }
}