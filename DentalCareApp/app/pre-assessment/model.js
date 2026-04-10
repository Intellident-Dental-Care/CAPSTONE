import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { colors } from "../theme/colors";
import { usePreAssessment } from "./_layout";

export default function Model() {
  const router = useRouter();
  const { state, dispatch } = usePreAssessment();

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "TOOTH_SELECTED") {
        dispatch({ type: "SET_TOOTH", payload: data.tooth });
      } else if (data.type === "SELECTION_CLEARED") {
        dispatch({ type: "SET_TOOTH", payload: "Not specified" });
      }
    } catch (e) {}
  };

  const injectedJS = `
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type) {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    true;
  `;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      <Text style={styles.h1}>Pre Assessment</Text>
      <Text style={styles.h2}>
        Select the affected tooth to begin{"\n"}your personalized dental assessment.
      </Text>

      <View style={styles.modelBox}>
        <WebView
          source={{ uri: "https://intellident-3d-viewer.vercel.app/" }}
          style={styles.webview}
          scrollEnabled={false}
          injectedJavaScript={injectedJS}
          onMessage={handleWebViewMessage}
          containerStyle={{ backgroundColor: 'transparent' }}
        />
      </View>

      <Text style={styles.toothText}>Tooth: {state.tooth}</Text>

      <Pressable style={styles.nextBtn} onPress={() => router.push("/pre-assessment/questions")}>
        <Text style={styles.nextText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 46, paddingHorizontal: 18 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  h1: { marginTop: 12, textAlign: "center", fontSize: 20, fontWeight: "900", color: colors.primary },
  h2: { marginTop: 10, textAlign: "center", fontSize: 11, color: colors.textGray, lineHeight: 16 },

  modelBox: {
    height: 300,
    width: "90%",
    borderRadius: 40,
    overflow: "hidden", // Ensures the webview respects the border radius
    alignContent: "center",
    marginTop: 60,
    marginBottom: 10,
    marginHorizontal: 20,
    backgroundColor: "transparent",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },

  toothText: { position: "absolute", left: 50, bottom: 65, fontSize: 12, color: colors.textGray },

  nextBtn: {
    position: "absolute",
    right: 24,
    bottom: 50,
    width: 110,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});