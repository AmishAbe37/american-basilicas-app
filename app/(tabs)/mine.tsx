import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasilicaRow from "../../src/components/BasilicaRow";
import { Band, Card, Cosmati, EnamelButton, Kicker, Paper, PorcelainButton, T, Valance, letterpress } from "../../src/components/ui";
import { BASILICAS, byId, STATE_COUNT } from "../../src/data/basilicas";
import { useAuth } from "../../src/lib/auth";
import { useVisits } from "../../src/lib/visits";
import { C, F } from "../../src/theme";

const short = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default function Mine() {
  const { user, displayName, signOut, rename } = useAuth();
  const V = useVisits();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const visited = [...V.visits.values()].map((v) => ({ v, b: byId(v.basilica_id) })).filter((x) => x.b)
    .sort((a, b) => (b.v.visited_on || "").localeCompare(a.v.visited_on || ""));
  const states = new Set(visited.map((x) => x.b!.state)).size;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band kicker="American Basilicas" title="My" thin="pilgrimage" />
      <Valance style={{ marginBottom: -9 }} />
      <Paper>
        <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 40, gap: 16 }}>
          {!user ? (
            <Card>
              <Kicker>Keep a record of your visits</Kicker>
              <T style={s.text}>Check off each basilica you visit, with the date, a private note and your photos. Your map shows where you’ve been. The same account works on americanbasilicas.org.</T>
              <View style={{ paddingBottom: 12 }}><EnamelButton label="Sign in" onPress={() => router.push("/signin")} /></View>
            </Card>
          ) : (
            <>
              <View style={s.stats}>
                <Stat n={visited.length} of={BASILICAS.length} label="Basilicas visited" />
                <Stat n={states} of={STATE_COUNT} label="States & D.C." />
                <Stat n={V.photos.length} label="Photos" />
              </View>
              {V.pending ? (
                <T style={s.sync}>{V.online ? "Sending your changes…" : `No signal: ${V.pending} change${V.pending === 1 ? "" : "s"} saved on this phone, sent when you’re back online.`}</T>
              ) : null}
              {V.lastError ? <T style={[s.sync, { color: C.red }]}>The website didn’t accept a change: {V.lastError}</T> : null}

              <Card>
                <Kicker style={{ paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule }}>Visited</Kicker>
                {visited.length ? visited.map((x, i) => <BasilicaRow key={x.b!.id} b={x.b!} right={short(x.v.visited_on)} last={i === visited.length - 1} />)
                  : <T style={[s.text, { marginBottom: 14 }]}>None yet. Open a basilica and tap “I’ve visited”.</T>}
              </Card>

              <Cosmati />

              <Card>
                <Kicker>Account</Kicker>
                <T style={[s.text, { marginBottom: 4 }]}>Signed in as {user.email}</T>
                {editing ? (
                  <View style={{ gap: 8, marginVertical: 8 }}>
                    <TextInput value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor="#8a7d63" style={s.input} maxLength={40} autoFocus />
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <PorcelainButton label="Save" onPress={async () => { try { await rename(name); setEditing(false); } catch { Alert.alert("Couldn’t save the name", "Check your connection and try again."); } }} />
                      <PorcelainButton label="Cancel" onPress={() => setEditing(false)} />
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => { setName(displayName || ""); setEditing(true); }} style={{ paddingVertical: 6 }}>
                    <T style={s.text}>Shown to other members as <T w="bold">{displayName || "Pilgrim"}</T>  <T w="semibold" style={{ color: "#7a1f1f", fontSize: 14 }}>Change</T></T>
                  </Pressable>
                )}
                <View style={{ paddingBottom: 12, paddingTop: 4 }}>
                  <PorcelainButton label="Sign out" onPress={() => Alert.alert("Sign out?", V.pending ? "Some changes haven’t been sent yet. They’ll wait on this phone until you sign in again." : "", [
                    { text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => signOut() }])} />
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </Paper>
    </SafeAreaView>
  );
}

function Stat({ n, of, label }: { n: number; of?: number; label: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <T w="black" style={s.statN}>{n}{of ? <T style={s.statOf}>/{of}</T> : null}</T>
      <T style={s.statL}>{label}</T>
    </Card>
  );
}

const s = StyleSheet.create({
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  stats: { flexDirection: "row", gap: 10 },
  statN: { fontSize: 30, color: "#241d12", ...letterpress },
  statOf: { fontSize: 16, color: C.muted, fontFamily: F.semibold },
  statL: { fontSize: 12, color: C.muted, marginBottom: 8 },
  sync: { fontSize: 13, color: "#8a6514", textAlign: "center" },
  input: { fontFamily: F.regular, fontSize: 16, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
});
