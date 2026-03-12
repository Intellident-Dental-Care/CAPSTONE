// app/tooth-3d.js
import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme/colors";

const TIMELINE = [
  {
    date: "Oct 15, 2024",
    title: "Orthodontic Adjustment",
    details:
      "Braces tightened and wire adjusted. Mild discomfort expected for 1–2 days. Elastic bands replaced.",
    doctor: "Dr. Mendoza",
  },
  {
    date: "Aug 02, 2024",
    title: "Tooth Extraction",
    details:
      "Upper left third molar removed due to impaction. Post-operative instructions provided. Prescribed pain reliever.",
    doctor: "Dr. Guillermo",
  },
  {
    date: "Apr 12, 2024",
    title: "Routine Cleaning",
    details:
      "Plaque and tartar removed. Teeth polished. Patient advised to floss daily and return after 6 months.",
    doctor: "Dr. Mendoza",
  },
  {
    date: "Feb 18, 2024",
    title: "Dental Filling",
    details:
      "Composite resin filling applied on lower right molar. Cavity cleaned and restored successfully.",
    doctor: "Dr. Guillermo",
  },
  {
    date: "Jan 10, 2024",
    title: "Dental X-Ray",
    details:
      "Panoramic X-ray performed. No major abnormalities detected. Monitoring wisdom tooth alignment.",
    doctor: "Dr. Mendoza",
  },
  {
    date: "Oct 05, 2023",
    title: "Fluoride Treatment",
    details:
      "Fluoride varnish applied to strengthen enamel and reduce sensitivity.",
    doctor: "Dr. Mendoza",
  },
  {
    date: "Jul 20, 2023",
    title: "Sensitivity Check-Up",
    details:
      "Patient reported cold sensitivity. No cavities found. Desensitizing toothpaste recommended.",
    doctor: "Dr. Guillermo",
  },
  {
    date: "Apr 01, 2023",
    title: "Initial Consultation",
    details:
      "Full oral examination completed. Treatment plan discussed including cleaning and cavity restoration.",
    doctor: "Dr. Mendoza",
  },
];

export default function Tooth3D() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={styles.title}>Tooth 3D Model</Text>
      <Text style={styles.subTitle}>
        Select a tooth to review its complete dental record, including previous treatments and assessments.
      </Text>

      <Image
        source={require("../assets/tooth_model.png")}
        style={styles.image}
        resizeMode="contain"
      />


      <Text style={styles.section}>Dental Record Timeline</Text>

      <View style={styles.summaryBox}>
        {TIMELINE.map((item, i) => (
          <View key={`${item.date}-${i}`} style={styles.timeRow}>
            {/* Left rail */}
            <View style={styles.timeRail}>
              <View style={styles.timeDot} />
              {i !== TIMELINE.length - 1 && <View style={styles.timeLine} />}
            </View>

            {/* Content */}
            <View style={styles.timeContent}>
              <Text style={styles.timeDate}>
                {item.date} – <Text style={styles.timeTitle}>{item.title}</Text>
              </Text>
              <Text style={styles.timeDetails}>{item.details}</Text>
              <Text style={styles.timeDoctor}>Performed by: {item.doctor}</Text>
            </View>
          </View>
        ))}
      </View>

   
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 13,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  subTitle: {
    marginTop: 8,
    fontSize: 12,
    color: "#9aa0a6",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  image: {
    width: "100%",
    height: 280,
    marginTop: 18,
  },

  section: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "900",
    color: colors.textGray ?? "#666",
  },


  summaryBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },


  timeRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
  },

  timeRail: {
    width: 16,
    alignItems: "center",
  },

  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.primary,
    marginTop: 4,
  },

  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    marginTop: 6,
    borderRadius: 99,
  },

  timeContent: {
    flex: 1,
  },

  timeDate: {
    fontSize: 11,
    color: "#777",
    fontWeight: "900",
    lineHeight: 16,
  },

  timeTitle: {
    color: colors.primary,
    fontWeight: "900",
  },

  timeDetails: {
    marginTop: 4,
    fontSize: 11,
    color: "#999",
    lineHeight: 16,
  },

  timeDoctor: {
    marginTop: 4,
    fontSize: 10,
    color: "#888",
    fontWeight: "700",
  },
});