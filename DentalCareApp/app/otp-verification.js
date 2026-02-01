import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "./theme/colors";
import { markOtpVerified } from "./storage/otpStorage";

const OTP_LEN = 6;
const RESEND_SECONDS = 60;

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const email = typeof params?.email === "string" ? params.email : "";
  const displayTo = email ? email : "+00-1234-567-8912";

  const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
  const inputs = useRef([]);

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const code = useMemo(() => otp.join(""), [otp]);
  const isComplete = code.length === OTP_LEN && !code.includes("");

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const v = value.slice(-1); // keep last digit

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
      inputs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
    }
  };

  // ✅ Auto submit
  useEffect(() => {
    if (!isComplete) return;
    submitOtp(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const submitOtp = async (otpCode) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    Keyboard.dismiss();

    try {
      // ✅ TEMP: accept any 6-digit OTP
      // replace with real OTP validation later
      await new Promise((r) => setTimeout(r, 600));

      // mark verified for this email (local)
      await markOtpVerified(email);

      // You said: after signup, user still needs to LOGIN
      router.replace("/login");
    } catch (e) {
      setSubmitting(false);
      setError("Invalid OTP. Please try again.");
    }
  };

  const resendOtp = async () => {
    if (secondsLeft > 0) return;

    // TODO: call your real resend OTP here later
    setSecondsLeft(RESEND_SECONDS);
  };

  const clearAll = () => {
    setOtp(Array(OTP_LEN).fill(""));
    inputs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>

      {/* pink illustration placeholder */}
      <View style={styles.illustration} />

      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.sub}>
        Enter the OTP sent to <Text style={styles.bold}>{displayTo}</Text>
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => {
          const active = !!digit;
          return (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpBox, active && styles.otpBoxActive]}
              returnKeyType="done"
            />
          );
        })}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {/* optional button (auto submit already works) */}
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
