import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import type { Basilica } from "../../data/basilicas";
import { useReminders } from "../../lib/reminders";
import { C } from "../../theme";
import { Card, EnamelButton, Kicker, PorcelainButton, T, letterpress } from "../ui";
import { Chip, deniedAlert, fmtDay, fmtTime, fmtWhen } from "./shared";

const atDay = (base: Date, addDays: number) => { const d = new Date(base); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + addDays); return d; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const nextWeekday = (wd: number) => { const t = new Date(); return atDay(t, ((wd - t.getDay() + 7) % 7) || 7); };

/** "Plan a visit": pick a day and a time; on that day the phone says "Your visit to <basilica> is today".
 *  Kept on this phone only; no sign-in needed. */
export default function PlanVisit({ b }: { b: Basilica }) {
  const R = useReminders();
  const mine = R.plans.filter((p) => p.bid === b.id);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date>(() => atDay(new Date(), 1));
  const [time, setTime] = useState({ h: 8, m: 0 });
  const [iosPick, setIosPick] = useState<"date" | "time" | null>(null);
  const [busy, setBusy] = useState(false);

  // quick choices: tomorrow, and the coming Saturday and Sunday (when they aren't tomorrow)
  const quick = useMemo(() => {
    const tmr = atDay(new Date(), 1);
    const out: { label: string; d: Date }[] = [{ label: "Tomorrow", d: tmr }];
    for (const [wd, label] of [[6, "Saturday"], [0, "Sunday"]] as const) {
      const d = nextWeekday(wd);
      if (!sameDay(d, tmr)) out.push({ label, d });
    }
    return out;
  }, []);
  const custom = !quick.some((q) => sameDay(q.d, day));
  const when = new Date(day); when.setHours(time.h, time.m, 0, 0);

  const pickDay = () => {
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value: day, mode: "date", minimumDate: new Date(), onChange: (e, d) => { if (e.type === "set" && d) setDay(atDay(d, 0)); } });
    else setIosPick((x) => (x === "date" ? null : "date"));
  };
  const pickTime = () => {
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value: when, mode: "time", onChange: (e, d) => { if (e.type === "set" && d) setTime({ h: d.getHours(), m: d.getMinutes() }); } });
    else setIosPick((x) => (x === "time" ? null : "time"));
  };

  async function save() {
    setBusy(true);
    try {
      const r = await R.addPlan(b.id, when);
      if (r === "ok") { setOpen(false); setIosPick(null); }
      else if (r === "past") Alert.alert("That time has passed", "Choose a later day or time for your reminder.");
      else deniedAlert(R.openSettings);
    } catch { Alert.alert("Couldn’t set the reminder", "Try again in a moment."); }
    finally { setBusy(false); }
  }
  const confirmCancel = (id: string, at: string) => Alert.alert("Cancel this planned visit?", fmtWhen(at), [
    { text: "Keep it", style: "cancel" }, { text: "Cancel visit", style: "destructive", onPress: () => R.cancelPlan(id) },
  ]);

  const pickers = Platform.OS !== "web";        // the web preview has no date picker; the quick choices still work
  return (
    <Card style={{ marginTop: 16 }}>
      <Kicker>Plan a visit</Kicker>
      {mine.map((p) => (
        <View key={p.id} style={s.plan}>
          <Ionicons name="calendar-outline" size={22} color={C.red} />
          <View style={{ flex: 1 }}>
            <T w="semibold" style={s.planWhen}>{fmtDay(new Date(p.at))}</T>
            <T style={s.hint}>Reminder at {fmtTime(new Date(p.at))}</T>
          </View>
          <Pressable onPress={() => confirmCancel(p.id, p.at)} accessibilityRole="button" accessibilityLabel={`Cancel the visit planned for ${fmtWhen(p.at)}`} hitSlop={8}>
            <T w="semibold" style={s.link}>Cancel</T>
          </Pressable>
        </View>
      ))}
      {!open ? (
        <>
          <T style={s.text}>{mine.length ? "Planning another day?" : "Pick a day and your phone will remind you that morning."}</T>
          <View style={{ paddingBottom: 12, flexDirection: "row" }}><PorcelainButton label={mine.length ? "Plan another visit" : "Plan a visit"} onPress={() => setOpen(true)} /></View>
        </>
      ) : (
        <View style={{ gap: 10, paddingTop: 8, paddingBottom: 12 }}>
          <View style={s.chips}>
            {quick.map((q) => <Chip key={q.label} label={q.label} on={sameDay(q.d, day)} onPress={() => { setDay(q.d); setIosPick(null); }} />)}
            {pickers ? <Chip label={custom ? fmtDay(day).replace(/,.*$/, "") + ", " + day.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Other day…"} on={custom} onPress={pickDay} /> : null}
          </View>
          {iosPick === "date" && Platform.OS === "ios" ? (
            <DateTimePicker value={day} mode="date" display="inline" minimumDate={new Date()} themeVariant="light"
              onChange={(_e, d) => { if (d) setDay(atDay(d, 0)); }} />
          ) : null}
          <View style={s.whenBox}>
            <T w="bold" style={s.whenDay}>{fmtDay(day)}</T>
            <Pressable onPress={pickers ? pickTime : undefined} disabled={!pickers} accessibilityRole="button" accessibilityLabel="Change the reminder time">
              <T style={s.whenTime}>Reminder at <T w="semibold" style={s.whenTime}>{fmtTime(when)}</T>{pickers ? <T w="semibold" style={s.link}>  Change</T> : null}</T>
            </Pressable>
          </View>
          {iosPick === "time" && Platform.OS === "ios" ? (
            <DateTimePicker value={when} mode="time" display="spinner" minuteInterval={5} themeVariant="light"
              onChange={(_e, d) => { if (d) setTime({ h: d.getHours(), m: d.getMinutes() }); }} />
          ) : null}
          {busy ? <ActivityIndicator color={C.red} /> : <EnamelButton label="Remind me" onPress={save} />}
          <View style={{ flexDirection: "row" }}><PorcelainButton label="Not now" onPress={() => { setOpen(false); setIosPick(null); }} /></View>
          <T style={s.hint}>“Your visit to {b.name} is today.” The reminder stays on this phone; you can cancel it here or in My pilgrimage.</T>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  hint: { fontSize: 12.5, lineHeight: 18, color: C.muted },
  link: { color: "#7a1f1f", fontSize: 14 },
  plan: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  planWhen: { fontSize: 15.5, color: "#241d12", ...letterpress },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  whenBox: { borderWidth: 1, borderColor: "#d9cba6", borderRadius: 8, backgroundColor: "#fffdf8", paddingHorizontal: 12, paddingVertical: 9, gap: 2 },
  whenDay: { fontSize: 17, color: "#241d12", ...letterpress },
  whenTime: { fontSize: 14.5, color: "#4f4636" },
});
