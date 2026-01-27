import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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

                       
      <Stack.Screen name="home" />
    </Stack>
  );
}
