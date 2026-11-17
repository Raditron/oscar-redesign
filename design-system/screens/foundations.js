/* Checkpoint 1 — Foundations. Tokens, every site component with its states, and the usage rules.
   Each spec names what it lifts from the live site or Instagram (gold tag) and the outside pattern it borrows (brown tag). */
(() => {
const { $, $$ } = PX;
const t = OC.t, I = OC.I;
const ex = (cap, html) => `<div style="min-width:0"><p class="stage-cap">${cap}</p>${html}</div>`;
const S = () => PX.style;
const narrow = html => `<div class="site" data-style="${S()}" style="max-width:390px;border:1px solid var(--line);border-radius:14px;overflow:hidden">${html}</div>`;
const sw = (name, hex, note, cr) => `<div class="sw"><i style="background:${hex}"></i><div><b>${name}</b><span>${hex}</span>${note ? `<span>${note}</span>` : ''}${cr ? `<span class="cr">${cr}</span>` : ''}</div></div>`;
const DEMO_TIMES = [['now', 'Now (Sofia)', null], ['mon1730', 'Mon 17:30', { d: 1, m: 17 * 60 + 30 }], ['wed2300', 'Wed 23:00', { d: 3, m: 23 * 60 }], ['fri0115', 'Sat 01:15', { d: 6, m: 75 }], ['sun0250', 'Sun 02:50', { d: 0, m: 170 }]];
let demoKey = 'now';

const SPECS = [
/* ---------------- Brand ---------------- */
{ g: 'Brand', id: 'logo', t: 'OC mark', o: ['logoOscar.png', 'events flyer'], b: ['The lit sign at Slavyanska 15'], laws: ['Law of Prägnanz', 'Jakob’s Law'],
  why: 'The two rings from the logo, redrawn as SVG so the same mark can be gold, ivory or a lit neon tube without a new file. The lowercase wordmark sits inside the rings exactly as on the sign above the door.',
  stage: () => `<div class="stage-grid">${ex('Header · 84px', `<div style="width:84px">${OC.mark()}</div>`)}${ex('Footer · 120px', `<div style="width:120px">${OC.mark()}</div>`)}${ex('Hero size · 240px', `<div style="width:240px">${OC.mark()}</div>`)}${ex('Today: PNG, 150px, white only', `<img src="img/logo-oc.png" alt="Current Oscar Club logo" style="width:150px;opacity:.9">`)}</div>`,
  rules: ['<b>Minimum width 72px</b>; below that the wordmark is dropped (<code>OC.mark(false)</code>).', 'Gold on dark in A and C. Ivory with a gold halo in B, like the real sign.', 'Never on a photo without a dark scrim behind it.'] },

{ g: 'Brand', id: 'colour', t: 'Colour', o: ['#b19859 site gold', '#e8c96a flyer gold', '#ec8b00 call pulse'], b: ['Art Deco black, ivory and brass'], laws: ['Von Restorff Effect', 'Aesthetic-Usability Effect'],
  why: 'Every colour is the bar’s own: the gold from today’s icons, the brighter gold from the events flyer and cocktail cards, the amber of the call-button pulse, and the black every cocktail is shot on. The surfaces are warm off-black so long text doesn’t glare; pure black is kept for behind the photos.',
  stage: () => `<div style="display:grid;gap:22px"><div>${'<p class="stage-cap">Surfaces</p>'}<div class="sw-grid">${sw('--ink-0', '#0b0a08', 'page')}${sw('--ink-1', '#14110c', 'bands, panels')}${sw('--ink-2', '#1d1912', 'cards, today row')}${sw('--ink-3', '#2a241a', 'pressed, chips')}${sw('--photo-black', '#000000', 'behind photos only')}</div></div>
    <div><p class="stage-cap">Text</p><div class="sw-grid">${sw('--ivory', '#f3ebdd', 'primary', '16.7:1')}${sw('--ivory-2', '#c2b6a2', 'secondary', '9.9:1')}${sw('--ivory-3', '#8c8273', 'captions', '5.2:1')}</div></div>
    <div><p class="stage-cap">Brand</p><div class="sw-grid">${sw('--gold', '#b19859', 'lifted · site', '7.1:1')}${sw('--gold-hi', '#e8c96a', 'lifted · flyer', '12.3:1')}${sw('--gold-lo', '#6e5d33', 'rules only', '3.1:1 · no text')}${sw('--amber', '#ec8b00', 'lifted · pulse', '7.8:1')}</div></div>
    <div><p class="stage-cap">Status</p><div class="sw-grid">${sw('--open', '#7fd18b', 'open now', '10.7:1')}${sw('--soon', '#f2b84b', 'closing soon', '11.1:1')}${sw('--closed', '#e58a7c', 'closed', '7.8:1')}</div></div></div>`,
  rules: ['<b>60 / 30 / 10</b>: black surfaces, ivory text, gold accents.', '<b>One filled gold element per screen</b>: the main action. A second gold fill dilutes the first.', 'Text on gold is always <code>--on-gold</code> (7.1:1). White on gold fails at 2.1:1.', '<code>--ivory-3</code> never sits on <code>--ink-3</code> (4.1:1).'] },

{ g: 'Brand', id: 'drinks', t: 'Drink colour', o: ['the 13 signature photos'], b: ['Paradiso cocktail cards'], laws: ['Law of Similarity', 'Aesthetic-Usability Effect'],
  why: 'This is where the colour comes from. Each cocktail belongs to one of six families taken from its own glass, and its card sets <code>--drink</code> to that family. The halo, the edge and the hover glow all follow. Thirteen colours would be noise; six families make a palette.',
  stage: () => `<div class="sw-grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${[['garden', '#a9d13b', 'Tarator · Tropilita · Spraoi'], ['curacao', '#2fa4f0', 'Blue’s’our'], ['berry', '#e5383b', 'Machree · Better Taste'], ['hibiscus', '#e8578f', 'Kiss Me · Cherry Lady'], ['amber', '#ec8b00', 'Eden Garden · Fridge Cigarette'], ['champagne', '#f1de9c', 'French 69 · Soju Spritz · Mucho Bien']].map(([k, h, n]) => { const c = OC.cocktails.find(x => x.drink === k); return `<div class="sw" style="--d:${h}"><i style="height:120px;background:radial-gradient(60% 70% at 50% 65%,color-mix(in srgb,${h} 45%,transparent),transparent 75%),#000;position:relative;overflow:hidden"><img src="img/cocktails/${c.img}.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:lighten"></i><div><b>--d-${k}</b><span>${h}</span><span class="cr">${n}</span></div></div>`; }).join('')}</div>`,
  rules: ['Drinks <b>light things</b>: halos, edges, dots. They never carry small text (berry is 4.7:1).', 'Set <code>style="--drink:var(--d-berry)"</code> on the card; everything inside follows.', 'A new cocktail joins the family closest to its glass. No new colours.'] },

{ g: 'Brand', id: 'type', t: 'Typography', o: ['Philosopher', 'Ubuntu Sans', 'their “allow yourself to be yourself.” post'], b: ['Art Deco posters', 'Utopia fluid scale'], laws: ['Aesthetic-Usability Effect', 'Law of Similarity'],
  why: 'Three pairings, one per style, all with full Bulgarian Cyrillic (checked against Google Fonts’ Cyrillic subsets). The scale is fluid: ratio 1.2 on a phone growing to 1.25 on a desktop, so headlines grow with the screen without breakpoints. Body text is 17px, one step above 16, because light text on dark reads thinner.',
  stage: () => `<div style="display:grid;gap:4px">${[['--fs-hero', 'disp h-hero', 'Allow yourself to be <em>yourself.</em>'], ['--fs-h1', 'disp h1', 'Меню'], ['--fs-h2', 'disp h2', OC.beats('Тараторът е студена супа. Нашият е в чаша.')], ['--fs-h3', 'disp h3', 'Работно време · Opening hours'], ['--fs-lead', 'lede', 'От 1999 г. сме на „Славянска“ 15. В менюто има 13 коктейла.'], ['--fs-body', '', 'Трифон Гяцов отвори „Оскар клуб“ на 23 май 1999 г. Ж, Щ, Ю, д, л: Bulgarian forms via <code>lang="bg"</code>.'], ['--fs-label', 'kick', 'Авторски коктейли']].map(([k, c, txt]) => `<div class="type-row"><code>${k}</code><p class="${c}" style="min-width:0">${txt}</p></div>`).join('')}</div>
    <p class="stage-cap" style="margin-top:22px">All three pairings</p><div class="stage-grid">${Object.entries(PX.STYLES).map(([k, s]) => `<div class="site" data-style="${k}" style="padding:18px;border:1px solid var(--line);border-radius:12px;display:grid;gap:8px;${k === S() ? 'outline:2px solid var(--gold-hi);outline-offset:2px' : ''}"><p class="stage-cap" style="margin:0">${s.label} · ${s.sub}</p><p class="disp h3" style="font-size:30px">Нашият е <em>в чаша</em></p><p style="font-size:15px;color:var(--ivory-2)">Водка, Скинос, лимон, битер · 280 ml</p></div>`).join('')}</div>`,
  rules: ['Display face for headlines, names and big numbers only. Body face for everything you read.', 'Caps labels: 12px, +0.14em tracking. Never set body text in caps.', 'Paragraphs stop at <b>62ch</b>.', 'Prices and times use tabular figures so columns line up.'] },

{ g: 'Brand', id: 'spacing', t: 'Spacing', o: ['—'], b: ['8pt grid', 'Refactoring UI'], laws: ['Law of Proximity', 'Law of Common Region'],
  why: 'An 8-point scale with half steps, and named roles so the gap says how related two things are. Things that belong together sit closer than things that don’t, at every level: name to ingredients, card to card, section to section.',
  stage: () => `<div class="sp-ladder">${[['--s-1', 4, 'name → ingredients (--gap-tight)'], ['--s-2', 8, 'icon ↔ label, chip ↔ chip'], ['--s-3', 12, 'button ↔ button'], ['--s-4', 16, 'inside a card or row; side gutter on a phone'], ['--s-5', 24, 'heading → content'], ['--s-6', 32, 'card padding on desktop'], ['--s-7', 48, 'heading block → grid'], ['--s-8', 64, 'section ↔ section on a phone'], ['--s-9', 96, 'section ↔ section on a desktop'], ['--s-10', 128, 'hero breathing room']].map(([k, v, u]) => `<div><code>${k}</code><i style="width:${v}px"></i><span>${v}px · ${u}</span></div>`).join('')}</div>`,
  rules: ['<b>Pick the role, not the number</b>: <code>--gap-item</code>, <code>--gap-section</code>.', 'Section spacing is fluid: <code>clamp(64px, 9cqi, 128px)</code>.', 'Side gutter never under 16px.'] },

{ g: 'Brand', id: 'shape', t: 'Shape', o: ['rounded gold frame on every cocktail card'], b: ['Art Deco arches', 'the OC rings'], laws: ['Law of Prägnanz', 'Law of Similarity'],
  why: 'Each style has one signature shape, used on the cocktail well, the hero frame and the event tiles. A: the theatre arch. B: the ring from the logo. C: the rounded gold frame the bar already prints on every cocktail card.',
  stage: () => `<div class="stage-grid">${Object.entries(PX.STYLES).map(([k, s]) => `<div class="site" data-style="${k}" style="display:grid;gap:10px;justify-items:center;padding:6px"><div class="cc-well" style="--d:var(--d-curacao);width:140px"><img src="img/cocktails/blue.webp" alt=""></div><p class="stage-cap" style="margin:0">${s.label}</p></div>`).join('')}</div>`,
  rules: ['Buttons: 4px (A), pill (B), 12px (C).', 'Panels and cards follow the style; inputs and chips are always pills.'] },

{ g: 'Brand', id: 'motion', t: 'Motion', o: ['call-button ripple'], b: ['NN/g animation timing', 'neon sign warm-up'], laws: ['Doherty Threshold', 'Peak-End Rule'],
  why: 'One moment per style on load: the glasses rise, then A draws its gold hairline, B flickers on like a neon tube, C stays calm. After that, motion only answers the guest: 150ms hover, 240ms open, 600ms one-time reveal. The pulse from today’s call button lives on as the open-now heartbeat. All of it switches off for reduced motion.',
  stage: () => `<div class="stage-grid">${ex('Durations', `<div class="mlist">${[['--dur-1', '150ms · hover, press'], ['--dur-2', '240ms · open, swap'], ['--dur-3', '600ms · one-time reveal']].map(([k, v]) => `<div class="mrow"><span class="nm"><code>${k}</code></span><span class="pr" style="font-weight:500;color:var(--ivory-2)">${v}</span></div>`).join('')}</div>`)}
    ${ex('Easing', '<p style="color:var(--ivory-2);font-size:15px">Out: <code>cubic-bezier(.16,1,.3,1)</code><br>In (exits): <code>cubic-bezier(.4,0,1,1)</code><br>Never linear, never bounce.</p>')}
    ${ex('Play the load moment', `<div style="display:grid;gap:12px;justify-items:start"><button type="button" class="btn btn-secondary" data-replay>Replay intro</button><div class="site intro" data-style="${S()}" id="mDemo" style="position:relative;height:150px;width:220px"><div class="glass g2" style="--drink:var(--d-hibiscus);left:20%;width:60%"><img src="img/cocktails/kissme.webp" alt=""></div></div></div>`)}</div>`,
  mount: r => { r.addEventListener('click', e => { if (e.target.closest('[data-replay]')) { const d = $('#mDemo', r); d.classList.remove('intro'); void d.offsetWidth; d.classList.add('intro'); } }); },
  rules: ['Animate <b>transform and opacity only</b>.', 'Reveals only move content (24px slide), never hide it: everything is readable at rest.', 'Nothing loops except the open-now ping and the glass halo, and both stop for reduced motion.'] },

/* ---------------- Actions ---------------- */
{ g: 'Actions', id: 'buttons', t: 'Buttons and links', o: ['.call-buton', '#b19859 fill'], b: ['Dante “Book a table”', 'Material states'], laws: ['Fitts’s Law', 'Von Restorff Effect', 'Hick’s Law'],
  why: 'One primary per region and it is always the way to book: call. Secondary is an outline, ghost is text with a hover wash. Every button is 48px tall so it is easy to hit on a phone. B swaps the gold slab for a lit tube.',
  stage: () => `<div style="display:grid;gap:22px">${ex('Variants', `<div class="btn-row"><a class="btn btn-primary" href="${OC.info.phoneHref}">${I('phone', 18)}${t(OC.copy.callBook)}</a><a class="btn btn-secondary" href="${OC.info.igDm}" target="_blank" rel="noopener">${I('ig', 18)}${t(OC.copy.dm)}</a><button type="button" class="btn btn-ghost">${t(OC.copy.seeMenu)}</button><button type="button" class="btn btn-icon" aria-label="Instagram">${I('ig', 18)}</button></div>`)}
    ${ex('Disabled · arrow link · text link', `<div class="btn-row"><button type="button" class="btn btn-primary" disabled>${t(OC.copy.callBook)}</button><a class="arrow-link" href="#menu">${t(OC.copy.fullMenu)}${I('arrow', 18)}</a><a class="tlink" href="${OC.info.phoneHref}">${OC.info.phone}</a></div>`)}</div>`,
  rules: ['Hover lifts 1px and adds a glow; press sinks 1px. Focus is a 2px gold ring with a 3px gap.', 'Labels say what happens: “Обади се за маса”, not “Контакти”.', 'Never two filled gold buttons side by side.'] },

{ g: 'Actions', id: 'lang', t: 'Language switch', o: ['commented-out “BG” icon on today’s page'], b: ['Paradiso ING / ESP / CAT'], laws: ['Jakob’s Law', 'Hick’s Law'],
  why: 'Two languages, two letters, one tap: no dropdown to open. Bulgarian lives at today’s URLs; English adds /en/ in front, so nothing that exists today moves. Try it: the whole stage switches.',
  stage: () => `<div class="btn-row">${OC.langSwitch()}<span style="color:var(--ivory-2);font-size:15px">→ <code>${OC.path('home')}</code> · <code>${OC.path('menu')}</code></span></div>`,
  rules: ['The slogan stays in English in both languages, as the bar uses it on Instagram.', 'Cocktail names stay as the bar wrote them; ingredients translate.'] },

/* ---------------- Content ---------------- */
{ g: 'Content', id: 'status', t: 'Open-now status', o: ['call-button ripple (#ec8b00)'], b: ['Google Maps “Open · Closes 23:30”'], laws: ['Doherty Threshold', 'Zeigarnik Effect'],
  why: 'The first question anyone has about a bar: is it open? Worked out on the page in Sofia time, including the nights that run past midnight (Thursday to 02:00, Friday and Saturday to 03:00). Under 45 minutes left turns it to “closing soon”.',
  stage: () => `<div style="display:grid;gap:18px"><div class="chips" data-demo-time>${DEMO_TIMES.map(([k, l]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${k === demoKey}">${l}</button>`).join('')}</div><div id="stPill">${OC.statusPill()}</div></div>`,
  mount: r => { r.addEventListener('click', e => { const b = e.target.closest('[data-demo-time] [data-k]'); if (!b) return; demoKey = b.dataset.k; OC.demoNow = DEMO_TIMES.find(x => x[0] === demoKey)[2]; $('#stPill', r).innerHTML = OC.statusPill(); OC.demoNow = null; $$('[data-demo-time] .chip', r).forEach(c => c.setAttribute('aria-pressed', String(c === b))); }); },
  rules: ['Dot colour carries the state, the word says it: never colour alone.', 'Shown in the hero, the visit panel and the menu header.'] },

{ g: 'Content', id: 'proof', t: 'Proof strip', o: ['prizeyear.png', 'since 23.05.1999'], b: ['Dante awards banner', 'Paradiso awards grid'], laws: ['Cognitive Bias', 'Serial Position Effect'],
  why: 'Today the award is a large image with no caption. Here it sits with what guests trust most, the review scores, and the 27 years. Four facts, one line, right under the hero.',
  stage: () => OC.proof(),
  rules: ['Numbers in the display face; the source and count underneath in small text.', 'Update the counts when the listing changes (source: Google Maps).'] },

{ g: 'Content', id: 'card', t: 'Cocktail card', o: ['13 signature photos', 'gold card frame'], b: ['Paradiso', 'Kwānt signatures'], laws: ['Law of Proximity', 'Law of Common Region', 'Aesthetic-Usability Effect', 'Doherty Threshold', 'Von Restorff Effect'],
  why: 'The whole glass from today’s photo, standing in front of its arch and rising out of it. The arch glows in the drink’s own colour, faintly at rest and fully under the pointer. Name, ingredients, volume and price are real text, so they can be read aloud, found by Google and translated. Price sits on a dot leader, like a printed menu.',
  stage: () => `<div class="cc-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${['machree', 'blue', 'tarator', 'french69'].map(id => OC.card(OC.cocktails.find(c => c.id === id), { rv: false })).join('')}</div>`,
  rules: ['Alt text: the name and the ingredients.', 'Hover, tap or focus anywhere on the card: the arch lights up in 150ms and the glass lifts 8px. Only opacity and transform animate. With reduced motion the light still comes on, but the glass doesn’t move.', 'The arch rests at about a quarter of its glow (half on phones, which never hover), so a grid of 13 stays calm and the lit card stands out.', 'No hover-only information.', 'Phone: two columns in the menu, a swipe rail on the home page.'] },

{ g: 'Content', id: 'flavor', t: 'Flavour meter', o: ['Desert Paloma card: sweet, sour, bitter, fruity, refreshing'], b: ['wine tasting notes'], laws: ['Mental Model', 'Law of Similarity'],
  why: 'The bar already designed this on one of its cards. It becomes a component for when the bar gives each cocktail its five values. Shown here with example values in the card’s own shape.',
  stage: () => `<div class="stage-grid">${ex('Desert Paloma · example values', `<div style="--d:var(--d-amber)">${OC.flavor([[OC.lang === 'bg' ? 'Сладко' : 'Sweet', 1], [OC.lang === 'bg' ? 'Кисело' : 'Sour', 3], [OC.lang === 'bg' ? 'Горчиво' : 'Bitter', 1], [OC.lang === 'bg' ? 'Плодово' : 'Fruity', 2], [OC.lang === 'bg' ? 'Освежаващо' : 'Refreshing', 5]])}</div>`)}${ex('Same meter, Kiss Me colour', `<div style="--d:var(--d-hibiscus)">${OC.flavor([[OC.lang === 'bg' ? 'Сладко' : 'Sweet', 3], [OC.lang === 'bg' ? 'Кисело' : 'Sour', 3], [OC.lang === 'bg' ? 'Горчиво' : 'Bitter', 1]])}</div>`)}</div>`,
  rules: ['Needs values from the bar before it ships. Until then it stays out of the pages.'] },

{ g: 'Content', id: 'menu', t: 'Menu rows and categories', o: ['.drink_name / .drink_price', '.accordion'], b: ['printed menus: dot leaders', 'Kingfisher HTML menu'], laws: ['Law of Similarity', 'Chunking', 'Law of Common Region'],
  why: 'Name, dot leader, price: the oldest menu pattern there is, because the eye runs straight to the price. Categories are native details elements, so they open with a keyboard and work before any script loads; the closed row already tells you the serving and how many bottles there are.',
  stage: () => `<div style="display:grid;gap:22px">${ex('Rows with a sub line', `<div class="mlist">${OC.shots.slice(0, 3).map(([n, i]) => `<div class="mrow"><span class="nm">${n}</span><span class="pr tnum">${OC.price(3)}</span><span class="sub">${i}</span></div>`).join('')}</div>`)}${ex('Category', OC.menu.filter(m => ['whisky', 'digestif'].includes(m.id)).map((m, i) => OC.category(m, i === 0)).join(''))}</div>`,
  rules: ['Prices right-aligned, gold, tabular.', 'A missing price shows “—” with a note, never a guess.'] },

{ g: 'Content', id: 'hours', t: 'Opening hours', o: ['—'], b: ['Bemelmans hours block', 'Google Maps'], laws: ['Selective Attention', 'Von Restorff Effect'],
  why: 'Today’s row is marked (after midnight it stays on last night’s row until close). Late closes are gold, so “Friday and Saturday until 03:00” jumps out without reading the whole table.',
  stage: () => `<div style="max-width:420px">${OC.hoursTable()}</div>`,
  rules: ['Week starts on Monday, as in Bulgaria.', 'Footer carries the one-line version.'] },

{ g: 'Content', id: 'contact', t: 'Contact rows', o: ['tel: and mailto: links on the live page'], b: ['Stripe copy field'], laws: ['Postel’s Law', 'Fitts’s Law'],
  why: 'The number and the address are always written out, selectable, with a copy button. A tap-to-call link alone fails on laptops and inside apps; the text never does.',
  stage: () => `<div class="crows" style="max-width:480px">${OC.contactRow('phone', OC.lang === 'bg' ? 'Телефон' : 'Phone', OC.info.phone, OC.info.phoneHref)}${OC.contactRow('mail', OC.lang === 'bg' ? 'Имейл за събития' : 'Events email', OC.info.eventsEmail, 'mailto:' + OC.info.eventsEmail)}</div>`,
  rules: ['International format for phones: +359 …', 'The copy button confirms with a tick for 1.6s.'] },

{ g: 'Content', id: 'events', t: 'Event tiles', o: ['events.jpeg flyer: private, corporate, festivals'], b: ['Paradiso events + consulting'], laws: ['Chunking', 'Law of Similarity'],
  why: 'The flyer’s three offers and its icons, as text. Three equal tiles, one action: ask for an offer by email.',
  stage: () => `<ul class="ev-types" style="max-width:520px">${OC.copy.evTypes.map(([i, l]) => `<li>${I(i, 28)}${t(l)}</li>`).join('')}</ul>`,
  rules: ['Exactly three. A fourth offer becomes a sentence, not a tile.'] },

/* ---------------- Navigation ---------------- */
{ g: 'Navigation', id: 'header', t: 'Header', o: ['social icon row + menu3.png'], b: ['Kwānt anchor nav'], laws: ['Jakob’s Law', 'Serial Position Effect'],
  why: 'Logo, four places to go, language, and the one action. Menu first and Visit last, the two things people come for. It sticks to the top with a blurred backdrop. On a phone the links step aside for the thumb bar.',
  stage: () => `<div style="display:grid;gap:18px">${ex('Desktop', `<div class="site" data-style="${S()}" style="border:1px solid var(--line);border-radius:12px;overflow:hidden">${OC.header('home')}</div>`)}${ex('Phone', narrow(OC.header('home')))}</div>`,
  rules: ['68px tall. Nav labels are caps at 13px with +0.14em tracking.', 'The current page has a gold label and a 1px gold underline.'] },

{ g: 'Navigation', id: 'catbar', t: 'Category bar', o: ['12 accordion buttons'], b: ['Instagram filter chips'], laws: ['Fitts’s Law', 'Hick’s Law'],
  why: 'The menu’s table of contents, always in reach. It sticks under the header, scrolls sideways on a phone, and follows you down the page.',
  stage: () => `<div class="site" data-style="${S()}" style="border:1px solid var(--line);border-radius:12px;overflow:hidden">${OC.catnav()}</div>`,
  rules: ['44px chips. The current section is gold.'] },

{ g: 'Navigation', id: 'abar', t: 'Thumb bar', o: ['floating call button'], b: ['The Bandit (Bento) sticky footer'], laws: ['Fitts’s Law', 'Jakob’s Law'],
  why: 'On a phone, the four things a guest does sit under the thumb: call, get directions, open the menu, message on Instagram. Call is gold. It hides once the header has room for its own call button.',
  stage: () => narrow(`<div style="height:120px;display:grid;place-items:center;color:var(--ivory-3);font-size:14px">${OC.lang === 'bg' ? 'съдържание' : 'page content'}</div>${OC.actionBar('home')}`),
  rules: ['64px tall plus the phone’s safe area.', 'Exactly four items, icon above label.'] },

{ g: 'Navigation', id: 'footer', t: 'Footer', o: ['Contact Us + How to find us'], b: ['Jigger & Pony visit block'], laws: ['Jakob’s Law', 'Law of Common Region'],
  why: 'The answers people scroll down for: address, phone, email, hours in one line, socials. Plus the euro note the menu page already carries.',
  stage: () => OC.footer(),
  rules: ['Same on both pages.'] }
];

const stageOf = s => typeof s.stage === 'function' ? s.stage() : s.stage;
PX.route({ path: 'foundations', layout: 'doc', styles: true, title: 'Foundations',
  intro: () => ({ kicker: 'Checkpoint 1 · Foundations', h1: 'One system, lifted from the bar itself', lede: `Every token and component the redesigned pages are allowed to use. Each one is lifted from today’s site, the events flyer, the cocktail cards or the Instagram feed (gold tag), sometimes borrowing a pattern from a well-known bar site (brown tag). Everything is live, and the <b>Style</b> chips above restyle every stage.` }),
  render: () => { const groups = [...new Set(SPECS.map(s => s.g))];
    return `<div class="fd"><nav class="fd-toc" aria-label="Foundations contents">${groups.map(g => `<p class="grp">${g}</p>${SPECS.filter(s => s.g === g).map(s => `<a href="#foundations" data-jump="${s.id}">${s.t}</a>`).join('')}`).join('')}</nav>
    <div class="fd-main">${SPECS.map(s => `<section class="spec" id="sp-${s.id}" aria-labelledby="sph-${s.id}"><div class="spec-h"><h3 id="sph-${s.id}">${s.t}</h3><div class="spec-tags">${s.o.map(x => `<span class="o">${x}</span>`).join('')}${s.b.map(x => `<span class="b">${x}</span>`).join('')}${s.laws.filter(Boolean).map(PX.lt).join('')}</div></div><p class="why">${s.why}</p><div class="stage site" data-style="${S()}" lang="${OC.lang}">${stageOf(s)}</div>${s.rules ? `<ul class="rules">${s.rules.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</section>`).join('')}</div></div>`; },
  mount: root => {
    SPECS.forEach(s => s.mount && s.mount($('#sp-' + s.id, root)));
    $('.fd-toc', root).addEventListener('click', e => { const a = e.target.closest('[data-jump]'); if (a) { e.preventDefault(); $('#sp-' + a.dataset.jump).scrollIntoView({ behavior: 'smooth' }); } });
    $$('.stage.site', root).forEach(st => OC.mount(st, { rerender: () => { const y = scrollY; PX.render({ lang: true }); scrollTo(0, y); }, toast: PX.toast }));
  },
  doc: () => { const D = PX.doc; return D.sec('01 · What changed', 'How Foundations was built', 'Nothing here is invented from scratch. The colours, fonts, frames and icons already exist on the bar’s site, flyer, cocktail cards and Instagram. The system names them, fixes their contrast and gives each a job.', D.moves([
      ['Lifted unchanged', 'Gold #b19859, flyer gold #e8c96a, call-pulse amber #ec8b00, the black every cocktail is shot on, Philosopher and Ubuntu Sans (style C), the 13 cocktail photos, the award, the events offer, the slogan.'],
      ['Named, not changed', 'Four warm surfaces, three text tones, six drink families, a fluid type scale, an 8pt spacing scale with roles, four radii, three durations and two easings.'],
      ['Fixed', 'Cocktail names and ingredients out of images into text. Phone and email into selectable text. The award gets a caption. Contrast checked on every pairing (lowest body text: 4.6:1).'],
      ['Added', 'Open-now status, hours table, ratings, the BG/EN switch, the thumb bar, the category bar, the base-spirit filter, the flavour meter.'],
      ['Prototype only', 'Purple annotations, the style chips, the width switch and the jump menu. None of these ship.']]))
    + D.sec('02 · Contrast', 'Every pairing, measured', 'WCAG 2.2 AA asks for 4.5:1 for body text and 3:1 for large text and edges. Ratios computed with the WCAG luminance formula.', D.table(['Foreground', 'on --ink-0', 'on --ink-2', 'Use'], [
      ['<code>--ivory</code> #f3ebdd', '16.7:1', '14.8:1', 'all text'], ['<code>--ivory-2</code> #c2b6a2', '9.9:1', '8.8:1', 'secondary text'], ['<code>--ivory-3</code> #8c8273', '5.2:1', '4.6:1', 'captions; not on ink-3 (4.1:1)'],
      ['<code>--gold</code> #b19859', '7.1:1', '6.3:1', 'labels, icons'], ['<code>--gold-hi</code> #e8c96a', '12.3:1', '10.8:1', 'prices, links, primary fill'], ['<code>--on-gold</code> on gold-hi', '12.3:1', '—', 'button text'],
      ['<code>--gold-lo</code> #6e5d33', '3.1:1', '2.7:1', 'rules and edges only'], ['<code>--d-berry</code> #e5383b', '4.7:1', '4.1:1', 'glow only, never small text'], ['white on gold (today’s risk)', '2.1:1', '—', 'never']]))
    + D.sec('03 · Laws of UX', 'Laws applied in the system', 'Only the laws that shaped a Foundations decision.', D.laws([
      ['Aesthetic-Usability Effect', 'System', 'The drinks glow in their own colour on a black stage: the bar looks as good online as it does at 23:00.'],
      ['Von Restorff Effect', 'Colour', 'One gold-filled action per screen. Everything that matters differs from everything that doesn’t.'],
      ['Fitts’s Law', 'Targets', '48px buttons, 44px chips, a 64px thumb bar on phones.'],
      ['Jakob’s Law', 'Patterns', 'Header, dot-leader menus, Google-style open-now, a two-letter language switch: patterns guests already know.'],
      ['Law of Proximity', 'Spacing', 'Named gaps from 4px (name → ingredients) to 128px (section → section).'],
      ['Doherty Threshold', 'Status', 'Open-now and the filter run on the page with no request, well under 100ms.'],
      ['Hick’s Law', 'Menu', 'A seven-way base-spirit filter and a category bar instead of one long scroll.'],
      ['Postel’s Law', 'Contacts', 'Every phone and email is a link and selectable text and copyable. Whatever the device allows, one of them works.']]))
    + D.foot('Source: <code>design-system/tokens.css</code>, <code>components.css</code>, <code>site.js</code>, <code>data.js</code>. These ship with the real pages; <code>prototype.css</code> and <code>core.js</code> do not.'); }
});
})();
