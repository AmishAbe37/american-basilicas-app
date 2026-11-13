# American Basilicas — the app

The iPhone and Android app for [americanbasilicas.org](https://americanbasilicas.org): the illustrated map of the
94 U.S. Catholic minor basilicas, with photos and facts, "Near you", and (coming) the member features —
visits, the members' gallery and order history — on the same Supabase backend as the website.

Built with Expo (SDK 54, so the App Store and Play Store versions of Expo Go can open it during development).

## Offline data

Everything the map needs ships inside the app, so it works with no signal inside a stone church.
It is generated from the website repo — the website stays the source of truth:

```sh
node tools/build-data.mjs ../american-basilicas      # basilicas, map labels, ZIP table -> assets/data
python3 tools/build-photos.py ../american-basilicas  # phone-size photos -> assets/photos, src/data/photos.ts
python3 tools/render-basemap.py ../american-basilicas  # the site's map art -> assets/map/basemap.webp
```

Re-run them after changing facts, photos or the map on the website.

## Previews

Each pull request is published by `.github/workflows/preview.yml` as an update that opens in Expo Go
(account: americanbasilicasorg). Nothing reaches the app stores from here.
