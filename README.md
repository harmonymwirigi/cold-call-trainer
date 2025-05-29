# Cold Call Roleplay Trainer - Deployment Guide

## 🚀 Quick Deploy to Vercel from GitHub

### Step 1: Create GitHub Repository Structure
```
your-repo/
├── index.html                    # Your main app (from first artifact)
├── api/
│   ├── chat.js                   # OpenAI endpoint (artifact 2)
│   └── synthesize-speech.js      # Polly endpoint (artifact 3)  
├── package.json                  # Dependencies (artifact 4)
├── vercel.json                   # Config (artifact 5)
└── README.md                     # This file
```

### Step 2: Get Your API Keys

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account → API Keys → Create new key
3. Copy your key: `sk-...`

**AWS Credentials (for Polly):**
1. Go to [AWS Console](https://console.aws.amazon.com)
2. IAM → Users → Create User → Attach AmazonPollyFullAccess policy
3. Security Credentials → Create Access Key
4. Copy: Access Key ID and Secret Access Key

### Step 3: Deploy to Vercel

1. **Connect GitHub:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "Import Git Repository"
   - Select your repo

2. **Add Environment Variables:**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   OPENAI_API_KEY = sk-your-openai-key-here
   AWS_ACCESS_KEY_ID = your-aws-access-key
   AWS_SECRET_ACCESS_KEY = your-aws-secret-key
   AWS_REGION = us-east-1
   ```

3. **Deploy:**
   - Click Deploy
   - Your app will be live at: `https://your-app.vercel.app`

### Step 4: Test Your Deployment
- Visit your Vercel URL
- Try each roleplay scenario
- Check browser console for any errors
- Monitor Vercel Function logs in dashboard

## 🔧 Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Clone your repo
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Install dependencies  
npm install

# Create .env.local file
echo "OPENAI_API_KEY=sk-your-key" > .env.local
echo "AWS_ACCESS_KEY_ID=your-key" >> .env.local
echo "AWS_SECRET_ACCESS_KEY=your-secret" >> .env.local
echo "AWS_REGION=us-east-1" >> .env.local

# Start development server
vercel dev
```

## 💰 Cost Estimates

**Vercel:**
- Hobby Plan: Free for personal use
- Pro Plan: $20/month for commercial use

**OpenAI API:**
- GPT-3.5-turbo: ~$0.002 per conversation
- Typical session (10 exchanges): ~$0.02
- 1000 sessions/month: ~$20

**Amazon Polly:**
- Standard voices: $4.00 per 1M characters
- Average response: ~100 characters = $0.0004
- 1000 sessions/month: ~$4

**Total: ~$24-44/month for 1000 training sessions**

## 🐛 Troubleshooting

**Common Issues:**

1. **"OpenAI API key not configured"**
   - Check environment variables in Vercel dashboard
   - Redeploy after adding variables

2. **"AWS credentials not configured"**  
   - Verify AWS keys have Polly permissions
   - Check region is set to us-east-1

3. **CORS errors**
   - Both API functions include CORS headers
   - Check browser console for specific errors

4. **Function timeout**
   - Vercel free tier: 10s timeout
   - Upgrade to Pro for 60s timeout if needed

**Debug Steps:**
1. Check Vercel Function logs in dashboard
2. Test API endpoints directly: `https://yourapp.vercel.app/api/chat`
3. Verify environment variables are set correctly

## 🎯 Customization

**Modify AI Personalities:**
- Edit `GPT_PROMPTS` object in `index.html`
- Adjust system prompts for different character behaviors

**Add New Voices:**
- Update `POLLY_CONFIG.voices` in `index.html`
- Ensure voice names are valid Polly Standard voices

**Change Evaluation Criteria:**
- Modify system prompts in opener/pitch scenarios
- Adjust feedback parsing logic

## 📊 Monitoring

**Track Usage:**
- Vercel dashboard shows function invocations
- OpenAI dashboard shows API usage
- AWS CloudWatch shows Polly requests

**Performance:**
- Monitor function execution time
- Check for errors in Vercel logs
- Monitor API response times

## 🔒 Security Notes

- ✅ API keys stored securely in environment variables
- ✅ No API keys exposed in frontend code
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ Error handling prevents information leakage

Your app is now production-ready! 🎉