import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
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
  const { state, dispatch } = usePreAssessment();

  const qaList = useMemo(() => {
    return QUESTIONS.map((qText, i) => {
      const ans = state.answers?.[i] || "-";
      return { qText, ans };
    });
  }, [state.answers]);

  const suggestedService = "Tooth Cleaning";
  const suggestedPrice = "Starting Price: 1000";

  useEffect(() => {
    dispatch({
      type: "SET_SUGGESTED_SERVICE",
      payload: suggestedService,
    });
  }, [dispatch, suggestedService]);

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
        <WebView
          source={{ uri: "https://intellident-3d-viewer.vercel.app/?mode=protected" }}
          style={styles.toothImage}
          scrollEnabled={false}
          injectedJavaScript={`
            setTimeout(function() {
              window.postMessage({ type: 'SELECT_TOOTH', tooth: '${state.tooth}' }, '*');
            }, 1000);
            true;
          `}
          containerStyle={{ backgroundColor: 'transparent' }}
          cacheEnabled={true}
          domStorageEnabled={true}
        />
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
            Kindly describe any symptoms or discomfort you are currently
            experiencing.
          </Text>

          <Text style={styles.aLine}>
            <Text style={styles.aLabel}>    Answer: </Text>
            {state.description?.trim() ? state.description.trim() : "-"}
          </Text>
        </View>

        <Text style={[styles.section, { marginTop: 18 }]}>
          Suggested Treatment and Price
        </Text>

        <View style={styles.treatBox}>
          <Text style={styles.treatTitle}>{suggestedService}</Text>
          <Text style={styles.treatSub}>{suggestedPrice}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.btnOutline}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.btnOutlineText}>Back to Home</Text>
        </Pressable>

        <Pressable
          style={styles.btnFilled}
          onPress={() =>
            router.push({
              pathname: "/booking",
              params: { service: suggestedService, preassessmentId: state.preassessmentId },
            })
          }
        >
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
  headerSpacer: {
    width: 36,
  },
  topTitle: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "center",
  },
  h1: {
    marginTop: 10,
    fontSize: 25,
    fontWeight: "900",
    color: colors.primary,
  },
  teethBox: {
    marginTop: 14,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    overflow: 'hidden'
  },
  toothImage: {
    width: 300,
    height: 200,
  },
  tooth: {
    marginTop: 8,
    marginLeft: 20,
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "700",
  },
  scroll: {
    marginTop: 16,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: "#F6F6F6",
    borderRadius: 18,
    padding: 14,
  },
  qaBlock: {
    marginBottom: 12,
  },
  qLine: {
    fontSize: 11,
    color: "#444",
    lineHeight: 17,
  },
  aLine: {
    marginTop: 4,
    fontSize: 11,
    color: "#666",
    lineHeight: 17,
  },
  qLabel: {
    fontWeight: "800",
    color: colors.primary,
  },
  aLabel: {
    fontWeight: "800",
    color: colors.primary,
  },
  treatBox: {
    backgroundColor: "#FFE9F1",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  treatTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
  },
  treatSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  btnOutline: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnOutlineText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  btnFilled: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFilledText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});