import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sign up a new user
export const signUpUser = async ({ fullName, email, password }) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      return { ok: false, message: authError.message };
    }

    if (authData.user) {
      // Insert user profile data
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            email: email,
            onboarding_seen: false,
            created_at: new Date().toISOString(),
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Auth user was created but profile failed
        return { ok: false, message: 'Account created but profile setup failed. Please contact support.' };
      }

      return { 
        ok: true, 
        user: { 
          id: authData.user.id,
          fullName,
          email,
          onboardingSeen: false 
        } 
      };
    }

    return { ok: false, message: 'Failed to create account' };
  } catch (error) {
    console.error('Signup error:', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
};

// Restore session from stored data (for app initialization)
export const restoreSessionFromStorage = async (storedSession) => {
  if (!storedSession?.session) {
    return null;
  }

  try {
    // Set the session in Supabase client
    const { data, error } = await supabase.auth.setSession(storedSession.session);
    if (error) {
      console.warn('Failed to restore Supabase session:', error);
      // Try to refresh the session if it exists
      if (storedSession.session?.refresh_token) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(storedSession.session);
          if (refreshError) {
            console.warn('Failed to refresh session:', refreshError);
            return null;
          }
          if (refreshData.session) {
            // Successfully refreshed, session is now restored
            return refreshData.user;
          }
        } catch (refreshErr) {
          console.warn('Error during session refresh:', refreshErr);
          return null;
        }
      }
      return null;
    }
    return data?.user || storedSession.user;
  } catch (error) {
    console.warn('Error restoring session:', error);
    return null;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('getCurrentUser error:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.warn('Exception in getCurrentUser:', error);
    return null;
  }
};

// Helper function to get user profile
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Sign out user
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { ok: false, message: 'Failed to sign out' };
  }
};

// Update onboarding status
export const updateOnboardingStatus = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ onboarding_seen: true })
      .eq('id', userId);

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.error('Update onboarding error:', error);
    return { ok: false, message: 'Failed to update onboarding status' };
  }
};
