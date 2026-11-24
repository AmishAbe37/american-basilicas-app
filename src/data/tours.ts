import raw from "../../assets/data/tours.json";
import type { Tour, ToursFile } from "./tours.schema";

export type { Badge, StopKind, Tour, TourStop } from "./tours.schema";

// The day tours ship inside the app (assets/data/tours.json, built by tools/build-tours.mjs), so they work offline.
// The shipped file is empty until real tours are ready, so nothing shows in the app until then.
// Development builds, and preview builds made with EXPO_PUBLIC_SAMPLE_TOURS=1, add the clearly labelled
// SAMPLE fixture so the screens can be seen. Store builds never set that variable.
const SHOW_SAMPLES = __DEV__ || process.env.EXPO_PUBLIC_SAMPLE_TOURS === "1";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SAMPLES: Tour[] = SHOW_SAMPLES ? require("../dev/sample-tours").SAMPLE_TOURS : [];

export const TOURS: Tour[] = [...(raw as unknown as ToursFile).tours, ...SAMPLES];
const BY_ID = new Map(TOURS.map((t) => [t.id, t]));
export const tourById = (id: string) => BY_ID.get(id);
export const toursFor = (basilicaId: string) => TOURS.filter((t) => t.basilica_ids.includes(basilicaId));

export const KIND_LABEL: Record<Tour["stops"][number]["kind"], string> = {
  basilica: "Basilica", meal: "Lunch", sight: "Sightseeing", shop: "Gift shop", dinner: "Dinner", other: "Stop",
};
export const BADGE_LABEL: Record<Tour["stops"][number]["badge"], string | null> = {
  algorithm: null,                 // the default pick: no badge shown
  member: "Member approved",
  founder: "Founder tested",
};

/** "14:30" -> "2:30 pm" */
export function clock(hhmm?: string) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ap}` : `${h12} ${ap}`;
}
export function duration(min?: number) {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}
export function lengthLabel(hours: number) {
  const whole = Math.floor(hours), half = hours - whole >= 0.25 && hours - whole < 0.75;
  const n = half ? `${whole}½` : String(Math.round(hours));
  return `About ${n} hours`;
}
