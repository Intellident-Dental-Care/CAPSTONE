import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";

export default function Photo() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
              <Pressable style={styles.backIcon} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </Pressable>
      
              <Text style={styles.topTitle}>Pre Assessment Questions</Text>
      
              {/* spacer to keep title centered */}
              <View style={styles.headerSpacer} />
            </View>

      <View style={styles.progressRow}>
        <View style={[styles.progressLine, { width: "100%" }]} />
      </View>

      <Text style={styles.question}>Please upload a clear photo of the affected tooth.</Text>
      <Text style={styles.small}>
        This image will be used solely for your pre-assessment and will remain confidential.
      </Text>

      <View style={styles.uploadBox}>
        <Ionicons name="image-outline" size={22} color={colors.textGray} />
        <Text style={{ marginTop: 8, fontSize: 10, color: colors.textGray }}>Select a file</Text>
      </View>

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={styles.cameraBtn}>
        <Ionicons name="camera-outline" size={14} color="#fff" />
        <Text style={styles.cameraText}>Open Camera and Take a photo</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        {/* ✅ allowed even if no photo */}
        <Pressable style={styles.btnFilled} onPress={() => router.push("/pre-assessment/ai-summary")}>
          <Text style={styles.btnFilledText}>Next</Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>Upload Photo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  backIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
 },

    headerSpacer: {
    width: 36, // same width as backIcon
 },

    topTitle: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "center",
 },

  progressRow: { marginTop: 18, marginBottom: 10, height: 3, backgroundColor: "#EAD7E0", borderRadius: 3, overflow: "hidden" },
  progressLine: { height: 3, backgroundColor: colors.primary },

  question: { marginTop: 22, marginBottom: 10, fontSize: 40, fontWeight: "900", color: colors.primary, width: "90%" },
  small: { marginTop: 10, fontSize: 11, color: colors.textGray, width: "85%", lineHeight: 16 },

  uploadBox: {
    marginTop: 18,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  orRow: { marginTop: 30, flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: "#EAD7E0" },
  orText: { fontSize: 10, color: colors.textGray },

  cameraBtn: {
    marginTop: 28,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cameraText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  bottomRow: { position: "absolute", left: 18, right: 18, bottom: 65, flexDirection: "row", gap: 12 },
  btnOutline: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnOutlineText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  btnFilled: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnFilledText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  footerText: { position: "absolute", bottom: 35, alignSelf: "center", fontSize: 10, color: colors.textGray },
});
