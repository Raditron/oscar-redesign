# Oscar Club — oscarclubsofia.com

Static, hand-written HTML, CSS and JavaScript. No build step, no framework, no third-party requests.
The v2 design reference (prototype) lives in `design-system/`; open `design-system/index.html` through a local server.

## The site

```
index.html                 Home, Bulgarian  (https://oscarclubsofia.com/)
en/index.html              Home, English    (https://oscarclubsofia.com/en/)
mainmenu/index.html        Menu, Bulgarian  (https://oscarclubsofia.com/mainmenu/)
en/mainmenu/index.html     Menu, English    (https://oscarclubsofia.com/en/mainmenu/)
css/styles.css             the one stylesheet
js/main.js                 the one script (progressive enhancement: the pages work without it)
assets/fonts/              self-hosted WOFF2 (Poiret One, Cormorant italic, Onest) + their OFL licences
assets/img/                images
assets/icons/              favicon
```

Links between pages are relative and always name the file (`../en/index.html`), so the pages work on the host,
on a local server and straight from disk. Canonical and hreflang URLs are absolute, in directory form (`/en/`).

## Run it locally

```
npm run serve              # http://localhost:4173/index.html  (any static server at the repo root works too)
```

## Test

Dev-only tooling; none of it is uploaded.

```
npm install
npm test                   # installs Chromium for Playwright if needed, then runs tests/*.spec.js
```

Tests set the clock with `?now=YYYY-MM-DDTHH:MM` (Sofia local time), e.g. `/index.html?now=2026-11-20T01:30`.
