import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { C, F } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.paper2, borderTopColor: C.rule },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Map", tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="list" options={{ title: "Basilicas", tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="near" options={{ title: "Near you", tabBarIcon: ({ color, size }) => <Ionicons name="navigate-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
