import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { C, F } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.paper2, borderTopColor: C.rule, ...(Platform.OS === "web" ? { height: 58, paddingBottom: 6 } : null) },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Map", tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="list" options={{ title: "Basilicas", tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="near" options={{ title: "Near you", tabBarIcon: ({ color, size }) => <Ionicons name="navigate-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="mine" options={{ title: "My pilgrimage", tabBarIcon: ({ color, size }) => <Ionicons name="ribbon-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
