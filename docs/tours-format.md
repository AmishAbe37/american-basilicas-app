# Day tours: the data format

*For the tours Project. Paste this whole document into that Project so every tour comes out in a shape the app can read.*

The American Basilicas app shows a **Day tours** section on a basilica's page. Each tour is a planned day: the basilica
visit, a local lunch, sightseeing stops, a gift-shop stop and an optional dinner on the way to the visitor's hotel.
In the app, a visitor reads the plan, presses **Start tour**, and goes one stop at a time, with directions and an
optional Uber or Lyft ride to each stop and a big **Next stop** button.

Tours ship inside the app, so they work with no signal. Each tour is checked by a script before it goes in. If
something is wrong, the script lists what to fix in plain English.

## Two ways to deliver tours

1. **A spreadsheet (CSV), one row per stop.** This is the easiest. Export a Google Sheet or Excel sheet as CSV.
   The tour's own columns (title, intro and so on) only need to be filled on the tour's **first** row. Later rows of
   the same tour can leave them empty, but if they are filled, they must match the first row.
2. **JSON**, in the shape shown at the end of this document.

Either way, one file can hold any number of tours.

## The tour (filled once per tour)

| Column | Required | What goes in it | Example |
|---|---|---|---|
| `tour_id` | yes, every row | A short id: lowercase letters, numbers and dashes. It never changes once published. | `san-antonio-day` |
| `tour_title` | yes | The name shown in the app. | `A day in San Antonio` |
| `basilica_ids` | yes | The basilica or basilicas the tour visits, using ids from the list at the end. Separate several with `\|`. The tour appears on each of those basilicas' pages. | `st-louis-basilica-of-st-louis-king-of-france-old-cathedral\|st-louis-cathedral-basilica-of-st-louis-new-cathedral` |
| `city` | yes | The city. | `San Antonio` |
| `state` | yes | The state, written out. | `Texas` |
| `intro` | yes | Two to four warm sentences about the day. | |
| `best_days` | yes | The best days to go, and why. | `Tuesday to Saturday (the basilica shop is closed Mondays)` |
| `best_hours` | yes | The basilica's open hours, and the Mass times that shape the day. | `Open 8 am to 5 pm; Mass at noon on weekdays` |
| `length_hours` | yes | The estimated length of the whole day, in hours. | `7.5` |
| `checked_on` | recommended | The date the hours and stops were last checked, written `YYYY-MM-DD`. The app shows it as "last checked". | `2026-11-24` |

## The stops (one row each)

| Column | Required | What goes in it | Example |
|---|---|---|---|
| `stop_order` | yes | 1, 2, 3… in the order the visitor goes, with no gaps. | `2` |
| `kind` | yes | One of `basilica`, `meal`, `sight`, `shop`, `dinner` or `other`. `gift shop` and `lunch` also work. | `meal` |
| `name` | yes | The place's name, as shown in the app. | |
| `address` | yes | The street address. | `123 Main St, San Antonio, TX 78205` |
| `lat`, `lng` | yes | The place's coordinates, as decimal numbers. Directions and rides use these. | `29.4259`, `-98.4861` |
| `time` | recommended | The suggested arrival time, local. `11:30`, `14:00` and `2:00 pm` all work. | `11:30` |
| `minutes` | recommended | How long to spend there, in whole minutes. | `60` |
| `note` | optional | A sentence or two: what to see, what to order, why it's on the tour. | |
| `hours` | recommended | The opening hours, as text. | `Mon–Sat 10 am–6 pm; closed Sunday` |
| `basilica_id` | for basilica stops on shared tours | Which basilica this stop is. It's only needed when the tour has more than one basilica. | |
| `badge` | optional | How the stop was chosen: `algorithm` (the default; no badge is shown), `member` ("Member approved") or `founder` ("Founder tested"). | `algorithm` |
| `backup_name`, `backup_address`, `backup_lat`, `backup_lng` | optional, all four together | A fallback if the stop is closed or full. For the gift shop, this is a Catholic gift shop or local souvenir store. | |
| `backup_note` | optional | A note about the backup. | |

## Guidelines for the tours

- **Order of the day.** A tour usually goes: the basilica (`basilica`), a local lunch (`meal`), one or more
  `sight` stops, the gift shop (`shop`, the basilica's own shop, with a Catholic gift shop or local souvenir store
  as its backup) and an optional dinner (`dinner`) on the way to the hotel. Put "optional" in the dinner's note.
- **Shared tours.** When two basilicas share one tour, as in St. Louis, list both in `basilica_ids` and give each
  basilica stop its own `basilica_id`. The one tour then appears on both basilicas' pages.
- **Several tours in one city.** For example, New York can have several tours, grouped by location and the
  basilicas' open hours. Give each its own `tour_id`, list the basilicas it visits, and the app shows every tour on
  each of its basilicas' pages.
- **Times** should go forward through the day. The check warns if a stop's time is earlier than the stop before it.
- **Real places only.** Every name, address, set of coordinates and opening hours must be checked against the
  place's own website or listing, and `checked_on` must be the date of that check. Don't use placeholder names. The
  check refuses any tour or stop named "Sample…", because those are reserved for the app's own test data.
- **Badges.** Leave `badge` empty (it means `algorithm`) unless the stop is member-approved or founder-tested.
- **No shop links in the data.** The app offers keepsakes from the American Basilicas shop quietly at the end of the
  day, so tours don't need store links.
- **Coordinates** must be in the United States, and `lat` comes before `lng`. A good way to get them is to
  right-click the place in Google Maps. The first number shown is `lat`, and the second is `lng`.

## A CSV template

Here is the header row, then two rows of one tour, written with **placeholder** values to show the shape. Real tours
replace every placeholder.

```csv
tour_id,tour_title,basilica_ids,city,state,intro,best_days,best_hours,length_hours,checked_on,stop_order,kind,name,address,lat,lng,time,minutes,note,hours,basilica_id,badge,backup_name,backup_address,backup_lat,backup_lng,backup_note
example-day,An example day,san-antonio-basilica-of-the-national-shrine-of-the-little-flower,San Antonio,Texas,"Two to four warm sentences about the day.",Tuesday to Saturday,"Open 8 am to 5 pm; noon Mass on weekdays",7.5,2026-11-24,1,basilica,(the basilica's name),(street address),29.46,-98.535,9:30,75,(what to see),(open hours),,,,,,,
example-day,,,,,,,,,,2,meal,(restaurant name),(street address),(lat),(lng),11:15,60,(what to order),(open hours),,algorithm,(backup name),(backup address),(lat),(lng),
```

The same template, ready to fill, is in the app repo at `docs/tours-template.csv`.

## The same tour as JSON

```json
{
  "tours": [
    {
      "id": "example-day",
      "title": "An example day",
      "basilica_ids": ["san-antonio-basilica-of-the-national-shrine-of-the-little-flower"],
      "city": "San Antonio",
      "state": "Texas",
      "intro": "Two to four warm sentences about the day.",
      "best_days": "Tuesday to Saturday",
      "best_hours": "Open 8 am to 5 pm; noon Mass on weekdays",
      "length_hours": 7.5,
      "checked_on": "2026-11-24",
      "stops": [
        { "order": 1, "kind": "basilica", "name": "(the basilica's name)", "address": "(street address)",
          "lat": 29.46, "lng": -98.535, "time": "09:30", "minutes": 75, "note": "(what to see)", "hours": "(open hours)" },
        { "order": 2, "kind": "meal", "name": "(restaurant name)", "address": "(street address)",
          "lat": 0, "lng": 0, "time": "11:15", "minutes": 60, "badge": "algorithm",
          "backup": { "name": "(backup name)", "address": "(backup address)", "lat": 0, "lng": 0 } }
      ]
    }
  ]
}
```

In JSON, `time` must be 24-hour `HH:MM`, `badge` defaults to `algorithm`, and `backup` is an object.

## How tours get into the app (for the app repo)

```sh
node tools/build-tours.mjs tours.csv --check   # check only
node tools/build-tours.mjs tours.csv           # check, then write assets/data/tours.json
```

The rules live in `src/data/tours.schema.ts`, which both the app and the script use. The app ships with an empty
`assets/data/tours.json`, so no tour section appears until real tours are added. Development and preview builds
also show a clearly stamped **SAMPLE** tour, which comes from `src/dev/sample-tours.ts` and never goes into the data
file.

## Basilica ids

| State | City | Basilica | id |
|---|---|---|---|
| Alabama | Mobile | Cathedral Basilica of the Immaculate Conception | `mobile-cathedral-basilica-of-the-immaculate-conception` |
| Arizona | Phoenix | St. Mary's Basilica | `phoenix-st-mary-s-basilica` |
| California | Alameda | St. Joseph Basilica | `alameda-st-joseph-basilica` |
| California | Carmel-by-the-Sea | Basilica of Mission San Carlos Borromeo (Carmel Mission) | `carmel-by-the-sea-basilica-of-mission-san-carlos-borromeo-carmel-mission` |
| California | San Diego | Mission Basilica San Diego de Alcalá | `san-diego-mission-basilica-san-diego-de-alcala` |
| California | San Francisco | Basilica of St. Francis of Assisi (Mission Dolores) | `san-francisco-basilica-of-st-francis-of-assisi-mission-dolores` |
| California | San Jose | Cathedral Basilica of St. Joseph | `san-jose-cathedral-basilica-of-st-joseph` |
| California | San Juan Capistrano | Mission Basilica San Juan Capistrano | `san-juan-capistrano-mission-basilica-san-juan-capistrano` |
| California | Ventura | Mission Basilica San Buenaventura | `ventura-mission-basilica-san-buenaventura` |
| Colorado | Denver | Cathedral Basilica of the Immaculate Conception | `denver-cathedral-basilica-of-the-immaculate-conception` |
| Connecticut | Stamford | Basilica of St. John the Evangelist | `stamford-basilica-of-st-john-the-evangelist` |
| Connecticut | Waterbury | Basilica of the Immaculate Conception | `waterbury-basilica-of-the-immaculate-conception` |
| District of Columbia | Washington | Basilica of the National Shrine of the Immaculate Conception | `washington-basilica-of-the-national-shrine-of-the-immaculate-conception` |
| Florida | Daytona Beach | Basilica of St. Paul | `daytona-beach-basilica-of-st-paul` |
| Florida | Jacksonville | Basilica of the Immaculate Conception | `jacksonville-basilica-of-the-immaculate-conception` |
| Florida | Key West | Basilica of St. Mary Star of the Sea | `key-west-basilica-of-st-mary-star-of-the-sea` |
| Florida | Orlando | Basilica of the National Shrine of Mary, Queen of the Universe | `orlando-basilica-of-the-national-shrine-of-mary-queen-of-the-universe` |
| Florida | Palm Beach | Basilica of St. Edward | `palm-beach-basilica-of-st-edward` |
| Florida | Pensacola | Basilica of St. Michael the Archangel | `pensacola-basilica-of-st-michael-the-archangel` |
| Florida | St. Augustine | Cathedral Basilica of St. Augustine | `st-augustine-cathedral-basilica-of-st-augustine` |
| Georgia | Atlanta | Basilica of the Sacred Heart of Jesus | `atlanta-basilica-of-the-sacred-heart-of-jesus` |
| Georgia | Savannah | Cathedral Basilica of St. John the Baptist | `savannah-cathedral-basilica-of-st-john-the-baptist` |
| Hawaii | Honolulu | Cathedral Basilica of Our Lady of Peace | `honolulu-cathedral-basilica-of-our-lady-of-peace` |
| Illinois | Chicago | Basilica of St. Hyacinth | `chicago-basilica-of-st-hyacinth` |
| Illinois | Chicago | Our Lady of Sorrows Basilica | `chicago-our-lady-of-sorrows-basilica` |
| Illinois | Chicago | Queen of All Saints Basilica | `chicago-queen-of-all-saints-basilica` |
| Indiana | Notre Dame | Basilica of the Sacred Heart | `notre-dame-basilica-of-the-sacred-heart` |
| Indiana | Vincennes | Basilica of St. Francis Xavier (Old Cathedral) | `vincennes-basilica-of-st-francis-xavier-old-cathedral` |
| Iowa | Des Moines | Basilica of St. John the Apostle | `des-moines-basilica-of-st-john-the-apostle` |
| Iowa | Dyersville | Basilica of St. Francis Xavier | `dyersville-basilica-of-st-francis-xavier` |
| Kansas | Victoria | Basilica of St. Fidelis (Cathedral of the Plains) | `victoria-basilica-of-st-fidelis-cathedral-of-the-plains` |
| Kentucky | Bardstown | St. Joseph Proto-Cathedral Basilica | `bardstown-st-joseph-proto-cathedral-basilica` |
| Kentucky | Covington | Cathedral Basilica of the Assumption | `covington-cathedral-basilica-of-the-assumption` |
| Kentucky | Trappist | Basilica of the Blessed Virgin of Gethsemani | `trappist-basilica-of-the-blessed-virgin-of-gethsemani` |
| Louisiana | Natchitoches | Basilica of the Immaculate Conception | `natchitoches-basilica-of-the-immaculate-conception` |
| Louisiana | New Orleans | Basilica of St. Stephen | `new-orleans-basilica-of-st-stephen` |
| Louisiana | New Orleans | Cathedral Basilica of St. Louis, King of France | `new-orleans-cathedral-basilica-of-st-louis-king-of-france` |
| Maine | Lewiston | Basilica of Sts. Peter and Paul | `lewiston-basilica-of-sts-peter-and-paul` |
| Maryland | Baltimore | Basilica of the National Shrine of the Assumption of the BVM | `baltimore-basilica-of-the-national-shrine-of-the-assumption-of-the-bvm` |
| Maryland | Emmitsburg | Basilica of the National Shrine of St. Elizabeth Ann Seton | `emmitsburg-basilica-of-the-national-shrine-of-st-elizabeth-ann-seton` |
| Massachusetts | Boston | Basilica & Shrine of Our Lady of Perpetual Help (Mission Church) | `boston-basilica-shrine-of-our-lady-of-perpetual-help-mission-church` |
| Massachusetts | Chicopee | Basilica of St. Stanislaus | `chicopee-basilica-of-st-stanislaus` |
| Massachusetts | Webster | St. Joseph Basilica | `webster-st-joseph-basilica` |
| Michigan | Detroit | Basilica of Ste. Anne de Détroit | `detroit-basilica-of-ste-anne-de-detroit` |
| Michigan | Grand Rapids | Basilica of St. Adalbert | `grand-rapids-basilica-of-st-adalbert` |
| Michigan | Royal Oak | National Shrine of the Little Flower Basilica | `royal-oak-national-shrine-of-the-little-flower-basilica` |
| Minnesota | Minneapolis | Basilica of St. Mary | `minneapolis-basilica-of-st-mary` |
| Minnesota | Winona | Basilica of St. Stanislaus Kostka | `winona-basilica-of-st-stanislaus-kostka` |
| Mississippi | Natchez | St. Mary Basilica | `natchez-st-mary-basilica` |
| Missouri | Conception | Basilica of the Immaculate Conception (Conception Abbey) | `conception-basilica-of-the-immaculate-conception-conception-abbey` |
| Missouri | St. Louis | Basilica of St. Louis, King of France (Old Cathedral) | `st-louis-basilica-of-st-louis-king-of-france-old-cathedral` |
| Missouri | St. Louis | Cathedral Basilica of St. Louis (New Cathedral) | `st-louis-cathedral-basilica-of-st-louis-new-cathedral` |
| New Jersey | Newark | Cathedral Basilica of the Sacred Heart | `newark-cathedral-basilica-of-the-sacred-heart` |
| New Mexico | Mesilla | Basilica of San Albino | `mesilla-basilica-of-san-albino` |
| New Mexico | Santa Fe | Cathedral Basilica of St. Francis of Assisi | `santa-fe-cathedral-basilica-of-st-francis-of-assisi` |
| New York | Brooklyn | Basilica of Our Lady of Perpetual Help | `brooklyn-basilica-of-our-lady-of-perpetual-help` |
| New York | Brooklyn | Basilica of Regina Pacis | `brooklyn-basilica-of-regina-pacis` |
| New York | Brooklyn | Cathedral Basilica of St. James | `brooklyn-cathedral-basilica-of-st-james` |
| New York | Lackawanna | Basilica of Our Lady of Victory (National Shrine) | `lackawanna-basilica-of-our-lady-of-victory-national-shrine` |
| New York | Lewiston | Basilica of the National Shrine of Our Lady of Fatima | `lewiston-basilica-of-the-national-shrine-of-our-lady-of-fatima` |
| New York | New York | Basilica of St. Patrick's Old Cathedral | `new-york-basilica-of-st-patrick-s-old-cathedral` |
| New York | Olean | Basilica of St. Mary of the Angels | `olean-basilica-of-st-mary-of-the-angels` |
| New York | Southampton | Basilica of the Sacred Hearts of Jesus and Mary | `southampton-basilica-of-the-sacred-hearts-of-jesus-and-mary` |
| New York | Syracuse | Basilica of the Sacred Heart of Jesus | `syracuse-basilica-of-the-sacred-heart-of-jesus` |
| North Carolina | Asheville | Basilica of St. Lawrence | `asheville-basilica-of-st-lawrence` |
| North Carolina | Belmont | Basilica of Our Lady Help of Christians (Belmont Abbey) | `belmont-basilica-of-our-lady-help-of-christians-belmont-abbey` |
| North Carolina | Wilmington | Basilica Shrine of St. Mary | `wilmington-basilica-shrine-of-st-mary` |
| North Dakota | Jamestown | Basilica of St. James | `jamestown-basilica-of-st-james` |
| Ohio | Canton | Basilica of St. John the Baptist | `canton-basilica-of-st-john-the-baptist` |
| Ohio | Carey | Basilica & National Shrine of Our Lady of Consolation | `carey-basilica-national-shrine-of-our-lady-of-consolation` |
| Ohio | Cincinnati | Cathedral Basilica of St. Peter in Chains | `cincinnati-cathedral-basilica-of-st-peter-in-chains` |
| Ohio | Lancaster | Basilica of St. Mary of the Assumption | `lancaster-basilica-of-st-mary-of-the-assumption` |
| Ohio | Marietta | Basilica of St. Mary of the Assumption | `marietta-basilica-of-st-mary-of-the-assumption` |
| Ohio | North Jackson | Basilica & National Shrine of Our Lady of Lebanon | `north-jackson-basilica-national-shrine-of-our-lady-of-lebanon` |
| Ohio | Youngstown | Basilica of Our Lady of Mount Carmel | `youngstown-basilica-of-our-lady-of-mount-carmel` |
| Pennsylvania | Danville | Basilica of Sts. Cyril and Methodius | `danville-basilica-of-sts-cyril-and-methodius` |
| Pennsylvania | Hanover | Basilica of the Sacred Heart of Jesus (Conewago Chapel) | `hanover-basilica-of-the-sacred-heart-of-jesus-conewago-chapel` |
| Pennsylvania | Latrobe | St. Vincent Archabbey Basilica | `latrobe-st-vincent-archabbey-basilica` |
| Pennsylvania | Loretto | Basilica of St. Michael the Archangel | `loretto-basilica-of-st-michael-the-archangel` |
| Pennsylvania | Philadelphia | Basilica Shrine of Our Lady of the Miraculous Medal | `philadelphia-basilica-shrine-of-our-lady-of-the-miraculous-medal` |
| Pennsylvania | Philadelphia | Cathedral Basilica of Sts. Peter and Paul | `philadelphia-cathedral-basilica-of-sts-peter-and-paul` |
| Pennsylvania | Scranton | Basilica of the National Shrine of St. Ann | `scranton-basilica-of-the-national-shrine-of-st-ann` |
| South Carolina | Columbia | Basilica of St. Peter | `columbia-basilica-of-st-peter` |
| Tennessee | Chattanooga | Basilica of Sts. Peter and Paul | `chattanooga-basilica-of-sts-peter-and-paul` |
| Texas | Beaumont | St. Anthony Cathedral Basilica | `beaumont-st-anthony-cathedral-basilica` |
| Texas | Galveston | St. Mary Cathedral Basilica | `galveston-st-mary-cathedral-basilica` |
| Texas | San Antonio | Basilica of the National Shrine of the Little Flower | `san-antonio-basilica-of-the-national-shrine-of-the-little-flower` |
| Texas | San Juan | Basilica of the National Shrine of Our Lady of San Juan del Valle | `san-juan-basilica-of-the-national-shrine-of-our-lady-of-san-juan-del-valle` |
| Virginia | Alexandria | Basilica of St. Mary | `alexandria-basilica-of-st-mary` |
| Virginia | Norfolk | Basilica of St. Mary of the Immaculate Conception | `norfolk-basilica-of-st-mary-of-the-immaculate-conception` |
| Virginia | Roanoke | Basilica of St. Andrew | `roanoke-basilica-of-st-andrew` |
| West Virginia | Charleston | Basilica of the Co-Cathedral of the Sacred Heart | `charleston-basilica-of-the-co-cathedral-of-the-sacred-heart` |
| Wisconsin | Hubertus | Basilica of Our Lady of Holy Hill (Help of Christians) | `hubertus-basilica-of-our-lady-of-holy-hill-help-of-christians` |
| Wisconsin | Milwaukee | Basilica of St. Josaphat | `milwaukee-basilica-of-st-josaphat` |
