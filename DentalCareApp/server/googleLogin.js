import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseService';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { setSession } from '../app/_storage/authStorage';

// Ensure this is called
WebBrowser.maybeCompleteAuthSession();

export const handleGoogleLogin = async () => {
  try {
    console.log('=== STARTING GOOGLE OAUTH (SESSION MODE) ===');
    
    // 1. Get your specific local development URL
    // This creates "exp://192.168.x.x:8081" which tells the Auth Session what to wait for
    const localRedirectUrl = Linking.createURL('/');
    console.log('📱 Local Redirect URL:', localRedirectUrl);

    // 2. Prepare the Vercel Callback
    const callbackUrl = `https://dentalcare-oauth-callback.vercel.app?return_to=${encodeURIComponent(localRedirectUrl)}`;
    
    // 3. Get the Google Auth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true, // We need the URL, not an auto-redirect
      },
    });

    if (error) throw error;

    console.log('📱 Opening Auth Session...');
    
    // 4. THE FIX: openAuthSessionAsync
    // This opens the browser and WAITS. 
    // It automatically closes the browser when it sees a redirect to 'localRedirectUrl'
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,       // The Google Login URL
      localRedirectUrl // The URL to listen for (your app)
    );

    console.log('=== AUTH SESSION RESULT ===');
    console.log('Result type:', result.type);
    console.log('Result URL:', result.url);

    // 5. Handle the Result
    if (result.type === 'success' && result.url) {
      console.log('✅ Auth Session Successful! Browser closed automatically.');
      console.log('🔗 Result URL:', result.url);
      
      // Extract tokens from the URL returned by the session
      const params = parseUrlParams(result.url);
      
      console.log('🔍 Parsed tokens:', {
        hasAccessToken: !!params.access_token,
        hasRefreshToken: !!params.refresh_token,
        accessTokenPreview: params.access_token ? params.access_token.substring(0, 20) + '...' : null
      });
      
      if (params.access_token && params.refresh_token) {
        console.log('🔓 Tokens found. Setting session...');
        
        // Set Supabase Session
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        console.log('✅ Session set successfully');
        console.log('👤 User:', sessionData.user?.email);

        // Process User Profile
        await processUserProfile(sessionData.user, 'google');
        
        // Navigate to home
        console.log('🏠 Navigating to home...');
        router.replace("/home");
        return sessionData.user;
        
      } else {
        console.log('⚠️ No tokens found in result URL');
        throw new Error('No authentication tokens received');
      }
      
    } else if (result.type === 'cancel') {
      console.log('❌ Login cancelled by user');
      throw new Error('Google login was cancelled');
    } else {
      console.log('❌ Login failed:', result.type);
      throw new Error('Google login failed');
    }

  } catch (error) {
    console.log('=== GOOGLE LOGIN ERROR ===');
    console.error('Error:', error.message);
    throw error; // Re-throw so the UI can handle it
  }
};

// --- Helper Functions ---

// Extracts #access_token=...&refresh_token=... from the URL
const parseUrlParams = (url) => {
  const params = {};
  try {
    console.log('🔍 Parsing URL for tokens:', url);
    
    // Handle both hash (#) and query (?)
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

// Handles profile creation/fetching with timeout protection
const processUserProfile = async (user, provider) => {
  try {
    console.log('👤 Processing user profile...');
    let userProfile = null;
    
    // Try to get existing profile with timeout
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
        // Create new profile if missing
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
        console.log('✅ New profile created:', fullName);
      } else {
        throw error;
      }
      
    } catch (err) {
      console.log('⚠️ Profile processing timed out, using fallback');
      // Use fallback profile
      userProfile = { 
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        is_verified: true
      };
    }

    // Store in local storage
    const sessionData = {
      user,
      fullName: userProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      loginTime: Date.now(),
      provider
    };
    
    await setSession(sessionData);
    console.log('✅ Session stored with profile data');
    
  } catch (e) {
    console.error('Profile processing error:', e);
    // Continue anyway with basic session
    await setSession({
      user,
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User',
      loginTime: Date.now(),
      provider
    });
  }
};
