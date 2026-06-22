import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";

export default function About() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About</Text>

        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="medical-outline" size={28} color={colors.primary} />
          </View>

          <Text style={styles.appName}>IntelliDent</Text>
          <Text style={styles.version}>Version 1.0</Text>

          <Text style={styles.description}>
            IntelliDent is a digital dental management platform designed to
            connect patients and dental professionals through appointment
            scheduling, treatment tracking, dental records management,
            notifications, and pre-assessment tools.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>

          <Feature icon="calendar-outline" text="Appointment Booking" />
          <Feature icon="document-text-outline" text="Dental History" />
          <Feature icon="medkit-outline" text="Treatment Tracking" />
          <Feature icon="clipboard-outline" text="Pre-Assessment" />
          <Feature icon="notifications-outline" text="Notifications" />
          <Feature icon="person-outline" text="Profile Management" />
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>GC Dental Care</Text>
          <Text style={styles.footerText}>Powered by IntelliDent</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
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
  heroCard: {
    marginTop: 20,
    backgroundColor: "#FFF9FB",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },
  appName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },
  version: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "700",
  },
  description: {
    marginTop: 16,
    fontSize: 13,
    color: "#667085",
    lineHeight: 22,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#344054",
    marginBottom: 12,
  },
  featureRow: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 13,
    color: "#667085",
    fontWeight: "800",
  },
  footerCard: {
    marginTop: 24,
    marginBottom: 40,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
  },
  footerTitle: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "900",
  },
  footerText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "700",
  },
});