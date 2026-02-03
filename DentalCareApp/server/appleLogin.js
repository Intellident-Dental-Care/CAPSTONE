import { Platform } from 'react-native';
import { supabase } from './supabaseService';

// Conditional import for Apple Authentication (iOS only)
let AppleAuthentication = null;
if (Platform.OS === 'ios') {
  AppleAuthentication = require('expo-apple-authentication');
}

export const handleAppleLogin = async () => {
  if (Platform.OS !== 'ios' || !AppleAuthentication) {
    throw new Error('Apple Sign In is only available on iOS');
  }

  try {
    // Check if Apple Sign In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce, // Include nonce if available
      });

      if (error) {
        throw error;
      }

      return data.user;
    }
  } catch (error) {
    if (error.code === 'ERR_CANCELED') {
      // User canceled the sign-in flow
      console.log('Apple Sign In was canceled');
      throw new Error('Apple login was cancelled');
    } else {
      throw error;
    }
  }
};
