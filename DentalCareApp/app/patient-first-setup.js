import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import {
  getSession,
  getCurrentActiveProfileForSession,
  getPatientProfileByProfileId,
  savePatientProfileByProfileId,
  setPatientSetupDoneForProfile,
  setPatientSetupDoneForUser,
} from "./storage/authStorage";

function calculateAge(dobValue) {
  if (!dobValue) return "";

  const birthDate = new Date(dobValue);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? String(age) : "";
}

function YesNoRow({ value, onChange }) {
  return (
    <View style={styles.radioRow}>
      <Pressable style={styles.radioOption} onPress={() => onChange("Yes")}>
        <View style={[styles.radioCircle, value === "Yes" && styles.radioActive]}>
          {value === "Yes" ? <View style={styles.radioInner} /> : null}
        </View>
        <Text style={styles.radioText}>Yes</Text>
      </Pressable>

      <Pressable style={styles.radioOption} onPress={() => onChange("No")}>
        <View style={[styles.radioCircle, value === "No" && styles.radioActive]}>
          {value === "No" ? <View style={styles.radioInner} /> : null}
        </View>
        <Text style={styles.radioText}>No</Text>
      </Pressable>
    </View>
  );
}

function CheckboxItem({ label, checked, onPress }) {
  return (
    <Pressable style={styles.checkItem} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export default function PatientFirstSetup() {
  const router = useRouter();

  const [profileId, setProfileId] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const age = useMemo(() => calculateAge(dob), [dob]);

  const [goodHealth, setGoodHealth] = useState("");
  const [underTreatment, setUnderTreatment] = useState("");
  const [treatmentCondition, setTreatmentCondition] = useState("");
  const [seriousIllness, setSeriousIllness] = useState("");
  const [illnessOperation, setIllnessOperation] = useState("");
  const [hospitalized, setHospitalized] = useState("");
  const [hospitalizedReason, setHospitalizedReason] = useState("");
  const [takingMedication, setTakingMedication] = useState("");
  const [medicationDetails, setMedicationDetails] = useState("");
  const [useTobacco, setUseTobacco] = useState("");
  const [useAlcoholDrugs, setUseAlcoholDrugs] = useState("");
  const [bleedingTime, setBleedingTime] = useState("");
  const [pregnant, setPregnant] = useState("");
  const [nursing, setNursing] = useState("");
  const [birthControl, setBirthControl] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");

  const [allergies, setAllergies] = useState({
    localAnesthetic: false,
    penicillin: false,
    sulfa: false,
    aspirin: false,
    latex: false,
  });
  const [allergyOthers, setAllergyOthers] = useState("");

  const [conditions, setConditions] = useState({
    highBloodPressure: false,
    lowBloodPressure: false,
    epilepsy: false,
    aidsHiv: false,
    std: false,
    stomachUlcer: false,
    faintingSeizure: false,
    rapidWeightLoss: false,
    radiationTherapy: false,
    jointReplacement: false,
    heartSurgery: false,
    heartAttack: false,
    thyroidProblem: false,
    heartDisease: false,
    heartMurmur: false,
    hepatitisLiver: false,
    rheumaticFever: false,
    hayFever: false,
    respiratoryProblems: false,
    hepatitisJaundice: false,
    tuberculosis: false,
    swollenAnkles: false,
    kidneyDisease: false,
    diabetes: false,
    chestPain: false,
    stroke: false,
    cancerTumors: false,
    anemia: false,
    angina: false,
    asthma: false,
    emphysema: false,
    bleedingProblems: false,
    headInjuries: false,
    arthritisRheumatism: false,
  });

  const [conditionOthers, setConditionOthers] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      const activeProfile = await getCurrentActiveProfileForSession();

      if (session?.email) setEmail(session.email);

      if (activeProfile?.id) {
        setProfileId(activeProfile.id);
      }

      if (activeProfile?.name) {
        setFullName(activeProfile.name);
      } else if (session?.fullName) {
        setFullName(session.fullName);
      }

      const existingPatientProfile = activeProfile?.id
        ? await getPatientProfileByProfileId(activeProfile.id)
        : null;

      if (existingPatientProfile) {
        setFullName(existingPatientProfile.fullName || activeProfile?.name || "");
        setDob(existingPatientProfile.dob || "");
        setMobile(existingPatientProfile.mobile || "");
        setEmail(existingPatientProfile.email || session?.email || "");

        const medical = existingPatientProfile.medicalHistory || {};

        setGoodHealth(medical.goodHealth || "");
        setUnderTreatment(medical.underTreatment || "");
        setTreatmentCondition(medical.treatmentCondition || "");
        setSeriousIllness(medical.seriousIllness || "");
        setIllnessOperation(medical.illnessOperation || "");
        setHospitalized(medical.hospitalized || "");
        setHospitalizedReason(medical.hospitalizedReason || "");
        setTakingMedication(medical.takingMedication || "");
        setMedicationDetails(medical.medicationDetails || "");
        setUseTobacco(medical.useTobacco || "");
        setUseAlcoholDrugs(medical.useAlcoholDrugs || "");
        setBleedingTime(medical.bleedingTime || "");
        setPregnant(medical.pregnant || "");
        setNursing(medical.nursing || "");
        setBirthControl(medical.birthControl || "");
        setBloodType(medical.bloodType || "");
        setBloodPressure(medical.bloodPressure || "");
        setAllergies(
          medical.allergies || {
            localAnesthetic: false,
            penicillin: false,
            sulfa: false,
            aspirin: false,
            latex: false,
          }
        );
        setAllergyOthers(medical.allergyOthers || "");
        setConditions(
          medical.conditions || {
            highBloodPressure: false,
            lowBloodPressure: false,
            epilepsy: false,
            aidsHiv: false,
            std: false,
            stomachUlcer: false,
            faintingSeizure: false,
            rapidWeightLoss: false,
            radiationTherapy: false,
            jointReplacement: false,
            heartSurgery: false,
            heartAttack: false,
            thyroidProblem: false,
            heartDisease: false,
            heartMurmur: false,
            hepatitisLiver: false,
            rheumaticFever: false,
            hayFever: false,
            respiratoryProblems: false,
            hepatitisJaundice: false,
            tuberculosis: false,
            swollenAnkles: false,
            kidneyDisease: false,
            diabetes: false,
            chestPain: false,
            stroke: false,
            cancerTumors: false,
            anemia: false,
            angina: false,
            asthma: false,
            emphysema: false,
            bleedingProblems: false,
            headInjuries: false,
            arthritisRheumatism: false,
          }
        );
        setConditionOthers(medical.conditionOthers || "");
      }
    })();
  }, []);

  const toggleAllergy = (key) => {
    setAllergies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCondition = (key) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSave = async () => {
    if (!profileId) {
      Alert.alert("Error", "No active profile found.");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }

    if (!dob.trim()) {
      Alert.alert("Required", "Please enter your date of birth.");
      return;
    }

    if (!mobile.trim()) {
      Alert.alert("Required", "Please enter your mobile number.");
      return;
    }

    const payload = {
      fullName,
      dob,
      age,
      mobile,
      email,
      medicalHistory: {
        goodHealth,
        underTreatment,
        treatmentCondition,
        seriousIllness,
        illnessOperation,
        hospitalized,
        hospitalizedReason,
        takingMedication,
        medicationDetails,
        useTobacco,
        useAlcoholDrugs,
        allergies,
        allergyOthers,
        bleedingTime,
        pregnant,
        nursing,
        birthControl,
        bloodType,
        bloodPressure,
        conditions,
        conditionOthers,
      },
    };

    const result = await savePatientProfileByProfileId(profileId, payload);

    if (!result.success) {
      Alert.alert("Error", result.message || "Failed to save medical form.");
      return;
    }

    if (email) {
      await setPatientSetupDoneForProfile(email, profileId);
      await setPatientSetupDoneForUser(email);
    }

    Alert.alert("Success", "Your medical form has been saved.", [
      {
        text: "OK",
        onPress: () => router.replace("/home"),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Patient Information Form</Text>
          <Text style={styles.headerSub}>
            Please complete this before proceeding.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Basic Detail</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          value={age}
          editable={false}
          style={[styles.input, styles.disabledInput]}
          placeholder="Auto generated"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.sectionTitle}>Contact Detail</Text>

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          style={styles.input}
          placeholder="+63 9xx xxx xxxx"
          placeholderTextColor={colors.textGray}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          editable={false}
          style={[styles.input, styles.disabledInput]}
          placeholder="Auto generated from login"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.sectionTitle}>Medical History</Text>

        <Text style={styles.question}>1. Are you in good health?</Text>
        <YesNoRow value={goodHealth} onChange={setGoodHealth} />

        <Text style={styles.question}>2. Are you under medical treatment now?</Text>
        <YesNoRow value={underTreatment} onChange={setUnderTreatment} />
        <TextInput
          value={treatmentCondition}
          onChangeText={setTreatmentCondition}
          style={styles.input}
          placeholder="If yes, what condition is being treated?"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>3. Have you ever had a serious illness or surgical operation?</Text>
        <YesNoRow value={seriousIllness} onChange={setSeriousIllness} />
        <TextInput
          value={illnessOperation}
          onChangeText={setIllnessOperation}
          style={styles.input}
          placeholder="If yes, what illness or operation?"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>4. Have you ever been hospitalized?</Text>
        <YesNoRow value={hospitalized} onChange={setHospitalized} />
        <TextInput
          value={hospitalizedReason}
          onChangeText={setHospitalizedReason}
          style={styles.input}
          placeholder="If yes, when and why?"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>5. Are you taking any prescription/non-prescription medication?</Text>
        <YesNoRow value={takingMedication} onChange={setTakingMedication} />
        <TextInput
          value={medicationDetails}
          onChangeText={setMedicationDetails}
          style={styles.input}
          placeholder="If yes, please specify"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>6. Do you use tobacco products?</Text>
        <YesNoRow value={useTobacco} onChange={setUseTobacco} />

        <Text style={styles.question}>7. Do you use alcohol, cocaine, or other dangerous drugs?</Text>
        <YesNoRow value={useAlcoholDrugs} onChange={setUseAlcoholDrugs} />

        <Text style={styles.question}>8. Are you allergic to any of the following?</Text>
        <CheckboxItem
          label="Local Anesthetic (ex. Lidocaine)"
          checked={allergies.localAnesthetic}
          onPress={() => toggleAllergy("localAnesthetic")}
        />
        <CheckboxItem
          label="Penicillin Antibiotics"
          checked={allergies.penicillin}
          onPress={() => toggleAllergy("penicillin")}
        />
        <CheckboxItem
          label="Sulfa Drugs"
          checked={allergies.sulfa}
          onPress={() => toggleAllergy("sulfa")}
        />
        <CheckboxItem
          label="Aspirin"
          checked={allergies.aspirin}
          onPress={() => toggleAllergy("aspirin")}
        />
        <CheckboxItem
          label="Latex"
          checked={allergies.latex}
          onPress={() => toggleAllergy("latex")}
        />

        <TextInput
          value={allergyOthers}
          onChangeText={setAllergyOthers}
          style={styles.input}
          placeholder="Others"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>9. Bleeding Time</Text>
        <TextInput
          value={bleedingTime}
          onChangeText={setBleedingTime}
          style={styles.input}
          placeholder="Enter bleeding time"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>10. For women only</Text>
        <Text style={styles.smallLabel}>Are you pregnant?</Text>
        <YesNoRow value={pregnant} onChange={setPregnant} />

        <Text style={styles.smallLabel}>Are you nursing?</Text>
        <YesNoRow value={nursing} onChange={setNursing} />

        <Text style={styles.smallLabel}>Are you taking birth control pills?</Text>
        <YesNoRow value={birthControl} onChange={setBirthControl} />

        <Text style={styles.question}>11. Blood Type</Text>
        <TextInput
          value={bloodType}
          onChangeText={setBloodType}
          style={styles.input}
          placeholder="ex. A+"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>12. Blood Pressure</Text>
        <TextInput
          value={bloodPressure}
          onChangeText={setBloodPressure}
          style={styles.input}
          placeholder="ex. 120/80"
          placeholderTextColor={colors.textGray}
        />

        <Text style={styles.question}>
          13. Do you have or have you had any of the following?
        </Text>

        <CheckboxItem label="High Blood Pressure" checked={conditions.highBloodPressure} onPress={() => toggleCondition("highBloodPressure")} />
        <CheckboxItem label="Low Blood Pressure" checked={conditions.lowBloodPressure} onPress={() => toggleCondition("lowBloodPressure")} />
        <CheckboxItem label="Epilepsy or Convulsions" checked={conditions.epilepsy} onPress={() => toggleCondition("epilepsy")} />
        <CheckboxItem label="AIDS or HIV infection" checked={conditions.aidsHiv} onPress={() => toggleCondition("aidsHiv")} />
        <CheckboxItem label="Sexually transmitted disease" checked={conditions.std} onPress={() => toggleCondition("std")} />
        <CheckboxItem label="Stomach Troubles or Ulcers" checked={conditions.stomachUlcer} onPress={() => toggleCondition("stomachUlcer")} />
        <CheckboxItem label="Fainting Seizure" checked={conditions.faintingSeizure} onPress={() => toggleCondition("faintingSeizure")} />
        <CheckboxItem label="Rapid Weight Loss" checked={conditions.rapidWeightLoss} onPress={() => toggleCondition("rapidWeightLoss")} />
        <CheckboxItem label="Radiation Therapy" checked={conditions.radiationTherapy} onPress={() => toggleCondition("radiationTherapy")} />
        <CheckboxItem label="Joint Replacement or Implant" checked={conditions.jointReplacement} onPress={() => toggleCondition("jointReplacement")} />
        <CheckboxItem label="Heart Surgery" checked={conditions.heartSurgery} onPress={() => toggleCondition("heartSurgery")} />
        <CheckboxItem label="Heart Attack" checked={conditions.heartAttack} onPress={() => toggleCondition("heartAttack")} />
        <CheckboxItem label="Thyroid Problem" checked={conditions.thyroidProblem} onPress={() => toggleCondition("thyroidProblem")} />
        <CheckboxItem label="Heart Disease" checked={conditions.heartDisease} onPress={() => toggleCondition("heartDisease")} />
        <CheckboxItem label="Heart Murmur" checked={conditions.heartMurmur} onPress={() => toggleCondition("heartMurmur")} />
        <CheckboxItem label="Hepatitis or Liver Disease" checked={conditions.hepatitisLiver} onPress={() => toggleCondition("hepatitisLiver")} />
        <CheckboxItem label="Rheumatic Fever" checked={conditions.rheumaticFever} onPress={() => toggleCondition("rheumaticFever")} />
        <CheckboxItem label="Hay Fever or Allergies" checked={conditions.hayFever} onPress={() => toggleCondition("hayFever")} />
        <CheckboxItem label="Respiratory Problems" checked={conditions.respiratoryProblems} onPress={() => toggleCondition("respiratoryProblems")} />
        <CheckboxItem label="Hepatitis or Jaundice" checked={conditions.hepatitisJaundice} onPress={() => toggleCondition("hepatitisJaundice")} />
        <CheckboxItem label="Tuberculosis" checked={conditions.tuberculosis} onPress={() => toggleCondition("tuberculosis")} />
        <CheckboxItem label="Swollen Ankles" checked={conditions.swollenAnkles} onPress={() => toggleCondition("swollenAnkles")} />
        <CheckboxItem label="Kidney Disease" checked={conditions.kidneyDisease} onPress={() => toggleCondition("kidneyDisease")} />
        <CheckboxItem label="Diabetes" checked={conditions.diabetes} onPress={() => toggleCondition("diabetes")} />
        <CheckboxItem label="Chest Pain" checked={conditions.chestPain} onPress={() => toggleCondition("chestPain")} />
        <CheckboxItem label="Stroke" checked={conditions.stroke} onPress={() => toggleCondition("stroke")} />
        <CheckboxItem label="Cancer or Tumors" checked={conditions.cancerTumors} onPress={() => toggleCondition("cancerTumors")} />
        <CheckboxItem label="Anemia" checked={conditions.anemia} onPress={() => toggleCondition("anemia")} />
        <CheckboxItem label="Angina" checked={conditions.angina} onPress={() => toggleCondition("angina")} />
        <CheckboxItem label="Asthma" checked={conditions.asthma} onPress={() => toggleCondition("asthma")} />
        <CheckboxItem label="Emphysemia" checked={conditions.emphysema} onPress={() => toggleCondition("emphysema")} />
        <CheckboxItem label="Bleeding Problems" checked={conditions.bleedingProblems} onPress={() => toggleCondition("bleedingProblems")} />
        <CheckboxItem label="Head Injuries" checked={conditions.headInjuries} onPress={() => toggleCondition("headInjuries")} />
        <CheckboxItem label="Arthritis or Rheumatism" checked={conditions.arthritisRheumatism} onPress={() => toggleCondition("arthritisRheumatism")} />

        <TextInput
          value={conditionOthers}
          onChangeText={setConditionOthers}
          style={styles.input}
          placeholder="Others"
          placeholderTextColor={colors.textGray}
        />

        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>Save and Continue</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },

  headerSub: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textGray,
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#777",
    textTransform: "uppercase",
  },

  label: {
    marginTop: 12,
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "700",
  },

  question: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  smallLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textDark,
  },

  input: {
    marginTop: 6,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.textDark,
    backgroundColor: "#fff",
  },

  disabledInput: {
    backgroundColor: "#f7f7f7",
    color: "#777",
  },

  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 4,
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },

  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },

  radioActive: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  radioText: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
  },

  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkLabel: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
  },

  saveBtn: {
    marginTop: 30,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});