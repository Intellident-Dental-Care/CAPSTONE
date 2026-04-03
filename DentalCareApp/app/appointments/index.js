import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./../theme/colors";

const appointmentsData = [
  {
    month: "March 2026",
    items: [
      {
        id: "APT-1001",
        doctor: "Dr. Dian Crizzie Mendoza",
        title: "Tooth Cleaning",
        type: "Routine",
        status: "Upcoming",
        date: "March 14, 2026",
        time: "9:30 AM",
        tooth: "3rd Molar",
        description:
          "Patient experiences mild gum discomfort and sensitivity when brushing around the affected area.",
        qaList: [
          {
            question: "Do you feel tooth pain when biting or chewing?",
            answer: "No",
          },
          {
            question: "Do you experience sensitivity to cold drinks?",
            answer: "Yes",
          },
          {
            question: "Do your gums bleed when brushing or flossing?",
            answer: "Yes",
          },
        ],
        suggestedTreatment: "Tooth Cleaning",
        suggestedPrice: "Starting Price: ₱1,000",
        procedure: "Oral Prophylaxis / Tooth Cleaning",
      },
      {
        id: "APT-1002",
        doctor: "Dr. Edward Barber",
        title: "Cosmetic Whitening",
        type: "Treatment",
        status: "Completed",
        date: "March 10, 2026",
        time: "2:00 PM",
        tooth: "Front Incisor",
        description:
          "Patient wants whiter front teeth and reports visible yellow staining.",
        qaList: [
          {
            question: "Do you feel tooth pain when biting or chewing?",
            answer: "No",
          },
          {
            question: "Do you experience sensitivity to cold drinks?",
            answer: "No",
          },
        ],
        suggestedTreatment: "Cosmetic Whitening",
        suggestedPrice: "Starting Price: ₱3,500",
        procedure: "Teeth Whitening",
      },
    ],
  },
  {
    month: "February 2026",
    items: [
      {
        id: "APT-1003",
        doctor: "Dr. Leigh Amparo",
        title: "Braces Adjustment",
        type: "Treatment",
        status: "Cancelled",
        date: "February 18, 2026",
        time: "11:00 AM",
        tooth: "Upper and Lower Teeth",
        description:
          "Patient is under orthodontic treatment and was scheduled for routine braces adjustment.",
        qaList: [
          {
            question: "Do you feel tooth pain when biting or chewing?",
            answer: "Slightly",
          },
          {
            question: "Do you experience sensitivity to cold drinks?",
            answer: "No",
          },
        ],
        suggestedTreatment: "Braces Adjustment",
        suggestedPrice: "Starting Price: ₱1,500",
        procedure: "Orthodontic Braces Adjustment",
      },
      {
        id: "APT-1004",
        doctor: "Dr. Santos",
        title: "Tooth Filling",
        type: "Treatment",
        status: "Upcoming",
        date: "February 25, 2026",
        time: "1:30 PM",
        tooth: "2nd Premolar",
        description:
          "Small cavity was found and the patient is scheduled for restoration.",
        qaList: [
          {
            question: "Do you feel tooth pain when biting or chewing?",
            answer: "Yes",
          },
          {
            question: "Do you feel pain when eating sweet food?",
            answer: "Yes",
          },
        ],
        suggestedTreatment: "Dental Filling",
        suggestedPrice: "Starting Price: ₱1,200",
        procedure: "Dental Restoration / Tooth Filling",
      },
    ],
  },
];

export default function AppointmentsScreen() {
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleOpenDetails = (item) => {
    setSelectedAppointment(item);
    setDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setSelectedAppointment(null);
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
    const allItems = [];

    appointmentsData.forEach((section) => {
      section.items.forEach((item) => {
        allItems.push({
          ...item,
          month: section.month,
        });
      });
    });

    const filtered = allItems.filter(
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
      if (!groups[item.month]) {
        groups[item.month] = [];
      }
      groups[item.month].push(item);
    });

    return Object.entries(groups);
  };

  return (
    <SafeAreaView style={styles.safe}>
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
          <Pressable
            style={[styles.tabBtn, filter === "All" && styles.activeTab]}
            onPress={() => setFilter("All")}
          >
            <Text
              style={[styles.tabText, filter === "All" && styles.activeTabText]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, filter === "Upcoming" && styles.activeTab]}
            onPress={() => setFilter("Upcoming")}
          >
            <View style={styles.tabWithDot}>
              <View style={[styles.dot, { backgroundColor: "#D89B00" }]} />
              <Text
                style={[
                  styles.tabText,
                  filter === "Upcoming" && styles.activeTabText,
                ]}
              >
                Upcoming
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, filter === "Completed" && styles.activeTab]}
            onPress={() => setFilter("Completed")}
          >
            <View style={styles.tabWithDot}>
              <View style={[styles.dot, { backgroundColor: "#2FA55A" }]} />
              <Text
                style={[
                  styles.tabText,
                  filter === "Completed" && styles.activeTabText,
                ]}
              >
                Completed
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, filter === "Cancelled" && styles.activeTab]}
            onPress={() => setFilter("Cancelled")}
          >
            <View style={styles.tabWithDot}>
              <View style={[styles.dot, { backgroundColor: "#E24C4B" }]} />
              <Text
                style={[
                  styles.tabText,
                  filter === "Cancelled" && styles.activeTabText,
                ]}
              >
                Cancelled
              </Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {groupedAppointments().map(([month, items]) => (
            <View key={month} style={styles.section}>
              <Text style={styles.monthText}>{month}</Text>

              {items.map((item, index) => {
                const statusColor = getStatusColor(item.status);
                const statusBg = getStatusBg(item.status);

                return (
                  <Pressable
                    key={index}
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
                          style={[styles.typeBadgeText, { color: statusColor }]}
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
                        <Text style={styles.serviceTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.procedure}</Text>
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
          ))}
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
                              color: getStatusColor(selectedAppointment.status),
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
                        {selectedAppointment?.tooth || "Not specified"}
                      </Text>
                      <Text style={styles.toothPlaceholderHint}>
                        Pre-assessment tooth information
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assessmentBox}>
                    <Text style={styles.assessmentLabel}>
                      Patient Description
                    </Text>
                    <Text style={styles.assessmentText}>
                      {selectedAppointment?.description ||
                        "No description provided."}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Questionnaire</Text>
                  <View style={styles.qaBox}>
                    {selectedAppointment?.qaList?.map((q, i) => (
                      <View key={i} style={styles.qaItem}>
                        <Text style={styles.qText}>Q: {q.question}</Text>
                        <Text style={styles.aText}>A: {q.answer}</Text>
                      </View>
                    ))}
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
                </View>

                <View style={{ height: 18 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingTop: 46,
    paddingHorizontal: 18,
  },

  topBar: {
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

  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notifPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: 10,
    fontSize: 26,
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
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    gap: 4,
  },

  tabBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
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
    fontWeight: "500",
  },

  activeTabText: {
    color: "#fff",
    fontWeight: "700",
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
    paddingBottom: 30,
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
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1E9EE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
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
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
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
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },

  metaPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
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
});