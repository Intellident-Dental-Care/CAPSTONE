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

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
import { getServerUrl } from "../server/getClientSideUrl";
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
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState(profileIndexCache.fullName || "User");
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueData, setQueueData] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState(profileIndexCache.loggedInEmail || "");
  const [flowModalVisible, setFlowModalVisible] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [treatmentPlans, setTreatmentPlans] = useState([]);

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

  const fetchRecentVisits = useCallback(async (session, profile = null) => {
    try {
      const userId = session?.user?.id || session?.id;
      const token = session?.session?.access_token || session?.access_token || "";

      if (!userId) {
        setRecentVisits([]);
        return;
      }

      const baseUrl = await getServerUrl();
      let apiUrl = `${baseUrl}/api/patient-history?userId=${userId}`;
      
      // Add profileId only if it's a valid UUID
      const safeProfileId = isUuid(profile?.id) ? profile.id : null;
      if (safeProfileId) {
        apiUrl += `&profileId=${safeProfileId}`;
      }

      console.log("fetchRecentVisits URL:", apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      // Check if response is OK
      if (!res.ok) {
        const text = await res.text();
        console.error("fetchRecentVisits error response:", res.status, text);
        setRecentVisits([]);
        return;
      }

      const result = await res.json();
      if (result.success && result.data) {
        // Flatten all items from all months and get the 3 most recent
        const allItems = [];
        result.data.forEach(monthGroup => {
          if (monthGroup.items && Array.isArray(monthGroup.items)) {
            allItems.push(...monthGroup.items);
          }
        });
        
        // Sort by date (most recent first) and take top 3
        const recent = allItems
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        
        setRecentVisits(recent);
      } else {
        setRecentVisits([]);
      }
    } catch (error) {
      console.log("fetchRecentVisits error:", error);
      setRecentVisits([]);
    }
  }, []);

  const fetchTreatmentPlan = useCallback(async (session, profile = null) => {
    try {
      const userId = session?.user?.id || session?.id;
      const token = session?.session?.access_token || session?.access_token || "";

      if (!userId) {
        setTreatmentPlans([]);
        return;
      }

      const baseUrl = await getServerUrl();
      let apiUrl = `${baseUrl}/api/upcoming-treatments?userId=${userId}`;
      
      // Add profileId only if it's a valid UUID
      const safeProfileId = isUuid(profile?.id) ? profile.id : null;
      if (safeProfileId) {
        apiUrl += `&profileId=${safeProfileId}`;
      }

      console.log("fetchTreatmentPlan URL:", apiUrl);

      const res = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      // Check if response is OK
      if (!res.ok) {
        const text = await res.text();
        console.error("fetchTreatmentPlan error response:", res.status, text);
        setTreatmentPlans([]);
        return;
      }

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        // Filter only treatment-type bookings and sort by date
        const treatments = result.data
          .filter(t => t.type === "Treatment" || t.service_type === "Treatment")
          .sort((a, b) => new Date(a.appointment_date || a.date) - new Date(b.appointment_date || b.date));
        
        setTreatmentPlans(treatments);
      } else {
        setTreatmentPlans([]);
      }
    } catch (error) {
      console.log("fetchTreatmentPlan error:", error);
      setTreatmentPlans([]);
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
      await fetchRecentVisits(session, activeProfile);
      await fetchTreatmentPlan(session, activeProfile);
    } catch (error) {
      console.log("loadProfiles error:", error);
    }
  }, [loadUpcomingForProfile, fetchRecentVisits, fetchTreatmentPlan]);

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
      const session = await getSession();
      await fetchRecentVisits(session, profile);
      await fetchTreatmentPlan(session, profile);
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
        const session = await getSession();
        await fetchRecentVisits(session, result.profile);
        await fetchTreatmentPlan(session, result.profile);
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

  const handleReschedule = (treatment) => {
    try {
      if (!treatment?.id) {
        Alert.alert("Error", "Unable to reschedule this appointment");
        return;
      }

      router.push({
        pathname: "/booking/appointment",
        params: {
          service: treatment.service || treatment.title,
          serviceName: treatment.service || treatment.title,
          branch: treatment.branch,
          doctor: treatment.dentist_name || treatment.doctor,
          doctorId: treatment.dentist_id,
          preassessmentId: treatment.preassessment_id,
          bookingId: treatment.id,
          editMode: "true",
          originalDate: treatment.appointment_date || treatment.date,
          originalTime: treatment.appointment_time || treatment.time,
        },
      });
    } catch (error) {
      console.log("handleReschedule error:", error);
      Alert.alert("Error", "Failed to reschedule appointment");
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

  const openDetailModal = (detail) => {
    setSelectedDetail(detail);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedDetail(null);
  };

  const getStatusColor = (status) => {
    if (status === "Upcoming") return "#D89B00";
    if (status === "Completed") return "#2FA55A";
    if (status === "Cancelled") return "#E24C4B";
    if (status === "Confirmed") return "#2F7DFF";
    if (status === "Suggested Booking") return "#8D8D8D";
    return "#8D8D8D";
  };

  const getStatusBg = (status) => {
    if (status === "Upcoming") return "#FFF3D6";
    if (status === "Completed") return "#DDF7E5";
    if (status === "Cancelled") return "#FDE2E2";
    if (status === "Confirmed") return "#E3EEFF";
    if (status === "Suggested Booking") return "#EFEFEF";
    return "#EFEFEF";
  };

  const getStatusIcon = (status) => {
    if (status === "Upcoming") return "time";
    if (status === "Completed") return "checkmark-circle";
    if (status === "Cancelled") return "close-circle";
    if (status === "Confirmed") return "checkmark-done-circle";
    if (status === "Suggested Booking") return "ellipse";
    return "ellipse";
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
    <View style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingBottom: 90,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.name}>{String(fullName || "User")}</Text>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                style={styles.iconCircle}
                onPress={() => router.push("/notification")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>

              <Pressable
                style={styles.avatarCircle}
                onPress={() => setProfileModalVisible(true)}
              >
                <Ionicons name="person" size={22} color={colors.primary} />
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
              placeholder="Search dentist, branch, service..."
              placeholderTextColor="#B7B7B7"
              style={styles.searchInput}
            />
            <Ionicons name="search" size={22} color={colors.primary} />
          </View>

          <View style={styles.quickRow}>
            <QuickBtn
              icon={
                <Ionicons
                  name="medical-outline"
                  size={24}
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
                  size={23}
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
                  size={23}
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
                  size={23}
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
                  size={23}
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
                <View>
                  <Text style={styles.queueTitle}>Current Queue</Text>
                  <Text style={styles.queueSmallText}>Live appointment status</Text>
                </View>

                <Pressable
                  style={[styles.refreshBtn, (loadingQueue || loadingAppointment) && { opacity: 0.7 }]}
                  onPress={handleRefreshQueue}
                  disabled={loadingQueue || loadingAppointment}
                >
                  {(loadingQueue || loadingAppointment) ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="refresh" size={13} color={colors.white} />
                  )}
                  <Text style={styles.refreshText}>Refresh</Text>
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
            <View style={[styles.upcomingCard, styles.centerContent, { minHeight: 100 }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.docSub, { marginTop: 8 }]}>Loading appointment...</Text>
            </View>
          ) : upcomingAppointment ? (
            <View style={styles.upcomingCard}>
              <View style={styles.upTopRow}>
                <View style={styles.docAvatar}>
                  <Ionicons name="person" size={22} color={colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{String(upcomingAppointment?.doctorName || "Dentist")}</Text>
                  <Text style={styles.docSub}>{String((upcomingAppointment?.branch || "") + " • " + (upcomingAppointment?.specialization || ""))}</Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateChip}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.dateText}>{formatAppointmentDate(upcomingAppointment.date)}</Text>
                </View>
                <View style={styles.dateChip}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={styles.dateText}>{formatAppointmentTime(upcomingAppointment.time)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyAppointmentCard}>
              <Ionicons name="calendar-outline" size={26} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>No upcoming appointment</Text>
                <Text style={styles.emptySub}>Book an appointment to see your schedule here.</Text>
              </View>
            </View>
          )}

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>My Recent Visit</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
          >
            {recentVisits.length > 0 ? (
              recentVisits.map((visit, idx) => (
                <RecentCard
                  key={idx}
                  title={visit.doctor}
                  clinic={`${visit.doctor} • Dentist`}
                  service={visit.title}
                  onBookNow={openFlowModal}
                  onDetails={() => openDetailModal(visit)}
                />
              ))
            ) : (
              <View style={{ padding: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#999', fontSize: 12 }}>No recent visits yet</Text>
              </View> /* TO BE EDITED */
            )}
          </ScrollView>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Treatment Plan
          </Text>

          {treatmentPlans.length > 0 ? (
            treatmentPlans.map((treatment, idx) => {
              const appointmentDate = treatment.appointment_date || treatment.date || "";
              const appointmentTime = treatment.appointment_time || treatment.time || "";
              const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
              const dateStr = appointmentTime && formattedDate ? `${formattedDate} • ${appointmentTime}` : (formattedDate || "Date TBD");
              
              return (
                <TreatmentItem
                  key={idx}
                  title={treatment.service || treatment.title || "Dental Treatment"}
                  sub={`Scheduled for ${dateStr}`}
                  status={treatment.status || "Confirmed"}
                  rightA="VIEW DETAILS"
                  rightB={treatment.status === "confirmed" || treatment.status === "pending" ? "RESCHEDULE" : "BOOK NOW"}
                  onViewDetails={() => openDetailModal({
                    doctor: treatment.dentist_name || treatment.doctor || "Assigned Dentist",
                    title: treatment.service || treatment.title || "Dental Treatment",
                    type: treatment.type || "Treatment",
                    status: treatment.status || "Confirmed",
                    date: formattedDate,
                    time: appointmentTime || "-",
                    tooth: treatment.tooth || "Not specified",
                    description: treatment.description || "-",
                    qaList: treatment.qaList || [],
                    suggestedTreatment: treatment.service || treatment.title || "-",
                    suggestedPrice: treatment.price_display || "Contact clinic for pricing",
                    procedure: treatment.procedure_name || treatment.service || "-",
                  })}
                  onPrimaryAction={() => {
                    if (treatment.status === "confirmed" || treatment.status === "pending") {
                      handleReschedule(treatment);
                    } else {
                      openFlowModal();
                    }
                  }}
                />
              );
            })
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#999', fontSize: 12 }}>No treatment plans scheduled</Text> 
            </View> /* TO BE EDITED */
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.slot}>
            <NavItem icon="home" label="Home" active />
          </View>

          <View style={styles.slot}>
            <NavItem
              icon="document-text-outline"
              label="Assessment"
              onPress={() => router.push("/pre-assessment")}
            />
          </View>

          <View style={styles.centerSlot} />

          <View style={styles.slot}>
            <NavItem
              icon="time-outline"
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
          <Ionicons name="add" size={24} color="#FFFFFF" />
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

        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeDetailModal}
        >
          <View style={styles.detailsOverlay}>
            <View style={styles.detailsSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalDetailTitle}>Appointment Details</Text>
                  <Text style={styles.modalSubTitle}>
                    Appointment information and AI assessment
                  </Text>
                </View>

                <Pressable style={styles.closeCircle} onPress={closeDetailModal}>
                  <Ionicons name="close" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailsScroll}
              >
                <View style={styles.detailCardBox}>
                  <View style={styles.detailTopRow}>
                    <Text style={styles.detailProcedure}>{String(selectedDetail?.title || "")}</Text>

                    {!!selectedDetail?.status && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBg(selectedDetail.status) },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(selectedDetail.status)}
                          size={13}
                          color={getStatusColor(selectedDetail.status)}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(selectedDetail.status) },
                          ]}
                        >
                          {String(selectedDetail.status || "")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.detailTreatment}>
                    {String(selectedDetail?.procedure || "")}
                  </Text>

                  <View style={styles.detailInfoGrid}>
                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Dentist</Text>
                      <Text style={styles.value}>{String(selectedDetail?.doctor || "")}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.value}>{String(selectedDetail?.date || "")}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Time</Text>
                      <Text style={styles.value}>{String(selectedDetail?.time || "")}</Text>
                    </View>

                    <View style={styles.detailInfoItem}>
                      <Text style={styles.label}>Tooth / Area</Text>
                      <Text style={styles.value}>{String(selectedDetail?.tooth || "")}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.aiCard}>
                  <View style={styles.aiTitleRow}>
                    <View style={styles.aiIconWrap}>
                      <Ionicons name="sparkles-outline" size={18} color="#fff" />
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
                      <Text style={styles.toothPlaceholderLabel}>Affected Tooth</Text>
                      <Text style={styles.toothPlaceholderValue}>
                        {String(selectedDetail?.tooth || "Not specified")}
                      </Text>
                      <Text style={styles.toothPlaceholderHint}>
                        Pre-assessment tooth information
                      </Text>
                    </View>
                  </View>

                  <View style={styles.suggestedCard}>
                    <Text style={styles.suggestedLabel}>Suggested Treatment</Text>
                    <Text style={styles.suggestedValue}>
                      {String(selectedDetail?.suggestedTreatment || "-")}
                    </Text>
                    <Text style={styles.suggestedPrice}>
                      {String(selectedDetail?.suggestedPrice || "-")}
                    </Text>
                  </View>

                  <View style={styles.assessmentBox}>
                    <Text style={styles.assessmentLabel}>Patient Description</Text>
                    <Text style={styles.assessmentText}>
                      {String(selectedDetail?.description || "No description provided.")}
                    </Text>
                  </View>

                  <Text style={styles.aiSectionTitle}>Questionnaire</Text>

                  <View style={styles.qaBox}>
                    {selectedDetail?.qaList?.length > 0 ? (
                      selectedDetail.qaList.map((q, i) => (
                        <View
                          key={i}
                          style={[
                            styles.qaItem,
                            i === selectedDetail.qaList.length - 1 && {
                              borderBottomWidth: 0,
                              marginBottom: 0,
                              paddingBottom: 0,
                            },
                          ]}
                        >
                          <Text style={styles.qText}>Q: {String(q.question || "")}</Text>
                          <Text style={styles.aText}>A: {String(q.answer || "")}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyDetailText}>
                        No questionnaire data.
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ height: 18 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

function QuickBtn({ icon, label, onPress }) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <View style={styles.quickIcon}>{icon}</View>
      <Text style={styles.quickLabel}>{String(label || "")}</Text>
    </Pressable>
  );
}

function RecentCard({ title, clinic, service, onBookNow, onDetails }) {
  return (
    <View style={styles.recentCard}>
      <View style={styles.recentTop}>
        <View style={styles.recentAvatar}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentTitle}>{String(service || "")}</Text>
          <Text style={styles.recentClinic}>{String(title || "")}</Text>
        </View>
      </View>

      {/* <View style={styles.servicePill}>
        <Text style={styles.recentService}>{service}</Text>
      </View> */}

      <View style={styles.recentBtnRow}>
        <Pressable style={styles.softBtn} onPress={onBookNow}>
          <Text style={styles.softBtnText}>BOOK NOW</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn} onPress={onDetails}>
          <Text style={styles.outlineBtnText}>DETAILS</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TreatmentItem({
  title,
  sub,
  status,
  rightA,
  rightB,
  onViewDetails,
  onPrimaryAction,
}) {
  return (
    <View style={styles.treatCard}>
      <View style={styles.treatTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.treatTitle}>{String(title || "")}</Text>
          <Text style={styles.treatSub}>{String(sub || "")}</Text>
        </View>

        <View style={styles.treatStatusBadge}>
          <Text style={styles.treatStatus}>{String(status || "")}</Text>
        </View>
      </View>

      <View style={styles.treatActions}>
        <Pressable style={styles.smallChip} onPress={onViewDetails}>
          <Text style={styles.smallChipText}>{String(rightA || "")}</Text>
        </Pressable>
        <Pressable
          style={[styles.smallChip, styles.primaryChip]}
          onPress={onPrimaryAction}
        >
          <Text
            style={[
              styles.smallChipText,
              styles.primaryChipText,
            ]}
          >
            {String(rightB || "")}
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
        size={21}
        color={active ? colors.primary : "#9A9A9A"}
      />
      <Text
        style={[
          styles.navLabel,
          { color: active ? colors.primary : "#9A9A9A" },
        ]}
      >
        {String(label || "")}
      </Text>
    </Pressable>
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
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hello: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },

  name: {
    fontSize: 18,
    fontWeight: "900",
    color: "#3D3D3D",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  searchWrap: {
    marginTop: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1C6D6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  outlineBtn: {
  flex: 1,
  height: 30,
  borderRadius: 10,
  backgroundColor: "#FFF1F6",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#FFD6E5",
},

outlineBtnText: {
  fontSize: 8.5,
  color: colors.primary,
  fontWeight: "900",
},

sectionTitle: {
  marginTop: 14,
  fontSize: 13,
  fontWeight: "900",
  color: "#2F2F2F",
},

rowBetween: {
  marginTop: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

upcomingCard: {
  marginTop: 8,
  borderRadius: 18,
  backgroundColor: "#FFF4F8",
  padding: 14,

  borderWidth: 1,
  borderColor: "#FFD9E8",

  shadowColor: "#000",
  shadowOpacity: 0.04,
  shadowRadius: 5,
  shadowOffset: {
    width: 0,
    height: 2,
  },

  elevation: 2,
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

  quickBtn: {
    width: "18%",
    alignItems: "center",
  },

  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 9,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
  },

  sectionTitle: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: "900",
    color: "#444",
  },

  queueCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: colors.primary,
    padding: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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

  emptyAppointmentCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#FFF1F6",
    padding: 14,
    borderWidth: 1,
    borderColor: "#F8D4E0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  emptyTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#333",
  },

  emptySub: {
    marginTop: 3,
    fontSize: 10,
    color: "#777",
    fontWeight: "600",
  },

  upcomingCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#FFF1F6",
    padding: 14,
    borderWidth: 1,
    borderColor: "#F8D4E0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  docName: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  docSub: {
    marginTop: 2,
    fontSize: 10,
    color: "#777",
    fontWeight: "600",
  },

  dateRow: {
    marginTop: 10,
    gap: 8,
  },

  dateChip: {
    flex: 1,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "#F1D7E1",
  },

  dateText: {
    fontSize: 9,
    color: "#444",
    fontWeight: "800",
  },

  rowBetween: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  seeAll: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 18,
    fontWeight: "800",
  },

 recentScroll: {
  paddingRight: 18,
  paddingBottom: 12,
  gap: 14,
},

recentCard: {
  marginTop: 10,
  marginBottom: 6,
  width: 178,
  borderRadius: 18,
  backgroundColor: "#FFFFFF",
  padding: 13,
  borderWidth: 1,
  borderColor: "#F5F5F5",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  elevation: 2,
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
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

 recentTitle: {
  fontSize: 12,
  fontWeight: "900",
  color: colors.primary,
},

recentClinic: {
  marginTop: 3,
  fontSize: 9,
  color: "#777",
  fontWeight: "700",
},

  recentService: {
    marginTop: 10,
    fontSize: 9,
    color: colors.primary,
    fontWeight: "800",
  },

  recentBtnRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  grayBtn: {
    flex: 1,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
  },

  grayBtnText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: "900",
  },

  treatCard: {
  marginTop: 10,
  borderRadius: 16,
  backgroundColor: "#FFFFFF",
  padding: 14,
  borderWidth: 1,
  borderColor: "#F5F5F5",

  shadowColor: "#000",
  shadowOpacity: 0.03,
  shadowRadius: 4,
  shadowOffset: {
    width: 0,
    height: 1,
  },

  elevation: 1,
},

  treatTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  treatSub: {
    marginTop: 2,
    fontSize: 9,
    color: "#666",
    fontWeight: "600",
  },

  treatStatus: {
    marginTop: 4,
    fontSize: 9,
    color: colors.primary,
    fontWeight: "800",
  },

  treatActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  smallChip: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  smallChipText: {
    fontSize: 9,
    color: "#666",
    fontWeight: "800",
  },

  primaryChip: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },

  primaryChipText: {
    color: "#FFFFFF",
  },

  detailsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  detailsSheet: {
    maxHeight: "88%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },

  detailsScroll: {
    paddingBottom: 24,
  },

  modalHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#E5E5E5",
    marginBottom: 14,
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalDetailTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textDark || "#222",
  },

  modalSubTitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textGray || "#888",
    fontWeight: "600",
  },

  closeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  detailCardBox: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    marginBottom: 14,
  },

  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  detailProcedure: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },

  detailTreatment: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  detailInfoGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  detailInfoItem: {
    width: "48%",
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 12,
  },

  label: {
    fontSize: 11,
    color: "#888",
    fontWeight: "700",
    marginBottom: 5,
  },

  value: {
    fontSize: 13,
    color: "#222",
    fontWeight: "900",
  },

  aiCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  aiTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },

  aiSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },

  toothPlaceholderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  toothCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  toothPlaceholderLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "800",
  },

  toothPlaceholderValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#222",
    fontWeight: "900",
  },

  toothPlaceholderHint: {
    marginTop: 3,
    fontSize: 11,
    color: "#999",
  },

  suggestedCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  suggestedLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "800",
  },

  suggestedValue: {
    marginTop: 5,
    fontSize: 16,
    color: "#222",
    fontWeight: "900",
  },

  suggestedPrice: {
    marginTop: 5,
    fontSize: 15,
    color: "#2E8B57",
    fontWeight: "900",
  },

  assessmentBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  assessmentLabel: {
    fontSize: 13,
    color: "#222",
    fontWeight: "900",
    marginBottom: 6,
  },

  assessmentText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    fontWeight: "600",
  },

  aiSectionTitle: {
    fontSize: 14,
    color: "#222",
    fontWeight: "900",
    marginBottom: 10,
  },

  qaBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 14,
  },

  qaItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingBottom: 10,
    marginBottom: 10,
  },

  qText: {
    fontSize: 12,
    color: "#222",
    fontWeight: "900",
    lineHeight: 18,
  },

  aText: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },

  emptyDetailText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 12,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    elevation: 0,
    shadowOpacity: 0,
  },

 slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  centerSlot: {
    width: 60,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  
  navLabel: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "700",
  },

 softBtn: {
  flex: 1,
  height: 30,
  borderRadius: 10,
  backgroundColor: colors.primary,
  alignItems: "center",
  justifyContent: "center",

  shadowColor: colors.primary,
  shadowOpacity: 0.08,
  shadowRadius: 3,
  shadowOffset: {
    width: 0,
    height: 1,
  },

  elevation: 1,
},

  softBtnText: {
    fontSize: 8.5,
    color: "#FFFFFF",
    fontWeight: "900",
  },

 fab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 34,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
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
    backgroundColor: "#FFF1F6",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
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