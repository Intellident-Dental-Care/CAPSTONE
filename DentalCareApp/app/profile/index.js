import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme/colors";
import {
  getActiveProfile,
  getProfilesForCurrentAccount,
  logoutUser,
  switchActiveProfile,
} from "../storage/authStorage";
import ProfileSwitcherModal from "../components/ProfileSwitcherModal";

export default function Profile() {
  const router = useRouter();

  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("user@email.com");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const loadProfiles = async () => {
    const active = await getActiveProfile();
    const allProfiles = await getProfilesForCurrentAccount();

    setSelectedProfile(active);
    setProfiles(allProfiles);
    setFullName(active?.fullName || "User");
    setEmail(active?.email || "user@email.com");
  };

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [])
  );

  const handleSelectProfile = async (profile) => {
    await switchActiveProfile(profile.id);
    await loadProfiles();
  };

  const handleAddProfile = () => {
    setProfileModalVisible(false);
    router.push("/patient-first-setup?mode=add-profile");
  };

  const handleLogout = async () => {
    setProfileModalVisible(false);
    await logoutUser();
    router.replace("/get-started");
  };

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
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.topRight}>
          <Pressable
            style={styles.notifPill}
            onPress={() => router.push("/notification")}
          >
            <Ionicons
              name="notifications-outline"
              size={16}
              color={colors.primary}
            />
          </Pressable>

          <Pressable
            style={styles.avatarSmall}
            onPress={() => setProfileModalVisible(true)}
          >
            <Ionicons name="person" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>Profile</Text>

      <View style={styles.userRow}>
        <View style={styles.avatarBig}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <Row
          icon="person-outline"
          label="My Profile"
          onPress={() => router.push("/profile/my-profile")}
        />
        <Row icon="settings-outline" label="Settings" onPress={() => {}} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <Row icon="chatbubble-ellipses-outline" label="FAQ" onPress={() => {}} />
        <Row icon="information-circle-outline" label="About" onPress={() => {}} />
      </View>

      <ProfileSwitcherModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
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

  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

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

  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
  },

  userRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },

  userEmail: {
    marginTop: 2,
    fontSize: 10,
    color: colors.textGray,
  },

  menu: {
    marginTop: 26,
  },

  row: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  rowText: {
    fontSize: 12,
    color: colors.textGray,
  },
});