import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { fmtDate, loadMembership, markWelcomed, memberLine, type Membership } from "../lib/account";
import { useAuth } from "../lib/auth";
import { C } from "../theme";
import { Pieces } from "./AccountSection";
import { Cosmati, EnamelButton, Kicker, Lacquer, Medallion, T, engraved } from "./ui";

// The website's welcome message (members/shell.js, welcome()): shown once, the first time a member signs in,
// and then marked with mark_welcomed() so neither the site nor the app shows it again. Without the website's
// line about subscribing later: there's no purchase in the app.

export default function WelcomeNotice() {
  const { user, displayName } = useAuth();
  const uid = user?.id;
  const [m, setM] = useState<Membership | null>(null);

  useEffect(() => {
    setM(null);
    if (!uid) return;
    let live = true;
    (async () => {
      const r = await loadMembership(uid);
      if (!live || !r.data || r.fromCache || r.data.welcomed_at) return;      // only on a fresh answer from the server
      if (await AsyncStorage.getItem(`ab.welcomed.${uid}`)) { markWelcomed().catch(() => {}); return; }   // seen here; tell the server again
      setM(r.data);
    })();
    return () => { live = false; };
  }, [uid]);

  if (!m || !uid) return null;
  const done = () => {
    setM(null);
    AsyncStorage.setItem(`ab.welcomed.${uid}`, new Date().toISOString()).catch(() => {});
    markWelcomed().catch(() => {});
  };
  const first = displayName && displayName !== "Pilgrim" ? `, ${displayName}` : "";

  return (
    <Modal transparent animationType="fade" onRequestClose={done} visible>
      <View style={s.scrim}>
        <View style={s.card} accessibilityViewIsModal>
          <Lacquer style={s.bar}>
            <Medallion size={44} />
            <View style={{ flex: 1 }}>
              <Kicker style={s.kick}>American Basilicas · Members</Kicker>
              <T w="bold" style={s.h}>Welcome{first}!</T>
            </View>
            <Pressable onPress={done} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12}><T w="bold" style={s.x}>×</T></Pressable>
          </Lacquer>
          <View style={{ flexShrink: 1, backgroundColor: C.paper }}>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
              <T style={s.p}>Your account is ready. Here’s what it includes:</T>
              <T w="bold" style={s.h3}>Always free</T>
              <T style={s.p}>Your own edition of the map: check off the basilicas you’ve visited, record the date and a private note, and keep your photos with each visit.</T>
              {m.kind === "trial" ? (
                <>
                  <T w="bold" style={s.h3}>The members’ gallery — free until {fmtDate(m.free_until)}</T>
                  <T style={s.p}>Browse every member’s photos, reviews, and questions and answers basilica by basilica on the gallery map, like your favourites, and sort by most liked or latest. <T w="bold" style={s.p}>It’s included free for your first three months.</T> After {fmtDate(m.free_until)}, the gallery is for paid subscribers.</T>
                </>
              ) : (
                <>
                  <T w="bold" style={s.h3}>The members’ gallery</T>
                  <Pieces p={memberLine(m).text} style={s.p} />
                </>
              )}
              <Cosmati style={{ marginVertical: 8 }} />
              <EnamelButton label="Start my pilgrimage" onPress={() => { done(); router.navigate("/mine"); }} />
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(10,8,5,.6)", justifyContent: "center", padding: 18 },
  card: { borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: C.gold, maxHeight: "90%", backgroundColor: C.paper },
  bar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  kick: { color: "#e3b84a", fontSize: 10, textShadowColor: "rgba(0,0,0,.9)", textShadowOffset: { width: 0, height: -1 } },
  h: { fontSize: 22, color: "#fff", ...engraved },
  x: { fontSize: 28, lineHeight: 30, color: C.gold },
  h3: { fontSize: 16, color: "#241d12", marginTop: 6 },
  p: { fontSize: 14.5, lineHeight: 21, color: "#4f4636" },
});
