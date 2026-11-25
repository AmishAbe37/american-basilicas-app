import { Stack } from "expo-router";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Cosmati, Enamel, Kicker, Paper, PorcelainButton, T, Valance, letterpress } from "../../src/components/ui";
import { Pieces } from "../../src/components/AccountSection";
import { memberLine, useMembership } from "../../src/lib/account";
import { useAuth } from "../../src/lib/auth";
import { C } from "../../src/theme";

// Where the member stands with the members' gallery: membership() in schema.sql, worded as the website words it
// (AB.memberLine). There's no purchase in the app: it shows the status and says where memberships are managed.

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

export default function MembershipScreen() {
  const { user } = useAuth();
  const m = useMembership(user?.id);
  const line = m.data ? memberLine(m.data) : null;

  return (
    <Paper>
      <Stack.Screen options={{ title: "Gallery membership" }} />
      <Valance style={{ marginBottom: -10 }} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 40, gap: 14 }}
        refreshControl={<RefreshControl refreshing={!!user && m.loading && !!m.data} onRefresh={m.reload} tintColor={C.red} />}>
        <View style={{ gap: 2 }}>
          <Kicker>Members’ gallery</Kicker>
          <T w="bold" style={s.h}>Your membership</T>
        </View>
        <T style={s.intro}>Every member’s photos, reviews, and questions and answers, basilica by basilica on the map. Like your favourites, ask about a basilica before you go, and answer other members’ questions.</T>

        {!user ? <T style={s.text}>Sign in to see your gallery membership.</T>
          : !m.data ? (
            m.loading ? <ActivityIndicator color={C.red} style={{ marginVertical: 24 }} />
              : <Card><T style={s.text}>{m.offline ? "Your membership needs a connection to look up. Try again when you have signal." : "Couldn’t load your gallery membership. Try again in a moment."}</T></Card>
          ) : (
            <Card>
              <View style={s.tagRow}>
                <Enamel>{line!.tag}</Enamel>
                {m.data.access ? <T w="semibold" style={s.open}>Gallery open</T> : <T w="semibold" style={s.closed}>Gallery closed</T>}
              </View>
              <Pieces p={line!.text} style={s.text} />
              {m.data.kind !== "admin" ? <T style={s.managed}>Gallery memberships are managed on americanbasilicas.org.</T> : null}
              {m.data.kind === "expired" && m.data.email ? (
                <T style={s.hint}>Memberships are matched by the email you sign in with (<T w="bold" style={s.hint}>{m.data.email}</T>). It can take a minute to show up here.</T>
              ) : null}
              <View style={{ paddingVertical: 12 }}>
                <PorcelainButton label={m.loading ? "Checking…" : "Check again"} onPress={() => { if (!m.loading) m.reload(); }} style={{ flex: 0 }} />
              </View>
            </Card>
          )}
        {m.data && (m.offline || m.error) ? (
          <T style={s.stale}>{m.offline ? "No signal. " : "Couldn’t refresh just now. "}As of {when(m.at)}.</T>
        ) : null}
        <Cosmati style={{ marginTop: 6 }} />
        <T style={[s.hint, { textAlign: "center" }]}>Your own map, visits and photos are always free.</T>
      </ScrollView>
    </Paper>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 24, lineHeight: 28, color: "#241d12", ...letterpress },
  intro: { fontSize: 14.5, lineHeight: 21, color: "#4f4636" },
  text: { fontSize: 15, lineHeight: 22, color: "#2a2318", marginTop: 8, marginBottom: 8 },
  tagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  open: { fontSize: 13, color: "#3f6a2a" },
  closed: { fontSize: 13, color: C.muted },
  managed: { fontSize: 14, lineHeight: 20, color: "#4f4636", marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 19, color: C.muted },
  stale: { fontSize: 13, color: "#8a6514", textAlign: "center" },
});
