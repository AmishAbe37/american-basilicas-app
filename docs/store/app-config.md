# Release settings in app.json and eas.json, and why

**DRAFT.** These are the only config changes made for store readiness. Each one is small and can be undone on its own.

## app.json

| Change | Why |
|---|---|
| `ios.config.usesNonExemptEncryption: false` | Writes `ITSAppUsesNonExemptEncryption = NO`, so App Store Connect doesn't ask the export-compliance questions on every upload. Correct for this app: it only uses HTTPS through the system networking APIs, which Apple says is typically exempt. `expo-crypto` is used only for random IDs. If proprietary encryption is ever added, change this to `true`. Apple notes that apps using exempt encryption may still owe the U.S. a year-end self-classification report; see the link below. |
| `ios.privacyManifests` | Apple refuses uploads that use "required reason" APIs without declaring a reason. Expo warns that Apple doesn't read the manifests inside static CocoaPods libraries correctly, so the app declares them itself. The reasons were collected from the `PrivacyInfo.xcprivacy` files of the libraries installed now: UserDefaults `CA92.1` (React Native, expo-constants, expo-system-ui); FileTimestamp `C617.1` (React Native, AsyncStorage, Folly, glog, boost) and `0A2A.1`, `3B52.1` (expo-file-system); SystemBootTime `35F9.1` (boost); DiskSpace `E174.1`, `85F4.1` (expo-file-system). `NSPrivacyTracking: false`. Re-check after the SDK upgrade or any new native library. Apple emails within minutes of an upload if a reason is missing. |
| `ios.supportsTablet: true → false` | Decision 3 in release-checklist.md: a phone-only design, so no iPad screenshots or iPad review. One line to undo. |
| expo-location `locationAlwaysAndWhenInUsePermission` and `locationAlwaysPermission` | The plugin adds these Info.plist strings anyway, with the generic text "Allow $(PRODUCT_NAME) to access your location". They're replaced with an honest sentence. The app never asks for "always" location. The app's "Near you" calls `requestForegroundPermissionsAsync`, which asks only for "while using" (`EXForegroundPermissionRequester`). The keys are kept with honest text, not removed (`false`), because expo-location also ships an "always" requester for its background API. Keeping the strings is the safe default for upload checks. Removing them is a reasonable alternative if Abraham prefers; it's a one-line change. |
| expo-image-picker camera and photos strings | They now say that visit photos are reviewed for the members' gallery, which is true (see privacy.html). Apple asks purpose strings to describe the use fully. |
| `android.blockedPermissions: [SYSTEM_ALERT_WINDOW]` | The "draw over other apps" permission comes from the native template, for the developer menu. The app doesn't use it, and it alarms people in the permissions list. |
| Build numbers (`ios.buildNumber`, `android.versionCode`) | **Not added on purpose.** `eas.json` uses `appVersionSource: "remote"`, so Expo's servers keep the build numbers, and `autoIncrement` raises them on each production build. With a remote source, Expo ignores any values in app.json. |

**Kept as they are, after checking:**
- `NSLocationWhenInUseUsageDescription`, which states the on-device use accurately.
- Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` (Near you). People can still choose "approximate" on Android 12+ and iOS 14+.
- `CAMERA`, which the camera button requests.
- `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`. expo-image-picker requests them for the photo library on Android 12
  and older, and for the camera on Android 9 and older. On Android 13+ the system photo picker needs no permission, and
  these have no effect. Blocking them would break photo picking on older phones.
- `VIBRATE`, `INTERNET` and `ACCESS_NETWORK_STATE` (normal permissions; network state is used for offline detection).
- `RECORD_AUDIO`, already removed by `microphonePermission: false`.
- No `READ_MEDIA_IMAGES`, so Google's photo-and-video permissions declaration isn't needed.
- Background location is not requested. If the reminders branch ever wants location-based reminders, that needs its own decision, extra store declarations and new privacy wording.

**Icons and splash, checked; nothing needed regenerating:**
- `icon.png`: 1024 × 1024, RGB with no alpha, as the App Store requires.
- `android-icon-foreground.png` and `android-icon-monochrome.png`: 1024 × 1024, transparent outside the art, and the art stays
  within a radius of 274 px of the centre, inside the 313 px (66 dp of 108 dp) safe circle, so no launcher shape clips it.
  Monochrome is a single-colour silhouette.
- `android-icon-background.png`: 1024 × 1024, solid paper colour.
- `splash-icon.png`: 400 × 600 with transparency, shown at 160 pt on the paper background.
- The Play Store icon (512 × 512) and feature graphic (1024 × 500) are made by `tools/store-screenshots.py` into `docs/store/assets/`.

## eas.json
- `development`: a development build (needs `expo-dev-client`, which isn't installed). Only needed when a feature stops working in Expo Go.
- `preview`: an internal `.apk` for Android testers, shared by link. For iPhone testers, use TestFlight.
- `production`: store builds (`.ipa`, `.aab`), on the `production` update channel, with `autoIncrement`.
- `submit.production`: Android goes to the Internal testing track as a draft. On iOS, `ascAppId` and `appleTeamId` are
  commented out until Abraham's Apple account exists (EAS rejects placeholder values). Store keys are uploaded to Expo and never committed.
- Each build profile has its own update channel, so `eas update` can't send a test update to store users by mistake.

## Sources
- [Apple: Complying with encryption export regulations](https://developer.apple.com/tutorials/data/documentation/security/complying-with-encryption-export-regulations.md)
- [Apple: Describing use of required reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api.md) (uploads without reasons are refused since May 1, 2024)
- [Expo: Privacy manifests](https://docs.expo.dev/guides/apple-privacy/)
- [Expo: Permissions](https://docs.expo.dev/guides/permissions.md) (blockedPermissions; default messages "will most likely need to be tailored")
- [Expo: App version management](https://docs.expo.dev/build-reference/app-versions.md)
- [Expo: eas.json reference](https://docs.expo.dev/eas/json.md)
