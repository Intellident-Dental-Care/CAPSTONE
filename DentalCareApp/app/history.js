import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "./theme/colors";
import ProfileSwitcherModal from "./components/ProfileSwitcherModal";
import {
  getSession,
  logoutUser,
  getProfilesByEmail,
  getActiveProfileByEmail,
  setActiveProfileByEmail,
  ensureDefaultProfileForEmail,
  addProfileToEmail,
} from "./storage/authStorage";

const historyData = [
  {
    month: "December 2024",
    items: [
      {
        doctor: "Dr. Dian Crizzie Mendoza",
        title: "Tooth Cleaning",
        type: "Routine",
        status: "InProgress",
      },
      {
        doctor: "Dr. Edward Barber",
        title: "Cosmetic Whitening",
        type: "Treatment",
        status: "Completed",
      },
    ],
  },
  {
    month: "January 2024",
    items: [
      {
        doctor: "Dr. Leigh Amparo",
        title: "Braces",
        type: "Treatment",
        status: "Completed",
      },
    ],
  },
  {
    month: "February 2023",
    items: [
      {
        doctor: "Dr. Leigh Amparo",
        title: "Wisdom Tooth Removal",
        type: "Treatment",
        status: "InProgress",
      },
      {
        doctor: "Dr. Dian Crizzie Mendoza",
        title: "Dental Check-up",
        type: "Routine",
        status: "Completed",
      },
    ],
  },
  {
    month: "March 2022",
    items: [
      {
        doctor: "Dr. Dian Crizzie Mendoza",
        title: "Dental Check-up",
        type: "Routine",
        status: "Completed",
      },
    ],
  },
];

export default function History() {
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    id: "",
    name: "User",
    icon: "person",
  });

  const loadProfiles = async () => {
    try {
      const session = await getSession();
      const email = (session?.email || "").trim().toLowerCase();

      setLoggedInEmail(email);

      if (!email) return;

      const setup = await ensureDefaultProfileForEmail(
        email,
        session?.fullName || "User"
      );

      if (setup?.profiles) {
        setProfiles(setup.profiles);
      }

      if (setup?.activeProfile) {
        setSelectedProfile(setup.activeProfile);
      } else {
        const savedProfiles = await getProfilesByEmail(email);
        const activeProfile = await getActiveProfileByEmail(email);

        setProfiles(savedProfiles);
        if (activeProfile) {
          setSelectedProfile(activeProfile);
        }
      }
    } catch (error) {
      console.log("loadProfiles error:", error);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  const handleSelectProfile = async (profile) => {
    try {
      setSelectedProfile(profile);
      setProfileModalVisible(false);

      if (loggedInEmail) {
        await setActiveProfileByEmail(loggedInEmail, profile);
      }
    } catch (error) {
      console.log("handleSelectProfile error:", error);
    }
  };

  const handleAddProfile = async (profileName) => {
    try {
      if (!loggedInEmail || !profileName?.trim()) return;

      const result = await addProfileToEmail(loggedInEmail, profileName);

      if (!result.success) {
        Alert.alert(
          "Unable to add profile",
          result.message || "Please try again."
        );
        return;
      }

      if (result.profile) {
        await setActiveProfileByEmail(loggedInEmail, result.profile);
        setSelectedProfile(result.profile);
        setProfileModalVisible(false);
        router.push("/patient-first-setup");
        return;
      }

      await loadProfiles();
    } catch (error) {
      console.log("handleAddProfile error:", error);
      Alert.alert("Error", "Failed to add profile.");
    }
  };

  const handleLogout = async () => {
    try {
      setProfileModalVisible(false);
      await logoutUser();
      router.replace("/get-started");
    } catch (error) {
      console.log("handleLogout error:", error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "InProgress":
        return {
          backgroundColor: "#EED8FF",
          textColor: "#C258FF",
          label: "InProgress",
        };

      case "Completed":
        return {
          backgroundColor: "#CFF7D7",
          textColor: "#3CCB5A",
          label: "Completed",
        };

      default:
        return {
          backgroundColor: "#EED8FF",
          textColor: "#C258FF",
          label: "InProgress",
        };
    }
  };

  const getTypeColor = (type) => {
    return type === "Routine" ? "#B84DFF" : "#38C96B";
  };

  const getSortedHistory = () => {
    const allItems = [];

    historyData.forEach((section) => {
      section.items.forEach((item) => {
        allItems.push({
          ...item,
          month: section.month,
        });
      });
    });

    const filtered = allItems.filter(
      (item) => filter === "All" || item.type === filter
    );

    filtered.sort((a, b) => {
      if (a.status === "InProgress" && b.status !== "InProgress") return -1;
      if (a.status !== "InProgress" && b.status === "InProgress") return 1;

      const dateA = new Date(a.month);
      const dateB = new Date(b.month);

      return dateB - dateA;
    });

    return filtered;
  };

  const groupedHistory = () => {
    const sorted = getSortedHistory();
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
              onPress={() => setProfileModalVisible(true)}
            >
              <Ionicons name="person" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.title}>History</Text>
        <Text style={styles.profileName}>
          {selectedProfile?.name || "User"}
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
            style={[styles.tabBtn, filter === "Treatment" && styles.activeTab]}
            onPress={() => setFilter("Treatment")}
          >
            <View style={styles.tabWithDot}>
              <View style={[styles.dot, { backgroundColor: "#38C96B" }]} />
              <Text
                style={[
                  styles.tabText,
                  filter === "Treatment" && styles.activeTabText,
                ]}
              >
                Treatment
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, filter === "Routine" && styles.activeTab]}
            onPress={() => setFilter("Routine")}
          >
            <View style={styles.tabWithDot}>
              <View style={[styles.dot, { backgroundColor: "#B84DFF" }]} />
              <Text
                style={[
                  styles.tabText,
                  filter === "Routine" && styles.activeTabText,
                ]}
              >
                Routine
              </Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {groupedHistory().map(([month, items]) => (
            <View key={month} style={styles.section}>
              <Text style={styles.monthText}>{month}</Text>

              {items.map((item, index) => {
                const statusStyle = getStatusStyle(item.status);

                return (
                  <View key={index} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.doctor}>{item.doctor}</Text>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyle.textColor },
                          ]}
                        >
                          {statusStyle.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.serviceTitle}>{item.title}</Text>

                    <View style={styles.cardBottom}>
                      <Text
                        style={[
                          styles.typeText,
                          { color: getTypeColor(item.type) },
                        ]}
                      >
                        {item.type}
                      </Text>

                      <Pressable style={styles.arrowBtn}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <ProfileSwitcherModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          profiles={profiles}
          selectedProfile={selectedProfile}
          onSelectProfile={handleSelectProfile}
          onAddProfile={handleAddProfile}
          onLogout={handleLogout}
        />
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
  },

  tabBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  tabText: {
    fontSize: 11,
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
    gap: 5,
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
    marginBottom: 8,
    fontSize: 12,
    color: "#B0B0B0",
  },

  card: {
    backgroundColor: "#ECECEC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  doctor: {
    flex: 1,
    marginRight: 8,
    fontSize: 12,
    color: "#8D8D8D",
  },

  statusBadge: {
    minWidth: 68,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
  },

  serviceTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: colors.primary,
  },

  cardBottom: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  arrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },
});