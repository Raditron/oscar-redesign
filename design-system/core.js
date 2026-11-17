/* Oscar Club redesign prototype — shared core (same structure as the NX0 partner prototype).
   Router on plain #names, style chips, width switch, annotations, rationale builders, toast.
   Screens register with PX.route(). The site itself lives in site.js + data.js and does not depend on this file. */
const PX = window.PX = { routes: [], style: 'marquee', vp: 'desktop', annot: false };
OC.proto = true;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
PX.$ = $; PX.$$ = $$;
const CI = { left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>', tablet: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/>', desktop: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>', lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' };
const CIc = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CI[n]}</svg>`;

PX.STYLES = {
  marquee: { label: 'A · Marquee', sub: 'Cormorant + Manrope' },
  neon: { label: 'B · Neon Deco', sub: 'Poiret One + Onest' },
  continuity: { label: 'C · Continuity', sub: 'Philosopher + Ubuntu Sans' }
};
PX.PLAN = [
  ['0', 'Research', [['research', 'Brand, Instagram, references']]],
  ['1', 'Foundations', [['foundations', 'Tokens + components']]],
  ['2', 'Pages', [['home', 'Home · /index.html'], ['menu', 'Menu · /mainmenu/index.html']]],
  ['3', 'Version 2', [['v2-why', 'Why v1 looked vibecoded'], ['v2-home', 'v2 · Home · /index.html'], ['v2-menu', 'v2 · Menu · /mainmenu/index.html']]]
];
/* Version switch: v1 and v2 pages map onto each other; doc screens land on the matching home */
const V_MAP = { home: 'v2-home', menu: 'v2-menu', 'v2-home': 'home', 'v2-menu': 'menu' };
const isV2 = p => p.startsWith('v2');

/* ---------- toast ---------- */
let tt; PX.toast = html => { const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };

/* ---------- rationale builders ---------- */
const LAW_NAMES = ['Aesthetic-Usability Effect', 'Choice Overload', 'Chunking', 'Cognitive Bias', 'Cognitive Load', 'Doherty Threshold', 'Fitts’s Law', 'Flow', 'Goal-Gradient Effect', 'Hick’s Law', 'Jakob’s Law', 'Law of Common Region', 'Law of Proximity', 'Law of Prägnanz', 'Law of Similarity', 'Law of Uniform Connectedness', 'Mental Model', 'Miller’s Law', 'Occam’s Razor', 'Paradox of the Active User', 'Pareto Principle', 'Parkinson’s Law', 'Peak-End Rule', 'Postel’s Law', 'Selective Attention', 'Serial Position Effect', 'Tesler’s Law', 'Von Restorff Effect', 'Working Memory', 'Zeigarnik Effect'];
const LAW_SLUG = n => n.toLowerCase().replace(/ä/g, 'a').replace(/’|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
PX.lt = n => `<a class="lt" href="https://lawsofux.com/${LAW_SLUG(n)}/" target="_blank" rel="noopener">${n}</a>`;
const TG = { k: '<span class="tag kept">Kept</span>', m: '<span class="tag moved">Moved</span>', r: '<span class="tag rewritten">Rewritten</span>', c: '<span class="tag cut">Cut · meaning kept</span>', n: '<span class="tag new">Added</span>', g: '<span class="tag merged">Merged</span>', f: '<span class="tag fix">Fix with the bar</span>' };
PX.doc = {
  sec: (kick, h, lead, inner = '') => `<div><p class="kick">${kick}</p><h2>${h}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}${inner}</div>`,
  diag: list => `<div class="diag">${list.map(([t, p, l]) => `<article><b>${t}</b><p>${p}</p>${l ? `<div class="laws">${l.map(PX.lt).join('')}</div>` : ''}</article>`).join('')}</div>`,
  moves: list => `<div class="moves">${list.map(([t, p]) => `<div><b>${t}</b><p>${p}</p></div>`).join('')}</div>`,
  laws: list => `<div class="laws-grid">${list.map(([n, w, t]) => `<article class="law"><div class="law-h"><a href="https://lawsofux.com/${LAW_SLUG(n)}/" target="_blank" rel="noopener"><span class="num">${String(LAW_NAMES.indexOf(n) + 1).padStart(2, '0')}</span> ${n}</a><span>${w}</span></div><p>${t}</p></article>`).join('')}</div>`,
  table: (head, rows) => `<div class="tbl-wrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${TG[c] || c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  foot: t => `<p class="foot">${t}</p>`
};

/* ---------- router ---------- */
PX.route = r => PX.routes.push(r);
const current = () => { const h = decodeURIComponent(location.hash.slice(1)); return PX.routes.find(r => r.path === h) ? h : 'home'; };

function stickTop() { const tb = $('#toolbar'); return getComputedStyle(tb).position === 'sticky' ? tb.offsetHeight + 16 : 0; }

function render(opt = {}) {
  const path = current(), r = PX.routes.find(x => x.path === path);
  PX.r = r;
  const intro = typeof r.intro === 'function' ? r.intro() : r.intro;
  $('#introKicker').textContent = intro.kicker; $('#introH1').textContent = intro.h1; $('#introLede').innerHTML = intro.lede || '';
  document.title = r.title + ' · Oscar Club Redesign';
  $('#styleWrap').hidden = !r.styles;
  $('#vpWrap').hidden = r.layout !== 'site';
  $('#styleChips').innerHTML = Object.entries(PX.STYLES).map(([k, s]) => `<button type="button" class="pchip" data-style-pick="${k}" aria-pressed="${k === PX.style}">${s.label}</button>`).join('');
  $$('#vp button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vp === PX.vp)));
  $$('#ver button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.ver === '2') === isV2(path))));
  const frame = $('#frame'), docOnly = $('#docOnly');
  frame.hidden = r.layout !== 'site'; docOnly.hidden = r.layout === 'site';
  if (r.layout === 'site') {
    frame.dataset.vp = PX.vp;
    $('#url').innerHTML = `${CIc('lock', 13)}<span>oscarclubsofia.com</span><b>${OC.path(r.page)}</b>`;
    const site = $('#site');
    site.dataset.style = r.v2 ? 'v2' : PX.style;
    site.style.setProperty('--stick-top', stickTop() + 'px');
    site.setAttribute('lang', OC.lang);
    site.innerHTML = r.render();
    site.classList.toggle('intro', !opt.lang);
    clearTimeout(PX._it); PX._it = setTimeout(() => site.classList.remove('intro'), 1800);
    if (!PX._mounted) { OC.mount(site, { rerender: o => { render(o); }, toast: PX.toast }); PX._mounted = true; }
    else OC.observe(site);
    r.mount && r.mount(site);
  } else {
    docOnly.innerHTML = r.render();
    r.mount && r.mount(docOnly);
  }
  $('#doc').innerHTML = r.doc ? r.doc() : '';
  const sel = $('#jump'); sel.value = path; $('#jPrev').disabled = sel.selectedIndex <= 0; $('#jNext').disabled = sel.selectedIndex >= sel.options.length - 1;
}
PX.render = render;

document.addEventListener('click', e => {
  const s = e.target.closest('[data-style-pick]'); if (s) { PX.style = s.dataset.stylePick; render(); return; }
  const vb = e.target.closest('#ver [data-ver]');
  if (vb) { const p = current(), want2 = vb.dataset.ver === '2'; if (want2 !== isV2(p)) location.hash = V_MAP[p] || (want2 ? 'v2-home' : 'home'); return; }
  const v = e.target.closest('#vp [data-vp]'); if (v) { PX.vp = v.dataset.vp; $('#frame').dataset.vp = PX.vp; $$('#vp button').forEach(b => b.setAttribute('aria-pressed', String(b === v))); return; }
  /* phone, email and app links can't be trusted inside the review frame: say what would happen */
  const a = e.target.closest('#site a[href^="tel:"], #site a[href^="mailto:"]');
  if (a) { e.preventDefault(); const h = a.getAttribute('href'); PX.toast(h.startsWith('tel:') ? `On the live site this calls <code>${h.slice(4)}</code>` : `On the live site this opens an email to <code>${h.slice(7)}</code>`); }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0 }); });

PX.boot = () => {
  $('#jump').innerHTML = PX.PLAN.map(([n, name, items]) => `<optgroup label="${n} · ${name}">${items.map(([p, l]) => `<option value="${p}">${l}</option>`).join('')}</optgroup>`).join('');
  $('#jump').addEventListener('change', e => location.hash = e.target.value);
  $('#jPrev').innerHTML = CIc('left'); $('#jNext').innerHTML = CIc('right');
  $('#jPrev').addEventListener('click', () => { const s = $('#jump'); if (s.selectedIndex > 0) location.hash = s.options[s.selectedIndex - 1].value; });
  $('#jNext').addEventListener('click', () => { const s = $('#jump'); if (s.selectedIndex < s.options.length - 1) location.hash = s.options[s.selectedIndex + 1].value; });
  $('#ver').innerHTML = [['1', 'v1'], ['2', 'v2']].map(([k, l]) => `<button type="button" data-ver="${k}" aria-pressed="false">${l}</button>`).join('');
  $('#vp').innerHTML = [['phone', 'Phone'], ['tablet', 'Tablet'], ['desktop', 'Desktop']].map(([k, l]) => `<button type="button" data-vp="${k}" aria-pressed="${k === PX.vp}">${CIc(k, 14)}${l}</button>`).join('');
  $('#annotToggle').addEventListener('change', e => { PX.annot = e.target.checked; document.body.classList.toggle('annot', PX.annot); });
  if (innerWidth < 640) PX.vp = 'phone';
  render();
};
