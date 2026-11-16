import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ZoomMap from "../../src/components/ZoomMap";
import { Band, T, Valance } from "../../src/components/ui";
import { BASILICAS, STATE_COUNT } from "../../src/data/basilicas";
import { useVisits } from "../../src/lib/visits";
import { C } from "../../src/theme";

export default function MapScreen() {
  const { visits } = useVisits();
  const mine = visits.size ? new Set(visits.keys()) : undefined;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band kicker="Roman Catholic Church in America" title="Basilicas of the" thin="United States" />
      <Valance style={{ marginBottom: -9 }} />
      <ZoomMap visited={mine} onOpen={(b) => router.push({ pathname: "/basilica/[id]", params: { id: b.id } })} />
      <View style={{ backgroundColor: C.paper2, borderTopWidth: 1, borderTopColor: C.rule, paddingHorizontal: 14, paddingVertical: 8 }}>
        <T style={{ fontSize: 13, color: C.muted }}>
          <T w="bold" style={{ fontSize: 13, color: C.text }}>{BASILICAS.length} minor basilicas</T> in {STATE_COUNT - 1} states and the District of Columbia. Tap a canopy for its photo and facts; pinch to zoom.
        </T>
      </View>
    </SafeAreaView>
  );
}
