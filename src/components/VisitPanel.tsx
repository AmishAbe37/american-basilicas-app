import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import type { Basilica } from "../data/basilicas";
import { useAuth } from "../lib/auth";
import { today, useVisits, type Photo } from "../lib/visits";
import { C, F } from "../theme";
import { Card, EnamelButton, GiltFrame, Kicker, PorcelainButton, T, letterpress } from "./ui";

const fmt = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");
const STATUS: Record<string, [string, string]> = {
  waiting: ["On this phone", "#6a5f4c"], pending: ["Awaiting approval", "#8a6514"], approved: ["In the gallery", "#2f6b3a"], hidden: ["Not shown", "#8f1d1d"],
};

/** "Your visit": check off, date, private note, photos. Saved on the phone first; sent when there's signal. */
export default function VisitPanel({ b }: { b: Basilica }) {
  const { user } = useAuth();
  const V = useVisits();
  const v = V.visits.get(b.id);
  const [note, setNote] = useState(v?.note || "");
  const [busy, setBusy] = useState(false);
  const [iosDate, setIosDate] = useState(false);
  useEffect(() => { setNote(v?.note || ""); }, [v?.note, b.id]);

  if (!user) {
    return (
      <Card style={{ marginTop: 22 }}>
        <Kicker>Been here?</Kicker>
        <T style={s.text}>Sign in to check off {b.name}, with the date, a private note and your photos.</T>
        <View style={{ paddingBottom: 12 }}><EnamelButton label="Sign in" onPress={() => router.push("/signin")} /></View>
      </Card>
    );
  }
  if (!v) {
    return (
      <Card style={{ marginTop: 22 }}>
        <Kicker>Been here?</Kicker>
        <T style={s.text}>Check it off, then add your date and photos.</T>
        <View style={{ paddingBottom: 12 }}><EnamelButton label="✓  I’ve visited" onPress={() => V.checkIn(b.id)} /></View>
      </Card>
    );
  }

  const photos = V.photos.filter((p) => p.basilica_id === b.id);
  const date = v.visited_on || today();
  const pickDate = () => {
    const value = new Date(date + "T12:00:00");
    const set = (d?: Date) => { if (d) { const t = new Date(d); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); V.update(b.id, { visited_on: t.toISOString().slice(0, 10) }); } };
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value, mode: "date", maximumDate: new Date(), onChange: (_e, d) => set(d) });
    else setIosDate((x) => !x);
  };
  async function add(camera: boolean) {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(camera ? "Camera is off for this app" : "Photos are off for this app", "You can turn access on in your phone’s Settings."); return; }
    const r = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, exif: false, allowsMultipleSelection: true, selectionLimit: 10 });
    if (r.canceled || !r.assets?.length) return;
    setBusy(true);
    try { await V.addPhotos(b.id, r.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))); }
    catch { Alert.alert("Couldn’t prepare that photo", "Try a different one."); }
    finally { setBusy(false); }
  }
  const confirmDelete = (p: Photo) => Alert.alert("Delete this photo?", "This can’t be undone.", [
    { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => V.deletePhoto(p) },
  ]);
  const confirmRemove = () => Alert.alert("Remove this visit?", "Your date, note and photos for this basilica will be deleted.", [
    { text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => V.remove(b.id) },
  ]);

  return (
    <Card style={{ marginTop: 22 }}>
      <View style={s.head}>
        <View style={s.stamp}><T w="black" style={s.stampText}>✓ VISITED</T></View>
        <Pressable onPress={pickDate} accessibilityRole="button" accessibilityLabel="Change the date of your visit">
          <T w="semibold" style={s.date}>{fmt(date)}  <T style={s.change}>Change</T></T>
        </Pressable>
      </View>
      {iosDate && Platform.OS === "ios" ? (
        <DateTimePicker value={new Date(date + "T12:00:00")} mode="date" display="inline" maximumDate={new Date()} themeVariant="light"
          onChange={(_e, d) => { if (d) { const t = new Date(d); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); V.update(b.id, { visited_on: t.toISOString().slice(0, 10) }); } }} />
      ) : null}

      <Kicker style={{ marginTop: 14, fontSize: 11 }}>Private note</Kicker>
      <TextInput value={note} onChangeText={setNote} onBlur={() => { if (note !== (v.note || "")) V.update(b.id, { note: note.trim() || null }); }}
        placeholder="Only you can see this" placeholderTextColor="#8a7d63" multiline style={s.note} maxLength={2000} />

      <View style={s.phHead}>
        <Kicker style={{ fontSize: 11 }}>Your photos</Kicker>
        {busy ? <ActivityIndicator color={C.red} /> : null}
      </View>
      {photos.length ? (
        <View style={s.grid}>
          {photos.map((p) => {
            const uri = V.thumbUrl(p);
            const [label, color] = STATUS[p.status] || [p.status, C.muted];
            return (
              <Pressable key={p.id} onLongPress={() => confirmDelete(p)} accessibilityHint="Long-press to delete" style={{ width: "31%" }}>
                <GiltFrame width={3}>
                  {uri ? <Image source={{ uri }} style={s.thumb} /> : <View style={[s.thumb, { backgroundColor: C.paper2 }]} />}
                </GiltFrame>
                <T style={[s.chip, { color }]}>{label}</T>
              </Pressable>
            );
          })}
        </View>
      ) : <T style={[s.text, { marginTop: 4 }]}>No photos yet.</T>}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <PorcelainButton label="Take a photo" onPress={() => add(true)} />
        <PorcelainButton label="From your photos" onPress={() => add(false)} />
      </View>
      <T style={[s.hint, { marginTop: 8 }]}>
        Photos are resized and their location data is removed before upload. They appear here right away, and in the members’ gallery once approved. Long-press a photo to delete it.
      </T>

      {V.pending ? (
        <T style={[s.hint, { color: "#8a6514", marginTop: 8 }]}>
          {V.online ? "Sending your changes…" : "No signal: your changes are saved on this phone and will be sent when you’re back online."}
        </T>
      ) : null}

      <Pressable onPress={confirmRemove} style={{ paddingVertical: 12 }} accessibilityRole="button">
        <T w="semibold" style={{ color: "#7a1f1f", fontSize: 14 }}>Remove this visit</T>
      </Pressable>
    </Card>
  );
}

const s = StyleSheet.create({
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  hint: { fontSize: 12.5, lineHeight: 18, color: C.muted },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  // a pilgrim's credential stamp: blue-black ink, a little crooked
  stamp: { borderWidth: 2, borderColor: "#33418a", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: "-4deg" }] },
  stampText: { color: "#33418a", fontSize: 13, letterSpacing: 1.5 },
  date: { fontSize: 15, color: "#241d12", textAlign: "right", ...letterpress },
  change: { fontSize: 13, color: "#7a1f1f", fontFamily: F.semibold },
  note: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 8, padding: 10, minHeight: 70, marginTop: 6, textAlignVertical: "top" },
  phHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumb: { width: "100%", aspectRatio: 1 },
  chip: { fontSize: 11, fontFamily: F.semibold, marginTop: 3, textAlign: "center" },
});
