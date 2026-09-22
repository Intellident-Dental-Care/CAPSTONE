import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";
import { supabase } from "../../server/supabaseService";
import {
  validateToothImage,
  startAnalysis,
  resetAnalysis,
} from "../../server/AIRecommendation/analysisManager";

export default function Photo() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const busy = isUploading || isValidating;

  const folderId = useMemo(() => Math.random().toString(36).substring(2, 10), []);

  const currentUris = Array.isArray(state.photoUri) ? state.photoUri : (state.photoUri ? [state.photoUri] : []);
  const currentRemoteUrls = state.remotePhotoUris || [];

  const pickImage = async (useCamera = false) => {
    let result;

    const pickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: !useCamera,
    };

    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(pickerOptions);
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    }

    if (result.canceled) return;

    // Validate each picked photo is actually a tooth before uploading it
    setIsValidating(true);
    const acceptedAssets = [];
    let rejectedCount = 0;

    for (const asset of result.assets) {
      const validation = await validateToothImage(asset.uri);

      if (!validation.success) {
        Alert.alert("Couldn't verify photo", validation.error || "We couldn't check this photo right now. Please try again.");
        continue;
      }
      if (!validation.isTooth) {
        rejectedCount += 1;
        continue;
      }
      acceptedAssets.push(asset);
    }
    setIsValidating(false);

    if (rejectedCount > 0) {
      Alert.alert("That doesn't look like a tooth photo", "Please upload a clear photo of the affected tooth so we can proceed.");
    }
    if (acceptedAssets.length === 0) return; // nothing valid — user can't proceed

    setIsUploading(true);

    // Show accepted images immediately for fast UX
    const newLocalUris = acceptedAssets.map((a) => a.uri);
    const updatedUris = [...currentUris, ...newLocalUris];
    dispatch({ type: "SET_PHOTO", payload: updatedUris });

    // Upload accepted images to Supabase
    const newRemoteUrls = [];

    for (const asset of acceptedAssets) {
      try {
        const ext = asset.uri.split('.').pop() || 'jpg';
        const mimeType = ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `preassessment_${folderId}/img_${Date.now()}.${ext}`;

        const formData = new FormData();
        formData.append('file', { uri: asset.uri, name: fileName, type: mimeType });

        const { error } = await supabase.storage.from('patient-images').upload(fileName, formData);
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('patient-images').getPublicUrl(fileName);
        newRemoteUrls.push(publicUrlData.publicUrl);
      } catch (err) {
        console.error("Failed to upload image to Supabase:", err);
        Alert.alert("Upload Failed", "One of your images failed to upload. Please check your connection and try again.");
      }
    }

    dispatch({ type: "ADD_REMOTE_PHOTOS", payload: newRemoteUrls });
    setIsUploading(false);

    // Kick off AI analysis now, in the background, instead of waiting until ai-summary.js
    startAnalysis(updatedUris[0]);
  };

  const removeImage = (indexToRemove) => {
    const updatedUris = currentUris.filter((_, idx) => idx !== indexToRemove);
    const updatedRemotes = currentRemoteUrls.filter((_, idx) => idx !== indexToRemove);

    dispatch({ type: "SET_PHOTO", payload: updatedUris.length > 0 ? updatedUris : "" });
    dispatch({ type: "SET_REMOTE_PHOTOS", payload: updatedRemotes });

    // Keep background analysis in sync with the current primary photo
    if (updatedUris.length > 0) {
      startAnalysis(updatedUris[0]);
    } else {
      resetAnalysis();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Pre Assessment Questions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.progressLine, { width: "100%" }]} />
      </View>

      <Text style={styles.question}>Please upload a clear photo of the affected tooth.</Text>
      <Text style={styles.small}>
        This image will be used solely for your pre-assessment and will remain confidential.
      </Text>

      {currentUris.length > 0 ? (
        <View style={[styles.uploadBox, { padding: 10, flexDirection: 'row', alignItems: 'center' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
            {currentUris.map((uri, idx) => (
              <View key={idx} style={{ width: 100, height: 130, borderRadius: 12 }}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />

                <Pressable
                  onPress={() => removeImage(idx)}
                  style={{ position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 12 }}
                  disabled={busy}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => pickImage(false)}
              disabled={busy}
              style={{ width: 100, height: 130, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
            >
              {busy ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="add" size={28} color={colors.primary} />}
            </Pressable>
          </ScrollView>
        </View>
      ) : (
        <Pressable style={styles.uploadBox} onPress={() => pickImage(false)} disabled={busy}>
          {busy ? (
            <>
              <ActivityIndicator color={colors.primary} />
              {isValidating && <Text style={{ marginTop: 8, fontSize: 10, color: colors.textGray }}>Checking photo...</Text>}
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={22} color={colors.textGray} />
              <Text style={{ marginTop: 8, fontSize: 10, color: colors.textGray }}>Select a file</Text>
            </>
          )}
        </Pressable>
      )}

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={styles.cameraBtn} onPress={() => pickImage(true)} disabled={busy}>
        <Ionicons name="camera-outline" size={14} color="#fff" />
        <Text style={styles.cameraText}>Open Camera and Take a photo</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        <Pressable
          style={[styles.btnFilled, (currentUris.length === 0 || busy) && { opacity: 0.5 }]}
          onPress={() => currentUris.length > 0 && !busy && router.push("/pre-assessment/questions")}
          disabled={currentUris.length === 0 || busy}
        >
          <Text style={styles.btnFilledText}>
            {isValidating ? "Checking..." : isUploading ? "Uploading..." : "Next"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>Upload Photo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingHorizontal: 18,
  },
  backIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  headerSpacer: {
    width: 36,
  },

  topTitle: {
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "600",
    textAlign: "center",
  },

  progressRow: { marginTop: 18, marginBottom: 10, height: 3, backgroundColor: "#EAD7E0", borderRadius: 3, overflow: "hidden" },
  progressLine: { height: 3, backgroundColor: colors.primary },

  question: {
    marginTop: 28,
    marginBottom: 20,
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
    width: "95%",
    lineHeight: 38,
  },
  small: { marginTop: 10, fontSize: 11, color: colors.textGray, width: "85%", lineHeight: 16 },

  uploadBox: {
    marginTop: 18,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  orRow: { marginTop: 30, flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: "#EAD7E0" },
  orText: { fontSize: 10, color: colors.textGray },

  cameraBtn: {
    marginTop: 28,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  cameraText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  bottomRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 45,
    flexDirection: "row",
    gap: 12,
  },
  btnOutline: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  btnOutlineText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  btnFilled: { flex: 1, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  btnFilledText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  footerText: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    fontSize: 10,
    color: colors.textGray,
  },
});