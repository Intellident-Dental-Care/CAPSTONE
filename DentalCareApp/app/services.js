// app/services.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

// ✅ images based on your folder structure
const IMAGES = {
  a: require("../assets/landing1.jpg"),
  b: require("../assets/landing2.jpg"),
  c: require("../assets/landing3.jpg"),
};

const CATEGORIES = [
  "All",
  "Appliance & Ortho Related",
  "Prosthodontics & Esthetics",
  "Retainers",
  "Pediatric Services",
  "General Services",
  "Self-Ligating Braces",
  "Other Services",
];

const SERVICES = [
  // Other Services
  {
    id: "svc-001",
    category: "Other Services",
    name: "Root Canal Treatment",
    desc: "Treats infected tooth pulp to relieve pain and save the tooth.",
    image: IMAGES.a,
  },
  {
    id: "svc-002",
    category: "Other Services",
    name: "Post and Core for RCT",
    desc: "Builds support for a crown after a root canal-treated tooth.",
    image: IMAGES.b,
  },
  {
    id: "svc-003",
    category: "Other Services",
    name: "Lip Repositioning",
    desc: "Helps reduce a gummy smile by adjusting lip position.",
    image: IMAGES.a,
  },
  {
    id: "svc-004",
    category: "Other Services",
    name: "Gingivectomy",
    desc: "Removes excess gum tissue to improve gum health and appearance.",
    image: IMAGES.c,
  },
  {
    id: "svc-005",
    category: "Other Services",
    name: "Dental Consultation",
    desc: "Professional evaluation of your teeth, gums, and oral concerns.",
    image: IMAGES.b,
  },
  {
    id: "svc-006",
    category: "Other Services",
    name: "Dental Certificate",
    desc: "Official certificate for school, work, or medical requirements.",
    image: IMAGES.c,
  },
  {
    id: "svc-007",
    category: "Other Services",
    name: "Teeth Whitening",
    desc: "Brightens teeth and removes stains for a cleaner, whiter smile.",
    image: IMAGES.a,
  },
  {
    id: "svc-008",
    category: "Other Services",
    name: "Periapical X-Ray",
    desc: "X-ray used to check tooth roots and surrounding bone structures.",
    image: IMAGES.b,
  },
  {
    id: "svc-009",
    category: "Other Services",
    name: "Frenectomy",
    desc: "Release/removal of frenum to improve movement and comfort.",
    image: IMAGES.c,
  },
  {
    id: "svc-010",
    category: "Other Services",
    name: "TMJ Consultation",
    desc: "Assesses jaw pain, clicking, headaches, and bite issues.",
    image: IMAGES.a,
  },
  {
    id: "svc-011",
    category: "Other Services",
    name: "Dental Implant",
    desc: "Replaces missing teeth using a titanium implant and crown.",
    image: IMAGES.b,
  },
  {
    id: "svc-012",
    category: "Other Services",
    name: "Bone Grafting",
    desc: "Adds bone support for implants or improved jaw stability.",
    image: IMAGES.b,
  },

  // Appliance & Ortho Related
  {
    id: "svc-013",
    category: "Appliance & Ortho Related",
    name: "TMJ Splint",
    desc: "Custom splint to reduce jaw stress and TMJ pain.",
    image: IMAGES.a,
  },
  {
    id: "svc-014",
    category: "Appliance & Ortho Related",
    name: "Space Maintainer Appliance",
    desc: "Keeps space for permanent teeth after early tooth loss.",
    image: IMAGES.c,
  },
  {
    id: "svc-015",
    category: "Appliance & Ortho Related",
    name: "Expander",
    desc: "Widening device to improve bite alignment and jaw space.",
    image: IMAGES.b,
  },
  {
    id: "svc-016",
    category: "Appliance & Ortho Related",
    name: "Temporary Anchorage Device",
    desc: "Small device to help move teeth precisely during orthodontics.",
    image: IMAGES.c,
  },

  // Prosthodontics & Esthetics
  {
    id: "svc-021",
    category: "Prosthodontics & Esthetics",
    name: "Ordinary Dentures Acrylic",
    desc: "Traditional acrylic dentures for missing teeth replacement.",
    image: IMAGES.a,
  },
  {
    id: "svc-027",
    category: "Prosthodontics & Esthetics",
    name: "Fixed Bridge / Jacket / Crown",
    desc: "Restores damaged or missing teeth using fixed prosthetics.",
    image: IMAGES.b,
  },
  {
    id: "svc-029",
    category: "Prosthodontics & Esthetics",
    name: "Veneers",
    desc: "Thin shells placed on front teeth to improve smile appearance.",
    image: IMAGES.a,
  },

  // Retainers
  {
    id: "svc-030",
    category: "Retainers",
    name: "Invisible Retainers",
    desc: "Clear retainers to keep teeth aligned after braces.",
    image: IMAGES.b,
  },

  // Pediatric Services
  {
    id: "svc-033",
    category: "Pediatric Services",
    name: "Consultation (Kids)",
    desc: "Dental check-up designed for children’s oral health needs.",
    image: IMAGES.a,
  },

  // General Services
  {
    id: "svc-039",
    category: "General Services",
    name: "Oral Prophylaxis (Cleaning)",
    desc: "Routine cleaning to remove plaque and tartar build-up.",
    image: IMAGES.c,
  },
  {
    id: "svc-040",
    category: "General Services",
    name: "Tooth Restoration (Pasta)",
    desc: "Filling procedure to restore tooth damaged by cavities.",
    image: IMAGES.a,
  },
  {
    id: "svc-041",
    category: "General Services",
    name: "Tooth Extraction (Bunot)",
    desc: "Removal of tooth due to decay, damage, or crowding.",
    image: IMAGES.b,
  },

  // Self-Ligating Braces
  {
    id: "svc-042",
    category: "Self-Ligating Braces",
    name: "Local Self-Ligating",
    desc: "Self-ligating braces option for efficient tooth alignment.",
    image: IMAGES.c,
  },
  {
    id: "svc-043",
    category: "Self-Ligating Braces",
    name: "Damon Self-Ligating",
    desc: "Damon system braces designed for faster, comfortable treatment.",
    image: IMAGES.a,
  },
  {
    id: "svc-044",
    category: "Self-Ligating Braces",
    name: "Ceramic Self-Ligating",
    desc: "Clear/ceramic self-ligating braces for a more aesthetic look.",
    image: IMAGES.b,
  },
];

export default function Services() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState({}); 

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => {
      const categoryOk = activeCategory === "All" ? true : s.category === activeCategory;
      if (!q) return categoryOk;

      const text = `${s.name} ${s.desc} ${s.category}`.toLowerCase();
      return categoryOk && text.includes(q);
    });
  }, [query, activeCategory]);

  const favorites = useMemo(() => filtered.filter((x) => !!liked[x.id]), [filtered, liked]);
  const nonFavorites = useMemo(() => filtered.filter((x) => !liked[x.id]), [filtered, liked]);

  const listData = useMemo(() => {
    const out = [];
    if (favorites.length > 0) {
      out.push({ type: "title", id: "t-fav", label: "Favorites" });
      favorites.forEach((x) => out.push({ type: "card", id: `fav-${x.id}`, item: x }));
    }
    out.push({ type: "title", id: "t-all", label: "All Services" });
    nonFavorites.forEach((x) => out.push({ type: "card", id: `all-${x.id}`, item: x }));
    return out;
  }, [favorites, nonFavorites]);

  const onBookNow = (service) => {
    router.push({
      pathname: "/booking",
      params: { serviceName: service.name, category: service.category },
    });
  };

  const renderRow = ({ item, index }) => {
    if (item.type === "title") {
      return <Text style={[styles.sectionTitle, index === 0 && { marginTop: 0 }]}>{item.label}</Text>;
    }

    const svc = item.item;
    const isLiked = !!liked[svc.id];

    return (
      <View style={styles.card}>
        
        <Image
          source={svc.image}
          style={styles.cardImg}
          resizeMode="cover"
          pointerEvents="none"
        />

        <View style={styles.cardBody}>
        
          <Pressable
            style={styles.heartBtn}
            hitSlop={12}
            onPress={() => setLiked((p) => ({ ...p, [svc.id]: !p[svc.id] }))}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={18}
              color={colors.primary}
            />
          </Pressable>

          <Text style={styles.cardName} numberOfLines={1}>
            {svc.name}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {svc.category}
          </Text>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {svc.desc}
          </Text>

          <Pressable style={styles.bookBtn} onPress={() => onBookNow(svc)}>
            <Text style={styles.bookText}>BOOK NOW</Text>
          </Pressable>
        </View>
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
          <Text style={styles.headerTitle}>Services</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={18} color={colors.primary} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
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
        ListEmptyComponent={<Text style={styles.emptyText}>No services found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 18, paddingHorizontal: 16 },
  fixedTop: { backgroundColor: "#fff", paddingBottom: 6 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 18 },
  backBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: colors.primary },

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
  searchInput: { flex: 1, marginRight: 8, fontSize: 13, color: "#333" },

  chipsRow: { paddingTop: 12, paddingBottom: 6, gap: 10 },
  chip: {
    width: 140,
    height: 32,
    borderRadius: 18,
    backgroundColor: "rgba(240, 120, 160, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 11, fontWeight: "800", color: colors.primary },
  chipTextActive: { color: "#fff" },

  listContent: { paddingTop: 10, paddingBottom: 28, gap: 12 },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  card: {
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(240, 120, 160, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  cardImg: { width: 96, height: "100%", backgroundColor: "rgba(0,0,0,0.06)" },

  cardBody: { flex: 1, padding: 12, position: "relative", minHeight: 110 },


  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
    zIndex: 999,
    elevation: 10,
  },

  cardName: { fontSize: 13, fontWeight: "900", color: "#B14B66", paddingRight: 40 },
  cardSub: { marginTop: 2, fontSize: 11, fontWeight: "800", color: "#666", paddingRight: 40 },
  cardDesc: { marginTop: 6, fontSize: 11, color: "#777", lineHeight: 16, paddingRight: 40 },

  bookBtn: { alignSelf: "flex-end", marginTop: 10, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.65)" },
  bookText: { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 0.6 },

  emptyText: { marginTop: 18, textAlign: "center", color: "#888", fontWeight: "700" },
});