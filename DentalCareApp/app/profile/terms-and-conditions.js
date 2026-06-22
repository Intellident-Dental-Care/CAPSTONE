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

export default function TermsAndConditions() {
  const router = useRouter();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("Terms")
        .select("id, title, description")
        .order("id", { ascending: true });

      if (error) throw error;

      setTerms(data || []);
    } catch (error) {
      console.log("fetchTerms error:", error);
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

      <Text style={styles.title}>Terms and Conditions</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading terms...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {terms.length > 0 ? (
            terms.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <Text style={styles.sectionText}>{item.description}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No terms available.</Text>
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
    fontSize: 27,
    fontWeight: "900",
    color: colors.primary,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#344054",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 22,
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