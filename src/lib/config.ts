// Switches for features that need setup with outside services before they can be shown.

/** Sign-in with Google and Apple, next to the email code. Keep them off until the provider setup is finished
 *  (see the pull request "Sign in with Google and Apple" for the steps):
 *  - google: Supabase already has Google from the website; the app also needs its redirect addresses allowed.
 *  - apple: on iPhone, Apple's own button (signs in on the phone). Needs the paid Apple Developer account.
 *  - appleOnAndroid: Apple through the browser on Android. Optional: Apple's rule applies only to the App Store,
 *    and this route needs a Services ID and a secret that must be renewed every 6 months. */
export const SIGNIN_PROVIDERS = { google: false, apple: false, appleOnAndroid: false };

/** Dev-only: `EXPO_PUBLIC_PREVIEW_SIGNIN_PROVIDERS=1 npx expo export -p web` shows the buttons for screenshots.
 *  Never set it for a store build or a preview update. */
const PREVIEW = process.env.EXPO_PUBLIC_PREVIEW_SIGNIN_PROVIDERS === "1";
export const providers = PREVIEW ? { google: true, apple: true, appleOnAndroid: true } : SIGNIN_PROVIDERS;
