// Create file: api/check-module-access.js

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

  try {
    const { userId, moduleId } = req.body;
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('access_level, created_at')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Get usage tracking
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('monthly_usage, lifetime_usage')
      .eq('user_id', userId)
      .single();
    
    // Check access based on level
    let hasAccess = false;
    let reason = '';
    
    switch (user.access_level) {
      case 'unlimited':
        // Check monthly usage limit (50 hours = 180,000 seconds)
        const monthlyLimit = 180000; // 50 hours in seconds
        if (!usage || usage.monthly_usage < monthlyLimit) {
          hasAccess = true;
        } else {
          reason = 'Monthly usage limit reached (50 hours)';
        }
        break;
        
      case 'unlimited_locked':
        // Only opener module + temporarily unlocked modules
        if (moduleId === 'opener') {
          hasAccess = true;
        } else {
          // Check for temporary unlock
          const tempUnlock = await checkTemporaryUnlock(userId, moduleId);
          hasAccess = tempUnlock.hasAccess;
          reason = tempUnlock.reason;
        }
        break;
        
      case 'limited':
        // Check lifetime usage limit (3 hours = 10,800 seconds) and 7 days
        const lifetimeLimit = 10800; // 3 hours in seconds
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const accountAge = new Date(user.created_at);
        
        if (accountAge < sevenDaysAgo) {
          reason = '7-day trial period expired';
        } else if (usage && usage.lifetime_usage >= lifetimeLimit) {
          reason = 'Lifetime usage limit reached (3 hours)';
        } else if (moduleId === 'opener') {
          hasAccess = true;
        } else {
          // Check for permanent unlock (progression-based)
          hasAccess = await checkProgressionUnlock(userId, moduleId);
          if (!hasAccess) {
            reason = 'Complete previous modules to unlock';
          }
        }
        break;
        
      default:
        reason = 'Invalid access level';
    }
    
    res.status(200).json({
      hasAccess,
      reason,
      accessLevel: user.access_level,
      usage: usage || { monthly_usage: 0, lifetime_usage: 0 }
    });
    
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to check temporary unlocks
async function checkTemporaryUnlock(userId, moduleId) {
  const { data: unlock, error } = await supabase
    .from('temporary_unlocks')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .gte('expires_at', new Date().toISOString())
    .single();
    
  if (error || !unlock) {
    return { hasAccess: false, reason: 'Complete previous module marathon to unlock for 24 hours' };
  }
  
  return { hasAccess: true, reason: '' };
}

// Helper function to check progression-based unlocks
async function checkProgressionUnlock(userId, moduleId) {
  // For limited accounts, unlocks are permanent once earned
  const { data: unlock, error } = await supabase
    .from('permanent_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .single();
    
  return !error && unlock;
}
