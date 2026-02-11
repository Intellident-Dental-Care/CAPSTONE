import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

const BRANCHES = ["All", "General Trias, Cavite", "Dasmarinas, Cavite", "Bacoor, Cavite"];

const DENTISTS = [
  // General Trias (3)
  {
    id: "gt-1",
    name: "Dr. Bianca L. Reyes",
    branch: "General Trias, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability: "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental General Trias",
    photo: null,
  },
  {
    id: "gt-2",
    name: "Dr. Noel G. Santos",
    branch: "General Trias, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Cleaning, Pasta, Whitening",
    availability: "Earliest Availability | Wed, Jan 14 - 1:00 PM - GC Dental General Trias",
    photo: null,
  },
  {
    id: "gt-3",
    name: "Dr. Aria P. Valdez",
    branch: "General Trias, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Extraction, Cleaning, Whitening",
    availability: "Earliest Availability | Fri, Jan 16 - 9:30 AM - GC Dental General Trias",
    photo: null,
  },

  // Dasmarinas (4)
  {
    id: "ds-1",
    name: "Dr. Dian Crizzie Mendoza",
    branch: "Dasmarinas, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability: "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental Dasmarinas",
    photo: null,
  },
  {
    id: "ds-2",
    name: "Dr. Edward Angelo Guillermo",
    branch: "Dasmarinas, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability: "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental Dasmarinas",
    photo: null,
  },
  {
    id: "ds-3",
    name: "Dr. Jambie Amparo",
    branch: "Dasmarinas, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign, Whitening",
    availability: "Earliest Availability | Tue, Jan 13 - 10:00 AM - GC Dental Dasmarinas",
    photo: null,
  },
  {
    id: "ds-4",
    name: "Dr. Kaye L. Navarro",
    branch: "Dasmarinas, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Cleaning, Pasta, Whitening",
    availability: "Earliest Availability | Thu, Jan 15 - 2:00 PM - GC Dental Dasmarinas",
    photo: null,
  },

  // Bacoor (5)
  {
    id: "bc-1",
    name: "Dr. Patricia M. Cruz",
    branch: "Bacoor, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Cleaning, Extraction, Whitening",
    availability: "Earliest Availability | Mon, Jan 12 - 11:00 AM - GC Dental Bacoor",
    photo: null,
  },
  {
    id: "bc-2",
    name: "Dr. Lance P. Aquino",
    branch: "Bacoor, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Pasta, Cleaning, Whitening",
    availability: "Earliest Availability | Tue, Jan 13 - 3:00 PM - GC Dental Bacoor",
    photo: null,
  },
  {
    id: "bc-3",
    name: "Dr. Rhea T. Morales",
    branch: "Bacoor, Cavite",
    specialty: "Orthodontics",
    specialties: "Specialties | Braces, Invisalign",
    availability: "Earliest Availability | Wed, Jan 14 - 9:00 AM - GC Dental Bacoor",
    photo: null,
  },
  {
    id: "bc-4",
    name: "Dr. Miguel A. Ramos",
    branch: "Bacoor, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Extraction, Cleaning",
    availability: "Earliest Availability | Thu, Jan 15 - 10:30 AM - GC Dental Bacoor",
    photo: null,
  },
  {
    id: "bc-5",
    name: "Dr. Sofia D. Lim",
    branch: "Bacoor, Cavite",
    specialty: "Dentist",
    specialties: "Specialties | Whitening, Cleaning",
    availability: "Earliest Availability | Fri, Jan 16 - 1:30 PM - GC Dental Bacoor",
    photo: null,
  },
];

function FilterPill({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

function DentistCard({ item, liked, onToggleLike, onBook }) {
  return (
    <View style={styles.cardWrap}>
      <View style={styles.card}>
        {/* LEFT PHOTO: full height */}
        <View style={styles.photo}>
          {item.photo ? (
            <Image source={item.photo} style={styles.photoImg} />
          ) : (
            <Ionicons name="person" size={28} color={colors.primary} />
          )}
        </View>

        {/* RIGHT CONTENT */}
        <View style={styles.info}>
          {/* top row: name + heart */}
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>

            <Pressable onPress={onToggleLike} style={styles.heartBtn}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={colors.primary} />
            </Pressable>
          </View>

          <Text style={styles.role}>{item.specialty}</Text>
          <Text style={styles.small}>{item.specialties}</Text>
          <Text style={styles.small}>{item.availability}</Text>

          {/* book button pinned right */}
          <View style={styles.bookRow}>
            <Pressable style={styles.bookBtn} onPress={onBook}>
              <Text style={styles.bookText}>BOOK NOW</Text>
            </Pressable>
          </View>
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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return DENTISTS.filter((d) => {
      const okBranch = branch === "All" ? true : d.branch === branch;
      const okSearch = !query ? true : d.name.toLowerCase().includes(query);
      return okBranch && okSearch;
    });
  }, [q, branch]);

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>Dentist</Text>

        <View style={{ width: 36 }} />
      </View>

      {/* search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.textGray}
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
          />
          <Ionicons name="search" size={16} color={colors.primary} />
        </View>

        
      </View>

      {/* branch filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
        {BRANCHES.map((b) => (
          <FilterPill key={b} label={b} active={branch === b} onPress={() => setBranch(b)} />
        ))}
      </ScrollView>

      {/* list */}
      <ScrollView contentContainerStyle={{ paddingBottom: 30, alignItems: "s" }} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <DentistCard
            key={item.id}
            item={item}
            liked={!!likedMap[item.id]}
            onToggleLike={() => setLikedMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
            onBook={() =>
              router.push({
                pathname: "/booking",
                params: { branch: item.branch, doctor: item.name },
              })
            }
          />
        ))}

        {filtered.length === 0 && (
          <Text style={{ textAlign: "center", color: colors.textGray, marginTop: 20 }}>No dentist found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 46 },

  header: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.primary },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, marginTop: 6 },
  searchWrap: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchInput: { flex: 1, fontSize: 12, color: colors.textDark, paddingRight: 10 },
  filterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFE9F1", alignItems: "center", justifyContent: "center" },

  pillsRow: { paddingHorizontal: 25, paddingTop: 12, paddingBottom: 12, gap: 10 },
  pill: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: "#FFE9F1", alignItems: "center", justifyContent: "center" },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: 10, fontWeight: "800", color: colors.primary },

  cardWrap: { paddingHorizontal: 16, marginTop: 12 },


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
  photoImg: { width: "100%", height: "100%", resizeMode: "cover" },

  info: { flex: 1, padding: 12 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heartBtn: { paddingLeft: 10, paddingVertical: 4 },

  name: { fontSize: 12, fontWeight: "900", color: colors.primary, flex: 1, paddingRight: 10 },
  role: { marginTop: 2, fontSize: 10, color: "#666", fontWeight: "700" },
  small: { marginTop: 2, fontSize: 9, color: "#777" },

 
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
  bookText: { fontSize: 9, color: "#fff", fontWeight: "900" },
});
