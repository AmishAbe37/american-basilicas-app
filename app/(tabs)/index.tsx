import { router } from "expo-router";
import { useRef } from "react";
import { useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapStateList, { type MapStateListHandle } from "../../src/components/MapStateList";
import ZoomMap, { type ZoomMapHandle } from "../../src/components/ZoomMap";
import { Band, T, Valance } from "../../src/components/ui";
import { BASILICAS, STATE_COUNT, type Basilica } from "../../src/data/basilicas";
import { useVisits } from "../../src/lib/visits";
import { usePicked } from "../../src/lib/usePicked";
import { C } from "../../src/theme";

/** The map above, the state-by-state index below, as the website stacks them on a phone. */
export default function MapScreen() {
  const { visits } = useVisits();
  const mine = visits.size ? new Set(visits.keys()) : undefined;
  const { width, height } = useWindowDimensions();
  // about a third of an upright phone; never so short the country can't be read, nor taller than it needs
  const mapH = Math.round(Math.max(210, Math.min(height * 0.34, width * 0.78)));
  const map = useRef<ZoomMapHandle>(null);
  const list = useRef<MapStateListHandle>(null);
  const pick = usePicked();

  const onState = (state: string, data: Basilica[]) => {
    if (pick.state === state) { pick.set(null, null); map.current?.home(); return; }   // tap again to fold it away
    pick.set(state, null);
    map.current?.fitTo(data);
    list.current?.scrollToState(state);
  };
  const onMarker = (b: Basilica) => {
    pick.set(b.state, b.id);
    list.current?.scrollToBasilica(b);
  };
  const open = (b: Basilica) => router.push({ pathname: "/basilica/[id]", params: { id: b.id } });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.ink }}>
      <Band kicker="Roman Catholic Church in America" title="Basilicas of the" thin="United States" />
      <Valance style={{ marginBottom: -9 }} />
      <View style={{ height: mapH }}>
        <ZoomMap ref={map} visited={mine} selectedId={pick.id} focusState={pick.state} onMarker={onMarker} />
      </View>
      <View style={{ backgroundColor: C.paper2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#d9cba6", paddingHorizontal: 14, paddingVertical: 6 }}>
        <T style={{ fontSize: 12.5, lineHeight: 16, color: C.muted }} numberOfLines={2}>
          <T w="bold" style={{ fontSize: 12.5, color: C.text }}>{BASILICAS.length} minor basilicas</T> in {STATE_COUNT - 1} states and the District of Columbia. Tap a state to find it on the map, or a canopy to find it in the list.
        </T>
      </View>
      <MapStateList ref={list} picked={pick} onState={onState} onOpen={open} visited={mine} />
    </SafeAreaView>
  );
}
