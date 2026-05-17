import { useEffect } from "react";
import { View, Image, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "./theme/colors";
import { startDeepLinkListener } from "../server/deepLinkHandler";
import { getSession } from "./_storage/authStorage";
import { restoreSessionFromStorage, supabase } from "../server/supabaseService";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    startDeepLinkListener();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();

        // Restore Supabase session from AsyncStorage if available
        if (session?.session) {
          await restoreSessionFromStorage(session);
        }

        // Add a small delay to ensure session is properly restored
        setTimeout(async () => {
          if (session?.user || session?.session?.user) {
            // Verify the session is actually valid by checking with Supabase
            // This ensures the restored session works properly
            try {
              const { data: { user }, error } = await supabase.auth.getUser();
              if (user && !error) {
                router.replace("/home");
              } else {
                // Session invalid, redirect to login
                console.warn('Session invalid after restore:', error);
                router.replace("/get-started");
              }
            } catch (err) {
              console.error('User verification error:', err);
              router.replace("/get-started");
            }
          } else {
            router.replace("/get-started");
          }
        }, 1200);
      } catch (error) {
        console.error('Session check error:', error);
        router.replace("/get-started");
      }
    };

    checkSession();
  }, [router]);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.text}>Preparing your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 170,
    height: 170,
    resizeMode: "contain",
    marginBottom: 16,
  },

  text: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textGray,
    fontWeight: "700",
  },
});