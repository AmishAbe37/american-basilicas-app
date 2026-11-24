import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { Basilica } from "../data/basilicas";

/** Hands directions to the phone's own maps app (Apple Maps on iPhone, Google Maps on Android). */
export function openDirections(b: Basilica) {
  const label = encodeURIComponent(`${b.name}, ${b.city}, ${b.state}`);
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${b.lat},${b.lng}&q=${label}`,
    android: `geo:0,0?q=${b.lat},${b.lng}(${label})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`,
  })!;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`)
  );
}

export const openWeb = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));

// --- Day tours: directions and rides to any stop -------------------------------------------------------

export type Place = { name: string; address?: string; lat: number; lng: number };

/** Directions to any place, in the phone's own maps app, as openDirections does for a basilica. */
export function openDirectionsTo(p: Place) {
  const label = encodeURIComponent(p.address ? `${p.name}, ${p.address}` : p.name);
  const web = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${label}`,
    android: `geo:0,0?q=${p.lat},${p.lng}(${label})`,
    default: web,
  })!;
  Linking.openURL(url).catch(() => Linking.openURL(web));
}

export type RideApp = "uber" | "lyft";

/**
 * Ride links with the drop-off filled in; pickup is left to the ride app (your current location).
 * Uber: developer.uber.com/docs/deep-linking (action=setPickup, dropoff[latitude] etc.; the m.uber.com/ul/
 *   universal link opens the app when it's installed, otherwise Uber's mobile website).
 * Lyft: the official Lyft SDK (github.com/lyft/lyft-iOS-sdk, LyftDeepLink.swift): lyft://ridetype?id=lyft with
 *   destination[latitude]/[longitude]; web fallback https://ride.lyft.com/u with the same parameters.
 * No client id or partner id is needed for either; one can be added later for attribution.
 */
export function rideLinks(app: RideApp, p: Place) {
  const e = encodeURIComponent;
  if (app === "uber") {
    const q = `action=setPickup&dropoff[latitude]=${p.lat}&dropoff[longitude]=${p.lng}` +
      `&dropoff[nickname]=${e(p.name)}` + (p.address ? `&dropoff[formatted_address]=${e(p.address)}` : "");
    return { app: `uber://?${q}`, web: `https://m.uber.com/ul/?${q}` };
  }
  const q = `id=lyft&destination[latitude]=${p.lat}&destination[longitude]=${p.lng}`;
  return { app: `lyft://ridetype?${q}`, web: `https://ride.lyft.com/u?${q}` };
}

/** Opens Uber or Lyft with the drop-off set; if the app isn't installed, their website. */
export function openRide(app: RideApp, p: Place) {
  const { app: deep, web } = rideLinks(app, p);
  if (Platform.OS === "web") return Linking.openURL(web);
  return Linking.openURL(deep).catch(() => Linking.openURL(web));
}

export const SHOP_URL = "https://americanbasilicas.myshopify.com/collections/all";
