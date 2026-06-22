import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { supabase } from "../../server/supabaseService";

export default function FAQ() {
  const router = useRouter();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, category, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      setFaqs(data || []);
    } catch (error) {
      console.log("fetchFaqs error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.title}>FAQ</Text>
      <Text style={styles.subtitle}>Frequently asked questions about IntelliDent.</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {faqs.length > 0 ? (
            faqs.map((item) => {
              const isOpen = openId === item.id;

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => setOpenId(isOpen ? null : item.id)}
                >
                  <View style={styles.questionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.category}>{item.category}</Text>
                      <Text style={styles.question}>{item.question}</Text>
                    </View>

                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No FAQs available.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 8,
    paddingHorizontal: 18,
  },
  header: {
    height: 48,
    justifyContent: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF9FB",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  category: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "800",
    marginBottom: 4,
  },
  question: {
    fontSize: 14,
    color: "#344054",
    fontWeight: "900",
  },
  answer: {
    marginTop: 12,
    fontSize: 13,
    color: "#667085",
    lineHeight: 21,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textGray,
    fontWeight: "700",
    marginTop: 40,
  },
});