import raw from "../../assets/data/basilicas.json";

export type Credit = { author: string; license: string; licenseUrl: string | null; page: string | null };
export type Basilica = {
  id: string; name: string; city: string; state: string; lat: number; lng: number;
  x: number; y: number; year: number | null; facts: string[]; wiki: string | null; commons: string | null;
  photoNote: string | null; credit: Credit | null;
};

export const BASILICAS = raw as unknown as Basilica[];
const BY_ID = new Map(BASILICAS.map((b) => [b.id, b]));
export const byId = (id: string) => BY_ID.get(id);

/** State sections, alphabetical, basilicas alphabetical by city then name (as on the site's index). */
export const BY_STATE = (() => {
  const m = new Map<string, Basilica[]>();
  for (const b of BASILICAS) m.set(b.state, [...(m.get(b.state) || []), b]);
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, list]) => ({
      state,
      data: list.slice().sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    }));
})();

export const STATE_COUNT = BY_STATE.length;
