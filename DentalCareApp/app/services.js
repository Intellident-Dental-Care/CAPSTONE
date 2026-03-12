// app/services.js
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import { supabase } from "../server/supabaseService";

// ✅ images based on your folder structure
const IMAGES = [
  require("../assets/landing1.jpg"),
  require("../assets/landing2.jpg"),
  require("../assets/landing3.jpg"),
];

export default function Services() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('dental_services')
          .select('id, name, category, subcategory, price_display')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (error) throw error;
        setServices(
          (data || []).map((s, i) => ({
            id: s.id,
            category: s.category,
            name: s.name,
            desc: s.price_display || s.category,
            image: IMAGES[i % IMAGES.length],
          }))
        );
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(services.map((s) => s.category))];
    return ['All', ...cats];
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const categoryOk = activeCategory === "All" ? true : s.category === activeCategory;
      if (!q) return categoryOk;

      const text = `${s.name} ${s.desc} ${s.category}`.toLowerCase();
      return categoryOk && text.includes(q);
    });
  }, [query, activeCategory, services]);

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
          {categories.map((cat) => {
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
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>No services found.</Text>
          )
        }
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
