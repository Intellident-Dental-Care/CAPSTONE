// FILE PATH: app/appointments/index.js

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "./../theme/colors";
import { supabase } from "../../server/supabaseService";
import { getCurrentActiveProfileForSession } from "../_storage/authStorage";
import { appointmentsListCache, APPOINTMENT_CACHE_TTL_MS } from "../_storage/profileCache";

function fmt12h(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${m} ${ampm}`;
}

function formatDatePill(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getDate()).padStart(2, "0");
  return { mon, day };
}

function getStatusUI(status) {
  switch (status) {
    case "upcoming":
      return {
        label: "Upcoming",
        icon: "time-outline",
        color: "#F4B400",
        bg: "#FFF4CC",
      };
    case "completed":
      return {
        label: "Completed",
        icon: "checkmark-circle-outline",
        color: "#2E7D32",
        bg: "#E6F4EA",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: "close-circle-outline",
        color: "#eb0d0d",
        bg: "#fcccc7",
      };
    default:
      return {
        label: status,
        icon: "information-circle-outline",
        color: "#555",
        bg: "#EEE",
      };
  }
}

function isUpcoming(dateStr) {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export default function AppointmentsScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [flowModalVisible, setFlowModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const fetchAppointments = async () => {
    try {
      const activeProfile = await getCurrentActiveProfileForSession();
      const profileId = activeProfile?.id || null;
      const cacheKey = profileId || '__no_profile__';
      const cached = appointmentsListCache[cacheKey];
      const now = Date.now();
      const isStale = !cached || (now - cached.fetchedAt) > APPOINTMENT_CACHE_TTL_MS;

      // Seed from cache immediately — no loading flash on revisit
      if (cached) {
        setAppointments(cached.data);
        setLoading(false);
      }

      // Only hit the network when there's no cache or it's stale
      if (!isStale) return;

      if (!cached) setLoading(true);

      let dbQuery = supabase
        .from('bookings')
        .select('*, dentist_list(name, specialization)')
        .order('appointment_date', { ascending: false });

      if (profileId) {
        dbQuery = dbQuery.eq('profile_id', profileId);
      } else {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) { setLoading(false); return; }
        dbQuery = dbQuery.eq('user_id', user.id);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;

      const statusMap = {
        pending: 'upcoming',
        confirmed: 'upcoming',
        completed: 'completed',
        cancelled: 'cancelled',
      };
      const mapped = (data || []).map((b) => ({
        id: b.id,
        procedure: b.service || 'Dental Appointment',
        treatment: b.dentist_list?.specialization || 'General Dentistry',
        dentist: b.dentist_list?.name || 'Unknown',
        date: b.appointment_date,
        time: fmt12h(b.appointment_time),
        status: statusMap[b.status] || 'upcoming',
      }));

      appointmentsListCache[cacheKey] = { data: mapped, fetchedAt: Date.now() };
      setAppointments(mapped);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
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

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();

    return appointments
      .filter((a) => {
        if (filter === "all") return true;
        if (filter === "upcoming") {
          return a.status === "upcoming" && isUpcoming(a.date);
        }
        return a.status === filter;
      })
      .filter((a) => {
        if (!q) return true;
        return (
          a.procedure.toLowerCase().includes(q) ||
          a.treatment.toLowerCase().includes(q) ||
          a.dentist.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [query, filter, appointments]);

  const Chip = ({ value, label }) => {
    const active = filter === value;
    return (
      <Pressable
        onPress={() => setFilter(value)}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderItem = ({ item }) => {
    const pill = formatDatePill(item.date);
    const statusUI = getStatusUI(item.status);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        onPress={() => router.push(`/appointments/${item.id}`)}
      >
        <View style={styles.datePill}>
          <Text style={styles.pillMonth}>{pill.mon}</Text>
          <Text style={styles.pillDay}>{pill.day}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.rowTop}>
            <Text style={styles.procedureTitle} numberOfLines={1}>
              {item.procedure}
            </Text>

            <View style={[styles.badge, { backgroundColor: statusUI.bg }]}>
              <Ionicons
                name={statusUI.icon}
                size={14}
                color={statusUI.color}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.badgeText, { color: statusUI.color }]}>
                {statusUI.label}
              </Text>
            </View>
          </View>

          <Text style={styles.subLine} numberOfLines={1}>
            Treatment: {item.treatment}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.muted || "#777"}
              />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>

            <View style={styles.metaDot} />

            <View style={styles.metaItem}>
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.muted || "#777"}
              />
              <Text style={styles.metaText}>{item.dentist}</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.appId}>#{item.id}</Text>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.muted || "#777"}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Appointments</Text>

        <Pressable style={styles.addBtn} onPress={openFlowModal}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.muted || "#777"}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search procedure, treatment, dentist, ID..."
          placeholderTextColor={colors.muted || "#777"}
          style={styles.searchInput}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.muted || "#777"}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.chipsRow}>
        <Chip value="all" label="All" />
        <Chip value="upcoming" label="Upcoming" />
        <Chip value="completed" label="Completed" />
        <Chip value="cancelled" label="Cancelled" />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={34}
                color={colors.muted || "#777"}
              />
              <Text style={styles.emptyTitle}>No appointments found</Text>
              <Text style={styles.emptySub}>
                Try a different search or filter.
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={flowModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFlowModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeFlowModal}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#fff",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 18,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card || "#F5F7FB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text || "#111",
  },

  rightSpacer: {
    width: 40,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.card || "#F5F7FB",
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text || "#111",
  },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  chip: {
    width: 80,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card || "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  chipActive: {
    backgroundColor: (colors.primary || "#2E7CF6") + "20",
  },

  chipText: {
    fontSize: 12,
    color: colors.muted || "#777",
    fontWeight: "700",
  },

  chipTextActive: {
    color: colors.primary || "#2E7CF6",
  },

  card: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 12,
    backgroundColor: colors.card || "#F5F7FB",
    marginBottom: 12,
  },

  datePill: {
    width: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: (colors.primary || "#2E7CF6") + "18",
  },

  pillMonth: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary || "#2E7CF6",
  },

  pillDay: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text || "#111",
  },

  cardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  procedureTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: colors.text || "#111",
    marginRight: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  subLine: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted || "#777",
    fontWeight: "600",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.muted || "#777",
    fontWeight: "600",
  },

  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.muted || "#777",
    marginHorizontal: 10,
  },

  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  appId: {
    fontSize: 11,
    color: colors.muted || "#777",
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text || "#111",
  },

  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted || "#777",
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