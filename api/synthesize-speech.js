// api/synthesize-speech.js - Fixed Amazon Polly integration
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        res.status(500).json({
            error: 'AWS credentials not configured',
            message: 'AWS Polly not available - please use browser speech synthesis fallback',
            fallback: true
        });
        return;
    }
    
    try {
        // Dynamic import for AWS SDK (better for serverless)
        const AWS = await import('aws-sdk');
        
        const { text, voice = 'Joanna', format = 'mp3' } = req.body;
        
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            res.status(400).json({
                error: 'Invalid request',
                message: 'Text parameter is required'
            });
            return;
        }
        
        if (text.length > 3000) {
            res.status(400).json({
                error: 'Text too long',
                message: 'Text must be less than 3000 characters'
            });
            return;
        }
        
        // Configure AWS Polly
        const polly = new AWS.default.Polly({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            apiVersion: '2016-06-10'
        });
        
        // Valid voices
        const validVoices = [
            'Joanna', 'Matthew', 'Kimberly', 'Joey', 'Emma', 'Brian', 'Amy',
            'Nicole', 'Russell', 'Olivia', 'Marlene', 'Hans', 'Vicki',
            'Celine', 'Mathieu', 'Lea', 'Chantal'
        ];
        
        const selectedVoice = validVoices.includes(voice) ? voice : 'Joanna';
        
        const pollyParams = {
            Text: text,
            OutputFormat: format,
            VoiceId: selectedVoice,
            Engine: 'standard', // Use standard for better compatibility
            TextType: 'text'
        };
        
        console.log('Polly request:', {
            voice: selectedVoice,
            textLength: text.length,
            format
        });
        
        const result = await polly.synthesizeSpeech(pollyParams).promise();
        
        if (!result.AudioStream) {
            throw new Error('No audio stream returned from Polly');
        }
        
        // Set headers and return audio
        res.setHeader('Content-Type', result.ContentType || 'audio/mpeg');
        res.setHeader('Content-Length', result.AudioStream.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.status(200).send(result.AudioStream);
        
    } catch (error) {
        console.error('Polly API Error:', error);
        
        let statusCode = 500;
        let message = 'Speech synthesis failed';
        
        if (error.code === 'InvalidParameterValueException') {
            statusCode = 400;
            message = 'Invalid voice or text parameter';
        } else if (error.code === 'UnauthorizedOperation' || error.code === 'AccessDenied') {
            statusCode = 403;
            message = 'AWS authentication failed';
        } else if (error.code === 'Throttling' || error.code === 'ThrottlingException') {
            statusCode = 429;
            message = 'Rate limit exceeded. Please try again in a moment';
        }
        
        res.status(statusCode).json({
            error: 'Speech synthesis error',
            message,
            fallback: true
        });
    }
}