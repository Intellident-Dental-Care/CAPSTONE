import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

export default function GetStarted() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />

      <Text style={styles.title}>Let’s Get Started</Text>
      <Text style={styles.sub}>Gentle hands. Bright Smiles</Text>

      <View style={{ height: 26 }} />

      <Pressable style={[styles.btn, styles.outline]} onPress={() => router.push("/login")}>
        <Text style={[styles.btnText, { color: colors.primary }]}>Log In</Text>
      </Pressable>

      <View style={{ height: 12 }} />

      <Pressable style={[styles.btn, styles.filled]} onPress={() => router.push("/signup")}>
        <Text style={[styles.btnText, { color: colors.white }]}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    backgroundColor: colors.pinkBg, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingHorizontal: 24 
  },
  
  logo: { 
    width: 170, 
    height: 170, 
    resizeMode: "contain", 
    marginBottom: 18 
  },

  title: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: colors.primary 
  },
  
  sub: { 
    marginTop: 6, 
    fontSize: 12, 
    color: colors.textGray 
  },

  btn: { 
    width: "78%", 
    height: 44, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  outline: { 
    borderWidth: 1.5, 
    borderColor: colors.primary, 
    backgroundColor: "transparent" 
  },

  filled: { 
    backgroundColor: colors.primary 
  },

  btnText: { 
    fontSize: 13, 
    fontWeight: "700" 
  },
});
