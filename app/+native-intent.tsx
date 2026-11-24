// Incoming links. Google or Apple sign-in in the browser comes back to americanbasilicas://auth-callback?code=…
// While the app is open, the browser sheet that started the sign-in picks the code up itself (src/lib/social.ts),
// so the router should stay where it is. If the phone had closed the app meanwhile, the auth-callback screen
// finishes the sign-in instead.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (/auth-callback/.test(path)) return initial ? path : "";
    return path;
  } catch {
    return "/";
  }
}
