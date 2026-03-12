import React, { useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

const BRANCHES = [
  "All",
  "General Trias, Cavite",
  "Dasmarinas, Cavite",
  "Bacoor, Cavite",
];

const DENTISTS = [
  {
    id: "gt-1",
    name: "Dr. Bianca L. Reyes",
    branch: "General Trias, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability:
      "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental General Trias",
    photo: null,
  },
  {
    id: "gt-2",
    name: "Dr. Noel G. Santos",
    branch: "General Trias, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Cleaning, Pasta, Whitening",
    availability:
      "Earliest Availability | Wed, Jan 14 - 1:00 PM - GC Dental General Trias",
    photo: null,
  },
  {
    id: "gt-3",
    name: "Dr. Aria P. Valdez",
    branch: "General Trias, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Extraction, Cleaning, Whitening",
    availability:
      "Earliest Availability | Fri, Jan 16 - 9:30 AM - GC Dental General Trias",
    photo: null,
  },

  {
    id: "ds-1",
    name: "Dr. Dian Crizzie Mendoza",
    branch: "Dasmarinas, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability:
      "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental Dasmarinas",
    photo: null,
  },
  {
    id: "ds-2",
    name: "Dr. Edward Angelo Guillermo",
    branch: "Dasmarinas, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability:
      "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental Dasmarinas",
    photo: null,
  },

  {
    id: "bc-1",
    name: "Dr. Patricia M. Cruz",
    branch: "Bacoor, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Cleaning, Extraction, Whitening",
    availability:
      "Earliest Availability | Mon, Jan 12 - 11:00 AM - GC Dental Bacoor",
    photo: null,
  },
  {
    id: "bc-2",
    name: "Dr. Rhea T. Morales",
    branch: "Bacoor, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign",
    availability:
      "Earliest Availability | Wed, Jan 14 - 9:00 AM - GC Dental Bacoor",
    photo: null,
  },
];

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

  const [flowModalVisible, setFlowModalVisible] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return DENTISTS.filter((d) => {
      const okBranch = branch === "All" ? true : d.branch === branch;
      if (!okBranch) return false;

      if (!query) return true;

      const text =
        `${d.name} ${d.specialty} ${d.specialties} ${d.availability} ${d.branch}`.toLowerCase();

      return text.includes(query);
    });
  }, [q, branch]);

  const favorites = useMemo(
    () => filtered.filter((x) => !!likedMap[x.id]),
    [filtered, likedMap]
  );

  const nonFavorites = useMemo(
    () => filtered.filter((x) => !likedMap[x.id]),
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
          liked={!!likedMap[d.id]}
          onToggleLike={() =>
            setLikedMap((prev) => ({ ...prev, [d.id]: !prev[d.id] }))
          }
          onBook={() => {
            setSelectedDentist(d);
            setFlowModalVisible(true);
          }}
        />
      </View>
    );
  };

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
          {BRANCHES.map((b) => {
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