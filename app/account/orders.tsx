import { Stack } from "expo-router";
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Cosmati, Kicker, Paper, PorcelainButton, T, Valance, letterpress } from "../../src/components/ui";
import { fmtDate, money, SHOP_URL, SUPPORT_EMAIL, useOrders, type Order } from "../../src/lib/account";
import { useAuth } from "../../src/lib/auth";
import { openWeb } from "../../src/lib/open";
import { C } from "../../src/theme";

// Order history, as on the website's My pilgrimage page: the shop's orders placed with the member's verified
// email, from the "account" edge function. The last answer stays on the phone for when there's no signal.

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

export default function OrdersScreen() {
  const { user } = useAuth();
  const r = useOrders(user?.id);
  const email = r.data?.email || user?.email || "";
  const list = r.data?.orders || [];

  let body;
  if (!user) body = <T style={s.text}>Sign in to see your orders.</T>;
  else if (r.loading && !r.data) body = <View style={{ paddingVertical: 30 }}><ActivityIndicator color={C.red} /><T style={[s.text, { textAlign: "center" }]}>Looking up your orders…</T></View>;
  else if (!r.data) body = (
    <Card>
      <T style={s.text}>
        {r.offline ? "Order history needs a connection. Try again when you have signal." : "Order history isn’t available right now."}
        {" "}Questions about an order? Write to <T style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>{SUPPORT_EMAIL}</T>.
      </T>
    </Card>
  );
  else if (!list.length) body = (
    <Card>
      <T style={s.text}>No orders yet for {email}. Orders placed with this email address appear here.</T>
      <View style={{ paddingBottom: 12 }}><PorcelainButton label="Visit the shop" onPress={() => openWeb(SHOP_URL)} style={{ flex: 0 }} /></View>
    </Card>
  );
  else body = (
    <>
      <T style={s.hint}>Orders placed with {email}.</T>
      {list.map((o) => <OrderCard key={o.name} o={o} />)}
    </>
  );

  return (
    <Paper>
      <Stack.Screen options={{ title: "Orders" }} />
      <Valance style={{ marginBottom: -10 }} />
      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: 24, paddingBottom: 40, gap: 14 }}
        refreshControl={<RefreshControl refreshing={!!user && r.loading && !!r.data} onRefresh={r.reload} tintColor={C.red} />}>
        <View style={{ gap: 2 }}>
          <Kicker>From the shop</Kicker>
          <T w="bold" style={s.h}>Your orders</T>
        </View>
        {r.data && (r.offline || r.error) ? (
          <T style={s.stale}>{r.offline ? "No signal. " : "Couldn’t refresh just now. "}Showing your orders as of {when(r.at)}.</T>
        ) : null}
        {body}
        <Cosmati style={{ marginTop: 6 }} />
        <T style={[s.hint, { textAlign: "center" }]}>Questions about an order? <T style={[s.hint, s.link]} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>{SUPPORT_EMAIL}</T></T>
      </ScrollView>
    </Paper>
  );
}

/** One order, laid out like the website's: name, date · status, total and Track, then the items. */
function OrderCard({ o }: { o: Order }) {
  return (
    <Card>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <T w="bold" style={s.name}>Order {o.name}</T>
          <T style={s.meta}>{fmtDate(o.date)} · <T w="semibold" style={[s.meta, { color: o.status === "Cancelled" || o.status === "Refunded" ? C.muted : C.red }]}>{o.status}</T></T>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <T w="black" style={s.total}>{money(o.total)}</T>
          {o.statusUrl ? <PorcelainButton label="Track" onPress={() => openWeb(o.statusUrl!)} style={{ flex: 0, minWidth: 78 }} /> : null}
        </View>
      </View>
      <View style={s.items}>
        {(o.items || []).map((li, i) => (
          <View key={i} style={[s.item, i < o.items.length - 1 && s.sep]}>
            {li.image ? <Image source={{ uri: li.image }} style={s.img} accessibilityIgnoresInvertColors /> : <View style={[s.img, { backgroundColor: C.hair }]} />}
            <T style={s.itemText}>
              {li.title}
              {li.variant ? <T style={s.variant}> · {li.variant}</T> : null}
              {li.quantity > 1 ? ` × ${li.quantity}` : ""}
            </T>
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 24, lineHeight: 28, color: "#241d12", ...letterpress },
  text: { fontSize: 14.5, lineHeight: 21, color: "#4f4636", marginTop: 6, marginBottom: 12 },
  hint: { fontSize: 13, lineHeight: 19, color: C.muted },
  link: { color: "#7a1f1f", textDecorationLine: "underline" },
  stale: { fontSize: 13, color: "#8a6514", textAlign: "center" },
  top: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingTop: 2, paddingBottom: 10, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  name: { fontSize: 17, color: "#241d12" },
  meta: { fontSize: 13.5, color: C.muted, marginTop: 2 },
  total: { fontSize: 16, color: "#241d12" },
  items: { paddingVertical: 4 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  sep: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  img: { width: 44, height: 44, borderRadius: 4, borderWidth: 1, borderColor: "#d3c3a0" },
  itemText: { flex: 1, fontSize: 14, lineHeight: 19, color: "#2a2318" },
  variant: { fontSize: 14, color: C.muted },
});
