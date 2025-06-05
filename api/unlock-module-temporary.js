// Create file: api/unlock-module-temporary.js

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
    const { userId, moduleId, unlockType = 'marathon_completion' } = req.body;
    
    // Get user access level
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('access_level')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Determine unlock duration and type based on access level
    let expiresAt;
    let tableName;
    
    if (user.access_level === 'unlimited_locked') {
      // 24-hour temporary unlock
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tableName = 'temporary_unlocks';
    } else if (user.access_level === 'limited') {
      // Permanent unlock
      expiresAt = null;
      tableName = 'permanent_unlocks';
    } else {
      res.status(400).json({ error: 'Unlock not applicable for this access level' });
      return;
    }
    
    // Remove any existing unlock for this module
    await supabase
      .from(tableName)
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);
    
    // Create new unlock
    const unlockData = {
      user_id: userId,
      module_id: moduleId,
      unlock_type: unlockType,
      created_at: new Date().toISOString()
    };
    
    if (expiresAt) {
      unlockData.expires_at = expiresAt.toISOString();
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .insert([unlockData])
      .select()
      .single();
      
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to create unlock' });
      return;
    }
    
    // Log the unlock
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action: 'module_unlocked',
        data: { 
          module_id: moduleId, 
          unlock_type: unlockType,
          expires_at: expiresAt?.toISOString(),
          permanent: !expiresAt
        }
      }]);
    
    res.status(200).json({
      success: true,
      unlock: data,
      message: expiresAt 
        ? `Module unlocked for 24 hours until ${expiresAt.toISOString()}`
        : 'Module permanently unlocked'
    });
    
  } catch (error) {
    console.error('Unlock module error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
