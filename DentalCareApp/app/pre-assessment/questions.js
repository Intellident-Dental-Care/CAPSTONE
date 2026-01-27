import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";

const QUESTIONS = [
  { q: "Do you feel tooth pain when biting or chewing?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do you experience sensitivity to cold drinks?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do you experience sensitivity to hot food/drinks?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do your gums bleed when brushing or flossing?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do you notice swelling in the gums or face?", options: ["Yes", "No", "A little"] },
  { q: "Do you have bad breath even after brushing?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do you see a visible hole or dark spot on the tooth?", options: ["Yes", "No", "Not sure"] },
  { q: "Do you feel pain that wakes you up at night?", options: ["Yes", "No", "Sometimes"] },
  { q: "Do you feel pain when eating sweet food?", options: ["Yes", "No", "Sometimes"] },
  { q: "Have you had a filling or dental treatment on this tooth before?", options: ["Yes", "No", "Not sure"] },
];

export default function Questions() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();
  const [idx, setIdx] = useState(0);

  const current = QUESTIONS[idx];
  const selected = state.answers[idx] || "";

  const canNext = selected.length > 0;

  const next = () => {
    if (!canNext) return;
    if (idx === QUESTIONS.length - 1) router.push("/pre-assessment/description");
    else setIdx((p) => p + 1);
  };

  const back = () => {
    if (idx === 0) router.back();
    else setIdx((p) => p - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={back}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Pre Assessment Questions</Text>

        <View style={styles.headerSpacer} />
      </View>


      <View style={styles.progressRow}>
        <View style={[styles.progressLine, { width: `${((idx + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>

      <Text style={styles.question}>{current.q}</Text>

      <View style={{ height: 14 }} />

      {current.options.map((opt) => {
        const active = opt === selected;
        return (
          <Pressable
            key={opt}
            style={[styles.optionRow, active && styles.optionActive]}
            onPress={() => dispatch({ type: "SET_ANSWER", payload: { qIndex: idx, answer: opt } })}
          >
            <View style={[styles.check, active && styles.checkActive]}>
              {active ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        );
      })}

      {!canNext && <Text style={styles.warn}>Please select an answer to continue.</Text>}

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={back}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        <Pressable style={[styles.btnFilled, !canNext && { opacity: 0.5 }]} onPress={next}>
          <Text style={styles.btnFilledText}>Next</Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Question {idx + 1} of {QUESTIONS.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  backIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  topTitle: { textAlign: "center", fontSize: 10, color: colors.textGray },

  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
},

backIcon: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
},

topTitle: {
  fontSize: 12,
  color: colors.textGray,
  fontWeight: "600",
  textAlign: "center",
},

headerSpacer: {
  width: 36, 
},


  progressRow: { marginTop: 18, marginBottom: 10, height: 3, backgroundColor: "#EAD7E0", borderRadius: 3, overflow: "hidden" },
  progressLine: { height: 3, backgroundColor: colors.primary },

  question: { marginTop: 22, marginBottom: 22, fontSize: 40, fontWeight: "900", color: colors.primary, width: "90%" },

  optionRow: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
    marginHorizontal: 10,
    gap: 10,
  },
  optionActive: { backgroundColor: "#EDEDED" },
  check: { width: 18, height: 18, borderRadius: 5, backgroundColor: colors.primary, opacity: 0.25, alignItems: "center", justifyContent: "center" },
  checkActive: { opacity: 1 },
  optionText: { fontSize: 12, color: "#666", fontWeight: "700" },

  warn: { marginLeft: 15, fontSize: 10, color: colors.primary },

  bottomRow: { position: "absolute", left: 18, right: 18, bottom: 65, flexDirection: "row", gap: 12 },
  btnOutline: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnOutlineText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  btnFilled: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnFilledText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  footerText: { position: "absolute", bottom: 35, alignSelf: "center", fontSize: 10, color: colors.textGray },
});
