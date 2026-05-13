import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";
import { supabase } from "../../server/supabaseService";

function PickerModal({ visible, title, options, onClose, onPick }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <Pressable key={opt} style={styles.modalItem} onPress={() => onPick(opt)}>
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

  const {
    service: passedService,
    serviceName: passedServiceName,
    preassessmentId,
    branch: passedBranch,
    doctor: passedDoctor,
  } = useLocalSearchParams();

  const incomingService =
    typeof passedService === "string" && passedService.trim()
      ? passedService
      : typeof passedServiceName === "string"
      ? passedServiceName
      : "";

  const [service, setService] = useState(incomingService);
  const [branch, setBranch] = useState(
    typeof passedBranch === "string" ? passedBranch : ""
  );
  const [doctor, setDoctor] = useState(
    typeof passedDoctor === "string" ? passedDoctor : ""
  );
  const [doctorId, setDoctorId] = useState("");

  const [showService, setShowService] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);

  const [branches, setBranches] = useState([]);
  const [doctorsByBranch, setDoctorsByBranch] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDentists();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("dental_services")
        .select("name, category, subcategory")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setServices((data || []).map((s) => s.name));
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const fetchDentists = async () => {
    try {
      setLoading(true);

      const [
        { data: dentists, error: dentistsError },
        { data: schedules, error: schedulesError },
      ] = await Promise.all([
        supabase
          .from("dentist_list")
          .select(
            "id, name, specialization, experience_years, total_patients, success_rate"
          ),
        supabase
          .from("dentist_schedule")
          .select("dentist_id, branch, day_of_week")
          .eq("is_active", true),
      ]);

      if (dentistsError) throw dentistsError;
      if (schedulesError) throw schedulesError;

      const dentistMap = new Map((dentists || []).map((d) => [d.id, d]));
      const branchGroups = {};
      const seenByBranch = {};

      (schedules || []).forEach((row) => {
        const branchName = row.branch?.trim();
        const dentist = dentistMap.get(row.dentist_id);

        if (!branchName || !dentist) return;

        if (!branchGroups[branchName]) branchGroups[branchName] = [];
        if (!seenByBranch[branchName]) seenByBranch[branchName] = new Set();
        if (seenByBranch[branchName].has(dentist.id)) return;

        seenByBranch[branchName].add(dentist.id);
        branchGroups[branchName].push(dentist);
      });

      setBranches(Object.keys(branchGroups).sort((a, b) => a.localeCompare(b)));
      setDoctorsByBranch(branchGroups);

      if (typeof passedBranch === "string" && typeof passedDoctor === "string") {
        const presetDoctor =
          branchGroups[passedBranch]?.find((d) => d.name === passedDoctor) ||
          null;

        if (presetDoctor) setDoctorId(presetDoctor.id);
      }
    } catch (err) {
      console.error("Error fetching dentists:", err);
      Alert.alert("Error", "Failed to load dentist data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!branch || !doctor) {
      setDoctorId("");
      return;
    }

    const selected = (doctorsByBranch[branch] || []).find(
      (d) => d.name === doctor
    );

    setDoctorId(selected?.id || "");
  }, [branch, doctor, doctorsByBranch]);

  const doctors = useMemo(() => {
    if (!branch) return [];
    return doctorsByBranch[branch] || [];
  }, [branch, doctorsByBranch]);

  const canProceed = !!(service && branch && doctor);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.textGray }}>
          Loading dentists...
        </Text>
      </View>
    );
  }

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
        style={[styles.dropdown, { marginTop: 12 }, !branch && { opacity: 0.55 }]}
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
            params: {
              service,
              branch,
              doctor,
              doctorId,
              preassessmentId,
            },
          });
        }}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </Pressable>

      <PickerModal
        visible={showService}
        title="Select Service"
        options={services}
        onClose={() => setShowService(false)}
        onPick={(opt) => {
          setService(opt);
          setShowService(false);
        }}
      />

      <PickerModal
        visible={showBranch}
        title="Select Branch"
        options={branches}
        onClose={() => setShowBranch(false)}
        onPick={(opt) => {
          setBranch(opt);
          setDoctor("");
          setDoctorId("");
          setShowBranch(false);
        }}
      />

      <PickerModal
        visible={showDoctor}
        title="Select Doctor"
        options={doctors.map((d) => d.name)}
        onClose={() => setShowDoctor(false)}
        onPick={(opt) => {
          const selectedDentist = doctors.find((d) => d.name === opt);
          setDoctor(opt);
          setDoctorId(selectedDentist?.id || "");
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
    paddingTop: 16,
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
    marginTop: 6,
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
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1D2DE",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8FB",
  },

  dropdownText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },

  proceedBtn: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 120,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
    borderRadius: 22,
    padding: 18,
  },

  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },

  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },

  modalItemText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "700",
  },
});