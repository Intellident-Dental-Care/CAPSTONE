import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";
import { supabase } from "../../server/supabaseService";
import { getServerUrl } from "../../server/getClientSideUrl";
import { getRecommendedServiceCriteria } from "../../server/AIRecommendation/serviceMapper";

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

  const [analyzing, setAnalyzing] = useState(true);
  const [detectedProblem, setDetectedProblem] = useState("Unknown");
  const [problemDescription, setProblemDescription] = useState(""); 
  const [suggestedService, setSuggestedService] = useState("Analyzing...");
  const [suggestedPrice, setSuggestedPrice] = useState("...");
  const [showAnswerSummary, setShowAnswerSummary] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    try {
      const imageToAnalyze = Array.isArray(state.photoUri)
        ? state.photoUri[0]
        : state.photoUri;

      if (!imageToAnalyze) throw new Error("No photo provided");

      const baseNodeUrl = await getServerUrl();
      const AI_API_URL = baseNodeUrl.replace(/:[0-9]+/, ":8000") + "/analyze";

      const formData = new FormData();
      formData.append("file", {
        uri: imageToAnalyze,
        name: "tooth.jpg",
        type: "image/jpeg",
      });

      const aiResponse = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const aiData = await aiResponse.json();
      
      const problem = aiData.detected_problem || "Normal";
      // NEW: Extract the description from your Python backend
      const description = aiData.description || ""; 

      setDetectedProblem(problem);
      setProblemDescription(description);

      const criteria = getRecommendedServiceCriteria(problem);

      const { data } = await supabase
        .from("dental_services")
        .select("*")
        .eq("is_active", true)
        .ilike(criteria.field, `%${criteria.value}%`)
        .order("price_min", { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setSuggestedService(data.name);
        setSuggestedPrice(data.price_display);
        dispatch({ type: "SET_SUGGESTED_SERVICE", payload: data.name });
      } else {
        setSuggestedService("Dental Consultation Required");
        setSuggestedPrice("Price varies");
      }
    } catch (error) {
      console.error("AI Analysis Error: ", error);
      setDetectedProblem("Analysis Error");
      setProblemDescription(""); // Clear description on error
      setSuggestedService("Unable to determine service");
      setSuggestedPrice("-");
    } finally {
      setAnalyzing(false);
    }
  };

  const qaList = useMemo(() => {
    return QUESTIONS.map((qText, i) => ({
      qText,
      ans: state.answers?.[i] || "-",
    }));
  }, [state.answers]);

  if (analyzing) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>IntelliDent AI is analyzing...</Text>
        <Text style={styles.loadingSub}>
          Please wait while we review your uploaded tooth photo.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>AI Assessment</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>Suggested Treatment</Text>
        <Text style={styles.pageSub}>
          Based on your uploaded photo and pre-assessment answers.
        </Text>

        <View style={styles.resultCard}>
          <View style={styles.resultIcon}>
            <Ionicons name="sparkles-outline" size={24} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.resultLabel}>Recommended Service</Text>
            <Text style={styles.resultTitle}>{suggestedService}</Text>
            <Text style={styles.resultPrice}>{suggestedPrice}</Text>
          </View>
        </View>

        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisTop}>
            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            <Text style={styles.diagnosisLabel}>AI Diagnosis</Text>
          </View>

          <Text style={styles.diagnosisText}>
            Condition Found: {detectedProblem.toUpperCase()}
          </Text>
          
          {problemDescription ? (
            <Text style={[styles.diagnosisText, { marginTop: 4, fontWeight: "600", color: "#666", lineHeight: 18 }]}>
              Description: {problemDescription}
            </Text>
          ) : null}
        </View>

        <View style={styles.toothCard}>
          <WebView
            source={{
              uri: "https://intellident-3d-viewer.vercel.app/?mode=protected",
            }}
            style={styles.toothViewer}
            scrollEnabled={false}
            injectedJavaScript={`setTimeout(function() { window.postMessage({ type: 'SELECT_TOOTH', tooth: '${state.tooth}' }, '*'); }, 1000); true;`}
            containerStyle={{ backgroundColor: "transparent" }}
            cacheEnabled
            domStorageEnabled
          />

          <View style={styles.toothInfo}>
            <Text style={styles.toothLabel}>Selected Tooth</Text>
            <Text style={styles.toothValue}>{state.tooth}</Text>
          </View>
        </View>

        <Pressable
          style={styles.summaryToggle}
          onPress={() => setShowAnswerSummary((prev) => !prev)}
        >
          <View style={styles.summaryToggleLeft}>
            <Ionicons
              name="document-text-outline"
              size={19}
              color={colors.primary}
            />
            <Text style={styles.summaryToggleText}>
              {showAnswerSummary ? "Hide Answer Summary" : "View Answer Summary"}
            </Text>
          </View>

          <Ionicons
            name={showAnswerSummary ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.primary}
          />
        </Pressable>

        {showAnswerSummary && (
          <View style={styles.summaryBox}>
            {qaList.map((x, i) => (
              <View key={i} style={styles.qaBlock}>
                <Text style={styles.qLine}>
                  Q{i + 1}: {x.qText}
                </Text>
                <Text style={styles.aLine}>A: {x.ans}</Text>
              </View>
            ))}

            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Patient Description</Text>
              <Text style={styles.descriptionText}>
                {state.description?.trim() ? state.description.trim() : "-"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.btnOutline} onPress={() => router.replace("/home")}>
          <Text style={styles.btnOutlineText}>Back Home</Text>
        </Pressable>

        <Pressable
          style={styles.btnFilled}
          onPress={() =>
            router.push({
              pathname: "/booking",
              params: {
                service: suggestedService,
                preassessmentId: state.preassessmentId,
              },
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
    backgroundColor: "#FAFAFA",
    paddingTop: 8,
    paddingHorizontal: 18,
  },

  loadingWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTitle: {
    marginTop: 20,
    color: colors.primary,
    fontWeight: "900",
    fontSize: 15,
  },

  loadingSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 30,
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

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 110,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
  },

  pageSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    fontWeight: "600",
  },

  resultCard: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  resultIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  resultLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
  },

  resultTitle: {
    marginTop: 4,
    fontSize: 17,
    color: "#fff",
    fontWeight: "900",
  },

  resultPrice: {
    marginTop: 4,
    fontSize: 14,
    color: "#fff",
    fontWeight: "800",
  },

  diagnosisCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },

  diagnosisTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  diagnosisLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.primary,
  },

  diagnosisText: {
    marginTop: 8,
    fontSize: 13,
    color: "#444",
    fontWeight: "800",
  },

  toothCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F5F5F5",
    overflow: "hidden",
  },

  toothViewer: {
    height: 190,
    backgroundColor: "transparent",
  },

  toothInfo: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },

  toothLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "700",
  },

  toothValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#333",
    fontWeight: "900",
  },

  summaryToggle: {
    marginTop: 14,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  summaryToggleText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "900",
  },

  summaryBox: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2F2F2",
  },

  qaBlock: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  qLine: {
    fontSize: 12,
    color: "#333",
    fontWeight: "800",
    lineHeight: 18,
  },

  aLine: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
    fontWeight: "700",
    lineHeight: 18,
  },

  descriptionBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 12,
  },

  descriptionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  descriptionText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    fontWeight: "600",
  },

  footer: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 24,
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
    fontSize: 13,
    fontWeight: "900",
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
    fontSize: 13,
    fontWeight: "900",
  },
});