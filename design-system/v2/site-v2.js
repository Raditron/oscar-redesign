/* Oscar Club — Version 2 site builders. Same data (data.js) and the same helpers (site.js: icons, status, mark),
   new composition. Concept: "Dark room, lit glass" — the page is the bar at night; the only light comes from the
   drinks, the brass and the sign over the door. Rules:
     1. Black is the room, ivory is the type. Colour exists only where a drink is.
     2. Gold is the brass (paint): the one action per screen, today's hours, the slogan's voice, the gold room.
     3. Neon is the sign (light): brand marks only (hero slogan, OC rings, the menu's title) and a drink's name while
        you point at it, in that drink's colour. Never UI: no lit buttons, cards, panels or borders.
     4. Type is the architecture: one display face (Poiret One, Art Deco caps), set huge; one italic voice (Cormorant);
        one text face (Onest).
     5. No boxes. Things group by space and alignment, not by borders and cards.
     6. Every section has a different shape. Scroll like a film edit: loud, quiet, dense, empty.
   v1 (site.js + components.css) is untouched; every class here is prefixed v2-. */
(() => {
const t = OC.t, I = OC.I, esc = OC.esc, price = OC.price;
const bg = () => OC.lang === 'bg';
const num = v => Number(v).toLocaleString(bg() ? 'bg-BG' : 'en-GB');
const ext = (href, cls, inner, extra = '') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener"${extra}>${inner}</a>`;
const ck = id => OC.cocktails.find(c => c.id === id);
const src = c => `img/cocktails/${c.img}.webp`;
const href = p => OC.proto ? '#v2-' + p : OC.href(p);
const toMin = s => +s.slice(0, 2) * 60 + +s.slice(3);
const arrow = '<span class="v2-ar" aria-hidden="true">→</span>';
const out = '<span class="v2-ar" aria-hidden="true">↗</span>';

const C = {
  orDm: { bg: 'или пиши в Instagram', en: 'or message us on Instagram' },
  /* the story is told in the voice (Cormorant), so it runs straight into the slogan with no change of hand.
     No pictures inside the words: the storefront pill read as a decorative pill, and the glasses are shown in full right below */
  say: {
    /* two halves: then, and now. Set side by side, the motto centred under both */
    bg: ['Отворихме на 23 май 1999 г. като кафене за бизнес срещи. Вечер ставаше клуб.', 'Днес сме коктейл бар с 13 авторски коктейла и девиз, който пишем и до днес:'],
    en: ['We opened on 23 May 1999 as a café for business meetings. At night it turned into a club.', 'Today we’re a cocktail bar with 13 cocktails of our own and a motto we still write on everything:']
  },
  founder: { bg: 'Основател: Трифон Гяцов', en: 'Founded by Trifon Gyatsov' },
  featH: { bg: 'Тараторът е студена супа.', en: 'Tarator is a cold cucumber soup.' },
  featP: { bg: 'Нашият е в чаша: водка, Скинос, лимон и битер, с краставица, копър и пекан отгоре.', en: 'Ours comes in a glass: vodka, Skinos, lemon and bitters, topped with cucumber, dill and a pecan.' },
  featKick: { bg: 'Авторски коктейли', en: 'Signature cocktails' },
  /* one line per drink, set in the menu's face (Poiret One caps). Drafts: built only from the name and what is in the glass, no claims
     about the bar. Shapes vary on purpose (statement, question, fragment) so thirteen of them don't read as a template */
  slogans: {
    tarator: { bg: 'Тараторът е студена супа.', en: 'Tarator is a cold cucumber soup.' },
    machree: { bg: 'Уиски, ягода и малко сърце.', en: 'Whiskey, strawberry and a little heart.' },
    mucho: { bg: 'Десерт, който се пие.', en: 'Dessert you drink.' },
    blue: { bg: 'Синьо като часа след залез.', en: 'Blue as the hour after sunset.' },
    tropilita: { bg: 'Плаж в 180 ml.', en: 'A beach in 180 ml.' },
    better: { bg: 'Коняк и мед, с балсамико за кураж.', en: 'Cognac and honey, with balsamic for nerve.' },
    soju: { bg: 'Сеул и Венеция се срещат на „Славянска“.', en: 'Seoul meets Venice on Slavyanska.' },
    eden: { bg: 'Кой каза, че е била ябълката?', en: 'Who said it was the apple?' },
    spraoi: { bg: 'Уиски, което не се взема на сериозно.', en: 'Whiskey that doesn’t take itself seriously.' },
    french69: { bg: 'Не точно French 75. В това е смисълът.', en: 'Not quite a French 75. That’s the point.' },
    kissme: { bg: 'Името е покана.', en: 'The name is an invitation.' },
    cherry: { bg: 'Черешово бренди с маниери.', en: 'Cherry brandy with manners.' },
    fridge: { bg: 'Димът е от мескала.', en: 'The smoke is the mezcal.' }
  },
  prevDrink: { bg: 'Предишен коктейл', en: 'Previous cocktail' }, nextDrink: { bg: 'Следващ коктейл', en: 'Next cocktail' },
  pause: { bg: 'Пауза', en: 'Pause' }, play: { bg: 'Пусни', en: 'Play' }, of: { bg: 'от', en: 'of' },
  idxH: { bg: 'Всички 13 авторски', en: 'All 13 of our own' },
  fullMenu: { bg: 'Цялото меню', en: 'The full menu' },
  musicH: { bg: 'В събота често има DJ.', en: 'Saturdays often have a DJ.' },
  musicP: { bg: 'Програмата първо излиза в Instagram. Някои вечери има вход, 10–15 €, и винаги го пишем в обявата.', en: 'The line-up goes up on Instagram first. Some nights have an entry fee, €10–15, and it’s always in the post.' },
  entry: { bg: 'вход', en: 'entry' },
  evH1: { bg: 'Празнуваш другаде?', en: 'Party somewhere else?' },
  evH2: { bg: 'Барът идва с теб.', en: 'The bar comes with you.' },
  evTypes: { bg: ['Частни партита', 'Фирмени събития', 'Фестивали'], en: ['Private parties', 'Company events', 'Festivals'] },
  visit1: { bg: '„Славянска“', en: 'Slavyanska' },
  visitP: { bg: 'София център. Влизаш под светещия знак OC.', en: 'Sofia centre. Walk in under the lit OC sign.' },
  late: { bg: 'Четвъртък до 02:00. Петък и събота до 03:00.', en: 'Thursdays until 02:00. Fridays and Saturdays until 03:00.' },
  /* happy hour (#18): only the time is known. The old site never mentions it, so days, drinks and prices are "ask the bar" */
  hh: { bg: '<span lang="en">Happy hour</span> <span class="tnum">18:00–20:00</span>.', en: 'Happy hour <span class="tnum">18:00–20:00</span>.' },
  now: { bg: 'сега', en: 'now' },
  phone: { bg: 'Телефон', en: 'Phone' }, email: { bg: 'Имейл', en: 'Email' }, access: { bg: 'Достъп', en: 'Access' },
  accessV: { bg: 'Входът е достъпен с инвалидна количка', en: 'Step-free, wheelchair-accessible entrance' },
  home: { bg: 'Начало', en: 'Home' },
  /* NX0 partnership. Facts only from NX0's own site (nx0.ai): pay as usual, scan the receipt, the reward lands in the
     City Wallet, and it only counts if the reward was live in Earn before you paid. No amounts: Oscar's offer is not known */
  nx0Url: 'https://nx0.ai/',
  nx0Dl: 'https://nx0.ai/en/downloads',
  nx0H: { bg: 'Касовата бележка тук струва нещо.', en: 'Your receipt here is worth something.' },
  nx0P: { bg: 'Оскар клуб е партньор на NX0. Плащаш както винаги, снимаш бележката в приложението и наградата отива в City Wallet.', en: 'Oscar Club is a partner on NX0. Pay the way you always do, scan the receipt in the app, and the reward lands in your City Wallet.' },
  nx0Rule: { bg: 'Отвори Earn, преди да платиш: бележката важи само ако наградата е активна.', en: 'Open Earn before you pay: a receipt only counts if the reward is live.' },
  nx0Get: { bg: 'Изтегли NX0', en: 'Download NX0' },
};

/* the OC rings as a lit sign (brand mark: neon allowed) */
const litMark = () => OC.mark().replace('class="mark"', 'class="mark lit"');

/* ---------- status ---------- */
const nowLine = (cls = '') => { const s = OC.status(); return `<span class="v2-now ${cls}" data-state="${s.state}" role="status"><i class="v2-dot" aria-hidden="true"></i><b>${s.label}</b><span class="det">${s.detail}</span></span>`; };

/* ---------- header ---------- */
const header = page => {
  const nav = [['menu', OC.copy.nav[0][1]], ['cocktails', OC.copy.nav[1][1]], ['music', OC.copy.musicKick], ['events', OC.copy.nav[2][1]], ['visit', OC.copy.nav[3][1]]];
  return `<header class="v2-hdr${page === 'menu' ? ' is-pinned' : ''}"><div class="v2-hdr-in">
  <a class="v2-brand" href="${href('home')}" aria-label="Oscar Club · ${bg() ? 'начало' : 'home'}">${litMark()}</a>
  <nav class="v2-nav" aria-label="${bg() ? 'Основна навигация' : 'Main'}">${nav.map(([k, l]) => {
    if (k === 'menu') return `<a href="${href('menu')}"${page === 'menu' ? ' aria-current="page"' : ''}>${t(l)}</a>`;
    return page === 'home' ? `<a href="#${k}" data-scroll="${k}">${t(l)}</a>` : `<a href="${href('home')}">${t(l)}</a>`; }).join('')}</nav>
  <div class="v2-hdr-end">${nowLine('in-hdr')}<a class="v2-tel" href="${OC.info.phoneHref}">${OC.info.phone}</a>
    <div class="v2-lang" role="group" aria-label="${bg() ? 'Език' : 'Language'}">${['bg', 'en'].map(l => `<button type="button" data-oc-lang="${l}" aria-pressed="${OC.lang === l}" lang="${l}">${l.toUpperCase()}</button>`).join('<span aria-hidden="true">/</span>')}</div></div>
</div></header>`;
};

/* ---------- 1 · hero: a poster. The glass is the only colour on the screen ---------- */
const hero = () => {
  const c = ck('blue');   /* not Mo Chroí: it opens the story's glasses and the index right below, so red would show twice in a row */
  const r = OC.info.ratings;
  return `<section class="v2-hero" aria-labelledby="v2-hero-h">
  <div class="v2-hero-glass" style="--drink:var(--d-${c.drink})" aria-hidden="true"><img src="${src(c)}" alt="" width="560" height="580"></div>
  <h1 class="v2-hero-h v2-neon" id="v2-hero-h"><span class="l1">allow </span><span class="l2">yourself </span><span class="l3">to be yourself.</span></h1>
  <div class="v2-hero-act">
    <a class="v2-btn" href="${OC.info.phoneHref}">${I('phone', 19)}<span>${t(OC.copy.callBook)}</span>${arrow}</a>
    <p class="v2-hero-alt"><a class="v2-link tnum" href="${OC.info.phoneHref}">${OC.info.phone}</a><span aria-hidden="true">·</span>${ext(OC.info.igDm, 'v2-link', t(C.orDm))}</p>
  </div>
  <ul class="v2-slate">
    <li>${nowLine()}</li>
    <li>${t(OC.info.address).split(',')[0]} ${ext(OC.info.dirUrl, 'v2-link', t(OC.copy.dirs) + out)}</li>
    <li class="tnum">${r.map(x => `<span><b>${num(x.score)}</b> ${x.src}</span>`).join('<span aria-hidden="true">·</span>')}<span class="v2-dim">${num(r[0].count + r[1].count)} ${t(OC.copy.reviews)}</span></li>
    <li><img src="img/award-2024.webp" alt="" width="28" height="28">${t(OC.info.award)}</li>
  </ul>
</section>`;
};

/* ---------- 2 · one sentence, nearly empty screen. The history told as prose, with the pictures inside the words ---------- */
const statement = () => `<section class="v2-say-sec" aria-label="${bg() ? 'История' : 'Our story'}">
  <div class="v2-say">${t(C.say).map(p => `<p>${p}</p>`).join('')}<p class="v2-say-motto">allow yourself to be yourself.</p></div>
  <div class="v2-say-foot"><span class="tnum">23.05.1999</span><span>${t(C.founder)}</span><span><img src="img/award-2024.webp" alt="" width="36" height="36">${t(OC.info.award)} · ${t(OC.info.award.by)}</span></div>
</section>`;

/* ---------- 3 · the signatures, one at a time: each drink with its own slogan. It runs by itself and hands over control
   the moment you reach for it. Decided with the Laws of UX:
     Doherty Threshold        every change finishes inside 400ms: one crossfade, nothing slides
     Working Memory, Cognitive Load   a drink stays long enough to read slogan + recipe: 2.5s for the glass + 0.3s a word
                              (~200 wpm), never under 6s. Slogans stay under ~7 words for the same reason
     Hick's Law               two controls (← →) and a counter, not 13 dots
     Fitts's Law              48px targets; on a phone the whole glass is a swipe target
     Jakob's Law              swipe and ← → keys work the way every carousel does
     Goal-Gradient Effect     a hairline fills toward the next drink, so the change is never a surprise
     Selective Attention      it holds still under the pointer or keyboard focus, off screen, in a hidden tab and under
                              prefers-reduced-motion; after you use ← → it stops for good (Pause / Play brings it back:
                              WCAG 2.2.2 asks for a way to stop anything that moves on its own) ---------- */
const featLede = c => c.id === 'tarator' ? t(C.featP) : ing(c);
const words = h => h.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
const dwell = c => Math.max(6000, Math.round((2500 + 300 * (words(t(C.slogans[c.id])) + words(featLede(c)))) / 500) * 500);
const pad = n => String(n).padStart(2, '0');
const feature = () => {
  const list = [ck('tarator'), ...OC.cocktails.filter(c => c.id !== 'tarator')];
  const hid = i => i ? ' aria-hidden="true"' : '';
  return `<section class="v2-feat" id="cocktails" aria-labelledby="v2-feat-h" aria-roledescription="${bg() ? 'въртележка' : 'carousel'}">
  <h2 class="vh" id="v2-feat-h">${t(C.featKick)}</h2>
  <div class="v2-feat-imgs" aria-hidden="true">${list.map((c, i) => `<figure class="v2-feat-img${i ? '' : ' on'}" data-dwell="${dwell(c)}" style="--drink:var(--d-${c.drink})"><img src="${src(c)}" alt="" width="560" height="566" loading="lazy"><figcaption>${esc(c.name)}</figcaption></figure>`).join('')}</div>
  <div class="v2-feat-txt">
    <div class="v2-feat-stack" aria-live="off">${list.map((c, i) => `<div class="v2-feat-slide${i ? '' : ' on'}" role="group" aria-roledescription="${bg() ? 'слайд' : 'slide'}" aria-label="${i + 1} ${t(C.of)} ${list.length}"${hid(i)}>
      <p class="v2-feat-slogan">${esc(t(C.slogans[c.id]))}</p><p class="v2-lede">${featLede(c)}</p>
      <p class="v2-feat-meta tnum"><span>${esc(c.name)}</span><span>${c.ml} ml</span><b>${price(c.price)}</b></p></div>`).join('')}</div>
    <div class="v2-car">
      <span class="v2-car-bar" aria-hidden="true"><i></i></span>
      <button type="button" data-v2-car="prev" aria-label="${t(C.prevDrink)}"><span aria-hidden="true">←</span></button>
      <span class="v2-car-n tnum" aria-hidden="true"><b data-v2-count>01</b> / ${pad(list.length)}</span>
      <button type="button" data-v2-car="next" aria-label="${t(C.nextDrink)}"><span aria-hidden="true">→</span></button>
      <button type="button" class="v2-car-toggle" data-v2-car="toggle" data-pause="${t(C.pause)}" data-play="${t(C.play)}">${t(C.pause)}</button>
    </div>
  </div>
</section>`;
};

/* carousel behaviour: bound to the section itself, which is new on every render, so nothing is bound twice */
const carousel = (site, feat) => {
  const imgs = [...feat.querySelectorAll('.v2-feat-img')], slides = [...feat.querySelectorAll('.v2-feat-slide')], n = slides.length;
  const stack = feat.querySelector('.v2-feat-stack'), count = feat.querySelector('[data-v2-count]');
  const bar = feat.querySelector('.v2-car-bar i'), toggle = feat.querySelector('[data-v2-car="toggle"]');
  const st = { i: 0, playing: !matchMedia('(prefers-reduced-motion: reduce)').matches, hold: false, seen: !('IntersectionObserver' in window) };
  const show = k => {
    st.i = (k + n) % n;
    imgs.forEach((el, j) => el.classList.toggle('on', j === st.i));
    slides.forEach((el, j) => { el.classList.toggle('on', j === st.i); j === st.i ? el.removeAttribute('aria-hidden') : el.setAttribute('aria-hidden', 'true'); });
    count.textContent = pad(st.i + 1);
  };
  const run = () => {
    clearTimeout(site._v2featT);
    const live = st.playing && !st.hold && st.seen && !document.hidden && feat.isConnected;
    feat.dataset.playing = String(live);
    bar.style.animation = 'none';
    if (!live) return;
    const ms = +imgs[st.i].dataset.dwell;
    void bar.offsetWidth; bar.style.animation = `v2-fill ${ms}ms linear`;
    site._v2featT = setTimeout(() => { show(st.i + 1); run(); }, ms);
  };
  const setPlaying = on => {
    st.playing = on;
    toggle.textContent = on ? toggle.dataset.pause : toggle.dataset.play;
    stack.setAttribute('aria-live', on ? 'off' : 'polite');   /* announce only what the visitor asked for */
    run();
  };
  const step = d => { setPlaying(false); show(st.i + d); };
  feat.addEventListener('click', e => {
    const b = e.target.closest('[data-v2-car]'); if (!b) return;
    if (b.dataset.v2Car === 'toggle') setPlaying(!st.playing); else step(b.dataset.v2Car === 'next' ? 1 : -1);
  });
  feat.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); } });
  feat.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { st.hold = true; run(); } });
  feat.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { st.hold = false; run(); } });
  feat.addEventListener('focusin', () => { st.hold = true; run(); });
  feat.addEventListener('focusout', e => { if (!feat.contains(e.relatedTarget)) { st.hold = false; run(); } });
  let x0 = null;
  const imgsBox = feat.querySelector('.v2-feat-imgs');
  imgsBox.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  imgsBox.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); });
  imgsBox.addEventListener('pointercancel', () => { x0 = null; });
  site._v2featRun = run;
  if (!st.seen) { const io = new IntersectionObserver(([en]) => { st.seen = en.isIntersecting; run(); }, { threshold: .35 }); io.observe(feat); site._v2obs.push(io); }
  setPlaying(st.playing);
};

/* ---------- 4 · the index: a typeset list, the glass appears in its own colour ---------- */
const index = () => {
  const list = ['tarator', 'machree', 'blue', 'kissme', 'eden', 'spraoi', 'better', 'french69', 'mucho', 'soju', 'cherry', 'tropilita', 'fridge'].map(ck);
  return `<section class="v2-idx" aria-labelledby="v2-idx-h">
  <div class="v2-idx-head"><h2 class="v2-h3" id="v2-idx-h">${t(C.idxH)}</h2><a class="v2-link" href="${href('menu')}">${t(C.fullMenu)}${arrow}</a></div>
  <div class="v2-idx-grid">
    <ol class="v2-list">${list.map((c, i) => `<li class="v2-row${i ? '' : ' on'}" data-v2-pick="${c.id}" style="--drink:var(--d-${c.drink})">
      <img class="th" src="${src(c)}" alt="" width="56" height="56" loading="lazy"><span class="nm">${esc(c.name)}</span><span class="ing">${ing(c)}</span><span class="ml tnum">${c.ml} ml</span><span class="pr tnum">${price(c.price)}</span></li>`).join('')}</ol>
    <div class="v2-prev" style="--drink:var(--d-${list[0].drink})" aria-hidden="true">${list.map((c, i) => `<img class="${i ? '' : 'on'}" data-v2-img="${c.id}" src="${src(c)}" alt="" width="560" height="560" loading="lazy">`).join('')}</div>
  </div>
</section>`;
};

/* ---------- NX0: the partner's sticker on the door, at the foot of the menu only. Bars put the apps they accept on the
   glass by the entrance; this is that sticker. It closes the menu, where a guest has just picked a drink and is about
   to pay. The mark is NX0's own logo from nx0.ai (white wordmark with the arrow, made for dark grounds), unaltered and
   linked through to them, set large and first in reading order so it is the first thing seen in the strip (Von
   Restorff, Serial Position). The download is a text link, not a second gold button: gold stays on the call (rule 2) */
const nx0 = () => `<section class="v2-nx0" id="nx0" aria-labelledby="v2-nx0-h">
  <div class="v2-nx0-txt">
    <h2 class="v2-h2" id="v2-nx0-h">${t(C.nx0H)}</h2>
    <p class="v2-lede">${t(C.nx0P)}</p>
    <p class="v2-nx0-rule">${t(C.nx0Rule)}</p>
    ${ext(C.nx0Dl, 'v2-link', t(C.nx0Get) + out)}
  </div>
  ${ext(C.nx0Url, 'v2-nx0-mark', '<img src="img/nx0-logo.png" alt="NX0" width="640" height="229">')}
</section>`;

/* ---------- 5 · music: a gig bill. Dates as the headline type, the fee said before you get there ---------- */
const music = () => `<section class="v2-music" id="music" aria-labelledby="v2-mu-h">
  <h2 class="v2-h2 v2-music-h" id="v2-mu-h">${t(C.musicH)}</h2>
  <div class="v2-music-grid">
    <figure class="v2-music-img"><img src="img/dj-chandelier.webp" alt="${bg() ? 'DJ пуска музика под медния полилей в Оскар клуб' : 'A DJ playing under the copper chandelier at Oscar Club'}" width="480" height="640" loading="lazy"></figure>
    <div class="v2-music-txt">
      <p class="v2-lede">${t(C.musicP)}</p>
      <ol class="v2-gigs">${OC.copy.nights.map(n => `<li><span class="d tnum">${n.date}</span><span class="n">${esc(t(n.name))}</span><span class="f tnum">${t(C.entry)} ${price(n.fee)}</span></li>`).join('')}</ol>
      ${ext(OC.info.igUrl, 'v2-link', '@' + OC.info.ig + out)}
    </div>
  </div>
</section>`;

/* ---------- 6 · events: the one gold room ---------- */
const events = () => `<section class="v2-events" id="events" aria-labelledby="v2-ev-h">
  <h2 class="v2-ev-h" id="v2-ev-h">${t(C.evH1)} <span>${t(C.evH2)}</span></h2>
  <div class="v2-ev-cols">
    <p class="v2-ev-p">${t(OC.copy.evLede)}</p>
    <ul class="v2-ev-types">${t(C.evTypes).map(x => `<li>${x}</li>`).join('')}</ul>
    <div class="v2-ev-contact"><a class="v2-ev-mail" href="mailto:${OC.info.eventsEmail}">${OC.info.eventsEmail}</a><a class="v2-ev-tel tnum" href="${OC.info.eventsPhoneHref}">${OC.info.eventsPhone}</a></div>
  </div>
</section>`;

/* ---------- 7 · visit: the address as the headline, the hours as a picture of the week ---------- */
const week = () => {
  const now = OC.sofiaNow();
  const yest = OC.hoursFor((now.d + 6) % 7);
  const afterMidnight = yest && toMin(yest.close) <= toMin(yest.open) && now.m < toMin(yest.close);
  const night = afterMidnight ? (now.d + 6) % 7 : now.d;
  const span = 9 * 60;   /* 18:00 → 03:00 */
  const pos = m => Math.max(0, Math.min(100, (m - 18 * 60) / span * 100));
  const st = OC.status(now);
  const nowM = afterMidnight ? now.m + 1440 : now.m;
  return `<div class="v2-week-wrap"><div class="v2-axis" aria-hidden="true"><span style="left:0">18:00</span><span style="left:33.33%">21:00</span><span style="left:66.67%">00:00</span><span style="left:100%">03:00</span></div>
  <table class="v2-week"><caption class="vh">${t(OC.copy.hoursH)}</caption><tbody>${[1, 2, 3, 4, 5, 6, 0].map(d => {
    const h = OC.hoursFor(d); let c = toMin(h.close); if (c <= toMin(h.open)) c += 1440;
    const isNight = d === night;
    return `<tr class="${isNight ? 'today' : ''}"><th scope="row">${OC.dayNames[OC.lang][d]}</th><td><div class="v2-bar" style="--a:${pos(toMin(h.open))}%;--w:${pos(c) - pos(toMin(h.open))}%"><i></i><span class="tnum">${h.open} – ${h.close}</span>${isNight && st.state !== 'closed' ? `<em class="v2-nowline" style="--x:${pos(nowM)}%" title="${t(C.now)}"></em>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>`;
};
const visit = () => `<section class="v2-visit" id="visit" aria-labelledby="v2-visit-h">
  <div class="v2-visit-top">
    <h2 class="v2-addr" id="v2-visit-h"><span>${t(C.visit1)}</span><span>15</span></h2>
    <figure class="v2-sign"><img src="img/storefront.webp" alt="${bg() ? 'Светещият знак OC над входа на „Славянска“ 15 вечер' : 'The lit OC sign over the door at 15 Slavyanska, at night'}" width="480" height="640" loading="lazy"></figure>
  </div>
  <p class="v2-lede v2-visit-p">${t(C.visitP)}</p>
  <div class="v2-visit-grid">
    <div class="v2-hours"><div class="v2-hours-h"><h3 class="v2-h3">${t(OC.copy.hoursH)}</h3>${nowLine()}</div>${week()}<p class="v2-dim">${t(C.late)}</p><p class="v2-dim">${t(C.hh)}</p></div>
    <div class="v2-contact">
      <dl class="v2-dl">
        <div><dt>${t(C.phone)}</dt><dd><a class="tnum" href="${OC.info.phoneHref}">${OC.info.phone}</a></dd></div>
        <div><dt>${t(C.email)}</dt><dd><a href="mailto:${OC.info.email}">${OC.info.email}</a></dd></div>
        <div><dt>Instagram</dt><dd>${ext(OC.info.igUrl, '', '@' + OC.info.ig)}</dd></div>
        <div><dt>Facebook</dt><dd>${ext(OC.info.fbUrl, '', 'OscarClub.sf')}</dd></div>
        <div><dt>${t(C.access)}</dt><dd>${t(C.accessV)}</dd></div>
      </dl>
      <div class="v2-visit-act">${ext(OC.info.dirUrl, 'v2-btn', I('nav', 18) + '<span>' + t(OC.copy.dirs) + '</span>' + out)}<span class="v2-dim tnum">${OC.info.plus}</span></div>
    </div>
  </div>
</section>`;

/* ---------- footer + thumb bar ---------- */
const footer = () => `<footer class="v2-ftr">
  <div class="v2-ftr-sign">${litMark()}<p>allow yourself to be yourself.</p></div>
  <div class="v2-ftr-row"><ul>
    <li>${t(OC.info.address)}</li><li><a href="${OC.info.phoneHref}" class="tnum">${OC.info.phone}</a></li>
    <li>${ext(OC.info.igUrl, '', 'Instagram')} · ${ext(OC.info.fbUrl, '', 'Facebook')}</li>
    <p class="v2-dim">© 1999–2026 ${t(OC.copy.rights)} · ${t(OC.copy.euro)}</p></div>
</footer>`;
const abar = page => `<nav class="v2-abar" aria-label="${bg() ? 'Бързи действия' : 'Quick actions'}">
  <a class="call" href="${OC.info.phoneHref}">${I('phone', 19)}${t(OC.copy.call)}</a>
  ${ext(OC.info.dirUrl, '', I('nav', 19) + t(OC.copy.dirs))}
  ${page === 'menu' ? `<a href="${href('home')}">${I('home', 19)}${t(C.home)}</a>` : `<a href="${href('menu')}">${I('martini', 19)}${t(OC.copy.menuH)}</a>`}
</nav>`;

/* base spirit first in every recipe, set brighter (used by the index) */
const ing = c => { const s = esc(t(c.ing)), i = s.indexOf(','); return i < 0 ? `<b>${s}</b>` : `<b>${s.slice(0, i)}</b>${s.slice(i)}`; };

/* ---------- menu page: the v1 menu (site.js), in Neon Deco, under the v2 header and over the v2 footer.
   The nested .site[data-style="neon"] gives it v1's tokens and container queries; v2.css matches its room to v2's black. */
const menuPage = () => `${header('menu')}<div class="site v2-v1menu" data-style="neon">${OC.menuMain()}</div>${nx0()}${footer()}${abar('menu')}`;

const wrap = inner => `<div class="v2" lang="${OC.lang}"><a class="vh" href="#main">${bg() ? 'Към съдържанието' : 'Skip to content'}</a>${inner}</div>`;
OC.v2 = {
  pages: {
    home: () => wrap(`${header('home')}<main id="main">${hero()}${statement()}${feature()}${index()}${music()}${events()}${visit()}</main>${footer()}${abar('home')}`),
    menu: () => wrap(menuPage())
  }
};

/* ---------- behaviour ---------- */
const pick = row => {
  const box = row.closest('.v2-idx'); if (!box || row.classList.contains('on')) return;
  box.querySelectorAll('.v2-row').forEach(x => x.classList.toggle('on', x === row));
  box.querySelectorAll('.v2-prev img').forEach(i => i.classList.toggle('on', i.dataset.v2Img === row.dataset.v2Pick));
  box.querySelector('.v2-prev').style.setProperty('--drink', row.style.getPropertyValue('--drink'));
};
OC.v2.mount = site => {
  if (!site._v2bound) {
    site._v2bound = true;
    site.addEventListener('pointerover', e => { const r = e.target.closest('.v2-row'); if (r) pick(r); });
    document.addEventListener('visibilitychange', () => site._v2featRun && site._v2featRun());
  }
  (site._v2obs || []).forEach(o => o.disconnect()); site._v2obs = [];
  clearTimeout(site._v2featT); site._v2featRun = null;
  const feat = site.querySelector('.v2-feat');
  if (feat) carousel(site, feat);
  const tocEl = site.querySelector('.v2-toc');
  if (tocEl && 'IntersectionObserver' in window) {
    const links = [...tocEl.querySelectorAll('[data-scroll]')], nav = tocEl.querySelector('nav');
    const spy = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.setAttribute('aria-current', String(a.dataset.scroll === en.target.id)));
      const a = links.find(x => x.dataset.scroll === en.target.id);
      if (a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    }), { rootMargin: '-30% 0px -60% 0px' });
    site._v2obs.push(spy);
    links.forEach(a => { const s = site.querySelector('#' + a.dataset.scroll); s && spy.observe(s); });
  }
};
})();
