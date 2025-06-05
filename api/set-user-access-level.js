// Create file: api/set-user-access-level.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { userId, accessLevel, adminKey } = req.body;
    
    // Validate admin access (you'll need to set this environment variable)
    if (adminKey !== process.env.ADMIN_API_KEY) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    // Validate access level
    const validLevels = ['unlimited', 'unlimited_locked', 'limited'];
    if (!validLevels.includes(accessLevel)) {
      res.status(400).json({ error: 'Invalid access level' });
      return;
    }
    
    // Update user access level
    const { data, error } = await supabase
      .from('users')
      .update({ access_level: accessLevel })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to update access level' });
      return;
    }
    
    // Log the access level change
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: userId,
        action: 'access_level_changed',
        data: { new_level: accessLevel, admin_action: true }
      }]);
    
    res.status(200).json({ 
      success: true, 
      user: data,
      message: `Access level updated to ${accessLevel}` 
    });
    
  } catch (error) {
    console.error('Set access level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
