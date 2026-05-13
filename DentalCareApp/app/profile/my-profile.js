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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeMobile(value) {
  return String(value || "").replace(/[^0-9]/g, "").replace(/^63/, "").slice(0, 10);
}

export default function MyProfile() {
  const router = useRouter();

  const [profileId, setProfileId] = useState(myProfileCache.profileId);
  const [accountEmail, setAccountEmail] = useState(myProfileCache.accountEmail);
  const [fullName, setFullName] = useState(myProfileCache.fullName);
  const [dob, setDob] = useState(myProfileCache.dob);
  const [mobile, setMobile] = useState(normalizeMobile(myProfileCache.mobile));
  const [email, setEmail] = useState(myProfileCache.email);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const age = useMemo(() => calculateAge(dob), [dob]);

  useEffect(() => {
    if (myProfileCache.loaded) return;

    (async () => {
      const session = await getSession();
      const activeProfile = await getCurrentActiveProfileForSession();

      const sessionEmail = (session?.user?.email || "").trim().toLowerCase();

      if (!sessionEmail || !activeProfile?.id) return;

      setAccountEmail(sessionEmail);
      setProfileId(activeProfile.id);
      setEmail(sessionEmail);

      let resolvedName = "";
      let resolvedEmail = sessionEmail;
      let resolvedDob = "";
      let resolvedMobile = "";

      try {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        if (supabaseUser?.id) {
          const { data: userRow } = await supabase
            .from("users")
            .select("full_name, email, dob, mobile")
            .eq("id", supabaseUser.id)
            .single();

          if (userRow) {
            resolvedName = userRow.full_name || activeProfile.name || "";
            resolvedEmail = userRow.email || sessionEmail;
            resolvedDob = userRow.dob || "";
            resolvedMobile = normalizeMobile(userRow.mobile || "");
          }
        }
      } catch (_) {}

      const patientProfile = await getPatientProfileByProfileId(activeProfile.id);

      if (patientProfile) {
        if (!resolvedName) resolvedName = patientProfile.fullName || activeProfile.name || "";
        if (!resolvedDob) resolvedDob = patientProfile.dob || "";
        if (!resolvedMobile) resolvedMobile = normalizeMobile(patientProfile.mobile || "");
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
      Alert.alert("Required", "Please select your date of birth.");
      return;
    }

    if (!mobile.trim() || mobile.length !== 10 || !mobile.startsWith("9")) {
      Alert.alert("Invalid Mobile Number", "Please enter a valid Philippine mobile number after +63.");
      return;
    }

    const fullMobile = `63${mobile}`;

    try {
      setLoading(true);

      const existingProfile = await getPatientProfileByProfileId(profileId);
      const medicalHistory = existingProfile?.medicalHistory || {};

      const result = await updatePatientProfileByProfileId(profileId, {
        fullName,
        dob,
        age,
        mobile: fullMobile,
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

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (!supabaseUser?.id) {
        setLoading(false);
        Alert.alert("Error", "No authenticated user found.");
        return;
      }

      const { error: usersUpdateError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          dob,
          mobile: fullMobile,
        })
        .eq("id", supabaseUser.id);

      if (usersUpdateError) {
        setLoading(false);
        Alert.alert("Error", usersUpdateError.message || "Failed to update users table.");
        return;
      }

      Object.assign(myProfileCache, {
        fullName,
        dob,
        mobile: fullMobile,
        email,
      });

      setLoading(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.fixedTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>

          <Text style={styles.headerTitle}>My Profile</Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={require("../../assets/profile_sample.jpg")}
              style={styles.avatarImg}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
        <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, !dob && { color: colors.textGray }]}>
            {dob || "Select date of birth"}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dob ? new Date(`${dob}T00:00:00`) : new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              if (Platform.OS !== "ios") setShowDatePicker(false);
              if (event?.type === "dismissed") return;
              if (selectedDate) setDob(formatDate(selectedDate));
            }}
          />
        )}

        <Text style={[styles.label, { marginTop: 14 }]}>Age</Text>
        <TextInput
          value={age}
          editable={false}
          placeholder="Auto generated"
          placeholderTextColor={colors.textGray}
          style={[styles.input, styles.disabledInput]}
        />

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Contact Detail</Text>

        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.mobileWrap}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+63</Text>
          </View>

          <TextInput
            value={mobile}
            onChangeText={(text) => setMobile(normalizeMobile(text))}
            placeholder="9XX XXX XXXX"
            placeholderTextColor={colors.textGray}
            style={styles.mobileInput}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

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

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Medical History</Text>

        <Pressable
          style={styles.medicalCard}
          onPress={() => router.push("/profile/medical-history")}
        >
          <View style={styles.medicalRow}>
            <View style={styles.medicalIconWrap}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.medicalText}>View Medical History</Text>
              <Text style={styles.medicalSubText}>
                See all answers from the patient form
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textGray} />
        </Pressable>

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={onSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>{loading ? "Saving..." : "Save"}</Text>
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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

  avatarWrap: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FFF1F6",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 2,
    fontSize: 12,
    fontWeight: "900",
    color: "#999",
    textTransform: "uppercase",
  },

  label: {
    marginTop: 14,
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "700",
  },

  input: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3D7E1",
    paddingHorizontal: 16,
    fontSize: 13,
    color: colors.textDark,
    backgroundColor: "#FFFFFF",
  },

  dateInput: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3D7E1",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: {
    fontSize: 13,
    color: colors.textDark,
    fontWeight: "600",
  },

  disabledInput: {
    backgroundColor: "#F8F8F8",
    color: colors.textGray,
  },

  mobileWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  countryCode: {
    width: 72,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFF1F6",
    borderWidth: 1,
    borderColor: "#F3D7E1",
    alignItems: "center",
    justifyContent: "center",
  },

  countryCodeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },

  mobileInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3D7E1",
    paddingHorizontal: 16,
    fontSize: 13,
    color: colors.textDark,
    backgroundColor: "#FFFFFF",
  },

  medicalCard: {
    marginTop: 12,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3D7E1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },

  medicalRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  medicalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF1F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  medicalText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textDark,
  },

  medicalSubText: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textGray,
  },

  saveBtn: {
    marginTop: 30,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
});