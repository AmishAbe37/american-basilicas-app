import { SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold, SourceSans3_900Black, useFonts } from "@expo-google-fonts/source-sans-3";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Lacquer } from "../src/components/ui";
import WelcomeNotice from "../src/components/WelcomeNotice";
import { AuthProvider } from "../src/lib/auth";
import { RemindersProvider } from "../src/lib/reminders";
import { VisitsProvider } from "../src/lib/visits";
import { C, F } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Root() {
  const [loaded] = useFonts({ SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold, SourceSans3_900Black });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <AuthProvider><VisitsProvider><RemindersProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.ink },
          headerBackground: () => <Lacquer style={{ flex: 1 }} />,
          headerShadowVisible: false,
          headerTintColor: C.gold,
          headerTitleStyle: { fontFamily: F.bold, color: "#fff" },
          contentStyle: { backgroundColor: C.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="basilica/[id]" options={{ title: "", headerBackTitle: "Back" }} />
        <Stack.Screen name="signin" options={{ title: "Sign in", presentation: "modal" }} />
        <Stack.Screen name="account/orders" options={{ title: "Orders", headerBackTitle: "Back" }} />
        <Stack.Screen name="account/membership" options={{ title: "Gallery membership", headerBackTitle: "Back" }} />
        <Stack.Screen name="account/delete" options={{ title: "Delete my account", headerBackTitle: "Back" }} />
      </Stack>
      <WelcomeNotice />
      </RemindersProvider></VisitsProvider></AuthProvider>
    </GestureHandlerRootView>
  );
}
