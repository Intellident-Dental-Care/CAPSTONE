import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
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

export default function Confirmation() {
  const router = useRouter();
  const { state } = usePreAssessment();

  const photos = Array.isArray(state.photoUri)
    ? state.photoUri
    : state.photoUri
    ? [state.photoUri]
    : [];

  const qaList = useMemo(() => {
    return QUESTIONS.map((question, index) => ({
      question,
      answer: state.answers?.[index] || "Not answered",
    }));
  }, [state.answers]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Confirm Assessment</Text>

        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.title}>Review Your Answers</Text>
      <Text style={styles.subtitle}>
        Please check your selected tooth, uploaded photo, answers, and description before AI summary.
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Selected Tooth</Text>
          <Text style={styles.cardValue}>{state.tooth || "Not specified"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Uploaded Photo</Text>

          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No photo uploaded.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Questionnaire</Text>

          {qaList.map((item, index) => (
            <View key={index} style={styles.qaItem}>
              <Text style={styles.question}>
                Q{index + 1}: {item.question}
              </Text>
              <Text style={styles.answer}>A: {item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Patient Description</Text>
          <Text style={styles.description}>
            {state.description?.trim() || "No description provided."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.btnFilled}
          onPress={() => router.push("/pre-assessment/ai-summary")}
        >
          <Text style={styles.btnFilledText}>Proceed</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 8,
    paddingHorizontal: 18,
  },

  headerRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  topTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 38,
  },

  title: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    fontWeight: "600",
  },

  scrollContent: {
    paddingTop: 18,
    paddingBottom: 160,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },

  photo: {
    width: 95,
    height: 110,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: "#EEE",
  },

  emptyText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },

  qaItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  question: {
    fontSize: 12,
    color: "#333",
    fontWeight: "800",
    lineHeight: 17,
  },

  answer: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
    fontWeight: "700",
  },

  description: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
    fontWeight: "600",
  },

  bottomRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 45,
    flexDirection: "row",
    gap: 12,
  },

  btnOutline: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  btnOutlineText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 12,
  },

  btnFilled: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  btnFilledText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
});