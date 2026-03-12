import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import {
  getCurrentActiveProfileForSession,
  getPatientProfileByProfileId,
} from "../_storage/authStorage";

function Row({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>
        {value && String(value).trim() !== "" ? value : "—"}
      </Text>
    </View>
  );
}

function YesNoRow({ label, value }) {
  const normalized = (value || "").trim();
  const isYes = normalized === "Yes";
  const isNo = normalized === "No";

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.answerInline}>
        <Ionicons
          name={
            isYes
              ? "checkmark-circle"
              : isNo
              ? "close-circle"
              : "remove-circle"
          }
          size={18}
          color={isYes ? "#2ecc71" : isNo ? "#e74c3c" : "#bdbdbd"}
        />
        <Text style={styles.infoValue}>{normalized || "—"}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Tag({ text }) {
  return <Text style={styles.tag}>{text}</Text>;
}

export default function MedicalHistory() {
  const router = useRouter();
  const [medical, setMedical] = useState(null);

  useEffect(() => {
    (async () => {
      const activeProfile = await getCurrentActiveProfileForSession();
      if (!activeProfile?.id) return;

      const profile = await getPatientProfileByProfileId(activeProfile.id);
      if (profile?.medicalHistory) {
        setMedical(profile.medicalHistory);
      }
    })();
  }, []);

  if (!medical) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No medical history found.</Text>
      </View>
    );
  }

  const selectedAllergies = [
    medical.allergies?.localAnesthetic && "Local Anesthetic (ex. Lidocaine)",
    medical.allergies?.penicillin && "Penicillin Antibiotics",
    medical.allergies?.sulfa && "Sulfa Drugs",
    medical.allergies?.aspirin && "Aspirin",
    medical.allergies?.latex && "Latex",
  ].filter(Boolean);

  const selectedConditions = [
    medical.conditions?.highBloodPressure && "High Blood Pressure",
    medical.conditions?.lowBloodPressure && "Low Blood Pressure",
    medical.conditions?.epilepsy && "Epilepsy or Convulsions",
    medical.conditions?.aidsHiv && "AIDS or HIV infection",
    medical.conditions?.std && "Sexually transmitted disease",
    medical.conditions?.stomachUlcer && "Stomach Troubles or Ulcers",
    medical.conditions?.faintingSeizure && "Fainting Seizure",
    medical.conditions?.rapidWeightLoss && "Rapid Weight Loss",
    medical.conditions?.radiationTherapy && "Radiation Therapy",
    medical.conditions?.jointReplacement && "Joint Replacement or Implant",
    medical.conditions?.heartSurgery && "Heart Surgery",
    medical.conditions?.heartAttack && "Heart Attack",
    medical.conditions?.thyroidProblem && "Thyroid Problem",
    medical.conditions?.heartDisease && "Heart Disease",
    medical.conditions?.heartMurmur && "Heart Murmur",
    medical.conditions?.hepatitisLiver && "Hepatitis or Liver Disease",
    medical.conditions?.rheumaticFever && "Rheumatic Fever",
    medical.conditions?.hayFever && "Hay Fever or Allergies",
    medical.conditions?.respiratoryProblems && "Respiratory Problems",
    medical.conditions?.hepatitisJaundice && "Hepatitis or Jaundice",
    medical.conditions?.tuberculosis && "Tuberculosis",
    medical.conditions?.swollenAnkles && "Swollen Ankles",
    medical.conditions?.kidneyDisease && "Kidney Disease",
    medical.conditions?.diabetes && "Diabetes",
    medical.conditions?.chestPain && "Chest Pain",
    medical.conditions?.stroke && "Stroke",
    medical.conditions?.cancerTumors && "Cancer or Tumors",
    medical.conditions?.anemia && "Anemia",
    medical.conditions?.angina && "Angina",
    medical.conditions?.asthma && "Asthma",
    medical.conditions?.emphysema && "Emphysema",
    medical.conditions?.bleedingProblems && "Bleeding Problems",
    medical.conditions?.headInjuries && "Head Injuries",
    medical.conditions?.arthritisRheumatism && "Arthritis or Rheumatism",
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Medical History</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="General Health">
          <YesNoRow label="1. Are you in good health?" value={medical.goodHealth} />
          <YesNoRow label="2. Are you under medical treatment now?" value={medical.underTreatment} />
          <Row label="Condition being treated" value={medical.treatmentCondition} />
          <YesNoRow
            label="3. Serious illness or surgical operation?"
            value={medical.seriousIllness}
          />
          <Row label="Illness / operation details" value={medical.illnessOperation} />
          <YesNoRow label="4. Have you ever been hospitalized?" value={medical.hospitalized} />
          <Row label="Hospitalization details" value={medical.hospitalizedReason} />
        </SectionCard>

        <SectionCard title="Medication and Lifestyle">
          <YesNoRow
            label="5. Taking prescription / non-prescription medication?"
            value={medical.takingMedication}
          />
          <Row label="Medication details" value={medical.medicationDetails} />
          <YesNoRow label="6. Use tobacco products?" value={medical.useTobacco} />
          <YesNoRow
            label="7. Use alcohol, cocaine, or other dangerous drugs?"
            value={medical.useAlcoholDrugs}
          />
        </SectionCard>

        <SectionCard title="Allergies">
          <Text style={styles.subText}>8. Are you allergic to any of the following?</Text>

          {selectedAllergies.length > 0 ? (
            <View style={styles.tagsWrap}>
              {selectedAllergies.map((item) => (
                <Tag key={item} text={item} />
              ))}
            </View>
          ) : (
            <Text style={styles.noneText}>No selected allergies.</Text>
          )}

          <Row label="Other allergies" value={medical.allergyOthers} />
        </SectionCard>

        <SectionCard title="Women Only">
          <YesNoRow label="Pregnant?" value={medical.pregnant} />
          <YesNoRow label="Nursing?" value={medical.nursing} />
          <YesNoRow label="Taking birth control pills?" value={medical.birthControl} />
        </SectionCard>

        <SectionCard title="Vitals">
          <Row label="9. Bleeding Time" value={medical.bleedingTime} />
          <Row label="11. Blood Type" value={medical.bloodType} />
          <Row label="12. Blood Pressure" value={medical.bloodPressure} />
        </SectionCard>

        <SectionCard title="Medical Conditions">
          <Text style={styles.subText}>
            13. Do you have or have you had any of the following?
          </Text>

          {selectedConditions.length > 0 ? (
            <View style={styles.tagsWrap}>
              {selectedConditions.map((item) => (
                <Tag key={item} text={item} />
              ))}
            </View>
          ) : (
            <Text style={styles.noneText}>No selected conditions.</Text>
          )}

          <Row label="Other conditions" value={medical.conditionOthers} />
        </SectionCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },

  header: {
    height: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    padding: 16,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 12,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 11,
    color: colors.textGray,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
  },

  answerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  subText: {
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 10,
    fontWeight: "700",
  },

  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  tag: {
    backgroundColor: "#f1f6ff",
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
  },

  noneText: {
    fontSize: 12,
    color: colors.textGray,
    marginBottom: 10,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  emptyText: {
    fontSize: 14,
    color: colors.textGray,
  },
});