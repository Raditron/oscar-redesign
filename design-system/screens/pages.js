/* Checkpoint 2 — the two live pages, rebuilt on the Foundations. Same URLs, same asset folders. */
(() => {
const D = PX.doc;
const styleNote = () => `Style <b>${PX.STYLES[PX.style].label}</b> (${PX.STYLES[PX.style].sub}). Switch styles in the toolbar: only type, shape and glow change; content and layout stay put, so you compare looks, not pages.`;

PX.route({ path: 'home', page: 'home', layout: 'site', styles: true, title: 'Home',
  intro: () => ({ kicker: 'Checkpoint 2 · /index.html', h1: 'Home: book in one tap, see the bar in one screen', lede: `${styleNote()} Try the BG / EN switch in the site header and the width switch above.` }),
  render: () => OC.pages.home(),
  doc: () => D.sec('01 · What changed', 'Every element of today’s home page, accounted for', 'Nothing from the current page is lost. Each row says where it went. The current page is a logo, six centred paragraphs, an unlabelled award image, two pulsing icon buttons and a map.', D.table(['Today', 'Redesign', ''], [
      ['Facebook, Instagram and menu icons in a row above the logo', 'Header: logo, Menu / Cocktails / Events / Visit, BG·EN, Call. Socials move to the footer.', 'm'],
      ['Logo PNG, 150px, white', 'OC mark redrawn as SVG: sharp at any size, takes each style’s colour', 'r'],
      ['Six paragraphs of history, gold, centred', 'Hero lede (the old-Hollywood line) + a two-paragraph story beside the storefront photo', 'c'],
      ['Award image, 400px, no caption', 'Proof strip: Brand of the Year 2024 with its caption, next to the Google and Tripadvisor ratings', 'r'],
      ['Two round pulsing buttons with no labels (phone, email)', '“Call to book a table” + “Message us on Instagram” in the hero, Call in the header, Call in the thumb bar', 'r'],
      ['Pulse animation on the call button (#ec8b00 ripple)', 'Kept as the heartbeat on the open-now dot, slowed to 2.4s and switched off for reduced motion', 'k'],
      ['Google Maps iframe, 600×450', 'Visit block: address as text, Directions button, plus code, phone, email, Instagram', 'r'],
      ['—', 'Opening hours with today marked and a live open / closing soon / closed status (Sofia time, after-midnight closes handled)', 'n'],
      ['—', 'Ratings: Google 4.7 (671), Tripadvisor 4.8 (141)', 'n'],
      ['Events offer only as a flyer image on the menu page', 'Events section: private, corporate, festivals; email and phone as text with copy buttons', 'm'],
      ['—', 'Six signature cocktails as a swipe rail (phone) or grid, names and ingredients as real text', 'n'],
      ['<code>lang="en"</code> on a Bulgarian page', '<code>lang="bg"</code> on /index.html, English at /en/index.html', 'r'],
      ['Reservations by phone and Instagram', 'Same two channels, made obvious. No booking form, as agreed', 'k']
    ]))
    + D.sec('02 · Copy', 'Every sentence says something a guest could check', 'Written to the NX0 copy guide: each line carries a fact from the list in <code>data.js</code>, said the way a friend would say it, with informal “ти” throughout. Headlines have two beats; the second is set quieter.', D.table(['Live site', 'Redesign', '', 'Why'], [
      ['“…е като отдих в стар холивудски филм, където всяка глътка е магия…”', '“От 1999 г. сме на „Славянска“ 15. В менюто има 13 коктейла, които измислихме тук, от 6 до 12 €.”', 'r', 'Address, year, count and price range can all be checked. The old-Hollywood feeling now comes from the design.'],
      ['“…съчетава ретро чар с модерна изтънченост…”', '—', 'c', 'True of any bar, so it says nothing.'],
      ['“Барманите са истински артисти…”', '“Тараторът е студена супа. Нашият е в чаша, с водка и Скинос.”', 'r', 'One real drink, described from its card and photo, shows the craft.'],
      ['“Опитайте Golden Age Martini… Hugo Negroni…”', '—', 'f', 'Neither drink is on the live menu. A guest would order and be told no.'],
      ['“Обслужването в „Оскар клуб“ е безупречно…”', '—', 'c', 'Can’t be checked. The 4.7 and 4.8 ratings say it with numbers.'],
      ['“…Това не е просто бар. Това е нашето семейство.”', '—', 'c', 'The “not just X” pattern. The 1999 story replaces it.'],
      ['Hidden history, commented out: 1999, Trifon Gyatsov, café by day, club at night', '“Започнахме като кафене за бизнес срещи. Вечер ставаше клуб.”', 'n', 'The only concrete story the bar has written. Owners to confirm.'],
      ['—', '“В събота често има DJ…” + “Някои вечери има вход, 10–15 €.”', 'n', 'From the Instagram posts. The entry fee is said before a guest finds it at the door.'],
      ['“Contact Us” · “How to find us”', '“„Славянска“ 15, в центъра. Влизаш под светещия знак OC.”', 'r', 'A street and the sign over the door: something you can see.'],
      ['“Обади се” next to “Пишете ни”', '“ти” everywhere', 'r', 'Matches the slogan and the voice. One form of address on the whole site.']
    ]))
    + D.sec('03 · Laws of UX', 'The laws behind the layout', '', D.laws([
      ['Fitts’s Law', 'Action bar', 'Call, Directions, Menu and Instagram sit in a 64px bar at the bottom of the phone, under the thumb.'],
      ['Jakob’s Law', 'Header', 'Logo left goes home, nav in the middle, the one action on the right. Like every bar site guests have used.'],
      ['Serial Position Effect', 'Page order', 'Opens with the slogan and how to book; closes with where and when. The middle holds the drinks.'],
      ['Von Restorff Effect', 'Gold', 'Only the primary action is filled gold on each screen. Everything else is ivory or outline.'],
      ['Aesthetic-Usability Effect', 'Hero', 'The glasses glow in their own colours. A beautiful first screen buys patience for everything after it.'],
      ['Law of Proximity', 'Cocktail card', 'Name, ingredients and price sit tight together; cards sit far apart. Each drink reads as one thing.'],
      ['Doherty Threshold', 'Status', 'Open-now is calculated on the page, no request: it is there before the first scroll.'],
      ['Hick’s Law', 'Teaser', 'Six cocktails, not thirteen, on the home page. The full list is one tap away.']
    ]))
    + D.foot('Open the Annotations switch to see every new element outlined. Content sources: hours and ratings from the Google Maps listing (via Wanderlog), phone and email from the live site and the events flyer.')
});

PX.route({ path: 'menu', page: 'menu', layout: 'site', styles: true, title: 'Menu',
  intro: () => ({ kicker: 'Checkpoint 2 · /mainmenu/index.html', h1: 'Menu: real text, one tap to any category', lede: `${styleNote()} Filter the cocktails by base spirit; tap a category in the bar to jump.` }),
  render: () => OC.pages.menu(),
  doc: () => D.sec('01 · What changed', 'The menu, row by row', 'The live menu is a flip-effect slider of 13 photos with the names and ingredients printed inside each picture, then 11 accordions. Screen readers and Google see none of the cocktail names, and nothing can be translated.', D.table(['Today', 'Redesign', ''], [
      ['Flip slider, one cocktail at a time, text baked into the photo', 'Grid of 13 cards: the glass on its own (cropped from the same photos), name, ingredients, volume and price as text', 'r'],
      ['—', 'Filter by base spirit: vodka 3, whiskey 2, rum 2, tequila 2, gin 2, cognac 1, soju 1', 'n'],
      ['—', 'Sticky category bar: Cocktails, Shots, Vodka … Soft drinks. Follows the scroll', 'n'],
      ['21 shots, each priced “3 €”', 'One heading says “all 3 €”; two columns from tablet width. The two sets keep their own prices', 'g'],
      ['Accordion buttons with a PNG arrow, closed panels via inline style', 'Native <code>&lt;details&gt;</code>: keyboard and no-JS ready; the row shows volume and how many items', 'r'],
      ['“Всички цени са в евро” at the bottom', 'Same line at the top of the page, before the prices', 'm'],
      ['Events flyer image at the bottom', 'Moved to the home page Events section as text', 'm'],
      ['Commented-out blocks: classic cocktails (still in BGN), rum, aperitifs, food', 'Left out, as on the live page', 'k'],
      ['Averna priced “3 BGN”', 'Shown as “—” with a note until the bar confirms the euro price', 'f'],
      ['BICKENS gin listed twice at 5 €', 'Listed once', 'f'],
      ['Typos: Coinreau, aftershok, jager, AUCHEN TOSHAN, schofferhofer', 'Cointreau, Aftershock, Jägermeister, Auchentoshan, Schöfferhofer', 'r']
    ]))
    + D.sec('02 · Laws of UX', 'The laws behind the menu', '', D.laws([
      ['Hick’s Law', 'Filter', 'Seven base spirits narrow 13 cocktails to one to three. Choosing gets faster, not slower.'],
      ['Miller’s Law', 'Shots', '21 shots in two short columns with one shared price, instead of 21 price tags.'],
      ['Chunking', 'Categories', 'Eleven labelled groups with counts, so guests open the one they want.'],
      ['Law of Common Region', 'Accordion', 'Each category is one bordered region: title, volume, count, then its rows.'],
      ['Fitts’s Law', 'Category bar', '44px chips that stay under the header; the Menu tab in the thumb bar jumps to the top.'],
      ['Law of Similarity', 'Prices', 'Every price is the same gold, same weight, right-aligned with dot leaders: the classic printed-menu pattern.']
    ]))
    + D.foot('Cocktail photos are the bar’s own, cut from the original menu cards with the printed title, gold frame and ingredients removed, so garnishes that rise past the frame stay whole. The flavour meter in Foundations is ready for when the bar gives each cocktail its five values.')
});
})();
