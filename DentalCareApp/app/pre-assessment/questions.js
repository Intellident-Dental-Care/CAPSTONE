import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";
import { supabase } from "../../server/supabaseService";
import { getCurrentUser } from "../../server/supabaseService";

export default function Questions() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();
  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch questions from Supabase
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('questionnaire')
        .select('*')
        .eq('is_active', true)
        .order('question_order');

      if (error) throw error;

      // Transform data to match existing format
      const transformedQuestions = data.map(item => ({
        q: item.question_text,
        options: item.options
      }));

      setQuestions(transformedQuestions);
      
      // Initialize answers array with empty strings for each question
      const initialAnswers = new Array(transformedQuestions.length).fill("");
      dispatch({ type: "INIT_ANSWERS", payload: initialAnswers });
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  // Show error state or continue with empty questions array
  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <Text style={styles.errorText}>
          {error ? `Error: ${error}` : "No questions available"}
        </Text>
        <Pressable style={styles.btnFilled} onPress={fetchQuestions}>
          <Text style={styles.btnFilledText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const current = questions[idx];
  const selected = state.answers[idx] || "";

  const canNext = selected.length > 0;

  const next = async () => {
    if (!canNext || saving) return;
    
    if (idx === questions.length - 1) {
      // Prevent duplicate saves
      if (saving) return;
      setSaving(true);
      
      try {
        const user = await getCurrentUser();
        if (user) {
          const { data, error } = await supabase
            .from('patient_preassessment')
            .insert([{
              user_id: user.id,
              answers: state.answers,
              description: null
            }])
            .select()
            .single();

          if (error) {
            console.error('Error saving preassessment:', error);
          } else {
            dispatch({ type: "SET_PREASSESSMENT_ID", payload: data.id });
          }
        }
      } catch (err) {
        console.error('Error saving preassessment:', err);
      } finally {
        setSaving(false);
      }
      
      router.push("/pre-assessment/description");
    } else {
      setIdx((p) => p + 1);
    }
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
        <View style={[styles.progressLine, { width: `${((idx + 1) / questions.length) * 100}%` }]} />
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

        <Pressable 
          style={[styles.btnFilled, (!canNext || saving) && { opacity: 0.5 }]} 
          onPress={next}
          disabled={saving}
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
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  
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

  centeredContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textGray },
  errorText: { fontSize: 16, color: colors.primary, marginBottom: 20 },
});
