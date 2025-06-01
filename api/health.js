// api/health.js - Simplified health check for Vercel
export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            platform: 'vercel',
            env: {
                openai: !!process.env.OPENAI_API_KEY,
                aws: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
                region: process.env.AWS_REGION || 'us-east-1'
            },
            features: {
                speechRecognition: true,
                textToSpeech: !!process.env.AWS_ACCESS_KEY_ID,
                aiConversation: !!process.env.OPENAI_API_KEY,
                moduleGating: true,
                legendMode: true,
                practiceTimeUnlock: true,
                phoneInterface: true,
                multipleCharacters: true,
                marketSelection: true
            },
            version: '2.0.0'
        };
        
        res.status(200).json(health);
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(200).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            platform: 'vercel',
            env: { openai: false, aws: false },
            error: 'Health check failed'
        });
    }
}