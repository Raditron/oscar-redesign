/* Oscar Club — real content, bilingual. Sources:
   hours + ratings: Google Maps listing (via Wanderlog, Nov 2026) · contacts: oscarclubsofia.com + events flyer (/mainmenu/png/events.jpeg)
   cocktails: the 13 live signature cards (/mainmenu/png/*) · spirits, shots, wine, beer, soft drinks: /mainmenu/index.html (commented-out blocks left out)
   Spelling fixed where the live menu had typos (Coinreau → Cointreau, aftershok → Aftershock, jager → Jägermeister, AUCHEN TOSHAN → Auchentoshan). */
window.OC = window.OC || {};
OC.lang = 'bg';
OC.t = o => (o && typeof o === 'object' && 'bg' in o) ? o[OC.lang] : o;

OC.info = {
  phone: '+359 899 666 633', phoneHref: 'tel:+359899666633',
  eventsPhone: '+359 883 30 50 55', eventsPhoneHref: 'tel:+359883305055',
  email: 'oscarclub.sf@gmail.com', eventsEmail: 'events@oscarclubsofia.com',
  ig: 'oscarclub_official', igUrl: 'https://www.instagram.com/oscarclub_official/', igDm: 'https://ig.me/m/oscarclub_official',
  fbUrl: 'https://www.facebook.com/OscarClub.sf',
  address: { bg: 'ул. „Славянска“ 15, 1000 София', en: '15 Slavyanska St, 1000 Sofia' },
  area: { bg: 'София център', en: 'Sofia Center' },
  plus: 'M8VH+3X Sofia',
  mapsUrl: 'https://maps.google.com/?cid=15436931361011065073',
  dirUrl: 'https://www.google.com/maps/dir/?api=1&destination=Oscar+Club+Cocktail+bar%2C+Slavyanska+15%2C+Sofia',
  since: '23.05.1999', years: 27,
  ratings: [
    { src: 'Google', score: 4.7, count: 671 },
    { src: 'Tripadvisor', score: 4.8, count: 141 }
  ],
  award: { bg: 'Бранд на годината 2024', en: 'Brand of the Year 2024', by: { bg: 'Класация БГ', en: 'Klasatsia BG' } },
  slogan: 'allow yourself to be yourself.'
};

/* opening hours, Sofia time. close < open means after midnight. Monday = 1 */
OC.hours = [
  { d: 1, open: '18:00', close: '23:30' }, { d: 2, open: '18:00', close: '23:30' }, { d: 3, open: '18:00', close: '23:30' },
  { d: 4, open: '18:00', close: '02:00' }, { d: 5, open: '18:00', close: '03:00' }, { d: 6, open: '18:00', close: '03:00' },
  { d: 0, open: '18:00', close: '23:30' }
];
OC.dayNames = {
  bg: ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

/* drink families → token. base = base spirit, used by the menu filter */
OC.cocktails = [
  { id: 'tarator', img: 'taratorw', name: 'Tarator', drink: 'garden', base: 'vodka', ml: 280, price: 10,
    ing: { en: 'vodka, Skinos, lemon, bitters', bg: 'водка, Скинос, лимон, битер' } },
  { id: 'machree', img: 'macr', name: 'Machree', drink: 'berry', base: 'whiskey', ml: 330, price: 8,
    ing: { en: 'whiskey, strawberry, cassis, lemon', bg: 'уиски, ягода, касис, лимон' } },
  { id: 'mucho', img: 'much', name: 'Mucho Bien', drink: 'champagne', base: 'vodka', ml: 220, price: 8,
    ing: { en: 'vodka, Licor 43, Malibu, condensed milk, lemon', bg: 'водка, Licor 43, Малибу, кондензирано мляко, лимон' } },
  { id: 'blue', img: 'blue', name: 'Blue’s’our', drink: 'curacao', base: 'rum', ml: 280, price: 6,
    ing: { en: 'rum, blue curaçao, lemon, chamomile bitters', bg: 'ром, блу кюрасао, лимон, битер от лайка' } },
  { id: 'tropilita', img: 'trop', name: 'Tropilita', drink: 'garden', base: 'tequila', ml: 180, price: 6,
    ing: { en: 'tequila, kiwi, piña colada mix, lemon, bitters', bg: 'текила, киви, пиня колада, лимон, битер' } },
  { id: 'better', img: 'better', name: 'Better Taste', drink: 'berry', base: 'cognac', ml: 280, price: 12,
    ing: { en: 'cognac, cherry brandy, balsamic, honey, apple cordial', bg: 'коняк, черешово бренди, балсамико, мед, ябълков кордиал' } },
  { id: 'soju', img: 'sojuw', name: 'Soju Spritz', drink: 'champagne', base: 'soju', ml: 280, price: 8,
    ing: { en: 'soju, lemon soda, prosecco', bg: 'соджу, лимонена сода, просеко' } },
  { id: 'eden', img: 'edenw', name: 'Eden Garden', drink: 'amber', base: 'gin', ml: 220, price: 8,
    ing: { en: 'gin, pear, lychee, caramel, grapefruit', bg: 'джин, круша, личи, карамел, грейпфрут' } },
  { id: 'spraoi', img: 'spraiow', name: 'Spraoi', drink: 'garden', base: 'whiskey', ml: 330, price: 8,
    ing: { en: 'whiskey, kiwi, Granny Smith apple', bg: 'уиски, киви, ябълка Грани Смит' } },
  { id: 'french69', img: '69', name: 'French 69', drink: 'champagne', base: 'gin', ml: 175, price: 6,
    ing: { en: 'gin, pear, elderflower, lemon, prosecco', bg: 'джин, круша, бъз, лимон, просеко' } },
  { id: 'kissme', img: 'kissme', name: 'Kiss Me', drink: 'hibiscus', base: 'rum', ml: 250, price: 8,
    ing: { en: 'rum, hibiscus, sour cherry, lemon', bg: 'ром, хибискус, вишна, лимон' } },
  { id: 'cherry', img: 'cherry', name: 'Cherry Lady', drink: 'hibiscus', base: 'vodka', ml: 250, price: 10,
    ing: { en: 'vodka, Skinos, cherry brandy, lemon', bg: 'водка, Скинос, черешово бренди, лимон' } },
  { id: 'fridge', img: 'fridge', name: 'Fridge Cigarette', drink: 'amber', base: 'tequila', ml: 180, price: 6,
    ing: { en: 'tequila, mezcal, raspberry, bitters', bg: 'текила, мескал, малина, битер' } }
];
OC.bases = {
  vodka: { bg: 'Водка', en: 'Vodka' }, whiskey: { bg: 'Уиски', en: 'Whiskey' }, rum: { bg: 'Ром', en: 'Rum' },
  tequila: { bg: 'Текила', en: 'Tequila' }, gin: { bg: 'Джин', en: 'Gin' }, cognac: { bg: 'Коняк', en: 'Cognac' }, soju: { bg: 'Соджу', en: 'Soju' }
};

OC.shots = [
  ['Adios', 'Jägermeister, raspberry schnapps, Aftershock'], ['B-68', 'Kahlúa, Baileys, absinthe'], ['Strawberry NI', 'rum, strawberry, Baileys'],
  ['B-52', 'Kahlúa, Baileys, Cointreau'], ['Blow Job', 'Kahlúa, Baileys, whipped cream'], ['Bolivian Kiss', 'Agwa de Bolivia, lime'],
  ['Brain Tumor', 'Carpano Dry, grenadine, Baileys'], ['Brave Bull', 'tequila, Kahlúa, cacao liqueur'], ['Hot Jump', 'sambuca, rum, Tabasco'],
  ['Slippery Nipple', 'sambuca, Baileys, grenadine'], ['Sticky Fingers', 'Aftershock Red, whiskey'], ['Coco-Loco', 'vodka, cacao, Frangelico'],
  ['Thin Red Line', 'tequila, sambuca, Tabasco'], ['Viagra', 'mint, amaretto, Baileys, cacao'], ['Cool Kiss', 'Aftershock Red, Baileys'],
  ['Goodbye Johnnie', 'tequila, pineapple rum'], ['Hammer', 'Aftershock Black, absinthe'], ['K-For', 'mint schnapps, Jägermeister'],
  ['No Name', 'Baileys, Licor 43, Cointreau'], ['Peach Lady', 'peach, pineapple rum, grenadine'], ['Red Devil', 'Aftershock Red, absinthe']
];
OC.shotSets = [
  { name: 'Booster Dose', n: 6, price: 18, ing: { bg: 'никой не знае', en: 'no one knows' } },
  { name: 'Revolution', n: 8, price: 20, ing: { bg: 'уиски, амарето, водка, блу кюрасао, ром, гренадин', en: 'whisky, amaretto, vodka, blue curaçao, rum, grenadine' } }
];

/* spirits & the rest. vol = serving. Bickens appears twice on the live menu; listed once here (ask the bar). */
OC.menu = [
  { id: 'vodka', t: { bg: 'Водка', en: 'Vodka' }, vol: '50 ml', items: [['Skyy', 5]] },
  { id: 'gin', t: { bg: 'Джин', en: 'Gin' }, vol: '50 ml', items: [['Bickens', 5], ['Rocu', 8]] },
  { id: 'tequila', t: { bg: 'Текила', en: 'Tequila' }, vol: '25 ml', items: [['Espolòn Silver / Reposado', 3]] },
  { id: 'whisky', t: { bg: 'Шотландско уиски', en: 'Scotch whisky' }, vol: '50 ml', items: [['Loch Lomond', 7], ['Tamnavulin 12', 7], ['Jura 10', 9], ['Loch Lomond 12', 10], ['Glen Grant 12', 10], ['Auchentoshan 12', 10], ['anCnoc', 12]] },
  { id: 'irish', t: { bg: 'Ирландско уиски', en: 'Irish whiskey' }, vol: '50 ml', items: [['Kilbeggan', 5]] },
  { id: 'bourbon', t: { bg: 'Бърбън', en: 'Bourbon' }, vol: '50 ml', items: [['Jim Beam', 5]] },
  { id: 'digestif', t: { bg: 'Дижестив', en: 'Digestif' }, vol: '25 ml', items: [['Averna', null]], note: { bg: 'Цената на сайта е в лева. Чака потвърждение в евро.', en: 'The live site still prices this in BGN. Waiting for the euro price.' } },
  { id: 'wine', t: { bg: 'Вино', en: 'Wine' }, vol: '750 ml', items: [['Cinzano', 35]] },
  { id: 'beer', t: { bg: 'Бира', en: 'Beer' }, vol: '0,5 l', items: [['Schöfferhofer', 5]] },
  { id: 'soft', t: { bg: 'Безалкохолни', en: 'Soft drinks' }, vol: '', items: [['Coca-Cola · 330 ml', 3], ['Crodo lemon / orange / mojito · 330 ml', 3], ['Red Bull · 250 ml', 4, { bg: 'енергийна напитка, без захар, издания', en: 'energy drink, sugar-free, editions' }]] }
];

/* site copy — written to the NX0 copy guide: every sentence carries a fact from the list below, said the way
   a friend would say it. Bulgarian written first (ти throughout), English written separately, not translated line by line.
   FACTS USED (source):
   F1 15 Slavyanska St, Sofia centre ............ live site map, Instagram, Google
   F2 opened 23.05.1999, 27 years ............... hidden history text in /index.html, Instagram post
   F3 founder Trifon Gyatsov .................... hidden history text (owners to confirm)
   F4 café for work meetings by day, club at night; later a cocktail bar; the motto came then ... hidden history text
   F5 hours ...................................... Google Maps listing
   F6 13 signatures, €6–€12 ..................... live menu
   F7 Tarator: vodka, Skinos, lemon, bitters; cucumber, dill, pecan in the glass ... menu card + its photo
   F8 21 shots at €3, 25 ml; spirits 50 ml, tequila 25 ml ... live menu
   F9 Google 4.7 (671), Tripadvisor 4.8 (141), Nov 2026 ... Google listing via Wanderlog
   F10 Brand of the Year 2024, Klasatsia BG ..... award image
   F11 booking by phone and Instagram ........... live site, Google "Find a table" → Instagram
   F12 bartenders + baristas to private, corporate events and festivals; offer by email ... events flyer
   F13 DJ / vinyl nights; Halloween 31.10 €15, DISCOCKTAILS 07.11 €10; announced on Instagram ... Instagram posts
   F14 lit OC sign over the door ................. Instagram storefront photo
   F15 wheelchair-accessible entrance ........... Google listing
   F16 prices in euro ............................ live menu */
OC.copy = {
  nav: [['menu', { bg: 'Меню', en: 'Menu' }], ['cocktails', { bg: 'Коктейли', en: 'Cocktails' }], ['events', { bg: 'Събития', en: 'Events' }], ['visit', { bg: 'Посещение', en: 'Visit' }]],
  call: { bg: 'Обади се', en: 'Call' },
  callBook: { bg: 'Обади се за маса', en: 'Call to book a table' },
  dm: { bg: 'Пиши ни в Instagram', en: 'Message us on Instagram' },
  dmShort: { bg: 'Instagram', en: 'Instagram' },
  dirs: { bg: 'Маршрут', en: 'Directions' },
  seeMenu: { bg: 'Виж менюто', en: 'See the menu' },
  fullMenu: { bg: 'Всички 13 в менюто', en: 'All 13 on the menu' },

  /* hero: the slogan is the bar's own words (kept); the lede carries the facts, two beats (F1 F2, F6) */
  heroKick: { bg: 'Коктейл бар · ул. „Славянска“ 15 · от 1999', en: 'Cocktail bar · 15 Slavyanska St · since 1999' },
  heroLede: {
    bg: 'От 1999 г. сме на „Славянска“ 15. В менюто има 13 коктейла, които измислихме тук, от 6 до 12 €.',
    en: 'We’ve been at 15 Slavyanska since 1999. The menu has 13 cocktails we came up with here, from €6 to €12.'
  },
  bookNote: { bg: 'Маса запазваш по телефона или в Instagram', en: 'Book a table by phone or on Instagram' },

  /* signatures (F7, F6) */
  sigKick: { bg: 'Авторски коктейли', en: 'Signature cocktails' },
  sigH: { bg: 'Тараторът е студена супа. Нашият е в чаша, с водка и Скинос.', en: 'Tarator is Bulgaria’s cold cucumber soup. Ours comes in a glass, with vodka and Skinos.' },
  menuSigH: { bg: '13 коктейла от 6 до 12 €. Избери по алкохола, който пиеш.', en: '13 cocktails, €6 to €12. Pick by the spirit you drink.' },

  /* story (F2 F3 F4 F10) */
  storyKick: { bg: 'От 1999 г.', en: 'Since 1999' },
  storyH: { bg: 'Започнахме като кафене за бизнес срещи. Вечер ставаше клуб.', en: 'We opened as a café for work meetings. At night it turned into a club.' },
  story: {
    bg: ['Трифон Гяцов отвори „Оскар клуб“ на 23 май 1999 г. По-късно клубът стана коктейл бар. Тогава се появи и девизът, който пишем и днес.',
         'През 2024 г. „Класация БГ“ ни избра за бранд на годината.'],
    en: ['Trifon Gyatsov opened Oscar Club on 23 May 1999. Later the club became a cocktail bar. That’s when the motto we still use came along.',
         'In 2024, Klasatsia BG named us Brand of the Year.']
  },

  /* music (F13), the catch said plainly */
  musicKick: { bg: 'Музика', en: 'Music' },
  musicH: { bg: 'В събота често има DJ. Програмата първо излиза в Instagram.', en: 'Saturdays often have a DJ. The line-up goes up on Instagram first.' },
  musicCatch: { bg: 'Някои вечери има вход, 10–15 €. Пишем го в обявата.', en: 'Some nights have an entry fee, €10–15. It’s always in the post.' },
  musicRecent: { bg: 'Последните вечери', en: 'Recent nights' },
  nights: [
    { date: '31.10', name: { bg: 'Halloween парти · DJ Павел Бочев', en: 'Halloween party · DJ Pavel Bochev' }, fee: 15 },
    { date: '07.11', name: { bg: 'DISCOCKTAILS · Bo Vinyls на винил', en: 'DISCOCKTAILS · Bo Vinyls on vinyl' }, fee: 10 }
  ],
  musicCta: { bg: 'Програмата в Instagram', en: 'Line-up on Instagram' },

  /* events (F12) */
  evKick: { bg: 'Събития', en: 'Events' },
  evH: { bg: 'Празнуваш другаде? Барът идва с теб.', en: 'Party somewhere else? The bar comes with you.' },
  evLede: { bg: 'Изпращаме бармани и баристи на частни и фирмени събития и на фестивали. Пиши ни какво празнуваш, къде и за колко души, и ще ти върнем оферта.', en: 'We send bartenders and baristas to private parties, company events and festivals. Tell us what you’re celebrating, where, and for how many people, and we’ll send you an offer.' },
  evTypes: [['home', { bg: 'Частни събития', en: 'Private events' }], ['building', { bg: 'Фирмени събития', en: 'Company events' }], ['stage', { bg: 'Фестивали', en: 'Festivals' }]],
  evCta: { bg: 'Пиши за оферта', en: 'Ask for an offer' },

  /* visit (F1 F14 F5 F15) */
  visitKick: { bg: 'Посещение', en: 'Visit' },
  visitH: { bg: '„Славянска“ 15, в центъра. Влизаш под светещия знак OC.', en: '15 Slavyanska, in the centre. Look for the lit OC sign over the door.' },
  hoursH: { bg: 'Работно време', en: 'Opening hours' },
  access: { bg: 'Входът е достъпен с инвалидна количка', en: 'The entrance is wheelchair accessible' },
  euro: { bg: 'Всички цени са в евро', en: 'All prices are in euro' },

  /* proof (F9 F10 F2) */
  reviews: { bg: 'отзива', en: 'reviews' },
  years: { bg: 'години', en: 'years' },
  sinceLabel: { bg: 'от 23.05.1999', en: 'since 23 May 1999' },

  /* menu (F8 F16) */
  menuH: { bg: 'Меню', en: 'Menu' },
  allBases: { bg: 'Всички', en: 'All' },
  byBase: { bg: 'По основа', en: 'By base spirit' },
  shotsH: { bg: '21 шота. Всеки е 3 €.', en: '21 shots. Every one is €3.' },
  shotsNav: { bg: 'Шотове', en: 'Shots' },
  shotsNote: { bg: 'По 25 ml. Сетовете са отделно, най-долу.', en: '25 ml each. The sets are separate, at the bottom.' },
  setsH: { bg: 'Сетове', en: 'Sets' },
  shotsCount: { bg: 'шота', en: 'shots' },
  spKick: { bg: 'Спиртни напитки и още', en: 'Spirits and more' },
  spH: { bg: 'Уиски, джин, вино, бира. Мерим по 50 ml, текилата по 25.', en: 'Whisky, gin, wine, beer. We pour 50 ml, tequila 25.' },

  copy: { bg: 'Копирай', en: 'Copy' },
  copied: { bg: 'Копирано', en: 'Copied' },
  today: { bg: 'днес', en: 'today' },
  rights: { bg: 'Оскар клуб', en: 'Oscar Club' }
};
