import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

export default function PreAssessLanding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      <View style={styles.cardImage}>
        <Image
            source={require("../../assets/index_assessment.jpg")}
            style={styles.assessmentImage}
        />
    </View>


      <Text style={styles.title}>Pre Assessment</Text>
      <Text style={styles.sub}>Start your assessment and take control of your oral health.</Text>

      <Pressable style={styles.proceedBtn} onPress={() => router.push("/pre-assessment/model")}>
        <Text style={styles.proceedText}>Proceed</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  cardImage: { marginTop: 10, marginHorizontal: 13 },
  assessmentImage: {
    height: 450,
    width: "100%",
    borderRadius: 40,
    resizeMode: "cover",
  },


  title: { marginTop: 18, fontSize: 20, fontWeight: "900", color: colors.primary, marginLeft: 15 },
  sub: { marginTop: 6, fontSize: 11, color: colors.textGray, width: "70%", marginLeft: 15 },

  proceedBtn: {
    position: "absolute",
    right: 24,
    bottom: 35,
    width: 120,
    height: 46,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  proceedText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
