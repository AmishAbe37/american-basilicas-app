// The day-tour data format: one tour per basilica (or per group of basilicas), each a timeline of stops.
// Written by the tours Project as a spreadsheet (CSV, one row per stop) or as JSON, then checked and converted by
//   node tools/build-tours.mjs <tours.csv | tours.json>
// into assets/data/tours.json, which ships inside the app so tours work with no signal.
// The plain-English description for the tours Project is docs/tours-format.md. Keep the two in step.
//
// This file has no imports, so tools/build-tours.mjs can load it directly with Node (type stripping):
// the app and the build script check tours with the same rules.

export const STOP_KINDS = ["basilica", "meal", "sight", "shop", "dinner", "other"] as const;
export type StopKind = (typeof STOP_KINDS)[number];

/** How a stop was chosen. "member" (members voted yes) and "founder" (Abraham tried it) come later. */
export const BADGES = ["algorithm", "member", "founder"] as const;
export type Badge = (typeof BADGES)[number];

/** A fallback for a stop: the basilica's own shop is closed, so a Catholic gift shop; the restaurant is full, and so on. */
export type Backup = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  note?: string;
};

export type TourStop = {
  order: number;               // 1, 2, 3… in the order the visitor goes
  kind: StopKind;
  name: string;
  address: string;
  lat: number;
  lng: number;
  time?: string;               // suggested arrival, 24-hour "HH:MM", local time (e.g. "11:30")
  minutes?: number;            // suggested time to spend there
  note?: string;               // a sentence or two: what to see, what to order, why it's here
  hours?: string;              // opening hours as text, e.g. "Mon–Sat 10 am–6 pm; closed Sunday"
  basilica_id?: string;        // for kind "basilica": which basilica (needed when the tour has more than one)
  badge: Badge;
  backup?: Backup;
};

export type Tour = {
  id: string;                  // lowercase-with-dashes, e.g. "san-antonio-day"; never changes once published
  title: string;
  basilica_ids: string[];      // ids from assets/data/basilicas.json; the tour appears on each of their pages
  city: string;
  state: string;
  intro: string;
  best_days: string;           // e.g. "Tuesday to Saturday (the basilica shop is closed Mondays)"
  best_hours: string;          // the basilica's open hours and Mass times that shape the day
  length_hours: number;        // estimated length of the whole day, in hours (e.g. 7.5)
  checked_on?: string;         // "YYYY-MM-DD": when hours and stops were last checked
  stops: TourStop[];
  sample?: boolean;            // only the dev-only fixture sets this; the build script refuses it
};

export type ToursFile = { version: 1; generated: string | null; tours: Tour[] };

/** Accepts a few spellings a spreadsheet might use for the stop kinds. */
export const KIND_ALIASES: Record<string, StopKind> = {
  basilica: "basilica", church: "basilica",
  meal: "meal", lunch: "meal", breakfast: "meal", coffee: "meal",
  sight: "sight", sightseeing: "sight",
  shop: "shop", "gift shop": "shop", giftshop: "shop", "gift-shop": "shop",
  dinner: "dinner",
  other: "other",
};

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const inUS = (lat: unknown, lng: unknown) =>
  typeof lat === "number" && typeof lng === "number" && lat >= 17 && lat <= 72 && lng >= -180 && lng <= -60;
const str = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * Checks tours against the format. Returns a list of problems in plain English (empty when all is well)
 * and a list of warnings that don't stop the build.
 * `basilicaIds` is the set of ids in assets/data/basilicas.json.
 * `allowSample` is only for the dev fixture.
 */
export function checkTours(
  tours: Tour[],
  basilicaIds: Set<string>,
  allowSample = false,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const t of tours) {
    const at = `Tour "${t?.id ?? "?"}"`;
    if (!t || typeof t !== "object") { errors.push("A tour is empty."); continue; }
    if (!str(t.id) || !ID_RE.test(t.id)) errors.push(`${at}: tour_id must be lowercase letters, numbers and dashes.`);
    if (seen.has(t.id)) errors.push(`${at}: the same tour_id is used twice.`);
    seen.add(t.id);
    if (!allowSample && (t.sample || /^sample/i.test(t.id) || /^sample/i.test(t.title || "")))
      errors.push(`${at}: sample tours belong only in the dev fixture, not in the app's data.`);
    for (const k of ["title", "city", "state", "intro", "best_days", "best_hours"] as const)
      if (!str(t[k])) errors.push(`${at}: ${k} is missing.`);
    if (typeof t.length_hours !== "number" || !(t.length_hours > 0 && t.length_hours <= 16))
      errors.push(`${at}: length_hours must be a number of hours between 0 and 16.`);
    if (t.checked_on !== undefined && !DATE_RE.test(String(t.checked_on)))
      errors.push(`${at}: checked_on must look like 2026-11-24.`);
    if (!Array.isArray(t.basilica_ids) || t.basilica_ids.length === 0)
      errors.push(`${at}: basilica_ids needs at least one basilica.`);
    else for (const b of t.basilica_ids)
      if (!basilicaIds.has(b)) errors.push(`${at}: "${b}" is not a basilica id in the app's list.`);

    if (!Array.isArray(t.stops) || t.stops.length === 0) { errors.push(`${at}: it has no stops.`); continue; }
    const orders = t.stops.map((s) => s.order);
    if (orders.some((o, i) => o !== i + 1))
      errors.push(`${at}: stops must be numbered 1, 2, 3… with no gaps (found ${orders.join(", ")}).`);
    let lastTime = "";
    const visited = new Set<string>();
    for (const s of t.stops) {
      const sa = `${at}, stop ${s?.order ?? "?"}`;
      if (!STOP_KINDS.includes(s.kind)) errors.push(`${sa}: kind must be one of ${STOP_KINDS.join(", ")}.`);
      if (!BADGES.includes(s.badge)) errors.push(`${sa}: badge must be one of ${BADGES.join(", ")}.`);
      if (!str(s.name)) errors.push(`${sa}: name is missing.`);
      if (!str(s.address)) errors.push(`${sa}: address is missing.`);
      if (!inUS(s.lat, s.lng)) errors.push(`${sa}: lat/lng are missing or not in the United States.`);
      if (s.time !== undefined) {
        if (!TIME_RE.test(s.time)) errors.push(`${sa}: time must be 24-hour HH:MM, like 09:30 or 14:00.`);
        else if (lastTime && s.time < lastTime) warnings.push(`${sa}: its time (${s.time}) is earlier than the stop before.`);
        else lastTime = s.time;
      }
      if (s.minutes !== undefined && !(Number.isInteger(s.minutes) && s.minutes > 0 && s.minutes <= 600))
        errors.push(`${sa}: minutes must be a whole number of minutes.`);
      if (!allowSample && /^sample/i.test(s.name || "")) errors.push(`${sa}: "${s.name}" looks like a sample stop.`);
      if (s.kind === "basilica") {
        const bid = s.basilica_id ?? (t.basilica_ids?.length === 1 ? t.basilica_ids[0] : undefined);
        if (!bid) errors.push(`${sa}: this tour has several basilicas, so basilica stops need basilica_id.`);
        else if (!t.basilica_ids?.includes(bid)) errors.push(`${sa}: basilica_id "${bid}" is not in the tour's basilica_ids.`);
        else visited.add(bid);
      } else if (s.basilica_id) warnings.push(`${sa}: basilica_id is only used on basilica stops.`);
      if (s.backup) {
        const b = s.backup;
        if (!str(b.name) || !str(b.address) || !inUS(b.lat, b.lng))
          errors.push(`${sa}: the backup needs a name, an address and lat/lng (or leave all backup columns empty).`);
      }
    }
    for (const b of t.basilica_ids || [])
      if (basilicaIds.has(b) && !visited.has(b)) warnings.push(`${at}: it lists "${b}" but has no basilica stop for it.`);
  }
  return { errors, warnings };
}
