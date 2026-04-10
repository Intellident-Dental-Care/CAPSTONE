import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";
import { supabase } from "../../server/supabaseService"; // <-- Added Supabase import

export default function Description() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();
  const [saving, setSaving] = useState(false); // <-- Added loading state for safety

  const canNext = state.description && state.description.trim().length > 0;

  // <-- Added handleNext function to UPDATE the database record
  const handleNext = async () => {
    if (!canNext || saving) return;

    setSaving(true);
    try {
      if (state.preassessmentId) {
        // Update the existing pre-assessment record with the description
        const { error } = await supabase
          .from("patient_preassessment")
          .update({ description: state.description.trim() })
          .eq("id", state.preassessmentId);

        if (error) {
          console.error("Error saving description to Supabase:", error);
        }
      }
      
      // Proceed to the photo screen regardless
      router.push("/pre-assessment/photo");
    } catch (err) {
      console.error("Network error saving description:", err);
      router.push("/pre-assessment/photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Pre Assessment Questions</Text>

       
        <View style={styles.headerSpacer} />
      </View>


      <View style={styles.progressRow}>
        <View style={[styles.progressLine, { width: "100%" }]} />
      </View>

      <Text style={styles.question}>
        Kindly describe any symptoms or discomfort you are currently experiencing.
      </Text>

      <TextInput
        placeholder="Type your description here..."
        placeholderTextColor={colors.textGray}
        style={styles.box}
        multiline
        value={state.description || ""}
        onChangeText={(t) => dispatch({ type: "SET_DESCRIPTION", payload: t })}
      />

      {!canNext && <Text style={styles.warn}>Please add a description to continue.</Text>}

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        {/* <-- Updated Pressable to use handleNext and respect saving state */}
        <Pressable
          style={[styles.btnFilled, (!canNext || saving) && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={saving}
        >
          <Text style={styles.btnFilledText}>Next</Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>Description</Text>
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
    width: 36, 
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

  box: {
    marginTop: 16,
    height: 260,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    fontSize: 12,
    color: "#444",
    textAlignVertical: "top",
    marginHorizontal: 10
  },

  warn: { marginTop: 10, marginLeft: 15, fontSize: 10, color: colors.primary },

  bottomRow: { position: "absolute", left: 18, right: 18, bottom: 65, flexDirection: "row", gap: 12 },
  btnOutline: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnOutlineText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  btnFilled: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnFilledText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  footerText: { position: "absolute", bottom: 35, alignSelf: "center", fontSize: 10, color: colors.textGray },
});