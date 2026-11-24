import Ionicons from "@expo/vector-icons/Ionicons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { appleNative, appleNativeAvailable, Cancelled, signInWithApple, signInWithGoogle, socialButtons } from "../lib/social";
import { C, F } from "../theme";
import { T } from "./ui";

const offline = (e: any) => /network|fetch|timed? ?out|offline|connection/i.test(String(e?.message || e));

/** "Continue with Google" and Apple's button, above the email code. Hidden until switched on in src/lib/config.ts. */
export default function SocialSignIn({ onDone }: { onDone: () => void }) {
  const show = socialButtons();
  const [nativeApple, setNativeApple] = useState(false);
  const [busy, setBusy] = useState<null | "google" | "apple">(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (show.apple && appleNative) appleNativeAvailable().then(setNativeApple); }, [show.apple]);

  if (!show.google && !show.apple) return null;

  async function go(which: "google" | "apple") {
    setBusy(which); setMsg(null);
    try {
      await (which === "google" ? signInWithGoogle() : signInWithApple());
      onDone();
    } catch (e: any) {
      if (e instanceof Cancelled) return;
      const name = which === "google" ? "Google" : "Apple";
      setMsg(offline(e) ? `Signing in with ${name} needs a connection. Try again when you have signal, or use the email code.` : `Couldn’t sign in with ${name}. Please try again, or use the email code.`);
    } finally { setBusy(null); }
  }

  return (
    <View style={{ gap: 10 }}>
      {show.google ? (
        <Pressable onPress={() => go("google")} disabled={!!busy} accessibilityRole="button" style={({ pressed }) => [s.gbtn, pressed && { opacity: 0.85 }]}>
          {busy === "google" ? <ActivityIndicator color={C.muted} /> : <><GoogleG /><T style={s.gtext}>Continue with Google</T></>}
        </Pressable>
      ) : null}
      {show.apple ? (
        nativeApple ? (
          // Apple's own button, drawn by iOS (its look is set by Apple; don't restyle it)
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={9} style={{ width: "100%", height: 48, opacity: busy ? 0.6 : 1 }}
            onPress={() => { if (!busy) go("apple"); }} />
        ) : appleNative ? null : (
          <Pressable onPress={() => go("apple")} disabled={!!busy} accessibilityRole="button" style={({ pressed }) => [s.abtn, pressed && { opacity: 0.85 }]}>
            {busy === "apple" ? <ActivityIndicator color="#fff" /> : <><Ionicons name="logo-apple" size={20} color="#fff" /><T style={s.atext}>Continue with Apple</T></>}
          </Pressable>
        )
      ) : null}
      {msg ? <T style={s.err}>{msg}</T> : null}
      <T style={s.hint}>One account everywhere: use the same email address as on americanbasilicas.org.{show.apple ? " If Apple offers to hide your email, that makes a separate account." : ""}</T>
      <View style={s.or}><View style={s.rule} /><T w="semibold" style={s.orText}>or</T><View style={s.rule} /></View>
    </View>
  );
}

// Google's "G", as on the website's button (members/shell.js)
function GoogleG() {
  return (
    <Svg viewBox="0 0 48 48" width={20} height={20}>
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <Path fill="#FBBC05" d="M10.5 28.8c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.8-6C1 16.5 0 20.1 0 24s1 7.5 2.7 10.8l7.8-6z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

const s = StyleSheet.create({
  gbtn: { height: 48, borderRadius: 9, borderWidth: 1, borderColor: "#c9b98f", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#3c280a", shadowOpacity: 0.18, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  gtext: { fontFamily: F.semibold, fontSize: 16.5, color: "#3c3c3c" },
  abtn: { height: 48, borderRadius: 9, backgroundColor: "#000", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  atext: { fontFamily: F.semibold, fontSize: 16.5, color: "#fff" },
  hint: { fontSize: 12.5, lineHeight: 18, color: C.muted, textAlign: "center" },
  err: { fontSize: 13.5, lineHeight: 19, color: C.red, textAlign: "center" },
  or: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  rule: { flex: 1, height: 1, backgroundColor: C.rule },
  orText: { fontSize: 13, color: C.muted, letterSpacing: 1 },
});
