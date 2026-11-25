// SAMPLE ONLY: placeholder tours for screenshots and development builds.
// Every stop that isn't a basilica is a made-up placeholder ("Sample lunch stop"), not a recommendation.
// Loaded only when __DEV__ is true or the build sets EXPO_PUBLIC_SAMPLE_TOURS=1 (see src/data/tours.ts);
// it is never part of assets/data/tours.json, and tools/build-tours.mjs refuses anything named "Sample".
import type { Tour } from "../data/tours.schema";

const SA = "san-antonio-basilica-of-the-national-shrine-of-the-little-flower";
const STL_OLD = "st-louis-basilica-of-st-louis-king-of-france-old-cathedral";
const STL_NEW = "st-louis-cathedral-basilica-of-st-louis-new-cathedral";

export const SAMPLE_TOURS: Tour[] = [
  {
    id: "sample-san-antonio",
    sample: true,
    title: "SAMPLE: A day in San Antonio",
    basilica_ids: [SA],
    city: "San Antonio",
    state: "Texas",
    intro: "This is a sample tour with placeholder stops, used only to preview the layout. Real tours will begin at the basilica, then lunch nearby, an afternoon of sights, the gift shop, and an easy dinner on the way back to your hotel.",
    best_days: "Sample: Tuesday to Saturday",
    best_hours: "Sample: basilica open 8 am to 5 pm; noon Mass on weekdays",
    length_hours: 7.5,
    checked_on: "2026-11-24",
    stops: [
      { order: 1, kind: "basilica", basilica_id: SA, name: "Basilica of the National Shrine of the Little Flower", address: "Sample address, San Antonio, TX",
        lat: 29.46, lng: -98.535, time: "09:30", minutes: 75, badge: "algorithm",
        note: "Sample note: arrive early to see the nave in the morning light, then stay for the noon Mass if you can.", hours: "Sample: daily 8 am to 5 pm" },
      { order: 2, kind: "meal", name: "Sample lunch stop", address: "Sample address, San Antonio, TX", lat: 29.452, lng: -98.522,
        time: "11:15", minutes: 60, badge: "algorithm", note: "Placeholder for a local lunch near the basilica.", hours: "Sample: 11 am to 3 pm",
        backup: { name: "Sample backup lunch stop", address: "Sample address, San Antonio, TX", lat: 29.449, lng: -98.518 } },
      { order: 3, kind: "sight", name: "Sample sight stop", address: "Sample address, San Antonio, TX", lat: 29.4259, lng: -98.4861,
        time: "12:45", minutes: 60, badge: "member", note: "Placeholder for a historic site." },
      { order: 4, kind: "sight", name: "Sample walk stop", address: "Sample address, San Antonio, TX", lat: 29.4241, lng: -98.4889,
        time: "14:00", minutes: 90, badge: "founder", note: "Placeholder for an easy afternoon walk." },
      { order: 5, kind: "shop", name: "Sample gift shop stop", address: "Sample address, San Antonio, TX", lat: 29.4601, lng: -98.5348,
        time: "16:00", minutes: 30, badge: "algorithm", note: "Placeholder for the basilica's own shop.", hours: "Sample: Tue–Sat 10 am to 4:30 pm",
        backup: { name: "Sample backup gift shop", address: "Sample address, San Antonio, TX", lat: 29.441, lng: -98.51, note: "Placeholder for a Catholic gift shop." } },
      { order: 6, kind: "dinner", name: "Sample dinner stop (optional)", address: "Sample address, San Antonio, TX", lat: 29.43, lng: -98.49,
        time: "17:30", minutes: 75, badge: "algorithm", note: "Placeholder for an optional dinner on the way to your hotel." },
    ],
  },
  {
    id: "sample-st-louis",
    sample: true,
    title: "SAMPLE: Two basilicas of St. Louis",
    basilica_ids: [STL_OLD, STL_NEW],
    city: "St. Louis",
    state: "Missouri",
    intro: "A sample tour that shares one day between two basilicas, to preview how a shared tour appears on both basilicas' pages. Stops other than the basilicas are placeholders.",
    best_days: "Sample: any day but Monday",
    best_hours: "Sample: both basilicas open mornings",
    length_hours: 6,
    stops: [
      { order: 1, kind: "basilica", basilica_id: STL_OLD, name: "Basilica of St. Louis, King of France (Old Cathedral)", address: "Sample address, St. Louis, MO",
        lat: 38.6247, lng: -90.187, time: "09:00", minutes: 60, badge: "algorithm" },
      { order: 2, kind: "meal", name: "Sample lunch stop", address: "Sample address, St. Louis, MO", lat: 38.63, lng: -90.2, time: "10:30", minutes: 60, badge: "algorithm" },
      { order: 3, kind: "basilica", basilica_id: STL_NEW, name: "Cathedral Basilica of St. Louis (New Cathedral)", address: "Sample address, St. Louis, MO",
        lat: 38.642, lng: -90.262, time: "12:00", minutes: 90, badge: "algorithm" },
      { order: 4, kind: "shop", name: "Sample gift shop stop", address: "Sample address, St. Louis, MO", lat: 38.6421, lng: -90.2615, time: "13:30", minutes: 30, badge: "algorithm" },
    ],
  },
];
