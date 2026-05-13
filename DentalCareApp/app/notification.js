import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../server/supabaseService";

function toRelativeTime(value) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));

  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function isMissingTableError(error) {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return String(error.message || "").toLowerCase().includes("does not exist");
}

export default function Notification() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notificationData, setNotificationData] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user?.id) {
        setNotificationData([]);
        return;
      }

      const { data, error } = await supabase
        .from("queue_delay_notifications")
        .select("id, message, delay_minutes, branch, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        if (!isMissingTableError(error)) {
          console.log("loadNotifications error:", error);
        }
        setNotificationData([]);
        return;
      }

      const mapped = (data || []).map((row) => ({
        id: row.id,
        title: "Queue Delay Update",
        message: row.message || `Queue delayed by ${row.delay_minutes || 0} minutes at ${row.branch || "your branch"}.`,
        time: toRelativeTime(row.created_at),
        type: "reminder",
      }));

      setNotificationData(mapped);
    } catch (error) {
      console.log("loadNotifications fatal error:", error);
      setNotificationData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "reminder":
        return "notifications";
      case "update":
        return "time";
      case "info":
        return "information-circle";
      default:
        return "notifications";
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "success":
        return "#DDF7E5";
      case "reminder":
        return "#FFE9F1";
      case "update":
        return "#EEE4FF";
      case "info":
        return "#E8F1FF";
      default:
        return "#F0F0F0";
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case "success":
        return "#2EBE63";
      case "reminder":
        return colors.primary;
      case "update":
        return "#8B5CF6";
      case "info":
        return "#3B82F6";
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

        </View>

        <Text style={styles.title}>Notifications</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : notificationData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={34}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Notifications Yet
              </Text>

              <Text style={styles.emptyText}>
                Updates about appointments, queue delays,
                and reminders will appear here.
              </Text>
            </View>
          ) : notificationData.map((item) => (
            <Pressable key={item.id} style={styles.card}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: getIconBg(item.type) },
                ]}
              >
                <Ionicons
                  name={getIcon(item.type)}
                  size={20}
                  color={getIconColor(item.type)}
                />
              </View>

              <View style={styles.textWrap}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>

                <Text style={styles.message}>{item.message}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 8,
    paddingHorizontal: 18,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
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

  title: {
    marginTop: 14,
    marginBottom: 18,
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
  },

  scrollContent: {
    paddingBottom: 100,
  },

  emptyWrap: {
    marginTop: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "900",
    color: "#333",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#8A8A93",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 35,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  textWrap: {
    flex: 1,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },

  time: {
    fontSize: 10,
    color: "#A0A0A0",
    marginTop: 2,
  },

  message: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: "#7A7A7A",
  },
});