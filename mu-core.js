/* Music Adventure - core: helpers, storage, sync, router and the main screens.
 * Plain JS, no build step. Content: mu-content.js / mu-data.js. Labs: mu-labs-*.js. Games: mu-games.js.
 * Listening shelf + composers: mu-shelf.js. Parent area: mu-parent.js. Audio: mu-audio.js. */
(function () {
  'use strict';
  const MU = window.MU = window.MU || {};
  MU.labs = MU.labs || {};
  MU.units = MU.units || [];
  MU.screens = MU.screens || {};
  MU.games = MU.games || [];
  MU.VERSION = '1.0.0';

  /* ================= DOM helpers ================= */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function applyProps(el, props) {
    if (!props) return;
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.slice(0, 2) === '--') el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; } }
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function kids(el, list) {
    for (const c of list.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
  }
  const h = MU.h = function (tag, props, ...list) { const el = document.createElement(tag); applyProps(el, props); kids(el, list); return el; };
  const s = MU.s = function (tag, props, ...list) { const el = document.createElementNS(SVGNS, tag); applyProps(el, props); kids(el, list); return el; };
  const $ = MU.$ = (sel, root) => (root || document).querySelector(sel);
  MU.rand = n => Math.floor(Math.random() * n);
  MU.pick = a => a[Math.floor(Math.random() * a.length)];
  MU.shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  MU.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  MU.sleep = ms => new Promise(r => MU.after(r, ms));

  /* ================= cleanup registry ================= */
  let cleanups = [];
  MU.onLeave = fn => { cleanups.push(fn); };
  MU.cleanup = () => {
    const c = cleanups; cleanups = []; c.forEach(fn => { try { fn(); } catch (e) { } });
    try { MU.stopAll && MU.stopAll(); } catch (e) { }
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { }
  };
  MU.every = (fn, ms) => { const id = setInterval(fn, ms); MU.onLeave(() => clearInterval(id)); return id; };
  MU.after = (fn, ms) => { const id = setTimeout(fn, ms); MU.onLeave(() => clearTimeout(id)); return id; };

  /* ================= sound feedback + speech ================= */
  MU.sfx = {
    ok() { if (D.sound) MU.sfxRaw.ok(); }, bad() { if (D.sound) MU.sfxRaw.bad(); }, click() { if (D.sound) MU.sfxRaw.click(); },
    win() { if (D.sound) MU.sfxRaw.win(); }, star() { if (D.sound) MU.sfxRaw.star(); }
  };
  MU.say = function (text) {
    if (!D.tts) return;
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[🎵🎶🎼🔊]/g, ''));
      u.rate = 0.9; u.pitch = 1.05; u.lang = 'en-GB';
      speechSynthesis.speak(u);
    } catch (e) { }
  };
  MU.sayBtn = text => h('button', { class: 'say', 'aria-label': 'Read aloud', onclick: () => MU.say(text) }, '🔊');
  MU.hearBtn = (label, fn) => h('button', { class: 'hear', onclick: e => { e.stopPropagation(); fn(); } }, '🔈 ', label || 'Listen');

  /* ================= storage ================= */
  const KEY = 'mu_v1', NKEY = 'mu_notes_v1';
  const defaults = () => ({ v: 1, profiles: [], cur: null, prog: {}, pin: '', fam: '', famPin: '', sound: true, tts: true, sessionsDone: {} });
  function load() { try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return defaults(); } }
  let D = load();
  MU.D = () => D;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } scheduleSync(); }
  MU.save = save;
  MU.notes = {
    all(pid) { try { return (JSON.parse(localStorage.getItem(NKEY)) || {})[pid] || []; } catch (e) { return []; } },
    put(pid, list) { try { const o = JSON.parse(localStorage.getItem(NKEY)) || {}; o[pid] = list; localStorage.setItem(NKEY, JSON.stringify(o)); return true; } catch (e) { return false; } }
  };

  /* ================= bands, avatars ================= */
  MU.BANDS = [
    { id: 'sprout', e: '🌱', name: 'Sprout', ages: '2–4', desc: 'Big buttons, no reading' },
    { id: 'spark', e: '🎶', name: 'Melody', ages: '5–7', desc: 'Pictures, read-aloud, short rounds' },
    { id: 'player', e: '🎻', name: 'Player', ages: '8–10', desc: 'Note names, rhythm, composers' },
    { id: 'maestro', e: '🎼', name: 'Maestro', ages: '11+', desc: 'Staff reading, form, history, harmony' }
  ];
  MU.AVATARS = ['🦊', '🐱', '🐶', '🦉', '🐢', '🦋', '🌟', '🎻', '🌈', '🐸', '🦄', '🐼', '🐙', '🦁', '🐧', '🌻', '🐳', '🎨', '🐝', '🦜'];
  const bandFromGrade = g => { g = String(g); if (g === 'PS' || g === 'PK') return 'sprout'; if (g === 'K' || g === '1' || g === '2') return 'spark'; if (g === '3' || g === '4' || g === '5') return 'player'; return 'maestro'; };
  MU.P = () => D.profiles.find(p => p.id === D.cur) || null;
  MU.lvl = () => { const b = (MU.P() || {}).band; return b === 'maestro' ? 3 : b === 'player' ? 2 : 1; };
  MU.band = () => (MU.P() || {}).band || 'spark';

  /* ================= progress ================= */
  const emptyPR = () => ({ labs: {}, quiz: {}, missions: {}, badges: {}, games: {}, listened: {} });
  function PR(pid) { pid = pid || D.cur; if (!pid) return null; const p = D.prog[pid] || (D.prog[pid] = emptyPR()); if (!p.listened) p.listened = {}; if (!p.games) p.games = {}; return p; }
  MU.PR = PR; MU.emptyPR = emptyPR;
  MU.labStars = (id, pid) => ((PR(pid) || { labs: {} }).labs[id] || {}).stars || 0;
  MU.totalStars = pid => {
    const pr = PR(pid); if (!pr) return 0; let n = 0;
    for (const k in pr.labs) n += pr.labs[k].stars || 0;
    for (const k in pr.quiz) n += pr.quiz[k].pct >= 90 ? 3 : pr.quiz[k].pct >= 70 ? 2 : 1;
    for (const k in pr.games) n += pr.games[k].stars || 0;
    n += Object.keys(pr.listened).length;
    return n;
  };
  MU.unit = id => MU.units.find(u => u.id === Number(id));
  MU.unitStatus = function (u, pid) {
    const pr = PR(pid) || emptyPR();
    const labsDone = u.labs.filter(id => ((pr.labs[id] || {}).stars || 0) > 0).length;
    const q = pr.quiz[u.id]; const quizBest = q ? q.pct : null; const quizPass = quizBest != null && quizBest >= 70;
    const mDone = u.sessions.filter((x, i) => pr.missions['u' + u.id + 's' + i]).length;
    const parts = u.labs.length + 1;
    const pct = Math.round(((labsDone + (quizPass ? 1 : 0)) / parts) * 100);
    return { labsDone, labsTotal: u.labs.length, quizBest, quizPass, mDone, mTotal: u.sessions.length, badge: !!pr.badges[u.id], pct };
  };
  MU.recordGame = function (gameId, stars, correct) {
    const pr = PR(); if (!pr) return;
    const old = pr.games[gameId] || { stars: 0, plays: 0 };
    pr.games[gameId] = { stars: Math.max(old.stars || 0, stars), plays: (old.plays || 0) + 1, best: Math.max(old.best || 0, correct || 0), at: Date.now() };
    save();
  };
  MU.recordLab = function (labId, stars, score, max) {
    const pr = PR(); if (!pr) return;
    const old = pr.labs[labId] || {};
    if (stars > (old.stars || 0)) pr.labs[labId] = { stars, score, max, at: Date.now() };
    else pr.labs[labId] = Object.assign({}, old, { at: Date.now() });
    save(); checkBadge(MU.labs[labId] && MU.unit(MU.labs[labId].unit));
  };
  MU.recordQuiz = function (unitId, pct) {
    const pr = PR(); if (!pr) return;
    const old = pr.quiz[unitId];
    if (!old || pct > old.pct) pr.quiz[unitId] = { pct, at: Date.now() };
    save(); checkBadge(MU.unit(unitId));
  };
  MU.toggleMission = function (key, force) {
    const pr = PR(); if (!pr) return false;
    pr.missions[key] = force == null ? !pr.missions[key] : !!force;
    if (!pr.missions[key]) delete pr.missions[key];
    save(); return !!pr.missions[key];
  };
  MU.markListened = function (pieceId, extra) {
    const pr = PR(); if (!pr) return;
    const old = pr.listened[pieceId] || {};
    pr.listened[pieceId] = Object.assign({}, old, { at: old.at || Date.now() }, extra || {});
    save();
  };
  MU.listenedCount = pid => Object.keys((PR(pid) || { listened: {} }).listened).length;
  function checkBadge(u) {
    if (!u) return;
    const st = MU.unitStatus(u), pr = PR();
    if (st.labsDone === st.labsTotal && st.quizPass && !pr.badges[u.id]) {
      pr.badges[u.id] = Date.now(); save();
      setTimeout(() => MU.badgeModal(u), 700);
    }
  }
  MU.badgeModal = function (u) {
    MU.confetti(); MU.sfx.win();
    MU.modal(h('div', null,
      h('div', { class: 'bigem' }, u.badge.emoji),
      h('h2', null, 'Badge earned!'),
      h('p', { class: 'mt8', style: { fontWeight: 800, fontSize: '1.2rem', color: u.color } }, u.badge.name),
      h('p', { class: 'muted mt8' }, u.badge.earned),
      h('div', { class: 'row mt16', style: { justifyContent: 'center' } },
        h('button', { class: 'btn mint', onclick: () => { MU.closeModal(); } }, 'Hooray! 🎉'))));
  };

  /* ================= overlays ================= */
  let modalEl = null;
  MU.closeModal = () => { if (modalEl) { modalEl.remove(); modalEl = null; } };
  MU.modal = function (content, opts) {
    MU.closeModal();
    modalEl = h('div', { class: 'modal', onclick: e => { if (e.target === modalEl && opts && opts.dismiss) MU.closeModal(); } }, h('div', { class: 'box' }, content));
    document.body.append(modalEl); return modalEl;
  };
  MU.toast = function (msg) { const t = h('div', { class: 'toast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2200); };
  MU.confetti = function () {
    const cols = ['#F5B83D', '#12B58C', '#F2645A', '#6B4FD8', '#E0529C', '#3A9BDC'];
    for (let i = 0; i < 44; i++) {
      const c = h('i', { class: 'confetti', style: { left: Math.random() * 100 + 'vw', background: cols[i % cols.length], animationDelay: (Math.random() * 0.6) + 's', animationDuration: (2 + Math.random() * 1.6) + 's' } });
      document.body.append(c); setTimeout(() => c.remove(), 4200);
    }
  };
  MU.starsEl = (n, max) => { max = max || 3; const el = h('span', { class: 'stars' }); for (let i = 0; i < max; i++) el.append(h('span', { class: i < n ? '' : 'off' }, '⭐')); return el; };

  /* ================= cloud sync (optional; app works offline) ================= */
  MU.FIREBASE = {
    apiKey: 'AIzaSyCxqGRhdCyh92LyiFvrTi6ETTiFKVhDvUM', authDomain: 'homeschool-math.firebaseapp.com', projectId: 'homeschool-math',
    storageBucket: 'homeschool-math.firebasestorage.app', messagingSenderId: '275309549483', appId: '1:275309549483:web:3c118499f22eb23e6f24ee'
  };
  let fbP = null;
  function fb() {
    if (fbP) return fbP;
    fbP = (async () => {
      try {
        const app = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js');
        const fs = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
        const a = app.getApps().length ? app.getApp() : app.initializeApp(MU.FIREBASE);
        return { fs, db: fs.getFirestore(a) };
      } catch (e) { console.warn('Firebase unavailable', e); fbP = null; return null; }
    })();
    return fbP;
  }
  function mergeProg(a, b) {
    const out = Object.assign({}, a);
    for (const pid of Object.keys(b || {})) {
      const x = out[pid] || emptyPR(), y = b[pid] || {};
      const m = { labs: Object.assign({}, x.labs), quiz: Object.assign({}, x.quiz), missions: Object.assign({}, y.missions || {}, x.missions), badges: Object.assign({}, y.badges || {}, x.badges), games: Object.assign({}, x.games || {}), listened: Object.assign({}, y.listened || {}, x.listened || {}), songs: Object.assign({}, x.songs || {}) };
      for (const k in (y.songs || {})) { const c = m.songs[k]; if (!c || (y.songs[k].ts || 0) > (c.ts || 0)) m.songs[k] = y.songs[k]; }
      for (const k in (y.games || {})) { const c = m.games[k]; if (!c || (y.games[k].stars || 0) > (c.stars || 0) || ((y.games[k].stars || 0) === (c.stars || 0) && (y.games[k].plays || 0) > (c.plays || 0))) m.games[k] = y.games[k]; }
      for (const k in (y.labs || {})) { const c = m.labs[k]; if (!c || (y.labs[k].stars || 0) > (c.stars || 0)) m.labs[k] = y.labs[k]; }
      for (const k in (y.quiz || {})) { const c = m.quiz[k]; if (!c || (y.quiz[k].pct || 0) > (c.pct || 0)) m.quiz[k] = y.quiz[k]; }
      out[pid] = m;
    }
    return out;
  }
  async function cloudPull() {
    if (!D.fam) return false;
    const f = await fb(); if (!f) return false;
    try {
      const snap = await f.fs.getDoc(f.fs.doc(f.db, 'families', D.fam + '_mu'));
      if (snap.exists()) { const r = snap.data(); D.prog = mergeProg(D.prog, r.prog || {}); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } }
      return true;
    } catch (e) { console.warn('pull failed', e); return false; }
  }
  async function cloudPush() {
    if (!D.fam) return false;
    const f = await fb(); if (!f) return false;
    try {
      await cloudPull();
      await f.fs.setDoc(f.fs.doc(f.db, 'families', D.fam + '_mu'), { app: 'music-adventure', prog: D.prog, ts: Date.now() }, { merge: false });
      return true;
    } catch (e) { console.warn('push failed', e); return false; }
  }
  let syncT = null;
  function scheduleSync() { if (!D.fam) return; clearTimeout(syncT); syncT = setTimeout(cloudPush, 2500); }
  MU.syncNow = cloudPush;
  MU.fmtFam = v => { v = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return v.length > 2 ? v.slice(0, 2) + '-' + v.slice(2, 6) : v; };
  MU.managed = () => { try { return sessionStorage.getItem('mu_harbor_managed') === '1'; } catch (e) { return false; } };
  MU.joinFamily = async function (code, mirror) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length === 6) code = code.slice(0, 2) + '-' + code.slice(2);
    if (!/^[A-Z]{2}-[A-Z0-9]{4}$/.test(code)) return { ok: false, msg: 'That code does not look right (' + (code || 'empty') + '). A family code looks like MA-AB12.' };
    const f = await fb(); if (!f) return { ok: false, msg: 'Could not reach the cloud. Check the internet and try again.' };
    try {
      const snap = await f.fs.getDoc(f.fs.doc(f.db, 'families', code));
      if (!snap.exists()) return { ok: false, msg: 'No family found with that code.' };
      const fam = snap.data(); let added = 0;
      for (const p of (fam.profiles || [])) {
        const id = String(p.id);
        const ex = D.profiles.find(x => x.id === id);
        if (!ex) { D.profiles.push({ id, name: p.name || 'Explorer', avatar: p.avatar || '🌟', band: bandFromGrade(p.gradeId) }); added++; }
        else if (mirror) { ex.name = p.name || ex.name; ex.avatar = p.avatar || ex.avatar; ex.band = bandFromGrade(p.gradeId) || ex.band; }
      }
      if (mirror && (fam.profiles || []).length) {
        const ids = new Set((fam.profiles || []).map(p => String(p.id)));
        D.profiles.forEach(x => {
          if (ids.has(x.id) || !D.prog || !D.prog[x.id]) return;
          const m = (fam.profiles || []).find(p => String(p.name || '').trim().toLowerCase() === String(x.name || '').trim().toLowerCase());
          if (m) D.prog = mergeProg(D.prog, { [String(m.id)]: D.prog[x.id] });
        });
        D.profiles = D.profiles.filter(x => ids.has(x.id));
        if (!D.profiles.some(x => x.id === D.cur)) D.cur = D.profiles[0] ? D.profiles[0].id : null;
      }
      D.fam = code; D.famPin = fam.parentPin || '';
      if (!D.cur && D.profiles.length) D.cur = D.profiles[0].id;
      save(); await cloudPull(); save();
      return { ok: true, msg: added ? 'Joined! Added ' + added + ' explorer' + (added > 1 ? 's' : '') + '.' : 'Joined! Progress synced.', added };
    } catch (e) { return { ok: false, msg: 'Something went wrong joining. Try again.' }; }
  };
  MU.leaveFamily = () => { D.fam = ''; D.famPin = ''; save(); };

  /* ================= router ================= */
  MU.go = path => { if (location.hash === '#' + path) render(); else location.hash = '#' + path; };
  MU.back = fallback => { if (history.length > 1) history.back(); else MU.go(fallback || '/'); };
  function seg() { const raw = (location.hash.slice(1) || '/'); const [path, qs] = raw.split('?'); return { parts: path.split('/').filter(Boolean), qs: new URLSearchParams(qs || '') }; }
  MU.seg = seg;

  const NAV = [['/', '🏠', 'Home'], ['/games', '🎮', 'Games'], ['/shelf', '🎧', 'Listen'], ['/badges', '🏅', 'Badges'], ['/journal', '📓', 'Journal'], ['/parent', '🔒', 'Parents']];
  function navBar(active) {
    return h('nav', { class: 'nav' }, h('div', null, NAV.map(([p, e, t]) => h('button', { class: active === p ? 'on' : '', onclick: () => MU.go(p) }, h('span', { class: 'e' }, e), t))));
  }
  MU.topbar = function (title, backPath, right) {
    return h('div', { class: 'topbar' },
      h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: () => backPath ? MU.go(backPath) : MU.back('/') }, '←'),
      h('h2', null, title), right || null);
  };
  MU.starPill = () => h('span', { class: 'starpill' }, '⭐ ' + MU.totalStars());

  function render() {
    MU.cleanup(); MU.closeModal();
    const app = $('#app'); app.innerHTML = ''; app.style.removeProperty('--c');
    document.querySelectorAll('.nav').forEach(n => n.remove());
    window.scrollTo(0, 0);
    const { parts, qs } = seg();
    const r = parts[0] || '';
    if (!D.profiles.length && r !== 'welcome' && r !== 'parent') return MU.go('/welcome');
    if (D.profiles.length && !MU.P()) { D.cur = D.profiles[0].id; save(); }
    let nav = null;
    const need = (k, label) => MU.screens[k] ? MU.screens[k](parts, qs) : h('p', null, label + ' missing.');
    try {
      if (r === '') { app.append(screenHome()); nav = '/'; }
      else if (r === 'welcome') app.append(screenWelcome(qs));
      else if (r === 'who') app.append(screenWho());
      else if (r === 'unit') app.append(screenUnit(parts[1]));
      else if (r === 'lab') app.append(screenLab(parts[1]));
      else if (r === 'quiz') app.append(screenQuiz(parts[1]));
      else if (r === 'badges') { app.append(screenBadges()); nav = '/badges'; }
      else if (r === 'journal') { app.append(screenJournal(parts[1], qs)); nav = parts[1] ? null : '/journal'; }
      else if (r === 'studio') { app.append(need('studio', 'Studio')); nav = '/studio'; }
      else if (r === 'games') { app.append(need('games', 'Games')); nav = '/games'; }
      else if (r === 'game') { app.append(need('game', 'Game')); }
      else if (r === 'shelf') { app.append(need('shelf', 'Listening shelf')); nav = '/shelf'; }
      else if (r === 'piece') { app.append(need('piece', 'Piece')); }
      else if (r === 'composer') { app.append(need('composer', 'Composer')); }
      else if (r === 'little') { app.append(screenLittle(parts[1])); nav = parts[1] ? null : '/'; }
      else if (r === 'parent') { app.append(need('parent', 'Parent area')); nav = '/parent'; }
      else { app.append(screenHome()); nav = '/'; }
    } catch (e) {
      console.error(e);
      app.append(h('div', { class: 'card' }, h('h3', null, 'Oops, something broke'), h('p', { class: 'muted mt8' }, String(e && e.message || e)), h('button', { class: 'btn mt12', onclick: () => MU.go('/') }, 'Home')));
    }
    if (nav) document.body.append(navBar(nav));
  }
  MU.render = render;

  /* ================= screens ================= */
  const staffLines = () => s('svg', { class: 'traces', viewBox: '0 0 400 200', preserveAspectRatio: 'xMidYMid slice' },
    [40, 56, 72, 88, 104].map(y => s('line', { x1: 0, y1: y + 20, x2: 400, y2: y + 20, stroke: '#fff', 'stroke-width': 1.6 })),
    [[60, 112, 1], [110, 96, 1], [160, 80, 1], [215, 96, 1], [265, 72, 1], [315, 104, 1], [360, 88, 1]].map(([x, y]) => s('g', null, s('ellipse', { cx: x, cy: y + 20, rx: 8, ry: 6, fill: '#F5B83D', transform: 'rotate(-20 ' + x + ' ' + (y + 20) + ')' }), s('line', { x1: x + 7, y1: y + 18, x2: x + 7, y2: y - 14, stroke: '#F5B83D', 'stroke-width': 2 }))));
  MU.heroArt = staffLines;

  function pieceOfDay() {
    const list = MU.pieces || []; if (!list.length) return null;
    const d = new Date(); const n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    return list[n % list.length];
  }

  function screenHome() {
    const p = MU.P(), band = p.band;
    const next = MU.units.find(u => !MU.unitStatus(u).badge) || MU.units[0];
    const wrap = h('div', null);
    wrap.append(h('div', { class: 'hero' }, staffLines(), h('div', { class: 'spark' }, '🎵'),
      h('div', { class: 'row' },
        h('div', { class: 'brand' }, h('div', { class: 'logo' }, '🎼'), h('div', null, h('h1', null, 'Music Adventure'), h('small', null, 'Listen. Play. Wonder.'))),
        h('button', { class: 'who', onclick: () => MU.go('/who') }, h('span', { class: 'av' }, p.avatar), p.name)),
      h('div', { class: 'hello' }, 'Hi ' + p.name + '! ', h('span', null, '⭐ ' + MU.totalStars() + ' stars · ' + MU.listenedCount() + ' pieces heard · ' + Object.keys(MU.PR().badges).length + ' of ' + MU.units.length + ' badges'))));

    const pod = pieceOfDay();
    if (pod) wrap.append(h('button', { class: 'podcard', onclick: () => MU.go('/piece/' + pod.id) },
      h('span', { class: 'em' }, '🎧'), h('span', { class: 'tx' }, h('small', null, 'LISTEN TODAY'), h('b', null, pod.title), h('span', null, pod.composer + ' · ' + pod.hook))));
    if (band === 'sprout') {
      wrap.append(h('div', { class: 'card' }, h('div', { class: 'center' }, h('div', { class: 'bigem' }, '🌱'), h('h2', null, 'Little Ones'), h('p', { class: 'muted mt8' }, 'Big buttons for little hands!'),
        h('button', { class: 'btn big mint mt12', onclick: () => MU.go('/little') }, 'Play 🎹'))));
    }
    wrap.append(h('button', { class: 'arcade', style: { background: 'linear-gradient(135deg,#6B4FD8,#2B1B4D)' }, onclick: () => MU.go('/studio') }, h('span', { class: 'em' }, '🎛️'), h('span', { class: 'tx' }, h('b', null, 'Music Studio'), h('span', null, 'Make beats, tunes and whole songs'))));
    wrap.append(h('button', { class: 'arcade', onclick: () => MU.go('/games') }, h('span', { class: 'em' }, '🎮'), h('span', { class: 'tx' }, h('b', null, 'Music Games'), h('span', null, 'Echo rhythms, name notes, guess the instrument'))));

    wrap.append(h('div', { class: 'themes' }, [['sky', '☁️', 'Sky'], ['sea', '🌊', 'Sea'], ['shore', '🏖️', 'Shore'], ['nature', '🍃', 'Leaves'], ['animals', '🐾', 'Animals'], ['dance', '💃', 'Dance'], ['irish', '☘️', 'Irish']].map(([k, e, t]) =>
      h('button', { class: 'chip btnlike', onclick: () => MU.go('/shelf?tag=' + k) }, e + ' ' + t))));

    const q = h('div', { class: 'quest', style: { marginTop: '14px' } });
    MU.units.forEach(u => {
      const st = MU.unitStatus(u);
      q.append(h('button', { class: 'node' + (st.badge ? ' got' : ''), style: { '--c': u.color }, onclick: () => MU.go('/unit/' + u.id) },
        next === u && !st.badge ? h('span', { class: 'nextpill' }, 'Next up') : null,
        h('div', { class: 'em' }, u.emoji),
        h('div', { class: 'tx' }, h('span', { class: 'un' }, 'Movement ' + u.id), h('b', null, u.title), h('span', null, u.tagline),
          h('div', { class: 'bar' }, h('i', { style: { width: st.pct + '%' } }))),
        h('div', { class: 'bd' }, u.badge.emoji)));
    });
    wrap.append(q);
    if (band !== 'sprout') wrap.append(h('button', { class: 'labcard mt16', onclick: () => MU.go('/little') }, h('span', { class: 'em' }, '🌱'), h('span', { style: { flex: 1 } }, h('b', null, 'Little Ones'), h('span', { class: 'd' }, 'Big-button music toys for the youngest family members'))));
    wrap.append(h('div', { class: 'card flat mt24 center' }, h('b', null, '🎧 Real music, real instruments'),
      h('p', { class: 'muted small mt8' }, 'The sounds in this app are made by a synthesiser, so they are only a sketch of the real thing. Every Listen page links to a real recording, and the Sessions in each movement are for singing, clapping and playing together.')));
    return wrap;
  }

  /* ---------- welcome / who ---------- */
  function profileForm(onDone, opts) {
    opts = opts || {};
    let av = MU.AVATARS[MU.rand(MU.AVATARS.length)], band = 'player';
    const name = h('input', { class: 'inp', placeholder: 'Name', maxlength: 20, autocomplete: 'off' });
    const avBox = h('div', { class: 'avgrid' });
    const bBox = h('div', { class: 'bands' });
    const drawAv = () => { avBox.innerHTML = ''; MU.AVATARS.forEach(a => avBox.append(h('button', { class: a === av ? 'on' : '', onclick: () => { av = a; drawAv(); } }, a))); };
    const drawB = () => { bBox.innerHTML = ''; MU.BANDS.forEach(b => bBox.append(h('button', { class: b.id === band ? 'on' : '', onclick: () => { band = b.id; drawB(); } }, h('span', { class: 'e' }, b.e), h('span', null, h('b', null, b.name + ' (ages ' + b.ages + ')'), h('br'), h('span', { class: 'muted small' }, b.desc))))); };
    drawAv(); drawB();
    return h('div', null, h('label', { class: 'lbl' }, 'Explorer name'), name, h('label', { class: 'lbl' }, 'Pick a friend'), avBox, h('label', { class: 'lbl' }, 'Who is this?'), bBox,
      h('button', { class: 'btn big mint wide mt16', onclick: () => {
        const n = name.value.trim(); if (!n) { name.focus(); return MU.toast('Type a name first'); }
        const p = { id: 'p' + Date.now().toString(36) + MU.rand(99), name: n, avatar: av, band };
        D.profiles.push(p); D.cur = p.id; save(); onDone(p);
      } }, opts.cta || 'Start listening 🎵'));
  }

  function screenWelcome(qs) {
    const wrap = h('div', null);
    wrap.append(h('div', { class: 'hero' }, staffLines(), h('div', { class: 'spark' }, '🎵'),
      h('div', { class: 'brand' }, h('div', { class: 'logo' }, '🎼'), h('div', null, h('h1', null, 'Music Adventure'), h('small', null, 'Welcome, explorer!')))));
    const joinMsg = h('div', { class: 'feedback' });
    const code = h('input', { class: 'inp', placeholder: 'MA-AB12 or WA-AB12', maxlength: 7, autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', value: D.fam || qs.get('family') || '', oninput: e => { e.target.value = MU.fmtFam(e.target.value); } });
    const joinBtn = h('button', { class: 'btn wide mt8', onclick: async () => {
      joinBtn.disabled = true; joinMsg.textContent = 'Joining…'; joinMsg.className = 'feedback';
      const r = await MU.joinFamily(code.value); joinBtn.disabled = false;
      joinMsg.textContent = r.msg; joinMsg.className = 'feedback ' + (r.ok ? 'good' : 'bad');
      if (r.ok && D.profiles.length) setTimeout(() => MU.go('/'), 800);
    } }, 'Join my family');
    wrap.append(h('div', { class: 'card', style: { marginTop: '-30px', position: 'relative' } }, h('h3', null, '🏠 I have a family code'),
      h('p', { class: 'muted small mt8' }, 'Use the same code as Math Adventure or Words Adventure. Your explorers and progress come along.'), h('div', { class: 'mt8' }, code), joinBtn, joinMsg));
    wrap.append(h('div', { class: 'card' }, h('h3', null, '✨ New explorer'), profileForm(() => MU.go('/'))));
    return wrap;
  }

  function screenWho() {
    const wrap = h('div', null, MU.topbar('Who is listening?', '/'));
    D.profiles.forEach(p => {
      const st = MU.totalStars(p.id);
      wrap.append(h('button', { class: 'nbitem', onclick: () => { D.cur = p.id; save(); MU.go('/'); } },
        h('span', { style: { fontSize: '2.4rem' } }, p.avatar), h('span', { style: { flex: 1 } }, h('b', null, p.name), h('br'), h('span', { class: 'muted small' }, (MU.BANDS.find(b => b.id === p.band) || {}).name + ' · ⭐ ' + st)),
        p.id === D.cur ? h('span', null, '✔️') : null));
    });
    if (!MU.managed()) wrap.append(h('div', { class: 'card mt16' }, h('h3', null, '➕ Add an explorer'), profileForm(() => MU.go('/'), { cta: 'Add explorer' })));
    else wrap.append(h('p', { class: 'muted small mt16' }, 'Add or change children in Harbor → Parents → Children.'));
    return wrap;
  }

  /* ---------- movement (unit) page ---------- */
  function screenUnit(id) {
    const u = MU.unit(id); if (!u) return h('p', null, 'Movement not found');
    const app = $('#app'); app.style.setProperty('--c', u.color);
    const st = MU.unitStatus(u), pr = MU.PR();
    const wrap = h('div', { style: { '--c': u.color } });
    wrap.append(h('div', { class: 'uhero' },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('button', { class: 'iconbtn', onclick: () => MU.go('/') }, '←'), h('span', { class: 'starpill' }, '⭐ ' + MU.totalStars())),
      h('div', { class: 'row mt12' }, h('div', { class: 'em' }, u.emoji), h('div', null, h('div', { style: { fontWeight: 800, opacity: .85, fontSize: '.8rem', letterSpacing: '.08em' } }, 'MOVEMENT ' + u.id), h('h1', null, u.title))),
      h('div', { class: 'bq' }, '🤔 ' + u.bigQuestion, ' ', MU.sayBtn(u.bigQuestion))));
    wrap.append(h('div', { class: 'card' }, h('p', null, u.story, ' ', MU.sayBtn(u.story)),
      h('div', { class: 'bar mt12' }, h('i', { style: { width: st.pct + '%' } })),
      h('p', { class: 'small muted mt8' }, st.labsDone + ' of ' + st.labsTotal + ' labs · quiz ' + (st.quizBest == null ? 'not tried' : st.quizBest + '%') + ' · badge ' + (st.badge ? 'earned! ' + u.badge.emoji : 'not yet'))));

    wrap.append(h('h3', { class: 'sec' }, '🧪 Labs ', h('span', { class: 'muted small' }, '(play on screen)')));
    u.labs.forEach(lid => {
      const lab = MU.labs[lid]; if (!lab) return;
      wrap.append(h('button', { class: 'labcard', onclick: () => MU.go('/lab/' + lid) }, h('span', { class: 'em' }, lab.emoji), h('span', { style: { flex: 1 } }, h('b', null, lab.title), h('span', { class: 'd' }, lab.blurb)), MU.starsEl(MU.labStars(lid))));
    });
    wrap.append(h('button', { class: 'labcard', onclick: () => MU.go('/quiz/' + u.id) }, h('span', { class: 'em' }, '❓'), h('span', { style: { flex: 1 } }, h('b', null, 'Movement Quiz'), h('span', { class: 'd' }, '5 questions. Get 70% for your badge!')),
      h('span', { class: 'chip' }, st.quizBest == null ? 'Try it' : st.quizBest + '%')));

    if (u.listen && u.listen.length && MU.piece) {
      wrap.append(h('h3', { class: 'sec' }, '🎧 Listen for this ', h('span', { class: 'muted small' }, '(real recordings)')));
      u.listen.forEach(pid => {
        const pc = MU.piece(pid); if (!pc) return;
        const heard = !!pr.listened[pid];
        wrap.append(h('button', { class: 'labcard', onclick: () => MU.go('/piece/' + pid) }, h('span', { class: 'em' }, heard ? '✅' : '🎧'), h('span', { style: { flex: 1 } }, h('b', null, pc.title), h('span', { class: 'd' }, pc.composer + ' · ' + pc.hook))));
      });
    }

    wrap.append(h('h3', { class: 'sec' }, '👨‍👩‍👧 Sessions ', h('span', { class: 'muted small' }, '(sing, clap, play together)')));
    const mc = h('div', { class: 'card' });
    u.sessions.forEach((m, i) => {
      const key = 'u' + u.id + 's' + i;
      const ck = h('button', { class: 'ck' + (pr.missions[key] ? ' on' : ''), 'aria-label': 'Mark done' }, pr.missions[key] ? '✔' : '');
      ck.onclick = () => { const on = MU.toggleMission(key); ck.classList.toggle('on', on); ck.textContent = on ? '✔' : ''; on ? MU.sfx.star() : MU.sfx.click(); };
      mc.append(h('div', { class: 'mission' }, ck, h('div', { style: { flex: 1 } }, h('b', null, (i + 1) + '. ' + m.title), h('div', { class: 'small mt8' }, m.kid, ' ', MU.sayBtn(m.kid)),
        m.parts && m.parts.length ? h('div', { class: 'parts' }, m.parts.map(x => h('span', null, x))) : null,
        m.sprout ? h('div', { class: 'small muted mt8' }, '🌱 Little ones: ' + m.sprout) : null)));
    });
    wrap.append(mc);

    wrap.append(h('h3', { class: 'sec' }, '📖 Words to know'));
    const def = h('div', { class: 'vdef' }, 'Tap a word!');
    wrap.append(h('div', { class: 'vocab' }, u.vocab.map(v => h('button', { onclick: () => { def.textContent = v.w + ': ' + v.d; MU.say(v.w + '. ' + v.d); } }, v.w))), def);
    wrap.append(h('div', { class: 'card flat mt24 center' }, h('div', { class: 'bigem', style: { filter: st.badge ? 'none' : 'grayscale(1)', opacity: st.badge ? 1 : .4 } }, u.badge.emoji), h('b', null, u.badge.name),
      h('p', { class: 'muted small mt8' }, st.badge ? u.badge.earned : u.badge.how)));
    wrap.append(h('div', { style: { height: '30px' } }));
    return wrap;
  }

  /* ---------- lab ---------- */
  function screenLab(id) {
    const lab = MU.labs[id]; if (!lab) return h('p', null, 'Lab not found');
    const u = MU.unit(lab.unit);
    const wrap = h('div', { style: { '--c': u ? u.color : '#6B4FD8' } });
    wrap.append(MU.topbar(lab.emoji + ' ' + lab.title, lab.unit ? '/unit/' + lab.unit : '/studio', MU.starsEl(MU.labStars(id))));
    const root = h('div', null); wrap.append(root);
    const ctx = {
      root, band: MU.band(), lvl: MU.lvl(), unit: u,
      finish(score, max, msg) {
        const ratio = max ? score / max : 1; const stars = ratio >= .9 ? 3 : ratio >= .6 ? 2 : 1;
        const prev = MU.labStars(id);
        MU.recordLab(id, stars, score, max);
        MU.sfx.win(); if (stars === 3) MU.confetti();
        MU.modal(h('div', null, h('div', { class: 'bigem' }, ['🙂', '😀', '🤩', '🏆'][stars]), h('h2', null, ['', 'Nice work!', 'Great job!', 'Bravo!'][stars]),
          h('div', { class: 'mt8', style: { fontSize: '2rem' } }, MU.starsEl(stars)),
          h('p', { class: 'muted mt8' }, msg || (max > 1 ? score + ' out of ' + max : 'Lab complete!')),
          prev && stars <= prev ? h('p', { class: 'small muted mt8' }, 'Your best is ' + prev + ' ⭐') : null,
          h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } },
            h('button', { class: 'btn ghost', onclick: () => { MU.closeModal(); render(); } }, '🔁 Again'),
            h('button', { class: 'btn mint', onclick: () => { MU.closeModal(); MU.go(lab.unit ? '/unit/' + lab.unit : '/studio'); } }, lab.unit ? 'Back to movement' : 'Back to studio'))));
      },
      sayPrompt(text) { return h('div', { class: 'prompt' }, text, ' ', MU.sayBtn(text)); }
    };
    try { lab.run(ctx); } catch (e) { console.error(e); root.append(h('div', { class: 'card' }, 'This lab hit a snag: ' + e.message)); }
    return wrap;
  }

  /* ---------- quiz ---------- */
  function screenQuiz(id) {
    const u = MU.unit(id); if (!u) return h('p', null, 'Movement not found');
    const wrap = h('div', { style: { '--c': u.color } });
    wrap.append(MU.topbar('❓ ' + u.title + ' quiz', '/unit/' + u.id));
    const qs = MU.shuffle(u.quiz).slice(0, 5);
    let i = 0, right = 0;
    const box = h('div', { class: 'stage' }); wrap.append(box);
    function show() {
      box.innerHTML = '';
      const q = qs[i];
      const order = MU.shuffle(q.opts.map((o, idx) => ({ o, ok: idx === q.a })));
      const fbk = h('div', { class: 'feedback' });
      const next = h('button', { class: 'btn mint wide mt12 hide' }, i === qs.length - 1 ? 'See my score' : 'Next →');
      const btns = order.map(x => {
        const b = h('button', { class: 'choice' }, x.o);
        b.onclick = () => {
          btns.forEach(bb => bb.disabled = true);
          if (x.ok) { right++; b.classList.add('good'); fbk.textContent = '✅ Yes! ' + q.why; fbk.className = 'feedback good'; MU.sfx.ok(); }
          else { b.classList.add('bad'); btns[order.findIndex(y => y.ok)].classList.add('good'); fbk.textContent = '💡 ' + q.why; fbk.className = 'feedback bad'; MU.sfx.bad(); }
          next.classList.remove('hide');
        };
        return b;
      });
      next.onclick = () => { MU.stopAll(); if (++i < qs.length) show(); else done(); };
      box.append(h('div', { class: 'progress' }, h('i', { style: { width: (i / qs.length * 100) + '%' } })),
        h('div', { class: 'prompt' }, q.q, ' ', MU.sayBtn(q.q)),
        q.snd ? h('div', { class: 'center' }, MU.hearBtn('Hear it', () => { MU.stopAll(); MU.play(q.snd.seq, q.snd); })) : null,
        h('div', { class: 'choices' }, btns), fbk, next);
      if (q.snd) MU.after(() => MU.play(q.snd.seq, q.snd), 350);
    }
    function done() {
      const pct = Math.round(right / qs.length * 100);
      MU.recordQuiz(u.id, pct);
      const pass = pct >= 70; pass ? MU.sfx.win() : MU.sfx.click(); if (pct === 100) MU.confetti();
      box.innerHTML = '';
      box.append(h('div', { class: 'center' }, h('div', { class: 'bigem' }, pass ? '🎉' : '💪'), h('h2', null, right + ' out of ' + qs.length),
        h('p', { class: 'muted mt8' }, pass ? 'You passed the movement quiz!' : 'So close! Try the labs again, then have another go.'),
        h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: render }, '🔁 Try again'), h('button', { class: 'btn mint', onclick: () => MU.go('/unit/' + u.id) }, 'Back to movement'))));
    }
    show();
    return wrap;
  }

  /* ---------- badges ---------- */
  function screenBadges() {
    const pr = MU.PR(); const wrap = h('div', null, MU.topbar('My badges', '/', MU.starPill()));
    const grid = h('div', { class: 'sprouts' });
    MU.units.forEach(u => {
      const got = !!pr.badges[u.id];
      grid.append(h('button', { class: 'toy', style: { background: got ? u.color : '#cfd6e2' }, onclick: () => got ? MU.badgeModal(u) : MU.go('/unit/' + u.id) },
        h('span', { class: 'em', style: { filter: got ? 'none' : 'grayscale(1)', opacity: got ? 1 : .5 } }, u.badge.emoji), h('span', null, u.badge.name), h('small', { style: { fontFamily: 'Nunito', fontWeight: 700, opacity: .9 } }, got ? 'Earned!' : 'Movement ' + u.id)));
    });
    wrap.append(grid);
    const heard = MU.listenedCount();
    const tiers = [[5, '🎧', 'Curious Ears'], [15, '🎼', 'Concert-goer'], [30, '🏛️', 'Music Historian']];
    wrap.append(h('div', { class: 'card mt24' }, h('h3', null, '🎧 Listening badges'), h('p', { class: 'muted small mt8' }, 'Mark pieces as heard on the Listen shelf. You have heard ' + heard + '.'),
      h('div', { class: 'wrapx mt12' }, tiers.map(([n, e, t]) => h('span', { class: 'chip', style: { opacity: heard >= n ? 1 : .4, background: heard >= n ? '#fff0c2' : '#eef2fb' } }, e + ' ' + t + ' (' + n + ')')))));
    const all = MU.units.every(u => pr.badges[u.id]);
    const mk = (key, label) => {
      const ck = h('button', { style: { width: '34px', height: '34px', borderRadius: '11px', border: '3px solid #F2645A', background: pr.missions[key] ? '#F2645A' : '#fff', color: '#fff', flex: 'none' } }, pr.missions[key] ? '✔' : '');
      ck.onclick = () => { const on = MU.toggleMission(key); ck.textContent = on ? '✔' : ''; ck.style.background = on ? '#F2645A' : '#fff'; render(); };
      return h('div', { class: 'row mt12' }, ck, h('span', null, label));
    };
    const master = all && pr.missions.recital && pr.missions.taught;
    wrap.append(h('div', { class: 'card mt24 center' }, h('div', { class: 'bigem', style: { filter: master ? 'none' : 'grayscale(1)', opacity: master ? 1 : .4 } }, '👑'), h('h3', null, 'Maestro'),
      h('p', { class: 'muted small mt8' }, 'Earn all ' + MU.units.length + ' badges, give a family recital, and teach a song or a rhythm to a sibling.'),
      h('div', { style: { textAlign: 'left', maxWidth: '360px', margin: '10px auto 0' } }, h('div', { class: 'row' }, h('span', null, all ? '✅' : '⬜'), h('span', null, 'All ' + MU.units.length + ' badges')), mk('recital', 'I gave a family recital'), mk('taught', 'I taught a song or rhythm to someone'))));
    if (master) wrap.append(h('div', { class: 'card center' }, h('b', null, '🎓 Maestro!'), h('p', { class: 'muted small mt8' }, 'Take a bow. 👏')));
    return wrap;
  }

  /* ---------- listening journal ---------- */
  function screenJournal(sub, qs) {
    const pid = D.cur;
    if (sub === 'new') return journalEditor(pid, qs);
    const list = MU.notes.all(pid);
    const wrap = h('div', null, MU.topbar('📓 Listening journal', '/', h('button', { class: 'btn mint', onclick: () => MU.go('/journal/new') }, '+ New page')));
    wrap.append(h('p', { class: 'muted small mt12' }, 'Listen, notice, draw what you hear and write what you felt. Pages stay on this device.'));
    if (!list.length) wrap.append(h('div', { class: 'card center' }, h('div', { class: 'bigem' }, '✏️'), h('p', { class: 'mt8' }, 'No pages yet. Tap “New page” after your next listen!')));
    list.slice().reverse().forEach(n => wrap.append(h('button', { class: 'nbitem', onclick: () => viewNote(n) }, n.img ? h('img', { src: n.img, alt: '' }) : h('span', { style: { fontSize: '2rem', width: '84px', textAlign: 'center' } }, '📄'),
      h('span', { style: { flex: 1 } }, h('b', null, n.title || 'My page'), h('br'), h('span', { class: 'muted small' }, new Date(n.ts).toLocaleDateString() + (n.mood ? ' · ' + n.mood : ''))))));
    return wrap;
  }
  function viewNote(n) {
    MU.modal(h('div', { style: { textAlign: 'left' } }, h('h3', null, n.title || 'My page'), n.img ? h('img', { src: n.img, style: { width: '100%', borderRadius: '12px', border: '2px solid var(--line)', margin: '8px 0' }, alt: '' }) : null,
      n.noticed && n.noticed.length ? h('p', null, h('b', null, 'I noticed: '), n.noticed.join(', ')) : null,
      n.mood ? h('p', { class: 'mt8' }, h('b', null, 'It felt: '), n.mood) : null,
      h('p', { class: 'mt8' }, h('b', null, 'In my words: '), n.words || '—'),
      h('div', { class: 'wrapx mt16' }, h('button', { class: 'btn ghost', onclick: () => { if (confirm('Delete this page?')) { MU.notes.put(D.cur, MU.notes.all(D.cur).filter(x => x.id !== n.id)); MU.closeModal(); render(); } } }, '🗑 Delete'), h('button', { class: 'btn', onclick: MU.closeModal }, 'Close'))), { dismiss: true });
  }
  function journalEditor(pid, qs) {
    const wrap = h('div', { class: 'nb' }, MU.topbar('New journal page', '/journal'));
    const pcs = (MU.pieces || []);
    const sel = h('select', { class: 'inp' }, [h('option', { value: '' }, 'Something else I heard')].concat(pcs.map(p => h('option', { value: p.id, selected: p.id === qs.get('piece') }, p.title + ' (' + p.composer + ')'))));
    const other = h('input', { class: 'inp mt8', placeholder: 'What was it called? (optional)', maxlength: 60 });
    const NOTICE = ['fast', 'slow', 'loud', 'soft', 'high', 'low', 'smooth', 'bouncy', 'steady beat', 'changed speed', 'strings', 'woodwinds', 'brass', 'drums', 'singing', 'repeated tune'];
    const picked = new Set();
    const nbox = h('div', { class: 'wrapx' }, NOTICE.map(x => { const b = h('button', { class: 'chip btnlike' }, x); b.onclick = () => { if (picked.has(x)) picked.delete(x); else picked.add(x); b.style.background = picked.has(x) ? '#ffe9a8' : ''; }; return b; }));
    const MOODS = ['😊 happy', '😢 sad', '😮 amazed', '🌊 calm', '⚡ excited', '😴 sleepy', '😨 spooky', '🤗 cosy'];
    let mood = '';
    const mbox = h('div', { class: 'wrapx' }, MOODS.map(x => { const b = h('button', { class: 'chip btnlike' }, x); b.onclick = () => { mood = x; mbox.querySelectorAll('button').forEach(y => y.style.background = ''); b.style.background = '#ffe9a8'; }; return b; }));
    const words = h('textarea', { class: 'inp', rows: 3, placeholder: 'What did you picture? What was your favourite part?' });
    const cv = h('canvas', { width: 600, height: 400 }); const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 600, 400); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2B1B4D';
    let drawing = false, last = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 600 / r.width, (e.clientY - r.top) * 400 / r.height]; };
    cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last[0], last[1], 2.5, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; });
    const stop = () => { drawing = false; }; cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    const colors = ['#2B1B4D', '#F2645A', '#6B4FD8', '#12B58C', '#F5B83D', '#3A9BDC'];
    const sw = h('div', { class: 'swatches' });
    colors.forEach((c, i) => sw.append(h('button', { class: i === 0 ? 'on' : '', style: { background: c }, 'aria-label': 'Colour ' + (i + 1), onclick: ev => { ctx.strokeStyle = c; sw.querySelectorAll('button').forEach(b => b.classList.remove('on')); ev.currentTarget.classList.add('on'); } })));
    sw.append(h('button', { class: 'chip btnlike', style: { marginLeft: 'auto' }, onclick: () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 600, 400); } }, 'Clear'));
    wrap.append(h('div', { class: 'card' }, h('label', { class: 'lbl' }, 'What did you listen to?'), sel, other,
      h('label', { class: 'lbl' }, '1. What did you notice?'), nbox, h('label', { class: 'lbl' }, '2. How did it feel?'), mbox,
      h('label', { class: 'lbl' }, '3. Draw the music (shapes, colours, a picture, anything)'), sw, cv, h('label', { class: 'lbl' }, '4. In your own words'), words,
      h('button', { class: 'btn big mint wide mt16', onclick: () => {
        const pc = pcs.find(p => p.id === sel.value);
        const note = { id: 'n' + Date.now(), ts: Date.now(), piece: sel.value || null, title: pc ? pc.title : (other.value.trim() || 'My page'), noticed: Array.from(picked), mood, words: words.value.trim(), img: cv.toDataURL('image/jpeg', 0.6) };
        const list = MU.notes.all(pid).concat(note).slice(-40);
        if (!MU.notes.put(pid, list)) { delete note.img; list[list.length - 1] = note; MU.notes.put(pid, list); MU.toast('Saved without the drawing (storage is full)'); } else MU.toast('Page saved! 📓');
        if (pc) MU.markListened(pc.id);
        MU.sfx.ok(); MU.go('/journal');
      } }, 'Save page')));
    return wrap;
  }

  /* ---------- Little Ones (toddler toys) ---------- */
  function screenLittle(toy) {
    if (toy && LITTLE[toy]) { const t = LITTLE[toy]; const w = h('div', null, MU.topbar(t.emoji + ' ' + t.title, '/little')); const stage = h('div', { class: 'stage center' }); w.append(stage); t.run(stage); return w; }
    const wrap = h('div', null, MU.topbar('🌱 Little Ones', '/'));
    wrap.append(h('p', { class: 'muted small mt12' }, 'Big, safe, screen-sized music toys for the smallest explorers. A grown-up can sit alongside, sing along and copy what they do!'));
    const grid = h('div', { class: 'sprouts mt12' });
    Object.keys(LITTLE).forEach(k => { const t = LITTLE[k]; grid.append(h('button', { class: 'toy', style: { background: t.color }, onclick: () => { MU.say(t.title); MU.go('/little/' + k); } }, h('span', { class: 'em' }, t.emoji), t.title)); });
    wrap.append(grid);
    return wrap;
  }
  const LITTLE = MU.LITTLE = {
    drum: {
      emoji: '🥁', title: 'Big Drum', color: '#F2645A', run(st) {
        const d = h('button', { class: 'bigbtn drumbtn', style: { margin: '10px auto', fontSize: '5rem', minWidth: '220px', minHeight: '220px', borderRadius: '50%', background: '#F2645A', boxShadow: '0 10px 0 #b23d35' } }, '🥁');
        let n = 0;
        d.addEventListener('pointerdown', e => { e.preventDefault(); n++; MU.drum(n % 4 === 0 ? 'tom' : 'kick', { vol: .6 }); d.classList.add('held'); if (n % 8 === 0) MU.say('Boom!'); });
        const up = () => d.classList.remove('held'); d.addEventListener('pointerup', up); d.addEventListener('pointerleave', up); d.addEventListener('pointercancel', up);
        st.append(h('div', { class: 'prompt' }, 'Pat the drum!'), d, h('div', { class: 'row mt16', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: () => MU.drum('snare', { vol: .6 }) }, 'Snare'), h('button', { class: 'btn ghost', onclick: () => MU.drum('cymbal', { vol: .5 }) }, 'Crash'), h('button', { class: 'btn ghost', onclick: () => MU.drum('triangle', { vol: .6 }) }, 'Ting')));
      }
    },
    keys: {
      emoji: '🌈', title: 'Rainbow Keys', color: '#6B4FD8', run(st) {
        const notes = [['C4', '#F2645A'], ['D4', '#F5A33D'], ['E4', '#F5D63D'], ['G4', '#12B58C'], ['A4', '#3A9BDC']];
        const row = h('div', { class: 'row', style: { justifyContent: 'center', alignItems: 'stretch', gap: '8px' } });
        notes.forEach(([n, c], i) => { const k = h('button', { class: 'rkey', style: { background: c, height: (150 + i * 14) + 'px' }, 'aria-label': n }, '');
          k.addEventListener('pointerdown', e => { e.preventDefault(); MU.note(n, .8, { inst: 'piano', vol: .3 }); k.classList.add('held'); }); const up = () => k.classList.remove('held'); k.addEventListener('pointerup', up); k.addEventListener('pointerleave', up); row.append(k); });
        st.append(h('div', { class: 'prompt' }, 'Tap the colours and make a song!'), row, h('p', { class: 'muted small mt16' }, 'Short keys sound low. Tall keys sound high.'));
      }
    },
    loud: {
      emoji: '🔔', title: 'Loud & Quiet', color: '#E08A00', run(st) {
        const big = h('button', { class: 'bigbtn', style: { minWidth: '170px', minHeight: '170px', fontSize: '4.5rem', background: '#F5B83D' } }, '🔔');
        const small = h('button', { class: 'bigbtn', style: { minWidth: '80px', minHeight: '80px', fontSize: '2rem', background: '#cfe3ff', boxShadow: '0 5px 0 #8bb0e0' } }, '🔔');
        big.addEventListener('pointerdown', e => { e.preventDefault(); MU.note('G5', 1.2, { inst: 'bell', vol: .5 }); MU.say('Loud!'); });
        small.addEventListener('pointerdown', e => { e.preventDefault(); MU.note('G5', 1.2, { inst: 'bell', vol: .06 }); MU.say('Quiet.'); });
        st.append(h('div', { class: 'prompt' }, 'Big bell = LOUD. Little bell = quiet.'), h('div', { class: 'row', style: { justifyContent: 'center', gap: '24px' } }, big, small));
      }
    },
    speed: {
      emoji: '🐢', title: 'Fast & Slow', color: '#12B58C', run(st) {
        let clk = null, who = '';
        const pet = h('div', { style: { fontSize: '6rem', display: 'inline-block', transition: 'transform .1s' } }, '🐢');
        const say = h('div', { class: 'prompt' }, 'Pick one and clap along!');
        function go(kind) {
          if (clk) { clk.stop(); clk = null; }
          if (who === kind) { who = ''; pet.textContent = '🎵'; say.textContent = 'Stopped. Pick one!'; return; }
          who = kind; const bpm = kind === 'turtle' ? 56 : 160; pet.textContent = kind === 'turtle' ? '🐢' : '🐇'; say.textContent = kind === 'turtle' ? 'Slow… slow… slow…' : 'Fast fast fast fast!'; MU.say(kind === 'turtle' ? 'Slow' : 'Fast');
          clk = MU.clock({ bpm, steps: 4, onStep: (i, when, ms) => { MU.drum(i === 0 ? 'tom' : 'wood', { vol: .4, when: ms }); setTimeout(() => { pet.style.transform = 'translateY(-14px)'; setTimeout(() => pet.style.transform = '', 90); }, ms * 1000); } }); clk.start();
        }
        st.append(say, pet, h('div', { class: 'row mt16', style: { justifyContent: 'center', gap: '16px' } },
          h('button', { class: 'bigbtn', style: { minWidth: '110px', minHeight: '110px', background: '#bfe9d6', boxShadow: '0 7px 0 #7cc4a6' }, onclick: () => go('turtle') }, '🐢'),
          h('button', { class: 'bigbtn', style: { minWidth: '110px', minHeight: '110px', background: '#ffd9b8', boxShadow: '0 7px 0 #e0a56f' }, onclick: () => go('rabbit') }, '🐇')));
      }
    },
    highlow: {
      emoji: '🐦', title: 'High & Low', color: '#3A9BDC', run(st) {
        const mk = (e, note, inst, word, bg, sh) => { const b = h('button', { class: 'bigbtn', style: { minWidth: '130px', minHeight: '130px', background: bg, boxShadow: '0 7px 0 ' + sh } }, e); b.addEventListener('pointerdown', ev => { ev.preventDefault(); MU.note(note, .9, { inst, vol: .35 }); MU.say(word); }); return b; };
        st.append(h('div', { class: 'prompt' }, 'The bird sings HIGH. The bear sings LOW.'),
          h('div', { style: { height: '24px' } }),
          h('div', { class: 'row', style: { justifyContent: 'center', alignItems: 'flex-start', gap: '20px' } }, mk('🐦', 'C6', 'flute', 'High', '#cfe8ff', '#8ab8e6'), mk('🐻', 'C3', 'cello', 'Low', '#e8d4bd', '#b39770')));
      }
    },
    lullaby: {
      emoji: '🌙', title: 'Lullaby Box', color: '#4B3C8F', run(st) {
        const moon = h('div', { style: { fontSize: '7rem', animation: 'floaty 3s ease-in-out infinite' } }, '🌙');
        const seq = [['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]];
        const stars = h('div', { style: { fontSize: '2rem', letterSpacing: '8px', minHeight: '2.4rem' } }, '');
        const b = h('button', { class: 'bigbtn', style: { margin: '14px auto 0', minWidth: '170px' } }, '▶');
        b.onclick = () => { MU.stopAll(); stars.textContent = ''; MU.play(seq, { tempo: 66, inst: 'glock', noteVol: .3, onNote: (i) => { stars.textContent += '⭐'; } }); };
        st.append(h('div', { class: 'prompt' }, 'Press play for a lullaby.'), moon, stars, b);
      }
    }
  };

  /* ================= start ================= */
  MU.start = function () {
    // Harbor hand-off: ?from=harbor&family=MA-XXXX&child=<id>&view=parent
    const q = new URLSearchParams(location.search);
    MU.fromHarbor = q.get('from') === 'harbor';
    if (MU.fromHarbor) { try { sessionStorage.setItem('mu_harbor_managed', '1'); } catch (e) { } }
    const refresh = ok => { if (ok && !document.querySelector('.modal')) { const r = seg().parts[0]; if (!r || r === 'badges') render(); } };
    const boot = async () => {
      if (q.get('family') && (q.get('family') !== D.fam || MU.fromHarbor)) await MU.joinFamily(q.get('family'), MU.fromHarbor);
      if (q.get('child') && D.profiles.some(p => p.id === q.get('child'))) { D.cur = q.get('child'); save(); }
      if (q.get('view') === 'parent' && MU.fromHarbor) { try { sessionStorage.setItem('mu_harbor_parent', '1'); } catch (e) { } location.hash = '#/parent'; }
      render();
      if (D.fam) cloudPull().then(refresh);
    };
    window.addEventListener('hashchange', render);
    // any first touch unlocks audio on iOS/Safari
    window.addEventListener('pointerdown', () => { try { MU.ac(); } catch (e) { } }, { once: true, capture: true });
    if (q.get('family') || q.get('child') || q.get('view')) boot(); else { render(); if (D.fam) cloudPull().then(refresh); }
  };
})();
