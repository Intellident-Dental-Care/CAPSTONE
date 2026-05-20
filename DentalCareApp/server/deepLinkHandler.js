import * as Linking from 'expo-linking';
import { supabase } from './supabaseService';
import { AppState } from 'react-native';
import { setDeepLinkServerIP } from './getClientSideUrl';

let deepLinkSubscription = null;
let appStateSubscription = null;
let isListening = false;
let detectedServerIP = null;

export const startDeepLinkListener = () => {
  if (isListening) {
    console.log('Deep link listener already active');
    return;
  }

  console.log('🔗 Starting simplified deep link listener');
  isListening = true;

  const handleDeepLink = (event) => {
    // Normalize the URL string
    let url = typeof event === 'object' ? event.url : event;
    console.log('🔗 Passive Deep Link received:', url);
    
    if (!url || typeof url !== 'string') {
      console.log('⚠️ Invalid deep link format received');
      return;
    }
    
    // Extract server IP from deep link (exp://10.173.37.14:8081)
    try {
      const match = url.match(/exp:\/\/([0-9.]+):/);
      if (match && match[1]) {
        detectedServerIP = match[1];
        console.log('🎯 Extracted server IP from deep link:', detectedServerIP);
        setDeepLinkServerIP(detectedServerIP);
      }
    } catch (e) {
      console.log('Could not parse IP from deep link');
    }
    
    // Basic handling for non-OAuth deep links (email verification, password reset, etc.)
    if (url.includes('confirm') || url.includes('reset') || url.includes('verify')) {
      console.log('📧 Email-based deep link detected');
      
      setTimeout(async () => {
        try {
          console.log('🔄 Refreshing session for email link...');
          await supabase.auth.refreshSession();
        } catch (err) {
          console.error('Session refresh error:', err);
        }
      }, 1000);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('📱 App became active');
      
      // Basic session check when app resumes
      setTimeout(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!error && session?.user) {
            console.log('✅ Session found on app resume:', session.user.email);
          }
        } catch (err) {
          console.error('Error checking session on resume:', err);
        }
      }, 500);
    }
  };

  // Listen for incoming links
  deepLinkSubscription = Linking.addEventListener('url', handleDeepLink);

  // Check if the app was opened via a link
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🚀 App launched via Deep Link');
      handleDeepLink(url);
    }
  }).catch(err => console.error('Error getting initial URL:', err));

  // Listen for app state changes
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
};

export const stopDeepLinkListener = () => {
  if (deepLinkSubscription) {
    console.log('🔗 Stopping deep link listener');
    deepLinkSubscription.remove();
    deepLinkSubscription = null;
  }
  
  if (appStateSubscription) {
    console.log('📱 Stopping app state listener');
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  
  isListening = false;
};

export const isDeepLinkListening = () => isListening;

export const getDetectedServerIP = () => detectedServerIP;
