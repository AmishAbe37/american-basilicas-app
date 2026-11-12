// Builds the app's offline data from the website repo, so the app shows exactly what the map shows.
//   node tools/build-data.mjs <path to the american-basilicas website repo>
// Writes assets/data/basilicas.json, assets/data/labels.json and assets/data/zips.json.
// Map coordinates (x, y) are in the website map's 960 x 600 units (d3.geoAlbersUsa, scale 1180),
// the same space as assets/map/basemap.webp.
import fs from "node:fs";
import path from "node:path";
import { geoAlbersUsa, geoPath } from "d3-geo";

const SITE = process.argv[2];
if (!SITE) throw new Error("usage: node tools/build-data.mjs <website repo>");
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "assets", "data");
const lines = fs.readFileSync(path.join(SITE, "index.html"), "utf8").split("\n");
const grab = (name) => {
  const l = lines.find((x) => x.startsWith(`const ${name} = `));
  if (!l) throw new Error(`${name} not found in index.html`);
  return JSON.parse(l.slice(`const ${name} = `.length).replace(/;\s*$/, ""));
};
const MARKERS = grab("MARKERS"), CITIES = grab("CITIES"), PHYSIO = grab("PHYSIO"),
  RIVLAB = grab("RIVLAB"), LAKELAB = grab("LAKELAB"), TOPO = grab("GEO_TOPO");
const credits = JSON.parse(fs.readFileSync(path.join(SITE, "images", "credits.json"), "utf8"));

const W = 960, H = 600;
const projection = geoAlbersUsa().scale(1180).translate([W / 2, H / 2]);
const r1 = (v) => Math.round(v * 10) / 10;

// --- basilicas, with the site's deterministic jitter so same-city basilicas separate
const seen = {};
const basilicas = MARKERS.map((m) => {
  const key = m.lng + "," + m.lat; const i = (seen[key] = seen[key] || 0); seen[key]++;
  const p = projection([m.lng, m.lat]);
  const ang = i * 2.2, rad = i ? 3.0 + i * 1.6 : 0;
  const c = credits[m.ph] || null;
  return {
    id: m.ph, name: m.n, city: m.c, state: m.s, lat: m.lat, lng: m.lng,
    x: p ? r1(p[0] + Math.cos(ang) * rad) : null, y: p ? r1(p[1] + Math.sin(ang) * rad) : null,
    year: m.yr || null, facts: [m.f1, m.f2, m.f3].filter(Boolean),
    wiki: m.wu || null, photoNote: m.pn || null,
    credit: c ? { author: c.author, license: c.license, licenseUrl: c.license_url || null, page: c.page || null } : null,
  };
});
const missingXY = basilicas.filter((b) => b.x == null).map((b) => b.id);
if (missingXY.length) throw new Error("not projected: " + missingXY.join(", "));
if (new Set(basilicas.map((b) => b.id)).size !== basilicas.length) throw new Error("duplicate ids");

// --- labels drawn over the base image
const arcsAbs = (() => { const [sx, sy] = TOPO.transform.scale, [tx, ty] = TOPO.transform.translate;
  return TOPO.arcs.map((a) => { let x = 0, y = 0; return a.map((p) => [(x += p[0]) * sx + tx, (y += p[1]) * sy + ty]); }); })();
const arc = (i) => (i < 0 ? arcsAbs[~i].slice().reverse() : arcsAbs[i]);
const ring = (r) => { const out = []; r.forEach((i, k) => { const a = arc(i); out.push(...(k ? a.slice(1) : a)); }); return out; };
const ringArea = (r) => { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(a / 2); };
const geom = (o) => {
  let g = o.type === "Polygon" ? { type: "Polygon", coordinates: o.arcs.map(ring) } : { type: "MultiPolygon", coordinates: o.arcs.map((p) => p.map(ring)) };
  if (g.type === "Polygon") g.coordinates = g.coordinates.filter((r, i) => i === 0 || ringArea(r) > 1e-7);
  else g.coordinates = g.coordinates.map((p) => p.filter((r, i) => i === 0 || ringArea(r) > 1e-7)).filter((p) => p.length && ringArea(p[0]) > 1e-7);
  return g;
};
const ABBR = JSON.parse(lines.find((l) => l.startsWith("const ABBR=")).slice("const ABBR=".length).replace(/;\s*$/, ""));
const OFFS = JSON.parse(lines.find((l) => l.startsWith("const OFFS=")).slice("const OFFS=".length).replace(/;\s*$/, ""));
const gp = geoPath(projection);
const states = TOPO.objects.s.geometries.filter((o) => o.arcs && o.properties.name !== "Puerto Rico" && ABBR[o.properties.name]).map((o) => {
  const c = gp.centroid({ type: "Feature", geometry: geom(o) }); const off = OFFS[o.properties.name] || [0, 0];
  return { t: ABBR[o.properties.name], x: r1(c[0] + off[0]), y: r1(c[1] + off[1]), lead: !!OFFS[o.properties.name] };
}).filter((s) => Number.isFinite(s.x));
const place = (a) => a.map((d) => { const p = projection([d.lng, d.lat]); return p ? { t: d.t, x: r1(p[0]), y: r1(p[1]), rot: d.rot || 0, ...(d.lake ? { lake: true } : {}) } : null; }).filter(Boolean);
const cities = CITIES.map((c) => { const p = projection([c.lng, c.lat]); return p ? { t: c.t, x: r1(p[0]), y: r1(p[1]), ...(c.dx ? { dx: c.dx } : {}), ...(c.anchor ? { anchor: c.anchor } : {}), ...(c.co ? { co: 1 } : {}) } : null; }).filter(Boolean);
const labels = { states, physio: place(PHYSIO), water: place(RIVLAB.concat(LAKELAB)), cities };

// --- ZIP -> [lat, lng] table (Census 2022 ZCTA Gazetteer, public domain), merged from the site's members/zip files
const zips = {};
for (const f of fs.readdirSync(path.join(SITE, "members", "zip"))) {
  if (!f.endsWith(".json")) continue;
  const pre = f.slice(0, 3), part = JSON.parse(fs.readFileSync(path.join(SITE, "members", "zip", f), "utf8"));
  for (const [k, v] of Object.entries(part)) zips[pre + k] = v;
}

fs.writeFileSync(path.join(OUT, "basilicas.json"), JSON.stringify(basilicas));
fs.writeFileSync(path.join(OUT, "labels.json"), JSON.stringify(labels));
fs.writeFileSync(path.join(OUT, "zips.json"), JSON.stringify(zips));
console.log("basilicas", basilicas.length, "| states", states.length, "physio", labels.physio.length, "water", labels.water.length, "cities", cities.length, "| zips", Object.keys(zips).length);
