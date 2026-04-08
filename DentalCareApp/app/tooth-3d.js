// app/tooth-3d.js
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // NEW IMPORT

import { getSession } from "./_storage/authStorage"; 
import { getServerUrl } from "../server/getClientSideUrl"; 
import { colors } from "./theme/colors";

export default function Tooth3D() {
  const router = useRouter();
  
  const [timelineData, setTimelineData] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // CHANGED: useFocusEffect runs EVERY time the screen is opened
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchTimeline = async () => {
        try {
          const sessionData = await getSession();
          const userId = sessionData?.user?.id || "";
          const token = sessionData?.session?.access_token || ""; 
          
          if (!userId) return;

          const CACHE_KEY = `@dc_timeline_cache_${userId}`;

          // 1. FAST LOAD: Display cached data instantly
          try {
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            if (cachedData && isMounted) {
              setTimelineData(JSON.parse(cachedData));
              setIsLoading(false); 
            }
          } catch (cacheError) {
            console.log("Cache read error:", cacheError);
          }

          // 2. BACKGROUND REFRESH: Silently check server for new data
          const baseUrl = await getServerUrl(); 
          const API_URL = `${baseUrl}/api/3d-timeline?userId=${userId}`; 

          const response = await fetch(API_URL, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, 
            },
          });

          const result = await response.json();
          
          if (result.success && isMounted) {
            // Update state with fresh data
            setTimelineData(result.data);
            // Save fresh data to cache for next time
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result.data));
          }
        } catch (error) {
          console.error("Failed to fetch fresh timeline:", error);
        } finally {
          if (isMounted) setIsLoading(false); 
        }
      };

      fetchTimeline();

      // Cleanup function to prevent memory leaks if screen closes while fetching
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const filteredTimeline = selectedTooth
    ? timelineData.filter((item) => item.tooth && item.tooth.includes(selectedTooth))
    : timelineData;

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "TOOTH_SELECTED") {
        setSelectedTooth(data.tooth);
      } else if (data.type === "SELECTION_CLEARED") {
        setSelectedTooth(null);
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const injectedJS = `
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type) {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    true;
  `;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={styles.title}>Tooth 3D Model</Text>
      <Text style={styles.subTitle}>
        Select a tooth to review its complete dental record, including previous treatments and assessments.
      </Text>

      {/* 3D Model WebView */}
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: "https://intellident-3d-viewer.vercel.app/" }}
          style={styles.webview}
          scrollEnabled={false}
          injectedJavaScript={injectedJS}
          onMessage={handleWebViewMessage}
          containerStyle={{ backgroundColor: 'transparent' }}
        />
      </View>

      {/* Locked Section Title */}
      <Text style={styles.section}>
        Dental Record Timeline
      </Text>

      {/* Timeline List */}
      <View style={styles.summaryBox}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : filteredTimeline.length > 0 ? (
          filteredTimeline.map((item, i) => (
            <View key={item.id || i} style={styles.timeRow}>
              {/* Left rail */}
              <View style={styles.timeRail}>
                <View style={styles.timeDot} />
                {i !== filteredTimeline.length - 1 && <View style={styles.timeLine} />}
              </View>

              {/* Content */}
              <View style={styles.timeContent}>
                <Text style={styles.timeDate}>
                  {item.date} – <Text style={styles.timeTitle}>{item.title}</Text>
                </Text>
                <Text style={styles.timeDetails}>{item.details}</Text>
                <Text style={styles.timeDoctor}>Performed by: {item.doctor}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {selectedTooth 
              ? `No procedure history found for ${selectedTooth}.` 
              : "No procedure history found."}
          </Text>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 13,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },
  subTitle: {
    marginTop: 8,
    fontSize: 12,
    color: "#9aa0a6",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  webviewContainer: {
    width: "100%",
    height: 320, 
    marginTop: 18,
    borderRadius: 12,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  section: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "900",
    color: colors.textGray ?? "#666",
    textTransform: "uppercase",
  },
  summaryBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
  },
  timeRail: {
    width: 16,
    alignItems: "center",
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    marginTop: 6,
    borderRadius: 99,
  },
  timeContent: {
    flex: 1,
  },
  timeDate: {
    fontSize: 11,
    color: "#777",
    fontWeight: "900",
    lineHeight: 16,
  },
  timeTitle: {
    color: colors.primary,
    fontWeight: "900",
  },
  timeDetails: {
    marginTop: 4,
    fontSize: 11,
    color: "#999",
    lineHeight: 16,
  },
  timeDoctor: {
    marginTop: 4,
    fontSize: 10,
    color: "#888",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
    fontSize: 12,
  }
});