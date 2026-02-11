import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { getSession, updateProfile } from "../storage/authStorage"; // if you don't have updateProfile yet, see note below

export default function MyProfile() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("1 January 2004");
  const [gender, setGender] = useState("Female");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session?.fullName) setFullName(session.fullName);
      if (session?.email) setEmail(session.email);
      if (session?.mobile) setMobile(session.mobile);
      if (session?.dob) setDob(session.dob);
      if (session?.gender) setGender(session.gender);
    })();
  }, []);

  const onSave = async () => {
    if (updateProfile) {
      await updateProfile({
        fullName,
        email,
        mobile,
        dob,
        gender,
      });
    }
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {/* ✅ replace with your real photo later */}
            <Image
              source={require("../../assets/profile_sample.jpg")}
              style={styles.avatarImg}
            />
          </View>

          {/* <View style={styles.cameraBadge}>
            <Ionicons name="camera-outline" size={14} color={colors.textGray} />
          </View> */}
        </View>

        {/* Basic Detail */}
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
        <View style={styles.selectBox}>
          <Text style={styles.selectText}>{dob}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textGray} />
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>Gender</Text>
        <View style={styles.selectBox}>
          <Text style={styles.selectText}>{gender}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textGray} />
        </View>

        {/* Contact Detail */}
        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Contact Detail</Text>

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
          onChangeText={setEmail}
          placeholder="email@gmail.com"
          placeholderTextColor={colors.textGray}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Save */}
        <Pressable style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 46 },
  scroll: { paddingHorizontal: 26, paddingBottom: 30 },

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

  avatarWrap: { marginTop: 8, alignItems: "center", justifyContent: "center" },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DDD",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },

  cameraBadge: {
    position: "absolute",
    right: 115 / 2 - 10,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },

  sectionTitle: { marginTop: 20, fontSize: 12, fontWeight: "900", color: "#777" },
  label: { marginTop: 12, fontSize: 10, color: colors.textGray, fontWeight: "700" },

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

  selectBox: {
    marginTop: 6,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  selectText: { fontSize: 12, color: colors.textGray },

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
  saveText: { color: "#fff", fontSize: 13, fontWeight: "900" },
});
