/* Oscar Club — the admin panel (admin/index.html). The bar's staff sign in with the shared password and edit the
   content the public pages show. No framework, no third-party code. The panel speaks Bulgarian only; content is typed
   in Bulgarian and English side by side.

   The backend's address is the site's: OC_BACKEND from js/config.js, or window.OC_API set before this file runs (the
   tests point the panel at backends of their own that way, as they do the public pages; never a URL parameter).

   The session token lives in sessionStorage, so closing the tab signs out, and goes with every admin call as a Bearer
   header. When the backend refuses it (the 8-hour session is over, or the password has been changed), the panel asks
   for the password again over what is on screen, and the call that was refused goes through once signed in, so nothing
   typed is lost. */
'use strict';
(() => {
  // The address and the 10-second limit are js/main.js's (OC.backend, LOAD_LIMIT), copied because the panel doesn't
  // load that file: keep the two in step
  const BACKEND = (typeof window.OC_API === 'string' ? window.OC_API : window.OC_BACKEND || '').replace(/\/+$/, '');
  const LOAD_LIMIT = 10 * 1000;
  const TOKEN_KEY = 'oc-admin-token';
  const NO_ADDRESS = 'Панелът не знае адреса на сървъра: той се записва в js/config.js.';

  const $ = sel => document.querySelector(sel);

  /* ---------- the session token ---------- */
  // sessionStorage can be refused (some private modes): the panel then keeps the token for this page load only
  let tokenInMemory = '';
  const session = {
    get() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return tokenInMemory; } },
    set(token) { tokenInMemory = token; try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* memory only */ } },
    clear() { tokenInMemory = ''; try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* memory only */ } }
  };

  /* ---------- talking to the backend ---------- */
  /**
   * One call. Resolves to { status, headers, body } and never rejects: status 0 means no answer came (no address set,
   * offline, or nothing within LOAD_LIMIT, which also sets timedOut: the backend may have done it all the same).
   */
  async function send(method, path, { body, token } = {}) {
    if (!BACKEND) return { status: 0 };
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), LOAD_LIMIT);
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const json = body === undefined ? undefined : JSON.stringify(body);
      const res = await fetch(BACKEND + path, { method, headers, body: json, signal: stop.signal });
      return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
    } catch {
      return { status: 0, timedOut: stop.signal.aborted };
    } finally {
      clearTimeout(timer);
    }
  }

  // An error's code says what went wrong, where its status may not: a 404 is a deleted event (EVENT_NOT_FOUND), or an
  // address that reaches the wrong server (ROUTE_NOT_FOUND)
  const codeOf = res => (res.body && res.body.code) || '';

  /** Why a call didn't go through, for a reason that isn't one field: the end of a sentence that says what failed. */
  function failureReason(status) {
    if (status === 401) return 'сесията изтече. Влез отново и опитай пак.';
    if (status === 0) return 'няма връзка със сървъра. Провери интернета и опитай пак.';
    return 'сървърът отказа. Опитай пак след малко.';
  }

  /** The password → { token }, or { error }: what to tell the admin. */
  async function logIn(password) {
    if (!BACKEND) return { error: NO_ADDRESS };
    const res = await send('POST', '/auth/login', { body: { password } });
    if (res.status === 200) return { token: res.body.token };
    if (res.status === 401) return { error: 'Грешна парола. Опитай пак.' };
    if (res.status === 400) return { error: 'Въведи паролата.' };
    if (res.status === 429) return { error: tooManyTries(Number(res.headers.get('Retry-After'))) };
    return { error: `Не влезе: ${failureReason(res.status)}` };
  }

  // Retry-After says how many seconds are left. It can still be missing (a backend older than the panel, or a proxy
  // that drops it), and then the panel doesn't guess a number
  function tooManyTries(seconds) {
    if (!(seconds > 0)) return 'Твърде много грешни опити. Опитай пак по-късно.';
    const minutes = Math.ceil(seconds / 60);
    return `Твърде много грешни опити. Опитай пак след ${minutes} ${minutes === 1 ? 'минута' : 'минути'}.`;
  }

  /**
   * An admin call with the session token. When the backend refuses the token (401), the admin is asked for the
   * password over the page as it is, and the same call is sent again once signed in. Only when they close that question
   * does the 401 come back to the caller.
   */
  async function callAsAdmin(method, path, body) {
    for (;;) {
      const res = await send(method, path, { body, token: session.get() });
      if (res.status !== 401 || !(await signInAgain())) return res;
    }
  }

  /* ---------- signing in again, over the page ---------- */
  const again = $('#sign-in-again');
  const againForm = again.querySelector('form');
  let askingAgain = null;

  /** Ask for the password in the dialog. Resolves to true once signed in, false if the admin closes it. Calls that are
   *  refused while it is open all wait for the same answer. */
  function signInAgain() {
    if (!askingAgain) {
      askingAgain = new Promise(resolve => {
        session.clear();
        again.addEventListener('close', () => {
          // closed without signing in, a wrong password may still be typed there
          againForm.reset();
          clearMessages(againForm);
          askingAgain = null;
          resolve(Boolean(session.get()));
        }, { once: true });
        again.showModal();
      });
    }
    return askingAgain;
  }

  againForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (await signInWith(againForm)) again.close();
  });
  again.querySelector('[data-close]').addEventListener('click', () => again.close());

  /* ---------- screens ---------- */
  function showScreen(signedIn) {
    document.querySelectorAll('[data-signed-in]').forEach(el => { el.hidden = !signedIn; });
    document.querySelectorAll('[data-signed-out]').forEach(el => { el.hidden = signedIn; });
  }

  $('#sign-in').addEventListener('submit', async e => {
    e.preventDefault();
    if (!(await signInWith(e.currentTarget))) return;
    showScreen(true);
    loadEvents();
  });

  /**
   * Sign in with the password typed in `form`; resolves to true once signed in. A right password is cleared from the
   * form at once, so it never stays in the page; a wrong one stays, to be corrected.
   */
  async function signInWith(form) {
    const result = await busy(form, () => logIn(form.password.value));
    if (result.error) { markInvalid(form.password, result.error); return false; }
    session.set(result.token);
    form.reset();
    return true;
  }

  // Signing out leaves nothing of the session on screen for whoever uses the computer next
  $('[data-sign-out]').addEventListener('click', () => {
    session.clear();
    showInForm(null);
    ['#upcoming', '#past', '#events-said'].forEach(sel => $(sel).replaceChildren());
    showScreen(false);
    $('#sign-in-password').focus();
  });

  /**
   * Run `work` (a promise-returning function) with the form's submit button pressed down and its messages cleared, so
   * a second press can't send it twice and an old message never stands beside a new answer.
   */
  async function busy(form, work) {
    const button = form.querySelector('[type="submit"]');
    clearMessages(form);
    button.disabled = true;
    try { return await work(); } finally { button.disabled = false; }
  }

  // the #<id>-err line is the field's description, so a screen reader reads the message with the field
  function markInvalid(field, message) {
    field.setAttribute('aria-invalid', 'true');
    document.getElementById(`${field.id}-err`).textContent = message;
  }

  function clearMessages(form) {
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.ad-err').forEach(el => { el.textContent = ''; });
  }

  /* ---------- events ---------- */
  const eventForm = $('#event-form');
  const fields = eventForm.elements;

  // The backend names a wrong field by its path in the body (details[].field); the panel uses the same names
  const EVENT_FIELDS = {
    date: { input: fields.date, message: 'Избери дата.' },
    title: { input: fields['title.bg'], message: 'Напиши заглавието на двата езика.' },
    'title.bg': { input: fields['title.bg'], message: 'Напиши заглавието на български.' },
    'title.en': { input: fields['title.en'], message: 'Напиши заглавието на английски.' },
    entryFee: { input: fields.entryFee, message: 'Напиши сума в евро, например 15 или 12,50, или остави празно за свободен вход.' }
  };

  // The one form adds an event, or changes the one picked from the list (its id here)
  let editing = null;

  /** Put the form in "change this event" mode with what the event holds, or back to an empty new event (null). */
  function showInForm(ev) {
    editing = ev ? ev.id : null;
    clearMessages(eventForm);
    eventForm.reset();
    if (ev) {
      fields.date.value = ev.date;
      fields['title.bg'].value = ev.title.bg;
      fields['title.en'].value = ev.title.en;
      fields.entryFee.value = ev.entryFee === null ? '' : euros(ev.entryFee);
    }
    showFormMode();
    if (ev) {
      eventForm.scrollIntoView({ block: 'start' });
      fields.date.focus();
    }
  }

  function showFormMode() {
    $('#event-form-h').textContent = editing ? 'Промяна на събитие' : 'Ново събитие';
    eventForm.querySelector('[type="submit"]').textContent = editing ? 'Запази промените' : 'Добави събитие';
    eventForm.querySelector('[data-cancel-edit]').hidden = !editing;
  }

  eventForm.querySelector('[data-cancel-edit]').addEventListener('click', () => showInForm(null));

  /**
   * The fields the panel can see are wrong without asking the backend, by the backend's names, in the form's order: so
   * the admin fixes everything in one pass. A fee that can't be read is never sent: it would have to become free entry
   * or a guess.
   */
  function fieldsToFix(fee) {
    const empty = name => fields[name].value.trim() === '';
    return [
      empty('date') && 'date',
      fee === undefined && 'entryFee',
      empty('title.bg') && 'title.bg',
      empty('title.en') && 'title.en'
    ].filter(Boolean);
  }

  eventForm.addEventListener('submit', async e => {
    e.preventDefault();
    $('#events-said').textContent = '';
    clearMessages(eventForm);
    const entryFee = eurosToCents(fields.entryFee.value);
    const toFix = fieldsToFix(entryFee);
    if (toFix.length) { showFieldErrors(toFix); return; }
    const body = { date: fields.date.value, title: { bg: fields['title.bg'].value, en: fields['title.en'].value }, entryFee };
    const res = await busy(eventForm, () => (editing
      ? callAsAdmin('PUT', `/admin/events/${encodeURIComponent(editing)}`, body)
      : callAsAdmin('POST', '/admin/events', body)));
    if (res.status === 200 || res.status === 201) {
      $('#events-said').textContent = editing ? 'Промените са запазени.' : 'Събитието е добавено.';
      showInForm(null);
      loadEvents();
    } else if (codeOf(res) === 'VALIDATION_FAILED' && res.body.details) {
      showFieldErrors(res.body.details.map(d => d.field));
    } else if (codeOf(res) === 'EVENT_NOT_FOUND') {
      // deleted meanwhile (another tab, another phone): what was typed stays, and can be added as a new event
      editing = null;
      showFormMode();
      $('#event-form-err').textContent = 'Това събитие вече е изтрито. Написаното остава: можеш да го добавиш като ново.';
      loadEvents();
    } else if (res.timedOut) {
      // the backend may have saved it before the time ran out: the list shows whether it did, and what was typed stays
      // for a second try, so a new event isn't added twice by a blind retry
      $('#event-form-err').textContent = 'Сървърът не отговори навреме и не е ясно дали е запазено. Провери в списъка по-долу, преди да опиташ пак.';
      loadEvents();
    } else {
      $('#event-form-err').textContent = `Не е запазено: ${failureReason(res.status)}`;
    }
  });

  async function deleteEvent(ev) {
    const dialog = $('#confirm-delete');
    dialog.querySelector('[data-what]').textContent = `„${ev.title.bg}“ (${dateText(ev.date)})`;
    dialog.returnValue = '';
    dialog.showModal();
    // its buttons close it with their value; Escape closes it with none
    await new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
    if (dialog.returnValue !== 'delete') return;
    const res = await callAsAdmin('DELETE', `/admin/events/${encodeURIComponent(ev.id)}`);
    const said = $('#events-said');
    // EVENT_NOT_FOUND: it was already gone, which is what the admin wanted
    if (res.status === 204 || codeOf(res) === 'EVENT_NOT_FOUND') {
      said.textContent = 'Събитието е изтрито.';
      if (editing === ev.id) showInForm(null);
    } else {
      said.textContent = `Не е изтрито: ${failureReason(res.status)}`;
    }
    // the list is rebuilt next, taking with it the button that had the focus: the keyboard goes on from the answer
    said.focus();
    loadEvents();
  }

  /** Fields by the backend's names → each field's own message under it; the first one gets the focus. */
  function showFieldErrors(names) {
    const wrong = names.map(name => EVENT_FIELDS[name]).filter(Boolean);
    wrong.forEach(f => markInvalid(f.input, f.message));
    if (wrong.length) wrong[0].input.focus();
  }

  /** Fetch the list and show it: upcoming first (soonest first), then past (latest first), as the backend orders it. */
  async function loadEvents() {
    const lists = $('#event-lists');
    lists.setAttribute('aria-busy', 'true');
    const res = await callAsAdmin('GET', '/admin/events');
    lists.removeAttribute('aria-busy');
    const loaded = res.status === 200;
    $('#events-load-err').textContent = loaded ? '' : `Събитията не се заредиха: ${failureReason(res.status)}`;
    $('#events-retry').hidden = loaded;
    if (!loaded) return;
    const upcoming = res.body.filter(ev => ev.upcoming);
    const past = res.body.filter(ev => !ev.upcoming);
    $('#upcoming').replaceChildren(...upcoming.map(eventRow));
    $('#past').replaceChildren(...past.map(eventRow));
    $('#no-upcoming').hidden = upcoming.length > 0;
    $('#past-group').hidden = past.length === 0;
  }

  $('#events-retry button').addEventListener('click', loadEvents);

  function eventRow(ev) {
    const en = el('span', 'ad-ev-en', ev.title.en);
    en.lang = 'en';
    // each button says which event it acts on, for a screen reader going from button to button
    const whichEvent = ` „${ev.title.bg}“, ${dateText(ev.date)}`;
    return el('li', '',
      el('span', 'ad-ev-date tnum', `${dateText(ev.date)} `, el('span', 'ad-ev-day', weekday(ev.date))),
      el('span', 'ad-ev-title', ev.title.bg, en),
      el('span', 'ad-ev-fee', ev.entryFee === null ? 'свободен вход' : `вход ${euros(ev.entryFee)} €`),
      el('span', 'ad-ev-acts',
        button('Промени', whichEvent, () => showInForm(ev)),
        button('Изтрий', whichEvent, () => deleteEvent(ev))));
  }

  /** A quiet button: `label` on screen, `screenReaderText` added for screen readers only. */
  function button(label, screenReaderText, onClick) {
    const b = el('button', 'ad-quiet', label, el('span', 'vh', screenReaderText));
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---------- dates ---------- */
  // An event's date is a day on the bar's calendar ('2026-11-28'), not a moment: it is read as written, never through
  // the browser's timezone
  const dateText = iso => iso.split('-').reverse().join('.');
  const WEEKDAYS = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
  const weekday = iso => {
    const [y, m, d] = iso.split('-').map(Number);
    return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  };

  function el(tag, className, ...children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.append(...children);
    return node;
  }

  /* ---------- money ---------- */
  /**
   * What the admin typed in a euro box → whole cents ('15' → 1500, '12,50' or '12.5' → 1250), with no float
   * arithmetic. Empty is null (free entry); what can't be read as euros and cents is undefined. A € sign and spaces are
   * let through, a thousands separator isn't: '1.000' could mean either.
   */
  function eurosToCents(text) {
    const typed = text.replace(/[\s€]/g, '');
    if (typed === '') return null;
    const m = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(typed);
    if (!m) return undefined;
    return Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'));
  }

  /**
   * Whole cents → euros as the Bulgarian pages write them, without the sign: 1500 → '15', 1250 → '12,50'. OC.euros in
   * js/main.js writes them for the public pages, and the panel doesn't load that file: keep the two in step.
   */
  function euros(cents) {
    const rest = cents % 100;
    return `${Math.floor(cents / 100)}${rest ? `,${String(rest).padStart(2, '0')}` : ''}`;
  }

  showScreen(Boolean(session.get()));
  if (session.get()) loadEvents();
  else if (!BACKEND) markInvalid($('#sign-in-password'), NO_ADDRESS);
})();
