import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Card, Cosmati, EnamelButton, Kicker, Medallion, Paper, PorcelainButton, T, letterpress } from "../src/components/ui";
import { useAuth } from "../src/lib/auth";
import { C, F } from "../src/theme";

export default function SignIn() {
  const { sendCode, verifyCode } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg("Enter your email address."); return; }
    setBusy(true); setMsg(null);
    try { await sendCode(email); setSent(true); }
    catch (e: any) { setMsg(/rate|seconds/i.test(e?.message || "") ? "Too many emails just now. Wait a minute and try again." : "Couldn’t send the code. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (code.replace(/\D/g, "").length !== 6) { setMsg("Enter the 6-digit code from the email."); return; }
    setBusy(true); setMsg(null);
    try { await verifyCode(email, code); router.back(); }
    catch { setMsg("That code didn’t work. It may have expired. Send a new one and try again."); }
    finally { setBusy(false); }
  }

  return (
    <Paper>
      <Stack.Screen options={{ title: "Sign in", presentation: "modal" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 26, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 10 }}>
            <Medallion size={72} />
            <T w="bold" style={s.h}>Your pilgrimage</T>
            <T style={s.sub}>Check off the basilicas you visit, with the date, a private note and your photos. The same account works on americanbasilicas.org.</T>
          </View>
          <Cosmati />
          <Card>
            {!sent ? (
              <View style={{ gap: 12, paddingBottom: 12 }}>
                <Kicker>Email</Kicker>
                <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#8a7d63"
                  autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress"
                  style={s.input} onSubmitEditing={send} returnKeyType="send" />
                {busy ? <ActivityIndicator color={C.red} /> : <EnamelButton label="Email me a code" onPress={send} />}
                <T style={s.hint}>We’ll email you a 6-digit code. No password needed. If you’re new, this makes your account.</T>
              </View>
            ) : (
              <View style={{ gap: 12, paddingBottom: 12 }}>
                <Kicker>Code from the email</Kicker>
                <T style={s.hint}>Sent to {email.trim()}. It can take a minute; check spam too.</T>
                <TextInput value={code} onChangeText={setCode} placeholder="123456" placeholderTextColor="#8a7d63"
                  keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode"
                  style={[s.input, s.code]} onSubmitEditing={verify} returnKeyType="done" autoFocus />
                {busy ? <ActivityIndicator color={C.red} /> : <EnamelButton label="Sign in" onPress={verify} />}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <PorcelainButton label="Send a new code" onPress={send} />
                  <PorcelainButton label="Different email" onPress={() => { setSent(false); setCode(""); setMsg(null); }} />
                </View>
              </View>
            )}
            {msg ? <T style={[s.hint, { color: C.red, paddingBottom: 12 }]}>{msg}</T> : null}
          </Card>
          <T style={s.fine}>Your visits, notes and photos are private to you. Photos also go to the members’ gallery once approved.</T>
        </ScrollView>
      </KeyboardAvoidingView>
    </Paper>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 24, color: "#241d12", ...letterpress },
  sub: { fontSize: 15, lineHeight: 22, color: "#4f4636", textAlign: "center" },
  input: { fontFamily: F.regular, fontSize: 17, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11 },
  code: { fontFamily: F.bold, fontSize: 26, letterSpacing: 8, textAlign: "center" },
  hint: { fontSize: 13.5, lineHeight: 19, color: C.muted },
  fine: { fontSize: 12.5, lineHeight: 18, color: C.muted, textAlign: "center" },
});
