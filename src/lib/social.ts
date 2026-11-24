import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { providers } from "./config";
import { sb } from "./supabase";

// Sign in with Google or Apple, through the website's Supabase project, so the account is the same one the website
// uses. (Supabase links a Google or Apple sign-in to an existing account with the same email address.)
//
// - Google, everywhere, and Apple on Android: Supabase's browser sign-in. The phone's secure browser sheet opens
//   Google's (or Apple's) page; Supabase sends it back to the app with a one-time code, which the app swaps for a
//   session (PKCE). Works in Expo Go and in real builds.
// - Apple on iPhone: Apple's own sign-in sheet (expo-apple-authentication), then Supabase checks Apple's signed ID
//   token. Apple asks apps to use its native button on iOS. Works in Expo Go too, once Expo Go's ID
//   (host.exp.Exponent) is in Supabase's list of Apple client IDs.

WebBrowser.maybeCompleteAuthSession();          // web only: finishes the sign-in in the popup

export class Cancelled extends Error {}

/** Where Supabase sends the browser back to: americanbasilicas://auth-callback in a build, an exp:// address in
 *  Expo Go. Every one of these must be allowed in Supabase (Authentication → URL Configuration → Redirect URLs). */
export const redirectUri = () => Linking.createURL("auth-callback");

/** Finish a browser sign-in from the address Supabase sent back. Returns false if there's no code in it. */
export async function finishFromUrl(url: string) {
  const { queryParams } = Linking.parse(url);
  const q = (queryParams || {}) as Record<string, string | undefined>;
  if (q.error || q.error_description) throw new Error(q.error_description || q.error);
  if (!q.code) return false;
  const { error } = await sb.auth.exchangeCodeForSession(String(q.code));
  if (error) throw error;
  return true;
}

async function browser(provider: "google" | "apple") {
  const redirectTo = redirectUri();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider, options: { redirectTo, skipBrowserRedirect: true, ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}) },
  });
  if (error) throw error;
  const url = data.url;
  if (!url) throw new Error("Sign-in didn’t start.");
  const r = await WebBrowser.openAuthSessionAsync(url, redirectTo);
  if (r.type !== "success") throw new Cancelled();
  if (!(await finishFromUrl(r.url))) throw new Error("Sign-in didn’t finish.");
}

export const signInWithGoogle = () => browser("google");

/** On iPhone, Apple's button is the only one Apple allows, and it's drawn by the system. */
export const appleNative = Platform.OS === "ios";
export async function appleNativeAvailable() {
  if (!appleNative) return false;
  try { return await AppleAuthentication.isAvailableAsync(); } catch { return false; }
}

export async function signInWithApple() {
  if (!appleNative) return browser("apple");
  // a fresh nonce: Apple puts its hash in the signed token, Supabase checks it against the raw value
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  let cred: AppleAuthentication.AppleAuthenticationCredential;
  try {
    cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED") throw new Cancelled();
    throw e;
  }
  if (!cred.identityToken) throw new Error("Apple didn’t return a sign-in token.");
  const { data, error } = await sb.auth.signInWithIdToken({ provider: "apple", token: cred.identityToken, nonce: raw });
  if (error) throw error;
  const user = data.user;

  // Apple gives the name only the first time. The website's new-account rule names a profile from the name it's given
  // (first name, else "Pilgrim"); a token sign-in arrives without one, so fill it in the same way, once.
  const given = cred.fullName?.givenName?.trim(), family = cred.fullName?.familyName?.trim();
  if (user && given) {
    try {
      await sb.auth.updateUser({ data: { full_name: [given, family].filter(Boolean).join(" "), given_name: given, family_name: family || null } });
      await sb.from("profiles").update({ display_name: given.slice(0, 40) }).eq("id", user.id).eq("display_name", "Pilgrim");
    } catch {}                                   // the name is a nicety; the sign-in already worked
  }
}

/** Which buttons to show on this phone. */
export function socialButtons() {
  return {
    google: providers.google,
    apple: providers.apple && (Platform.OS === "ios" || providers.appleOnAndroid),
  };
}
