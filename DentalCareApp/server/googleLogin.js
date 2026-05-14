import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseService';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { storeSession } from '../app/_storage/authStorage';

// Ensure this is called
WebBrowser.maybeCompleteAuthSession();

export const handleGoogleLogin = async () => {
  try {
    console.log('=== STARTING GOOGLE OAUTH (VERCEL CALLBACK) ===');

    const localRedirectUrl = Linking.createURL('/');
    console.log('📱 Local Redirect URL:', localRedirectUrl);

    const callbackUrl = `https://dentalcare-oauth-callback.vercel.app?return_to=${encodeURIComponent(localRedirectUrl)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true, 
      },
    });

    if (error) throw error;

    console.log('📱 Opening Auth Session...');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      localRedirectUrl
    );

    console.log('=== GOOGLE AUTH SESSION RESULT ===');
    console.log('Result type:', result.type);
    console.log('Result URL:', result.url);

    if (result.type === 'success' && result.url) {
      const params = parseUrlParams(result.url);

      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

        if (sessionError) throw sessionError;

        await processUserProfile(sessionData.user, 'google');

        router.replace('/home');
        return sessionData.user;
      }

      throw new Error('No authentication tokens received');
    }

    if (result.type === 'cancel') {
      throw new Error('Google login was cancelled');
    }

    throw new Error('Google login failed');

  } catch (error) {
    console.log('=== GOOGLE LOGIN ERROR ===');
    console.error('Error:', error.message);
    throw error; 
  }
};

const parseUrlParams = (url) => {
  const params = {};
  try {
    console.log('🔍 Parsing URL for tokens:', url);
    
    const parts = url.split(/[#?&]/); 
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    console.log('✅ URL parsing complete');
  } catch (e) {
    console.error('Error parsing URL:', e);
  }
  return params;
};

const processUserProfile = async (user, provider) => {
  try {
    console.log('👤 Processing user profile...');
    let userProfile = null;

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    );
    
    const fetchProfile = supabase
      .from("users")
      .select("full_name, is_verified")
      .eq("id", user.id)
      .single();
    
    try {
      const { data, error } = await Promise.race([fetchProfile, timeoutPromise]);
      
      if (data) {
        userProfile = data;
        console.log('✅ Existing profile found:', data.full_name);
      } else if (error && error.code === 'PGRST116') {
        console.log('👤 Creating new user profile...');
        
        const fullName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name ||
                         `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
                         user.email?.split('@')[0] || 
                         'Google User';
        
        await Promise.race([
          supabase.from("users").insert([{
            id: user.id,
            full_name: fullName,
            email: user.email,
            is_verified: true,
            verification_otp: null,
            otp_expires_at: null
          }]),
          timeoutPromise
        ]);
        
        userProfile = { full_name: fullName, is_verified: true };
        console.log('New profile created:', fullName);
      } else {
        throw error;
      }
      
    } catch (err) {
      console.log('Profile processing timed out, using fallback');
      userProfile = { 
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        is_verified: true
      };
    }

    await storeSession({
      user,
      session: await supabase.auth.getSession(),
      fullName: userProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    });
    
    console.log('✅ Session stored with profile data');
    
  } catch (e) {
    console.error('Profile processing error:', e);
    // Continue anyway with basic session
    await storeSession({
      user,
      session: null,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User'
    });
  }
};
