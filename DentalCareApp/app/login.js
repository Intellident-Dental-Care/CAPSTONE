import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { colors } from "./theme/colors";
import AuthAlert from "./components/authAlert";
import { supabase } from "../server/supabaseService";
import { storeSession } from "./_storage/authStorage";
import { handleGoogleLogin } from "../server/googleLogin";
import { handleAppleLogin } from "../server/appleLogin";
import { handleFacebookLogin } from "../server/facebookLogin";

const { height: H } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();

  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const translateY = useRef(new Animated.Value(H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => router.back());
  };

  const switchTo = (path) => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      router.back();
      setTimeout(() => router.push(path), 50);
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 140 }),
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 140 }),
    ]).start();
  }, [backdrop, translateY, logoAnim]);

  const logoStyle = useMemo(() => {
    const scale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
    const ty = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
    return { transform: [{ translateY: ty }, { scale }] };
  }, [logoAnim]);

const handleLogin = async () => {
  setError("");

  if (!email.trim() || !password) {
    setError("Please enter your email and password.");
    return;
  }

  try {
    setLoading(true);
    
    // Sign in the user first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Login failed. Please try again.");
      return;
    }

    // Now fetch the user profile with the authenticated user
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("is_verified, full_name")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      setError("Failed to fetch user profile. Please try again.");
      return;
    }

    if (!userProfile?.is_verified) {
      setError("Please verify your email before logging in.");
      return;
    }

    // Store session with user data including full name
    await storeSession({
      user: data.user,
      session: data.session,
      fullName: userProfile.full_name || data.user.email
    });

    // Success - redirect based on onboarding status
    const firstTime = !data.user.user_metadata?.onboardingSeen;

    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      router.back();
      setTimeout(() => {
        if (firstTime) router.replace("/onboarding");
        else router.replace("/home");
      }, 60);
    });
  } catch (err) {
    console.error("Login error:", err);
    setLoading(false);
    setError("Something went wrong. Please try again.");
  }
};

  const handleSocialLogin = async (provider) => {
    try {
      console.log(`=== STARTING ${provider.toUpperCase()} LOGIN ===`);
      setLoading(true);
      setError("");
      
      let user;
      
      switch (provider) {
        case 'google':
          setError("Opening Google login... Please complete authentication in browser.");
          user = await handleGoogleLogin();
          break;
        case 'apple':
          setError("Opening Apple login...");
          user = await handleAppleLogin();
          break;
        case 'facebook':
          setError("Opening Facebook login...");
          user = await handleFacebookLogin();
          break;
        default:
          throw new Error('Unsupported provider');
      }
      
      if (user) {
        console.log(`🎉 ${provider} login completed!`);
        
        // Fetch user profile for social login users too
        const { data: userProfile } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();
          
        // Store session with full name
        await storeSession({
          user: user,
          session: await supabase.auth.getSession(),
          fullName: userProfile?.full_name || user.user_metadata?.full_name || user.email
        });
        
        setError("Login successful! Welcome to DentalCare!");
        
        // Navigate to home after successful social login
        Animated.parallel([
          Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
          Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          router.back();
          setTimeout(() => {
            router.replace("/home");
          }, 100);
        });
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      let errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. Please try again.`;
      
      if (error.message.includes('cancelled')) {
        errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} login was cancelled.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Login timed out. Please complete authentication and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlayRoot}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }) },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.screen, { transform: [{ translateY }] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
              <View style={styles.top}>
                <Pressable style={styles.backRow} onPress={close}>
                  <Feather name="chevron-left" size={18} color={colors.textGrayLight} />
                  <Text style={styles.backText}>Back</Text>
                </Pressable>

                <Animated.Image source={require("../assets/logo.png")} style={[styles.logoSmall, logoStyle]} />
              </View>

              <View style={styles.card}>
                <Text style={styles.h1}>Welcome Back</Text>
                <Text style={styles.h2}>
                  Ready to continue your dental journey?{"\n"}Your path is right here.
                </Text>

                <View style={{ height: 18 }} />

                <TextInput
                  placeholder="Enter Email"
                  placeholderTextColor={colors.textGray}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <View style={styles.inputPass}>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.textGray}
                    secureTextEntry={!showPass}
                    style={styles.passField}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable onPress={() => setShowPass((p) => !p)} style={styles.eyeBtn}>
                    <Feather name={showPass ? "eye" : "eye-off"} size={18} color={colors.textGray} />
                  </Pressable>
                </View>

                <AuthAlert message={error} />

                <View style={styles.rowBetween}>
                  <Pressable style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
                    <View style={[styles.fakeCheck, remember ? styles.fakeCheckChecked : null]} />
                    <Text style={styles.smallPink}>Remember me</Text>
                  </Pressable>

                  <Pressable onPress={() => {}}>
                    <Text style={styles.smallPink}>Forgot Password?</Text>
                  </Pressable>
                </View>

                <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                  <Text style={styles.loginText}>{loading ? "Logging in..." : "Log In"}</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>Sign in with</Text>
                  <View style={styles.line} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable 
                    style={styles.socialBtn}
                    onPress={() => handleSocialLogin('facebook')}
                    disabled={loading}
                  >
                    <FontAwesome name="facebook" size={18} color={colors.primary} />
                  </Pressable>
                  
                  <Pressable 
                    style={styles.socialBtn}
                    onPress={() => handleSocialLogin('google')}
                    disabled={loading}
                  >
                    <AntDesign name="google" size={18} color={colors.primary} />
                  </Pressable>
                  
                  <Pressable 
                    style={styles.socialBtn}
                    onPress={() => handleSocialLogin('apple')}
                    disabled={loading}
                  >
                    <Ionicons name="logo-apple" size={18} color={colors.primary} />
                  </Pressable>
                </View>

                <View style={styles.bottomTextRow}>
                  <Text style={{ color: colors.textGray, fontSize: 12 }}>Don’t have an account? </Text>
                  <Pressable onPress={() => switchTo("/signup")} disabled={loading}>
                    <Text style={styles.linkPink}>Sign Up</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({

  overlayRoot: { flex: 1, backgroundColor: "transparent" },
  backdrop: { flex: 1, backgroundColor: "#000" },
  screen: { position: "absolute", left: 0, right: 0, bottom: 0, height: "100%" },

  container: { flex: 1, backgroundColor: colors.pinkBg },
  top: { height: 170, paddingTop: 48, paddingHorizontal: 18 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, color: colors.textGrayLight },

  logoSmall: { width: 180, height: 180, resizeMode: "contain", alignSelf: "center", marginTop: 12 },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 30,
    marginTop: 60,
  },

  h1: { fontSize: 27, fontWeight: "800", color: colors.primary, textAlign: "center" },
  h2: { marginTop: 10, fontSize: 12, color: colors.textGray, textAlign: "center", lineHeight: 17 },

  input: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    fontSize: 12,
    color: colors.textDark,
    backgroundColor: colors.white,
    marginTop: 50,
  },

  inputPass: {
    marginTop: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  passField: { flex: 1, fontSize: 12, color: colors.textDark },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },

  rowBetween: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fakeCheck: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: colors.primary },
  fakeCheckChecked: { backgroundColor: colors.primary },
  smallPink: { fontSize: 10, color: colors.primary },

  loginBtn: {
    marginTop: 30,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    // Platform-specific shadow styles
    ...(Platform.OS === 'ios' && {
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    }),
    ...(Platform.OS === 'android' && {
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    }),
  },
  
  loginText: { color: colors.white, fontSize: 13, fontWeight: "800" },

  dividerRow: { marginTop: 30, flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { fontSize: 10, color: colors.textGray },

  socialRow: { marginTop: 30, flexDirection: "row", justifyContent: "center", gap: 16 },
  socialBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },

  bottomTextRow: { marginTop: 16, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  linkPink: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
