import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme/colors";
import { getSession, setOnboardingSeenForUser } from "./storage/authStorage";

const { width } = Dimensions.get("window");

const slides = [
  { id: "1", image: require("../assets/landing1.jpg"), title: "Smile with confidence", desc: "Your journey to better dental health starts here." },
  { id: "2", image: require("../assets/landing2.jpg"), title: "Never miss a check-up", desc: "Book appointments, get reminders, and manage your visit with ease." },
  { id: "3", image: require("../assets/landing3.jpg"), title: "Care you can trust", desc: "Gentle hands, expert care. Your smile is in good hands." },
  {
    id: "4",
    image: require("../assets/logo.png"),
    title: "Welcome",
    desc: "Your comfort and confidence are at the heart of everything we do — gentle hands, bright smiles, and care you can trust.",
    welcome: true,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const flatRef = useRef(null);
  const [index, setIndex] = useState(0);

  const next = async () => {
    if (index === slides.length - 1) {
      const session = await getSession();
      if (session?.id) {
        await setOnboardingSeenForUser(session.id);
      }
      router.replace("/home");
      return;
    }
    flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={item.welcome ? styles.logo : styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <Pressable style={styles.arrowBtn} onPress={next}>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  slide: { width, flex: 1, paddingTop: 70, paddingHorizontal: 24 },
  image: { width: "100%", height: 450, borderRadius: 40, resizeMode: "cover" },
  logo: { width: 350, height: 350, resizeMode: "contain", alignSelf: "center", marginTop: 40 },

  title: { marginTop: 18, fontSize: 20, fontWeight: "800", color: colors.primary },
  desc: { marginTop: 8, fontSize: 12, color: colors.textGray, lineHeight: 16, width: "80%" },

  dots: { position: "absolute", left: 24, bottom: 58, flexDirection: "row", gap: 6 },
  dot: { width: 18, height: 4, borderRadius: 4, backgroundColor: "#D9D9D9" },
  dotActive: { backgroundColor: colors.primary },

  arrowBtn: { position: "absolute", right: 24, bottom: 46, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
