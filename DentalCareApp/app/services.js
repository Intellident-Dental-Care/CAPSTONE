// app/services.js
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "./theme/colors";
import { supabase } from "../server/supabaseService";

const DEFAULT_DESCRIPTION =
  "This dental service helps improve your oral health and supports proper treatment planning based on your needs.";

// Cache system for services (5 minutes TTL)
let servicesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  return servicesCache && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

export default function Services() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Load bookmarks from device storage on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadBookmarks();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem("service_bookmarks");
      if (stored && isMountedRef.current) {
        const parsed = JSON.parse(stored);
        setLiked(parsed);
        console.log("Loaded service bookmarks from device");
      }
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    }
  };

  const saveBookmarks = async (newLiked) => {
    try {
      await AsyncStorage.setItem("service_bookmarks", JSON.stringify(newLiked));
      console.log("Saved service bookmarks to device");
    } catch (err) {
      console.error("Error saving bookmarks:", err);
    }
  };

  const fetchServices = async (forceRefresh = false) => {
    // Skip if cache is still valid and not forced
    if (!forceRefresh && isCacheValid()) {
      console.log("Using cached services data");
      if (!isMountedRef.current) return;
      setServices(servicesCache);
      setLoading(false);
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setLoading(true);

      console.log("Fetching fresh services data...");

      const { data, error } = await supabase
        .from("dental_services")
        .select("id, name, category, subcategory, price_display")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((s) => ({
        id: s.id,
        category: s.category || "General",
        name: s.name,
        price: s.price_display || "Price not available",
        description: DEFAULT_DESCRIPTION,
      }));

      console.log("Fetched services:", mapped.length);

      // Cache results
      servicesCache = mapped;
      cacheTimestamp = Date.now();

      if (!isMountedRef.current) return;
      setServices(mapped);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchServices();
  }, []);

  // Smart refresh on focus - only refresh if cache is stale
  useFocusEffect(
    React.useCallback(() => {
      if (servicesCache && isCacheValid()) {
        console.log("Cache valid, using cached services");
        if (isMountedRef.current) {
          setServices(servicesCache);
        }
      } else if (servicesCache === null) {
        console.log("First load services");
      } else {
        console.log("Cache expired, fetching fresh services");
        fetchServices(false);
      }
    }, [])
  );

  const categories = useMemo(() => {
    const cats = [...new Set(services.map((s) => s.category))];
    return ["All", ...cats];
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return services.filter((s) => {
      const categoryOk =
        activeCategory === "All" ? true : s.category === activeCategory;

      if (!q) return categoryOk;

      const text = `${s.name} ${s.category} ${s.price} ${s.description}`.toLowerCase();
      return categoryOk && text.includes(q);
    });
  }, [query, activeCategory, services]);

  // Avoid duplicate bookmarked items by using a Set
  const favorites = useMemo(() => {
    const seen = new Set();
    return filtered.filter((x) => {
      if (!!liked[x.id] && !seen.has(x.id)) {
        seen.add(x.id);
        return true;
      }
      return false;
    });
  }, [filtered, liked]);

  // Avoid duplicate non-bookmarked items by using a Set
  const nonFavorites = useMemo(() => {
    const seenFav = new Set(Object.keys(liked).filter((k) => liked[k]));
    const seen = new Set();
    return filtered.filter((x) => {
      if (!seenFav.has(x.id) && !seen.has(x.id)) {
        seen.add(x.id);
        return true;
      }
      return false;
    });
  }, [filtered, liked]);

  const listData = useMemo(() => {
    const out = [];

    if (favorites.length > 0) {
      out.push({ type: "title", id: "t-fav", label: "Favorites" });
      favorites.forEach((x) =>
        out.push({ type: "card", id: `fav-${x.id}`, item: x })
      );
    }

    out.push({ type: "title", id: "t-all", label: "All Services" });

    nonFavorites.forEach((x) =>
      out.push({ type: "card", id: `all-${x.id}`, item: x })
    );

    return out;
  }, [favorites, nonFavorites]);

  const onBookNow = (service) => {
    router.push({
      pathname: "/booking",
      params: {
        service: service.name,
        category: service.category,
      },
    });
  };

  const handleToggleLike = async (serviceId) => {
    const newLiked = { ...liked, [serviceId]: !liked[serviceId] };
    setLiked(newLiked);
    await saveBookmarks(newLiked);
  };

  const renderRow = ({ item, index }) => {
    if (item.type === "title") {
      return (
        <Text style={[styles.sectionTitle, index === 0 && { marginTop: 0 }]}>
          {item.label}
        </Text>
      );
    }

    const svc = item.item;
    const isLiked = !!liked[svc.id];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.serviceIcon}>
            <Ionicons name="medical-outline" size={24} color={colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={2}>
              {svc.name}
            </Text>

            <Text style={styles.cardCategory} numberOfLines={1}>
              {svc.category}
            </Text>
          </View>

          <Pressable
            style={styles.heartBtn}
            hitSlop={12}
            onPress={() => handleToggleLike(svc.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <Text style={styles.description}>{svc.description}</Text>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.priceLabel}>Starting Price</Text>
            <Text style={styles.priceText}>{svc.price}</Text>
          </View>

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

          <View style={{ width: 38 }} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services"
            placeholderTextColor="#B7B7B7"
            style={styles.searchInput}
          />

          <Ionicons name="search-outline" size={20} color={colors.primary} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => {
            const active = cat === activeCategory;

            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
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
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <Text style={styles.emptyText}>No services found.</Text>
          )
        }
      />
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

  chipsRow: {
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },

  chip: {
    minWidth: 110,
    maxWidth: 190,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  chipText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },

  chipTextActive: {
    color: "#FFFFFF",
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  cardName: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 20,
  },

  cardCategory: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
  },

  description: {
    marginTop: 12,
    fontSize: 11.5,
    color: "#777",
    lineHeight: 17,
    fontWeight: "600",
  },

  cardBottom: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  priceLabel: {
    fontSize: 10,
    color: "#999",
    fontWeight: "700",
  },

  priceText: {
    marginTop: 3,
    fontSize: 14,
    color: "#2F2F2F",
    fontWeight: "900",
  },

  bookBtn: {
    height: 34,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  bookText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },

  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#888",
    fontWeight: "700",
  },
});