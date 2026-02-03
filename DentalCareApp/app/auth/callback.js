import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../theme/colors';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  useEffect(() => {
    console.log('=== AUTH CALLBACK ROUTE HIT ===');
    console.log('Params:', params);
    
    // Extract auth data if available
    if (params.data) {
      try {
        const authData = JSON.parse(decodeURIComponent(params.data));
        console.log('✅ Auth data received in callback route:', authData);
        
        // The deep link handler and Google login should have already processed this
        // Redirect to home after a short delay
        setTimeout(() => {
          console.log('🏠 Redirecting to home from callback route');
          router.replace('/home');
        }, 1500);
        
      } catch (error) {
        console.error('❌ Error parsing auth data:', error);
        router.replace('/home'); // Still go to home on error
      }
    } else {
      // No auth data, redirect to home anyway
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    }
  }, [params, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉</Text>
      <Text style={styles.message}>Welcome to DentalCare!</Text>
      <Text style={styles.sub}>Taking you to your dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    marginBottom: 20,
  },
  message: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
  },
});
