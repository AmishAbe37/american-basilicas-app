import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, useWindowDimensions, View, type ListViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { who, type GPhoto, type Source } from "../../lib/gallery";
import { C } from "../../theme";
import { T } from "../ui";
import { LikeButton } from "./bits";

/** An image from the private bucket. The cache key is the file's path, not the short-lived signed link, so a photo
 *  seen once still shows with no signal (expo-image keeps it on disk). */
export const photoSource = (url: string | undefined, path: string) => (url ? { uri: url, cacheKey: path } : null);

/** Full-screen viewer over a basilica's member photos (the site's lightbox): swipe between them, like them. */
export default function PhotoViewer({ items, start, name, thumbs, src, liked, onLike, onMessage, onClose }: {
  items: GPhoto[]; start: number; name: string; thumbs: Record<string, string>; src: Source;
  liked: Set<string>; onLike: (p: GPhoto, on: boolean) => Promise<void>; onMessage: (t: string) => void; onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [i, setI] = useState(start);
  const [full, setFull] = useState<Record<string, string>>({});
  const list = useRef<FlatList<GPhoto>>(null);
  const p = items[i];

  // full-size links are fetched on demand, as on the site
  useEffect(() => {
    if (!p || full[p.storage_path]) return;
    src.urls([p.storage_path]).then((u) => setFull((f) => ({ ...f, ...u })), () => {});
  }, [p, full, src]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const v = viewableItems[0]; if (v?.index != null) setI(v.index);
  }).current;
  const go = (d: number) => {
    const n = Math.max(0, Math.min(items.length - 1, i + d));
    list.current?.scrollToIndex({ index: n, animated: true }); setI(n);
  };
  const imgH = height * 0.58;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={["portrait", "landscape"]}>
      <SafeAreaView style={s.wrap}>
        <View style={s.top}>
          <T style={s.counter}>{i + 1} of {items.length}</T>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} style={s.x}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>
        <FlatList
          ref={list}
          style={{ flexGrow: 0 }}
          data={items}
          keyExtractor={(x) => x.id}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          initialScrollIndex={start}
          getItemLayout={(_d, idx) => ({ length: width, offset: width * idx, index: idx })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={{ width, height: imgH, justifyContent: "center" }}>
              <Image
                source={photoSource(full[item.storage_path] || thumbs[item.thumb_path], full[item.storage_path] ? item.storage_path : item.thumb_path)}
                placeholder={photoSource(thumbs[item.thumb_path], item.thumb_path)}
                contentFit="contain" transition={150} style={{ width, height: imgH }}
                accessibilityLabel={item.caption || `${name}, photo by ${who(item)}`}
              />
            </View>
          )}
        />
        {p ? (
          <View style={[s.cap, { flex: 1 }]}>
            <View style={{ flex: 1 }}>
              <T style={s.capText}><T w="bold" style={s.capText}>{name}</T> — photo by {who(p)}</T>
              {p.caption ? <T style={[s.capText, { color: "#e9dfc6", marginTop: 3 }]}>{p.caption}</T> : null}
            </View>
            <LikeButton key={p.id} kind="photo" count={p.like_count} liked={liked.has(p.id)} own={p.user_id === src.uid}
              onToggle={(on) => onLike(p, on)} onMessage={onMessage} />
          </View>
        ) : null}
        {items.length > 1 ? (
          <View style={s.nav}>
            <Pressable onPress={() => go(-1)} disabled={i === 0} accessibilityLabel="Previous" hitSlop={8} style={[s.navBtn, i === 0 && { opacity: 0.3 }]}>
              <Ionicons name="chevron-back" size={24} color={C.goldLight} />
            </Pressable>
            <Pressable onPress={() => go(1)} disabled={i === items.length - 1} accessibilityLabel="Next" hitSlop={8} style={[s.navBtn, i === items.length - 1 && { opacity: 0.3 }]}>
              <Ionicons name="chevron-forward" size={24} color={C.goldLight} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0b0907" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  counter: { color: "#cbbf9f", fontSize: 13 },
  x: { padding: 4 },
  cap: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingHorizontal: 16, paddingTop: 12 },
  capText: { color: "#fff", fontSize: 14.5, lineHeight: 20 },
  nav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10 },
  navBtn: { padding: 8, borderWidth: 1, borderColor: "rgba(217,165,33,.5)", borderRadius: 20 },
});
