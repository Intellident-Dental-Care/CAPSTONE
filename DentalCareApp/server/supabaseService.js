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

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
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
