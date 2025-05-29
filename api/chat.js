// api/chat.js - Vercel serverless function for OpenAI GPT-3.5
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
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'Please add OPENAI_API_KEY to your environment variables'
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
        
        console.log('OpenAI Request:', { 
            model, 
            messageCount: messages.length,
            firstMessage: messages[0]?.content?.substring(0, 100) + '...' 
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
                max_tokens,
                temperature,
                top_p: 1,
                frequency_penalty: 0.3,
                presence_penalty: 0.3,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenAI API Error:', response.status, errorData);
            
            res.status(response.status).json({
                error: 'OpenAI API Error',
                message: `HTTP ${response.status}: ${errorData}`,
                status: response.status
            });
            return;
        }
        
        const data = await response.json();
        
        // Validate OpenAI response
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid OpenAI response:', data);
            res.status(500).json({
                error: 'Invalid OpenAI response',
                message: 'Unexpected response format from OpenAI'
            });
            return;
        }
        
        console.log('OpenAI Response:', {
            usage: data.usage,
            responseLength: data.choices[0].message.content.length
        });
        
        // Return the response
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Chat API Error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            type: error.name
        });
    }
}