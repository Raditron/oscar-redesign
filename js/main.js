/* Oscar Club — the one behaviour script. Progressive enhancement only: every page is complete without it.
   Loaded with `defer` on all four pages, so the DOM is ready when it runs. No framework, no third-party code.

   Shared helpers on window.OC (use them from your region instead of re-implementing):
     OC.lang                  'bg' | 'en', from <html lang>
     OC.t({ bg, en })         the string for the current language (anything else is returned as is)
     OC.reducedMotion()       true when the visitor prefers reduced motion
     OC.toMin('18:00')        minutes since midnight → 1080
     OC.hours                 the week, Sofia time: [{ d, open, close }], d 0 = Sunday … 6 = Saturday.
                              close <= open means the night runs past midnight (Thu 02:00, Fri/Sat 03:00)
     OC.hoursFor(d)           that weekday's row of OC.hours
     OC.dayNames[lang][d]     weekday names, d 0 = Sunday
     OC.sofiaNow()            { d, m }: weekday (0 = Sunday) and minutes since midnight in Europe/Sofia,
                              whatever the visitor's own timezone. Honours the clock override below
     OC.nightOf(now?)         the weekday whose night it is. After midnight, until the previous night's late close,
                              that is still the previous day (Fri 01:30 → Thursday). Use it to mark "today" in the week
     OC.status(now?)          { state: 'open' | 'soon' | 'closed', label, detail } for the current language.
                              'soon' = closes within 45 minutes. Logic lifted unchanged from the prototype (site.js)
     OC.renderStatus(el)      fill one status element (see "status" below); OC.renderAllStatus() fills them all

   Clock override (tests and demos): the time is read as Sofia local time and frozen.
     ?now=2026-11-20T01:30        in the page URL
     window.OC_NOW = '2026-11-20T01:30'   in an inline script that runs before this file
   OC.clock tells which one is in use: 'live' | 'override'.

   Status elements: any element with [data-oc-status]. In the HTML it holds the no-JS fallback (the week's hours) and
   role="status". On load and then every minute this script replaces its content with the open-now line:
     data-oc-status=""      v2 line:  <i class="v2-dot"></i><b>Open now</b> <span class="det">until 03:00</span>
     data-oc-status="pill"  v1 pill (menu head): <i></i><b>Open now</b> <span>· until 03:00</span>
   and sets data-state="open|soon|closed" on the element (CSS colours the dot from it). The space between <b> and
   <span> is for screen readers (it collapses inside the inline-flex line). Content only changes when the status
   text changes, so screen readers hear it once, not every minute.
   Example (no-JS fallback inside, as in the header):
     <p class="v2-now" role="status" data-oc-status><span class="v2-now-week"><span>Пн–Ср и Нд 18:00–23:30</span> ·
       <span>Чт до 02:00</span> · <span>Пт–Сб до 03:00</span></span></p>

   Per-ticket code goes in the regions at the end of this file. Keep each region's code inside its own block { … }
   so names never collide, and edit only inside your own markers. */
(() => {
'use strict';

const OC = window.OC = window.OC || {};

/* ---------- language ---------- */
OC.lang = (document.documentElement.lang || 'bg').slice(0, 2) === 'en' ? 'en' : 'bg';
OC.t = o => (o && typeof o === 'object' && 'bg' in o) ? o[OC.lang] : o;
OC.reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- opening hours, Sofia time (data.js) ---------- */
OC.hours = [
  { d: 1, open: '18:00', close: '23:30' }, { d: 2, open: '18:00', close: '23:30' }, { d: 3, open: '18:00', close: '23:30' },
  { d: 4, open: '18:00', close: '02:00' }, { d: 5, open: '18:00', close: '03:00' }, { d: 6, open: '18:00', close: '03:00' },
  { d: 0, open: '18:00', close: '23:30' }
];
OC.dayNames = {
  bg: ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
const toMin = OC.toMin = s => +s.slice(0, 2) * 60 + +s.slice(3);
OC.hoursFor = d => OC.hours.find(h => h.d === d);

/* ---------- the clock: live Sofia time, or a frozen override ---------- */
const parseNow = s => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return { d: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(), m: h * 60 + mi };
};
const override = parseNow(new URLSearchParams(location.search).get('now')) || parseNow(window.OC_NOW);
OC.clock = override ? 'override' : 'live';
OC.sofiaNow = () => {
  if (override) return { ...override };
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sofia', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
};

/* before the previous night's close, "today" is still that night (site.js hoursTable / site-v2.js week) */
OC.nightOf = (now = OC.sofiaNow()) => {
  const yest = OC.hoursFor((now.d + 6) % 7);
  return yest && toMin(yest.close) <= toMin(yest.open) && now.m < toMin(yest.close) ? (now.d + 6) % 7 : now.d;
};

/* ---------- open-now status: lifted unchanged from the prototype (design-system/site.js, OC.status) ---------- */
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

/* ---------- status elements ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
OC.renderStatus = (el, s = OC.status()) => {
  const html = el.dataset.ocStatus === 'pill'
    ? `<i aria-hidden="true"></i><b>${esc(s.label)}</b> <span>· ${esc(s.detail)}</span>`
    : `<i class="v2-dot" aria-hidden="true"></i><b>${esc(s.label)}</b> <span class="det">${esc(s.detail)}</span>`;
  if (el.dataset.state === s.state && el.innerHTML === html) return;
  el.dataset.state = s.state;
  el.innerHTML = html;
};
OC.renderAllStatus = () => {
  const s = OC.status();
  document.querySelectorAll('[data-oc-status]').forEach(el => OC.renderStatus(el, s));
};
OC.renderAllStatus();
if (!override) setInterval(OC.renderAllStatus, 60 * 1000);


/* =====================================================================================================================
   Per-ticket regions. Each ticket edits only between its own markers, inside its own block.
   ===================================================================================================================== */

// [#12 chrome] menu page only: anything the pinned header needs (e.g. measuring it for the category bar)
{
  // The CSS assumes the v2 header is 64px (--hdr-h) and the category bar 69px (--cat-h). Measure both and keep them
  // current, so the bar sticks exactly under the header and anchors clear both, whatever the width or font metrics.
  const hdr = document.querySelector('.v2-hdr.is-pinned');
  const room = hdr && hdr.closest('.v2');
  if (room) {
    const cat = document.querySelector('.catnav');
    const measure = () => {
      room.style.setProperty('--hdr-h', hdr.getBoundingClientRect().height + 'px');
      if (cat) room.style.setProperty('--cat-h', cat.getBoundingClientRect().height + 'px');
    };
    measure();
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(measure); ro.observe(hdr); if (cat) ro.observe(cat); }
    else addEventListener('resize', measure);
  }
}
// [/#12 chrome]

// [#9 hero] hero flicker-on (only under prefers-reduced-motion: no-preference)
{
  /* Nothing to do here: the flicker-on is pure CSS ([#9 hero] in css/styles.css, inside
     @media (prefers-reduced-motion:no-preference)), so it plays once as the page loads, with no flash of the lit sign
     before a script could start it, and never under reduced motion. The hero's open-now line is a [data-oc-status]
     element, filled by the shared status code above. */
}
// [/#9 hero]

// [#10 story]
{
}
// [/#10 story]

// [#10 carousel] featured-cocktail carousel (site-v2.js: feature / carousel)
{
  /* All 13 drinks are in the HTML; the first carries class "on" and is the one shown without JS (the controls stay
     hidden then). Each glass holds for its data-dwell (prototype: 2.5s + 0.3s a word to read, never under 6s).
     It holds still under the mouse, while anything inside has focus, off screen, in a hidden tab and under reduced
     motion. Using ← → (buttons or arrow keys) stops it for good; Pause / Play brings it back (WCAG 2.2.2). */
  const feat = document.querySelector('.v2-feat');
  if (feat) {
    const imgs = [...feat.querySelectorAll('.v2-feat-img')], slides = [...feat.querySelectorAll('.v2-feat-slide')], n = slides.length;
    const stack = feat.querySelector('.v2-feat-stack'), count = feat.querySelector('[data-v2-count]');
    const bar = feat.querySelector('.v2-car-bar i'), toggle = feat.querySelector('[data-v2-car="toggle"]');
    const pad = k => String(k).padStart(2, '0');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const st = { i: 0, playing: !reduce.matches, hold: false, seen: !('IntersectionObserver' in window) };
    let timer = 0;
    const show = k => {
      st.i = (k + n) % n;
      imgs.forEach((el, j) => el.classList.toggle('on', j === st.i));
      slides.forEach((el, j) => { el.classList.toggle('on', j === st.i); if (j === st.i) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true'); });
      count.textContent = pad(st.i + 1);
    };
    const run = () => {
      clearTimeout(timer);
      const live = st.playing && !st.hold && st.seen && !document.hidden;
      feat.dataset.playing = String(live);
      bar.style.animation = 'none';
      if (!live) return;
      const ms = +imgs[st.i].dataset.dwell || 6000;
      void bar.offsetWidth; bar.style.animation = `v2-fill ${ms}ms linear`;
      timer = setTimeout(() => { show(st.i + 1); run(); }, ms);
    };
    const setPlaying = on => {
      st.playing = on;
      toggle.textContent = on ? toggle.dataset.pause : toggle.dataset.play;
      stack.setAttribute('aria-live', on ? 'off' : 'polite');   /* announce only what the visitor asked for */
      run();
    };
    const step = d => { setPlaying(false); show(st.i + d); };

    feat.querySelector('.v2-car').hidden = false;
    feat.addEventListener('click', e => {
      const b = e.target.closest('[data-v2-car]'); if (!b) return;
      if (b.dataset.v2Car === 'toggle') setPlaying(!st.playing); else step(b.dataset.v2Car === 'next' ? 1 : -1);
    });
    feat.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); } });
    feat.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { st.hold = true; run(); } });
    feat.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { st.hold = false; run(); } });
    feat.addEventListener('focusin', () => { st.hold = true; run(); });
    feat.addEventListener('focusout', e => { if (!feat.contains(e.relatedTarget)) { st.hold = false; run(); } });
    /* on a touch screen the glass is a swipe target */
    let x0 = null;
    const imgsBox = feat.querySelector('.v2-feat-imgs');
    imgsBox.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    imgsBox.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); });
    imgsBox.addEventListener('pointercancel', () => { x0 = null; });
    document.addEventListener('visibilitychange', run);
    reduce.addEventListener('change', e => { if (e.matches) setPlaying(false); });
    if (!st.seen) new IntersectionObserver(([en]) => { st.seen = en.isIntersecting; run(); }, { threshold: .35 }).observe(feat);
    setPlaying(st.playing);
  }
}
// [/#10 carousel]

// [#10 index] cocktail index: point or focus a row → preview + lit name (site-v2.js: index / pick)
{
  /* Pointing at or focusing a row makes it the current one: from 860px its name lights in the drink's colour (CSS,
     the name only) and the sticky glass beside the list swaps to that drink. Rows take focus only once this runs. */
  const box = document.querySelector('.v2-idx');
  if (box) {
    const rows = [...box.querySelectorAll('.v2-row')], prev = box.querySelector('.v2-prev');
    const pick = row => {
      if (row.classList.contains('on')) return;
      rows.forEach(r => r.classList.toggle('on', r === row));
      prev.querySelectorAll('img').forEach(img => img.classList.toggle('on', img.dataset.v2Img === row.dataset.v2Pick));
      prev.style.setProperty('--drink', row.style.getPropertyValue('--drink'));
    };
    rows.forEach(r => { r.tabIndex = 0; });
    box.addEventListener('pointerover', e => { const r = e.target.closest('.v2-row'); if (r) pick(r); });
    box.addEventListener('focusin', e => { const r = e.target.closest('.v2-row'); if (r) pick(r); });
  }
}
// [/#10 index]

// [#11 music]
{
}
// [/#11 music]

// [#11 events] copy-to-clipboard on the events contacts
{
  /* The copy buttons ship hidden: without script (or without any way to copy) the contacts are plain tel:/mailto:
     links. The result is said once in the role="status" line under the contacts, and shown there for a few seconds. */
  const status = document.querySelector('[data-copy-status]');
  const buttons = document.querySelectorAll('button[data-copy]');
  const asyncCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
  const legacyCopy = v => {
    const ta = document.createElement('textarea');
    ta.value = v; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  };
  const canLegacy = (() => { try { return document.queryCommandSupported('copy'); } catch (_) { return false; } })();
  if (status && buttons.length && (asyncCopy || canLegacy)) {
    let clear;
    const say = msg => {
      clearTimeout(clear);
      status.textContent = '';   /* empty first, so the same message twice is announced twice */
      setTimeout(() => { status.textContent = msg; clear = setTimeout(() => { status.textContent = ''; }, 6000); }, 50);
    };
    const copy = v => (asyncCopy ? navigator.clipboard.writeText(v) : Promise.reject(new Error('no async clipboard')))
      .catch(() => { if (!legacyCopy(v)) throw new Error('copy failed'); });
    buttons.forEach(b => {
      b.hidden = false;
      b.addEventListener('click', () => {
        const v = b.dataset.copy;
        copy(v).then(
          () => say(OC.t({ bg: `Копирано: ${v}`, en: `Copied: ${v}` })),
          () => say(OC.t({ bg: 'Не се копира. Маркирай текста и го копирай ръчно.', en: 'Couldn’t copy. Select the text and copy it yourself.' }))
        ).then(() => { if (document.activeElement !== b) b.focus(); });
      });
    });
  }
}
// [/#11 events]

// [#11 hours] mark tonight's row in the week (OC.nightOf) and the now-line
{
  /* Without script no row is marked and the whole week stands as it is. With it, the night it is now (after midnight on
     a late night that is still the previous day) gets the brass bar and aria-current="date", and while the bar is open
     an ivory line shows where in the night we are. The open-now line beside the heading is [data-oc-status] (skeleton). */
  const rows = document.querySelectorAll('#visit tr[data-day]');
  if (rows.length) {
    const nowTitle = OC.t({ bg: 'сега', en: 'now' });
    const mark = () => {
      const now = OC.sofiaNow(), night = OC.nightOf(now), open = OC.status(now).state !== 'closed';
      rows.forEach(tr => {
        const on = +tr.dataset.day === night;
        tr.classList.toggle('today', on);
        if (on) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
        const bar = tr.querySelector('.v2-bar');
        let line = bar && bar.querySelector('.v2-nowline');
        if (bar && on && open) {
          const m = night === now.d ? now.m : now.m + 1440;   /* 18:00 → 03:00 is the bar's full width */
          if (!line) {
            line = document.createElement('em');
            line.className = 'v2-nowline'; line.title = nowTitle; line.setAttribute('aria-hidden', 'true');
            bar.appendChild(line);
          }
          line.style.setProperty('--x', `${Math.max(0, Math.min(100, (m - 1080) / 540 * 100))}%`);
        } else if (line) line.remove();
      });
    };
    mark();
    if (OC.clock === 'live') setInterval(mark, 60 * 1000);
  }
}
// [/#11 hours]

// [#11 visit]
{
}
// [/#11 visit]

// [#12 menu-head]
{
}
// [/#12 menu-head]

// [#12 catbar] the category bar follows the scroll
{
  const bar = document.querySelector('.catnav');
  const row = bar && bar.querySelector('nav');
  if (row) {
    const links = [...row.querySelectorAll('a[href^="#"]')];
    const id = a => decodeURIComponent(a.hash.slice(1));
    // a category that is an accordion (<details>, #13) opens when you jump to it
    const openTarget = name => { const el = name && document.getElementById(name); if (el && el.tagName === 'DETAILS') el.open = true; };
    row.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a) openTarget(id(a)); });
    addEventListener('hashchange', () => openTarget(decodeURIComponent(location.hash.slice(1))));
    openTarget(decodeURIComponent(location.hash.slice(1)));

    // scroll-spy: the current category is the last one whose top has passed just under the bar
    let current = null, queued = false;
    const mark = a => {
      if (a === current) return;
      current = a;
      links.forEach(x => { if (x === a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      // on a phone the row scrolls sideways: bring the marked chip to the middle
      if (a && row.scrollWidth > row.clientWidth) {
        const r = row.getBoundingClientRect(), c = a.getBoundingClientRect();
        row.scrollTo({ left: row.scrollLeft + c.left - r.left - (r.width - c.width) / 2, behavior: OC.reducedMotion() ? 'auto' : 'smooth' });
      }
    };
    const spy = () => {
      queued = false;
      const line = bar.getBoundingClientRect().bottom + 32;
      let on = null;
      for (const a of links) {
        const el = document.getElementById(id(a));
        if (el && el.getBoundingClientRect().top <= line) on = a;
      }
      mark(on || links[0]);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(spy); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    document.addEventListener('toggle', queue, true);   // an accordion opening moves everything below it
    spy();
  }
}
// [/#12 catbar]

// [#12 cocktails] base-spirit filter
{
  // The filter is hidden in the HTML (it can't work without script) and every card shows; here it appears and works.
  const box = document.querySelector('[data-oc-filter]');
  const grid = document.querySelector('[data-oc-grid]');
  if (box && grid) {
    const wrap = box.closest('[hidden]');
    if (wrap) wrap.hidden = false;
    const buttons = [...box.querySelectorAll('button[data-base]')];
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-base]');
      if (!b) return;
      const k = b.dataset.base;
      buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      grid.querySelectorAll('[data-base]').forEach(card => { card.hidden = !(k === 'all' || card.dataset.base === k); });
    });
  }
}
// [/#12 cocktails]

// [#13 shots]
{
}
// [/#13 shots]

// [#13 accordions]
{
}
// [/#13 accordions]

// [#13 nx0]
{
}
// [/#13 nx0]

})();
