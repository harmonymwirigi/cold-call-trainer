const express = require('express');
const cors = require('cors');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: {
            openai: !!process.env.OPENAI_API_KEY,
            aws: !!process.env.AWS_ACCESS_KEY_ID,
            region: process.env.AWS_REGION || 'us-east-1'
        }
    });
});

// OpenAI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('📨 Chat request received');
        
        // Check if API key exists
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️  OpenAI API key not configured');
            return res.status(500).json({ 
                error: 'OpenAI API key not configured',
                message: 'Add OPENAI_API_KEY to your .env file or environment variables' 
            });
        }

        const { messages, model = 'gpt-3.5-turbo', max_tokens = 150, temperature = 0.7 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Messages array is required'
            });
        }

        console.log(`🤖 Calling OpenAI with ${messages.length} messages`);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature,
                top_p: 1,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'OpenAI API Error',
                message: errorText,
                status: response.status
            });
        }

        const data = await response.json();
        console.log('✅ OpenAI response received');
        
        res.json(data);
        
    } catch (error) {
        console.error('💥 Chat API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Amazon Polly Endpoint - FIXED VERSION
app.post('/api/synthesize-speech', async (req, res) => {
    try {
        console.log('🎤 Speech synthesis request received');
        
        // Check AWS credentials
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn('⚠️  AWS credentials not configured');
            console.log('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('AWS')));
            return res.status(500).json({
                error: 'AWS credentials not configured',
                message: 'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env file'
            });
        }

        const { text, voice = 'Joanna', format = 'mp3', textType = 'text' } = req.body;

        // Validate request body
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Text parameter is required and must be a non-empty string'
            });
        }

        // Validate text length (Polly has limits)
        if (text.length > 3000) {
            return res.status(400).json({
                error: 'Text too long',
                message: 'Text must be less than 3000 characters'
            });
        }

        console.log(`🗣️  Synthesizing speech: "${text.substring(0, 50)}..." with voice: ${voice}`);

        // Configure AWS Polly with explicit credentials
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
            return res.status(400).json({
                error: 'Invalid voice',
                message: `Voice must be one of: ${validVoices.join(', ')}`
            });
        }

        // Prepare Polly parameters
        const pollyParams = {
            Text: text,
            OutputFormat: format,
            VoiceId: voice,
            Engine: 'standard',
            TextType: textType
        };

        console.log('📋 Polly params:', { 
            textLength: text.length, 
            voice, 
            format, 
            engine: 'standard',
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Call Amazon Polly
        const result = await polly.synthesizeSpeech(pollyParams).promise();

        if (!result.AudioStream) {
            console.error('❌ No audio stream returned from Polly');
            return res.status(500).json({
                error: 'Polly synthesis failed',
                message: 'No audio stream returned from Amazon Polly'
            });
        }

        console.log('✅ Speech synthesis completed:', {
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
        console.error('💥 Polly API Error:', error);
        console.error('💥 Error details:', {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            region: error.region
        });
        
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
        } else if (error.code === 'CredentialsError') {
            res.status(403).json({
                error: 'AWS credentials error',
                message: 'Invalid AWS credentials or region',
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
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Cold Call Trainer running at http://localhost:${PORT}`);
    console.log('📁 Make sure your .env file has the required API keys');
    console.log('🔑 Required environment variables:');
    console.log('   - OPENAI_API_KEY');
    console.log('   - AWS_ACCESS_KEY_ID');  
    console.log('   - AWS_SECRET_ACCESS_KEY');
    console.log('   - AWS_REGION (optional, defaults to us-east-1)');
    console.log('');
    console.log('✅ API Status:');
    console.log(`   OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   AWS: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Configured' : '❌ Missing'}`);
    console.log('');
    console.log('🌐 Test endpoints:');
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   App: http://localhost:${PORT}`);
});