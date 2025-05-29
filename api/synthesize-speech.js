// api/synthesize-speech.js - Vercel serverless function for Amazon Polly
import AWS from 'aws-sdk';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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
            message: 'Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to environment variables'
        });
        return;
    }
    
    try {
        const { text, voice = 'Joanna', format = 'mp3', textType = 'text' } = req.body;
        
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
                message: 'Text must be less than 3000 characters'
            });
            return;
        }
        
        console.log('Polly Request:', { 
            textLength: text.length, 
            voice, 
            format,
            textPreview: text.substring(0, 50) + '...'
        });
        
        // Configure AWS Polly
        const polly = new AWS.Polly({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            apiVersion: '2016-06-10'
        });
        
        // Valid Polly voices for validation
        const validVoices = [
            'Joanna', 'Kimberly', 'Matthew', 'Amy', 'Russell', 
            'Nicole', 'Justin', 'Joey', 'Ivy', 'Kendra',
            'Brian', 'Emma', 'Raveena', 'Aditi', 'Aria'
        ];
        
        if (!validVoices.includes(voice)) {
            res.status(400).json({
                error: 'Invalid voice',
                message: `Voice must be one of: ${validVoices.join(', ')}`
            });
            return;
        }
        
        // Prepare Polly parameters
        const pollyParams = {
            Text: text,
            OutputFormat: format,
            VoiceId: voice,
            Engine: 'standard', // Using standard voices as requested
            TextType: textType
        };
        
        // Call Amazon Polly
        const result = await polly.synthesizeSpeech(pollyParams).promise();
        
        if (!result.AudioStream) {
            console.error('No audio stream returned from Polly');
            res.status(500).json({
                error: 'Polly synthesis failed',
                message: 'No audio stream returned from Amazon Polly'
            });
            return;
        }
        
        console.log('Polly Response:', {
            audioStreamSize: result.AudioStream.length,
            contentType: result.ContentType,
            requestCharacters: result.RequestCharacters
        });
        
        // Set appropriate headers for audio response
        res.setHeader('Content-Type', result.ContentType || 'audio/mpeg');
        res.setHeader('Content-Length', result.AudioStream.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Return the audio stream
        res.status(200).send(result.AudioStream);
        
    } catch (error) {
        console.error('Polly API Error:', error);
        
        // Handle specific AWS errors
        if (error.code === 'InvalidParameterValueException') {
            res.status(400).json({
                error: 'Invalid parameter',
                message: error.message,
                code: error.code
            });
        } else if (error.code === 'TextLengthExceededException') {
            res.status(400).json({
                error: 'Text too long',
                message: 'Text exceeds maximum length allowed by Polly',
                code: error.code
            });
        } else if (error.code === 'UnauthorizedOperation' || error.code === 'AccessDenied') {
            res.status(403).json({
                error: 'AWS authentication failed',
                message: 'Check your AWS credentials and permissions',
                code: error.code
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: error.message,
                type: error.name,
                code: error.code
            });
        }
    }
}