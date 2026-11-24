# Release checklist: from approved app to the App Store and Google Play

**DRAFT, waiting for Abraham's approval.** No store accounts have been created and no builds have been run.
Rules and prices were checked on **November 24, 2026** against the sources at the bottom. Re-check any price before you pay.

Steps marked **[phone]** can be done on an iPhone or Android phone. Steps marked **[Claude]** are commands Claude can
run for you in a session once you say OK. They need the Expo login that the PR previews already use, and nothing secret
goes into chat. Steps marked **[computer]** are easier on a computer.

## What it costs

| Item | Cost | Notes |
|---|---|---|
| Apple Developer Program | **$99 per year** | Can be waived for a recognized nonprofit organization; see Decision 1. |
| Google Play Console | **$25 once** | One-time registration fee. |
| D-U-N-S number (organization accounts only) | **Free** | Up to 5 business days from Dun & Bradstreet, then up to 2 more before Apple can see it. |
| Expo EAS (Build, Submit, Update) | **$0** on the Free plan | 15 Android and 15 iOS builds a month, low-priority queue, 45-minute build limit, submitting to the stores included, updates for up to 1,000 monthly active users. More than enough for launch. Starter is $19 a month if you ever need faster or more builds. |
| IRS recognition, only for Apple's fee waiver | $275 (Form 1023-EZ) or $600 (Form 1023) | Part of the 501(c)(3) process, not of the app. Recent times: 80% of 1023-EZ decisions within 22 days, and 80% of full 1023 decisions within 191 days. |

**Least you can pay to launch on both stores:** $25, plus $99 a year for Apple unless the fee waiver applies.
**Free alternatives that already work:** Expo Go previews (in use now, free) and Android test builds shared as an .apk
by link (the `preview` profile, free on EAS). Neither needs a store account.

**Something to watch:** EAS Update's free plan covers 1,000 monthly active users. Each store install that checks for updates
counts. If the app grows past that, either move to Starter or turn off update checks in store builds. Both are one-line changes.

---

## Decisions to make in the approval session

### Decision 1: Enroll as an individual or as an organization
The deciding fact: **organization enrollment needs a legal entity (for example a Missouri nonprofit corporation) and a
D-U-N-S number, but not IRS 501(c)(3) recognition.** The IRS recognition only matters for Apple's fee waiver.

| | Individual / personal | Organization |
|---|---|---|
| Apple: what's needed | Apple Account with two-factor authentication, your legal name | A legal entity (no DBAs or trade names), D-U-N-S, authority to sign for it, an email on the organization's domain (hello@americanbasilicas.org works), and a public website |
| Apple: seller name on the App Store | **Your personal legal name** | The organization's legal name |
| Apple: $99 fee waiver | Not possible. Apple excludes individuals and sole proprietors. | Possible if the organization is **officially recognized as a nonprofit (IRS in the U.S.)**, has no paid apps or in-app purchases, and doesn't sell digital goods in any of its apps. You can ask during enrollment, or later, any time before the membership expires. |
| Google: what's needed | Identity verification, plus verifying an Android device in the Play Console app | Identity verification plus D-U-N-S, with details matching Dun & Bradstreet |
| Google: testing before production | **Required for personal accounts created after Nov 13, 2023:** a closed test with **at least 12 testers opted in for the last 14 days in a row**, then an application for production access | **Not required.** Google's help page names only personal accounts, and Android Authority reports that organization accounts aren't subject to it. |
| Switching later | Apple: contact Apple to convert, or transfer the app, which needs at least one released version. Google: transfer the app to a new organization account ($25 for that account; support replies within 2 working days). | Nothing to switch. |

**Recommendation:** if the Missouri nonprofit corporation can be filed in the next few weeks, **enroll both stores once, as the
organization.** You skip Google's 12-tester, 14-day test and a later transfer on both stores, and the App Store shows
"American Basilicas" (the legal name) instead of your own name. Pay Apple's $99 for the first year if the IRS letter isn't
in yet, then request the waiver before renewal. If incorporation is months away and you want to launch sooner, enroll
as an individual now and plan two app transfers later. Budget at least 2 extra weeks on Google for the closed test.

**A catch with the fee waiver:** Apple's waiver needs "no in-app purchases, and no selling digital goods in any of your
apps". See Decision 4. If the gallery membership ever has to be sold in the app, the waiver no longer applies.

### Decision 2: How App Review signs in (needed before submitting to either store)
Both stores require working sign-in details for review: Apple's guideline 2.1 and Google's "App access" section. The app
only signs in with a code emailed to the address, so a reviewer can't get in. Options:
- **A. A review account the reviewer can sign in to without email:** a hidden "reviewer sign-in" that uses a password for
  one dedicated review account. Needs Supabase email-and-password sign-in turned on, which is a setting, not a schema
  change. Small code change. **Recommended.**
- B. A mailbox the reviewer can read (for example a shared inbox with its password given to Apple). It works, but it's
  awkward, and the code expires.
- C. Ask Apple for a "demo mode" (needs Apple's prior approval). Slowest.

### Decision 3: iPad (applied in this PR, easy to undo)
`ios.supportsTablet` is now **false**. The app is designed for phones in portrait, and supporting iPad means also
supplying 13-inch iPad screenshots and passing review on iPad. iPad owners can still install the iPhone app.
To support iPad later, set it back to `true` and add iPad screenshots.

### Decision 4: The gallery membership and Apple's in-app purchase rule
The app is planned to show gallery membership bought on the website (Buy Me a Coffee), with no purchase in the app.
Apple's guideline 3.1.3(b) lets an app unlock things bought elsewhere "provided those items are also available as in-app
purchases within the app". A members' photo gallery isn't one of the "reader app" types (books, music, video and so on)
that are exempt. **Risk: Apple may reject the gallery screens unless the membership is also offered through in-app purchase.**
Options:
- A. First release without paid gallery access in the app: map, pilgrimage, visits and the free part of the gallery. Lowest risk. Keeps the fee waiver possible.
- B. Add Apple and Google in-app purchase for the membership. Store commission applies, and Apple's fee waiver is then lost.
- C. Submit as planned and argue the case in review. It may be rejected.

This affects the gallery branch more than this one. It's listed here because it changes the review plan and the fee waiver.

### Decision 5: The Expo SDK upgrade before the first store build
SDK 54 already meets both stores' current build rules. EAS builds SDK 54 with Xcode 26, which Apple has required since
April 28, 2026, and SDK 54 targets Android API 36, which Google has required for new apps since August 31, 2026. So the
upgrade isn't required. **Recommendation:** merge the separate SDK-upgrade PR **before** the first store build anyway, so
version 1.0 starts on a current SDK. Then re-run step 7.2 below, because the privacy-manifest reasons and permissions can
change with new libraries.

### Decision 6: The version number
`app.json` says `"version": "0.1.0"`. Set it to **1.0.0** for launch (a one-line change). Build numbers are handled by EAS
(see eas.json) and need no attention.

---

## The launch path, in order

Each service below is one to-do list. When we get there, I'll show the list, wait for your OK, then walk you through one step at a time.

### 1. Approve the drafts (in a session with Claude)
1. Approve this PR (store-prep) and the feature PRs going into 1.0. **Account deletion in the app is required by both stores**
   (Apple 5.1.1(v); Google's deletion policy), so the account branch must be in.
2. Make Decisions 1 to 6 above.
3. Approve the privacy.html additions in `docs/store/privacy-labels.md`. Then they get applied to the website (with your OK).

### 2. If you choose an organization: the legal entity and D-U-N-S [phone]
1. File the Missouri nonprofit articles of incorporation (Missouri Secretary of State) if not done yet.
2. Look up or request the free D-U-N-S number using the organization's exact legal name and address. Apple has a lookup tool in its D-U-N-S help page. Allow up to 7 business days.
3. (For the Apple fee waiver only) keep the IRS determination letter ready when it arrives.

### 3. Apple Developer Program [phone], $99 a year or waived
1. Install the **Apple Developer** app on the iPhone, sign in with the Apple Account that will own the app (two-factor authentication on), and tap Enroll.
2. Choose Individual or Organization (Decision 1). For an organization, enter the D-U-N-S and, if eligible, request the fee waiver.
3. Pay (bought in the app, it's an auto-renewing yearly subscription), or wait for Apple's waiver review.
4. When it's approved, note your **Team ID** (Membership details). It's a public value and safe to share with Claude.

### 4. Google Play Console [phone or computer], $25 once
1. Sign up at play.google.com/console with the Google account that will own the app (consider the project's americanbasilicas@gmail.com).
2. Choose Personal or Organization (Decision 1). Pay $25 and complete identity verification.
3. Personal only: verify an Android device in the **Play Console** app.
4. Create the app: name "American Basilicas", default language English (US), App, Free.

### 5. App records and keys [computer is easier]
1. **App Store Connect > Apps > +**: platform iOS, name "American Basilicas", language English (U.S.), bundle ID `org.americanbasilicas.app`, SKU `american-basilicas`. Note the app's **Apple ID** (a number); it's public.
2. **App Store Connect > Users and Access > Integrations > App Store Connect API**: create a key with App Manager access. Download the `.p8` **straight into your password manager**, then upload it on expo.dev > americanbasilicasorg > Credentials > iOS. Don't paste it into chat.
3. **Google Cloud + Play Console**: create a service account for Play uploads (Expo's guide "Creating a Google Service Account key"), download its JSON **into your password manager**, and upload it on expo.dev > Credentials > Android > `org.americanbasilicas.app` > "Add a Google service account key".
4. Tell Claude the Team ID and the App Store Connect Apple ID. Claude fills them into `eas.json` (they're public).

### 6. Website privacy policy [Claude, after your OK]
Apply the approved paragraphs to privacy.html, so both stores' privacy and deletion links describe the app.

### 7. Builds [Claude]: each build needs your OK
1. Version 1.0.0 in app.json (Decision 6). Merge the SDK upgrade first if chosen (Decision 5).
2. Re-check the native config: `npx expo config --type introspect` (permissions, Info.plist strings, privacy manifest).
3. Android testers (optional, free): `eas build -p android --profile preview` gives an .apk link to share.
4. Store builds: `eas build -p ios --profile production` and `eas build -p android --profile production`
   (about 2 of the free 15 + 15 monthly builds). Build numbers count up by themselves.

### 8. iPhone: TestFlight, then review [Claude + phone]
1. `eas submit -p ios --latest` uploads the build to App Store Connect. If Apple emails about missing privacy-manifest reasons, add them to `ios.privacyManifests` in app.json and rebuild.
2. In App Store Connect > TestFlight, add yourself as an internal tester and install with the **TestFlight** app [phone].
3. Take the final screenshots on the iPhone (see screenshots.md).
4. Fill in the listing from `listing.md`, App Privacy from `privacy-labels.md`, the age rating, the review notes and sign-in details (Decision 2), then **Add for Review > Submit** [phone or computer].

### 9. Android: internal test, then (personal accounts only) the closed test, then production [Claude + phone]
1. `eas submit -p android --latest` sends the build to the **Internal testing** track as a draft. In Play Console, press "Start rollout" and add testers by email.
2. Complete Policy > App content: privacy policy, App access (Decision 2), ads (none), content rating, target audience (18+), Data safety (`privacy-labels.md`), and the account deletion URL.
3. Store listing: text from `listing.md`, the icon and feature graphic from `docs/store/assets/`, and phone screenshots.
4. **Personal account:** start a **closed test** with at least 12 testers who stay opted in for 14 days in a row, then apply for production access (Dashboard). **Organization account:** skip this.
5. Production: create a release from the tested build, then **Send for review**.

### 10. After approval
Release the app in both stores. Add the store badges to americanbasilicas.org (with your OK). Keep `eas update` for small
fixes, which reach users on the same build without a new review, as long as they're JavaScript-only changes.

---

## Steps you'll take with outside services (cumulative)

| Service | Step | Cost |
|---|---|---|
| Missouri Secretary of State | Nonprofit articles of incorporation (only if you choose an organization and haven't filed yet) | State filing fee (check the SOS site) |
| Dun & Bradstreet | D-U-N-S lookup or request (organization only) | Free |
| IRS | 501(c)(3) recognition (only for Apple's fee waiver) | $275 or $600 |
| Apple | Developer Program enrollment; App Store Connect app record; API key uploaded to Expo; listing, privacy, age rating; submit | $99 a year or waived |
| Google | Play Console account; app record; service account key uploaded to Expo; App content forms; listing; (personal) 14-day closed test; submit | $25 once |
| Expo | Upload the two store keys under Credentials | $0 (Free plan) |
| Supabase | Turn on email+password sign-in for the review account (only if Decision 2A) | $0 |
| Website (GitHub Pages) | Publish the approved privacy.html additions | $0 |

## Sources
- Apple $99 fee; individual vs organization requirements; seller name; no DBAs; converting accounts; enrolling in the Apple Developer app: [Apple Developer, Enrollment](https://developer.apple.com/support/enrollment/)
- Fee waiver eligibility (legal-entity nonprofit recognized by the IRS, not individuals, no paid apps, IAP or digital goods; ask at enrollment or before expiry): [Apple Developer, Membership fee waivers](https://developer.apple.com/support/fee-waiver)
- D-U-N-S is free, up to 5 business days plus 2 for Apple: [Apple Developer, D-U-N-S Number](https://developer.apple.com/support/D-U-N-S/index.html)
- Apple app transfer needs a released version: [App Store Connect Help, App transfer criteria](https://www.developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria)
- Xcode 26 / iOS 26 SDK required since April 28, 2026: [Apple Developer, Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/?id=04282026a); SDK 54 builds with Xcode 26 by default on EAS: [Expo blog, App Store Connect minimum SDK 26](https://expo.dev/blog/app-store-connect-minimum-sdk-26.md)
- Google $25 one-time fee, personal and organization types, identity verification, device verification: [Play Console Help, Get started](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)
- Organization accounts need a D-U-N-S: [Play Console Help, Choose a developer account type](https://support.google.com/googleplay/android-developer/answer/13634885)
- 12 testers, 14 days in a row, personal accounts created after Nov 13, 2023: [Play Console Help, App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en); organization accounts not subject, 20 reduced to 12: [Android Authority](https://www.androidauthority.com/google-play-app-testing-requirement-3510580)
- Google app transfer ($25 target account, 2 working days): [Play Console Help, Transfer apps](https://support.google.com/googleplay/android-developer/answer/6230247?hl=en-GB)
- Target API 36 for new apps from Aug 31, 2026: [Android Developers, Target API level requirements](https://developer.android.com/google/play/requirements/target-sdk)
- EAS Free plan limits and Starter price: [Expo pricing](https://expo.dev/pricing) ([text version](https://expo.dev/pricing.md))
- Remote build numbers and autoIncrement: [Expo docs, App version management](https://docs.expo.dev/build-reference/app-versions.md); submit fields: [Expo docs, eas.json reference](https://docs.expo.dev/eas/json.md); first Android submission and service account: [Expo docs, Submit to Google Play](https://docs.expo.dev/submit/android)
- Review rules 2.1 (demo account), 3.1.3(b), 4.8, 5.1.1(v): [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Account deletion on Google Play: [Play Console Help](https://support.google.com/googleplay/android-developer/answer/13327111)
- IRS fees and processing times: [IRS, user fees](https://www.irs.gov/charities-non-profits/form-1023-and-1023-ez-amount-of-user-fee); [IRS, Where's my application](https://www.irs.gov/charities-non-profits/charitable-organizations/wheres-my-application)
