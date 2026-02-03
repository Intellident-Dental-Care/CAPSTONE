import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabaseService';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export const handleFacebookLogin = async () => {
  try {
    const redirectUrl = AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: undefined,
    });

    const finalRedirectUrl = redirectUrl.includes('192.168') || redirectUrl.includes('localhost') 
      ? `https://auth.expo.io/@${Constants.expoConfig?.owner || 'anonymous'}/${Constants.expoConfig?.slug || 'DentalCareApp'}`
      : redirectUrl;

    console.log('Facebook OAuth Redirect URL:', finalRedirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: finalRedirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data?.url, 
      finalRedirectUrl,
      { 
        showInRecents: true,
        dismissButtonStyle: 'cancel'
      }
    );

    console.log('Facebook OAuth Result:', result);

    if (result.type === 'success' && result.url) {
      const url = result.url;
      
      if (url.includes('access_token=') || url.includes('code=')) {
        let params = new URLSearchParams();
        
        if (url.includes('#')) {
          params = new URLSearchParams(url.split('#')[1]);
        } else if (url.includes('?')) {
          params = new URLSearchParams(url.split('?')[1]);
        }

        const code = params.get('code');
        if (code) {
          console.log('Facebook: Got authorization code, exchanging for session...');
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) {
            console.error('Facebook code exchange error:', sessionError);
            throw sessionError;
          }
          console.log('Facebook session created via code exchange');
          return sessionData.user;
        }

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(`Facebook OAuth error: ${errorParam}`);
        }

        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('Facebook session error:', sessionError);
            throw sessionError;
          }
          console.log('Facebook session created via direct tokens');
          return sessionData.user;
        }
      }
      
      throw new Error('No authentication data received from Facebook');
    } else if (result.type === 'cancel') {
      throw new Error('Facebook login was cancelled');
    } else if (result.type === 'dismiss') {
      throw new Error('Facebook login was dismissed. Please check your network connection and try again.');
    } else {
      throw new Error('Facebook login failed');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    throw error;
  }
};
