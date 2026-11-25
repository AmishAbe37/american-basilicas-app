# Store listing: American Basilicas

**DRAFT, waiting for Abraham's approval.** Copy each block into App Store Connect or Play Console as it is.
The character counts were checked with a script, and the limits are cited at the bottom.
Everything below describes what the app does **today** (the `main` branch: map, basilica pages, list, Near you, sign-in,
visits with dates, notes and photos). The lines marked *[add when merged]* cover features still in draft pull requests.
Add each one only after that feature is approved and in the build you submit, because Apple rejects listings that
promise features the app doesn't have (guideline 2.3.1).

## Names

| Field | Text | Count / limit |
|---|---|---|
| App name (both stores) | `American Basilicas` | 18 / 30 |
| App Store subtitle | `The 94 U.S. minor basilicas` | 27 / 30 |
| Google Play short description | `Illustrated map of the 94 U.S. Catholic minor basilicas. Find one near you.` | 75 / 80 |
| App Store promotional text (can be changed any time without review) | `Planning a pilgrimage? Find the basilicas near you, read their stories, and keep a record of every one you visit, even without signal.` | 134 / 170 |
| App Store keywords | `catholic,pilgrimage,church,cathedral,shrine,mass,travel,pilgrim,saints,parish,heritage,architecture` | 99 / 100 bytes |

The keywords leave out "american" and "basilica", because Apple already indexes the words in the app name.
They use commas with no spaces, as Apple recommends, to save bytes.

## Full description (both stores)

```
Every minor basilica in the United States, on one illustrated map.

The Church gives the title of minor basilica to a small number of churches for their history, their beauty and their place in the life of the faithful. American Basilicas gathers all 94 in the United States, from the first cathedral in Baltimore to the California missions, into a pilgrim’s guide you can carry in your pocket.

THE MAP
• An illustrated map of the United States with a red-and-gold ombrellino, the canopy of a basilica, marking each one.
• Pinch to zoom in on crowded regions and tap any canopy to open that basilica.

EACH BASILICA
• A photograph, with credit to the photographer.
• A few short facts: when it was built, who designed it, and why it matters.
• When it was named a basilica.
• Directions, and links to Wikipedia and Wikimedia Commons for more photos and history.

NEAR YOU
• Find the basilicas nearest you by your location or a ZIP code, with distances in miles.
• Your location and ZIP code stay on your phone. They aren’t sent or saved anywhere.

MY PILGRIMAGE
• Sign in with your email address. We email you a 6-digit code, so there’s no password to remember.
• Check off each basilica you visit, with the date and a private note.
• Add photos from your visit. Each photo is resized and saved as a new image before it leaves your phone, which removes the GPS location and camera details that photos usually carry.
• See how many basilicas and states you’ve visited.

MADE FOR STONE CHURCHES
Signal is often weak inside thick stone walls, so the map, photos and facts for all 94 basilicas are stored in the app. You can check off a visit, write a note or add photos with no signal at all. Your changes are saved on your phone and sent when you’re back online.

ONE ACCOUNT WITH THE WEBSITE
The same account works on americanbasilicas.org, so your visits, notes and photos appear in both places.

PRIVATE BY DESIGN
No ads and no tracking. Your visits and notes are private to you. Photos you add to a visit are reviewed before they’re shared with members in the members’ gallery.

American Basilicas is an independent project and isn’t an official publication of the Catholic Church or of any basilica. Questions, corrections or a basilica we should know about? Write to hello@americanbasilicas.org.
```

*[add when merged]*, as extra bullets under MY PILGRIMAGE or as a new section, each matching the final wording of
its feature:
- Members' gallery: "Browse members’ photos, reviews, and questions and answers about each basilica, and like the ones you love."
- Order history: "See your American Basilicas store orders."
- Reminders: one line that says exactly what the reminder does once it's approved.
- If Google or Apple sign-in is added, change "Sign in with your email address" to cover the new options.

The full description is about 2,300 characters (limit 4,000), which leaves room for these lines.

## Category

| Store | Choice | Why |
|---|---|---|
| App Store primary | **Travel** | The app is used to find and visit places. Apple has no Religion category. |
| App Store secondary | **Reference** | A guide to the history of each basilica. |
| Google Play | **Travel & Local** | Same reasoning. |
| Google Play tags | Travel guide, Maps, Religion (pick from Play's tag list) | Optional. |

## URLs and contact

| Field | Value |
|---|---|
| Privacy policy URL (both stores, required) | https://americanbasilicas.org/privacy.html |
| Support URL (App Store, required; must lead to contact details) | https://americanbasilicas.org/privacy.html#who (the "Who we are and how to contact us" section with hello@americanbasilicas.org). https://americanbasilicas.org/ also works, because the home page shows the email address. |
| Marketing URL (App Store, optional) | https://americanbasilicas.org/ |
| Developer / contact email (both) | hello@americanbasilicas.org |
| Account deletion web link (Google Play Data safety form, required) | https://americanbasilicas.org/privacy.html#keep (see privacy-labels.md for the paragraph to add there first) |
| Copyright (App Store) | `2026 American Basilicas`. If you enroll as an individual, Apple shows your legal name as the seller anyway, so you can keep this or use `2026 Abraham Griesbauer`. |

## Age rating answers

### Apple (App Store Connect > App Information > Age Ratings)
Apple's questionnaire now includes questions about in-app controls, capabilities, medical or wellness topics and
violent themes. App Store Connect works out the rating from your answers; don't pick a rating yourself.

| Question group | Answer |
|---|---|
| Violence (cartoon, realistic, prolonged, graphic), violent themes | None. Some basilica facts mention history, but nothing is shown or described graphically. |
| Sexual content, nudity | None. Religious art in photos is not sexual content. |
| Profanity or crude humor | None |
| Horror or fear themes | None |
| Mature or suggestive themes | None |
| Alcohol, tobacco, drugs | None |
| Simulated gambling, contests, loot boxes | None / No |
| Medical or treatment information; health or wellness topics | None / No |
| Unrestricted web access | **No.** Links open specific Wikipedia, Wikimedia and Google Maps pages; there is no general web browser. |
| User-generated content | **No** for what's in `main` today: visits, notes and photos are private, and photos are only reviewed, never shown to other people in the app. **Yes** once the members' gallery is merged, because reviews, questions and photos then appear to other members (all moderated before sharing). |
| Messaging or chat between users | No |
| Age assurance, parental controls, in-app controls | No |
| Advertising | No |

### Google Play (Policy > App content > Content rating, IARC questionnaire)
- Category: **Reference, News, or Educational**.
- Violence, sexuality, language, controlled substances, gambling, crude humor: **No** to all.
- "Can users interact or exchange content?": **No** today. **Yes** once the gallery is merged (moderated photos, reviews and Q&A).
- "Does the app share the user's current location with other users?": **No**.
- "Does the app allow users to purchase digital goods?": **No**. The gallery membership is sold on the website (Buy Me a Coffee), not in the app.
- Target audience (Policy > App content > Target audience): **18 and over**. The privacy policy says member accounts aren't intended for children, and choosing an under-18 audience brings in Google's Families policy.

## Review notes (both stores need a way in)
Both stores require working sign-in details for review. Apple asks for a demo account (guideline 2.1), and Google asks under
"App access". The app signs in only with an emailed code, so a reviewer can't receive it.
**Decision for Abraham, which must be settled before submitting:** see "Reviewer sign-in" in release-checklist.md.

Suggested note for the reviewer:
```
American Basilicas is a guide to the 94 Catholic minor basilicas in the United States. The map, basilica pages, list
and Near you work without an account. Sign-in (My pilgrimage tab) lets members record visits with dates, private notes
and photos; it uses a one-time code sent by email. [Sign-in details for review: see below.]
Photos are re-encoded on the device, which strips location metadata, before upload. Location for "Near you" is used on
the device only and is not transmitted.
```

## Sources
- App Store name and subtitle limits (30 each): [App Store Connect Help, App information](https://developer.apple.com/help/app-store-connect/reference/app-information/)
- Promotional text 170, description 4,000, keywords 100 bytes, support URL with contact details, copyright format: [App Store Connect Help, Platform version information](https://www.developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information)
- Google Play title 30, short description 80, full description 4,000: [Play Console Help, Best practices for your store listing](https://support.google.com/googleplay/android-developer/answer/13393723?hl=en)
- Apple's updated age-rating questions (in-app controls, capabilities, medical or wellness, violent themes): [Apple Developer News, Updated age ratings](https://developer.apple.com/news/?id=ks775ehf)
- Demo account requirement (2.1) and user-generated content rules (1.2): [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Account deletion web link in the Data safety form: [Play Console Help, Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
