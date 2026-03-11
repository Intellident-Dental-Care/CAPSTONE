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
import { loginUser } from "./storage/authStorage";

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
      const res = await loginUser(email, password);
      setLoading(false);

      if (!res.ok) {
        setError(res.message);
        return;
      }

      const firstTime = !res.user.onboardingSeen;

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
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
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
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
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
                <Pressable style={styles.socialBtn}>
                  <FontAwesome name="facebook" size={18} color={colors.primary} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <AntDesign name="google" size={18} color={colors.primary} />
                </Pressable>
                <Pressable style={styles.socialBtn}>
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

  scrollContent: { 
    flexGrow: 1, 
    backgroundColor: colors.pinkBg 
  },

  top: { height: 170, paddingTop: 48, paddingHorizontal: 18 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, color: colors.textGrayLight },

  logoSmall: { width: 180, height: 180, resizeMode: "contain", alignSelf: "center", marginTop: 12 },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 40,
    marginTop: 60,
    // Ensures the white background stretches to the bottom
    minHeight: H - 170, 
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
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
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