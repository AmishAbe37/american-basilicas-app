import Constants from "expo-constants";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, View, type StyleProp, type TextStyle } from "react-native";
import { PRIVACY_URL, SHOP_URL, SUPPORT_EMAIL, memberLine, useMembership, type Piece } from "../lib/account";
import { useAuth } from "../lib/auth";
import { openWeb } from "../lib/open";
import { C } from "../theme";
import { Card, Kicker, T } from "./ui";

// The account pieces of the My pilgrimage tab: links to orders and the gallery membership, the way to delete the
// account, and a footer like the website's (email, privacy policy, a quiet link to the shop, the app's version).

/** Text from memberLine(), with the dates in bold. */
export function Pieces({ p, style }: { p: Piece[]; style?: StyleProp<TextStyle> }) {
  return <T style={style}>{p.map((x, i) => (typeof x === "string" ? x : <T key={i} w="bold" style={style}>{x.b}</T>))}</T>;
}

/** A row in a card that opens another screen. */
export function LinkRow({ label, detail, onPress, last, danger }: { label: string; detail?: string; onPress: () => void; last?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.row, !last && s.sep, pressed && s.pressed]}>
      <View style={{ flex: 1 }}>
        <T w="semibold" style={[s.label, danger && { color: C.red }]}>{label}</T>
        {detail ? <T style={s.detail} numberOfLines={1}>{detail}</T> : null}
      </View>
      <T w="bold" style={s.chev}>›</T>
    </Pressable>
  );
}

/** Orders and gallery membership, for a signed-in member. */
export function AccountLinks() {
  const { user } = useAuth();
  const m = useMembership(user?.id);
  if (!user) return null;
  return (
    <Card>
      <Kicker style={{ paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: C.rule }}>Orders &amp; membership</Kicker>
      <LinkRow label="Members’ gallery" detail={m.data ? memberLine(m.data).tag : m.loading ? "Looking it up…" : undefined} onPress={() => router.push("/account/membership")} />
      <LinkRow label="Orders" detail="From the shop" onPress={() => router.push("/account/orders")} last />
    </Card>
  );
}

/** "Delete my account", under Sign out, as in the website's account settings. */
export function DeleteLink() {
  return (
    <Pressable onPress={() => router.push("/account/delete")} accessibilityRole="button" style={{ paddingBottom: 14, alignSelf: "center" }}>
      <T w="semibold" style={{ fontSize: 14, color: C.red }}>Delete my account</T>
    </Pressable>
  );
}

/** Like the website's footer: email, privacy policy, a quiet shop link, and the app's version. */
export function AccountFooter() {
  const version = Constants.expoConfig?.version ?? "";
  return (
    <View style={s.foot}>
      <T style={s.footText}>
        American Basilicas
        {" · "}<T style={s.footLink} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>{SUPPORT_EMAIL}</T>
        {" · "}<T style={s.footLink} onPress={() => openWeb(PRIVACY_URL)}>Privacy policy</T>
        {" · "}<T style={s.footLink} onPress={() => openWeb(SHOP_URL)}>Shop</T>
      </T>
      <T style={s.footText}>Your visits, notes and photos are private to you unless a photo is approved for the members’ gallery.</T>
      {version ? <T style={[s.footText, { marginTop: 2 }]}>App version {version}</T> : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  sep: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  pressed: { backgroundColor: "rgba(217,165,33,.16)" },
  label: { fontSize: 15.5, color: "#2a2318" },
  detail: { fontSize: 13, color: C.muted, marginTop: 1 },
  chev: { fontSize: 24, lineHeight: 26, color: "#b08a2a" },
  foot: { paddingHorizontal: 8, paddingTop: 4, gap: 6 },
  footText: { fontSize: 12.5, lineHeight: 18, color: C.muted, textAlign: "center" },
  footLink: { fontSize: 12.5, color: "#7a1f1f", textDecorationLine: "underline" },
});
