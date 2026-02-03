import { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { startDeepLinkListener } from '../server/deepLinkHandler';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Initialize deep link listener when app starts
    console.log('🚀 Initializing deep link listener for OAuth');
    startDeepLinkListener();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/get-started");
    }, 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} 
      style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  logo: { 
    width: 170, 
    height: 170, 
    resizeMode: "contain" 
  },
});
