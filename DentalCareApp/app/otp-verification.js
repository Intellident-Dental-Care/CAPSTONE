import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "./theme/colors";
import { markOtpVerified } from "./_storage/otpStorage";
import { supabase } from "../server/supabaseService";
import { getServerUrl } from "../server/getClientSideUrl";

const OTP_LEN = 6;
const RESEND_SECONDS = 60;

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // optional display (you can pass email from signup)
  const email = typeof params?.email === "string" ? params.email : "";
  const userId = params?.userId;
  const displayTo = email || "+00-1234-567-8912";

  const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
  const inputs = useRef([]);

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isComplete = otp.every((d) => d !== "");
  const code = otp.join("");

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const clearAll = () => {
    setOtp(Array(OTP_LEN).fill(""));
    setTimeout(() => inputs.current[0]?.focus(), 50);
  };

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const v = value.slice(-1); // keep last digit typed

    const next = [...otp];
    next[index] = v;
    setOtp(next);

    if (v && index < OTP_LEN - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key !== "Backspace") return;

    if (!otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
      inputs.current[index - 1]?.focus();
    }
  };

  // ✅ auto-submit when 6 digits are filled
 useEffect(() => {
  if (!isComplete || submitting) return;
  submitOtp(code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isComplete]);


  const submitOtp = async (otpCode) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    Keyboard.dismiss();

    try {
      const serverUrl = await getServerUrl();
      
      if (!serverUrl) {
        setSubmitting(false);
        setError("Connection error. Please check your network.");
        return;
      }
      
      console.log('[OTP] Verifying OTP at:', serverUrl);
      const response = await fetch(`${serverUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: otpCode }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("OTP verified successfully:", result);

        // Mark verified locally and redirect to login
        await markOtpVerified(email);
        router.replace("/login"); // Redirect to login.js after successful OTP verification
      } else {
        const errorResult = await response.json();
        console.error("OTP verification failed:", errorResult);
        setError(errorResult.error || "Invalid OTP. Please try again.");
        clearAll();
      }

      // mark verified for this email (local only)
      await markOtpVerified(email);

      // You said: after signup + OTP, user should LOGIN first
      router.replace("/login");
    } catch (e) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (secondsLeft > 0) return;

    try {
      setSecondsLeft(RESEND_SECONDS);
      setError("");

      const serverUrl = await getServerUrl();
      const response = await fetch(`${serverUrl}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName: params.fullName, userId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("New OTP sent successfully:", result);
        setError("A new OTP has been sent to your email.");
      } else {
        const errorResult = await response.json();
        console.error("Failed to resend OTP:", errorResult);
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP request failed:", error);
      setError("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>

      <View style={styles.illustration} />

      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.sub}>
        Enter the OTP sent to <Text style={styles.bold}>{displayTo}</Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => (inputs.current[i] = r)}
            value={digit}
            onChangeText={(v) => handleChange(v, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={[styles.otpBox, digit && styles.otpBoxActive]}
            returnKeyType="done"
          />
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.submitBtn, (!isComplete || submitting) && { opacity: 0.6 }]}
        onPress={() => isComplete && submitOtp(code)}
        disabled={!isComplete || submitting}
      >
        <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit"}</Text>
      </Pressable>

      <Pressable onPress={clearAll} style={{ marginTop: 10 }}>
        <Text style={styles.clearText}>Clear OTP</Text>
      </Pressable>

      <Text style={styles.resendText}>
        Didn’t receive the OTP?{" "}
        <Text
          onPress={resendOtp}
          style={[styles.resend, secondsLeft > 0 && { opacity: 0.5 }]}
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend"}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
  },

  illustration: {
    marginTop: 80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFE9F1",
  },

  title: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },

  sub: {
    marginTop: 8,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },

  bold: { fontWeight: "900", color: colors.primary },

  otpRow: { marginTop: 30, flexDirection: "row", gap: 10 },

  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    backgroundColor: "#fff",
  },

  otpBoxActive: { borderColor: colors.primary, backgroundColor: "#FFE9F1" },

  error: { marginTop: 10, fontSize: 11, color: colors.primary, fontWeight: "800" },

  submitBtn: {
    marginTop: 22,
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  submitText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  clearText: { fontSize: 11, color: "#888", fontWeight: "700" },

  resendText: { marginTop: 18, fontSize: 11, color: "#888" },
  resend: { color: colors.primary, fontWeight: "900" },
});
