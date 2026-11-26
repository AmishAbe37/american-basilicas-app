# Privacy policy wording for Google and Apple sign-in in the app (draft)

**Status:** approved as a draft on Nov 25, 2026. Do **not** publish this until the sign-in switches in
`src/lib/config.ts` (`SIGNIN_PROVIDERS`) are turned on for a store release. Then add it to the website's
`privacy.html` and update the store privacy answers (see "Store answers" below).

The website's policy already covers "Continue with Google" on the website: Google shares the name, email address and
profile picture, and the first word of the Google name becomes the starting display name. The additions below extend
that to the app and add Sign in with Apple.

## 1. Under "If you create a member account", after the "If you use Google" bullet

> **If you use Apple:** Sign in with Apple shares your email address with our sign-in service, and the first time you
> sign in it can also share your name, if you choose to. If you choose "Hide My Email", Apple gives us a private
> relay address instead of your real one, and our sign-in emails reach you through Apple. We use your first name, if
> Apple shares it, as your starting display name. Because memberships are matched by email address, a Buy Me a Coffee
> membership paid for with your real email address won't be found for a hidden-email account; email us and we'll link
> it.

And change the first bullet's sign-in list to:

> ...with a link or 6-digit code that we email you, with "Continue with Google", or in the iPhone app with "Sign in
> with Apple".

## 2. In "If you use the American Basilicas app", a new bullet

> **Signing in with Google or Apple.** In the app, "Continue with Google" opens Google's sign-in page in your phone's
> browser and works as described above. On iPhone, "Sign in with Apple" uses Apple's own sign-in sheet. Either way you
> get the same account as on the website if the email address matches.

## 3. Under "Services that help run the site"

> **Apple** handles "Sign in with Apple" in the iPhone app, only if you choose it, under
> [Apple's privacy policy](https://www.apple.com/legal/privacy/).

## Store answers to change at the same time

- **Apple App Privacy:** Contact Info > **Name**: collected, linked to the user, App Functionality.
- **Google Play Data safety:** Personal info > **Name**: collected, not shared, optional, App functionality and Account
  management. Account creation: add **OAuth**.
- See `privacy-labels.md` for the rest of the answers.

## Also pending

- **Data controller name.** The policy names "American Basilicas" as the data controller. Once the LLC that will
  enroll in the app stores is formed, use its legal name there, for example "American Basilicas LLC", to match the
  seller name on the App Store and Google Play.
