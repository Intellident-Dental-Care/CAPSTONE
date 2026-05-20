import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { WebView } from "react-native-webview";
import { colors } from "./theme/colors";
import ProfileSwitcherModal from "./components/ProfileSwitcherModal";
import { getServerUrl } from "../server/getClientSideUrl";
import {
  getSession,
  logoutUser,
  getProfilesByEmail,
  getActiveProfileByEmail,
  setActiveProfileByEmail,
  ensureDefaultProfileForEmail,
  addProfileToEmail,
} from "./_storage/authStorage";
import {
  profileIndexCache,
  clearAllProfileCaches,
} from "./_storage/profileCache";

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

export default function History() {
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [fullName, setFullName] = useState(profileIndexCache.fullName || "User");
  const [loggedInEmail, setLoggedInEmail] = useState(profileIndexCache.loggedInEmail || "");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    id: "",
    name: "User",
    icon: "person",
  });

  const [historyData, setHistoryData] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDetailsVisible, setHistoryDetailsVisible] = useState(false);

  const fetchHistoryData = async (profile = null) => {
    try {
      const session = await getSession();
      const userId = session?.user?.id || session?.id; 
      const token = session?.session?.access_token || session?.access_token || "";

      if (!userId) return;

      const baseUrl = await getServerUrl();
      
      if (!baseUrl) {
        console.warn('[History] No server URL available');
        return;
      }
      
      let apiUrl = `${baseUrl}/api/patient-history?userId=${userId}`;
      
      // Add profileId only if it's a valid UUID
      const safeProfileId = isUuid(profile?.id) ? profile.id : null;
      if (safeProfileId) {
        apiUrl += `&profileId=${safeProfileId}`;
      }

      console.log("[History] Fetching from:", apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });

      // Check if response is OK
      if (!res.ok) {
        const text = await res.text();
        console.error("fetchHistoryData error response:", res.status, text);
        return;
      }
      
      const result = await res.json();
      if (result.success) {
        setHistoryData(result.data);
      }
    } catch (error) {
      console.log("Failed to load history:", error);
    }
  };

  const loadProfiles = async () => {
    try {
      const session = await getSession();
      const accountEmail = (session?.user?.email || "").trim().toLowerCase();
      setLoggedInEmail(accountEmail);

      if (!accountEmail) {
        setProfiles([]);
        setSelectedProfile(null);
        return null;
      }

      const setup = await ensureDefaultProfileForEmail(
        accountEmail,
        session?.fullName || "User"
      );

      let activeProfile = setup?.activeProfile || null;
      let allProfiles = setup?.profiles || [];

      if (!activeProfile) {
        activeProfile = await getActiveProfileByEmail(accountEmail);
      }
      if (!allProfiles.length) {
        allProfiles = await getProfilesByEmail(accountEmail);
      }

      setProfiles(allProfiles || []);
      setSelectedProfile(activeProfile || null);

      if (activeProfile?.name) {
        setFullName(activeProfile.name);
      } else if (session?.fullName) {
        setFullName(session.fullName);
      }

      Object.assign(profileIndexCache, {
        loaded: true,
        profiles: allProfiles || [],
        selectedProfile: activeProfile || null,
        fullName: activeProfile?.name || session?.fullName || "User",
        loggedInEmail: accountEmail,
      });
      
      return activeProfile;
    } catch (error) {
      console.log("loadProfiles error:", error);
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const activeProfile = await loadProfiles();
        await fetchHistoryData(activeProfile);
      })();
    }, [])
  );

  const handleSelectProfile = async (profile) => {
    try {
      if (!loggedInEmail || !profile) return;

      await setActiveProfileByEmail(loggedInEmail, profile);
      setSelectedProfile(profile);
      setFullName(profile?.name || "User");
      profileIndexCache.selectedProfile = profile;
      profileIndexCache.fullName = profile?.name || "User";
      setProfileModalVisible(false);
      
      // Fetch history data for the selected profile
      await fetchHistoryData(profile);
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
        setFullName(result.profile.name || "User");
        setProfiles((prev) => [...prev, result.profile]);
        profileIndexCache.selectedProfile = result.profile;
        profileIndexCache.fullName = result.profile.name || "User";
        profileIndexCache.profiles = [...(profileIndexCache.profiles || []), result.profile];
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
      clearAllProfileCaches();
      await logoutUser();
      router.replace("/get-started");
    } catch (error) {
      console.log("handleLogout error:", error);
    }
  };

  const handleOpenHistoryDetails = (item) => {
    setSelectedHistory(item);
    setHistoryDetailsVisible(true);
  };

  const handleCloseHistoryDetails = () => {
    setHistoryDetailsVisible(false);
    setSelectedHistory(null);
  };

  const getTypeColor = (type) => {
    return type === "Routine" ? "#B84DFF" : "#38C96B";
  };

  const getTypeBadgeBackground = (type) => {
    return type === "Routine" ? "#F1E4FF" : "#DDF7E5";
  };

  const getTypeIcon = (type) => {
    return type === "Routine" ? "refresh-circle" : "medkit";
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
          {groupedHistory().length === 0 ? (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>
              No completed history records found.
            </Text>
          ) : (
            groupedHistory().map(([month, items]) => (
              <View key={month} style={styles.section}>
                <Text style={styles.monthText}>{month}</Text>

                {items.map((item, index) => {
                  const typeColor = getTypeColor(item.type);
                  const typeBadgeBg = getTypeBadgeBackground(item.type);

                  return (
                    <Pressable
                      key={index}
                      style={styles.card}
                      onPress={() => handleOpenHistoryDetails(item)}
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
                            { backgroundColor: typeBadgeBg },
                          ]}
                        >
                          <Ionicons
                            name={getTypeIcon(item.type)}
                            size={12}
                            color={typeColor}
                          />
                          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                            {item.type}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <View style={styles.leftIconWrap}>
                          <Ionicons
                            name="document-text-outline"
                            size={22}
                            color={colors.primary}
                          />
                        </View>

                        <View style={styles.cardMainContent}>
                          <Text style={styles.serviceTitle}>{item.title}</Text>
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
          visible={historyDetailsVisible}
          animationType="slide"
          transparent
          onRequestClose={handleCloseHistoryDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.dragHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>History Details</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedHistory?.title || ""}
                  </Text>
                </View>

                <Pressable
                  onPress={handleCloseHistoryDetails}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Doctor</Text>
                    <Text style={styles.infoValue}>
                      {selectedHistory?.doctor || "-"}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={[styles.infoCard, styles.halfInfoCard]}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>
                        {selectedHistory?.date || "-"}
                      </Text>
                    </View>

                    <View style={[styles.infoCard, styles.halfInfoCard]}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>
                        {selectedHistory?.time || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={[styles.infoCard, styles.halfInfoCard]}>
                      <Text style={styles.infoLabel}>Category</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { color: getTypeColor(selectedHistory?.type) },
                        ]}
                      >
                        {selectedHistory?.type || "-"}
                      </Text>
                    </View>

                    <View style={[styles.infoCard, styles.halfInfoCard]}>
                      <Text style={styles.infoLabel}>Record</Text>
                      <Text style={styles.infoValue}>Completed</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.aiCard}>
                  <View style={styles.aiHeader}>
                    <View style={styles.aiIconWrap}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiTitle}>AI Assessment</Text>
                      <Text style={styles.aiSubtitle}>
                        Pre-assessment summary and findings
                      </Text>
                    </View>
                  </View>

                  <View style={styles.teethBox}>
                    <WebView
                      source={{ uri: "https://intellident-3d-viewer.vercel.app/?mode=protected" }}
                      style={[styles.toothImage, { backgroundColor: "transparent" }]}
                      scrollEnabled={false}
                      overScrollMode="never"
                      injectedJavaScript={`
                        setTimeout(function() {
                          window.postMessage({ type: 'SELECT_TOOTH', tooth: '${selectedHistory?.tooth || "Not specified"}' }, '*');
                        }, 1000);
                        true;
                      `}
                      containerStyle={{ backgroundColor: 'transparent' }}
                      cacheEnabled={true}
                      domStorageEnabled={true}
                    />
                  </View>

                  <Text style={styles.toothText}>
                    Tooth: {selectedHistory?.tooth || "-"}
                  </Text>

                  <Text style={styles.aiSectionTitle}>
                    Summary of Pre Assessment
                  </Text>

                  <View style={styles.aiDetailsWrapper}>
                    {(!selectedHistory?.qaList || selectedHistory.qaList.length === 0) ? (
                      <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="document-text-outline" size={32} color="#D1B9C5" style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 13, color: "#9A7A87", fontWeight: "600" }}>
                          No Pre-Assessment Record
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                        style={styles.aiInnerScroll}
                        contentContainerStyle={styles.aiInnerScrollContent}
                      >
                        {selectedHistory.qaList.map((item, index) => (
                          <View key={index} style={styles.qaBlock}>
                            <Text style={styles.qLine}>
                              <Text style={styles.qLabel}>Question: </Text>
                              {item.question}
                            </Text>

                            <Text style={styles.aLine}>
                              <Text style={styles.aLabel}>    Answer: </Text>
                                  {typeof item.answer === "object"
                                      ? item.answer?.answer || JSON.stringify(item.answer)
                                      : item.answer || "No answer"}
                            </Text>
                          </View>
                        ))}

                        <View style={{ height: 10 }} />

                        <Text style={styles.qLine}>
                          <Text style={styles.qLabel}>Question: </Text>
                          Kindly describe any symptoms or discomfort you are
                          currently experiencing.
                        </Text>

                        <Text style={styles.aLine}>
                          <Text style={styles.aLabel}>    Answer: </Text>
                          {selectedHistory?.description?.trim()
                            ? selectedHistory.description.trim()
                            : "-"}
                        </Text>
                      </ScrollView>
                    )}
                  </View>

                  <Text style={[styles.aiSectionTitle, { marginTop: 14 }]}>
                    Suggested Treatment and Price
                  </Text>

                  <View style={styles.treatBox}>
                    <Text style={styles.treatTitle}>
                      {selectedHistory?.suggestedTreatment || "-"}
                    </Text>
                    <Text style={styles.treatSub}>
                      {selectedHistory?.suggestedPrice || "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Procedure Made</Text>
                  <Text style={styles.sectionText}>
                    {selectedHistory?.procedure || "-"}
                  </Text>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Doctor's Remarks</Text>
                  <Text style={styles.sectionText}>
                    {selectedHistory?.remarks || "-"}
                  </Text>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Uploaded Photos</Text>

                  {(selectedHistory?.doctorPhotos || []).length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosRow}
                    >
                      {selectedHistory.doctorPhotos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: photo.uri }}
                          style={styles.photoItem}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyText}>
                      No uploaded photos available.
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

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
    </View>
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
    paddingBottom: 24,
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
    opacity: 0.7,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: "90%",
  },
  dragHandle: {
    alignSelf: "center",
    width: 54,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#E3E3E3",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#8D8D8D",
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F5EAF0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  infoGrid: {
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 14,
  },
  halfInfoCard: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9A9A9A",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    fontWeight: "600",
  },
  aiCard: {
    backgroundColor: "#FFF4F8",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFD8E6",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  aiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
  },
  aiSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#9A7A87",
    fontWeight: "600",
  },
  teethBox: {
    marginTop: 4,
    marginBottom: 4,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  toothImage: {
    width: 190,
    height: 140,
    resizeMode: "contain",
  },
  toothText: {
    marginBottom: 12,
    fontSize: 12,
    color: "#8D8D8D",
    fontWeight: "700",
  },
  aiSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  aiDetailsWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },
  aiInnerScroll: {
    maxHeight: 240,
  },
  aiInnerScrollContent: {
    paddingRight: 4,
  },
  qaBlock: {
    marginBottom: 12,
  },
  qLine: {
    fontSize: 11,
    color: "#444",
    lineHeight: 17,
  },
  aLine: {
    marginTop: 4,
    fontSize: 11,
    color: "#666",
    lineHeight: 17,
  },
  qLabel: {
    fontWeight: "800",
    color: colors.primary,
  },
  aLabel: {
    fontWeight: "800",
    color: colors.primary,
  },
  treatBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
  },
  treatTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
  },
  treatSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#444444",
    fontWeight: "600",
  },
  photosRow: {
    paddingTop: 4,
    paddingRight: 4,
  },
  photoItem: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#EAEAEA",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#8F8F8F",
    fontWeight: "600",
  },
});