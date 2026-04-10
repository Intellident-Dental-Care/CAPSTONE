import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import { supabase } from "../server/supabaseService";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime12(time24) {
  if (!time24) return "";
  const [h = "0", m = "00"] = String(time24).split(":");
  const hour24 = Number.parseInt(h, 10);
  if (Number.isNaN(hour24)) return "";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${m} ${suffix}`;
}

function formatDays(dayNumbers) {
  const sorted = [...new Set((dayNumbers || []).map((d) => Number(d)))]
    .filter((d) => d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  if (!sorted.length) return "No schedule";
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

function getEarliestAvailability(rows, branch) {
  if (!rows?.length) return `No upcoming schedule - ${branch}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 21; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const weekday = date.getDay();
    const match = rows.find((row) => Number(row.day_of_week) === weekday);
    if (!match) continue;

    const dateLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const startLabel = formatTime12(match.start_time);
    return `Earliest Availability | ${dateLabel}${startLabel ? ` - ${startLabel}` : ""} - ${branch}`;
  }

  return `Available at ${branch}`;
}

function getEarliestAvailabilityAndBranch(branches) {
  if (!branches?.length) return { availabilityText: "No upcoming schedule", earliestBranch: "" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 21; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const weekday = date.getDay();

    for (const branchEntry of branches) {
      const match = branchEntry.rows.find((row) => Number(row.day_of_week) === weekday);
      if (!match) continue;

      const dateLabel = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const startLabel = formatTime12(match.start_time);
      return {
        availabilityText: `Earliest Availability | ${dateLabel}${startLabel ? ` - ${startLabel}` : ""} - ${branchEntry.branch}`,
        earliestBranch: branchEntry.branch,
      };
    }
  }

  return { availabilityText: "No upcoming schedule", earliestBranch: branches[0]?.branch || "" };
}

function DentistCard({ item, liked, onToggleLike, onBook }) {
  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        {item.photo ? (
          <Image source={item.photo} style={styles.photoImg} />
        ) : (
          <Ionicons name="person" size={28} color={colors.primary} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>

          <Pressable onPress={onToggleLike} style={styles.heartBtn}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={18}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <Text style={styles.role}>{item.specialty}</Text>
        <Text style={styles.small} numberOfLines={1}>
          {item.specialties}
        </Text>
        <Text style={styles.small} numberOfLines={2}>
          {item.availability}
        </Text>

        <View style={styles.bookRow}>
          <Pressable style={styles.bookBtn} onPress={onBook}>
            <Text style={styles.bookText}>BOOK NOW</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function Dentists() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("All");
  const [likedMap, setLikedMap] = useState({});
  const [dentists, setDentists] = useState([]);
  const [branchOptions, setBranchOptions] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [mergedDentists, setMergedDentists] = useState([]);

  const [flowModalVisible, setFlowModalVisible] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState(null);

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        setLoading(true);
        const [{ data: dentistRows, error: dentistsError }, { data: scheduleRows, error: schedulesError }] =
          await Promise.all([
            supabase
              .from("dentist_list")
              .select("id, name, specialization, experience_years, total_patients, success_rate"),
            supabase
              .from("dentist_schedule")
              .select("dentist_id, branch, day_of_week, start_time, end_time")
              .eq("is_active", true),
          ]);

        if (dentistsError) throw dentistsError;
        if (schedulesError) throw schedulesError;

        const dentistMap = new Map((dentistRows || []).map((d) => [d.id, d]));
        const groupedByDentistBranch = new Map();
        const branchSet = new Set(["All"]);

        (scheduleRows || []).forEach((row) => {
          const branchName = row.branch?.trim();
          const dentist = dentistMap.get(row.dentist_id);
          if (!branchName || !dentist) return;

          branchSet.add(branchName);

          const key = `${row.dentist_id}::${branchName}`;
          if (!groupedByDentistBranch.has(key)) {
            groupedByDentistBranch.set(key, {
              dentist,
              branch: branchName,
              rows: [],
            });
          }

          groupedByDentistBranch.get(key).rows.push(row);
        });

        const mapped = Array.from(groupedByDentistBranch.values()).map((entry) => {
          const daysText = formatDays(entry.rows.map((r) => r.day_of_week));
          return {
            id: `${entry.dentist.id}-${entry.branch}`,
            dentistId: entry.dentist.id,
            name: entry.dentist.name,
            branch: entry.branch,
            specialty: entry.dentist.specialization || "Dentist",
            specialties: `Days in Branch | ${daysText}`,
            availability: getEarliestAvailability(entry.rows, entry.branch),
            photo: null,
          };
        });

        mapped.sort((a, b) => a.name.localeCompare(b.name));

        setDentists(mapped);
        setBranchOptions(Array.from(branchSet).sort((a, b) => {
          if (a === "All") return -1;
          if (b === "All") return 1;
          return a.localeCompare(b);
        }));

        const dentistGrouped = new Map();
        Array.from(groupedByDentistBranch.values()).forEach((entry) => {
          if (!dentistGrouped.has(entry.dentist.id)) {
            dentistGrouped.set(entry.dentist.id, {
              dentist: entry.dentist,
              branches: [],
            });
          }
          dentistGrouped.get(entry.dentist.id).branches.push({
            branch: entry.branch,
            rows: entry.rows,
          });
        });

        const mergedMapped = Array.from(dentistGrouped.values()).map((entry) => {
          const branchNames = entry.branches.map((b) => b.branch).join(", ");
          const { availabilityText, earliestBranch } = getEarliestAvailabilityAndBranch(entry.branches);
          return {
            id: `${entry.dentist.id}-merged`,
            dentistId: entry.dentist.id,
            name: entry.dentist.name,
            branch: earliestBranch,
            specialty: entry.dentist.specialization || "Dentist",
            specialties: `Branches | ${branchNames}`,
            availability: availabilityText,
            photo: null,
          };
        });

        mergedMapped.sort((a, b) => a.name.localeCompare(b.name));
        setMergedDentists(mergedMapped);
      } catch (err) {
        console.error("Error loading dentist schedules:", err);
        Alert.alert("Error", "Failed to load dentist schedules.");
      } finally {
        setLoading(false);
      }
    };

    fetchDentists();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const source = branch === "All" ? mergedDentists : dentists;

    return source.filter((d) => {
      if (branch !== "All" && d.branch !== branch) return false;

      if (!query) return true;

      const text =
        `${d.name} ${d.specialty} ${d.specialties} ${d.availability} ${d.branch}`.toLowerCase();

      return text.includes(query);
    });
  }, [q, branch, dentists, mergedDentists]);

  const favorites = useMemo(
    () => filtered.filter((x) => !!likedMap[x.dentistId]),
    [filtered, likedMap]
  );

  const nonFavorites = useMemo(
    () => filtered.filter((x) => !likedMap[x.dentistId]),
    [filtered, likedMap]
  );

  const listData = useMemo(() => {
    const out = [];

    if (favorites.length > 0) {
      out.push({ type: "title", id: "t-fav", label: "Favorites" });
      favorites.forEach((x) =>
        out.push({ type: "card", id: `fav-${x.id}`, item: x })
      );
    }

    out.push({ type: "title", id: "t-all", label: "All Dentists" });
    nonFavorites.forEach((x) =>
      out.push({ type: "card", id: `all-${x.id}`, item: x })
    );

    return out;
  }, [favorites, nonFavorites]);

  const closeFlowModal = () => {
    setFlowModalVisible(false);
    setSelectedDentist(null);
  };

  const handleChoosePreAssessment = () => {
    if (!selectedDentist) return;

    setFlowModalVisible(false);
    router.push({
      pathname: "/pre-assessment",
      params: {
        doctor: selectedDentist.name,
        branch: selectedDentist.branch,
      },
    });
  };

  const handleChooseBooking = () => {
    if (!selectedDentist) return;

    setFlowModalVisible(false);
    router.push({
      pathname: "/booking",
      params: {
        doctor: selectedDentist.name,
        doctorId: selectedDentist.dentistId,
        branch: selectedDentist.branch,
      },
    });
  };

  const renderRow = ({ item, index }) => {
    if (item.type === "title") {
      return (
        <Text style={[styles.sectionTitle, index === 0 && { marginTop: 0 }]}>
          {item.label}
        </Text>
      );
    }

    const d = item.item;
    const isFirstCardUnderFirstTitle = index === 1;

    return (
      <View
        style={[
          styles.cardWrap,
          isFirstCardUnderFirstTitle && { marginTop: 6 },
        ]}
      >
        <DentistCard
          item={d}
          liked={!!likedMap[d.dentistId]}
          onToggleLike={() =>
            setLikedMap((prev) => ({ ...prev, [d.dentistId]: !prev[d.dentistId] }))
          }
          onBook={() => {
            setSelectedDentist(d);
            setFlowModalVisible(true);
          }}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.textGray }}>
          Loading dentists...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.fixedTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

          <Text style={styles.headerTitle}>Dentist</Text>

          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={18} color={colors.primary} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {branchOptions.map((b) => {
            const active = branch === b;
            return (
              <Pressable
                key={b}
                onPress={() => setBranch(b)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.pillText, active && { color: "#fff" }]}
                >
                  {b}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={listData}
        keyExtractor={(x) => x.id}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No dentist found.</Text>
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

            <Pressable style={styles.optionButton} onPress={handleChooseBooking}>
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
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 46 },

  fixedTop: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  header: {
    height: 54,
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

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },

  searchWrap: {
    height: 42,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginTop: 8,
  },

  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    color: "#333",
  },

  pillsRow: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },

  pill: {
    width: 160,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  pillActive: {
    backgroundColor: colors.primary,
  },

  pillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },

  listContent: {
    paddingTop: 8,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  cardWrap: {
    marginBottom: 12,
  },

  card: {
    height: 120,
    backgroundColor: "#FFD6E6",
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  photo: {
    width: 92,
    height: "100%",
    backgroundColor: "#8B8B8B",
    alignItems: "center",
    justifyContent: "center",
  },

  photoImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  info: {
    flex: 1,
    padding: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heartBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  name: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
    flex: 1,
    paddingRight: 10,
  },

  role: {
    marginTop: 2,
    fontSize: 10,
    color: "#666",
    fontWeight: "700",
  },

  small: {
    marginTop: 2,
    fontSize: 9,
    color: "#777",
  },

  bookRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  bookBtn: {
    height: 22,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#6B6B6B",
    alignItems: "center",
    justifyContent: "center",
  },

  bookText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: colors.textGray,
    fontWeight: "700",
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