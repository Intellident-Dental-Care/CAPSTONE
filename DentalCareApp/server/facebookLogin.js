import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseService';
import { router } from 'expo-router';
import { storeSession } from '../app/_storage/authStorage';

WebBrowser.maybeCompleteAuthSession();

export const handleFacebookLogin = async () => {
  try {
    console.log('=== STARTING FACEBOOK OAUTH (VERCEL CALLBACK) ===');

    const localRedirectUrl = Linking.createURL('/');
    console.log('📱 Local Redirect URL:', localRedirectUrl);

    const callbackUrl = `https://dentalcare-oauth-callback.vercel.app?return_to=${encodeURIComponent(localRedirectUrl)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: callbackUrl,
        scopes: 'email public_profile',
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('Supabase Facebook OAuth error:', error);
      throw error;
    }

    console.log('📱 Opening Facebook Auth Session...');
    
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      localRedirectUrl
    );

    console.log('=== FACEBOOK AUTH SESSION RESULT ===');
    console.log('Result type:', result.type);
    console.log('Result URL:', result.url);

    // 5. Handle the Result
    if (result.type === 'success' && result.url) {
      const params = parseUrlParams(result.url);

      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

        if (sessionError) throw sessionError;

        await processUserProfile(sessionData.user, 'facebook');

        router.replace('/home');
        return sessionData.user;
      }

      throw new Error('No authentication tokens received from Facebook');
    }

    if (result.type === 'cancel') {
      throw new Error('Facebook login was cancelled');
    }

    throw new Error('Facebook login failed');

  } catch (error) {
    console.log('=== FACEBOOK LOGIN ERROR ===');
    console.error('Error:', error.message);
    throw error;
  }
};

// --- Helper Functions ---

// Extracts tokens from URL
const parseUrlParams = (url) => {
  const params = {};
  try {
    console.log('🔍 Parsing Facebook URL for tokens:', url);
    
    // Handle both hash (#) and query (?)
    const parts = url.split(/[#?&]/); 
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
    
    console.log('✅ Facebook URL parsing complete');
  } catch (e) {
    console.error('Error parsing Facebook URL:', e);
  }
  return params;
};

// Handles Facebook user profile creation/fetching
const processUserProfile = async (user, provider) => {
  try {
    console.log('👤 Processing Facebook user profile...');
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
        console.log('✅ Existing Facebook profile found:', data.full_name);
      } else if (error && error.code === 'PGRST116') {
        // Create new profile if missing
        console.log('👤 Creating new Facebook user profile...');
        
        const fullName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name ||
                         `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
                         user.user_metadata?.first_name && user.user_metadata?.last_name 
                           ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                           : user.email?.split('@')[0] || 
                         'Facebook User';
        
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
        console.log('✅ New Facebook profile created:', fullName);
      } else {
        throw error;
      }
      
    } catch (err) {
      console.log('⚠️ Facebook profile processing timed out, using fallback');
      // Use fallback profile
      userProfile = { 
        full_name: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.first_name && user.user_metadata?.last_name 
                     ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                     : user.email?.split('@')[0] || 'Facebook User',
        is_verified: true
      };
    }

    // Store in local storage using unified storeSession function
    await storeSession({
      user,
      session: await supabase.auth.getSession(),
      fullName: userProfile?.full_name || 
                user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.user_metadata?.first_name && user.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                  : user.email?.split('@')[0] || 'Facebook User'
    });
    
    console.log('✅ Facebook session stored with profile data');
    
  } catch (e) {
    console.error('Facebook profile processing error:', e);
    // Continue anyway with basic session
    await storeSession({
      user,
      session: null,
      fullName: user.user_metadata?.full_name || 
                user.user_metadata?.name || 
                user.user_metadata?.first_name && user.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                  : user.email || 'Facebook User'
    });
  }
};
