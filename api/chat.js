// api/chat.js - Simplified OpenAI GPT integration
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
        res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'OpenAI not available - please use fallback responses',
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
                message: 'Messages array is required' 
            });
            return;
        }
        
        // Validate messages
        for (const message of messages) {
            if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
                res.status(400).json({
                    error: 'Invalid message format',
                    message: 'Each message must have a valid role'
                });
                return;
            }
            
            if (!message.content || typeof message.content !== 'string') {
                res.status(400).json({
                    error: 'Invalid message format',
                    message: 'Each message must have string content'
                });
                return;
            }
        }
        
        console.log('OpenAI Request:', { 
            model, 
            messageCount: messages.length,
            userInput: messages[messages.length - 1]?.content?.substring(0, 50) + '...'
        });
        
        // Call OpenAI API
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
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', response.status, errorText);
            
            res.status(response.status).json({
                error: 'OpenAI API Error',
                message: `Request failed with status ${response.status}`,
                fallback: true
            });
            return;
        }
        
        const data = await response.json();
        
        // Validate response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenAI response:', data);
            res.status(500).json({
                error: 'Invalid OpenAI response',
                message: 'Unexpected response format',
                fallback: true
            });
            return;
        }
        
        console.log('OpenAI Response:', {
            usage: data.usage,
            responseLength: data.choices[0].message.content.length
        });
        
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Chat API Error:', error);
        
        let message = 'Internal server error';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            message = 'Request timed out';
            statusCode = 408;
        } else if (error.message && error.message.includes('fetch')) {
            message = 'Network error connecting to OpenAI';
            statusCode = 503;
        }
        
        res.status(statusCode).json({
            error: 'Internal server error',
            message,
            fallback: true
        });
    }
}