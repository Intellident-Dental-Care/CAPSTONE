import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#fff" }}
        edges={["top", "bottom"]}
      >
        <StatusBar style="dark" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="get-started" />

          <Stack.Screen
            name="login"
            options={{ presentation: "transparentModal", animation: "none" }}
          />

          <Stack.Screen
            name="signup"
            options={{ presentation: "transparentModal", animation: "none" }}
          />

          <Stack.Screen name="otp-verification" />
          <Stack.Screen name="home" />
          <Stack.Screen name="dentists" />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}