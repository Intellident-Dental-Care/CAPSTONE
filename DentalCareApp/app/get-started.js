import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

export default function GetStarted() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFF4F8", "#FFEAF2"]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.glowBottom} />

      <View style={styles.logoWrap}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>Welcome to IntelliDent</Text>

      <Text style={styles.sub}>
        Smarter dental care with seamless appointments,{"\n"}
        personalized records, and modern patient experience.
      </Text>

      <View style={styles.buttonWrap}>
        <Pressable
          style={[styles.btn, styles.outlineBtn]}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.outlineText}>Log In</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.filledBtn]}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.filledText}>Create Account</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  glowBottom: {
    position: "absolute",
    bottom: -120,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFE8F1",
    opacity: 0.5,
  },

  logoWrap: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 10,
  },

  logo: {
    width: 170,
    height: 170,
    resizeMode: "contain",
  },

  title: {
    marginTop: 36,
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  sub: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 22,
    color: "#7D7D7D",
    textAlign: "center",
    fontWeight: "500",
  },

  buttonWrap: {
    width: "100%",
    marginTop: 42,
  },

  btn: {
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  outlineBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#F5D2E0",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  filledBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,

    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  outlineText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },

  filledText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});