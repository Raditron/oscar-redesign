/* Checkpoint 0 — Research. What the bar already has, what Instagram says, what the best bar sites do, the numbers we hold to. */
(() => {
const D = PX.doc;
const swatch = (hex, name, src, cr) => `<article style="background:var(--card);border:1px solid var(--page-line);border-radius:14px;overflow:hidden"><i style="display:block;height:64px;background:${hex}"></i><div style="padding:10px 12px;display:grid;gap:2px"><b style="font:600 13px var(--mono)">${hex}</b><span style="font-size:13.5px">${name}</span><span style="font-size:12.5px;color:var(--page-muted)">${src}${cr ? ' · ' + cr : ''}</span></div></article>`;

PX.route({ path: 'research', layout: 'doc', title: 'Research',
  intro: { kicker: 'Checkpoint 0 · Research', h1: 'What the bar already is, before we design anything', lede: 'The live site, the events flyer, the cocktail cards, the Instagram feed and the Google listing, read closely. Then how the world’s best bars build their sites, and the craft numbers this redesign holds itself to.' },
  render: () => `<div class="doc" style="margin-top:8px">
  ${D.sec('01 · Brand inputs', 'The palette and type are already there', 'Black, two golds and an amber, plus a slogan in English on every channel. We keep all of it and fix how it is used.',
    `<div class="diag" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${swatch('#0b0a08', 'Warm black', 'every page and photo')}${swatch('#b19859', 'Site gold', 'icons, text on the site', '7.1:1 on black')}${swatch('#e8c96a', 'Flyer gold', 'events flyer, cocktail cards', '12.3:1')}${swatch('#ec8b00', 'Amber', 'call-button pulse', '7.8:1')}${swatch('#f3ebdd', 'Ivory', 'the lit OC sign', '16.7:1')}</div>`
    + D.diag([
      ['Fonts: Philosopher + Ubuntu Sans', 'Philosopher bold italic on the cocktail slides, Ubuntu Sans on the menu. Both have Cyrillic. They become style C.'],
      ['Slogan: “allow yourself to be yourself.”', 'In English on the site’s old history text and on Instagram, set in an elegant italic serif. It becomes the hero headline in both languages.'],
      ['Story: old Hollywood, since 23.05.1999', '“Като отдих в стар холивудски филм.” 27 years, Brand of the Year 2024 (Класация БГ).']
    ]))}
  ${D.sec('02 · Instagram', '“cocktails | music | retro futurism”', 'The feed is livelier than the website: a lit OC sign above an amber storefront, a copper chandelier, red nebula backdrops, DISCOCKTAILS and vinyl nights, Halloween and Aperol parties. 2,544 followers.',
    `<div class="research-imgs"><figure><img src="img/storefront.webp" alt="The Oscar Club entrance at night under the lit OC sign" loading="lazy"><figcaption>Storefront at night. The ring sign is the model for the OC mark and for style B’s glow.</figcaption></figure><figure><img src="img/dj-chandelier.webp" alt="DJ at Oscar Club under a copper chandelier with glowing bulbs" loading="lazy"><figcaption>Season opening: the copper chandelier and warm bulbs. The amber and the glow come from here.</figcaption></figure></div>`
    + D.diag([
      ['Photos are 480–640px', 'Good for cards, too small for a full-width hero. We use them small and ask the bar for originals.'],
      ['Only the bar’s own posts', 'Posts by guest DJs and other accounts (Bo Vinyls, guests) are left out.'],
      ['Facebook is behind a login', 'Nothing usable without signing in. Instagram carries the brand.']
    ]))}
  ${D.sec('03 · The drinks', 'The colour is in the glass', 'The 13 live signature cocktails, cropped out of their photo cards. Each belongs to one of six drink families; that family lights its card on the new site.',
    `<div class="glass-strip">${OC.cocktails.map(c => `<figure><img src="img/cocktails/${c.img}.webp" alt="" loading="lazy"><figcaption><i style="background:var(--d-${c.drink})"></i>${c.name}</figcaption></figure>`).join('')}</div>`)}
  ${D.sec('04 · Today’s site', 'What gets in the guest’s way', 'Two pages: /index.html and /mainmenu/index.html. No sitemap, nothing else linked. Both URLs stay.', D.diag([
      ['No opening hours anywhere', 'The first thing anyone asks a bar. Found on the Google listing: Mon–Wed and Sun 18:00–23:30, Thu to 02:00, Fri–Sat to 03:00.', ['Selective Attention']],
      ['Cocktail names are pictures', '13 cards with name, ingredients and volume printed inside the image. Invisible to Google and screen readers; can’t be translated.', ['Jakob’s Law']],
      ['Two unlabelled pulsing buttons', 'A phone and an envelope icon, no text. The pulse never stops.', ['Fitts’s Law', 'Doherty Threshold']],
      ['A map iframe, no address', 'The address isn’t written anywhere as text, and there’s no Directions button.', ['Postel’s Law']],
      ['Bulgarian page marked English', '<code>lang="en"</code> on Bulgarian text: wrong voice in screen readers, wrong letterforms.', ['Mental Model']],
      ['Events offer hidden in a flyer', 'Email and second phone exist only inside /mainmenu/png/events.jpeg.', ['Selective Attention']],
      ['Award with no caption', 'A 400px trophy photo between paragraphs; nothing says what it is.', ['Cognitive Bias']],
      ['Menu data issues', 'Averna priced in BGN, Bickens gin listed twice, several typos, rum and aperitif sections commented out.', ['Law of Similarity']]
    ]))}
  ${D.sec('05 · Reference bars', 'How the best bar sites do it', 'Checked live: World’s 50 Best regulars and Awwwards picks. The pattern is consistent: hours, address and the booking action near the top; signatures as text cards; awards with captions.', D.table(['Bar', 'City', 'What we borrow'], [
      ['<a href="https://maybesammy.com/" target="_blank" rel="noopener">Maybe Sammy</a>', 'Sydney', 'Golden-age Hollywood theme carried by type, not clutter; signatures as cards; awards list'],
      ['<a href="https://paradiso.cat/" target="_blank" rel="noopener">Paradiso</a>', 'Barcelona', 'Cocktail cards with photo, name, ingredients; awards grid; language switch in the header'],
      ['<a href="https://www.kwantmayfair.com/" target="_blank" rel="noopener">Kwānt</a>', 'London', 'Calm anchor nav; complete Visit block with hours and a Directions button'],
      ['<a href="https://www.rosewoodhotels.com/en/the-carlyle-new-york/dining/bemelmans-bar" target="_blank" rel="noopener">Bemelmans</a>', 'New York', 'Hours and live-music schedule stated plainly'],
      ['<a href="https://www.dante-nyc.com/" target="_blank" rel="noopener">Dante</a>', 'New York', 'Award banner straight after the hero; one “Book” action'],
      ['<a href="https://www.awwwards.com/sites/mun-rooftop-cocktail-bar" target="_blank" rel="noopener">Mùn Rooftop</a>', 'Rome', 'One orchestrated motion moment instead of effects everywhere']
    ]) + D.diag([
      ['Common mistakes we avoid', 'PDF-only menus, hidden hours, text inside images, contradictory booking messages, placeholder links, the same block twice.']
    ]))}
  ${D.sec('06 · Craft numbers', 'The rules this system holds itself to', 'Collected from Nielsen Norman Group, Laws of UX, WCAG 2.2, Material and web.dev. Where a number is convention rather than a standard, it says so.', D.table(['Area', 'Rule', 'Source'], [
      ['Contrast', 'Body text ≥ 4.5:1, large text and edges ≥ 3:1', 'WCAG 2.2 SC 1.4.3 / 1.4.11'],
      ['Targets', '≥ 44px; we use 48px buttons, 44px chips', 'WCAG 2.5.5, Apple HIG, Material'],
      ['Line length', '45–90 characters; we stop at 62ch', 'Butterick, Practical Typography'],
      ['Type scale', 'Ratio 1.2 on phones → 1.25 on desktop, fluid with clamp()', 'Utopia (convention)'],
      ['Spacing', '8pt grid, half steps allowed; inside < between', 'Spec.fm 8pt grid'],
      ['Dark UI', 'Off-black surfaces; desaturate accents; never white on gold', 'Material dark theme'],
      ['Motion', '100–300ms for UI, ≤ 400ms; ease-out; transform + opacity only; honour reduced motion', 'NN/g, web.dev'],
      ['Reveals', 'Content readable at rest; a reveal may slide, never hide', 'web.dev (fail open)'],
      ['Speed', 'LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; width and height on every image', 'Core Web Vitals'],
      ['Language', '<code>lang="bg"</code> so browsers pick Bulgarian Cyrillic forms', 'Fontsource / type.today']
    ]))}
  ${D.sec('07 · Still with the bar', 'What we need from the owners', '', D.moves([
      ['Original photos', 'Full-size originals of the storefront, the chandelier and the bar. Instagram copies are 480–640px.'],
      ['Hours, confirmed', 'From the Google listing; holiday and seasonal changes still to confirm.'],
      ['Walk-ins', 'On Fridays and Saturdays, do guests need to book, or can they walk in if there’s room?'],
      ['Events service', 'Which cities, how many guests minimum, and how the price is worked out.'],
      ['The 1999 story', 'Confirm the hidden history text and that Trifon Gyatsov can be named.'],
      ['English copy', 'Approve our translation or send their own.'],
      ['Music nights', 'The DISCOCKTAILS / vinyl schedule and any cover charge.'],
      ['Menu fixes', 'Averna in euro, the second Bickens, and whether rum and aperitifs come back.'],
      ['Flavour values', 'Sweet, sour, bitter, fruity, refreshing for each cocktail, if they want the meter.']
    ]))}
  ${D.foot('Sources: oscarclubsofia.com (index + mainmenu), instagram.com/oscarclub_official, Google Maps listing via Wanderlog, the agents’ research on reference bars and UI/UX rules. Tracked in GitHub issue #1.')}
</div>`
});
})();
