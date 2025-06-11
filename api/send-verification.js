// api/send-verification.js - Send email verification using Resend
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  // Check required environment variables
  if (!process.env.RESEND_API_KEY) {
    res.status(500).json({ 
      error: 'Email service not configured',
      message: 'RESEND_API_KEY not found' 
    });
    return;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ 
      error: 'Database not configured',
      message: 'Supabase credentials missing' 
    });
    return;
  }

  try {
    const { 
      email, 
      firstName, 
      prospectJobTitle, 
      prospectIndustry, 
      targetMarket, 
      customBehavior,
      // Analytics data
      userAgent,
      timezone,
      language,
      screenResolution,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      sessionId,
      fingerprintId,
      timeToRegister
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !prospectJobTitle || !targetMarket) {
      res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email, firstName, prospectJobTitle, and targetMarket are required' 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address' 
      });
      return;
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check for existing unverified verification
    const { data: existingVerification } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .single();

    // Clean up any existing unverified verification for this email
    if (existingVerification) {
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email)
        .eq('verified', false);
    }

    // Store verification code in Supabase
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .insert([
        {
          email,
          first_name: firstName,
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified: false
        }
      ])
      .select()
      .single();

    if (verificationError) {
      console.error('Database error:', verificationError);
      res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to store verification code' 
      });
      return;
    }

    // Capture lead data immediately (before verification)
    const leadData = {
      email,
      first_name: firstName,
      prospect_job_title: prospectJobTitle,
      prospect_industry: prospectIndustry,
      target_market: targetMarket,
      custom_behavior: customBehavior,
      source: 'cold-call-trainer',
      
      // Analytics
      user_agent: userAgent,
      timezone,
      language,
      screen_resolution: screenResolution,
      referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      session_id: sessionId,
      fingerprint_id: fingerprintId,
      time_to_register: timeToRegister,
      
      email_verified: false
    };

    const { error: leadError } = await supabase
      .from('leads')
      .insert([leadData]);

    if (leadError) {
      console.error('Lead capture error:', leadError);
      // Don't fail the request for lead capture errors
    }

    // Send verification email using Resend
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Cold Call Trainer</title>
        </head>
        <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Cold Call Trainer</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered English Cold Calling Coach</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}! 👋</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">You're one step away from mastering your cold calling skills in English. Please verify your email address to get started.</p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 15px 0;">${verificationCode}</div>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #999;">This code expires in 10 minutes</p>
            </div>
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="color: #0366d6; margin-top: 0;">🚀 What's Next?</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Practice with AI roleplay partners</li>
              <li style="margin-bottom: 8px;">Master objection handling techniques</li>
              <li style="margin-bottom: 8px;">Perfect your English pronunciation</li>
              <li style="margin-bottom: 8px;">Track your progress across modules</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>Didn't request this email? You can safely ignore it.</p>
            <p style="margin-top: 15px;">
              <strong>Cold Call Trainer</strong><br>
              Helping sales professionals master English cold calling
            </p>
          </div>
        </body>
      </html>
    `;

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Cold Call Trainer <noreply@hpique.nl>', // Use your verified domain
      to: [email],
      subject: `${verificationCode} - Verify your email for Cold Call Trainer`,
      html: emailHtml,
      text: `Welcome to Cold Call Trainer, ${firstName}! Your verification code is: ${verificationCode}. This code expires in 10 minutes.`
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      // Clean up the verification record if email fails
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);
        
      res.status(500).json({ 
        error: 'Email delivery failed',
        message: 'Could not send verification email. Please try again.' 
      });
      return;
    }

    console.log('Verification email sent:', {
      email,
      firstName,
      verificationId: verification.id,
      emailId: emailResult?.id,
      expiresAt: expiresAt.toISOString()
    });

    res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully',
      expiresAt: expiresAt.toISOString(),
      // Don't send the actual code in response for security
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to send verification email. Please try again.' 
    });
  }
}