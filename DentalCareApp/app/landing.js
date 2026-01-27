import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "./theme/colors";

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backRow} onPress={() => router.replace("/get-started")}>
        <Feather name="chevron-left" size={18} color={colors.textGray} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Landing Page</Text>
      <Text style={styles.sub}>(blank for now)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 52, paddingHorizontal: 18 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 12, color: colors.textGray },
  title: { marginTop: 24, fontSize: 22, fontWeight: "800", color: colors.textDark },
  sub: { marginTop: 6, fontSize: 12, color: colors.textGray },
});
