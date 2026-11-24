import { useLocalSearchParams } from "expo-router";
import { GalleryBasilicaScreen } from "../../src/components/gallery/GalleryBasilica";
import type { Tab } from "../../src/lib/gallery";

/** /gallery/<basilica id>?t=reviews|questions — one basilica in the members' gallery. */
export default function GalleryBasilica() {
  const { id, t } = useLocalSearchParams<{ id: string; t?: string }>();
  const tab = t === "reviews" || t === "questions" ? (t as Tab) : "photos";
  return <GalleryBasilicaScreen id={String(id)} tab={tab} />;
}
