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
import { createUser } from "./storage/authStorage";

const { height: H } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const translateY = useRef(new Animated.Value(H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: H,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  const switchTo = (path) => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: H,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
      setTimeout(() => router.push(path), 50);
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 140,
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 140,
      }),
    ]).start();
  }, [backdrop, translateY, logoAnim]);

  const logoStyle = useMemo(() => {
    const scale = logoAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.72],
    });
    const ty = logoAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -22],
    });
    return { transform: [{ translateY: ty }, { scale }] };
  }, [logoAnim]);

  const handleSignup = async () => {
    setError("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(password)) {
      setError(
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await createUser({
        fullName: cleanFullName,
        email: cleanEmail,
        password,
      });

      setLoading(false);

      if (!res.success) {
        setError(res.message || "Signup failed.");
        return;
      }

      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.back();
        setTimeout(() => {
          router.push({
            pathname: "/otp-verification",
            params: { email: cleanEmail },
          });
        }, 60);
      });
    } catch (error) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      console.log("handleSignup error:", error);
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

      <Animated.View
        style={[styles.screen, { transform: [{ translateY }] }]}
      >
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
                <Feather
                  name="chevron-left"
                  size={18}
                  color={colors.textGrayLight}
                />
                <Text style={styles.backText}>Back</Text>
              </Pressable>

              <Animated.Image
                source={require("../assets/logo.png")}
                style={[styles.logoSmall, logoStyle]}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.h1}>Create Your Account</Text>
              <Text style={styles.h2}>
                Safe and Quality Dentistry.{"\n"}We take your health and safety
                seriously.
              </Text>

              <View style={{ height: 18 }} />

              <TextInput
                placeholder="Enter Full Name"
                placeholderTextColor={colors.textGray}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <View style={{ height: 12 }} />

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
                  placeholder="Enter Password"
                  placeholderTextColor={colors.textGray}
                  secureTextEntry={!showPass}
                  style={styles.passField}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPass((p) => !p)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPass ? "eye" : "eye-off"}
                    size={18}
                    color={colors.textGray}
                  />
                </Pressable>
              </View>

              <View style={styles.inputPass}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textGray}
                  secureTextEntry={!showConfirmPass}
                  style={styles.passField}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPass((p) => !p)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showConfirmPass ? "eye" : "eye-off"}
                    size={18}
                    color={colors.textGray}
                  />
                </Pressable>
              </View>

              <AuthAlert message={error} />

              <View style={styles.rightRow}>
                <Pressable onPress={() => {}}>
                  <Text style={styles.smallPink}>Forgot Password?</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.loginBtn}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.loginText}>
                  {loading ? "Saving..." : "Get Started"}
                </Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Sign in with</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialRow}>
                <Pressable style={styles.socialBtn}>
                  <FontAwesome
                    name="facebook"
                    size={18}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <AntDesign
                    name="google"
                    size={18}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable style={styles.socialBtn}>
                  <Ionicons
                    name="logo-apple"
                    size={18}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              <View style={styles.bottomTextRow}>
                <Text style={{ color: colors.textGray, fontSize: 12 }}>
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => switchTo("/login")} disabled={loading}>
                  <Text style={styles.linkPink}>Log In</Text>
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
    backgroundColor: colors.pinkBg,
  },

  top: { height: 170, paddingTop: 48, paddingHorizontal: 18 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, color: colors.textGrayLight },
  logoSmall: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 12,
  },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 60,
    marginTop: 60,
    minHeight: H - 170,
  },

  h1: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  h2: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 17,
  },

  input: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    fontSize: 12,
    color: colors.textDark,
    backgroundColor: colors.white,
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

  rightRow: { marginTop: 10, alignItems: "flex-end" },
  smallPink: { fontSize: 10, color: colors.primary },

  loginBtn: {
    marginTop: 20,
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

  dividerRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { fontSize: 10, color: colors.textGray },

  socialRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  bottomTextRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkPink: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});