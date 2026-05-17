import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";
import { supabase } from "../../server/supabaseService";
import { getCurrentUser } from "../../server/supabaseService";
import { getCurrentActiveProfileForSession } from "../_storage/authStorage";
import { validatePreAssessmentSubmission } from "../../server/Security/PreAssessment/preAssessmentValidator";

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

export default function Questions() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();

  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("questionnaire")
        .select("*")
        .eq("is_active", true)
        .order("question_order");

      if (error) throw error;

      const transformedQuestions = (data || []).map((item) => ({
        q: item.question_text,
        options: item.options || [],
      }));

      setQuestions(transformedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <Text style={styles.errorText}>
          {error ? `Error: ${error}` : "No questions available"}
        </Text>

        <Pressable style={styles.btnFilledSingle} onPress={fetchQuestions}>
          <Text style={styles.btnFilledText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const current = questions[idx];
  const selected = state.answers?.[idx] || "";
  const canNext = selected.length > 0;

  const next = async () => {
    if (!canNext || saving) return;

    if (idx === questions.length - 1) {
      setSaving(true);

      try {
        const answersArray = questions.map((_, qIndex) => ({
          questionId: qIndex + 1,
          answer: state.answers?.[qIndex] || "",
          answerType: "option",
        }));

        const validation = validatePreAssessmentSubmission(answersArray);

        if (!validation.isValid) {
          Alert.alert("Validation Error", validation.errors[0]);
          setSaving(false);
          return;
        }

        const user = await getCurrentUser();
        const activeProfile = await getCurrentActiveProfileForSession();

        if (!user) {
          Alert.alert("Error", "No logged-in user found. Please sign in again.");
          setSaving(false);
          return;
        }

        const profileId = isUuid(activeProfile?.id) ? activeProfile.id : null;

        const { data, error } = await supabase
          .from("patient_preassessment")
          .insert([
            {
              user_id: user.id,
              profile_id: profileId,
              answers: validation.sanitized,
              description: null,
              tooth_selected:
                state.tooth === "Not specified" ? null : state.tooth,
              uploaded_images: state.remotePhotoUris || [], 
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error saving preassessment:", error);
          Alert.alert(
            "Error",
            error.message || "Failed to save pre-assessment. Please try again."
          );
          setSaving(false);
          return;
        }

        dispatch({ type: "SET_PREASSESSMENT_ID", payload: data.id });
        router.push("/pre-assessment/description");
      } catch (err) {
        console.error("Error saving preassessment:", err);
        Alert.alert("Error", "Failed to save pre-assessment. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setIdx((prev) => prev + 1);
    }
  };

  const back = () => {
    if (idx === 0) {
      router.back();
    } else {
      setIdx((prev) => prev - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={back}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Text style={styles.topTitle}>Pre Assessment Questions</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressRow}>
        <View
          style={[
            styles.progressLine,
            { width: `${((idx + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.question}>{current.q}</Text>

      <View style={styles.optionsWrap}>
        {current.options.map((opt) => {
          const active = opt === selected;

          return (
            <Pressable
              key={opt}
              style={[styles.optionRow, active && styles.optionActive]}
              onPress={() =>
                dispatch({
                  type: "SET_ANSWER",
                  payload: {
                    qIndex: idx,
                    answer: opt,
                  },
                })
              }
            >
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? (
                  <Ionicons name="checkmark" size={15} color="#fff" />
                ) : null}
              </View>

              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!canNext && (
        <Text style={styles.warn}>Please select an answer to continue.</Text>
      )}

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={back}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        <Pressable
          style={[styles.btnFilled, (!canNext || saving) && styles.disabledBtn]}
          onPress={next}
          disabled={!canNext || saving}
        >
          <Text style={styles.btnFilledText}>
            {saving ? "Saving..." : "Next"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Question {idx + 1} of {questions.length}
      </Text>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "800",
    textAlign: "center",
  },

  headerSpacer: {
    width: 38,
  },

  progressRow: {
    marginTop: 18,
    height: 5,
    backgroundColor: "#EED6E1",
    borderRadius: 99,
    overflow: "hidden",
  },

  progressLine: {
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 99,
  },

  question: {
    marginTop: 48,
    marginBottom: 42,
    fontSize: 34,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 42,
    width: "95%",
  },

  optionsWrap: {
    paddingHorizontal: 12,
  },

  optionRow: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 16,
    gap: 14,
  },

  optionActive: {
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  check: {
    width: 21,
    height: 21,
    borderRadius: 7,
    backgroundColor: "#F5C1D2",
    alignItems: "center",
    justifyContent: "center",
  },

  checkActive: {
    backgroundColor: colors.primary,
  },

  optionText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "800",
  },

  optionTextActive: {
    color: colors.primary,
  },

  warn: {
    marginTop: 2,
    marginLeft: 30,
    fontSize: 12,
    color: colors.primary,
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

  btnFilledSingle: {
    width: 160,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledBtn: {
    opacity: 0.45,
  },

  btnFilledText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  footerText: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "600",
  },

  centeredContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textGray,
  },

  errorText: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },
});