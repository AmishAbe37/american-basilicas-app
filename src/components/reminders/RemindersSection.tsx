import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";
import { byId } from "../../data/basilicas";
import { useAuth } from "../../lib/auth";
import { useReminders, type Settings } from "../../lib/reminders";
import { C } from "../../theme";
import { Card, Kicker, T, letterpress } from "../ui";
import { deniedAlert, fmtDay, fmtTime, fmtWhen } from "./shared";

/** My pilgrimage: planned visits (with Cancel) and the two reminder switches. Everything here stays on this phone. */
export default function RemindersSection() {
  const R = useReminders();
  const { user } = useAuth();
  if (!R.ready) return null;

  const toggle = async (k: keyof Settings, on: boolean) => {
    const r = await R.setSetting(k, on);
    if (r === "denied") deniedAlert(R.openSettings);
  };
  const confirmCancel = (id: string, name: string, at: string) => Alert.alert("Cancel this planned visit?", `${name}\n${fmtWhen(at)}`, [
    { text: "Keep it", style: "cancel" }, { text: "Cancel visit", style: "destructive", onPress: () => R.cancelPlan(id) },
  ]);
  const plans = R.plans.map((p) => ({ p, b: byId(p.bid) })).filter((x) => x.b);
  const off = R.permission === "denied";

  return (
    <>
      <Card>
        <Kicker style={s.head}>Planned visits</Kicker>
        {plans.length ? plans.map(({ p, b }, i) => (
          <View key={p.id} style={[s.row, i < plans.length - 1 && s.sep]}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b!.id } })} accessibilityRole="button">
              <T w="semibold" style={s.name} numberOfLines={2}>{b!.name}</T>
              <T style={s.when}><T w="bold" style={[s.when, { color: C.red }]}>{fmtDay(new Date(p.at))}</T> · reminder at {fmtTime(new Date(p.at))}</T>
            </Pressable>
            <Pressable onPress={() => confirmCancel(p.id, b!.name, p.at)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Cancel the visit to ${b!.name}`}>
              <T w="semibold" style={s.link}>Cancel</T>
            </Pressable>
          </View>
        )) : <T style={[s.text, { marginBottom: 14 }]}>None planned. Open a basilica and tap “Plan a visit”.</T>}
      </Card>

      <Card>
        <Kicker style={s.head}>Reminders</Kicker>
        <Toggle label="Photos waiting to upload" on={R.settings.photos && !off} onChange={(v) => toggle("photos", v)}
          hint={user ? "If your photos can’t upload for about a day, a gentle reminder to open the app on Wi-Fi." : "After you sign in: a reminder if your visit photos can’t upload for about a day."} />
        <Toggle label="Visit anniversaries" on={R.settings.anniversary && !off} onChange={(v) => toggle("anniversary", v)} last
          hint="“A year ago today you visited …”, at 9 in the morning. Uses the dates of your visits." />
        {off ? (
          <Pressable onPress={R.openSettings} style={s.offBox} accessibilityRole="button">
            <Ionicons name="notifications-off-outline" size={18} color="#8a6514" />
            <T style={s.offText}>Notifications are off for this app. <T w="semibold" style={s.link}>Open Settings</T></T>
          </Pressable>
        ) : null}
        <T style={s.fine}>Reminders are set on this phone only. Nothing about them is sent or saved anywhere else.</T>
      </Card>
    </>
  );
}

function Toggle({ label, hint, on, onChange, last }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[s.toggle, !last && s.sep]}>
      <View style={{ flex: 1 }}>
        <T w="semibold" style={s.name}>{label}</T>
        <T style={s.hint}>{hint}</T>
      </View>
      <Switch value={on} onValueChange={onChange} accessibilityLabel={label}
        trackColor={{ false: "#d9cba6", true: C.red }} thumbColor={on ? C.goldLight : "#fffdf8"} ios_backgroundColor="#d9cba6"
        {...({ activeThumbColor: C.goldLight } as object)} />
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  sep: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  name: { fontSize: 15.5, lineHeight: 19, color: "#2a2318", ...letterpress },
  when: { fontSize: 13.5, color: "#4a4030", marginTop: 2 },
  link: { color: "#7a1f1f", fontSize: 14 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  hint: { fontSize: 12.5, lineHeight: 17, color: C.muted, marginTop: 2 },
  offBox: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#f6ecd0", borderRadius: 8, padding: 10, marginTop: 4 },
  offText: { flex: 1, fontSize: 13.5, color: "#6a5320" },
  fine: { fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 8, marginBottom: 12 },
});
