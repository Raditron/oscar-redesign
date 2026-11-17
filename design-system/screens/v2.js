/* Version 2 — why v1 read as generated, the concepts that separate designed sites from generated ones,
   how to brief AI agents, and the v2 pages themselves (site-v2.js + v2.css). */
(() => {
const D = PX.doc;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PROMPT = `<b>ROLE</b>
You are the art director of a small studio. You are not a front-end generator.
Before any code, you decide what this site is about and what it gives up.

<b>CLIENT</b>
Oscar Club, a cocktail bar on Slavyanska 15, Sofia, open since 1999.
Instagram bio: "cocktails | music | retro futurism". Slogan: "allow yourself to be yourself."
Assets: 13 cocktail photos shot on pure black, one storefront at night, one DJ photo. Low-res.

<b>CONCEPT</b> (one sentence; every decision is checked against it)
Dark room, lit glass: the page is the bar at night, and the only light comes from the drinks,
the brass and the sign over the door.

<b>RULES</b> (derived from the concept, not from a checklist)
1. Black is the room, ivory is the type. Colour exists only where a drink is.
2. Gold is the brass (paint): one gold action per screen. Nothing else is gold.
3. Neon is the sign (light): it lights brand marks only (the slogan, the OC rings, a page title)
   and a drink's name while you point at it. It never lights UI: no glowing buttons, cards or borders.
4. Type is the architecture: one display face, set huge; one italic voice for the slogan.
5. No boxes. Group with space and alignment, not borders, cards or panels.
6. Every section has a different shape. Pace it like a film edit: loud, quiet, dense, empty.

<b>REFERENCE TO BRING IN</b> (when the client likes an earlier direction)
List every element of it. For each one: keep, change or leave out, and name the rule that decided it.
A reference is a source of material, not a skin.

<b>SACRIFICE</b>
Name the 2–3 things on each page that get to be loud. Everything else is small, grey or gone.

<b>BANNED</b> (use one only if you write why this page needs it)
eyebrow labels above headings · icons in circles or tiles · 3-up feature cards ·
4-cell stat strips · decorative pills · rounded bordered panels · gradient text ·
glows and shadows on cards · fade-up on scroll · the same padding on every section ·
every section in the same centred container · Inter, Poppins, Manrope · Lucide icons as decoration

<b>FORCE CONTRAST</b>
Largest type ≥ 12× body size. At least one element bleeds off the edge, one overlaps
another, one section is a full colour flood, one section is nearly empty.

<b>PROCESS</b>
1. Write the section list as a rhythm (loud / quiet / dense / empty) before any code.
2. ASCII-wireframe each section on a 12-column grid with spans. Justify every symmetric layout.
3. Build.
4. Screenshot at 390, 820 and 1440 px. Cover the logo: could this be another bar's site?
   List the five most generic things on the page, fix them, and screenshot again. Do this twice.`;

const CRITIC = `<b>ROLE</b>
You are a design critic. You only get screenshots, the concept sentence and the banned list.
You have not seen the code or the builder's reasoning.

<b>TASK</b>
1. Squint at each screenshot. What do you see first, second, third? Is that the intended order?
2. Cover the logo. Name three other businesses this page could belong to.
3. List every element that appears in the banned list, with its location.
4. Find the two sections that look most alike. Say how to make them different shapes.
5. Name one thing to delete.
Return a ranked list. Do not praise anything.`;

PX.route({ path: 'v2-why', layout: 'doc', title: 'Why v1 looked vibecoded',
  intro: { kicker: 'Version 2 · The diagnosis', h1: 'Why v1 looked generated, and what Version 2 does about it', lede: 'An audit of v1 against its own code, the ideas that separate a designed site from a generated one, and how to brief AI agents so they stop falling back to the defaults. Version 2 of both pages is in the toolbar (Version · v2).' },
  render: () => `<div class="doc" style="margin-top:8px">
  ${D.sec('01 · The diagnosis', 'A generated site is every decision averaged', 'An AI agent picks the most likely answer at every step: the usual hero, the usual section, the usual card. Each choice can be defended on its own. Stack them up and you get a page nobody in particular made. v1 is correct: real content, AA contrast, 48px targets, a reason cited for every element. Correct is the minimum, though, and an agent stops there because correct is the part it can check. Better taste in each component won’t fix it. The fix is one point of view that every component has to obey, and being willing to make most things small so that a few things can be big.',
    D.diag([
      ['Decided locally, never as a page', 'Each component was designed against its own spec: card, panel, chip, strip. Nothing was designed against the page as a whole. Most of design is choosing what loses. In v1 nothing loses, so nothing wins.'],
      ['Optimised for what can be checked', 'Contrast ratios, target sizes and Laws of UX can all be checked, and all of them are in v1. Taste can’t be scored, so rules took its place. Our own rationale cites a law for every choice. That is design by citation.'],
      ['Styling as a skin', 'The three styles change about a dozen CSS variables and leave every layout the same. If a design survives a swap of its fonts and corner radii, the design is in the template. The template is the most common one on the web.'],
      ['Ornament in place of an idea', 'Gradient hairlines, glows, arches and a halo on every card. Decoration is the cheapest way to make a page feel “designed”, and it is exactly what models add when you ask for “premium”.'],
      ['No art-directed pictures', 'The photos are 480–560px Instagram exports, and two have text baked in. Generated sites lean on icons and gradients because nobody commissions a shoot. Layout can only work around this; a shoot fixes it.']
    ]))}
  ${D.sec('02 · The audit', 'Eleven tells, found in v1’s own code', 'Each tell is common enough on generated sites that visitors recognise it without knowing why. The right-hand column says what Version 2 does instead.',
    D.table(['Tell', 'Where in v1', 'Why it reads as generated', 'Version 2'], [
      ['A small label over every heading', '<code>.kick</code> + its gold hairline on all 9 sections', 'The most common AI landing-page pattern. A label that repeats the heading tells you nothing.', 'Removed. Headings stand on their own.'],
      ['Every section built the same way', 'Label → heading → lede → grid, in a 1200px centred box, with the same padding each time', 'No pacing. Every section has the same weight and height, so the eye has nowhere to rest and nowhere to land.', 'Seven section shapes: poster, single sentence, feature, index, gig bill, colour flood, data.'],
      ['A flat type scale', 'Hero 84px against 17px body (5:1); scale ratio 1.2–1.25', 'Safe scales keep everything medium. Editorial pages run 12:1 or more.', 'Hero ~190px, address ~110px, body 17px, captions 13px. About 14:1.'],
      ['Accent colour everywhere', 'Gold on labels, links, prices, icons, buttons, rules, italics and tags: 30+ uses', 'When everything is gold, gold means nothing. It is also the “dark + gold = luxury” template.', 'Gold marks the one button, today’s hours and the slogan, plus one full gold section.'],
      ['Component-kit shapes', 'Pills, rounded bordered panels, icons in circles, icon tiles, copy buttons, a 4-cell stat strip', 'These are shadcn / Tailwind UI shapes. Visitors have seen them on every SaaS dashboard.', 'Text links, hairlines and one square button. Numbers sit inside sentences. Contacts are a plain list.'],
      ['Everything in a box', 'Framed cards, panels, chips, the hours table in a panel', 'You reach for boxes when you haven’t decided how things relate.', 'Things are grouped by space and alignment. The frames are gone.'],
      ['Nothing breaks the grid', 'All content inside the max-width, centred', 'Templates never overlap, crop or bleed, because they can’t predict the content.', 'The glass sits behind the headline. Images bleed off the left edge. The gold section runs edge to edge.'],
      ['Motion on everything', 'Every block rises on scroll and every card glows on hover', 'Motion with no meaning. Fade-up on scroll is the default on every AI site.', 'Three moments, each with a reason: the headline switches on like a sign, the signature glass changes on its own (a 400ms crossfade, held long enough to read, and yours to stop), and in the index a glass lights up in its own colour.'],
      ['Copy written to a formula', 'Every heading has two beats, “X. Y.”, with the second greyed out', 'Use a formula seven times and it reads as a template, not a voice.', 'Fewer headings. The story is one sentence, and the facts are set as type.'],
      ['A stock icon set', 'Lucide icons in every row, tile and button', 'The default icon library of generated sites.', 'Icons only where they do a job: phone and directions on buttons.'],
      ['Symmetry and equal columns', '1fr 1fr panels, 3-up and 4-up grids', 'Symmetry is the layout you get without deciding anything.', 'A 12-column grid used unevenly: 7/5, 6/6 offset, 1fr/190px.']
    ]))}
  ${D.sec('03 · The concepts', 'What designed sites do instead', '', D.diag([
      ['One idea you can say in a sentence', 'v2: <i>Dark room, lit glass.</i> The page is the bar at night, and the only light comes from the drinks, the brass and the sign over the door. Six rules come from that sentence, and every element is checked against them. A concept turns taste into something you can check.'],
      ['Hierarchy by sacrifice', 'Each page gets two or three loud things. On v2 Home they are the slogan, the signature glass and the address. Everything else is made quieter on purpose.'],
      ['Contrast of scale', 'Put one very big thing next to many small things on each screen. Tension comes from the difference, not from either size on its own.'],
      ['Pacing', 'Scrolling is editing. Dense is followed by empty, loud by quiet, dark by a flood of colour. v1 kept one rhythm all the way down; v2 changes it every section.'],
      ['Uneven grid, real overlaps', 'Columns get used unevenly, things cross column lines, and images bleed off the edge or sit behind type. Depth and tension come from layers.'],
      ['Type as image', 'When there are few good photos, the letters do the work illustrations would. That is why v2 sets the slogan, the address, “Меню” and “3 €” at poster size.'],
      ['Specific to this client', 'Use details only this client has: a week chart that shows the late Fridays, the storefront inside a sentence, Bulgarian quotes „“, a gig bill with the entry fee. A template can’t predict these, so they can’t look generic.'],
      ['A palette is a ratio, not a list', 'About 90% black, 8% ivory and 2% gold, plus whatever colour the glass brings. v1 listed the same colours but used them about equally.'],
      ['Texture', 'Film grain, real photographs, a hairline instead of a shadow. Perfectly flat surfaces and perfect gradients look machine-made.'],
      ['Craft in the details', 'Tighten letter-spacing as type grows (−6% at 200px). Use tabular figures in prices, correct quotes, a hanging indent on the first line and optical left alignment of big type. Nobody notices each one, but everyone notices when they’re all missing.'],
      ['Tests a checklist can’t do', 'Cover the logo: could this be another bar? Squint: what do you see first? Look from across the room: what shape is the page? Which section would you cut?']
    ]))}
  ${D.sec('04 · Briefing agents', 'How to prompt so the defaults don’t win', 'Agents fall back to the average when the brief leaves room. Close that room: give a concept instead of a feature list, ban the defaults by name, require contrast with numbers, and make the agent look at what it built.',
    D.diag([
      ['Brief like an art director, not a PM', 'A concept sentence, references, rules derived from the concept, and what to give up. “Make it premium” gets you gold and glows. “Dark room, lit glass” gets you a lighting plan.'],
      ['Ban the defaults by name', 'Models do what they’ve seen most unless you tell them not to. A written ban list (eyebrows, icon tiles, 3-up cards, stat strips, fade-ups…) does more than any adjective.'],
      ['Demand contrast with numbers', '“Largest type ≥ 12× body.” “One element bleeds off the edge.” “One section is a colour flood.” You can check numbers. You can’t check adjectives.'],
      ['Composition before components', 'Ask for the section rhythm and ASCII wireframes with column spans first, and a reason for every symmetric layout. Components come last.'],
      ['Make it look', 'An agent can’t see what it made unless you make it. Render, screenshot at three widths, critique against the ban list, fix, and repeat twice. Most of the gap between v1 and v2 came from that loop.'],
      ['Split the roles', 'Use three agents: an art director (concept and rules), a builder, and a critic who sees only screenshots and the ban list. A critic who has read the builder’s reasoning will agree with it.'],
      ['Real assets, or say there are none', 'An agent can’t invent photography. If the pictures are weak, say so in the brief and design around them: type-led, tight crops, small and dark. Then budget for a shoot.']
    ])
    + `<h3 style="margin:28px 0 10px;font-size:17px">The art-director prompt, as used for Version 2</h3><pre class="v2doc-prompt">${PROMPT}</pre>
       <h3 style="margin:28px 0 10px;font-size:17px">The critic prompt (run on screenshots only)</h3><pre class="v2doc-prompt">${CRITIC}</pre>`)}
  ${D.sec('05 · Limits', 'What Version 2 still can’t fix', '', D.diag([
      ['Photography', 'The biggest gap left. A two-hour shoot of the room, the sign, bartenders’ hands and the drinks in context, at 2000px+, would add more than any CSS. v2 crops tightly and keeps the photos small for now.'],
      ['Taste is still a call', 'The rules make v2 consistent; whether it’s the right call is up to you and the owners. Push back on any rule and the page changes with it.']
    ]))}
  <p style="margin-top:8px"><a class="v2doc-cta" href="#v2-home">Open Version 2 · Home →</a></p>
</div>`
});

const v2Note = 'Version 2, now with the Neon Deco sign. One concept, <i>Dark room, lit glass</i>, and six rules (below the frame). Same content, URLs and booking channels as v1. v1 is unchanged: switch back with Version · v1.';

PX.route({ path: 'v2-home', page: 'home', layout: 'site', v2: true, title: 'v2 · Home',
  intro: () => ({ kicker: 'Version 2 · /index.html', h1: 'Home: a poster, a sentence, a drink, a bill, a gold room, an address', lede: `${v2Note} Point at the cocktail names in the index; try BG / EN and the widths.` }),
  render: () => OC.v2.pages.home(),
  mount: site => OC.v2.mount(site),
  doc: () => D.sec('01 · Concept', 'Dark room, lit glass', 'The page is the bar at night. The only light comes from the drinks, the brass and the sign over the door. Every element on this page was checked against these six rules.',
      `<ol class="v2doc-rules">
        <li>Black is the room, ivory is the type. Colour exists only where a drink is: the blue Blue’s’our beside the headline, the signature glass that changes on its own, the glass in the index that lights up in its own colour. The room is pure black because every photo is shot on pure black, so the glasses sit in it with no seam.</li>
        <li>Gold is the brass, which means paint. It marks the one action per screen (Call to book, Directions), today’s row in the hours, the slogan’s italic, and one full gold section, Events. Nothing else is gold.</li>
        <li>Neon is the sign, which means light. It lights brand marks only: the slogan in the hero, the OC rings in the header and footer, and “МЕНЮ” on the menu. It also lights a cocktail’s name while you point at it, in that drink’s colour. It never lights UI: no glowing buttons, cards, panels or borders. One lit sign per screen.</li>
        <li>Type is the architecture. Poiret One, the Neon Deco face, is the only display face: Art Deco caps drawn in single strokes, so when lit they read as tube lettering. Cormorant italic is the slogan’s voice, lit as a script tube in the hero. Onest, the Neon Deco text face, is used for reading.</li>
        <li>No boxes. No cards, panels, pills or icon tiles. Things group by space, alignment and hairlines.</li>
        <li>Every section has a different shape: the sign → one sentence → one drink at a time → a typeset index → a gig bill → the gold room → the address and a picture of the week → the sign you leave under.</li>
      </ol>`)
    + D.sec('02 · Neon Deco', 'What came over from style B, and what didn’t', 'You picked the Neon Deco look. Here is every part of it, kept, changed or left out, with the rule that decided each. A reference is material to work with, not a skin to paint on.', D.table(['Neon Deco (v1 · B)', 'In Version 2', 'Decided by'], [
      ['Poiret One, Art Deco caps', 'Kept as the only display face: hero, headings, cocktail names, big numbers', 'Rule 4: one display face. Single-line caps read as tubes when lit'],
      ['Onest for text', 'Kept, replacing Golos Text, for reading and the UI. The story is set in the sign’s face instead: Poiret One at ~22–34px, in sentence case and unlit, in two short columns with the slogan centred under them in its italic', 'Rule 4. The story speaks in the same face as “ALLOW YOURSELF”, without the glow: neon stays on the sign (rule 3)'],
      ['Every heading glowing', 'Only the hero slogan and “МЕНЮ” are lit. Other headings are unlit caps', 'Hierarchy by sacrifice: if every heading glows, none of them does'],
      ['Gold and amber glow', 'Kept as the gas in the tube: a near-white core, a gold halo and an amber spread, sized in em so it scales with the letters', 'Rule 3'],
      ['OC rings in neon behind the hero glasses', 'Moved to the footer as the sign you leave under. The header mark is lit too', 'One idea per screen: the hero already has the glass. The first and last thing you see is the sign'],
      ['Flicker on load', 'Kept as the opening motion, replacing the line reveal. Each tube catches at its own moment. Unlit tubes dim to 16%, never to nothing. Off with reduced motion', 'Motion in two places, each with a reason: signs flicker when they’re switched on'],
      ['Neon frames around cocktail cards', 'Left out. Each glass pools its own colour on the floor. Pointing at a name lights the name in the drink’s colour', 'Rules 1 and 3: colour comes from the drink; glow never goes on cards'],
      ['Lit-tube outline buttons', 'Left out. The button stays solid brass', 'Rule 2 vs rule 3: the button is paint, the sign is light. Glowing controls are on the ban list'],
      ['Pill shapes (buttons, chips, card tops)', 'Left out. One square button, text filters', 'Ban list: decorative pills'],
      ['Glowing borders on panels', 'Left out. There are no panels', 'Rule 5: no boxes'],
      ['Tracked uppercase on buttons and chips', 'Left out. UI text is in sentence case', 'Caps belong to the display face only'],
      ['—', 'New: the events section is the one room “with the house lights on”: gold, black caps, no neon', 'Pacing: one bright room in a dark page']
    ]))
    + D.sec('03 · Moves', 'What changed from v1, section by section', '', D.table(['Section', 'v1', 'Version 2'], [
      ['Hero', 'Split layout: copy left, three glasses in an arch right, a pill-shaped status', 'The sign. “ALLOW YOURSELF” as tube caps at ~190px and “to be yourself.” as a gold script tube, with the blue glass beside it (on a phone it stands between the sign and the call button, so it never covers either). One brass button, and one line of facts (status, address, ratings, award) instead of a stat strip'],
      ['Proof strip', '4 equal cells with icons', 'Merged into the hero’s fact line and the story’s footnote'],
      ['Story', 'Two paragraphs beside a framed photo', 'Then and now in two short columns, set in the sign’s face (Poiret One, unlit), with the slogan centred under both in its italic. No pictures inside the words: the storefront is at Visit and the glasses are right below'],
      ['Signatures', '6 framed cards, 3-up', 'One glass at a time, all 13, starting with Tarator. Each has its own slogan, set in Poiret One caps like the rest of the menu (drafts for the owners). The photo bleeds off the left edge with the name at 170px under it. It runs by itself: each drink holds 6–9s, long enough to read (Working Memory, Cognitive Load), and the change is a 400ms crossfade (Doherty Threshold). A hairline fills toward the next drink (Goal-Gradient). Controls are ← → and a counter, not 13 dots (Hick’s Law), at 48px (Fitts’s Law), with swipe and arrow keys (Jakob’s Law). It holds still under the pointer, under focus and off screen, stops for good once you use the arrows, and has Pause / Play (Selective Attention; WCAG 2.2.2). Then all 13 as a typeset index: point at a name and that glass lights up in its own colour'],
      ['Music', 'Heading, lede, list, outline button', 'A gig bill: dates as the headline type, the entry fee on every row, and the DJ photo cropped to the chandelier and the decks'],
      ['Events', 'Icon tiles + contact rows with copy buttons', 'A full gold section, black type, the email set big enough to read from across the room'],
      ['Visit', 'Two bordered panels, hours as a table', 'The address as the headline, the lit sign beside it, and the hours drawn as a picture of the week: every night starts at 18:00, the bars show how late each one runs, today in gold with a “now” line'],
      ['Footer', 'Three columns + icons', 'The OC rings as a lit sign, the slogan beneath in its italic, unlit. Contacts as a line of text']
    ]))
    + `<p><a class="v2doc-cta" href="#v2-why">Why v1 looked vibecoded →</a></p>`
});

PX.route({ path: 'v2-menu', page: 'menu', layout: 'site', v2: true, title: 'v2 · Menu',
  intro: () => ({ kicker: 'Version 2 · /mainmenu/index.html', h1: 'Menu: the v1 menu under the v2 sign', lede: `${v2Note} The menu body is v1’s, in Neon Deco: the category bar, the base-spirit filter, the framed cocktail cards and the accordions. The header, footer and thumb bar are Version 2’s.` }),
  render: () => OC.v2.pages.menu(),
  mount: site => OC.v2.mount(site),
  doc: () => D.sec('01 · Moves', 'What this page takes from each version', 'The menu is the page people use with a drink in hand, so it keeps v1’s tools: filter, jump bar and accordions. The rest of the page matches Version 2.', D.table(['Part', 'Comes from', 'What it is'], [
      ['Header, footer, thumb bar', 'Version 2', 'The lit OC rings, open-now status, phone and BG / EN. The footer sign and the call / directions / home bar on phones'],
      ['Title', 'v1', '“Меню” with the “prices in euro” label and the open-now status'],
      ['Navigation', 'v1', 'A sticky category bar that follows the scroll and sits under the v2 header'],
      ['Cocktails', 'v1', 'Base-spirit filter with counts, and framed cards that light up in the drink’s colour (four across on desktop)'],
      ['Shots', 'v1', 'Two-column list at 3 € each, then the shot sets'],
      ['Spirits, wine, beer', 'v1', 'Accordions with volume and item count in each row. The first one starts open'],
      ['Background', 'Version 2', 'Pure black instead of v1’s warm off-black, so there is no seam under the v2 header'],
      ['NX0 partnership', 'Version 2 (new)', 'Closes the menu, on this page only: a guest has just picked a drink and is about to pay. NX0’s own logo from nx0.ai (the white wordmark, made for dark grounds) leads the strip at up to 340px and links through to them, so a partner spots it first (Von Restorff, Serial Position). Then “Your receipt here is worth something”, how it works in one sentence, NX0’s rule (open Earn before you pay) and a text link to nx0.ai/en/downloads. A text link, not a second gold button: gold stays on the call (rule 2)']
    ]))
});
})();
