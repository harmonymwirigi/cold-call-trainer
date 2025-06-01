// api/chat.js - Enhanced OpenAI GPT integration for Cold Call Trainer
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
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ 
            error: 'OpenAI API key not configured',
            message: 'Please add OPENAI_API_KEY to your environment variables',
            fallback: true
        });
        return;
    }
    
    try {
        const { 
            messages, 
            model = 'gpt-3.5-turbo', 
            max_tokens = 150, 
            temperature = 0.7,
            top_p = 1,
            frequency_penalty = 0.3,
            presence_penalty = 0.3,
            stream = false
        } = req.body;
        
        // Validate request body
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({ 
                error: 'Invalid request', 
                message: 'Messages array is required and cannot be empty' 
            });
            return;
        }
        
        // Validate messages format
        const validRoles = ['system', 'user', 'assistant'];
        for (const message of messages) {
            if (!message.role || !validRoles.includes(message.role)) {
                res.status(400).json({
                    error: 'Invalid message format',
                    message: 'Each message must have a valid role (system, user, or assistant)'
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
        
        // Log request details (sanitized)
        console.log('OpenAI Request:', { 
            model, 
            messageCount: messages.length,
            systemPrompt: messages[0]?.role === 'system' ? messages[0].content.substring(0, 100) + '...' : 'None',
            userInput: messages[messages.length - 1]?.content?.substring(0, 100) + '...',
            requestId: generateRequestId()
        });
        
        // Prepare request to OpenAI
        const openAIRequest = {
            model,
            messages,
            max_tokens: Math.min(max_tokens, 300), // Cap at 300 tokens
            temperature: Math.max(0, Math.min(temperature, 1)), // Ensure valid range
            top_p: Math.max(0, Math.min(top_p, 1)),
            frequency_penalty: Math.max(-2, Math.min(frequency_penalty, 2)),
            presence_penalty: Math.max(-2, Math.min(presence_penalty, 2)),
            stream,
            user: `cold-call-trainer-${Date.now()}` // Add user identifier for OpenAI tracking
        };
        
        // Add model-specific optimizations
        if (model.includes('gpt-3.5')) {
            openAIRequest.max_tokens = Math.min(openAIRequest.max_tokens, 150);
        }
        
        // Call OpenAI API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ColdCallTrainer/1.0'
            },
            body: JSON.stringify(openAIRequest),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle different response status codes
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: { message: errorText } };
            }
            
            console.error('OpenAI API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            // Map OpenAI errors to user-friendly messages
            let userMessage = 'AI processing error occurred.';
            
            switch (response.status) {
                case 400:
                    userMessage = 'Invalid request format.';
                    break;
                case 401:
                    userMessage = 'API authentication failed.';
                    break;
                case 429:
                    userMessage = 'Rate limit exceeded. Please try again in a moment.';
                    break;
                case 500:
                case 502:
                case 503:
                    userMessage = 'OpenAI service temporarily unavailable.';
                    break;
            }
            
            res.status(response.status).json({
                error: 'OpenAI API Error',
                message: userMessage,
                details: errorData?.error?.message || 'Unknown error',
                status: response.status,
                fallback: response.status >= 500 // Suggest fallback for server errors
            });
            return;
        }
        
        const data = await response.json();
        
        // Validate OpenAI response structure
        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
            console.error('Invalid OpenAI response structure:', data);
            res.status(500).json({
                error: 'Invalid OpenAI response',
                message: 'Unexpected response format from OpenAI API',
                fallback: true
            });
            return;
        }
        
        const choice = data.choices[0];
        if (!choice.message || !choice.message.content) {
            console.error('Missing message content in OpenAI response:', choice);
            res.status(500).json({
                error: 'Invalid OpenAI response',
                message: 'No message content in response',
                fallback: true
            });
            return;
        }
        
        // Log successful response (sanitized)
        console.log('OpenAI Response:', {
            usage: data.usage,
            responseLength: choice.message.content.length,
            finishReason: choice.finish_reason,
            hasSystemFingerprint: !!data.system_fingerprint
        });
        
        // Post-process the response
        const processedResponse = {
            ...data,
            choices: data.choices.map(choice => ({
                ...choice,
                message: {
                    ...choice.message,
                    content: choice.message.content.trim() // Remove leading/trailing whitespace
                }
            })),
            // Add metadata
            processed_at: new Date().toISOString(),
            processing_time: Date.now() - req.startTime
        };
        
        // Return the processed response
        res.status(200).json(processedResponse);
        
    } catch (error) {
        console.error('Chat API Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Handle specific error types
        let userMessage = 'Internal server error occurred.';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            userMessage = 'Request timed out. Please try again.';
            statusCode = 408;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = 'Network error connecting to AI service.';
            statusCode = 503;
        }
        
        res.status(statusCode).json({
            error: 'Internal server error',
            message: userMessage,
            type: error.name,
            fallback: true,
            timestamp: new Date().toISOString()
        });
    }
}

// Helper function to generate unique request IDs
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware to add request start time
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};