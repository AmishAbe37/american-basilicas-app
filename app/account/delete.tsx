import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card, Cosmati, EnamelButton, Kicker, Medallion, Paper, T, Valance, letterpress } from "../../src/components/ui";
import { deleteAccount, SUPPORT_EMAIL } from "../../src/lib/account";
import { useAuth } from "../../src/lib/auth";
import { useVisits } from "../../src/lib/visits";
import { C, F } from "../../src/theme";

// "Delete my account", as in the website's account settings: the same explanation, the same typed confirmation
// (DELETE), and the same edge function. Afterwards the app signs out and forgets everything it kept on this phone.

export default function DeleteScreen() {
  const { user } = useAuth();
  const V = useVisits();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const ok = typed.trim() === "DELETE" && !busy;

  async function go() {
    if (!user || !ok) return;
    setBusy(true); setMsg(null);
    try { await deleteAccount(user.id); setDone(true); }
    catch (e: any) { setMsg(e?.network ? (e.message.startsWith("Deleting") ? e.message : "Deleting your account needs a connection. Try again when you have signal.") : `Couldn’t delete the account: ${e?.message || e}`); }
    finally { setBusy(false); }
  }

  if (done) return (
    <Paper>
      <Stack.Screen options={{ title: "Account deleted", headerBackVisible: false, gestureEnabled: false }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 30, gap: 16, alignItems: "center" }}>
        <Medallion size={72} />
        <T w="bold" style={s.h}>Your account has been deleted</T>
        <T style={[s.text, { textAlign: "center" }]}>Your login, visits, notes, photos, reviews, questions, answers and likes have been removed, and this phone no longer keeps any of them. Thank you for being part of American Basilicas.</T>
        <View style={{ alignSelf: "stretch" }}><EnamelButton label="Back to the map" onPress={() => router.replace("/")} /></View>
      </ScrollView>
    </Paper>
  );

  return (
    <Paper>
      <Stack.Screen options={{ title: "Delete my account" }} />
      <Valance style={{ marginBottom: -10 }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 2 }}>
            <Kicker>Account</Kicker>
            <T w="bold" style={s.h}>Delete my account</T>
          </View>
          {!user ? <T style={s.text}>Sign in to delete your account.</T> : (
            <Card>
              <T style={s.text}>This permanently deletes your account, your visits and notes, and all your photos, including any in the members’ gallery. Your shop orders are not affected. It can’t be undone.</T>
              <View style={s.list}>
                <T w="semibold" style={s.li}>What’s deleted</T>
                <T style={s.li}>· Your login and display name</T>
                <T style={s.li}>· Your visits, dates and private notes</T>
                <T style={s.li}>· Your photos and their files, including any in the members’ gallery</T>
                <T style={s.li}>· Your reviews, questions, answers and likes (answers other members gave to your questions go with them)</T>
                <T style={s.li}>· Everything this app keeps on this phone for you{V.pending ? `, including ${V.pending} change${V.pending === 1 ? "" : "s"} not sent yet` : ""}</T>
                <T w="semibold" style={[s.li, { marginTop: 8 }]}>What isn’t</T>
                <T style={s.li}>· Your shop orders, which the store’s own privacy policy covers</T>
                <T style={s.li}>· A gallery membership record, kept by email address so a membership you’ve paid for still works if you sign up again. Deleting your account doesn’t cancel a membership. Email <T style={[s.li, s.link]} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>{SUPPORT_EMAIL}</T> and we’ll delete the record.</T>
              </View>
              <T w="semibold" style={s.label}>Type DELETE to confirm</T>
              <TextInput value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} autoComplete="off"
                style={s.input} placeholder="DELETE" placeholderTextColor="#b5a888" accessibilityLabel="Type DELETE to confirm" editable={!busy} />
              <View style={{ paddingVertical: 12 }}>
                <Pressable onPress={go} disabled={!ok} accessibilityRole="button" accessibilityState={{ disabled: !ok }}
                  style={({ pressed }) => [s.btnShadow, !ok && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}>
                  <LinearGradient colors={["#a92a22", "#7e1712", "#5a0d0b"]} style={s.btn}>
                    {busy ? <ActivityIndicator color="#fff" /> : null}
                    <T w="bold" style={s.btnText}>{busy ? "Deleting…" : "Delete my account"}</T>
                  </LinearGradient>
                </Pressable>
              </View>
              {msg ? <T style={s.err} accessibilityLiveRegion="polite">{msg}</T> : null}
            </Card>
          )}
          <Cosmati style={{ marginTop: 6 }} />
          <T style={[s.hint, { textAlign: "center" }]}>You can also delete your account on americanbasilicas.org, under My pilgrimage → Account.</T>
        </ScrollView>
      </KeyboardAvoidingView>
    </Paper>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 24, lineHeight: 28, color: "#241d12", ...letterpress },
  text: { fontSize: 14.5, lineHeight: 21, color: "#2a2318", marginTop: 6, marginBottom: 10 },
  list: { backgroundColor: "rgba(239,231,211,.7)", borderRadius: 6, borderWidth: 1, borderColor: C.hair, padding: 10, marginBottom: 14, gap: 3 },
  li: { fontSize: 13.5, lineHeight: 19, color: "#4f4636" },
  link: { color: "#7a1f1f", textDecorationLine: "underline" },
  label: { fontSize: 14, color: "#2a2318", marginBottom: 6 },
  input: { fontFamily: F.bold, fontSize: 17, letterSpacing: 3, color: C.red, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, maxWidth: 220 },
  btnShadow: { borderRadius: 9, shadowColor: "#3c280a", shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  btn: { borderRadius: 9, borderWidth: 1, borderColor: "#4a0c0a", paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnText: { color: "#fff", fontSize: 17 },
  err: { fontSize: 14, color: C.red, marginBottom: 12 },
  hint: { fontSize: 13, lineHeight: 19, color: C.muted },
});
