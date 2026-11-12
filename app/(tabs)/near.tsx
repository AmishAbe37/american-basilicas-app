import * as Location from "expo-location";
import { useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasilicaRow from "../../src/components/BasilicaRow";
import { Band, Paper, T, Valance } from "../../src/components/ui";
import { fmtMiles, nearest, zipToLatLng } from "../../src/lib/geo";
import { C, F } from "../../src/theme";

type From = { lat: number; lng: number; label: string };

export default function NearScreen() {
  const [zip, setZip] = useState("");
  const [from, setFrom] = useState<From | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function useLocation() {
    setMsg(null); setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") { setMsg("Location is off for this app. You can type a ZIP code instead."); return; }
      const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
      if (last) setFrom({ lat: last.coords.latitude, lng: last.coords.longitude, label: "your location" });
      const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setFrom({ lat: now.coords.latitude, lng: now.coords.longitude, label: "your location" });
    } catch {
      setMsg("Couldn't get your location. Try again outside, or type a ZIP code.");
    } finally { setBusy(false); }
  }
  function useZip() {
    Keyboard.dismiss(); setMsg(null);
    const p = zipToLatLng(zip);
    if (!p) { setMsg("That ZIP code isn't in our list. Check the five digits."); return; }
    setFrom({ lat: p[0], lng: p[1], label: `ZIP ${zip.trim().slice(0, 5)}` });
  }
  const list = from ? nearest(from.lat, from.lng, 12) : [];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band title="Near you" />
      <Valance style={{ marginBottom: -9 }} />
      <Paper>
        <View style={s.panel}>
          <Pressable onPress={useLocation} style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            {busy ? <ActivityIndicator color={C.gold} /> : <T w="bold" style={s.btnText}>Use my location</T>}
          </Pressable>
          <View style={s.zipRow}>
            <TextInput value={zip} onChangeText={setZip} placeholder="or ZIP code" placeholderTextColor={C.muted}
              keyboardType="number-pad" maxLength={5} style={s.zip} onSubmitEditing={useZip} returnKeyType="search" />
            <Pressable onPress={useZip} style={({ pressed }) => [s.btn2, pressed && { opacity: 0.8 }]} accessibilityRole="button">
              <T w="bold" style={{ color: C.red, fontSize: 16 }}>Find</T>
            </Pressable>
          </View>
          <T style={s.note}>Your location and ZIP code stay on this phone. They aren&rsquo;t sent or saved anywhere.</T>
          {msg ? <T style={[s.note, { color: C.red }]}>{msg}</T> : null}
        </View>
        {from ? <T w="bold" style={s.heading}>Closest to {from.label}</T> : null}
        <FlatList data={list} keyExtractor={(r) => r.b.id} renderItem={({ item }) => <BasilicaRow b={item.b} right={fmtMiles(item.mi)} />}
          keyboardShouldPersistTaps="handled" />
      </Paper>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  panel: { padding: 16, paddingTop: 20, gap: 10 },
  btn: { backgroundColor: C.red, borderRadius: 8, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  btnText: { color: "#fff", fontSize: 17 },
  zipRow: { flexDirection: "row", gap: 8 },
  zip: { flex: 1, fontFamily: F.regular, fontSize: 17, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: C.rule, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  btn2: { borderWidth: 1.5, borderColor: C.red, borderRadius: 8, paddingHorizontal: 18, justifyContent: "center", backgroundColor: "#fffdf8" },
  note: { fontSize: 13, color: C.muted },
  heading: { fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.muted, paddingHorizontal: 16, paddingBottom: 6 },
});
