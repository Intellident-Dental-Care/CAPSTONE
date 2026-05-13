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
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Confirm Assessment</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Review Your Answers</Text>

        <Text style={styles.subtitle}>
          Please check your selected tooth, uploaded photo, answers, and
          description before AI summary.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Selected Tooth</Text>
          <Text style={styles.cardValue}>
            {state.tooth || "Not specified"}
          </Text>
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
            <View
              key={index}
              style={[
                styles.qaItem,
                index === qaList.length - 1 && {
                  borderBottomWidth: 0,
                  paddingBottom: 0,
                  marginBottom: 0,
                },
              ]}
            >
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

      <View style={styles.bottomWrapper}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingHorizontal: 18,
  },

  headerRow: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  topTitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "900",
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  scrollContent: {
    paddingTop: 22,
    paddingBottom: 115,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 36,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 22,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F4F4F4",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },

  cardLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 10,
  },

  cardValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#333",
  },

  photo: {
    width: 105,
    height: 120,
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
    paddingBottom: 13,
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  question: {
    fontSize: 12.5,
    color: "#2F2F2F",
    fontWeight: "900",
    lineHeight: 18,
  },

  answer: {
    marginTop: 6,
    fontSize: 12.5,
    color: "#666",
    fontWeight: "800",
    lineHeight: 18,
  },

  description: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    fontWeight: "700",
  },

  bottomWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
  },

  bottomRow: {
    flexDirection: "row",
    gap: 12,
  },

  btnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  btnOutlineText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  btnFilled: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  btnFilledText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
});