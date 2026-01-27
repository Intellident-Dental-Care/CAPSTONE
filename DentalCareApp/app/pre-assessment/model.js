import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";

export default function Model() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      <Text style={styles.h1}>Pre Assessment</Text>
      <Text style={styles.h2}>
        Select the affected tooth to begin{"\n"}your personalized dental assessment.
      </Text>

      <View style={styles.modelBox}>
        <Image
            source={require("../../assets/tooth_model.png")}
            style={styles.modelBox}
        />
      </View>

      <Text style={styles.toothText}>Tooth: {state.tooth}</Text>

      <Pressable style={styles.nextBtn} onPress={() => router.push("/pre-assessment/questions")}>
        <Text style={styles.nextText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  h1: { marginTop: 12, textAlign: "center", fontSize: 20, fontWeight: "900", color: colors.primary },
  h2: { marginTop: 10, textAlign: "center", fontSize: 11, color: colors.textGray, lineHeight: 16 },

  modelBox: {
    height: 300,
    width: "90%",
    borderRadius: 40,
    resizeMode: "cover",
    alignContent: "center",
    marginTop: 60,
    marginBottom: 10,
    marginHorizontal: 20,
  },

  toothText: { position: "absolute", left: 50, bottom: 65, fontSize: 12, color: colors.textGray },

  nextBtn: {
    position: "absolute",
    right: 24,
    bottom: 50,
    width: 110,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
