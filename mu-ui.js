/* Music Adventure - shared widgets: melodies, keyboard, staff, note shapes, round-based question engine. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h, s = MU.s;

  /* ================= melody library (public-domain tunes + short themes; notes typed by hand) ================= */
  const R = (n, b) => [n, b];
  const rep = (n, b, k) => Array.from({ length: k }, () => [n, b]);
  MU.MEL = {
    hotcross: { title: 'Hot Cross Buns', tempo: 100, seq: [R('E4', 1), R('D4', 1), R('C4', 2), R('E4', 1), R('D4', 1), R('C4', 2), ...rep('C4', .5, 4), ...rep('D4', .5, 4), R('E4', 1), R('D4', 1), R('C4', 2)] },
    mary: { title: 'Mary Had a Little Lamb', tempo: 108, seq: [R('E4', 1), R('D4', 1), R('C4', 1), R('D4', 1), R('E4', 1), R('E4', 1), R('E4', 2), R('D4', 1), R('D4', 1), R('D4', 2), R('E4', 1), R('G4', 1), R('G4', 2), R('E4', 1), R('D4', 1), R('C4', 1), R('D4', 1), R('E4', 1), R('E4', 1), R('E4', 1), R('E4', 1), R('D4', 1), R('D4', 1), R('E4', 1), R('D4', 1), R('C4', 4)] },
    twinkle: { title: 'Twinkle, Twinkle, Little Star', tempo: 100, seq: [R('C4', 1), R('C4', 1), R('G4', 1), R('G4', 1), R('A4', 1), R('A4', 1), R('G4', 2), R('F4', 1), R('F4', 1), R('E4', 1), R('E4', 1), R('D4', 1), R('D4', 1), R('C4', 2), R('G4', 1), R('G4', 1), R('F4', 1), R('F4', 1), R('E4', 1), R('E4', 1), R('D4', 2), R('G4', 1), R('G4', 1), R('F4', 1), R('F4', 1), R('E4', 1), R('E4', 1), R('D4', 2), R('C4', 1), R('C4', 1), R('G4', 1), R('G4', 1), R('A4', 1), R('A4', 1), R('G4', 2), R('F4', 1), R('F4', 1), R('E4', 1), R('E4', 1), R('D4', 1), R('D4', 1), R('C4', 2)] },
    ode: { title: 'Ode to Joy (Beethoven)', tempo: 108, seq: [R('E4', 1), R('E4', 1), R('F4', 1), R('G4', 1), R('G4', 1), R('F4', 1), R('E4', 1), R('D4', 1), R('C4', 1), R('C4', 1), R('D4', 1), R('E4', 1), R('E4', 1.5), R('D4', .5), R('D4', 2), R('E4', 1), R('E4', 1), R('F4', 1), R('G4', 1), R('G4', 1), R('F4', 1), R('E4', 1), R('D4', 1), R('C4', 1), R('C4', 1), R('D4', 1), R('E4', 1), R('D4', 1.5), R('C4', .5), R('C4', 2)] },
    frere: { title: 'Frère Jacques', tempo: 108, seq: [R('C4', 1), R('D4', 1), R('E4', 1), R('C4', 1), R('C4', 1), R('D4', 1), R('E4', 1), R('C4', 1), R('E4', 1), R('F4', 1), R('G4', 2), R('E4', 1), R('F4', 1), R('G4', 2), R('G4', .5), R('A4', .5), R('G4', .5), R('F4', .5), R('E4', 1), R('C4', 1), R('G4', .5), R('A4', .5), R('G4', .5), R('F4', .5), R('E4', 1), R('C4', 1), R('C4', 1), R('G3', 1), R('C4', 2), R('C4', 1), R('G3', 1), R('C4', 2)] },
    fate: { title: 'Fate motif (Beethoven 5)', tempo: 100, seq: [R(null, .5), R('G4', .5), R('G4', .5), R('G4', .5), R('Eb4', 3), R(null, .5), R('F4', .5), R('F4', .5), R('F4', .5), R('D4', 3)] },
    elise: { title: 'Für Elise (opening)', tempo: 132, seq: [R('E5', .5), R('D#5', .5), R('E5', .5), R('D#5', .5), R('E5', .5), R('B4', .5), R('D5', .5), R('C5', .5), R('A4', 1.5), R(null, .5), R('C4', .5), R('E4', .5), R('A4', .5), R('B4', 1.5), R(null, .5), R('E4', .5), R('G#4', .5), R('B4', .5), R('C5', 1.5)] },
    mountain: { title: 'Hall of the Mountain King (opening)', tempo: 90, seq: [R('B3', .5), R('C#4', .5), R('D4', .5), R('E4', .5), R('F#4', .5), R('D4', .5), R('F#4', 1.5), R('F4', .5), R('C#4', .5), R('F4', 1.5)] },
    canon: { title: 'Canon in D: the bass line', tempo: 66, seq: [R('D3', 2), R('A2', 2), R('B2', 2), R('F#2', 2), R('G2', 2), R('D2', 2), R('G2', 2), R('A2', 2)] },
    joy: { title: 'Joy to the World (a scale going down)', tempo: 104, seq: [R('C5', 1.5), R('B4', .5), R('A4', 1), R('G4', 1.5), R('F4', .5), R('E4', 1), R('D4', 1), R('C4', 2)] }
  };
  MU.playMel = function (id, o) { const m = MU.MEL[id]; if (!m) return null; MU.stopAll(); return MU.play(m.seq, Object.assign({ tempo: m.tempo, inst: 'piano' }, o || {})); };

  /* ================= note name <-> staff step ================= */
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  MU.stepOf = name => { const m = /^([A-G])[#b]?(-?\d)$/.exec(name); return LETTERS.indexOf(m[1]) + 7 * Number(m[2]); };
  MU.nameOfStep = st => LETTERS[((st % 7) + 7) % 7] + Math.floor(st / 7);
  MU.letterOf = name => name[0];
  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'];
  MU.solfegeOf = name => SOLFEGE[LETTERS.indexOf(name[0])]; // fixed-do in C major; fine for the C-based labs
  MU.SOLFEGE = SOLFEGE;

  /* ================= piano keyboard ================= */
  MU.keyboard = function (opts) {
    opts = opts || {};
    const from = MU.midi(opts.from || 'C4'), to = MU.midi(opts.to || 'C5');
    const isBlack = m => [1, 3, 6, 8, 10].includes(m % 12);
    const whites = []; for (let m = from; m <= to; m++) if (!isBlack(m)) whites.push(m);
    const wW = 100 / whites.length;
    const el = h('div', { class: 'kb', style: { height: (opts.height || 150) + 'px' } });
    const keys = {};
    let labels = opts.labels || 'none';
    function labelFor(m) {
      const nm = MU.nameOf(m);
      if (labels === 'names') return nm.replace(/\d/, '');
      if (labels === 'full') return nm;
      if (labels === 'solfege') return /#/.test(nm) ? '' : MU.solfegeOf(nm);
      return '';
    }
    function press(m, k) {
      const nm = MU.nameOf(m);
      MU.note(nm, opts.dur || .7, { inst: opts.inst || 'piano', vol: .3 });
      k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 160);
      opts.onPlay && opts.onPlay(nm, m);
    }
    let wi = 0;
    for (let m = from; m <= to; m++) {
      const black = isBlack(m);
      const k = h('button', { class: 'key ' + (black ? 'blk' : 'wht'), 'data-n': MU.nameOf(m), 'aria-label': MU.nameOf(m) });
      if (black) { k.style.left = (wi * wW - wW * 0.3) + '%'; k.style.width = (wW * 0.6) + '%'; }
      else { k.style.left = (wi * wW) + '%'; k.style.width = wW + '%'; wi++; }
      k.addEventListener('pointerdown', e => { e.preventDefault(); press(m, k); });
      const lab = h('span', { class: 'kl' }, labelFor(m)); k.append(lab); k._lab = lab; k._m = m;
      keys[MU.nameOf(m)] = k; el.append(k);
    }
    // keep black keys above white ones in DOM order
    Array.from(el.querySelectorAll('.blk')).forEach(b => el.append(b));
    const api = {
      el, keys,
      key: n => keys[typeof n === 'number' ? MU.nameOf(n) : n],
      flash(n, cls, ms) { const k = api.key(n); if (!k) return; k.classList.add(cls || 'hit'); setTimeout(() => k.classList.remove(cls || 'hit'), ms || 260); },
      mark(n, cls) { const k = api.key(n); if (k) k.classList.add(cls || 'next'); },
      unmark(n, cls) { const k = api.key(n); if (k) k.classList.remove(cls || 'next'); },
      clear() { Object.values(keys).forEach(k => k.classList.remove('next', 'hit', 'bad', 'on')); },
      play(n, o) { const k = api.key(n); if (k) press(MU.midi(n), k); },
      setLabels(mode) { labels = mode; Object.values(keys).forEach(k => { k._lab.textContent = labelFor(k._m); }); }
    };
    return api;
  };

  /* ================= staff ================= */
  MU.staff = function (opts) {
    opts = opts || {};
    const clef = opts.clef || 'treble', g = 12, W = opts.w || 320;
    const bottom = clef === 'treble' ? 30 : 18;      // step of the bottom line (E4 / G2)
    const topLine = bottom + 8;
    const padSteps = 7;
    const H = (8 + padSteps * 2) * g / 2 + 10;
    const yOf = st => 5 + (topLine + padSteps - st) * g / 2;
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'staffsvg', role: 'img', 'aria-label': (clef === 'treble' ? 'Treble' : 'Bass') + ' clef staff' });
    for (let i = 0; i < 5; i++) { const y = yOf(bottom + i * 2); svg.append(s('line', { x1: 8, x2: W - 8, y1: y, y2: y, stroke: '#2B1B4D', 'stroke-width': 1.4 })); }
    svg.append(s('line', { x1: 8, x2: 8, y1: yOf(bottom), y2: yOf(topLine), stroke: '#2B1B4D', 'stroke-width': 2 }));
    if (clef === 'treble') {
      svg.append(s('text', { x: 14, y: yOf(32) + g * 1.0, 'font-size': g * 3.6, 'font-family': 'Georgia,serif', 'font-style': 'italic', 'font-weight': 700, fill: '#6B4FD8' }, 'G'));
      svg.append(s('text', { x: 14, y: yOf(30) + g * 2.4, 'font-size': g * 1.0, 'font-family': 'Nunito,sans-serif', 'font-weight': 800, fill: '#6B4FD8' }, 'treble'));
    } else {
      svg.append(s('text', { x: 14, y: yOf(24) + g * 1.0, 'font-size': g * 3.4, 'font-family': 'Georgia,serif', 'font-style': 'italic', 'font-weight': 700, fill: '#6B4FD8' }, 'F'));
      svg.append(s('circle', { cx: 56, cy: yOf(25), r: 2.4, fill: '#6B4FD8' })); svg.append(s('circle', { cx: 56, cy: yOf(23), r: 2.4, fill: '#6B4FD8' }));
      svg.append(s('text', { x: 14, y: yOf(18) + g * 2.4, 'font-size': g * 1.0, 'font-family': 'Nunito,sans-serif', 'font-weight': 800, fill: '#6B4FD8' }, 'bass'));
    }
    const layer = s('g', null); svg.append(layer);
    const x0 = 86;
    function noteShape(st, x, color, label) {
      const y = yOf(st), grp = s('g', null);
      for (let l = bottom - 2; l >= st; l -= 2) grp.append(s('line', { x1: x - 13, x2: x + 13, y1: yOf(l), y2: yOf(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
      for (let l = topLine + 2; l <= st; l += 2) grp.append(s('line', { x1: x - 13, x2: x + 13, y1: yOf(l), y2: yOf(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
      const up = st < bottom + 4;
      grp.append(s('line', up ? { x1: x + 7, x2: x + 7, y1: y, y2: y - g * 3.4, stroke: color || '#2B1B4D', 'stroke-width': 2 } : { x1: x - 7, x2: x - 7, y1: y, y2: y + g * 3.4, stroke: color || '#2B1B4D', 'stroke-width': 2 }));
      grp.append(s('ellipse', { cx: x, cy: y, rx: 8, ry: 5.8, fill: color || '#2B1B4D', transform: 'rotate(-20 ' + x + ' ' + y + ')' }));
      if (label) grp.append(s('text', { x, y: yOf(topLine + padSteps) + 4, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: color || '#2B1B4D' }, label));
      return grp;
    }
    const api = {
      el: svg, clef, bottom, topLine, yOf,
      set(notes, o) {
        o = o || {}; layer.innerHTML = '';
        const list = notes || []; const gap = Math.min(54, (W - x0 - 20) / Math.max(1, list.length));
        list.forEach((n, i) => { const nm = typeof n === 'string' ? n : n.name; const col = (n && n.color) || o.color; layer.append(noteShape(MU.stepOf(nm), x0 + i * gap, col, o.names ? nm.replace(/\d/, '') : (n && n.label))); });
      }
    };
    if (opts.notes) api.set(opts.notes, opts);
    if (opts.onPick) {
      const lo = opts.lo != null ? opts.lo : bottom - 2, hi = opts.hi != null ? opts.hi : topLine + 2;
      for (let st = lo; st <= hi; st++) {
        const r = s('rect', { x: x0 - 20, y: yOf(st) - g / 4, width: W - x0 - 4, height: g / 2, fill: 'transparent', style: { cursor: 'pointer' } });
        r.addEventListener('pointerdown', e => { e.preventDefault(); opts.onPick(MU.nameOfStep(st), st); });
        svg.append(r);
      }
    }
    return api;
  };
  MU.staffWrap = st => h('div', { class: 'svgwrap staffwrap' }, st.el);

  /* ================= note shapes ================= */
  MU.noteShape = function (kind, size) {
    size = size || 56;
    const open = kind === 'whole' || kind === 'half', stem = kind !== 'whole', flag = kind === 'eighth' || kind === 'sixteenth';
    const svg = s('svg', { viewBox: '0 0 40 60', width: size * 0.7, height: size, 'aria-hidden': 'true' });
    svg.append(s('ellipse', { cx: 16, cy: 46, rx: 11, ry: 8, fill: open ? '#fff' : '#2B1B4D', stroke: '#2B1B4D', 'stroke-width': open ? 3 : 1, transform: 'rotate(-20 16 46)' }));
    if (kind === 'whole') svg.append(s('ellipse', { cx: 16, cy: 46, rx: 3.6, ry: 7, fill: '#2B1B4D', transform: 'rotate(30 16 46)' }));
    if (stem) svg.append(s('line', { x1: 26, y1: 44, x2: 26, y2: 6, stroke: '#2B1B4D', 'stroke-width': 3 }));
    if (flag) { svg.append(s('path', { d: 'M26 6 C 36 12, 38 22, 32 32', fill: 'none', stroke: '#2B1B4D', 'stroke-width': 3.2 })); if (kind === 'sixteenth') svg.append(s('path', { d: 'M26 15 C 36 21, 38 31, 32 41', fill: 'none', stroke: '#2B1B4D', 'stroke-width': 3.2 })); }
    return svg;
  };
  MU.restShape = function (kind, size) {
    size = size || 56; const svg = s('svg', { viewBox: '0 0 40 60', width: size * 0.7, height: size, 'aria-hidden': 'true' });
    if (kind === 'whole') svg.append(s('rect', { x: 8, y: 20, width: 24, height: 9, fill: '#2B1B4D' }), s('line', { x1: 2, x2: 38, y1: 20, y2: 20, stroke: '#2B1B4D', 'stroke-width': 2 }));
    else if (kind === 'half') svg.append(s('rect', { x: 8, y: 29, width: 24, height: 9, fill: '#2B1B4D' }), s('line', { x1: 2, x2: 38, y1: 38, y2: 38, stroke: '#2B1B4D', 'stroke-width': 2 }));
    else svg.append(s('path', { d: 'M22 8 L14 22 L24 32 L14 44 C 12 48, 18 52, 24 48', fill: 'none', stroke: '#2B1B4D', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    return svg;
  };

  /* ================= generic question rounds (used by games and several labs) =================
   * cfg: { n, title, make(i) -> { prompt, visual?:Node, play?:()=>ctrl, opts:[string|Node], a:index, why? }, autoplay?:true } */
  MU.runRounds = function (ctx, cfg) {
    const n = cfg.n || 8; let i = 0, right = 0;
    const box = h('div', { class: 'stage' }); ctx.root.append(box);
    function show() {
      MU.stopAll(); box.innerHTML = '';
      const q = cfg.make(i);
      const order = MU.shuffle(q.opts.map((o, idx) => ({ o, ok: idx === q.a })));
      const fbk = h('div', { class: 'feedback' });
      const last = i === n - 1;
      const next = h('button', { class: 'btn mint wide mt12 hide' }, last ? 'See my score' : 'Next →');
      const btns = order.map(x => {
        const b = h('button', { class: 'choice' + (cfg.cls ? ' ' + cfg.cls : '') }, x.o);
        b.onclick = () => {
          btns.forEach(bb => bb.disabled = true);
          if (x.ok) { right++; b.classList.add('good'); fbk.textContent = '✅ ' + (q.why || 'Yes!'); fbk.className = 'feedback good'; MU.sfx.ok(); }
          else { b.classList.add('bad'); btns[order.findIndex(y => y.ok)].classList.add('good'); fbk.textContent = '💡 ' + (q.why || 'Not this time.'); fbk.className = 'feedback bad'; MU.sfx.bad(); }
          next.classList.remove('hide');
          q.after && q.after(x.ok);
        };
        return b;
      });
      next.onclick = () => { if (++i < n) show(); else ctx.finish(right, n); };
      box.append(h('div', { class: 'progress' }, h('i', { style: { width: (i / n * 100) + '%' } })),
        h('div', { class: 'prompt' }, q.prompt, ' ', MU.sayBtn(q.prompt)),
        q.visual || null,
        q.play ? h('div', { class: 'center mt8' }, MU.hearBtn(q.hearLabel || 'Hear it', () => { MU.stopAll(); q.play(); })) : null,
        h('div', { class: 'choices' + (cfg.cols ? ' cols' + cfg.cols : '') }, btns), fbk, next);
      if (q.play && cfg.autoplay !== false) MU.after(() => q.play(), 400);
    }
    show();
  };

  /* ================= small helpers ================= */
  MU.card = (...c) => h('div', { class: 'card' }, ...c);
  MU.noteRange = (a, b) => { const out = []; for (let m = MU.midi(a); m <= MU.midi(b); m++) out.push(MU.nameOf(m)); return out; };
  MU.whiteRange = (a, b) => MU.noteRange(a, b).filter(x => !/#/.test(x));
  MU.pulse = function (el, cls) { el.classList.remove(cls || 'pulse'); void el.offsetWidth; el.classList.add(cls || 'pulse'); };
  MU.ytLink = (q, label) => h('a', { class: 'btn ghost ytlink', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q), target: '_blank', rel: 'noopener' }, label || '▶ Find a real recording');
})();
