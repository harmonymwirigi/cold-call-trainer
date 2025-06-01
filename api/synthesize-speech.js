// api/synthesize-speech.js - Enhanced Amazon Polly integration for Cold Call Trainer
import AWS from 'aws-sdk';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        res.status(500).json({
            error: 'AWS credentials not configured',
            message: 'Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to environment variables',
            fallback: true
        });
        return;
    }
    
    try {
        const { 
            text, 
            voice = 'Joanna', 
            format = 'mp3', 
            textType = 'text',
            speed = 'medium',
            emotion = 'neutral'
        } = req.body;
        
        // Validate request body  
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            res.status(400).json({
                error: 'Invalid request',
                message: 'Text parameter is required and must be a non-empty string'
            });
            return;
        }
        
        // Validate text length (Polly has limits)
        if (text.length > 3000) {
            res.status(400).json({
                error: 'Text too long',
                message: 'Text must be less than 3000 characters for optimal performance'
            });
            return;
        }
        
        // Enhanced voice mapping for different markets and characters
        const voiceMap = {
            // US Voices
            'Joanna': { voiceId: 'Joanna', engine: 'neural', language: 'en-US' },
            'Matthew': { voiceId: 'Matthew', engine: 'neural', language: 'en-US' },
            'Kimberly': { voiceId: 'Kimberly', engine: 'neural', language: 'en-US' },
            'Joey': { voiceId: 'Joey', engine: 'neural', language: 'en-US' },
            
            // UK Voices
            'Emma': { voiceId: 'Emma', engine: 'neural', language: 'en-GB' },
            'Brian': { voiceId: 'Brian', engine: 'neural', language: 'en-GB' },
            'Amy': { voiceId: 'Amy', engine: 'standard', language: 'en-GB' },
            
            // Australian Voices
            'Nicole': { voiceId: 'Nicole', engine: 'neural', language: 'en-AU' },
            'Russell': { voiceId: 'Russell', engine: 'neural', language: 'en-AU' },
            'Olivia': { voiceId: 'Olivia', engine: 'neural', language: 'en-AU' },
            
            // German Voices
            'Marlene': { voiceId: 'Marlene', engine: 'neural', language: 'de-DE' },
            'Hans': { voiceId: 'Hans', engine: 'neural', language: 'de-DE' },
            'Vicki': { voiceId: 'Vicki', engine: 'standard', language: 'de-DE' },
            
            // French Voices
            'Celine': { voiceId: 'Celine', engine: 'neural', language: 'fr-FR' },
            'Mathieu': { voiceId: 'Mathieu', engine: 'neural', language: 'fr-FR' },
            'Lea': { voiceId: 'Lea', engine: 'neural', language: 'fr-FR' },
            
            // Canadian Voices
            'Chantal': { voiceId: 'Chantal', engine: 'standard', language: 'fr-CA' }
        };
        
        const selectedVoice = voiceMap[voice] || voiceMap['Joanna'];
        
        console.log('Polly Request:', { 
            textLength: text.length, 
            voice: selectedVoice.voiceId,
            engine: selectedVoice.engine,
            language: selectedVoice.language,
            format,
            textPreview: text.substring(0, 50) + '...',
            requestId: generateRequestId()
        });
        
        // Configure AWS Polly with enhanced settings
        const polly = new AWS.Polly({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            apiVersion: '2016-06-10',
            maxRetries: 3,
            retryDelayOptions: {
                base: 300
            }
        });
        
        // Prepare enhanced text with SSML for better speech quality
        let processedText = text;
        
        if (textType === 'text') {
            // Convert to SSML for better control
            processedText = enhanceTextWithSSML(text, speed, emotion, selectedVoice);
        }
        
        // Prepare Polly parameters
        const pollyParams = {
            Text: processedText,
            OutputFormat: format,
            VoiceId: selectedVoice.voiceId,
            Engine: selectedVoice.engine,
            TextType: processedText.includes('<speak>') ? 'ssml' : 'text',
            LanguageCode: selectedVoice.language
        };
        
        // Add neural engine specific settings
        if (selectedVoice.engine === 'neural') {
            // Neural voices support additional features
            pollyParams.SampleRate = '24000'; // Higher quality for neural voices
        }
        
        // Call Amazon Polly with timeout
        const startTime = Date.now();
        const result = await Promise.race([
            polly.synthesizeSpeech(pollyParams).promise(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Polly request timed out')), 15000)
            )
        ]);
        
        const processingTime = Date.now() - startTime;
        
        if (!result.AudioStream) {
            console.error('No audio stream returned from Polly');
            res.status(500).json({
                error: 'Polly synthesis failed',
                message: 'No audio stream returned from Amazon Polly',
                fallback: true
            });
            return;
        }
        
        console.log('Polly Response:', {
            audioStreamSize: result.AudioStream.length,
            contentType: result.ContentType,
            requestCharacters: result.RequestCharacters,
            processingTime: `${processingTime}ms`,
            voiceUsed: selectedVoice.voiceId,
            engine: selectedVoice.engine
        });
        
        // Set appropriate headers for audio response
        const contentType = result.ContentType || 'audio/mpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', result.AudioStream.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('X-Processing-Time', `${processingTime}ms`);
        res.setHeader('X-Voice-Used', selectedVoice.voiceId);
        res.setHeader('X-Engine-Used', selectedVoice.engine);
        
        // Return the audio stream
        res.status(200).send(result.AudioStream);
        
    } catch (error) {
        console.error('Polly API Error:', {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
        });
        
        // Handle specific AWS errors with user-friendly messages
        let userMessage = 'Speech synthesis error occurred.';
        let statusCode = 500;
        
        if (error.code === 'InvalidParameterValueException') {
            userMessage = 'Invalid voice or text parameter.';
            statusCode = 400;
        } else if (error.code === 'TextLengthExceededException') {
            userMessage = 'Text is too long for speech synthesis.';
            statusCode = 400;
        } else if (error.code === 'UnauthorizedOperation' || error.code === 'AccessDenied') {
            userMessage = 'AWS authentication failed. Please check credentials.';
            statusCode = 403;
        } else if (error.code === 'Throttling' || error.code === 'ThrottlingException') {
            userMessage = 'Rate limit exceeded. Please try again in a moment.';
            statusCode = 429;
        } else if (error.message.includes('timed out')) {
            userMessage = 'Speech synthesis timed out. Please try again.';
            statusCode = 408;
        } else if (error.code === 'NetworkingError' || error.message.includes('ENOTFOUND')) {
            userMessage = 'Network error connecting to speech service.';
            statusCode = 503;
        }
        
        res.status(statusCode).json({
            error: 'Speech synthesis error',
            message: userMessage,
            type: error.name,
            code: error.code,
            fallback: true,
            timestamp: new Date().toISOString()
        });
    }
}

// Enhanced SSML generation for better speech quality
function enhanceTextWithSSML(text, speed = 'medium', emotion = 'neutral', voice) {
    // Clean up text first
    let cleanText = text
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/([.!?])\s*([A-Z])/g, '$1 <break time="500ms"/> $2'); // Add pauses after sentences
    
    // Add natural pauses for common punctuation
    cleanText = cleanText
        .replace(/,\s*/g, ', <break time="200ms"/>')
        .replace(/;\s*/g, '; <break time="300ms"/>')
        .replace(/:\s*/g, ': <break time="300ms"/>');
    
    // Handle speed variations
    const speedMap = {
        'slow': 'slow',
        'medium': 'medium', 
        'fast': 'fast',
        'x-fast': 'x-fast'
    };
    
    const prosodySpeed = speedMap[speed] || 'medium';
    
    // Add emotional inflection based on content
    if (emotion === 'professional' || voice.language.includes('en-US')) {
        // Business-appropriate tone
        cleanText = `<prosody rate="${prosodySpeed}" pitch="+0%">${cleanText}</prosody>`;
    } else if (emotion === 'friendly') {
        // Warmer, more approachable tone
        cleanText = `<prosody rate="${prosodySpeed}" pitch="+5%" volume="+2dB">${cleanText}</prosody>`;
    } else if (emotion === 'urgent') {
        // Time-pressure scenarios
        cleanText = `<prosody rate="fast" pitch="+10%" volume="+3dB">${cleanText}</prosody>`;
    } else {
        // Neutral tone
        cleanText = `<prosody rate="${prosodySpeed}">${cleanText}</prosody>`;
    }
    
    // Handle different languages and accents
    if (voice.language === 'en-GB') {
        // British pronunciation adjustments
        cleanText = cleanText.replace(/schedule/gi, '<phoneme alphabet="ipa" ph="ˈʃɛdjuːl">schedule</phoneme>');
    } else if (voice.language === 'en-AU') {
        // Australian pronunciation adjustments
        cleanText = cleanText.replace(/\bmate\b/gi, '<emphasis level="moderate">mate</emphasis>');
    }
    
    // Add emphasis to important business terms
    const businessTerms = [
        'ROI', 'return on investment', 'cost savings', 'efficiency', 'productivity',
        'meeting', 'appointment', 'demonstration', 'proposal', 'budget',
        'decision maker', 'stakeholder', 'timeline', 'deadline', 'priority'
    ];
    
    businessTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        cleanText = cleanText.replace(regex, `<emphasis level="moderate">${term}</emphasis>`);
    });
    
    // Handle numbers and currency for better pronunciation
    cleanText = cleanText
        .replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '<say-as interpret-as="currency" currency="USD">$1</say-as>')
        .replace(/\b(\d{1,3}(?:,\d{3})*)\b/g, '<say-as interpret-as="number">$1</say-as>')
        .replace(/\b(\d{4})\b/g, '<say-as interpret-as="date" format="y">$1</say-as>'); // Years
    
    // Handle phone numbers
    cleanText = cleanText.replace(/\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g, 
        '<say-as interpret-as="telephone">$1</say-as>');
    
    // Handle email addresses
    cleanText = cleanText.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, 
        '<say-as interpret-as="spell-out">        // Set appropriate headers</say-as>');
    
    // Handle URLs
    cleanText = cleanText.replace(/https?:\/\/[\w.-]+/g, 
        '<say-as interpret-as="spell-out">        // Set appropriate headers</say-as>');
    
    // Wrap in SSML speak tags
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.language}">
        ${cleanText}
    </speak>`;
}

// Helper function to generate unique request IDs
function generateRequestId() {
    return `polly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced error handling for different AWS regions
function handleRegionalFallback(originalError, pollyParams) {
    const fallbackRegions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    const currentRegion = process.env.AWS_REGION || 'us-east-1';
    
    console.log(`Attempting regional fallback from ${currentRegion}`);
    
    // This would be implemented as a retry mechanism in production
    // For now, we'll just log the attempt
    return Promise.reject(originalError);
}

// Voice quality optimization based on use case
function optimizeVoiceForScenario(voice, scenario) {
    const optimizations = {
        warmup: { speed: 'medium', emotion: 'friendly' },
        opener: { speed: 'medium', emotion: 'professional' },
        pitch: { speed: 'medium', emotion: 'professional' },
        fullcall: { speed: 'medium', emotion: 'neutral' },
        powerhour: { speed: 'fast', emotion: 'urgent' }
    };
    
    return optimizations[scenario] || optimizations.fullcall;
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
        responseLimit: '50mb', // Allow larger audio responses
    },
};