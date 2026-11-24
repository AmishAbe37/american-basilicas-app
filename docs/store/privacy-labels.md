# Privacy answers: Apple App Privacy and the Google Play Data safety form

**DRAFT, waiting for Abraham's approval.** These answers come from reading the app's code on `main`
(`src/lib/auth.tsx`, `src/lib/visits.tsx`, `src/lib/supabase.ts`, `app/(tabs)/near.tsx`, `src/components/VisitPanel.tsx`,
`app.json`) and the website's privacy policy (https://americanbasilicas.org/privacy.html, last updated November 5, 2026).
Re-check them whenever a feature is merged. The notes marked **when merged** say which answers change.

## What the app actually sends off the phone

| Data | Where it goes | Code |
|---|---|---|
| Email address | Supabase Auth, to send the 6-digit code and sign in | `auth.tsx` `signInWithOtp` / `verifyOtp` |
| Account ID and display name | Supabase (`profiles`). The display name is shown to other signed-in members | `auth.tsx` |
| Visits: basilica, date, private note | Supabase (`visits`), private to the member under the RLS rules | `visits.tsx` |
| Visit photos (2,000 px and 480 px JPEGs, re-encoded so GPS and camera EXIF are stripped) | Supabase Storage `member-photos`, private, and reviewed for the members' gallery | `visits.tsx` `addPhotos` |
| Sign-in records (time, IP address, user agent) | Kept by Supabase Auth (already in privacy.html) | n/a |
| Random install ID, app and runtime version, update IDs, launch-error text (up to 1,024 characters), IP address | **Expo (EAS Update)**, because `expo-updates` is configured (`updates.url` in app.json) and checks for updates | `app.json` |

**What stays on the phone and is not "collected":**
- Location and ZIP code for Near you. The distance is worked out on the phone (`geo.ts`), the ZIP table ships with the
  app, and nothing is sent (`near.tsx`).
- The sign-in session, plus cached copies of visits and photo records and the offline outbox, in AsyncStorage and the
  app's documents folder. These are not "collected" until they're sent to Supabase, and that's covered by the rows above.
- Camera and photo library contents. Only the photos you pick are re-encoded and uploaded.

**What is not collected:** no analytics SDK, no ads, no tracking and no crash reporter of our own (no Sentry and so on).
The only crash-type data comes from EAS Update, as shown above. **So the brief's "crash data: none" isn't quite right while
expo-updates is in the app.** Expo's own store guide says to declare it.

---

## Apple: App Store Connect > App Privacy

**Do you or your third-party partners collect data from this app?** Yes.

**Tracking:** No. Nothing is linked with third-party data for advertising, and nothing goes to data brokers.
(The privacy manifest in app.json says `NSPrivacyTracking: false` to match.)

| Data type | Collected? | Linked to the user? | Used for tracking? | Purposes | Notes |
|---|---|---|---|---|---|
| Contact Info > **Email Address** | Yes | Yes | No | App Functionality | Sign-in. Never shown to other members. |
| Contact Info > Name | **No** (today) | | | | **When merged:** the Google or Apple sign-in branch gives Supabase the person's name. Then declare Name: Linked, App Functionality. |
| Identifiers > **User ID** | Yes | Yes | No | App Functionality | Account ID, plus the display name ("screen name" is in Apple's User ID definition). |
| Identifiers > **Device ID** | Yes | **No** | No | App Functionality, Analytics | The EAS Update install ID. It's random per install and Expo says it's not linked to the user. If we ever send it to our own backend with an account, change this to Linked. |
| User Content > **Photos or Videos** | Yes | Yes | No | App Functionality | Visit photos. |
| User Content > **Other User Content** | Yes | Yes | No | App Functionality | Visit dates, private notes, photo captions. **When merged:** gallery reviews, questions, answers and likes belong here too. |
| Diagnostics > **Crash Data** | Yes | **No** | No | App Functionality | EAS Update launch-error text and failed update IDs. |
| Location (Precise or Coarse) | **No** | | | | Used only on the phone and never sent. Apple's "collect" means "transmitting data off the device". |
| Purchases > Purchase History | **No** | | | | The app sends nothing about purchases. **When merged:** the order-history screen shows Shopify orders fetched by the `account` edge function and doesn't store them. The membership status comes from Buy Me a Coffee's webhook on the website. If you prefer to be conservative, declare Purchase History: Linked, App Functionality. It does no harm. |
| Usage Data, Health, Financial, Contacts, Browsing, Search, Sensitive Info, Other | No | | | | |

**When merged, the reminders branch:** if push notifications are added, Expo's push token is a Device ID and is stored
against the account, so it becomes **Linked**. Re-check then.

## Google Play: Play Console > Policy > App content > Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all of the user data collected by your app encrypted in transit?** Yes. Supabase and Expo are HTTPS only.
**Do you provide a way for users to request that their data is deleted?** Yes. In the app once the account branch is merged,
and on the web at https://americanbasilicas.org/privacy.html#keep (add the draft paragraph below first).
**Account creation:** "Username and other authentication" (email plus one-time code). Add "OAuth" if Google or Apple sign-in is merged.
**Account deletion URL:** https://americanbasilicas.org/privacy.html#keep

"Shared" means given to a third party. Supabase, Resend and Expo process data for us as **service providers**, so that
is not sharing. Photos and reviews shown to other members are posted at the member's own request and reviewed first.
Google treats user-initiated transfers like that as not "sharing", so every row below is **Not shared**.

| Data type | Collected | Shared | Ephemeral? | Required or optional | Purposes |
|---|---|---|---|---|---|
| Personal info > **Email address** | Yes | No | No | Optional (the app works without an account) | App functionality, Account management |
| Personal info > **User IDs** | Yes | No | No | Optional | App functionality, Account management |
| Personal info > Name | No (today) | | | | **When merged:** Google or Apple sign-in, then Yes: App functionality, Account management |
| Photos and videos > **Photos** | Yes | No | No | Optional | App functionality |
| App activity > **Other user-generated content** | Yes | No | No | Optional | App functionality |
| App info and performance > **Crash logs** | Yes | No | No | Required | Analytics (Expo's guidance) |
| Device or other IDs | Yes | No | No | Required | App functionality, Analytics (Expo's guidance) |
| Location (approximate or precise) | **No** | | | | Processed on the phone only. Google: data processed only on the device doesn't need to be disclosed. |
| Financial info > Purchase history | No | | | | Same reasoning as Apple above. |

---

## Gaps in privacy.html for the app (not applied to the website)

privacy.html is written for "this website". Before either store submission, it needs to:
1. **Say it covers the app.** Apple and Google both link to it as the app's policy.
2. **Name Expo** as a service provider, and say what EAS Update receives (a random install ID, app version, launch errors, IP address).
3. **Describe storage on the phone.** The session, cached visits and photos, and changes waiting for signal are kept on the phone.
   Signing out keeps unsent changes for when you sign in again, and deleting the app removes everything it stored.
   (The code keys cached data by account, `ab.visits.<user id>`, and keeps it after sign-out, so this sentence is accurate.)
4. **Cover camera and photo access.** The app asks permission and only uses the photos you pick. Re-encoding happens on the phone.
   The current text says "your browser resizes it".
5. **Give a deletion path that works without the app**, naming the app, for Google's account-deletion web link.
6. **When merged:** push notifications (reminders), and Sign in with Apple if added (Apple's private-relay email).

### Draft paragraph to add (Abraham to approve; not applied)

Add under **What we collect and why**, after "If you create a member account":

> **If you use the American Basilicas app**
>
> The American Basilicas app for iPhone and Android uses the same member account and the same services as this
> website, and this policy covers it too. Everything above applies to the app, with these differences:
>
> - **Stored on your phone.** The app keeps your sign-in session, a copy of your visits and photo list, and any changes
>   you make without signal, so it works inside churches with weak reception. Changes are sent when you're back online.
>   Signing out keeps unsent changes on the phone until you sign in again; deleting the app removes everything it stored.
> - **Location and ZIP codes.** "Near you" asks your phone's permission to use your location while the app is open. The
>   distances are worked out on your phone, and your location and ZIP code aren't sent to us or saved.
> - **Camera and photos.** The app asks permission before using your camera or photo library, and only uses the photos
>   you choose. Before a photo leaves your phone, the app resizes it and saves it as a new JPEG, which removes hidden
>   details such as GPS location and camera information.
> - **App updates.** Expo, which delivers updates to the app, receives a random ID created when the app is installed (not
>   linked to your account), the app's version, any error that stopped the app from starting, and your IP address.
> - **App stores.** Apple and Google handle downloads of the app under their own privacy policies.
>
> We don't use advertising or tracking in the app, and we don't collect crash reports of our own.

Add under **Services that help run the site**:

> **Expo** delivers updates to the American Basilicas app (see "If you use the American Basilicas app").

Add to **How long we keep things, and deleting your account** (this is the target of Google's deletion link):

> **Deleting your account from the app or without it.** In the app, go to My pilgrimage → Account → Delete my account.
> On the website, go to My pilgrimage → Account → Delete my account. If you can't sign in, email
> hello@americanbasilicas.org from your account's email address with the subject "Delete my American Basilicas account",
> and we'll delete your account and the data listed above within 30 days.

(The "30 days" is a suggestion; choose a period you can keep. In-app deletion arrives with the account branch.
Apple requires it under guideline 5.1.1(v), and Google requires both the in-app path and the web link.)

## Sources
- Apple: definition of "collect", linking, tracking and the data types: [App privacy details on the App Store](https://developer.apple.com/support/app-privacy-on-the-app-store)
- Google: collection, sharing, service providers, ephemeral processing, data types and purposes: [Play Console Help, Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- Google: account deletion in the app plus a web link in the Data safety form: [Play Console Help, Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- Expo: what expo-updates sends and how to declare it (Device ID and Crash Data, collected and not shared): [Expo docs, EAS Update store privacy declarations](https://docs.expo.dev/eas-update/store-privacy-declarations/)
- Apple: in-app account deletion (5.1.1(v)) and login services (4.8): [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
