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
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors } from "./theme/colors";
import AuthAlert from "./components/authAlert";
import { supabase } from "../server/supabaseService";
import { getServerUrl } from "../server/getClientSideUrl";
import { validateSignupInput } from "../server/Security/authentication/inputValidator";


const { height: H } = Dimensions.get("window");
const isSmallPhone = H < 760;

export default function Signup() {

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const router = useRouter();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(null);

  const translateY = useRef(new Animated.Value(H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const preloadServer = async () => {
      try {
        const url = await getServerUrl();
        setServerUrl(url);
      } catch (error) {
        console.log("Server pre-load failed:", error);
      }
    };

    preloadServer();
  }, []);

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

  const handleSignup = async () => {
    setError("");

    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }

    const validation = validateSignupInput({
      email,
      password,
      confirmPassword,
      fullName,
    });

    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    const { email: cleanEmail, fullName: cleanFullName, password: cleanPassword } =
      validation.sanitized;

    try {
      setLoading(true);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      // Get the server URL - if this fails, we're likely on a new network
      const url = serverUrl || (await getServerUrl());
      
      if (!url) {
        setLoading(false);
        setError(
          "Unable to connect to email service. Please check your network and try again."
        );
        return;
      }

      console.log('[Signup] Sending verification to:', url);
      const emailResponse = await fetch(`${url}/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: cleanFullName,
          userId: signUpData.user?.id,
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined,
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text().catch(() => 'Unknown error');
        console.error('[Signup] Email failed:', errorData);
        setLoading(false);
        setError(
          "Account created but failed to send verification email. Please try resending."
        );
        return;
      }

      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
        Animated.timing(logoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        router.back();
        setTimeout(() => {
          router.push({
            pathname: "/otp-verification",
            params: {
              email: cleanEmail,
              userId: signUpData.user?.id,
              fullName: cleanFullName,
            },
          });
        }, 50);
      });
    } catch (e) {
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
              <Text style={styles.h1}>Create Your Account</Text>

              <Text style={styles.h2}>
                Safe and Quality Dentistry.{"\n"}We take your health and safety seriously.
              </Text>

              <TextInput
                placeholder="Enter Full Name"
                placeholderTextColor={colors.textGray}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

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

              <View style={styles.termsRow}>
                <Pressable
                  style={[styles.termsCheckbox, agreedToTerms && styles.termsCheckboxActive]}
                  onPress={() => setAgreedToTerms((prev) => !prev)}
                >
                  {agreedToTerms ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : null}
                </Pressable>

                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => router.push("/profile/terms-and-conditions")}
                  >
                    Terms and Conditions
                  </Text>
                </Text>
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

              <View style={styles.bottomTextRow}>
                <Text style={styles.bottomPlain}>Already have an account? </Text>

                <Pressable onPress={() => switchTo("/login")} disabled={loading}>
                  <Text style={styles.linkPink}>Log In</Text>
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
    paddingTop: isSmallPhone ? 16 : 20,
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
    width: isSmallPhone ? 92 : 112,
    height: isSmallPhone ? 92 : 112,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: isSmallPhone ? 2 : 6,
    marginBottom: isSmallPhone ? 6 : 10,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingTop: isSmallPhone ? 14 : 18,
    paddingBottom: isSmallPhone ? 12 : 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 7,
  },

  h1: {
    fontSize: isSmallPhone ? 20 : 23,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  h2: {
    marginTop: 5,
    fontSize: isSmallPhone ? 10 : 11,
    lineHeight: isSmallPhone ? 15 : 17,
    color: "#8A8A8A",
    textAlign: "center",
    fontWeight: "600",
  },

  input: {
    height: isSmallPhone ? 40 : 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2D7E3",
    paddingHorizontal: 15,
    fontSize: 12,
    color: colors.textDark,
    backgroundColor: "#FFF9FB",
    marginTop: isSmallPhone ? 10 : 12,
  },

  inputPass: {
    marginTop: isSmallPhone ? 10 : 12,
    height: isSmallPhone ? 40 : 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2D7E3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
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

  rightRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },

  smallPink: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "700",
  },

  loginBtn: {
    marginTop: isSmallPhone ? 12 : 16,
    height: isSmallPhone ? 44 : 48,
    borderRadius: 17,
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
    fontSize: 13,
    fontWeight: "900",
  },

  dividerRow: {
    marginTop: isSmallPhone ? 12 : 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#EFE4E8",
  },

  dividerText: {
    fontSize: 10,
    color: "#A0A0A0",
  },

  socialRow: {
    marginTop: isSmallPhone ? 10 : 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },

  socialBtn: {
    width: isSmallPhone ? 38 : 42,
    height: isSmallPhone ? 38 : 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1E3EA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  bottomTextRow: {
    marginTop: isSmallPhone ? 10 : 14,
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

 termsRow: {
  marginTop: 12,
  flexDirection: "row",
  alignItems: "center", // centers text with checkbox
},

termsCheckbox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1.5,
  borderColor: colors.primary,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 10,
},

termsCheckboxActive: {
  backgroundColor: colors.primary,
},

termsText: {
  flex: 1,
  fontSize: 11,
  color: colors.textGray,
  fontWeight: "600",
},

termsLink: {
  color: colors.primary,
  fontWeight: "900",
  textDecorationLine: "underline",
},
});