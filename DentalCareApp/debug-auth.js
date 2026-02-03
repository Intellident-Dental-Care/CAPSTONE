import { supabase } from './server/supabaseService';

export const debugAuth = async () => {
  console.log('=== DEBUG AUTH STATUS ===');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', error);
    
    if (session?.user) {
      console.log('User details:', {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      });
    }
  } catch (err) {
    console.error('Debug error:', err);
  }
};

// Call this in your login component to debug
