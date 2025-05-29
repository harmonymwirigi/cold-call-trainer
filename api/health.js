// api/health.js - Health check endpoint for Vercel
export default function handler(req, res) {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        env: {
            openai: !!process.env.OPENAI_API_KEY,
            aws: !!process.env.AWS_ACCESS_KEY_ID,
            region: process.env.AWS_REGION || 'us-east-1'
        }
    });
}