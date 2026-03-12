import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../theme/colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import PinkAlert from "../components/PinkAlert";

/* ---------- helpers ---------- */
function monthShort(d) {
  return d.toLocaleString("en-US", { month: "short" }).toUpperCase();
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}
function formatMonthDay(d) {
  return `${monthShort(d)} ${pad2(d.getDate())}`;
}
function buildNext7Days() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return { iso: toISODate(d), label: formatMonthDay(d) };
  });
}

/* ---------- component ---------- */
export default function BookingAppointment() {
  const router = useRouter();
  const { service, branch, doctor } = useLocalSearchParams();

  const [showAlert, setShowAlert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [datePills, setDatePills] = useState(() => buildNext7Days());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedISO, setSelectedISO] = useState(toISODate(today));
  const [selectedLabel, setSelectedLabel] = useState(formatMonthDay(today));

  const [selectedTime, setSelectedTime] = useState("9:00 AM");
  const [timeTab, setTimeTab] = useState("Morning");

  const [showCalendar, setShowCalendar] = useState(false);
  const [pickedDate, setPickedDate] = useState(today);

  const timesMorning = [
    "8:00 AM",
    "8:30 AM",
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
  ];

  const timesAfternoon = [
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
  ];

  const times = timeTab === "Morning" ? timesMorning : timesAfternoon;

  const onPickDate = (event, date) => {
    if (Platform.OS !== "ios") setShowCalendar(false);

    if (event?.type === "dismissed" || !date) return;

    date.setHours(0, 0, 0, 0);
    setPickedDate(date);

    const iso = toISODate(date);
    const label = formatMonthDay(date);

    setSelectedISO(iso);
    setSelectedLabel(label);

    setDatePills((prev) => {
      const exists = prev.some((p) => p.iso === iso);
      if (exists) return prev;

      const next = [...prev, { iso, label }].sort((a, b) =>
        a.iso.localeCompare(b.iso)
      );

      if (next.length > 7) next.shift();
      return next;
    });

    if (Platform.OS === "ios") setShowCalendar(false);
  };

  const handleBookNow = () => {
    setShowPreview(true);
  };

  const handleConfirmBooking = () => {
    setShowPreview(false);
    setShowAlert(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.headerRight}>
          <Ionicons name="heart-outline" size={18} color={colors.primary} />
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.doctorRow}>
        <View style={styles.docPic}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.docName}>{doctor || "Doctor"}</Text>
          <Text style={styles.docSub}>Orthodontics</Text>
          <Text style={styles.docSub}>{branch || "Branch"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Experience" value="14 years" />
        <Stat label="Patients" value="1234" />
        <Stat label="Success Rate" value="99.9%" />
      </View>

      <View style={styles.tabsRow}>
        <Text style={[styles.tab, styles.tabActive]}>Schedules</Text>
        <Text style={styles.tab}>About</Text>
        <Text style={styles.tab}>Experiences</Text>
        <Text style={styles.tab}>Specialization</Text>
      </View>
      <View style={styles.tabLine} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.section}>Date</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {(Array.isArray(datePills) ? datePills : []).map((d) => {
            const active = d.iso === selectedISO;
            return (
              <Pressable
                key={d.iso}
                style={[styles.datePill, active && styles.datePillActive]}
                onPress={() => {
                  setSelectedISO(d.iso);
                  setSelectedLabel(d.label);
                }}
              >
                <Text style={[styles.dateText, active && { color: "#fff" }]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={[styles.datePill, styles.calendarPill]}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </Pressable>
        </ScrollView>

        {showCalendar && (
          <DateTimePicker
            value={pickedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={onPickDate}
            accentColor={colors.primary}
          />
        )}

        <Text style={[styles.section, { marginTop: 18 }]}>Time</Text>

        <View style={styles.timeTabs}>
          <Pressable
            style={[
              styles.timeTab,
              timeTab === "Morning" && styles.timeTabActive,
            ]}
            onPress={() => setTimeTab("Morning")}
          >
            <Text
              style={[
                styles.timeTabText,
                timeTab === "Morning" && { color: "#fff" },
              ]}
            >
              Morning
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.timeTab,
              timeTab === "Afternoon" && styles.timeTabActive,
            ]}
            onPress={() => setTimeTab("Afternoon")}
          >
            <Text
              style={[
                styles.timeTabText,
                timeTab === "Afternoon" && { color: "#fff" },
              ]}
            >
              Afternoon
            </Text>
          </Pressable>
        </View>

        <View style={styles.timeGrid}>
          {times.map((t) => {
            const active = t === selectedTime;
            return (
              <Pressable
                key={t}
                style={[styles.timeBox, active && styles.timeBoxActive]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeText, active && { color: "#fff" }]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable style={styles.bookBtn} onPress={handleBookNow}>
        <Text style={styles.bookText}>Book Now</Text>
      </Pressable>

      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPreview(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Booking Preview</Text>
            <Text style={styles.modalSubtitle}>
              Please review your appointment details before confirming.
            </Text>

            <View style={styles.previewBox}>
              <PreviewRow label="Service" value={service || "No service selected"} />
              <PreviewRow label="Doctor" value={doctor || "No doctor selected"} />
              <PreviewRow label="Branch" value={branch || "No branch selected"} />
              <PreviewRow label="Date" value={selectedLabel} />
              <PreviewRow label="Time" value={selectedTime} />
            </View>

            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirmBooking}
            >
              <Text style={styles.confirmText}>Confirm Booking</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <PinkAlert
        visible={showAlert}
        title="Booking Confirmed!"
        message={`Your appointment for ${service || "Dental Service"} with ${
          doctor || "Doctor"
        } at ${branch || "Branch"} is booked on ${selectedLabel} at ${selectedTime}.`}
        onClose={() => {
          setShowAlert(false);
          router.replace("/home");
        }}
      />
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#666" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 9, color: colors.textGray }}>{label}</Text>
    </View>
  );
}

function PreviewRow({ label, value }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  headerRight: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  doctorRow: {
    marginTop: 10,
    marginLeft: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  docPic: {
    width: 77,
    height: 83,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },

  docName: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
  },

  docSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textGray,
  },

  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  tabsRow: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  tab: {
    fontSize: 11,
    color: colors.textGray,
  },

  tabActive: {
    color: colors.primary,
    fontWeight: "900",
  },

  tabLine: {
    marginTop: 8,
    height: 1,
    backgroundColor: "#eee",
  },

  section: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
  },

  datePill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },

  datePillActive: {
    backgroundColor: colors.primary,
  },

  dateText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#777",
  },

  calendarPill: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.primary,
  },

  timeTabs: {
    marginTop: 10,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#EDEDED",
    flexDirection: "row",
    overflow: "hidden",
  },

  timeTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  timeTabActive: {
    backgroundColor: colors.primary,
  },

  timeTabText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#777",
  },

  timeGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  timeBox: {
    width: "47%",
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },

  timeBoxActive: {
    backgroundColor: colors.primary,
  },

  timeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#777",
  },

  bookBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: 160,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  bookText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: "center",
    marginBottom: 16,
  },

  previewBox: {
    backgroundColor: "#FFE9F1",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  previewRow: {
    marginBottom: 10,
  },

  previewLabel: {
    fontSize: 11,
    color: colors.textGray,
    marginBottom: 2,
    fontWeight: "700",
  },

  previewValue: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "900",
  },

  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },

  confirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  cancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },
});