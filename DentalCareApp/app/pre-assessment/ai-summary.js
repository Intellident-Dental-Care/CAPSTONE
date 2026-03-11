import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";


const QUESTIONS = [
  "Do you feel tooth pain when biting or chewing?",
  "Do you experience sensitivity to cold drinks?",
  "Do you experience sensitivity to hot food/drinks?",
  "Do your gums bleed when brushing or flossing?",
  "Do you notice swelling in the gums or face?",
  "Do you have bad breath even after brushing?",
  "Do you see a visible hole or dark spot on the tooth?",
  "Do you feel pain that wakes you up at night?",
  "Do you feel pain when eating sweet food?",
  "Have you had a filling or dental treatment on this tooth before?",
];

export default function AISummary() {
  const router = useRouter();
  const { state } = usePreAssessment();

  const qaList = useMemo(() => {
    return QUESTIONS.map((qText, i) => {
      const ans = state.answers?.[i] || "-";
      return { qText, ans };
    });
  }, [state.answers]);

  return (
    <View style={styles.container}>
     
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Pre Assessment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.h1}>AI ASSESSMENT</Text>

      <View style={styles.teethBox}>
        <Image source={require("../../assets/tooth_model.png")} style={styles.toothImage} />
      </View>

      <Text style={styles.tooth}>Tooth: {state.tooth}</Text>

      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Summary of Pre Assessment</Text>

        <View style={styles.summaryBox}>
          {qaList.map((x, i) => (
            <View key={i} style={styles.qaBlock}>
              <Text style={styles.qLine}>
                <Text style={styles.qLabel}>Question: </Text>
                {x.qText}
              </Text>

              <Text style={styles.aLine}>
                <Text style={styles.aLabel}>    Answer: </Text>
                {x.ans}
              </Text>
            </View>
          ))}

          <View style={{ height: 12 }} />

          <Text style={styles.qLine}>
            <Text style={styles.qLabel}>Question: </Text>
            Kindly describe any symptoms or discomfort you are currently experiencing.
          </Text>
          <Text style={styles.aLine}>
            <Text style={styles.aLabel}>    Answer: </Text>
            {state.description?.trim() ? state.description.trim() : "-"}
          </Text>
        </View>

        <Text style={[styles.section, { marginTop: 18 }]}>Suggested Treatment and Price</Text>

        <View style={styles.treatBox}>
          <Text style={styles.treatTitle}>Tooth Cleaning</Text>
          <Text style={styles.treatSub}>Starting Price: 10000000</Text>
        </View>
      </ScrollView>

      
      <View style={styles.footer}>
        <Pressable style={styles.btnOutline} onPress={() => router.replace("/home")}>
          <Text style={styles.btnOutlineText}>Back to Home</Text>
        </Pressable>

        <Pressable style={styles.btnFilled} onPress={() => router.push("/booking")}>
          <Text style={styles.btnFilledText}>Book Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
    paddingHorizontal: 30,
  },

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
  headerSpacer: { width: 36 },
  topTitle: { fontSize: 12, color: colors.textGray, fontWeight: "600", textAlign: "center" },

  h1: { marginTop: 10, fontSize: 25, fontWeight: "900", color: colors.primary },

  teethBox: { marginTop: 14, height: 180, alignItems: "center", justifyContent: "center" },
  toothImage: { width: 220, height: 160, resizeMode: "contain" },
  tooth: { marginTop: 8, marginLeft: 20, fontSize: 12, color: colors.textGray, fontWeight: "700" },

  scroll: { flex: 1, marginTop: 10 },
  scrollContent: { paddingBottom: 12 }, 

  section: { marginTop: 8, fontSize: 12, fontWeight: "900", color: colors.textGray },

  summaryBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  qaBlock: { marginBottom: 12 },

  qLine: { fontSize: 11, color: "#777", fontWeight: "800", lineHeight: 16 },
  aLine: { marginTop: 4, fontSize: 11, color: "#999", lineHeight: 16 },

  qLabel: { color: colors.primary, fontWeight: "900" },
  aLabel: { color: "#666", fontWeight: "900" },

  treatBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  treatTitle: { fontSize: 11, fontWeight: "900", color: colors.primary },
  treatSub: { marginTop: 4, fontSize: 10, color: "#888" },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    marginBottom: 30,
    marginTop: 10
  },

  btnOutline: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnOutlineText: { color: colors.primary, fontWeight: "800", fontSize: 11 },

  btnFilled: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFilledText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
