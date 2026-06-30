import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { supabase } from "../../server/supabaseService";
import {
  getSession,
  getProfilesByEmail,
  getActiveProfileByEmail,
  setActiveProfileByEmail,
  ensureDefaultProfileForEmail,
  addProfileToEmail,
  logoutUser,
} from "../_storage/authStorage";
import {
  profileIndexCache,
  myProfileCache,
  clearAllProfileCaches,
} from "../_storage/profileCache";
import ProfileSwitcherModal from "../components/ProfileSwitcherModal";
import { getSignedProfileAvatarUrl } from "../../server/UserProfile/profileImageService";

export default function Profile() {
  const router = useRouter();

  // Initialise from cache so revisits render real data with zero async work
  const [fullName, setFullName] = useState(profileIndexCache.fullName);
  const [email, setEmail] = useState(profileIndexCache.email);
  const [profiles, setProfiles] = useState(profileIndexCache.profiles);
  const [selectedProfile, setSelectedProfile] = useState(profileIndexCache.selectedProfile);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState(profileIndexCache.loggedInEmail);
  const [avatarUrl, setAvatarUrl] = useState("");

  const loadProfiles = async (force = false) => {
    // Skip the full fetch only if cached data is complete.
    // If email is missing, refresh so the subtitle under the name can be shown.
    if (profileIndexCache.loaded && profileIndexCache.email?.trim() && !force) return;

    try {
      const session = await getSession();
      // Support both local and provider sessions.
      const accountEmail = (
        session?.user?.email ||
        session?.session?.user?.email ||
        session?.email ||
        ""
      )
        .trim()
        .toLowerCase();

      setLoggedInEmail(accountEmail);

      if (!accountEmail) {
        setSelectedProfile(null);
        setProfiles([]);
        setFullName("");
        setEmail("");
        return;
      }

      const setup = await ensureDefaultProfileForEmail(
        accountEmail,
        session?.fullName || ""
      );

      let activeProfile = setup?.activeProfile;
      let allProfiles = setup?.profiles || [];

      if (!activeProfile) {
        activeProfile = await getActiveProfileByEmail(accountEmail);
      }

      if (!allProfiles.length) {
        allProfiles = await getProfilesByEmail(accountEmail);
      }

      // --- Fast path: show local data immediately ---
      let displayName = activeProfile?.name || session?.fullName || "";
      let displayEmail = accountEmail;

      setSelectedProfile(activeProfile || null);
      setProfiles(allProfiles || []);
      setFullName(displayName);
      setEmail(displayEmail);

      // Update cache with local data so next visit is instant
      Object.assign(profileIndexCache, {
        loaded: true,
        fullName: displayName,
        email: displayEmail,
        profiles: allProfiles || [],
        selectedProfile: activeProfile || null,
        loggedInEmail: accountEmail,
      });

      // --- Background: sync fresh name/email from Supabase ---
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser?.id) {
          const { data: userRow } = await supabase
            .from("users")
            .select("full_name, email")
            .eq("id", supabaseUser.id)
            .single();
          if (userRow) {
            const supaName = activeProfile?.name || userRow.full_name || displayName;
            const supaEmail = userRow.email || displayEmail;
            if (supaName !== displayName || supaEmail !== displayEmail) {
              setFullName(supaName);
              setEmail(supaEmail);
              profileIndexCache.fullName = supaName;
              profileIndexCache.email = supaEmail;
            }
          }
        }
      } catch (_) {
        // Supabase unavailable — local data already shown
      }
    } catch (error) {
      console.log("loadProfiles error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // loadProfiles skips internally when cache is already populated
      loadProfiles();
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const avatarRef = selectedProfile?.avatarUrl || "";
      if (!avatarRef) {
        if (isMounted) setAvatarUrl("");
        return;
      }

      try {
        const signedUrl = await getSignedProfileAvatarUrl(avatarRef);
        if (isMounted) setAvatarUrl(signedUrl || avatarRef);
      } catch (_) {
        if (isMounted) setAvatarUrl(avatarRef);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedProfile?.avatarUrl]);

  const handleSelectProfile = async (profile) => {
    try {
      if (!loggedInEmail || !profile) return;

      await setActiveProfileByEmail(loggedInEmail, profile);
      setSelectedProfile(profile);
      setFullName(profile?.name || "");
      setEmail(loggedInEmail || profileIndexCache.email || "");
      setProfileModalVisible(false);

      // Update index cache and invalidate my-profile cache so it reloads for the new profile
      profileIndexCache.selectedProfile = profile;
      profileIndexCache.fullName = profile?.name || "";
      profileIndexCache.email = loggedInEmail || profileIndexCache.email || "";
      myProfileCache.loaded = false;
    } catch (error) {
      console.log("handleSelectProfile error:", error);
    }
  };

  const handleAddProfile = async (profileName) => {
    try {
      if (!loggedInEmail || !profileName?.trim()) return;

      const result = await addProfileToEmail(loggedInEmail, profileName);

      if (!result.success) {
        Alert.alert(
          "Unable to add profile",
          result.message || "Please try again."
        );
        return;
      }

      if (result.profile) {
        await setActiveProfileByEmail(loggedInEmail, result.profile);
        setSelectedProfile(result.profile);
        setFullName(result.profile.name || "");
        setEmail(loggedInEmail || profileIndexCache.email || "");
        setProfileModalVisible(false);
        // Invalidate caches so both screens reload for the new profile
        profileIndexCache.loaded = false;
        myProfileCache.loaded = false;
        router.push("/patient-first-setup");
        return;
      }

      // Force reload so new profile appears in the list
      await loadProfiles(true);
    } catch (error) {
      console.log("handleAddProfile error:", error);
      Alert.alert("Error", "Failed to add profile.");
    }
  };

  const handleLogout = async () => {
    try {
      setProfileModalVisible(false);
      clearAllProfileCaches();
      await logoutUser();
      router.replace("/get-started");
    } catch (error) {
      console.log("handleLogout error:", error);
    }
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
              size={18}
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
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={18} color={colors.primary} />
          )}
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

        <Row
          icon="document-text-outline"
          label="Terms and Conditions"
          onPress={() => router.push("/profile/terms-and-conditions")}
        />

        <Row
          icon="chatbubble-ellipses-outline"
          label="FAQ"
          onPress={() => router.push("/profile/faq")}
        />

        <Row
          icon="information-circle-outline"
          label="About"
          onPress={() => router.push("/profile/about")}
        />

        <Row
          icon="log-out-outline"
          label="Logout"
          onPress={handleLogout}
        />
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
    paddingTop: 8,
    paddingHorizontal: 18,
  },

  topBar: {
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

  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notifPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
  },

  userRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarBig: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },

  userName: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.primary,
  },

  userEmail: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "600",
  },

  menu: {
    marginTop: 28,
  },

  row: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  rowText: {
    fontSize: 13,
    color: colors.textGray,
    fontWeight: "700",
  },
});