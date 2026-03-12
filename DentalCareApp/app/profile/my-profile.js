import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { supabase } from "../../server/supabaseService";
import {
  getSession,
  getCurrentActiveProfileForSession,
  getPatientProfileByProfileId,
  updatePatientProfileByProfileId,
  updateProfileInAccount,
} from "../_storage/authStorage";
import { myProfileCache } from "../_storage/profileCache";

function calculateAge(dobValue) {
  if (!dobValue) return "";

  const birthDate = new Date(dobValue);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) return "";

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? String(age) : "";
}

export default function MyProfile() {
  const router = useRouter();

  // Initialise from cache so revisits render real data with zero async work
  const [profileId, setProfileId] = useState(myProfileCache.profileId);
  const [accountEmail, setAccountEmail] = useState(myProfileCache.accountEmail);
  const [fullName, setFullName] = useState(myProfileCache.fullName);
  const [dob, setDob] = useState(myProfileCache.dob);
  const [mobile, setMobile] = useState(myProfileCache.mobile);
  const [email, setEmail] = useState(myProfileCache.email);
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => calculateAge(dob), [dob]);

  useEffect(() => {
    // Skip fetch if cache is already populated (revisit or back-navigation)
    if (myProfileCache.loaded) return;

    (async () => {
      const session = await getSession();
      const activeProfile = await getCurrentActiveProfileForSession();

      // email is nested inside session.user
      const sessionEmail = (session?.user?.email || "").trim().toLowerCase();

      if (!sessionEmail || !activeProfile?.id) return;

      setAccountEmail(sessionEmail);
      setProfileId(activeProfile.id);
      setEmail(sessionEmail);

      let resolvedName = "";
      let resolvedEmail = sessionEmail;
      let resolvedDob = "";
      let resolvedMobile = "";

      // Try fetching fresh name/email from Supabase users table
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser?.id) {
          const { data: userRow } = await supabase
            .from("users")
            .select("full_name, email")
            .eq("id", supabaseUser.id)
            .single();
          if (userRow) {
            resolvedName = userRow.full_name || activeProfile.name || "";
            resolvedEmail = userRow.email || sessionEmail;
          }
        }
      } catch (_) {
        // Supabase unavailable — fall back to local data
      }

      // Load dob/mobile from local patient profile
      const patientProfile = await getPatientProfileByProfileId(activeProfile.id);
      if (patientProfile) {
        if (!resolvedName) resolvedName = patientProfile.fullName || activeProfile.name || "";
        resolvedDob = patientProfile.dob || "";
        resolvedMobile = patientProfile.mobile || "";
        if (!resolvedEmail || resolvedEmail === sessionEmail) {
          resolvedEmail = patientProfile.email || sessionEmail;
        }
      } else if (!resolvedName) {
        resolvedName = activeProfile.name || session?.fullName || "";
      }

      setFullName(resolvedName);
      setDob(resolvedDob);
      setMobile(resolvedMobile);
      setEmail(resolvedEmail);

      // Populate cache so the next visit is instant
      Object.assign(myProfileCache, {
        loaded: true,
        profileId: activeProfile.id,
        accountEmail: sessionEmail,
        fullName: resolvedName,
        dob: resolvedDob,
        mobile: resolvedMobile,
        email: resolvedEmail,
      });
    })();
  }, []);

  const onSave = async () => {
    if (!profileId) {
      Alert.alert("Error", "No active profile found.");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }

    if (!dob.trim()) {
      Alert.alert("Required", "Please enter your date of birth.");
      return;
    }

    if (!mobile.trim()) {
      Alert.alert("Required", "Please enter your mobile number.");
      return;
    }

    try {
      setLoading(true);

      const existingProfile = await getPatientProfileByProfileId(profileId);
      const medicalHistory = existingProfile?.medicalHistory || {};

      const result = await updatePatientProfileByProfileId(profileId, {
        fullName,
        dob,
        age,
        mobile,
        email,
        medicalHistory,
      });

      if (!result.success) {
        setLoading(false);
        Alert.alert("Error", result.message || "Failed to update profile.");
        return;
      }

      if (accountEmail) {
        await updateProfileInAccount(accountEmail, {
          id: profileId,
          name: fullName,
        });
      }

      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser?.id) {
          await supabase
            .from("users")
            .update({ full_name: fullName })
            .eq("id", supabaseUser.id);
        }
      } catch (_) {
        // Non-fatal — local save already succeeded
      }

      // Keep the cache in sync so the next visit reflects saved values
      Object.assign(myProfileCache, { fullName, dob, mobile, email });

      setLoading(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

          <Text style={styles.headerTitle}>My Profile</Text>

          <View style={{ width: 36 }} />
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={require("../../assets/profile_sample.jpg")}
              style={styles.avatarImg}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Basic Detail</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          placeholderTextColor={colors.textGray}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Date of Birth</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textGray}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Age</Text>
        <TextInput
          value={age}
          editable={false}
          placeholder="Auto generated"
          placeholderTextColor={colors.textGray}
          style={[styles.input, styles.disabledInput]}
        />

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>
          Contact Detail
        </Text>

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          placeholder="+63 9xx xxx xxxx"
          placeholderTextColor={colors.textGray}
          style={styles.input}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Email Address</Text>
        <TextInput
          value={email}
          editable={false}
          placeholder="email@gmail.com"
          placeholderTextColor={colors.textGray}
          style={[styles.input, styles.disabledInput]}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>
          Medical History
        </Text>

        <Pressable
          style={styles.medicalCard}
          onPress={() => router.push("/profile/medical-history")}
        >
          <View style={styles.medicalRow}>
            <View style={styles.medicalIconWrap}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            </View>

            <View>
              <Text style={styles.medicalText}>View Medical History</Text>
              <Text style={styles.medicalSubText}>
                See all answers from the patient form
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textGray}
          />
        </Pressable>

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={onSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
  },

  scroll: {
    paddingHorizontal: 26,
    paddingBottom: 30,
  },

  header: {
    height: 54,
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

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },

  avatarWrap: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DDD",
    overflow: "hidden",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  sectionTitle: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: "900",
    color: "#777",
    textTransform: "uppercase",
  },

  label: {
    marginTop: 12,
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "700",
  },

  input: {
    marginTop: 6,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    fontSize: 12,
    color: colors.textDark,
    backgroundColor: "#fff",
  },

  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: colors.textGray,
  },

  medicalCard: {
    marginTop: 10,
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },

  medicalRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  medicalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f3f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  medicalText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDark,
  },

  medicalSubText: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textGray,
  },

  saveBtn: {
    marginTop: 28,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  saveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
});