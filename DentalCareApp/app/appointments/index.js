import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "./../theme/colors";
import { supabase } from "../../server/supabaseService";
import { getCurrentActiveProfileForSession, getSession } from "../_storage/authStorage";
import {
  appointmentsListCache,
  APPOINTMENT_CACHE_TTL_MS,
} from "../_storage/profileCache";

const QUESTIONS = [
  "Do you feel tooth pain when biting or chewing?",
  "Do you experience sensitivity to cold drinks?",
  "Do you experience sensitivity to hot food/drinks?",
  "Do your gums bleed when brushing or flossing?",
  "Do you notice swelling in the gums or face?",
  "Do you have bad breath even after brushing?",
  "Do you see a visible hole or dark spot on the tooth?",
  "Do you feel pain that wakes you up at night?",
  "Do you feel pain when eating sweet food?",
  "Have you had a filling or dental treatment on this tooth before?",
];

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    String(value)
  );
}

function fmt12h(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hr = parseInt(h, 10);
  if (Number.isNaN(hr)) return String(t);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${m} ${ampm}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "No date";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(dateStr) {
  if (!dateStr) return "Unknown Month";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function normalizeQaList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AppointmentsScreen() {
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      const activeProfile = await getCurrentActiveProfileForSession();
      const profileId = isUuid(activeProfile?.id) ? activeProfile.id : null;
      const cacheKey = profileId || "__no_profile__";
      const cached = appointmentsListCache[cacheKey];

      // Instantly load cached data for UI speed
      if (cached) setAppointments(cached.data);

      // The stale check is removed here so it ALWAYS fetches fresh data in the background

      let dbQuery = supabase
        .from("bookings")
        .select(
          "*, dentist_list(name, specialization), patient_preassessment(tooth_selected, description, answers)"
        )
        .order("appointment_date", { ascending: false });

      if (profileId) {
        dbQuery = dbQuery.eq("profile_id", profileId);
      } else {
        // Fast local session fetch (Prevents re-login network delays)
        const session = await getSession();
        const user = session?.user;
        if (!user) return;

        if (activeProfile?.name) {
          dbQuery = dbQuery
            .eq("user_id", user.id)
            .eq("patient_name", activeProfile.name);
        } else {
          dbQuery = dbQuery.eq("user_id", user.id);
        }
      }

      const { data, error } = await dbQuery;
      if (error) throw error;

      const serviceNames = [
        ...new Set((data || []).map((b) => b.service).filter(Boolean)),
      ];

      let servicesMap = {};

      if (serviceNames.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from("dental_services")
          .select("name, price_min")
          .in("name", serviceNames);

        if (!servicesError && servicesData) {
          servicesData.forEach((s) => {
            servicesMap[s.name] = s.price_min;
          });
        }
      }

      const statusMap = {
        pending: "Upcoming",
        confirmed: "Upcoming",
        completed: "Completed",
        cancelled: "Cancelled",
      };

      const mapped = (data || []).map((b) => {
        const rawDate = b.appointment_date;

        let pa = b.patient_preassessment || {};
        if (Array.isArray(pa)) pa = pa[0] || {};

        let qaList = [];
        if (pa.answers) {
          let parsedAnswers = pa.answers;

          if (typeof parsedAnswers === "string") {
            try {
              parsedAnswers = JSON.parse(parsedAnswers);
            } catch (e) {}
          }

          if (
            parsedAnswers &&
            typeof parsedAnswers === "object" &&
            Object.keys(parsedAnswers).length > 0
          ) {
            qaList = QUESTIONS.map((q, idx) => ({
              question: q,
              answer:
                parsedAnswers[idx] ||
                parsedAnswers[String(idx)] ||
                "Not answered",
            }));
          }
        }

        const priceMin = servicesMap[b.service];
        const formattedPrice =
          priceMin != null
            ? `Starting Price: ₱${priceMin.toLocaleString()}`
            : "Starting Price: N/A";

        const fallbackTooth =
          pa.tooth_selected || b.tooth_area || b.tooth || "Not specified";
        const fallbackDesc =
          pa.description || b.description || "No description provided.";
        const fallbackQaList =
          qaList.length > 0
            ? qaList
            : normalizeQaList(b.qa_list || b.questionnaire);

        return {
          id: String(b.id),
          doctor: b.dentist_list?.name || "Unknown Dentist",
          title: b.service || "Dental Appointment",
          type: "Treatment",
          status:
            statusMap[String(b.status || "").toLowerCase()] || "Upcoming",
          date: formatDisplayDate(rawDate),
          time: fmt12h(b.appointment_time),
          tooth: fallbackTooth,
          description: fallbackDesc,
          qaList: fallbackQaList,
          suggestedTreatment: b.suggested_treatment || b.service || "N/A",
          suggestedPrice: formattedPrice,
          procedure: b.service || "Dental Appointment",
          month: formatMonthLabel(rawDate),
        };
      });

      appointmentsListCache[cacheKey] = {
        data: mapped,
        fetchedAt: Date.now(),
      };

      setAppointments(mapped);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const handleOpenDetails = (item) => {
    setSelectedAppointment(item);
    setDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment?.id) return;

    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No, keep it", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", selectedAppointment.id);

              if (error) throw error;

              // Update local state AND update the cache so it doesn't revert back on focus
              setAppointments((prev) => {
                const updated = prev.map((item) =>
                  item.id === selectedAppointment.id
                    ? { ...item, status: "Cancelled" }
                    : item
                );

                for (let key in appointmentsListCache) {
                  if (appointmentsListCache[key]?.data) {
                    appointmentsListCache[key].data = appointmentsListCache[key].data.map((item) =>
                      item.id === selectedAppointment.id
                        ? { ...item, status: "Cancelled" }
                        : item
                    );
                  }
                }

                return updated;
              });

              handleCloseDetails();
              Alert.alert("Success", "Appointment has been cancelled.");
            } catch (err) {
              console.error("Cancel appointment error:", err);
              Alert.alert("Error", "Failed to cancel the appointment.");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    if (status === "Upcoming") return "#D89B00";
    if (status === "Completed") return "#2FA55A";
    if (status === "Cancelled") return "#E24C4B";
    return "#8D8D8D";
  };

  const getStatusBg = (status) => {
    if (status === "Upcoming") return "#FFF3D6";
    if (status === "Completed") return "#DDF7E5";
    if (status === "Cancelled") return "#FDE2E2";
    return "#EFEFEF";
  };

  const getStatusIcon = (status) => {
    if (status === "Upcoming") return "time";
    if (status === "Completed") return "checkmark-circle";
    if (status === "Cancelled") return "close-circle";
    return "ellipse";
  };

  const getSortedAppointments = () => {
    const filtered = appointments.filter(
      (item) => filter === "All" || item.status === filter
    );

    filtered.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB - dateA;
    });

    return filtered;
  };

  const groupedAppointments = () => {
    const sorted = getSortedAppointments();
    const groups = {};

    sorted.forEach((item) => {
      if (!groups[item.month]) groups[item.month] = [];
      groups[item.month].push(item);
    });

    return Object.entries(groups);
  };

  const groups = groupedAppointments();

  return (
    <View style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

          <View style={styles.topRight}>
            <Pressable
              style={styles.notifPill}
              onPress={() => router.push("/notification")}
            >
              <Ionicons
                name="notifications-outline"
                size={16}
                color={colors.primary}
              />
            </Pressable>

            <Pressable
              style={styles.avatarSmall}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.profileName}>
          View your upcoming and past appointments
        </Text>

        <View style={styles.tabs}>
          {["All", "Upcoming", "Completed", "Cancelled"].map((item) => (
            <Pressable
              key={item}
              style={[styles.tabBtn, filter === item && styles.activeTab]}
              onPress={() => setFilter(item)}
            >
              <View style={styles.tabWithDot}>
                {item !== "All" && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          item === "Upcoming"
                            ? "#D89B00"
                            : item === "Completed"
                            ? "#2FA55A"
                            : "#E24C4B",
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    filter === item && styles.activeTabText,
                  ]}
                >
                  {item}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            groups.length === 0 && styles.emptyContainer,
          ]}
        >
          {groups.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={58} color="#E2E2E2" />

              <Text style={styles.emptyTitle}>No appointments found</Text>

              <Text style={styles.emptySubtext}>
                {filter === "All"
                  ? "You don’t have any appointments yet."
                  : `No ${filter.toLowerCase()} appointments available.`}
              </Text>
            </View>
          ) : (
            groups.map(([month, items]) => (
              <View key={month} style={styles.section}>
                <Text style={styles.monthText}>{month}</Text>

                {items.map((item, index) => {
                  const statusColor = getStatusColor(item.status);
                  const statusBg = getStatusBg(item.status);

                  return (
                    <Pressable
                      key={`${item.id}-${index}`}
                      style={styles.card}
                      onPress={() => handleOpenDetails(item)}
                    >
                      <View style={styles.cardGlow} />

                      <View style={styles.cardTop}>
                        <View style={styles.dateRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color="#8D8D8D"
                          />
                          <Text style={styles.dateText}>{item.date}</Text>
                          <View style={styles.dateDot} />
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color="#8D8D8D"
                          />
                          <Text style={styles.dateText}>{item.time}</Text>
                        </View>

                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: statusBg },
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(item.status)}
                            size={12}
                            color={statusColor}
                          />
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: statusColor },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.leftIconWrap}>
                          <Ionicons
                            name="calendar-clear-outline"
                            size={22}
                            color={colors.primary}
                          />
                        </View>

                        <View style={styles.cardMainContent}>
                          <Text style={styles.serviceTitle}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardSubtitle}>
                            {item.procedure}
                          </Text>
                        </View>

                        <View style={styles.arrowWrap}>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                      </View>

                      <View style={styles.cardFooter}>
                        <View style={styles.metaPill}>
                          <Ionicons
                            name="medical-outline"
                            size={12}
                            color="#8D8D8D"
                          />
                          <Text style={styles.metaPillText}>
                            {item.tooth || "Tooth Record"}
                          </Text>
                        </View>

                        <View style={styles.metaPill}>
                          <Ionicons
                            name="person-outline"
                            size={12}
                            color="#8D8D8D"
                          />
                          <Text style={styles.metaPillText} numberOfLines={1}>
                            {item.doctor}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={detailsVisible}
          animationType="slide"
          transparent
          onRequestClose={handleCloseDetails}
        >
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Appointment Details</Text>
                  <Text style={styles.modalSubTitle}>
                    Appointment information and AI assessment
                  </Text>
                </View>

                <Pressable
                  style={styles.closeCircle}
                  onPress={handleCloseDetails}
                >
                  <Ionicons name="close" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <View style={styles.detailTopRow}>
                    <Text style={styles.detailProcedure}>
                      {selectedAppointment?.title}
                    </Text>

                    {!!selectedAppointment?.status && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusBg(
                              selectedAppointment.status
                            ),
                          },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(selectedAppointment.status)}
                          size={13}
                          color={getStatusColor(selectedAppointment.status)}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: getStatusColor(
                                selectedAppointment.status
                              ),
                            },
                          ]}
                        >
                          {selectedAppointment.status}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.detailTreatment}>
                    {selectedAppointment?.procedure}
                  </Text>

                  <View style={styles.detailInfoGrid}>
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Dentist</Text>
                      <Text style={styles.value}>
                        {selectedAppointment?.doctor}
                      </Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.value}>
                        {selectedAppointment?.date}
                      </Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Time</Text>
                      <Text style={styles.value}>
                        {selectedAppointment?.time}
                      </Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Tooth / Area</Text>
                      <Text style={styles.value}>
                        {selectedAppointment?.tooth}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.aiCard}>
                  <View style={styles.aiTitleRow}>
                    <View style={styles.aiIconWrap}>
                      <Ionicons
                        name="sparkles-outline"
                        size={18}
                        color="#fff"
                      />
                    </View>

                    <View>
                      <Text style={styles.aiTitle}>AI Assessment</Text>
                      <Text style={styles.aiSubtitle}>
                        Summary of your pre-assessment
                      </Text>
                    </View>
                  </View>

                  <View style={styles.toothPlaceholderCard}>
                    <View style={styles.toothCircle}>
                      <Ionicons
                        name="medical-outline"
                        size={28}
                        color={colors.primary}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.toothPlaceholderLabel}>
                        Affected Tooth
                      </Text>
                      <Text style={styles.toothPlaceholderValue}>
                        {selectedAppointment?.tooth}
                      </Text>
                      <Text style={styles.toothPlaceholderHint}>
                        Pre-assessment tooth information
                      </Text>
                    </View>
                  </View>

                  <View style={styles.suggestedCard}>
                      <Text style={styles.suggestedLabel}>
                        Suggested Treatment
                      </Text>

                      <Text style={styles.suggestedValue}>
                        {selectedAppointment?.suggestedTreatment}
                      </Text>

                      <Text style={styles.suggestedPrice}>
                        {selectedAppointment?.suggestedPrice}
                      </Text>
                    </View>

                    <View style={styles.assessmentBox}>
                    <Text style={styles.assessmentLabel}>
                      Patient Description
                    </Text>

                    <Text style={styles.assessmentText}>
                      {selectedAppointment?.description}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Questionnaire</Text>
                  <View style={styles.qaBox}>
                    {selectedAppointment?.qaList?.length ? (
                      selectedAppointment.qaList.map((q, i) => {
                        const answerText =
                          typeof q.answer === "object"
                            ? q.answer?.answer || JSON.stringify(q.answer)
                            : q.answer;

                        return (
                          <View key={i} style={styles.qaItem}>
                            <Text style={styles.qText}>
                              Q: {q.question || `Question ${i + 1}`}
                            </Text>

                            <Text style={styles.aText}>
                              A: {answerText || "No answer"}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.aText}>No questionnaire data.</Text>
                    )}
                  </View>
                </View>

                {selectedAppointment?.status === "Upcoming" && (
                  <Pressable
                    style={styles.cancelAppointmentBtn}
                    onPress={handleCancelAppointment}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#fff" />

                    <Text style={styles.cancelAppointmentText}>
                      Cancel Appointment
                    </Text>
                  </Pressable>
                )}

                <View style={{ height: 18 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 8,
    paddingHorizontal: 18,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notifPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  title: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
  },

  profileName: {
    marginTop: 4,
    fontSize: 12,
    color: "#8D8D8D",
    fontWeight: "600",
  },

  tabs: {
    marginTop: 18,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  tabBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  tabText: {
    fontSize: 10,
    color: "#8A8A8A",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#fff",
    fontWeight: "800",
  },

  tabWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  scrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 120,
  },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#4A4A4A",
  },

  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: "#9A9A9A",
    textAlign: "center",
    lineHeight: 20,
  },

  section: {
    marginBottom: 18,
  },

  monthText: {
    marginLeft: 6,
    marginBottom: 10,
    fontSize: 12,
    color: "#B0B0B0",
    fontWeight: "700",
  },

  card: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  cardGlow: {
    position: "absolute",
    top: -12,
    right: -12,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFE7F0",
    opacity: 0.55,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  dateRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },

  dateText: {
    fontSize: 11,
    color: "#8D8D8D",
    fontWeight: "600",
  },

  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C6C6C6",
    marginHorizontal: 2,
  },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  cardBody: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  leftIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardMainContent: {
    flex: 1,
    paddingRight: 8,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 20,
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#787878",
    fontWeight: "600",
  },

  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7EEF2",
    alignItems: "center",
    justifyContent: "center",
  },

  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },

  metaPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },

  metaPillText: {
    flex: 1,
    fontSize: 11,
    color: "#6F6F6F",
    fontWeight: "700",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.34)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "92%",
  },

  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D9D9D9",
    marginBottom: 10,
  },

  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2F2F2F",
  },

  modalSubTitle: {
    marginTop: 3,
    color: "#7A7A7A",
    fontSize: 12.5,
  },

  closeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F6F6F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ECECEC",
    marginBottom: 14,
  },

  detailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  detailProcedure: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#232323",
    paddingRight: 8,
  },

  detailTreatment: {
    marginTop: 4,
    color: "#6D6D6D",
    fontSize: 13,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },

  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
  },

  detailInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },

  detailInfoItem: {
    width: "48%",
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  label: {
    fontSize: 11.5,
    color: "#888888",
    marginBottom: 4,
    fontWeight: "700",
  },

  value: {
    fontSize: 13.5,
    color: "#333333",
    fontWeight: "800",
  },

  aiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  aiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  aiTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2F2F2F",
  },

  aiSubtitle: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 2,
  },

  toothPlaceholderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginBottom: 14,
  },

  toothCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  toothPlaceholderLabel: {
    fontSize: 11.5,
    color: "#7F7F7F",
    fontWeight: "700",
  },

  toothPlaceholderValue: {
    marginTop: 3,
    fontSize: 16,
    color: "#333333",
    fontWeight: "900",
  },

  toothPlaceholderHint: {
    marginTop: 4,
    fontSize: 11.5,
    color: "#9A9A9A",
  },

  assessmentBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  assessmentLabel: {
    color: "#444444",
    fontWeight: "800",
    fontSize: 12.5,
    marginBottom: 6,
  },

  assessmentText: {
    color: "#5C5C5C",
    fontSize: 13,
    lineHeight: 19,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#333333",
    marginBottom: 10,
  },

  qaBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  qaItem: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E7E7",
  },

  qText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#3F3F3F",
    marginBottom: 4,
  },

  aText: {
    fontSize: 12.5,
    color: "#696969",
    lineHeight: 18,
  },

  suggestedCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 14,
  },
  
  suggestedLabel: {
    fontSize: 12,
    color: "#7C7C7C",
    fontWeight: "700",
  },

  suggestedValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: "#2F2F2F",
  },

  suggestedPrice: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "900",
    color: "#2F7D4D",
  },

  cancelAppointmentBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E24C4B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  cancelAppointmentText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});