import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { ok: false, message: authError.message };
    }

    if (authData.user) {
      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return { ok: false, message: 'Login failed. Please try again.' };
      }

      return {
        ok: true,
        user: {
          id: authData.user.id,
          fullName: profile.full_name,
          email: profile.email,
          onboardingSeen: profile.onboarding_seen || false,
        }
      };
    }

    return { ok: false, message: 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
};

// Get current user session
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { ok: false, user: null };
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { ok: false, user: null };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        fullName: profile.full_name,
        email: profile.email,
        onboardingSeen: profile.onboarding_seen || false,
      }
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { ok: false, user: null };
  }
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
