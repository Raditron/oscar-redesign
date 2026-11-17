/* Oscar Club — site components as HTML builders. Foundations and both pages call the same functions,
   so a component looks the same in its spec as on the page. Depends on data.js. */
(() => {
const t = OC.t;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
OC.esc = esc;

/* ---------- icons (lucide, 1.75 stroke) ---------- */
const P = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  ig: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  martini: '<path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/>',
  star: '<polygon fill="currentColor" stroke="none" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  stage: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  access: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'
};
const I = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
OC.I = I;

/* ---------- numbers ---------- */
const num = v => Number(v).toLocaleString(OC.lang === 'bg' ? 'bg-BG' : 'en-GB');
const price = v => v == null ? '' : (OC.lang === 'bg' ? `${num(v)} €` : `€${num(v)}`);
OC.price = price;

/* ---------- the OC mark, redrawn from the logo so it can take any colour ---------- */
OC.mark = (label = true) => `<svg class="mark" viewBox="0 0 240 124" role="img" aria-label="Oscar Club"><g fill="none" stroke="currentColor" stroke-width="11"><circle cx="64" cy="62" r="52"/><path d="M215.5 95.4A52 52 0 1 1 215.5 28.6"/></g>${label ? '<text x="64" y="67" text-anchor="middle">oscar</text><text x="176" y="67" text-anchor="middle">club</text>' : ''}</svg>`;

/* ---------- opening hours, Sofia time ---------- */
const toMin = s => +s.slice(0, 2) * 60 + +s.slice(3);
OC.sofiaNow = () => {
  if (OC.demoNow) return OC.demoNow;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sofia', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
};
OC.hoursFor = d => OC.hours.find(h => h.d === d);
OC.status = (now = OC.sofiaNow()) => {
  const L = OC.lang === 'bg';
  const today = OC.hoursFor(now.d), yest = OC.hoursFor((now.d + 6) % 7), tom = OC.hoursFor((now.d + 1) % 7);
  let until = null;
  if (yest && toMin(yest.close) <= toMin(yest.open) && now.m < toMin(yest.close)) until = { at: yest.close, left: toMin(yest.close) - now.m };
  else if (today && now.m >= toMin(today.open)) {
    const c = toMin(today.close), end = c <= toMin(today.open) ? c + 1440 : c;
    if (now.m < end) until = { at: today.close, left: end - now.m };
  }
  if (until && until.left <= 45) return { state: 'soon', label: L ? 'Затваря скоро' : 'Closing soon', detail: L ? `в ${until.at}` : `at ${until.at}` };
  if (until) return { state: 'open', label: L ? 'Отворено' : 'Open now', detail: L ? `до ${until.at}` : `until ${until.at}` };
  const later = today && now.m < toMin(today.open);
  const at = later ? today.open : tom.open;
  return { state: 'closed', label: L ? 'Затворено' : 'Closed', detail: L ? `отваря ${later ? 'днес' : 'утре'} в ${at}` : `opens ${later ? 'today' : 'tomorrow'} at ${at}` };
};
OC.statusPill = () => { const s = OC.status(); return `<p class="status" data-state="${s.state}" data-new="Open-now status" role="status"><i aria-hidden="true"></i><b>${s.label}</b><span>· ${s.detail}</span></p>`; };

OC.hoursTable = () => {
  const now = OC.sofiaNow();
  /* before the night's close, "today" is still yesterday's night */
  const yest = OC.hoursFor((now.d + 6) % 7);
  const night = yest && toMin(yest.close) <= toMin(yest.open) && now.m < toMin(yest.close) ? (now.d + 6) % 7 : now.d;
  const order = [1, 2, 3, 4, 5, 6, 0];
  return `<table class="hours" data-new="Hours, today marked"><caption class="vh">${t(OC.copy.hoursH)}</caption><tbody>${order.map(d => { const h = OC.hoursFor(d); const late = toMin(h.close) <= toMin(h.open);
    return `<tr class="${d === night ? 'today' : ''}"><th scope="row">${OC.dayNames[OC.lang][d]}${d === night ? `<span>${t(OC.copy.today)}</span>` : ''}</th><td>${h.open} – <span class="${late ? 'late' : ''}">${h.close}</span></td></tr>`; }).join('')}</tbody></table>`;
};
OC.hoursShort = () => OC.lang === 'bg' ? 'Пн–Ср и Нд 18:00–23:30 · Чт до 02:00 · Пт–Сб до 03:00' : 'Mon–Wed & Sun 18:00–23:30 · Thu to 02:00 · Fri–Sat to 03:00';

/* ---------- links (the prototype maps page links to its own screens) ---------- */
OC.href = page => {
  const en = OC.lang === 'en' ? '/en' : '';
  if (OC.proto) return '#' + page;
  return page === 'menu' ? `${en}/mainmenu/index.html` : `${en}/index.html`;
};
OC.path = page => (OC.lang === 'en' ? '/en' : '') + (page === 'menu' ? '/mainmenu/index.html' : '/index.html');
const ext = (href, cls, inner, extra = '') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener"${extra}>${inner}</a>`;

/* ---------- header ---------- */
OC.langSwitch = () => `<div class="lang" role="group" aria-label="${OC.lang === 'bg' ? 'Език' : 'Language'}" data-new="BG / EN">${['bg', 'en'].map(l => `<button type="button" data-oc-lang="${l}" aria-pressed="${OC.lang === l}" lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>`;
OC.header = (page = 'home') => `<header class="hdr"><div class="inner">
  <a class="brand" href="${OC.href('home')}" aria-label="Oscar Club · ${OC.lang === 'bg' ? 'начало' : 'home'}">${OC.mark()}</a>
  <nav aria-label="${OC.lang === 'bg' ? 'Основна навигация' : 'Main'}">${OC.copy.nav.map(([k, l]) => {
    const href = k === 'menu' ? OC.href('menu') : (page === 'home' ? '#' + k : OC.href('home'));
    const cur = (k === 'menu' && page === 'menu') ? ' aria-current="page"' : '';
    return `<a href="${href}"${page === 'home' && k !== 'menu' ? ` data-scroll="${k}"` : ''}${cur}>${t(l)}</a>`; }).join('')}</nav>
  <div class="end">${OC.langSwitch()}<a class="btn btn-primary" href="${OC.info.phoneHref}">${I('phone', 18)}${t(OC.copy.call)}</a></div>
</div></header>`;

/* ---------- hero ---------- */
const DECO = `<svg class="hero-deco" viewBox="0 0 500 520" preserveAspectRatio="xMidYMax meet" aria-hidden="true" fill="none" stroke="currentColor">
  <g class="d-arch" stroke-width="1.2"><path d="M70 520V250a180 180 0 0 1 360 0v270"/><path d="M92 520V252a158 158 0 0 1 316 0v268" opacity=".55"/>${Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (i + 1) / 10; return `<line x1="${250 - Math.cos(a) * 60}" y1="${250 - Math.sin(a) * 60}" x2="${250 - Math.cos(a) * 150}" y2="${250 - Math.sin(a) * 150}" opacity=".35"/>`; }).join('')}</g>
  <g class="d-rings" stroke-width="3"><circle cx="160" cy="260" r="150"/><path d="M455 365A150 150 0 1 1 455 155"/></g>
  <g class="d-frame" stroke-width="2"><rect x="60" y="70" width="380" height="440" rx="34"/></g>
</svg>`;
OC.hero = () => {
  const pick = ['blue', 'machree', 'spraoi'].map(id => OC.cocktails.find(c => c.id === id));
  return `<section class="hero" aria-labelledby="hero-h"><div class="inner">
  <div class="hero-copy">
    <p class="kick">${t(OC.copy.heroKick)}</p>
    <h1 class="disp h-hero" id="hero-h">Allow yourself to be <em>yourself.</em></h1>
    <p class="lede">${t(OC.copy.heroLede)}</p>
    ${OC.statusPill()}
    <div class="btn-row"><a class="btn btn-primary" href="${OC.info.phoneHref}" data-new="Book: call">${I('phone', 18)}${t(OC.copy.callBook)}</a>${ext(OC.info.igDm, 'btn btn-secondary', I('ig', 18) + t(OC.copy.dm), ' data-new="Book: Instagram DM"')}</div>
    <p class="hero-note">${t(OC.copy.bookNote)} · <a class="tlink tnum" href="${OC.info.phoneHref}">${OC.info.phone}</a></p>
  </div>
  <div class="hero-art" aria-hidden="true">${DECO}${pick.map((c, i) => `<div class="glass g${i + 1}" style="--drink:var(--d-${c.drink})"><img src="img/cocktails/${c.img}.webp" alt="" width="560" height="580"></div>`).join('')}</div>
</div></section>`;
};

/* ---------- proof strip ---------- */
OC.proof = () => `<section class="proof" aria-label="${OC.lang === 'bg' ? 'Отзиви и награди' : 'Ratings and awards'}" data-new="Ratings + award with a caption"><div class="inner"><ul>
  ${OC.info.ratings.map(r => `<li><p class="big tnum">${num(r.score)}${I('star', 22)}</p><small><b>${r.src}</b> · ${num(r.count)} ${t(OC.copy.reviews)}</small></li>`).join('')}
  <li><div class="award"><img src="img/award-2024.webp" alt="" width="44" height="44"><div><p class="big">${t(OC.info.award)}</p><small>${t(OC.info.award.by)}</small></div></div></li>
  <li><p class="big tnum">${OC.info.years} ${t(OC.copy.years)}</p><small>${t(OC.copy.sinceLabel)}</small></li>
</ul></div></section>`;


/* ---------- section heading ---------- */
/* two-beat headline: the second sentence is set quieter, like a pause in speech */
OC.beats = h => { const m = String(h).match(/^(.+?[.?!])s+(.+)$/); return m ? `${m[1]} <span class="beat">${m[2]}</span>` : h; };
OC.secHead = (kick, h, opt = {}) => `<div class="sec-h${opt.link ? ' split' : ''}"><p class="kick">${kick}</p><h2 class="disp h2"${opt.id ? ` id="${opt.id}"` : ''}>${OC.beats(h)}</h2>${opt.lede ? `<p class="lede">${opt.lede}</p>` : ''}${opt.link || ''}</div>`;

/* ---------- story ---------- */
OC.story = () => `<section class="sec band" aria-labelledby="story-h"><div class="inner story rv">
  <div>${OC.secHead(t(OC.copy.storyKick), t(OC.copy.storyH), { id: 'story-h' })}<div class="prose">${OC.copy.story[OC.lang].map(p => `<p>${p}</p>`).join('')}<p class="slogan">${OC.info.slogan}</p></div></div>
  <figure><img src="img/storefront.webp" alt="${OC.lang === 'bg' ? 'Входът на Оскар клуб на ул. „Славянска“ 15 вечер, със светещия знак OC' : 'The Oscar Club entrance on Slavyanska St at night, under the lit OC sign'}" width="480" height="640" loading="lazy"><figcaption>${t(OC.info.address)}</figcaption></figure>
</div></section>`;

/* ---------- cocktail card ---------- */
OC.card = (c, opt = {}) => `<article class="cc${opt.rv === false ? '' : ' rv'}" style="--drink:var(--d-${c.drink})" data-base="${c.base}">
  <div class="cc-well"><img src="img/cocktails/${c.img}.webp" alt="${esc(c.name)}: ${esc(t(c.ing))}" width="560" height="580" loading="lazy"></div>
  <div class="cc-body"><h3 class="cc-name">${esc(c.name)}</h3><p class="cc-ing">${esc(t(c.ing))}</p><p class="cc-meta"><span class="tnum">${c.ml} ml</span><b class="price tnum">${price(c.price)}</b></p></div>
</article>`;
OC.sigTeaser = () => `<section class="sec" id="cocktails" aria-labelledby="sig-h"><div class="inner">
  ${OC.secHead(t(OC.copy.sigKick), t(OC.copy.sigH), { id: 'sig-h', link: `<a class="arrow-link" href="${OC.href('menu')}">${t(OC.copy.fullMenu)}${I('arrow', 18)}</a>` })}
  <div class="cc-rail" data-new="Names as real text, not baked into photos">${['machree', 'blue', 'tarator', 'kissme', 'eden', 'spraoi'].map(id => OC.card(OC.cocktails.find(c => c.id === id), { rv: false })).join('')}</div>
</div></section>`;

/* ---------- music nights (Instagram), with the entry fee said plainly ---------- */
OC.music = () => `<section class="sec" id="music" aria-labelledby="mu-h"><div class="inner ev rv">
  <div>${OC.secHead(t(OC.copy.musicKick), t(OC.copy.musicH), { id: 'mu-h', lede: t(OC.copy.musicCatch) })}
    <div class="btn-row">${ext(OC.info.igUrl, 'btn btn-secondary', I('ig', 18) + t(OC.copy.musicCta))}</div></div>
  <div><h3 class="kick" style="margin-bottom:var(--s-3)">${t(OC.copy.musicRecent)}</h3><div class="mlist" data-new="Entry fee shown before you go">${OC.copy.nights.map(n => `<div class="mrow"><span class="nm">${n.date} · ${esc(t(n.name))}</span><span class="pr tnum">${price(n.fee)}</span></div>`).join('')}</div></div>
</div></section>`;

/* ---------- events ---------- */
OC.events = () => `<section class="sec band" id="events" aria-labelledby="ev-h"><div class="inner ev rv">
  <div>${OC.secHead(t(OC.copy.evKick), t(OC.copy.evH), { id: 'ev-h', lede: t(OC.copy.evLede) })}
    <div class="btn-row"><a class="btn btn-primary" href="mailto:${OC.info.eventsEmail}">${I('mail', 18)}${t(OC.copy.evCta)}</a></div></div>
  <div style="display:grid;gap:var(--s-5)"><ul class="ev-types">${OC.copy.evTypes.map(([i, l]) => `<li>${I(i, 28)}${t(l)}</li>`).join('')}</ul>
    <div class="crows" data-new="Events contacts as text (were inside a flyer image)">${OC.contactRow('mail', OC.lang === 'bg' ? 'Имейл за събития' : 'Events email', OC.info.eventsEmail, 'mailto:' + OC.info.eventsEmail)}${OC.contactRow('phone', OC.lang === 'bg' ? 'Телефон за събития' : 'Events phone', OC.info.eventsPhone, OC.info.eventsPhoneHref)}</div></div>
</div></section>`;

/* ---------- contact row ---------- */
OC.contactRow = (icon, label, value, href) => `<div class="crow"><span class="med">${I(icon, 18)}</span><span><small>${label}</small><b class="tnum">${href ? `<a class="tlink" style="text-decoration:none" href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(value)}</a>` : esc(value)}</b></span><button type="button" class="btn btn-icon" data-oc-copy="${esc(value)}" aria-label="${t(OC.copy.copy)}: ${esc(value)}">${I('copy', 17)}</button></div>`;

/* ---------- visit ---------- */
OC.visit = () => `<section class="sec" id="visit" aria-labelledby="visit-h"><div class="inner">
  ${OC.secHead(t(OC.copy.visitKick), t(OC.copy.visitH), { id: 'visit-h' })}
  <div class="visit rv">
    <div class="panel"><div><p class="addr">${t(OC.info.address)}</p><p class="muted" style="margin-top:var(--s-1)">${t(OC.info.area)} · ${OC.info.plus}</p></div>
      <div class="btn-row">${ext(OC.info.dirUrl, 'btn btn-primary', I('nav', 18) + t(OC.copy.dirs), ' data-new="Directions (replaces the map iframe)"')}<a class="btn btn-secondary" href="${OC.info.phoneHref}">${I('phone', 18)}${t(OC.copy.call)}</a></div>
      <div class="crows">${OC.contactRow('phone', OC.lang === 'bg' ? 'Телефон' : 'Phone', OC.info.phone, OC.info.phoneHref)}${OC.contactRow('mail', OC.lang === 'bg' ? 'Имейл' : 'Email', OC.info.email, 'mailto:' + OC.info.email)}${OC.contactRow('ig', 'Instagram', '@' + OC.info.ig, OC.info.igUrl)}</div>
      <p class="muted" style="display:flex;gap:var(--s-2);align-items:center;font-size:var(--fs-sm)">${I('access', 18)}${t(OC.copy.access)}</p></div>
    <div class="panel"><div class="panel-h"><h3 class="disp h3">${t(OC.copy.hoursH)}</h3>${OC.statusPill()}</div>${OC.hoursTable()}</div>
  </div>
</div></section>`;

/* ---------- footer + action bar ---------- */
OC.footer = () => `<footer class="ftr"><div class="inner">
  <div class="cols"><div style="display:grid;gap:var(--s-4);justify-items:start">${OC.mark()}<p>${OC.info.slogan}</p><div class="social">${ext(OC.info.igUrl, 'btn btn-icon', I('ig', 18), ' aria-label="Instagram"')}${ext(OC.info.fbUrl, 'btn btn-icon', I('fb', 18), ' aria-label="Facebook"')}</div></div>
    <div><h4>${t(OC.copy.visitKick)}</h4><ul><li>${t(OC.info.address)}</li><li><a class="tlink" href="${OC.info.phoneHref}">${OC.info.phone}</a></li><li><a class="tlink" href="mailto:${OC.info.email}">${OC.info.email}</a></li></ul></div>
    <div><h4>${t(OC.copy.hoursH)}</h4><ul>${OC.hoursShort().split(' · ').map(x => `<li class="tnum">${x}</li>`).join('')}</ul></div></div>
  <div class="fine"><span>© 1999–2026 ${t(OC.copy.rights)}</span><span>${t(OC.copy.euro)}</span></div>
</div></footer>`;
OC.actionBar = (page = 'home') => `<nav class="abar" aria-label="${OC.lang === 'bg' ? 'Бързи действия' : 'Quick actions'}" data-new="Thumb-zone action bar">
  <a class="main" href="${OC.info.phoneHref}">${I('phone', 22)}${t(OC.copy.call)}</a>
  ${ext(OC.info.dirUrl, '', I('nav', 22) + t(OC.copy.dirs))}
  <a href="${page === 'menu' ? '#top' : OC.href('menu')}"${page === 'menu' ? ' data-scroll="top"' : ''}>${I('martini', 22)}${t(OC.copy.menuH)}</a>
  ${ext(OC.info.igDm, '', I('ig', 22) + t(OC.copy.dmShort))}
</nav>`;

/* ---------- flavour meter (data shape from the Desert Paloma card) ---------- */
OC.flavor = vals => `<dl class="flavor">${vals.map(([l, v]) => `<div><dt>${l}</dt><dd aria-label="${v} / 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('')}</dd></div>`).join('')}</dl>`;

/* ---------- menu page parts ---------- */
OC.baseFilter = sel => {
  const counts = OC.cocktails.reduce((a, c) => (a[c.base] = (a[c.base] || 0) + 1, a), {});
  return `<div class="chips" role="group" aria-label="${t(OC.copy.byBase)}" data-oc-filter data-new="Filter by base spirit">${[['all', OC.copy.allBases, OC.cocktails.length], ...Object.keys(OC.bases).map(k => [k, OC.bases[k], counts[k]])].map(([k, l, n]) => `<button type="button" class="chip" data-base="${k}" aria-pressed="${sel === k}">${t(l)} <small>${n}</small></button>`).join('')}</div>`;
};
OC.catnav = () => `<div class="catnav" data-new="Category bar: jump, don't hunt"><div class="inner"><nav class="chips" aria-label="${OC.lang === 'bg' ? 'Категории' : 'Categories'}">${[['cocktails', OC.copy.sigKick], ['shots', OC.copy.shotsNav], ...OC.menu.map(m => [m.id, m.t])].map(([k, l], i) => `<a class="chip" href="#${k}" data-scroll="${k}"${i === 0 ? ' aria-current="true"' : ''}>${t(l)}</a>`).join('')}</nav></div></div>`;
OC.shotsBlock = () => `<section class="sec band" id="shots" aria-labelledby="shots-h"><div class="inner">
  ${OC.secHead('25 ml', t(OC.copy.shotsH), { id: 'shots-h', lede: t(OC.copy.shotsNote) })}
  <div class="mlist cols" data-new="One price, said once">${OC.shots.map(([n, ing]) => `<div class="mrow"><span class="nm">${esc(n)}</span><span class="pr tnum">${price(3)}</span><span class="sub">${esc(ing)}</span></div>`).join('')}</div>
  <h3 class="disp h3" style="margin:var(--s-7) 0 var(--s-3)">${t(OC.copy.setsH)}</h3>
  <div class="mlist">${OC.shotSets.map(s => `<div class="mrow"><span class="nm">${s.name} · ${s.n} ${t(OC.copy.shotsCount)}</span><span class="pr tnum">${price(s.price)}</span><span class="sub">${esc(t(s.ing))}</span></div>`).join('')}</div>
</div></section>`;
OC.category = (m, open) => `<details class="mcat" id="${m.id}"${open ? ' open' : ''}><summary><span class="t">${t(m.t)}</span><span class="meta tnum">${m.vol ? m.vol + ' · ' : ''}${m.items.length}</span><span class="chev">${I('chevDown', 18)}</span></summary>
  ${m.note ? `<p class="note">${t(m.note)}</p>` : ''}<div class="mlist">${m.items.map(([n, p, sub]) => `<div class="mrow"><span class="nm">${esc(n)}</span><span class="pr tnum${p == null ? ' tbd' : ''}">${p == null ? '—' : price(p)}</span>${sub ? `<span class="sub">${esc(t(sub))}</span>` : ''}</div>`).join('')}</div></details>`;

/* ---------- pages ---------- */
OC.pages = {
  home: () => `<a class="vh" href="#main">${OC.lang === 'bg' ? 'Към съдържанието' : 'Skip to content'}</a>${OC.header('home')}<main id="main">${OC.hero()}${OC.proof()}${OC.sigTeaser()}${OC.story()}${OC.music()}${OC.events()}${OC.visit()}</main>${OC.footer()}${OC.actionBar('home')}`,
  menu: (base = 'all') => `${OC.header('menu')}${OC.menuMain(base)}${OC.footer()}${OC.actionBar('menu')}`
};
/* the menu page's body on its own, so Version 2 can set it inside its own header and footer */
OC.menuMain = (base = 'all') => `<main id="main">
    <section class="sec" id="top" style="padding-bottom:var(--s-6)"><div class="inner" style="display:grid;gap:var(--s-4);justify-items:start">
      <p class="kick">${t(OC.copy.euro)}</p><h1 class="disp h1">${t(OC.copy.menuH)}</h1>${OC.statusPill()}</div></section>
    ${OC.catnav()}
    <section class="sec" id="cocktails" aria-labelledby="sig-h2" style="padding-top:var(--s-7)"><div class="inner">
      ${OC.secHead(t(OC.copy.sigKick), t(OC.copy.menuSigH), { id: 'sig-h2' })}
      <div style="margin:calc(var(--s-7) * -1 + var(--s-5)) 0 var(--s-6)">${OC.baseFilter(base)}</div>
      <div class="cc-grid four" data-oc-grid>${OC.cocktails.map(c => OC.card(c)).join('')}</div>
    </div></section>
    ${OC.shotsBlock()}
    <section class="sec" aria-labelledby="sp-h"><div class="inner">${OC.secHead(t(OC.copy.spKick), t(OC.copy.spH), { id: 'sp-h' })}
      <div data-new="Native accordions: volume + count in the row">${OC.menu.map((m, i) => OC.category(m, i < 1)).join('')}</div></div></section>
  </main>`;

/* ---------- behaviour (works the same on the live pages) ---------- */
OC.mount = (root, opt = {}) => {
  const rerender = opt.rerender || (() => {});
  root.addEventListener('click', e => {
    const lb = e.target.closest('[data-oc-lang]');
    if (lb) { if (OC.lang !== lb.dataset.ocLang) { OC.lang = lb.dataset.ocLang; rerender({ lang: true }); } return; }
    const cp = e.target.closest('[data-oc-copy]');
    if (cp) { const v = cp.dataset.ocCopy; const done = () => { cp.innerHTML = I('check', 17); cp.setAttribute('aria-label', t(OC.copy.copied)); (opt.toast || (() => {}))(`${t(OC.copy.copied)}: ${v}`); setTimeout(() => { cp.innerHTML = I('copy', 17); }, 1600); };
      try { navigator.clipboard.writeText(v).then(done, done); } catch (_) { done(); } return; }
    const fb = e.target.closest('[data-oc-filter] [data-base]');
    if (fb) { const k = fb.dataset.base; root.querySelectorAll('[data-oc-filter] [data-base]').forEach(b => b.setAttribute('aria-pressed', String(b === fb)));
      root.querySelectorAll('[data-oc-grid] .cc').forEach(c => { c.hidden = !(k === 'all' || c.dataset.base === k); }); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { const el = root.querySelector('#' + sc.dataset.scroll); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); if (el.tagName === 'DETAILS') el.open = true; } }
  });
  OC.observe(root);
};
/* observers re-attach after every render */
OC.observe = root => {
  (root._oc || []).forEach(o => o.disconnect()); root._oc = [];
  /* scroll reveal that fails open: only things below the fold wait, everything else is already visible */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.remove('wait'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' }); root._oc.push(io);
    root.querySelectorAll('.rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('wait'); io.observe(el); } });
  }
  /* category bar follows the scroll */
  const cat = root.querySelector('.catnav');
  if (cat && 'IntersectionObserver' in window) {
    const links = [...cat.querySelectorAll('[data-scroll]')];
    const spy = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.setAttribute('aria-current', String(a.dataset.scroll === en.target.id))); const a = links.find(x => x.dataset.scroll === en.target.id), bar = cat.querySelector('.chips'); if (a && bar) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); } }), { rootMargin: '-35% 0px -60% 0px' }); root._oc.push(spy);
    links.forEach(a => { const s = root.querySelector('#' + a.dataset.scroll); s && spy.observe(s); });
  }
};
})();
