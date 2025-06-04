// api/resend-verification.js - Resend verification code
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
  if (!process.env.RESEND_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ 
      error: 'Service not configured',
      message: 'Email or database service not properly configured' 
    });
    return;
  }

  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email is required' 
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

    // Find existing verification record
    const { data: existingVerification } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .single();

    if (!existingVerification) {
      res.status(404).json({ 
        error: 'No verification found',
        message: 'No pending verification found for this email address' 
      });
      return;
    }

    // Check rate limiting (max 1 resend per minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const createdAt = new Date(existingVerification.created_at);
    
    if (createdAt > oneMinuteAgo) {
      const secondsLeft = Math.ceil((60 - (Date.now() - createdAt.getTime()) / 1000));
      res.status(429).json({ 
        error: 'Rate limited',
        message: `Please wait ${secondsLeft} seconds before requesting a new code`,
        retryAfter: secondsLeft
      });
      return;
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update verification record
    const { data: updatedVerification, error: updateError } = await supabase
      .from('email_verifications')
      .update({
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        attempts: 0, // Reset attempts
        created_at: new Date().toISOString() // Update timestamp for rate limiting
      })
      .eq('id', existingVerification.id)
      .select()
      .single();

    if (updateError) {
      console.error('Verification update error:', updateError);
      res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to generate new verification code' 
      });
      return;
    }

    // Send new verification email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Verification Code - Cold Call Trainer</title>
        </head>
        <body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Cold Call Trainer</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">New Verification Code</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">New Verification Code, ${existingVerification.first_name}! 🔄</h2>
            <p style="font-size: 16px; margin-bottom: 25px;">Here's your new verification code to complete your registration.</p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">Your new verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 15px 0;">${verificationCode}</div>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #999;">This code expires in 10 minutes</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Security Tip:</strong> Only enter this code on the Cold Call Trainer website. We'll never ask for this code via phone or other websites.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>Didn't request a new code? You can safely ignore this email.</p>
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
      subject: `${verificationCode} - New verification code for Cold Call Trainer`,
      html: emailHtml,
      text: `New verification code for Cold Call Trainer: ${verificationCode}. This code expires in 10 minutes.`
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      res.status(500).json({ 
        error: 'Email delivery failed',
        message: 'Could not send new verification email. Please try again.' 
      });
      return;
    }

    console.log('Verification code resent:', {
      email,
      firstName: existingVerification.first_name,
      verificationId: updatedVerification.id,
      emailId: emailResult?.id,
      expiresAt: expiresAt.toISOString()
    });

    res.status(200).json({ 
      success: true,
      message: 'New verification code sent successfully',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to resend verification code. Please try again.' 
    });
  }
}