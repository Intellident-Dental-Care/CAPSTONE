// FILE PATH: app/appointments/index.js

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./../theme/colors";

const MOCK_APPOINTMENTS = [
  {
    id: "A-1001",
    procedure: "Teeth Cleaning",
    treatment: "Prophylaxis",
    dentist: "Dr. Santos",
    date: "2026-02-25",
    time: "10:30 AM",
    status: "upcoming", // upcoming | completed | cancelled
  },
  {
    id: "A-1002",
    procedure: "Tooth Extraction",
    treatment: "Surgical Removal",
    dentist: "Dr. Reyes",
    date: "2026-02-20",
    time: "03:00 PM",
    status: "completed",
  },
  {
    id: "A-1003",
    procedure: "Braces Adjustment",
    treatment: "Ortho Follow-up",
    dentist: "Dr. Santos",
    date: "2026-02-26",
    time: "01:00 PM",
    status: "upcoming",
  },
  {
    id: "A-1004",
    procedure: "Dental Consultation",
    treatment: "Initial Check-up",
    dentist: "Dr. Cruz",
    date: "2026-02-18",
    time: "11:00 AM",
    status: "cancelled",
  },
];

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
        color: "#F4B400",        // yellow
        bg: "#FFF4CC",
      };
    case "completed":
      return {
        label: "Completed",
        icon: "checkmark-circle-outline",
        color: "#2E7D32",        // green
        bg: "#E6F4EA",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: "close-circle-outline",
        color: "#eb0d0d",        // red
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
  const [filter, setFilter] = useState("all"); // all | upcoming | completed | cancelled

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MOCK_APPOINTMENTS
      .filter((a) => {
        if (filter === "all") return true;
        if (filter === "upcoming")
          return a.status === "upcoming" && isUpcoming(a.date);
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
  }, [query, filter]);

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
        {/* Left date pill */}
        <View style={styles.datePill}>
          <Text style={styles.pillMonth}>{pill.mon}</Text>
          <Text style={styles.pillDay}>{pill.day}</Text>
        </View>

        {/* Main content */}
        <View style={styles.cardBody}>
          <View style={styles.rowTop}>
            {/* Main title = Procedure */}
            <Text style={styles.procedureTitle} numberOfLines={1}>
              {item.procedure}
            </Text>

            {/* Status badge */}
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

          {/* Procedure label changed to something else: "Treatment" */}
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
            <Feather name="chevron-right" size={18} color={colors.muted || "#777"} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header same pattern: back left, title centered */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Appointments</Text>

        <Pressable style={styles.addBtn} onPress={() => router.push("/appointments/add")}>
            <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Search */}
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

      {/* Filters */}
      <View style={styles.chipsRow}>
        <Chip value="all" label="All" />
        <Chip value="upcoming" label="Upcoming" />
        <Chip value="completed" label="Completed" />
        <Chip value="cancelled" label="Cancelled" />
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={34}
              color={colors.muted || "#777"}
            />
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySub}>Try a different search or filter.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#fff",
    padding: 16,
  },

  /* Header */
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

  /* Search */
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

  /* Chips */
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  chip: {
  width: 80,              // same width for all
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: colors.card || "#F5F7FB",
  alignItems: "center",   // center text horizontally
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

  /* Card */
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
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  procedureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text || "#111",
    flex: 1,
    marginRight: 10,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary || "#2E7CF6",
  },

  subLine: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted || "#777",
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted || "#777",
    fontWeight: "700",
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.muted || "#777",
    marginHorizontal: 10,
    opacity: 0.6,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  appId: {
    fontSize: 12,
    color: colors.muted || "#777",
    fontWeight: "700",
  },

  /* Empty state */
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: colors.text || "#111",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted || "#777",
  },
});