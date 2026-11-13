import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Band, Card, Enamel, Lead, Paper, T, Valance, letterpress } from "../../src/components/ui";
import { BY_STATE, type Basilica } from "../../src/data/basilicas";
import { C, F } from "../../src/theme";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const LEAD = "Listed state by state, alphabetically. New York leads with nine; California, Florida, Ohio, and Pennsylvania each hold seven. The first two — Minneapolis and Lackawanna — were designated in 1926.";

export default function ListScreen() {
  const [q, setQ] = useState("");
  const sections = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return BY_STATE;
    return BY_STATE.map((s) => ({ ...s, data: s.data.filter((b) => norm(`${b.name} ${b.city} ${b.state}`).includes(n)) }))
      .filter((s) => s.data.length);
  }, [q]);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band kicker="The index" title="State by" thin="state" />
      <Valance style={{ marginBottom: -9 }} />
      <Paper>
        <FlatList
          data={sections}
          keyExtractor={(s) => s.state}
          contentContainerStyle={{ padding: 14, paddingTop: 20, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 14, marginBottom: 14 }}>
              <TextInput value={q} onChangeText={setQ} placeholder="Search by name, city or state" placeholderTextColor="#8a7d63"
                style={s.search} clearButtonMode="while-editing" autoCorrect={false} returnKeyType="search" />
              {!q ? <View style={s.leadWrap}><Lead>{LEAD}</Lead></View> : null}
            </View>
          }
          ListEmptyComponent={<T style={{ padding: 8, color: C.muted }}>No basilica matches “{q}”.</T>}
          renderItem={({ item }) => <StateCard state={item.state} list={item.data} />}
        />
      </Paper>
    </SafeAreaView>
  );
}

function StateCard({ state, list }: { state: string; list: Basilica[] }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={s.h3}>
        <T w="black" style={s.stname}>{state}</T>
        <Enamel>{list.length}</Enamel>
      </View>
      {list.map((b, i) => (
        <Pressable key={b.id} onPress={() => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })}
          style={({ pressed }) => [s.li, i < list.length - 1 && s.dotted, pressed && s.pressed]} accessibilityRole="button"
          accessibilityLabel={`${b.name}, ${b.city}`}>
          <T w="bold" style={s.city}>{b.city}</T>
          <T style={s.bname}>{b.name}</T>
        </Pressable>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  search: { fontFamily: F.regular, fontSize: 16, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#c9b98f", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, shadowColor: "#3c280a", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  leadWrap: { borderBottomWidth: 1, borderBottomColor: "#e0d4b6", paddingBottom: 12 },
  h3: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 5, marginBottom: 2, borderBottomWidth: 1.5, borderBottomColor: C.rule },
  stname: { fontSize: 16, color: "#241d12", letterSpacing: 0.2, ...letterpress },
  li: { flexDirection: "row", gap: 10, paddingVertical: 7, alignItems: "baseline" },
  dotted: { borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: "#cdbd96" },
  pressed: { backgroundColor: "rgba(217,165,33,.18)" },
  city: { width: "34%", fontSize: 14, color: "#4a4030" },
  bname: { flex: 1, fontSize: 14.5, lineHeight: 19, color: "#2a2318" },
});
