// api/chat.js - Fixed OpenAI GPT integration with better error handling
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
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not configured');
        res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'OpenAI not available - using fallback responses',
            fallback: true
        });
        return;
    }
    
    try {
        const { messages, model = 'gpt-3.5-turbo', max_tokens = 150, temperature = 0.7 } = req.body;
        
        // Validate request body
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({ 
                error: 'Invalid request', 
                message: 'Messages array is required',
                fallback: true
            });
            return;
        }
        
        // Validate messages
        for (const message of messages) {
            if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
                res.status(400).json({
                    error: 'Invalid message format',
                    message: 'Each message must have a valid role',
                    fallback: true
                });
                return;
            }
            
            if (!message.content || typeof message.content !== 'string') {
                res.status(400).json({
                    error: 'Invalid message format',
                    message: 'Each message must have string content',
                    fallback: true
                });
                return;
            }
        }
        
        console.log('📡 OpenAI Request:', { 
            model, 
            messageCount: messages.length,
            userInput: messages[messages.length - 1]?.content?.substring(0, 50) + '...'
        });
        
        // Call OpenAI API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: Math.min(max_tokens, 200),
                temperature: Math.max(0, Math.min(temperature, 1)),
                top_p: 1,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API Error:', response.status, errorText);
            
            let errorMessage = 'OpenAI API request failed';
            
            if (response.status === 401) {
                errorMessage = 'Invalid OpenAI API key';
            } else if (response.status === 429) {
                errorMessage = 'OpenAI API rate limit exceeded';
            } else if (response.status === 503) {
                errorMessage = 'OpenAI API service unavailable';
            }
            
            res.status(500).json({
                error: 'OpenAI API Error',
                message: errorMessage,
                fallback: true
            });
            return;
        }
        
        const data = await response.json();
        
        // Validate response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Invalid OpenAI response:', data);
            res.status(500).json({
                error: 'Invalid OpenAI response',
                message: 'Unexpected response format from OpenAI',
                fallback: true
            });
            return;
        }
        
        console.log('✅ OpenAI Response:', {
            usage: data.usage,
            responseLength: data.choices[0].message.content.length
        });
        
        res.status(200).json(data);
        
    } catch (error) {
        console.error('❌ Chat API Error:', error);
        
        let message = 'Internal server error';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            message = 'Request timed out - using fallback response';
            statusCode = 408;
        } else if (error.message && error.message.includes('fetch')) {
            message = 'Network error connecting to OpenAI - using fallback';
            statusCode = 503;
        } else if (error.code === 'ENOTFOUND') {
            message = 'DNS resolution failed - using fallback';
            statusCode = 503;
        }
        
        res.status(statusCode).json({
            error: 'Chat API Error',
            message,
            fallback: true
        });
    }
}