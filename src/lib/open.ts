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
