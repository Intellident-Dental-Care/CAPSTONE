import React, { useMemo, useState, useEffect, useRef } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "./theme/colors";
import { supabase } from "../server/supabaseService";
import { getSession, getActiveProfileByEmail } from "./_storage/authStorage";
import { profileIndexCache } from "./_storage/profileCache";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Cache with TTL (5 minutes)
let dentistsCache = null;
let scheduleCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  return dentistsCache && scheduleCache && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

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

// Resolver for allowing the main account to have a NULL profile_id
async function getValidProfileId(userId, activeProfile) {
  if (!activeProfile?.id) return null; // Main account

  // 1. Check if the ID exists in user_profiles
  const { data: pExists } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", activeProfile.id)
    .maybeSingle();

  if (pExists) return activeProfile.id;

  // 2. If it fails, check by profile name
  const { data: nMatch } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("name", activeProfile.name || "User")
    .maybeSingle();

  if (nMatch) return nMatch.id;

  // 3. If neither matches, it means this is the main account, so return null
  return null; 
}

function DentistCard({ item, liked, onToggleLike, onBook }) {
  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        {item.photo ? (
          <Image source={item.photo} style={styles.photoImg} />
        ) : (
          <Ionicons name="person" size={34} color={colors.primary} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {String(item.name || "")}
            </Text>
            <Text style={styles.role}>{String(item.specialty || "")}</Text>
          </View>

          <Pressable onPress={onToggleLike} style={styles.heartBtn}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.detailBox}>
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.small} numberOfLines={1}>
            {String(item.specialties || "")}
          </Text>
        </View>

        <View style={styles.detailBox}>
          <Ionicons name="time-outline" size={13} color={colors.primary} />
          <Text style={styles.small} numberOfLines={2}>
            {String(item.availability || "")}
          </Text>
        </View>

        <Pressable style={styles.bookBtn} onPress={onBook}>
          <Text style={styles.bookText}>BOOK NOW</Text>
        </Pressable>
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
  const isMountedRef = useRef(true);
  const currentProfileIdRef = useRef(undefined); // use undefined so null registers as a valid switch

  useEffect(() => {
    isMountedRef.current = true;
    loadBookmarks();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const session = await getSession();
      const userId = session?.user?.id;
      const accountEmail = (session?.user?.email || session?.email || "").trim().toLowerCase();
      
      if (!userId || !accountEmail) {
        if (isMountedRef.current) setLikedMap({});
        return;
      }

      const activeProfile = profileIndexCache.selectedProfile || await getActiveProfileByEmail(accountEmail);
      const profileId = await getValidProfileId(userId, activeProfile);

      let query = supabase
        .from("dentist_bookmarks")
        .select("dentist_id")
        .eq("user_id", userId);

      if (profileId) {
        query = query.eq("profile_id", profileId);
      } else {
        query = query.is("profile_id", null);
      }

      const { data: bookmarks, error } = await query;

      if (error) {
        console.log("Error loading dentist bookmarks:", error.message);
        if (isMountedRef.current) setLikedMap({});
        return;
      }

      const bookmarkMap = {};
      (bookmarks || []).forEach(b => {
        bookmarkMap[b.dentist_id] = true;
      });

      if (isMountedRef.current) {
        setLikedMap(bookmarkMap);
        console.log("Loaded dentist bookmarks for profile:", profileId === null ? "Main Account" : profileId);
      }
    } catch (err) {
      console.error("Error loading bookmarks:", err);
      if (isMountedRef.current) setLikedMap({});
    }
  };

  const saveBookmarks = async (dentistId, isBookmarked) => {
    try {
      const session = await getSession();
      const userId = session?.user?.id;
      const accountEmail = (session?.user?.email || session?.email || "").trim().toLowerCase();
      
      if (!userId || !accountEmail) return;

      const activeProfile = profileIndexCache.selectedProfile || await getActiveProfileByEmail(accountEmail);
      const profileId = await getValidProfileId(userId, activeProfile);

      if (isBookmarked) {
        const { error } = await supabase
          .from("dentist_bookmarks")
          .insert({
            user_id: userId,
            profile_id: profileId, // explicitly allowed to be null
            dentist_id: dentistId
          });

        if (error && error.code !== "23505") { 
          console.error("Error saving dentist bookmark:", error);
        } else {
          console.log("Saved dentist bookmark");
        }
      } else {
        let query = supabase
          .from("dentist_bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("dentist_id", dentistId);

        if (profileId) {
          query = query.eq("profile_id", profileId);
        } else {
          query = query.is("profile_id", null);
        }

        const { error } = await query;

        if (error) {
          console.error("Error deleting dentist bookmark:", error);
        } else {
          console.log("Deleted dentist bookmark");
        }
      }
    } catch (err) {
      console.error("Error managing bookmarks:", err);
    }
  };

  const fetchDentists = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid()) {
      if (!isMountedRef.current) return;
      setDentists(dentistsCache);
      setMergedDentists(scheduleCache.merged);
      setBranchOptions(scheduleCache.branches);
      setLoading(false);
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setLoading(true);

      const { data: dentistRows, error: dentistsError } = await supabase
        .from("dentist_list")
        .select("*")
        .order("name", { ascending: true });

      if (dentistsError) throw dentistsError;

      const { data: scheduleRows, error: schedulesError } = await supabase
        .from("dentist_schedule")
        .select("*")
        .eq("is_active", true);

      const dentistMap = new Map((dentistRows || []).map((d) => [d.id, d]));
      const groupedByDentistBranch = new Map();
      const branchSet = new Set(["All"]);

      if (scheduleRows && scheduleRows.length > 0) {
        scheduleRows.forEach((row) => {
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
      }

      const mapped = [];
      Array.from(groupedByDentistBranch.values()).forEach((entry) => {
        const daysText = formatDays(entry.rows.map((r) => r.day_of_week));
        mapped.push({
          id: `${entry.dentist.id}-${entry.branch}`,
          dentistId: entry.dentist.id,
          name: entry.dentist.name,
          branch: entry.branch,
          specialty: entry.dentist.specialization || "Dentist",
          specialties: `Days in Branch | ${daysText}`,
          availability: getEarliestAvailability(entry.rows, entry.branch),
          photo: null,
        });
      });

      const dentistsWithSchedules = new Set(Array.from(groupedByDentistBranch.values()).map(e => e.dentist.id));
      dentistRows.forEach((dentist) => {
        if (!dentistsWithSchedules.has(dentist.id)) {
          mapped.push({
            id: `${dentist.id}-basic`,
            dentistId: dentist.id,
            name: dentist.name,
            specialty: dentist.specialization || "Dentist",
            specialties: `Experience: ${dentist.experience_years || "0"} years`,
            availability: "Schedule not available",
            branch: "Main",
            photo: null,
          });
        }
      });

      mapped.sort((a, b) => a.name.localeCompare(b.name));

      const dentistGrouped = new Map();
      dentistRows.forEach((dentist) => {
        dentistGrouped.set(dentist.id, {
          dentist,
          branches: [],
        });
      });

      Array.from(groupedByDentistBranch.values()).forEach((entry) => {
        if (dentistGrouped.has(entry.dentist.id)) {
          dentistGrouped.get(entry.dentist.id).branches.push({
            branch: entry.branch,
            rows: entry.rows,
          });
        }
      });

      dentistGrouped.forEach((entry) => {
        if (entry.branches.length === 0) {
          entry.branches.push({ branch: "Main", rows: [] });
          branchSet.add("Main");
        }
      });

      const mergedMapped = Array.from(dentistGrouped.values()).map((entry) => {
        const branchNames = entry.branches.map((b) => b.branch).join(", ");
        const { availabilityText, earliestBranch } = getEarliestAvailabilityAndBranch(entry.branches);
        return {
          id: `${entry.dentist.id}-merged`,
          dentistId: entry.dentist.id,
          name: entry.dentist.name,
          branch: earliestBranch || "Main",
          specialty: entry.dentist.specialization || "Dentist",
          specialties: `Branches | ${branchNames}`,
          availability: availabilityText,
          photo: null,
        };
      });

      mergedMapped.sort((a, b) => a.name.localeCompare(b.name));

      dentistsCache = mapped;
      scheduleCache = {
        merged: mergedMapped,
        branches: Array.from(branchSet).sort((a, b) => {
          if (a === "All") return -1;
          if (b === "All") return 1;
          return a.localeCompare(b);
        }),
      };
      cacheTimestamp = Date.now();

      if (!isMountedRef.current) return;
      setDentists(mapped);
      setMergedDentists(mergedMapped);
      setBranchOptions(scheduleCache.branches);
    } catch (err) {
      if (isMountedRef.current) {
        Alert.alert("Error", "Failed to load dentists");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchDentists();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const refreshBookmarks = async () => {
        try {
          const session = await getSession();
          const userId = session?.user?.id;
          const accountEmail = (session?.user?.email || session?.email || "").trim().toLowerCase();
          
          if (!userId || !accountEmail || !isMounted) return;

          const activeProfile = profileIndexCache.selectedProfile || await getActiveProfileByEmail(accountEmail);
          const profileId = await getValidProfileId(userId, activeProfile);

          if (currentProfileIdRef.current !== profileId) {
            if (isMounted) setLikedMap({});
            currentProfileIdRef.current = profileId;
          }

          let query = supabase
            .from("dentist_bookmarks")
            .select("dentist_id")
            .eq("user_id", userId);

          if (profileId) {
            query = query.eq("profile_id", profileId);
          } else {
            query = query.is("profile_id", null);
          }

          const { data: bookmarks, error } = await query;

          if (error) {
            if (isMounted) setLikedMap({});
            return;
          }

          const bookmarkMap = {};
          (bookmarks || []).forEach(b => {
            bookmarkMap[b.dentist_id] = true;
          });

          if (isMounted) {
            setLikedMap(bookmarkMap);
          }
        } catch (err) {
          if (isMounted) setLikedMap({});
        }
      };

      refreshBookmarks();

      if (dentistsCache && isCacheValid()) {
        if (isMounted) {
          setDentists(dentistsCache);
          setMergedDentists(scheduleCache.merged);
          setBranchOptions(scheduleCache.branches);
        }
      } else if (dentistsCache !== null) {
        fetchDentists(false);
      }

      return () => {
        isMounted = false;
      };
    }, [])
  );

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

  const handleToggleLike = async (dentistId) => {
    const newLiked = { ...likedMap, [dentistId]: !likedMap[dentistId] };
    setLikedMap(newLiked);
    await saveBookmarks(dentistId, newLiked[dentistId]);
  };

  const renderRow = ({ item, index }) => {
    if (item.type === "title") {
      return (
        <Text style={[styles.sectionTitle, index === 0 && { marginTop: 0 }]}>
          {String(item.label || "")}
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
          onToggleLike={() => handleToggleLike(d.dentistId)}
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
                  {String(b || "")}
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
  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 8,
  },

  fixedTop: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },

  header: {
    height: 48,
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

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
  },

  searchWrap: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#F1C6D6",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    color: "#333",
  },

  pillsRow: {
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },

  pill: {
    height: 34,
    minWidth: 120,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  pillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },

  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "900",
    color: "#333",
  },

  cardWrap: {
    marginBottom: 14,
  },

  card: {
    minHeight: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  photo: {
    width: 82,
    borderRadius: 18,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    marginRight: 12,
  },

  photoImg: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    resizeMode: "cover",
  },

  info: {
    flex: 1,
    paddingVertical: 2,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
    paddingRight: 8,
  },

  role: {
    marginTop: 3,
    fontSize: 11,
    color: "#555",
    fontWeight: "800",
  },

  detailBox: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  small: {
    flex: 1,
    fontSize: 9.5,
    color: "#777",
    lineHeight: 14,
    fontWeight: "600",
  },

  bookBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    height: 32,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  bookText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 30,
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
    borderRadius: 22,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },

  optionButton: {
    backgroundColor: "#FFF1F6",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "800",
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
    fontWeight: "700",
  },
});