# Oscar Club · oscarclubsofia.com

The website of Oscar Club, a cocktail bar at 15 Slavyanska St, Sofia (since 1999). Bulgarian and English.

Static, hand-written HTML, CSS and JavaScript. No build step, no framework, no third-party requests (fonts are
self-hosted). All content is in the HTML; the one script only adds behaviour on top (open-now status, carousel,
cocktail index preview, menu filter and category bar, copy buttons), so every page works without it.

It replaces the old site file for file: the Bulgarian pages keep their old addresses, English is new under `/en/`,
and none of the old site's files are renamed, moved or overwritten except the two old pages.

## Structure

```
index.html                 Home, Bulgarian   https://oscarclubsofia.com/
en/index.html              Home, English     https://oscarclubsofia.com/en/
mainmenu/index.html        Menu, Bulgarian   https://oscarclubsofia.com/mainmenu/
en/mainmenu/index.html     Menu, English     https://oscarclubsofia.com/en/mainmenu/
css/styles.css             the one stylesheet
js/main.js                 the one script (progressive enhancement; documented at the top)
assets/fonts/              self-hosted WOFF2 subsets (Poiret One, Cormorant italic, Onest) + their OFL licences
assets/img/                photos and logos (cocktails as WebP)
assets/icons/              favicons
assets/share/              the link-preview image (1200×630)

docs/handoff.html          the hand-off note for the bar (Bulgarian, then English); not uploaded
design-system/             the v2 prototype: the design reference. Not uploaded, not edited
tests/                     Playwright suite, local server, old-site fixture
tools/                     packaging, the dist test run, the share-image generator
```

Links between pages are relative and always name the file (`../en/index.html`), so the pages work on the host, on a
local server and straight from disk. Canonical and hreflang URLs are absolute, in directory form (`/en/`).

Files the old site has on the server stay there and keep working: `/logoOscar.png`, `/prizeyear.png`, `/menu3.png`,
`/mainmenu/png/*`, `/mainmenu/food/*`. New files only go into new folders (`assets/`, `css/`, `js/`, `en/`).

### The design system

`design-system/` is the v2 prototype ("Dark room, lit glass" with the Neon Deco sign): the source of truth for how
every section looks and reads, in both languages. It draws its screens with JavaScript and loads Google Fonts, so it
is a reference only: it is never uploaded and the site doesn't use any of its files. Open it through the local server
at `http://localhost:4173/design-system/index.html` and pick Version 2, then a page, a width and BG/EN.

## Run it locally

```
npm run serve              # http://localhost:4173/index.html  (any static server at the repo root works too)
```

Add `?now=YYYY-MM-DDTHH:MM` to set the clock in Sofia time, e.g. `/index.html?now=2026-11-20T01:30`.

## Test

Dev-only tooling; none of it is uploaded. Needs Node 18 or newer.

```
npm install
npm test                   # installs Chromium for Playwright if needed, then runs tests/*.spec.js on the working tree
npm run test:all           # the same suite in all three engines: Chromium, Firefox and WebKit (Safari's engine)
npm run test:dist          # packages (below), then runs the same suite against dist/oscarclubsofia.com (Chromium)
```

`npm test` stays on Chromium so it is quick; run `npm run test:all` before a release. The few checks an engine can't
make (e.g. reading the clipboard back) are skipped there with the reason written next to the skip. The dist run takes
engines too: `npm run test:dist -- --project=chromium --project=firefox --project=webkit`.

The suite opens the pages in a real browser and checks only what a visitor sees and can do: the open-now status by
Sofia time, both languages side by side, every link and file resolving with no third-party requests, no-JS and
reduced-motion behaviour, the carousel, index, filter and category bar, axe accessibility scans, titles, link
previews and JSON-LD. `tests/15-package.spec.js` checks the upload itself (see Package).

Run one file with `npx playwright test tests/12-menu.spec.js --project=chromium` (leave out `--project` for all three
engines); pass the same arguments to the dist run with
`npm run test:dist -- tests/12-menu.spec.js`. `SITE_ROOT=<folder>` makes the test server serve another folder.

## Package

```
npm run package
```

Deletes `dist/` and builds it again from scratch:

```
dist/oscarclubsofia.com/       the upload: exactly the files that go on the server, at their server paths
dist/README-handoff.html       the hand-off note (from docs/handoff.html), next to the folder, not inside it
dist/oscarclubsofia.com.zip    both of the above in one file, to send to the bar
```

`tools/package.js` follows references instead of using a list: it starts from the four pages and takes every file
they reference (src, href, srcset, CSS `url()`, and the absolute `https://oscarclubsofia.com/…` addresses in meta tags
and JSON-LD), then everything those files reference. An image nobody references is not shipped. The fonts' OFL
licences ship next to the fonts. A reference that doesn't resolve, or that points outside the site's files, stops the
build. The zip is written with Node's own zlib, so no zip tool is needed on any OS.

The package test checks that the folder holds only site files and nothing from the dev side, that every shipped file
is referenced and every reference resolves, that the zip matches the folder byte for byte, and, using the stand-in
for the old site in `tests/fixtures/old-site/`, that uploading the folder over the old site leaves every old asset
URL answering with its original bytes while the four pages become the new ones.

`dist/` is git-ignored. Don't edit files there; change the source and package again.

## Hand-off

Send `dist/oscarclubsofia.com.zip` to the bar. `README-handoff.html` inside it (source: `docs/handoff.html`) says,
in Bulgarian and English: what to upload (the contents of `oscarclubsofia.com/` into the site's main folder,
overwriting), what must not be deleted on the server, three checks after the upload, and the open "Питай бара"
items (NX0 download link, founder's name, opening hours, rating snapshot, Averna's euro price).

## Content still to confirm with the bar

Kept on the site as visibly marked "Питай бара" / "Ask the bar" notes or left out, never guessed:

- the NX0 download link (and the partnership terms): marked on both menu pages;
- the founder's name: hidden from the story until the owner confirms it;
- whether the opening hours have changed since November 2026;
- the Google and Tripadvisor ratings are a November 2026 snapshot;
- Averna's price in euro (the old site lists it in leva).
