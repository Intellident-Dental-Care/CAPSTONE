import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";

export default function Photo() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();

  // Safely converts the photo state into an array to support multiple images
  const currentUris = Array.isArray(state.photoUri) ? state.photoUri : (state.photoUri ? [state.photoUri] : []);

  // Handle camera and gallery image selection
  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsMultipleSelection: true, // Functionality added here
        quality: 0.8 
      });
    }

    if (!result.canceled) {
      // Append new images to the existing array
      const newUris = result.assets.map(a => a.uri);
      dispatch({ type: "SET_PHOTO", payload: [...currentUris, ...newUris] });
    }
  };

  // Functionality to remove an image
  const removeImage = (indexToRemove) => {
    const updatedUris = currentUris.filter((_, idx) => idx !== indexToRemove);
    dispatch({ type: "SET_PHOTO", payload: updatedUris.length > 0 ? updatedUris : "" });
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

      {/* Conditionally render multiple images INSIDE your exact uploadBox style */}
      {currentUris.length > 0 ? (
        <View style={[styles.uploadBox, { padding: 10, flexDirection: 'row', alignItems: 'center' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
            {currentUris.map((uri, idx) => (
              <View key={idx} style={{ width: 100, height: 130, borderRadius: 12 }}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                
                {/* Remove Marker (Inline styled so it doesn't touch your stylesheet) */}
                <Pressable 
                  onPress={() => removeImage(idx)}
                  style={{ position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 12 }}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </Pressable>
              </View>
            ))}
            
            {/* Add More Button */}
            <Pressable 
              onPress={() => pickImage(false)} 
              style={{ width: 100, height: 130, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={28} color={colors.primary} />
            </Pressable>
          </ScrollView>
        </View>
      ) : (
        <Pressable style={styles.uploadBox} onPress={() => pickImage(false)}>
          <Ionicons name="image-outline" size={22} color={colors.textGray} />
          <Text style={{ marginTop: 8, fontSize: 10, color: colors.textGray }}>Select a file</Text>
        </Pressable>
      )}

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={styles.cameraBtn} onPress={() => pickImage(true)}>
        <Ionicons name="camera-outline" size={14} color="#fff" />
        <Text style={styles.cameraText}>Open Camera and Take a photo</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Back</Text>
        </Pressable>

        <Pressable 
          style={[styles.btnFilled, currentUris.length === 0 && { opacity: 0.5 }]} 
          onPress={() => currentUris.length > 0 && router.push("/pre-assessment/questions")}
        >
          <Text style={styles.btnFilledText}>Next</Text>
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
  btnOutline: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
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