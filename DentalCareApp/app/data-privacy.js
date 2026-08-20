import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import {
  getCurrentActiveProfileForSession,
  getPatientProfileByProfileId,
} from "./_storage/authStorage";

const PRIVACY_SECTIONS = [
  {
    title: "Privacy Commitment",
    content:
      "IntelliDent values your privacy and is committed to protecting your personal information. We recognize the importance of safeguarding your personal and health-related data and ensuring that it is processed responsibly, securely, and in accordance with applicable data protection laws.\n\nThis Data Privacy Notice explains how IntelliDent collects, uses, stores, protects, and shares your personal information when you use the IntelliDent mobile application, web application, website, and related services. By continuing to use IntelliDent, you acknowledge that your information will be processed in accordance with this Privacy Notice and the Data Privacy Act of 2012.",
  },
  {
    title: "Personal Data We Collect",
    content:
      "IntelliDent may collect personal identification information, account information, health and dental information, appointment and service information, and system or technical information necessary for the operation of the Platform.",
  },
  {
    title: "Why We Process Your Personal Data",
    content:
      "Your information may be used for patient care, appointment management, pre-assessment, account administration, notifications, communication, security, compliance, and system improvement.",
  },
  {
    title: "IntelliDent Platform and Digital Services",
    content:
      "IntelliDent collects information directly from users through registration, appointment bookings, pre-assessment forms, profile updates, and interactions within the Platform. Technical information may also be collected to maintain secure and reliable services.",
  },
  {
    title: "Sharing and Disclosure of Information",
    content:
      "IntelliDent does not sell, rent, or trade personal information. Information may only be shared with authorized dental professionals, clinics, system administrators, service providers, or legal authorities when necessary and lawful.",
  },
  {
    title: "Data Retention",
    content:
      "IntelliDent retains personal information only for as long as necessary to fulfill the purposes described in this Privacy Notice, comply with legal obligations, resolve disputes, enforce agreements, and maintain healthcare records where required.",
  },
  {
    title: "Security Measures",
    content:
      "IntelliDent implements technical, administrative, and organizational safeguards including secure authentication, role-based access controls, encrypted transmission, activity logging, monitoring, and restricted access to sensitive information.",
  },
  {
    title: "Your Rights as a Data Subject",
    content:
      "Under the Data Privacy Act of 2012, you may have the right to be informed, access your personal information, object to processing, rectify inaccurate information, erase or block information where applicable, data portability, file a complaint with the National Privacy Commission, and seek damages for violations of privacy laws.",
  },
  {
    title: "Updates to this Privacy Notice",
    content:
      "IntelliDent may update this Privacy Notice from time to time to reflect changes in legal requirements, business practices, security measures, or Platform functionality. Continued use of IntelliDent after updates constitutes acceptance of the revised Privacy Notice.",
  },
  {
    title: "Contact Us",
    content:
      "For questions, concerns, requests, or inquiries regarding this Privacy Notice or the processing of your personal information, please contact the IntelliDent Support Team through the contact information provided within the Platform.",
  },
  {
    title: "Consent",
    content:
      'By selecting "I Agree", creating an account, logging in, or continuing to use IntelliDent, you acknowledge that you have read and understood this Data Privacy Notice and voluntarily consent to the collection, use, storage, processing, and disclosure of your personal information as described herein.',
  },
];

export default function DataPrivacy() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    if (!isAgreed) {
      Alert.alert(
        "Agreement Required",
        "Please confirm that you have read and agree to the Data Privacy Notice."
      );
      return;
    }

    try {
      setLoading(true);

      global.hasShownPrivacyThisSession = true;

      const activeProfile = await getCurrentActiveProfileForSession();

      if (!activeProfile?.id) {
        router.replace("/patient-first-setup");
        return;
      }

      const patientProfile = await getPatientProfileByProfileId(activeProfile.id);

      const needsSetup =
        activeProfile?.needsPatientSetup !== false || !patientProfile;

      if (needsSetup) {
        router.replace("/patient-first-setup");
      } else {
        router.replace("/home");
      }
    } catch (error) {
      console.log("Data privacy continue error:", error);
      router.replace("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
        </View>

        <Text style={styles.title}>IntelliDent Data Privacy Notice</Text>
        <Text style={styles.subtitle}>Please read and accept before continuing.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.checkRow}
          onPress={() => setIsAgreed((prev) => !prev)}
        >
          <View style={[styles.checkbox, isAgreed && styles.checkboxActive]}>
            {isAgreed ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
          </View>

          <Text style={styles.checkText}>
            I have read and agree to the IntelliDent Data Privacy Notice.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.agreeBtn, !isAgreed && styles.agreeBtnDisabled]}
          onPress={handleAgree}
          disabled={loading}
        >
          <Text style={styles.agreeText}>
            {loading ? "Please wait..." : "I Agree and Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 48,
  },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 14,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 30,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 180,
  },

  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#344054",
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 22,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F3F3",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 26,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxActive: {
    backgroundColor: colors.primary,
  },

  checkText: {
    flex: 1,
    fontSize: 12,
    color: "#667085",
    lineHeight: 18,
    fontWeight: "700",
  },

  agreeBtn: {
    height: 54,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  agreeBtnDisabled: {
    opacity: 0.45,
  },

  agreeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});