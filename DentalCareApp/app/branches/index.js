import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";

const BRANCHES = [
  {
    key: "molino",
    title: "GC Dental Care - Molino",
    description: "Molino, Bacoor, Cavite",
    latitude: 14.411954191470624,
    longitude: 120.97465944812357,
    
  },
  {
    key: "dasma",
    title: "GC Dental Care - Dasmariñas",
    description: "110 Sampaloc 1, Dasmariñas, Cavite",
    latitude: 14.298878201393642,
    longitude: 120.95493969551005,
  },
  {
    key: "gnetri",
    title: "GC Dental Care - General Trias",
    description: "Governor's Drive, General Trias, Cavite",
    latitude: 14.291470506437102,
    longitude: 120.90430479550989,
  },
];

export default function Branches() {
  const router = useRouter();

  const initialRegion = useMemo(() => {
    const lats = BRANCHES.map((b) => b.latitude);
    const lngs = BRANCHES.map((b) => b.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    const latitudeDelta = Math.max(0.18, (maxLat - minLat) + 0.12);
    const longitudeDelta = Math.max(0.18, (maxLng - minLng) + 0.12);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, []);

  return (
    <View style={styles.container}>
     
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>

     
      <Text style={styles.title}>GC Dental Branches</Text>
      <Text style={styles.subtitle}>
        Select a branch and tap the arrow below to{"\n"}view directions.
      </Text>

      
      <View style={styles.mapWrap}>
        <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
          {BRANCHES.map((b) => (
            <Marker
              key={b.key}
              coordinate={{ latitude: b.latitude, longitude: b.longitude }}
              title={b.title}
              description={b.description}
              pinColor={colors.primary}
            />
          ))}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 46,
    alignItems: "center",
  },

  backBtn: {
    position: "absolute",
    left: 14,
    top: 46,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textGray,
    textAlign: "center",
    lineHeight: 14,
  },

  
  mapWrap: {
    marginTop: 18,
    width: "86%",     
    height: "85%",    
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
  },
});
