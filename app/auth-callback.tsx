import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Card, EnamelButton, Paper, T } from "../src/components/ui";
import { sb } from "../src/lib/supabase";
import { C } from "../src/theme";

/** Where a browser sign-in lands if the phone closed the app while Google's or Apple's page was open. */
export default function AuthCallback() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [msg, setMsg] = useState<string | null>(error_description ? String(error_description) : null);

  useEffect(() => {
    if (error_description) return;
    (async () => {
      try {
        const { data } = await sb.auth.getSession();
        if (!data.session && code) { const r = await sb.auth.exchangeCodeForSession(String(code)); if (r.error) throw r.error; }
        router.replace("/mine");
      } catch {
        setMsg("That sign-in didn’t finish. Please try again.");
      }
    })();
  }, [code, error_description]);

  return (
    <Paper>
      <Stack.Screen options={{ title: "Signing in" }} />
      <View style={{ padding: 18, paddingTop: 30 }}>
        {msg ? (
          <Card>
            <T style={{ fontSize: 15, lineHeight: 22, color: "#4f4636", marginVertical: 10 }}>{msg}</T>
            <View style={{ paddingBottom: 12 }}><EnamelButton label="Back to sign in" onPress={() => router.replace("/signin")} /></View>
          </Card>
        ) : <ActivityIndicator color={C.red} />}
      </View>
    </Paper>
  );
}
