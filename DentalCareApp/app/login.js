import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "./theme/colors";
import AuthAlert from "./components/authAlert";
import { supabase } from "../server/supabaseService";
import { storeSession } from "./_storage/authStorage";
import { validateLoginInput } from "../server/Security/authentication/inputValidator";
import bruteForceProtection from "../server/Security/authentication/bruteForceProtection";
import { cancelOverdueAppointments } from "../server/cancelOverdueAppointments";

const { height: H } = Dimensions.get("window");
const isSmallPhone = H < 760;

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
  }, []);

  const logoStyle = useMemo(() => {
    const scale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
    const ty = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
    return { transform: [{ translateY: ty }, { scale }] };
  }, [logoAnim]);

  const navigateAfterLogin = (firstTimeOnboarding, needsPatientSetup) => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      router.replace("/data-privacy");
    });
  };

  const handleLogin = async () => {
    setError("");

    const { isLocked, remainingTimeMs } = bruteForceProtection.isLocked(email);
    if (isLocked) {
      const minutes = Math.ceil(remainingTimeMs / 60000);
      setError(`Account temporarily locked due to multiple failed attempts. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`);
      return;
    }

    const validation = validateLoginInput({ email, password });
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    const { email: cleanEmail, password: cleanPassword } = validation.sanitized;

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        const result = bruteForceProtection.recordFailedAttempt(cleanEmail);
        setLoading(false);

        if (!result.success) {
          setError(result.message);
        } else {
          setError(`Invalid email or password. ${result.message}`);
        }
        return;
      }

      if (!data.user) {
        setLoading(false);
        setError("Login failed. Please try again.");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("is_verified, full_name, onboarding_seen")
        .eq("id", data.user.id)
        .single();

      setLoading(false);

      if (profileError) {
        setError("Failed to fetch user profile. Please try again.");
        return;
      }

      if (!userProfile?.is_verified) {
        setError("Please verify your email before logging in.");
        return;
      }

      bruteForceProtection.recordSuccessfulLogin(cleanEmail);

      await storeSession({
        user: data.user,
        session: data.session,
        fullName: userProfile.full_name || data.user.email,
      });

      await cancelOverdueAppointments({ userId: data.user.id });

      navigateAfterLogin(!userProfile.onboarding_seen, false);
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      setError("");

      let user;

      switch (provider) {
        case "google":
          setError("");
          user = await handleGoogleLogin();
          break;
        case "apple":
          user = await handleAppleLogin();
          break;
        case "facebook":
          user = await handleFacebookLogin();
          break;
        default:
          throw new Error("Unsupported provider");
      }

      if (user) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("full_name, onboarding_seen")
          .eq("id", user.id)
          .single();

        await storeSession({
          user,
          session: await supabase.auth.getSession(),
          fullName: userProfile?.full_name || user.user_metadata?.full_name || user.email,
        });

        await cancelOverdueAppointments({ userId: user.id });

        const firstTimeOnboarding = provider === "google" ? !userProfile?.onboarding_seen : false;
        navigateAfterLogin(firstTimeOnboarding, false);
      }
    } catch (error) {
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. Please try again.`);
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
            {
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.35],
              }),
            },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.screen, { transform: [{ translateY }] }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.page}>
            <Pressable style={styles.backRow} onPress={close}>
              <Feather name="chevron-left" size={18} color={colors.primary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Animated.Image
              source={require("../assets/logo.png")}
              style={[styles.logoSmall, logoStyle]}
            />

            <View style={styles.card}>
              <Text style={styles.h1}>Welcome Back</Text>
              <Text style={styles.h2}>
                Ready to continue your dental journey?{"\n"}Your path is right here.
              </Text>

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
                  <Feather
                    name={showPass ? "eye" : "eye-off"}
                    size={18}
                    color={colors.textGray}
                  />
                </Pressable>
              </View>

              <AuthAlert message={error} />

              <View style={styles.rowBetween}>
                <Pressable style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
                  <View style={[styles.fakeCheck, remember && styles.fakeCheckChecked]} />
                  <Text style={styles.smallPink}>Remember me</Text>
                </Pressable>

                <Pressable onPress={() => {}}>
                  <Text style={styles.smallPink}>Forgot Password?</Text>
                </Pressable>
              </View>

              <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                <Text style={styles.loginText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </Pressable>

              <View style={styles.bottomTextRow}>
                <Text style={styles.bottomPlain}>Don’t have an account? </Text>

                <Pressable onPress={() => switchTo("/signup")} disabled={loading}>
                  <Text style={styles.linkPink}>Sign Up</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: "#fff",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  screen: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },

  page: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingTop: isSmallPhone ? 14 : 18,
    paddingBottom: isSmallPhone ? 12 : 18,
  },

  backRow: {
    height: 32,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  backText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "800",
  },

  logoSmall: {
    width: isSmallPhone ? 120 : 135,
    height: isSmallPhone ? 120 : 135,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: isSmallPhone ? 12 : 18,
    marginBottom: isSmallPhone ? 0 : 4,
  },

  card: {
    flex: 1,
    marginTop: isSmallPhone ? -4 : -8,
    backgroundColor: "#fff",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: isSmallPhone ? 72 : 86,
    paddingBottom: isSmallPhone ? 18 : 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 7,
  },

  h1: {
    fontSize: isSmallPhone ? 22 : 25,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  h2: {
    marginTop: 6,
    fontSize: isSmallPhone ? 11 : 12,
    lineHeight: isSmallPhone ? 16 : 18,
    color: "#8A8A8A",
    textAlign: "center",
    fontWeight: "600",
  },

  input: {
    height: isSmallPhone ? 44 : 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F2D7E3",
    paddingHorizontal: 16,
    fontSize: 12,
    color: colors.textDark,
    backgroundColor: "#FFF9FB",
    marginTop: isSmallPhone ? 28 : 34,
  },

  inputPass: {
    marginTop: 12,
    height: isSmallPhone ? 44 : 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F2D7E3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFF9FB",
  },

  passField: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
  },

  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },

  rowBetween: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  fakeCheck: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  fakeCheckChecked: {
    backgroundColor: colors.primary,
  },

  smallPink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
  },

  loginBtn: {
    marginTop: isSmallPhone ? 22 : 28,
    height: isSmallPhone ? 48 : 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  loginText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  bottomTextRow: {
    marginTop: isSmallPhone ? 18 : 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomPlain: {
    color: colors.textGray,
    fontSize: 11,
  },

  linkPink: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
});