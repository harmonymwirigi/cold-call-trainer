// api/verify-email.js - Verify email code and create user account
import { createClient } from '@supabase/supabase-js';

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
      verificationCode,
      // User data from original form
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
      utmCampaign
    } = req.body;

    // Validate required fields
    if (!email || !verificationCode) {
      res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email and verification code are required' 
      });
      return;
    }

    // Find verification record
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .single();

    if (verificationError || !verification) {
      res.status(400).json({ 
        error: 'Invalid verification code',
        message: 'The verification code is incorrect or has expired' 
      });
      return;
    }

    // Check if verification has expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    
    if (now > expiresAt) {
      // Clean up expired verification
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);
        
      res.status(400).json({ 
        error: 'Verification code expired',
        message: 'The verification code has expired. Please request a new one.' 
      });
      return;
    }

    // Check attempt limits (max 5 attempts)
    if (verification.attempts >= 5) {
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);
        
      res.status(429).json({ 
        error: 'Too many attempts',
        message: 'Maximum verification attempts exceeded. Please request a new code.' 
      });
      return;
    }

    // Determine access level
    const accessLevel = determineAccessLevel(email);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user;
    
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName || verification.first_name,
          prospect_job_title: prospectJobTitle,
          prospect_industry: prospectIndustry,
          target_market: targetMarket,
          custom_behavior: customBehavior,
          email_verified: true,
          last_login: now.toISOString(),
          access_level: accessLevel,
          
          // Update analytics if provided
          ...(userAgent && { user_agent: userAgent }),
          ...(timezone && { timezone }),
          ...(language && { language }),
          ...(screenResolution && { screen_resolution: screenResolution }),
          ...(referrer && { referrer }),
          ...(utmSource && { utm_source: utmSource }),
          ...(utmMedium && { utm_medium: utmMedium }),
          ...(utmCampaign && { utm_campaign: utmCampaign })
        })
        .select()
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        res.status(500).json({ 
          error: 'User update failed',
          message: 'Failed to update user information' 
        });
        return;
      }
      
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email,
          first_name: firstName || verification.first_name,
          prospect_job_title: prospectJobTitle,
          prospect_industry: prospectIndustry,
          target_market: targetMarket,
          custom_behavior: customBehavior,
          access_level: accessLevel,
          email_verified: true,
          last_login: now.toISOString(),
          
          // Analytics
          registration_source: 'cold-call-trainer',
          user_agent: userAgent,
          timezone,
          language,
          screen_resolution: screenResolution,
          referrer,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign
        }])
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        res.status(500).json({ 
          error: 'User creation failed',
          message: 'Failed to create user account' 
        });
        return;
      }
      
      user = newUser;

      // Initialize user progress and usage tracking
      await Promise.all([
        // Initialize usage tracking
        supabase.from('usage_tracking').insert([{
          user_id: user.id,
          session_time: 0,
          total_usage: 0,
          monthly_usage: 0,
          lifetime_usage: 0,
          daily_usage: {},
          weekly_usage: {},
          session_count: 1
        }]),
        
        // Initialize user progress
        supabase.from('user_progress').insert([{
          user_id: user.id,
          module_progress: {
            opener: { marathon: 0, practice: 0, legend: false, warmupScore: 0 },
            pitch: { marathon: 0, practice: 0, legend: false, warmupScore: 0 },
            warmup: { marathon: 0, practice: 0, legend: false, warmupScore: 0 },
            fullcall: { marathon: 0, practice: 0, legend: false, warmupScore: 0 },
            powerhour: { marathon: 0, practice: 0, legend: false, warmupScore: 0 }
          },
          total_practice_time: 0
        }])
      ]);
    }

    // Mark verification as completed
    await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    // Update lead record if it exists
    await supabase
      .from('leads')
      .update({ 
        email_verified: true,
        verification_completed_at: now.toISOString()
      })
      .eq('email', email);

    // Log successful verification
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: user.id,
        action: 'user_verified',
        data: {
          verification_method: 'email',
          access_level: accessLevel,
          first_login: !existingUser
        }
      }]);

    console.log('Email verification successful:', {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      accessLevel: user.access_level,
      firstLogin: !existingUser
    });

    // Return user data (excluding sensitive fields)
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      prospectJobTitle: user.prospect_job_title,
      prospectIndustry: user.prospect_industry,
      targetMarket: user.target_market,
      customBehavior: user.custom_behavior,
      accessLevel: user.access_level,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };

    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully',
      user: safeUser,
      isNewUser: !existingUser
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify email. Please try again.' 
    });
  }
}

// Helper function to determine access level
function determineAccessLevel(email) {
  // Enhanced logic for access level determination
  // You can customize this based on your business rules
  
  if (email.includes('premium') || email.includes('pro') || email.includes('unlimited')) {
    return 'unlimited';
  }
  
  if (email.includes('trial') || email.includes('locked')) {
    return 'unlimited_locked';
  }
  
  // Default access level - you can change this
  return 'unlimited'; // For demo, giving everyone unlimited access
}