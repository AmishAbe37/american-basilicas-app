import { Alert, Pressable, StyleSheet } from "react-native";
import { C, F } from "../../theme";
import { T } from "../ui";

export const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtWhen = (iso: string) => { const d = new Date(iso); return `${fmtDay(d)} · ${fmtTime(d)}`; };

/** When notifications are switched off for the app, say so and offer the phone's Settings. */
export function deniedAlert(openSettings: () => void) {
  Alert.alert("Notifications are off for this app", "To get reminders, turn on notifications for American Basilicas in your phone’s Settings.", [
    { text: "Not now", style: "cancel" }, { text: "Open Settings", onPress: openSettings },
  ]);
}

/** A small choice chip: porcelain, or red enamel when chosen. */
export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={({ pressed }) => [s.chip, on && s.on, pressed && { opacity: 0.8 }]}>
      <T w={on ? "bold" : "semibold"} style={[s.text, on && { color: "#fff" }]}>{label}</T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: "#c9b98f", backgroundColor: "#fffdf8", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  on: { backgroundColor: C.red, borderColor: "#c99a2e" },
  text: { fontSize: 14, color: "#7a1f1f", fontFamily: F.semibold },
});
