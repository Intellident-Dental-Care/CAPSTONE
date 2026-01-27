import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function BookNow() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backIcon} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      <Text style={styles.title}>Book Now (Blank)</Text>
      <Text style={styles.sub}>Temporary page. You can send the design later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  backIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 20, fontSize: 18, fontWeight: "900", color: colors.primary },
  sub: { marginTop: 8, fontSize: 12, color: colors.textGray },
});
