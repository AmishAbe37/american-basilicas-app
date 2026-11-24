# Store screenshots and graphics

**DRAFT.** `tools/store-screenshots.py` makes draft screenshots at the exact store sizes from the web export:

```sh
npx expo export -p web
python3 tools/store-screenshots.py            # writes to /home/claude/out/store-shots/
python3 tools/store-screenshots.py --out shots --port 8106
```

It needs Python Playwright with Chromium, and Pillow. It serves `dist/` itself on port 8106, signs in to nothing, and writes
nothing to the backend. Every image is saved without an alpha channel, as both stores require.

| File | Size (px) | Where it goes |
|---|---|---|
| `ios-6.9-<n>-<screen>.png` | 1320 × 2868 | App Store, iPhone 6.9" display (17 Pro Max class). The largest size; App Store Connect scales it down for smaller iPhones. |
| `ios-6.3-<n>-<screen>.png` | 1206 × 2622 | App Store, iPhone 6.3" ("Dynamic Island, medium display"). **This is the size App Store Connect lists as required.** Upload it too, so the required slot isn't filled by scaling. |
| `android-phone-<n>-<screen>.png` | 1080 × 1920 | Google Play phone screenshots (9:16). At least 1080 px wide, so they qualify for Play's promotion slots. |
| `play-icon-512.png` | 512 × 512 | Google Play hi-res icon (also in `docs/store/assets/`). |
| `play-feature-graphic.png` | 1024 × 500 | Google Play feature graphic, required (also in `docs/store/assets/`). |

Screens, in this order: 1 map, 2 basilicas by state, 3 a basilica page (Baltimore), 4 Near you (ZIP 21201),
5 My pilgrimage (signed out), 6 sign-in. Apple allows 1 to 10 per size, and Google allows 2 to 8 phone screenshots.

## Use real-device screenshots for the final submission
The web export is a stand-in: fonts, the status bar, the map's first view and the tab bar differ slightly from the
native app (for example, the map's first view is cropped on the west in portrait). For the submission itself:
1. Install the TestFlight build on the iPhone, or the internal-test build on the Android phone.
2. Take screenshots with the phone's own buttons. A 6.9" iPhone (Pro Max or Plus) gives 1320 × 2868 or 1290 × 2796, both accepted.
   Any recent iPhone 17, 16 or 15 gives a size accepted for the 6.3" slot.
3. Sign in with your own account to show **My pilgrimage with real visits and photos**. Those are the most convincing screens,
   and only you can make them with real data. Use your own photos, or ones whose licence allows it.
4. For Android, most current phones are taller than 9:16. Play accepts screenshots whose long side is up to 2.3 × the short side.

## Rules checked
- Apple: 1 to 10 screenshots per size, .jpeg/.jpg/.png, no alpha. iPhone: at least one for the "Dynamic Island (medium display)"
  slot. The 6.9" sizes are 1260 × 2736, 1290 × 2796 and 1320 × 2868. iPad 13" is needed only if the app runs on iPad
  (it doesn't now; see Decision 3 in release-checklist.md).
  [App Store Connect Help, Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- Google: 2 to 8 phone screenshots, PNG or JPEG up to 8 MB, 320 to 3,840 px, long side at most 2.3 × the short side, at least
  1080 × 1920 portrait for promotion. Icon 512 × 512 32-bit PNG. Feature graphic 1024 × 500 JPEG or 24-bit PNG with no alpha.
  [Play Console Help, Preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)
