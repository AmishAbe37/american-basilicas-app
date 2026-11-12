import zips from "../../assets/data/zips.json";
import { BASILICAS, type Basilica } from "../data/basilicas";

const Z = zips as unknown as Record<string, [number, number]>;

/** ZIP lookups stay on the phone: the table ships with the app, nothing is sent anywhere. */
export function zipToLatLng(zip: string): [number, number] | null {
  const z = zip.trim().slice(0, 5);
  return /^\d{5}$/.test(z) && Z[z] ? Z[z] : null;
}

export function miles(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearest(lat: number, lng: number, n = 12): { b: Basilica; mi: number }[] {
  return BASILICAS.map((b) => ({ b, mi: miles(lat, lng, b.lat, b.lng) }))
    .sort((a, b) => a.mi - b.mi)
    .slice(0, n);
}

export const fmtMiles = (mi: number) => (mi < 10 ? mi.toFixed(1) : Math.round(mi).toLocaleString("en-US")) + " mi";
