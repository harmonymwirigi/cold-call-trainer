import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
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
    const { email, adminKey } = req.body;
    
    // Validate admin access
    if (adminKey !== process.env.ADMIN_API_KEY) {
      res.status(403).json({ error: 'Invalid admin key' });
      return;
    }
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.status(200).json({ 
      success: true, 
      user: user 
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}