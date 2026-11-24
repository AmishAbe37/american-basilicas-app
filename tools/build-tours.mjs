// Checks the day tours and writes them into the app, so they ship inside it and work with no signal.
//   node tools/build-tours.mjs <tours.csv | tours.json>          check, then write assets/data/tours.json
//   node tools/build-tours.mjs <tours.csv | tours.json> --check  check only; write nothing
// The format is described in docs/tours-format.md and src/data/tours.schema.ts (the rules live there).
// A CSV has one row per stop; the tour's own columns may be filled on its first row only.
import fs from "node:fs";
import path from "node:path";
// The rules are TypeScript, shared with the app; Node strips the types. Hide Node's one-line notice about that.
process.removeAllListeners("warning");
const { checkTours, KIND_ALIASES } = await import("../src/data/tours.schema.ts");

const TOUR_COLS = ["tour_id", "tour_title", "basilica_ids", "city", "state", "intro", "best_days", "best_hours", "length_hours", "checked_on"];
const STOP_COLS = ["stop_order", "kind", "name", "address", "lat", "lng", "time", "minutes", "note", "hours", "basilica_id", "badge",
  "backup_name", "backup_address", "backup_lat", "backup_lng", "backup_note"];
const REQUIRED = ["tour_id", "stop_order", "kind", "name", "address", "lat", "lng"];

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const checkOnly = args.includes("--check");
if (!input) {
  console.error("usage: node tools/build-tours.mjs <tours.csv | tours.json> [--check]");
  process.exit(2);
}

// --- read
const text = fs.readFileSync(input, "utf8").replace(/^﻿/, "");
let tours;
try {
  tours = input.toLowerCase().endsWith(".json") ? fromJson(text) : fromCsv(text);
} catch (e) {
  console.error(`Couldn't read ${input}: ${e.message}`);
  process.exit(1);
}

// --- check
const basilicas = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/data/basilicas.json"), "utf8"));
const { errors, warnings } = checkTours(tours, new Set(basilicas.map((b) => b.id)));
for (const w of warnings) console.warn(`  note: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} to fix in ${path.basename(input)}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
const stops = tours.reduce((n, t) => n + t.stops.length, 0);
console.log(`OK: ${tours.length} tour${tours.length === 1 ? "" : "s"}, ${stops} stops.`);

// --- write
if (!checkOnly) {
  tours.sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city) || a.title.localeCompare(b.title));
  const ORDER = ["id", "title", "basilica_ids", "city", "state", "intro", "best_days", "best_hours", "length_hours", "checked_on", "stops"];
  const tidy = (t) => Object.fromEntries(ORDER.filter((k) => t[k] !== undefined).map((k) => [k, t[k]]));
  const out = { version: 1, generated: new Date().toISOString().slice(0, 10), tours: tours.map(tidy) };
  const file = path.join(ROOT, "assets/data/tours.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  console.log(`Wrote ${path.relative(ROOT, file)}`);
}

// ---------------------------------------------------------------------------------------------------------

function fromJson(src) {
  const j = JSON.parse(src);
  const list = Array.isArray(j) ? j : j.tours;
  if (!Array.isArray(list)) throw new Error('expected a list of tours, or { "tours": [...] }');
  return list.map((t) => ({ ...t, stops: (t.stops || []).map((s) => ({ ...s, kind: kind(s.kind), badge: s.badge || "algorithm" })) }));
}

/** RFC 4180 CSV: commas, "quoted, fields", doubled "" quotes, line breaks inside quotes. */
function parseCsv(src) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (q) throw new Error("a quoted field is never closed");
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

function fromCsv(src) {
  const [head, ...rows] = parseCsv(src);
  if (!head) throw new Error("the file is empty");
  const cols = head.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  for (const c of REQUIRED) if (!cols.includes(c)) throw new Error(`the header row has no "${c}" column`);
  const unknown = cols.filter((c) => c && !TOUR_COLS.includes(c) && !STOP_COLS.includes(c));
  if (unknown.length) throw new Error(`unknown column${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`);

  const byId = new Map();
  rows.forEach((r, n) => {
    const line = n + 2;
    const v = (c) => { const i = cols.indexOf(c); return i < 0 ? "" : (r[i] ?? "").trim(); };
    const id = v("tour_id");
    if (!id) throw new Error(`row ${line} has no tour_id`);
    let t = byId.get(id);
    if (!t) { t = { id, stops: [] }; byId.set(id, t); }
    // tour columns: first non-empty value wins; a different value later is a mistake
    const set = (key, col, val) => {
      if (val === undefined || val === "") return;
      if (t[key] !== undefined && JSON.stringify(t[key]) !== JSON.stringify(val))
        throw new Error(`row ${line}: ${col} differs from an earlier row of tour "${id}"`);
      t[key] = val;
    };
    set("title", "tour_title", v("tour_title"));
    set("basilica_ids", "basilica_ids", v("basilica_ids") ? v("basilica_ids").split(/[|;]/).map((x) => x.trim()).filter(Boolean) : undefined);
    set("city", "city", v("city"));
    set("state", "state", v("state"));
    set("intro", "intro", v("intro"));
    set("best_days", "best_days", v("best_days"));
    set("best_hours", "best_hours", v("best_hours"));
    set("length_hours", "length_hours", num(v("length_hours"), line, "length_hours"));
    set("checked_on", "checked_on", v("checked_on"));

    const stop = {
      order: num(v("stop_order"), line, "stop_order"),
      kind: kind(v("kind"), line),
      name: v("name"),
      address: v("address"),
      lat: num(v("lat"), line, "lat"),
      lng: num(v("lng"), line, "lng"),
      badge: v("badge").toLowerCase() || "algorithm",
    };
    const opt = { time: time(v("time"), line), minutes: num(v("minutes"), line, "minutes"), note: v("note"), hours: v("hours"), basilica_id: v("basilica_id") };
    for (const [k, x] of Object.entries(opt)) if (x !== undefined && x !== "") stop[k] = x;
    if (["backup_name", "backup_address", "backup_lat", "backup_lng", "backup_note"].some((c) => v(c))) {
      stop.backup = { name: v("backup_name"), address: v("backup_address"), lat: num(v("backup_lat"), line, "backup_lat"), lng: num(v("backup_lng"), line, "backup_lng") };
      if (v("backup_note")) stop.backup.note = v("backup_note");
    }
    t.stops.push(stop);
  });
  for (const t of byId.values()) t.stops.sort((a, b) => a.order - b.order);
  return [...byId.values()];
}

function num(s, line, col) {
  if (s === "") return undefined;
  const n = Number(s.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`row ${line}: ${col} "${s}" is not a number`);
  return n;
}
function kind(s, line) {
  const k = KIND_ALIASES[String(s || "").trim().toLowerCase()];
  if (!k) throw new Error(`${line ? `row ${line}: ` : ""}kind "${s}" is not one of basilica, meal, sight, shop, dinner, other`);
  return k;
}
/** "9:30", "09:30", "2:00 pm", "14:00" -> "HH:MM" */
function time(s, line) {
  if (!s) return undefined;
  const m = s.toLowerCase().replace(/\./g, "").match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) throw new Error(`row ${line}: time "${s}" should look like 11:30 or 2:00 pm`);
  let h = Number(m[1]);
  const min = m[2] || "00";
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}
