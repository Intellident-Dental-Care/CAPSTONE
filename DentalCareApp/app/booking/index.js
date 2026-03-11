import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";

const SERVICES = [
  "Teeth Cleaning",
  "Tooth Extraction",
  "Dental Filling",
  "Braces Consultation",
  "Teeth Whitening",
];

const BRANCHES = [
  "General Trias, Cavite",
  "Dasmarinas, Cavite",
  "Bacoor, Cavite",
];

const DOCTORS_BY_BRANCH = {
  "General Trias, Cavite": [
    "Dr. Alyssa R. Santos",
    "Dr. Marco D. Villanueva",
    "Dr. Bianca L. Reyes",
  ],
  "Dasmarinas, Cavite": [
    "Dr. Julian P. Navarro",
    "Dr. Kira M. Dela Cruz",
    "Dr. Sophia T. Garcia",
    "Dr. Ethan J. Mendoza",
  ],
  "Bacoor, Cavite": [
    "Dr. Patricia A. Lim",
    "Dr. Nathan C. Flores",
    "Dr. Camille B. Bautista",
    "Dr. Andre P. Ramos",
    "Dr. Hannah S. Castillo",
  ],
};

function PickerModal({ visible, title, options, onClose, onPick }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.modalItem}
                onPress={() => onPick(opt)}
              >
                <Text style={styles.modalItemText}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BookingBranchDoctor() {
  const router = useRouter();
  const { service: passedService } = useLocalSearchParams();

  const [service, setService] = useState(
    typeof passedService === "string" ? passedService : ""
  );
  const [branch, setBranch] = useState("");
  const [doctor, setDoctor] = useState("");

  const [showService, setShowService] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);

  const doctors = useMemo(() => {
    if (!branch) return [];
    return DOCTORS_BY_BRANCH[branch] || [];
  }, [branch]);

  const canProceed = service && branch && doctor;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      <View style={styles.imageWrap}>
        <Image
          source={require("../../assets/index_assessment.jpg")}
          style={styles.heroImage}
        />
      </View>

      <Text style={styles.h1}>Appointment Booking</Text>
      <Text style={styles.h2}>
        Select a service, branch, and doctor to proceed{"\n"}
        with your appointment.
      </Text>

      <View style={{ height: 16 }} />

      <Pressable style={styles.dropdown} onPress={() => setShowService(true)}>
        <Text style={[styles.dropdownText, !service && { color: "#AAA" }]}>
          {service || "Service"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </Pressable>

      <Pressable
        style={[styles.dropdown, { marginTop: 12 }]}
        onPress={() => setShowBranch(true)}
      >
        <Text style={[styles.dropdownText, !branch && { color: "#AAA" }]}>
          {branch || "Branch"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </Pressable>

      <Pressable
        style={[
          styles.dropdown,
          { marginTop: 12 },
          !branch && { opacity: 0.55 },
        ]}
        onPress={() => {
          if (!branch) return;
          setShowDoctor(true);
        }}
      >
        <Text style={[styles.dropdownText, !doctor && { color: "#AAA" }]}>
          {doctor || "Doctor"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#888" />
      </Pressable>

      <Pressable
        style={[styles.proceedBtn, !canProceed && { opacity: 0.5 }]}
        onPress={() => {
          if (!canProceed) return;
          router.push({
            pathname: "/booking/appointment",
            params: { service, branch, doctor },
          });
        }}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </Pressable>

      <PickerModal
        visible={showService}
        title="Select Service"
        options={SERVICES}
        onClose={() => setShowService(false)}
        onPick={(opt) => {
          setService(opt);
          setShowService(false);
        }}
      />

      <PickerModal
        visible={showBranch}
        title="Select Branch"
        options={BRANCHES}
        onClose={() => setShowBranch(false)}
        onPick={(opt) => {
          setBranch(opt);
          setDoctor("");
          setShowBranch(false);
        }}
      />

      <PickerModal
        visible={showDoctor}
        title="Select Doctor"
        options={doctors}
        onClose={() => setShowDoctor(false)}
        onPick={(opt) => {
          setDoctor(opt);
          setShowDoctor(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
    paddingHorizontal: 18,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  imageWrap: {
    marginTop: 10,
  },

  heroImage: {
    height: 360,
    width: "100%",
    borderRadius: 40,
    resizeMode: "cover",
  },

  h1: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },

  h2: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textGray,
    lineHeight: 16,
  },

  dropdown: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },

  proceedBtn: {
    position: "absolute",
    right: 24,
    bottom: 50,
    width: 120,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  proceedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 18,
    justifyContent: "center",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 10,
  },

  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalItemText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "700",
  },
});