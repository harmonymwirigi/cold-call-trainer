// api/verify-email.js - Fixed Verify email code and create user account
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

    console.log('Verify email request:', { email, firstName, prospectJobTitle });

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
      console.error('Verification lookup error:', verificationError);
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

    // CRITICAL FIX: Check if user already exists more carefully
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    console.log('Existing user check:', { existingUser, existingUserError });

    let user;
    
    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      
      // CRITICAL FIX: More robust user update with better error handling
      const updateData = {
        email_verified: true,
        last_login: now.toISOString(),
        access_level: accessLevel
      };

      // Only update fields if they were provided and are different
      if (firstName && firstName !== existingUser.first_name) {
        updateData.first_name = firstName;
      }
      if (prospectJobTitle && prospectJobTitle !== existingUser.prospect_job_title) {
        updateData.prospect_job_title = prospectJobTitle;
      }
      if (prospectIndustry && prospectIndustry !== existingUser.prospect_industry) {
        updateData.prospect_industry = prospectIndustry;
      }
      if (targetMarket && targetMarket !== existingUser.target_market) {
        updateData.target_market = targetMarket;
      }
      if (customBehavior !== undefined && customBehavior !== existingUser.custom_behavior) {
        updateData.custom_behavior = customBehavior;
      }

      // Update analytics if provided
      if (userAgent) updateData.user_agent = userAgent;
      if (timezone) updateData.timezone = timezone;
      if (language) updateData.language = language;
      if (screenResolution) updateData.screen_resolution = screenResolution;
      if (referrer) updateData.referrer = referrer;
      if (utmSource) updateData.utm_source = utmSource;
      if (utmMedium) updateData.utm_medium = utmMedium;
      if (utmCampaign) updateData.utm_campaign = utmCampaign;

      console.log('Update data:', updateData);

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        res.status(500).json({ 
          error: 'User update failed',
          message: `Failed to update user information: ${updateError.message}`,
          details: updateError
        });
        return;
      }
      
      user = updatedUser;
    } else {
      console.log('Creating new user');
      
      // CRITICAL FIX: More robust user creation with better error handling
      const newUserData = {
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
      };

      console.log('New user data:', newUserData);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        res.status(500).json({ 
          error: 'User creation failed',
          message: `Failed to create user account: ${createError.message}`,
          details: createError
        });
        return;
      }
      
      user = newUser;

      // CRITICAL FIX: Initialize user progress and usage tracking with error handling
      try {
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
      } catch (initError) {
        console.error('User initialization error:', initError);
        // Don't fail the whole request for initialization errors
      }
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
    try {
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
    } catch (logError) {
      console.error('Activity log error:', logError);
      // Don't fail the request for logging errors
    }

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
      message: `Failed to verify email: ${error.message}`,
      details: error
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