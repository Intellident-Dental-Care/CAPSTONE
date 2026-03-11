import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";

const notificationData = [
  {
    id: 1,
    title: "Appointment Confirmed",
    message: "Your dental check-up appointment has been confirmed.",
    time: "2 mins ago",
    type: "success",
  },
  {
    id: 2,
    title: "New Reminder",
    message: "You have an upcoming tooth cleaning appointment tomorrow.",
    time: "10 mins ago",
    type: "reminder",
  },
  {
    id: 3,
    title: "Treatment Update",
    message: "Your braces treatment status is now marked as InProgress.",
    time: "1 hour ago",
    type: "update",
  },
  {
    id: 4,
    title: "Payment Received",
    message: "Your recent payment for cosmetic whitening was received.",
    time: "3 hours ago",
    type: "success",
  },
  {
    id: 5,
    title: "Clinic Announcement",
    message: "The clinic will open at 9:00 AM tomorrow.",
    time: "Yesterday",
    type: "info",
  },
];

export default function Notification() {
  const router = useRouter();

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
          {notificationData.map((item) => (
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
    backgroundColor: "#F8F8F8",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingTop: 46,
    paddingHorizontal: 18,
  },

  topBar: {
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

  title: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
  },

  scrollContent: {
    paddingBottom: 30,
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