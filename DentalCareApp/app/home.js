import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "./theme/colors";
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
  appointmentCache,
  APPOINTMENT_CACHE_TTL_MS,
  clearAllProfileCaches,
} from "./_storage/profileCache";
import {
  fetchUpcomingAppointment,
  fetchCurrentQueueForAppointment,
  formatAppointmentDate,
  formatAppointmentTime,
} from "../server/upcomingAppointment";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ProfileSwitcherModal from "./components/ProfileSwitcherModal";

function isUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function formatQueueWait(minutes) {
  if (!minutes || minutes <= 0) return "Estimated wait: It's your turn soon";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours && mins) {
    return `Estimated wait: ${hours} hour${hours > 1 ? "s" : ""} and ${mins} minute${mins > 1 ? "s" : ""}`;
  }
  if (hours) {
    return `Estimated wait: ${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `Estimated wait: ${mins} minute${mins > 1 ? "s" : ""}`;
}

function getLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const router = useRouter();

  // Seed from cache so revisits don't flash "User" while loading
  const [fullName, setFullName] = useState(profileIndexCache.fullName || "User");
  
  // These were missing, so I added placeholder states to prevent crashes
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueData, setQueueData] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState(profileIndexCache.loggedInEmail || "");
  const [flowModalVisible, setFlowModalVisible] = useState(false);

  const loadQueueForAppointment = useCallback(async (appointment, { showLoader = true } = {}) => {
    if (!appointment) {
      setQueueData(null);
      return;
    }

    try {
      if (showLoader) setLoadingQueue(true);
      const { data } = await fetchCurrentQueueForAppointment(appointment);
      setQueueData(data || null);
    } catch (error) {
      console.log("loadQueueForAppointment error:", error);
      setQueueData(null);
    } finally {
      if (showLoader) setLoadingQueue(false);
    }
  }, []);

  const loadUpcomingForProfile = useCallback(async (activeProfile, options = {}) => {
    const { forceRefresh = false } = options;
    const safeProfileId = isUuid(activeProfile?.id) ? activeProfile.id : null;
    const cacheKey = safeProfileId || "__no_profile__";
    const cached = appointmentCache[cacheKey];
    const now = Date.now();
    const isStale = forceRefresh || !cached || (now - cached.fetchedAt) > APPOINTMENT_CACHE_TTL_MS;
    let appointmentData = cached?.data || null;

    if (cached) {
      setUpcomingAppointment(cached.data);
    }

    if (isStale) {
      if (!cached || forceRefresh) setLoadingAppointment(true);
      const { data } = await fetchUpcomingAppointment(safeProfileId, {
        profileName: activeProfile?.name || "",
      });
      appointmentCache[cacheKey] = { data, fetchedAt: Date.now() };
      setUpcomingAppointment(data);
      appointmentData = data;
      setLoadingAppointment(false);
    }

    await loadQueueForAppointment(appointmentData, { showLoader: forceRefresh || !cached });
  }, [loadQueueForAppointment]);

  const loadProfiles = useCallback(async () => {
    try {
      const session = await getSession();
      const accountEmail = (session?.user?.email || "").trim().toLowerCase();
      setLoggedInEmail(accountEmail);

      if (!accountEmail) {
        setProfiles([]);
        setSelectedProfile(null);
        return;
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

      await loadUpcomingForProfile(activeProfile);
    } catch (error) {
      console.log("loadProfiles error:", error);
    }
  }, [loadUpcomingForProfile]);

  // Re-read the active profile name every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadProfiles();
      })();
    }, [loadProfiles])
  );

  const handleSelectProfile = async (profile) => {
    try {
      if (!loggedInEmail || !profile) return;

      await setActiveProfileByEmail(loggedInEmail, profile);
      setSelectedProfile(profile);
      setFullName(profile?.name || "User");
      profileIndexCache.selectedProfile = profile;
      profileIndexCache.fullName = profile?.name || "User";

      await loadUpcomingForProfile(profile);
      setProfileModalVisible(false);
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
        await loadUpcomingForProfile(result.profile);
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

  const openFlowModal = () => {
    setFlowModalVisible(true);
  };

  const closeFlowModal = () => {
    setFlowModalVisible(false);
  };

  const handleChoosePreAssessment = () => {
    closeFlowModal();
    router.push("/pre-assessment");
  };

  const handleChooseBooking = () => {
    closeFlowModal();
    router.push("/booking");
  };

  const handleRefreshQueue = async () => {
    const activeProfile = selectedProfile || profileIndexCache.selectedProfile || null;
    await loadUpcomingForProfile(activeProfile, { forceRefresh: true });
  };

  const isQueueDay = !!upcomingAppointment?.date && upcomingAppointment.date === getLocalISODate();

  const queueProgress = isQueueDay && queueData?.totalInQueue
    ? Math.max(8, Math.round((queueData.queueNumber / queueData.totalInQueue) * 100))
    : 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconCircle}
              onPress={() => router.push("/notification")}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.primary}
              />
            </Pressable>

            <Pressable
              style={styles.avatarCircle}
              onPress={() => setProfileModalVisible(true)}
            >
              <Ionicons name="person" size={18} color={colors.primary} />
            </Pressable>

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

        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.textGray}
            style={styles.searchInput}
          />
          <Ionicons name="search" size={16} color={colors.primary} />
        </View>

        <View style={styles.quickRow}>
          <QuickBtn
            icon={
              <Ionicons
                name="medical-outline"
                size={22}
                color={colors.primary}
              />
            }
            label="Dentist"
            onPress={() => router.push("/dentists")}
          />

          <QuickBtn
            icon={
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />
            }
            label="Branches"
            onPress={() => router.push("/branches")}
          />

          <QuickBtn
            icon={
              <MaterialCommunityIcons
                name="tooth-outline"
                size={18}
                color={colors.primary}
              />
            }
            label="3D Model"
            onPress={() => router.push("/tooth-3d")}
          />

          <QuickBtn
            icon={
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
            }
            label="Appointments"
            onPress={() => router.push("/appointments")}
          />

          <QuickBtn
            icon={
              <Ionicons
                name="medkit-outline"
                size={18}
                color={colors.primary}
              />
            }
            label="Services"
            onPress={() => router.push("/services")}
          />
        </View>

        {isQueueDay ? (
        <View style={styles.queueCard}>
          <View style={styles.queueTopRow}>
            <Text style={styles.queueTitle}>Current Queue</Text>

            <Pressable
              style={[styles.refreshBtn, (loadingQueue || loadingAppointment) && { opacity: 0.7 }]}
              onPress={handleRefreshQueue}
              disabled={loadingQueue || loadingAppointment}
            >
              {(loadingQueue || loadingAppointment) ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="refresh" size={12} color={colors.white} />
              )}
              <Text style={styles.refreshText}>Refresh Now</Text>
            </Pressable>
          </View>

          <Text style={styles.queueNumber}>
            {isQueueDay && queueData?.queueNumber ? `#${queueData.queueNumber}` : "--"}
          </Text>
          <Text style={styles.queueSub}>
            {!upcomingAppointment
              ? "No active queue right now"
              : !isQueueDay
                ? "Live queue appears on your appointment day"
                : queueData?.queueNumber
                  ? "Your position in queue"
                  : "No active queue right now"}
          </Text>

          <View style={styles.queueProgressTrack}>
            <View
              style={[
                styles.queueProgressFill,
                { width: `${queueProgress}%` },
              ]}
            />
          </View>

          <Text style={styles.queueWait}>
            {isQueueDay && queueData?.queueNumber
              ? formatQueueWait(queueData.estimatedWaitMinutes)
              : !upcomingAppointment
                ? "Book an appointment to get a live queue number"
                : !isQueueDay
                  ? "Queue updates will start on your appointment date"
                  : "No queue data available yet"}
          </Text>
        </View>
        ) : null}

        <Text style={styles.sectionTitle}>Upcoming Appointment</Text>

        {loadingAppointment ? (
          <View style={[styles.upcomingCard, { alignItems: 'center', justifyContent: 'center', minHeight: 80 }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.docSub, { marginTop: 8 }]}>Loading appointment...</Text>
          </View>
        ) : upcomingAppointment ? (
          <View style={styles.upcomingCard}>
            <View style={styles.upTopRow}>
              <View style={styles.docAvatar}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{upcomingAppointment.doctorName}</Text>
                <Text style={styles.docSub}>{upcomingAppointment.branch} - {upcomingAppointment.specialization}</Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={14} color={colors.white} />
                <Text style={styles.dateText}>{formatAppointmentDate(upcomingAppointment.date)}</Text>
              </View>
              <View style={styles.dateChip}>
                <Ionicons name="time-outline" size={14} color={colors.white} />
                <Text style={styles.dateText}>{formatAppointmentTime(upcomingAppointment.time)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>My Recent Visit</Text>
          <Pressable>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          <RecentCard
            title="Dr. Mendoza"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Teeth Cleaning"
          />
          <RecentCard
            title="Dr. Guillermo"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Dental Implant"
          />
          <RecentCard
            title="Dr. Amparo"
            clinic="GC Dental Care - Dentist"
            service="SERVICE: Braces"
          />
        </ScrollView>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
          Treatment Plan
        </Text>

        <TreatmentItem
          title="Teeth Whitening"
          sub="Scheduled for January 20, 2026 - 10:00 AM"
          status="STATUS: Confirmed"
          rightA="VIEW DETAILS"
          rightB="RESCHEDULE"
        />
        <TreatmentItem
          title="Routine Cleaning"
          sub="Due in 3 Months - April 2026"
          status="STATUS: Suggested Booking"
          rightA="VIEW DETAILS"
          rightB="BOOK NOW"
        />
        <TreatmentItem
          title="Routine Cleaning"
          sub="Due in 8 Months - July 2026"
          status="STATUS: Suggested Booking"
          rightA="VIEW DETAILS"
          rightB="BOOK NOW"
        />

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.slot}>
          <NavItem icon="home-outline" label="Home" active />
        </View>

        <View style={styles.slot}>
          <NavItem
            icon="document-text-outline"
            label="Pre-Assessment"
            onPress={() => router.push("/pre-assessment")}
          />
        </View>

        <View style={styles.centerSlot} />

        <View style={styles.slot}>
          <NavItem
            icon="heart-outline"
            label="History"
            onPress={() => router.push("/history")}
          />
        </View>

        <View style={styles.slot}>
          <NavItem
            icon="person-outline"
            label="Profile"
            onPress={() => router.push("/profile")}
          />
        </View>
      </View>

      <Pressable style={styles.fab} onPress={openFlowModal}>
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>

      <Modal
        visible={flowModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFlowModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeFlowModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>What would you like to do?</Text>
            <Text style={styles.modalSubtitle}>
              Choose if you want to do pre-assessment first or proceed to
              booking.
            </Text>

            <Pressable
              style={styles.optionButton}
              onPress={handleChoosePreAssessment}
            >
              <Text style={styles.optionText}>Do Pre-Assessment First</Text>
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={handleChooseBooking}
            >
              <Text style={styles.optionText}>Proceed to Booking</Text>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={closeFlowModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function QuickBtn({ icon, label, onPress }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function RecentCard({ title, clinic, service }) {
  return (
    <View style={styles.recentCard}>
      <View style={styles.recentTop}>
        <View style={styles.recentAvatar}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentTitle}>{title}</Text>
          <Text style={styles.recentClinic}>{clinic}</Text>
        </View>
      </View>

      <Text style={styles.recentService}>{service}</Text>

      <View style={styles.recentBtnRow}>
        <Pressable style={styles.grayBtn}>
          <Text style={styles.grayBtnText}>BOOK NOW</Text>
        </Pressable>
        <Pressable style={styles.grayBtn}>
          <Text style={styles.grayBtnText}>DETAILS</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TreatmentItem({ title, sub, status, rightA, rightB }) {
  return (
    <View style={styles.treatCard}>
      <Text style={styles.treatTitle}>{title}</Text>
      <Text style={styles.treatSub}>{sub}</Text>
      <Text style={styles.treatStatus}>{status}</Text>

      <View style={styles.treatActions}>
        <Pressable style={styles.smallChip}>
          <Text style={styles.smallChipText}>{rightA}</Text>
        </Pressable>
        <Pressable
          style={[styles.smallChip, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.smallChipText, { color: colors.white }]}>
            {rightB}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.primary : colors.textGray}
      />
      <Text
        style={[
          styles.navLabel,
          { color: active ? colors.primary : colors.textGray },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 18, paddingTop: 46 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hello: { fontSize: 16, fontWeight: "800", color: colors.primary },
  name: { fontSize: 18, fontWeight: "900", color: colors.textGray },

  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: {
    marginTop: 14,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#333",
    paddingRight: 10,
  },

  quickRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  quickBtn: { width: "18%", alignItems: "center" },

  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 9,
    color: colors.textGray,
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: "800",
    color: "#777",
  },

  queueCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: colors.primary,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  queueTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  queueTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  refreshText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.white,
  },

  queueNumber: {
    marginTop: 10,
    fontSize: 40,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
  },

  queueSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontWeight: "700",
  },

  queueProgressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },

  queueProgressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: colors.white,
  },

  queueWait: {
    marginTop: 10,
    fontSize: 10,
    color: colors.white,
    textAlign: "center",
    fontWeight: "800",
  },

  upcomingCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#FFD6E6",
    padding: 14,
  },

  upTopRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  docAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  docName: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  docSub: {
    marginTop: 2,
    fontSize: 10,
    color: "#888",
  },

  dateRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  dateChip: {
    flex: 1,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#6E6E6E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  dateText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: "700",
  },

  rowBetween: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  seeAll: {
    fontSize: 10,
    color: colors.textGray,
    marginTop: 18,
  },

  recentCard: {
    marginTop: 10,
    width: 170,
    borderRadius: 16,
    backgroundColor: "#8B8B8B",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  recentTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  recentTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primary,
  },

  recentClinic: {
    marginTop: 2,
    fontSize: 9,
    color: "#EDEDED",
  },

  recentService: {
    marginTop: 10,
    fontSize: 9,
    color: "#EDEDED",
  },

  recentBtnRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  grayBtn: {
    flex: 1,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#6B6B6B",
    alignItems: "center",
    justifyContent: "center",
  },

  grayBtnText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "800",
  },

  treatCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#BFBFBF",
    padding: 14,
  },

  treatTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  treatSub: {
    marginTop: 2,
    fontSize: 9,
    color: "#5F5F5F",
  },

  treatStatus: {
    marginTop: 4,
    fontSize: 9,
    color: "#5F5F5F",
    fontWeight: "700",
  },

  treatActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  smallChip: {
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
  },

  smallChipText: {
    fontSize: 8,
    color: "#666",
    fontWeight: "800",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "#FFE9F1",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  slot: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },

  centerSlot: {
    width: "20%",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: 38,
    alignSelf: "center",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
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

  optionButton: {
    backgroundColor: "#FFE9F1",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },

  cancelBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "600",
  },
});