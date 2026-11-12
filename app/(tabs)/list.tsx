import { useMemo, useState } from "react";
import { SectionList, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasilicaRow from "../../src/components/BasilicaRow";
import { Band, Paper, T, Valance } from "../../src/components/ui";
import { BY_STATE } from "../../src/data/basilicas";
import { C, F } from "../../src/theme";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
      <Band title="State by state" />
      <Valance style={{ marginBottom: -9 }} />
      <Paper>
        <View style={s.searchWrap}>
          <TextInput value={q} onChangeText={setQ} placeholder="Search by name, city or state" placeholderTextColor={C.muted}
            style={s.search} clearButtonMode="while-editing" autoCorrect={false} returnKeyType="search" />
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BasilicaRow b={item} />}
          renderSectionHeader={({ section }) => (
            <View style={s.header}>
              <T w="bold" style={{ fontSize: 15, color: C.red, letterSpacing: 0.4 }}>{section.state}</T>
              <T w="bold" style={s.count}>{section.data.length}</T>
            </View>
          )}
          ListEmptyComponent={<T style={{ padding: 20, color: C.muted }}>No basilica matches “{q}”.</T>}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
        />
      </Paper>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  searchWrap: { padding: 12, paddingTop: 16 },
  search: { fontFamily: F.regular, fontSize: 16, color: C.text, backgroundColor: "#fffdf8", borderWidth: 1, borderColor: C.rule, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.paper2, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.rule },
  count: { fontSize: 12, color: "#fff", backgroundColor: C.red, minWidth: 22, textAlign: "center", borderRadius: 11, paddingHorizontal: 6, overflow: "hidden" },
});
