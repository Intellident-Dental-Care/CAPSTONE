import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { getSession, logoutUser } from "../storage/authStorage";

export default function Profile() {
  const router = useRouter();

  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("user@email.com");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session?.fullName) setFullName(session.fullName);
      if (session?.email) setEmail(session.email);
    })();
  }, []);

  const Row = ({ icon, label, onPress }) => (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.rowText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textGray} />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.topRight}>
          <Pressable style={styles.notifPill}>
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          </Pressable>

          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Profile</Text>

      {/* User card */}
      <View style={styles.userRow}>
        <View style={styles.avatarBig}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <Row icon="person-outline" label="My Profile" onPress={() => router.push("/profile/my-profile")} />
        <Row icon="settings-outline" label="Settings" onPress={() => {}} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <Row icon="chatbubble-ellipses-outline" label="FAQ" onPress={() => {}} />
        <Row icon="information-circle-outline" label="About" onPress={() => {}} />

        <Pressable
          style={[styles.row, { marginTop: 14 }]}
          onPress={async () => {
            await logoutUser();
            router.replace("/get-started");
          }}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={18} color={colors.primary} />
            <Text style={styles.rowText}>Sign Out</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifPill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { marginTop: 10, fontSize: 26, fontWeight: "900", color: colors.primary },

  userRow: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { fontSize: 12, fontWeight: "900", color: colors.primary },
  userEmail: { marginTop: 2, fontSize: 10, color: colors.textGray },

  menu: { marginTop: 26 },
  row: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  rowText: { fontSize: 12, color: colors.textGray },
});
