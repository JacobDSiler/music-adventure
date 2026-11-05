/* Music Adventure - Studio: Keyboard Tune Maker, Staff Songwriter, Song Studio (notes + beats), saved songs.
 * One shared editor (MU.songEditor). A song is N bars of 4/4, each bar = 8 eighth-note steps. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h, s = MU.s;
  const PER = 8, MAXBARS = 8;
  const LC = { C: '#E0529C', D: '#E4702A', E: '#B89400', F: '#12B58C', G: '#2F8FD0', A: '#6B4FD8', B: '#9B4FC0' };
  const LENS = [
    { len: 1, name: 'Eighth', kind: 'eighth', lvl: 2 }, { len: 2, name: 'Quarter', kind: 'quarter', lvl: 1 },
    { len: 3, name: 'Dotted quarter', kind: 'quarter', dot: true, lvl: 3 }, { len: 4, name: 'Half', kind: 'half', lvl: 1 },
    { len: 6, name: 'Dotted half', kind: 'half', dot: true, lvl: 3 }, { len: 8, name: 'Whole', kind: 'whole', lvl: 1 }
  ];
  const lenInfo = n => LENS.find(l => l.len === n) || { len: n, name: n + ' steps', kind: n >= 8 ? 'whole' : n >= 4 ? 'half' : n >= 2 ? 'quarter' : 'eighth' };
  const DRUMS = [{ k: 'kick', n: 'Kick', c: '#E0529C' }, { k: 'snare', n: 'Snare', c: '#6B4FD8' }, { k: 'hat', n: 'Hi-hat', c: '#12B58C' }, { k: 'tamb', n: 'Shaker', c: '#E08A00' }];
  const INSTS = [['piano', 'Piano'], ['flute', 'Flute'], ['xylophone', 'Xylophone'], ['violin', 'Violin'], ['harp', 'Harp']];
  const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const stepName = (st, sharp) => { const l = LET[((st % 7) + 7) % 7], o = Math.floor(st / 7); return l + (sharp ? '#' : '') + o; };
  const canSharp = st => ['C', 'D', 'F', 'G', 'A'].includes(LET[((st % 7) + 7) % 7]);
  const isSharp = n => n.indexOf('#') > -1;
  const pretty = n => n.replace('#', '♯');
  const LENS_SEC = 0.95;

  /* ---------------- saved songs (stored in the explorer's progress so they sync) ---------------- */
  function songsObj() { const pr = MU.PR(); if (!pr) return {}; if (!pr.songs) pr.songs = {}; return pr.songs; }
  MU.songList = () => Object.values(songsObj()).filter(x => x && !x.del).sort((a, b) => b.ts - a.ts);
  MU.saveSong = (data, id) => { const o = songsObj(); id = id || 's' + Date.now().toString(36); o[id] = Object.assign({}, data, { id, ts: Date.now() }); MU.save(); return id; };
  MU.deleteSong = id => { const o = songsObj(); o[id] = { id, del: true, ts: Date.now() }; MU.save(); };
  const pack = song => ({ bars: song.bars, tempo: song.tempo, inst: song.inst, mel: song.mel.map(e => e ? e.n + ':' + e.len : 0), drums: Object.fromEntries(Object.keys(song.drums).map(k => [k, song.drums[k].map(v => v ? 1 : 0)])) });
  const unpack = data => {
    const bars = Math.max(1, Math.min(MAXBARS, data.bars || 4)), T = bars * PER;
    const song = { bars, tempo: data.tempo || 90, inst: data.inst || 'piano', mel: [], drums: { kick: [], snare: [], hat: [], tamb: [] } };
    for (let i = 0; i < T; i++) { const e = data.mel && data.mel[i]; if (e) { const p = String(e).split(':'); song.mel[i] = { n: p[0], len: Number(p[1]) || 2 }; } else song.mel[i] = null; }
    Object.keys(song.drums).forEach(k => { for (let i = 0; i < T; i++) song.drums[k][i] = !!(data.drums && data.drums[k] && data.drums[k][i]); });
    return song;
  };
  /* play a saved song once (used by the Studio hub list) */
  MU.playSongData = function (data, onEnd) {
    const song = unpack(data), sd = 60 / song.tempo / 2;
    const clk = MU.clock({ bpm: song.tempo, stepsPerBeat: 2, steps: song.bars * PER, once: true, onEnd,
      onStep: (i, w, secs) => { const e = song.mel[i]; if (e) MU.note(e.n, Math.max(.12, e.len * sd * LENS_SEC), { when: secs, inst: song.inst, vol: .3 }); DRUMS.forEach(d => { if (song.drums[d.k][i]) MU.drum(d.k, { when: secs, vol: .6 }); }); } });
    clk.start(); return clk;
  };

  /* ---------------- tiny SVG helpers for the staff view ---------------- */
  function sharpShape(x, y, col) {
    const g = s('g', { stroke: col, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    g.append(s('line', { x1: x - 2.5, y1: y - 8, x2: x - 2.5, y2: y + 8 }), s('line', { x1: x + 2.5, y1: y - 9, x2: x + 2.5, y2: y + 7 }));
    g.append(s('line', { x1: x - 6, y1: y - 2, x2: x + 6, y2: y - 4, 'stroke-width': 2.4 }), s('line', { x1: x - 6, y1: y + 4, x2: x + 6, y2: y + 2, 'stroke-width': 2.4 }));
    return g;
  }

  /* =====================================================================================================
   * MU.songEditor(ctx, cfg)  cfg: { kind: 'keys'|'staff'|'studio', input: 'keys'|'grid', view: 'block'|'staff', drums: bool, bars }
   * ===================================================================================================== */
  MU.songEditor = function (ctx, cfg) {
    const lvl = ctx.lvl, keysMode = cfg.input === 'keys';
    const LO = MU.stepOf('C4'), HI = MU.stepOf(lvl >= 2 ? 'C6' : 'C5');
    const song = { bars: cfg.bars || 4, tempo: lvl === 1 ? 80 : 96, inst: 'piano', mel: [], drums: { kick: [], snare: [], hat: [], tamb: [] } };
    let view = cfg.view || 'block', bar = 0, sel = -1, cursor = 0, curLen = 2, sharpMode = false, showNames = lvl === 1, loop = true;
    let clk = null, playStep = -1, savedId = null, kb = null;
    const total = () => song.bars * PER;
    function fit() { const T = total(); song.mel.length = T; for (let i = 0; i < T; i++) { if (song.mel[i] === undefined) song.mel[i] = null; Object.keys(song.drums).forEach(k => { if (song.drums[k][i] === undefined) song.drums[k][i] = false; }); } Object.keys(song.drums).forEach(k => { song.drums[k].length = T; }); }
    fit();

    /* ----- model helpers ----- */
    function coverStart(step) { for (let b = step; b >= Math.max(0, step - 7); b--) { const e = song.mel[b]; if (e) return b + e.len > step ? b : -1; } return -1; }
    function place(step, name, len) {
      const barEnd = (Math.floor(step / PER) + 1) * PER; len = Math.max(1, Math.min(len, barEnd - step));
      const c = coverStart(step); if (c >= 0 && c < step) song.mel[c].len = step - c;
      for (let i = step; i < step + len; i++) song.mel[i] = null;
      song.mel[step] = { n: name, len }; return len;
    }
    const noteCount = () => song.mel.filter(Boolean).length;
    function sound(name, len) { MU.note(name, Math.min(1.2, Math.max(.25, (len || 2) * 60 / song.tempo / 2)), { inst: song.inst, vol: .3 }); }
    const drawSel = () => sel >= 0 && song.mel[sel] ? song.mel[sel] : null;

    /* ----- editing the selected note ----- */
    function editPitch(dir) {
      const e = drawSel(); if (!e) return; const st = MU.stepOf(e.n) + dir; if (st < LO || st > HI) return MU.toast(dir > 0 ? 'That is the highest note here' : 'That is the lowest note here');
      e.n = stepName(st, false); sound(e.n, e.len); render();
    }
    function editSharp() {
      const e = drawSel(); if (!e) return; const st = MU.stepOf(e.n);
      if (isSharp(e.n)) e.n = stepName(st, false); else if (canSharp(st) && st < HI) e.n = stepName(st, true); else return MU.toast('There is no sharp for that note');
      sound(e.n, e.len); render();
    }
    function editLen(len) {
      const e = drawSel(); if (!e) return;
      const barEnd = (Math.floor(sel / PER) + 1) * PER; len = Math.min(len, barEnd - sel);
      for (let i = sel + 1; i < sel + len; i++) song.mel[i] = null; e.len = len; sound(e.n, len); render();
    }
    function editMove(dir) {
      const e = drawSel(); if (!e) return; const ns = sel + dir, b0 = Math.floor(sel / PER) * PER;
      if (ns < b0 || ns + e.len > b0 + PER) return MU.toast('Use the bar tabs to work in another bar');
      const keep = e; song.mel[sel] = null;
      let ok = true; for (let i = ns; i < ns + e.len; i++) { if (coverStart(i) >= 0) ok = false; }
      if (!ok) { song.mel[sel] = keep; return MU.toast('Something is in the way. Move or delete it first.'); }
      song.mel[ns] = keep; sel = ns; render();
    }
    function editDelete() { if (sel < 0) return; song.mel[sel] = null; if (cursor > sel) cursor = sel; sel = -1; render(); }

    /* ----- adding notes ----- */
    function gridTap(step, st) {
      if (keysMode) { sel = -1; cursor = step; render(); return; }
      const name = stepName(st, sharpMode && canSharp(st) && st < HI);
      const len = place(step, name, curLen); sound(name, len); sel = -1; render();
    }
    function keyPress(nm) {
      const st = MU.stepOf(nm); if (st < LO || st > HI) return;
      if (drawSel()) { drawSel().n = nm; render(); return; }
      if (cursor >= total()) { MU.toast('The song is full. Add a bar or press play!'); return; }
      const len = place(cursor, nm, curLen); cursor += len; bar = Math.min(song.bars - 1, Math.floor(Math.min(cursor, total() - 1) / PER)); render();
    }
    function addRest() { if (cursor >= total()) return; const barEnd = (Math.floor(cursor / PER) + 1) * PER; cursor += Math.min(curLen, barEnd - cursor); bar = Math.min(song.bars - 1, Math.floor(Math.min(cursor, total() - 1) / PER)); render(); }
    function back() {
      if (cursor <= 0) return; const cs = coverStart(cursor - 1);
      if (cs >= 0) { song.mel[cs] = null; cursor = cs; } else cursor -= 1;
      bar = Math.floor(cursor / PER); sel = -1; render();
    }

    /* ----- UI skeleton ----- */
    const root = h('div', { class: 'stage' }); ctx.root.append(root);
    root.append(ctx.sayPrompt(cfg.prompt));
    const transport = h('div'), body = h('div'), editBox = h('div'), inputBox = h('div'), foot = h('div');
    root.append(transport, body, editBox, inputBox, foot);

    /* transport */
    const playBtn = h('button', { class: 'btn mint' }, '▶ Play');
    const tempoLbl = h('b', null, song.tempo + ' BPM');
    const tempo = h('input', { type: 'range', min: 50, max: 160, value: song.tempo, 'aria-label': 'Tempo' });
    tempo.oninput = () => { song.tempo = Number(tempo.value); tempoLbl.textContent = song.tempo + ' BPM'; clk && clk.setBpm(song.tempo); };
    const loopBtn = h('button', { class: 'chip btnlike on' }, '🔁 Loop');
    loopBtn.onclick = () => { loop = !loop; loopBtn.classList.toggle('on', loop); };
    function stop() { if (clk) { clk.stop(); clk = null; } playBtn.textContent = '▶ Play'; playStep = -1; markNow(); }
    function start() {
      stop(); MU.stopAll(); const sd = () => 60 / song.tempo / 2;
      clk = MU.clock({ bpm: song.tempo, stepsPerBeat: 2, steps: total(), once: !loop, onEnd: () => { clk = null; playBtn.textContent = '▶ Play'; playStep = -1; markNow(); },
        onStep: (i, w, secs) => {
          const e = song.mel[i]; if (e) MU.note(e.n, Math.max(.12, e.len * sd() * LENS_SEC), { when: secs, inst: song.inst, vol: .3 });
          if (cfg.drums) DRUMS.forEach(d => { if (song.drums[d.k][i]) MU.drum(d.k, { when: secs, vol: .6 }); });
          setTimeout(() => { if (clk) { playStep = i; markNow(); } }, secs * 1000);
        } });
      clk.start(); playBtn.textContent = '■ Stop';
    }
    playBtn.onclick = () => (clk && clk.running) ? stop() : start();
    const viewBtns = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
    function drawViewBtns() {
      viewBtns.innerHTML = '';
      [['block', '▦ Blocks'], ['staff', '🎼 Staff']].forEach(([k, t]) => viewBtns.append(h('button', { class: 'chip btnlike' + (view === k ? ' on' : ''), onclick: () => { view = k; drawViewBtns(); render(); } }, t)));
      viewBtns.append(h('button', { class: 'chip btnlike' + (showNames ? ' on' : ''), onclick: () => { showNames = !showNames; drawViewBtns(); render(); } }, 'ABC names'));
    }
    const instSel = h('select', { class: 'inp', style: { width: 'auto', padding: '6px 10px' }, 'aria-label': 'Instrument', onchange: e => { song.inst = e.target.value; sound('C5', 2); } }, INSTS.map(([k, t]) => h('option', { value: k }, t)));
    transport.append(h('div', { class: 'row', style: { justifyContent: 'center', gap: '10px', flexWrap: 'wrap' } }, playBtn, loopBtn, instSel),
      h('div', { class: 'row mt8' }, h('span', null, '🐢'), tempo, h('span', null, '🐇')), h('div', { class: 'center small' }, tempoLbl), h('div', { class: 'mt8' }, viewBtns));
    drawViewBtns();

    /* bar tabs */
    function tabs() {
      const row = h('div', { class: 'tabs mt12' });
      for (let b = 0; b < song.bars; b++) {
        const has = song.mel.slice(b * PER, b * PER + PER).some(Boolean) || (cfg.drums && Object.values(song.drums).some(a => a.slice(b * PER, b * PER + PER).some(Boolean)));
        const playing = playStep >= 0 && Math.floor(playStep / PER) === b;
        row.append(h('button', { class: bar === b ? 'on' : '', onclick: () => { bar = b; sel = -1; if (keysMode && Math.floor(cursor / PER) !== b) cursor = b * PER; render(); } }, 'Bar ' + (b + 1) + (playing ? ' ▶' : has ? ' •' : '')));
      }
      if (song.bars < MAXBARS) row.append(h('button', { onclick: () => { song.bars++; fit(); bar = song.bars - 1; render(); } }, '＋ Bar'));
      if (song.bars > 1) row.append(h('button', { onclick: () => { const last = song.mel.slice((song.bars - 1) * PER).some(Boolean); if (last && !confirm('Remove the last bar and its notes?')) return; song.bars--; fit(); if (bar >= song.bars) bar = song.bars - 1; if (cursor > total()) cursor = total(); sel = -1; render(); } }, '－ Bar'));
      return row;
    }

    /* beat numbers header for block view and drums */
    const COLS = '16.4% repeat(8, 1fr)';
    const beatHead = () => h('div', { class: 'mgrid', style: { gridTemplateColumns: COLS, gridTemplateRows: '16px' } }, h('div'), ['1', '&', '2', '&', '3', '&', '4', '&'].map((x, i) => h('div', { class: 'mhead', 'data-col': i }, x)));

    /* ----- block view ----- */
    function blockView() {
      const base = bar * PER, rows = []; for (let st = HI; st >= LO; st--) rows.push(st);
      const grid = h('div', { class: 'mgrid', style: { gridTemplateColumns: COLS, gridTemplateRows: 'repeat(' + rows.length + ', 27px)' } });
      rows.forEach((st, ri) => {
        const L = LET[st % 7]; grid.append(h('div', { class: 'mlab' + (L === 'C' ? ' c' : ''), style: { gridRow: ri + 1, gridColumn: 1 } }, L === 'C' ? L + Math.floor(st / 7) : L));
        for (let c = 0; c < PER; c++) {
          const step = base + c, cs = coverStart(step), e = cs >= 0 ? song.mel[cs] : null;
          if (e && MU.stepOf(e.n) === st) {
            if (cs === step) {
              const b = h('button', { class: 'mblock' + (sel === cs ? ' sel' : ''), style: { gridRow: ri + 1, gridColumn: (c + 2) + ' / span ' + e.len, '--c': LC[e.n[0]] }, 'aria-label': 'Note ' + e.n }, pretty(e.n).replace(/\d/, ''));
              b.onclick = () => { sel = cs; if (keysMode) cursor = cs + e.len; sound(e.n, e.len); render(); }; grid.append(b);
            }
            continue;
          }
          const cell = h('button', { class: 'mcell' + (c % 2 === 0 ? ' beat' : '') + (keysMode && step === cursor ? ' cur' : ''), 'data-col': c, style: { gridRow: ri + 1, gridColumn: c + 2 }, 'aria-label': L + ' step ' + (c + 1) });
          cell.onclick = () => gridTap(step, st); grid.append(cell);
        }
      });
      return h('div', null, beatHead(), grid);
    }

    /* ----- staff view ----- */
    function staffView() {
      const g = 12, W = 330, x0 = 54, colW = (W - x0 - 8) / PER, visLo = LO - 3, visHi = Math.max(HI + 3, 42), top = 22;
      const y = st => top + (visHi - st) * g / 2, H = y(visLo) + 30, base = bar * PER;
      const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'staffsvg', role: 'img', 'aria-label': 'Staff for bar ' + (bar + 1), style: { touchAction: 'manipulation' } });
      for (let c = 0; c < PER; c++) svg.append(s('rect', { x: x0 + c * colW, y: y(visHi), width: colW, height: y(visLo) - y(visHi), fill: c % 2 === 0 ? 'rgba(107,79,216,.05)' : 'transparent', 'data-col': c, class: 'colbg' }));
      [30, 32, 34, 36, 38].forEach(st => svg.append(s('line', { x1: 8, x2: W - 6, y1: y(st), y2: y(st), stroke: '#2B1B4D', 'stroke-width': 1.4 })));
      svg.append(s('line', { x1: 8, x2: 8, y1: y(30), y2: y(38), stroke: '#2B1B4D', 'stroke-width': 2 }), s('line', { x1: W - 6, x2: W - 6, y1: y(30), y2: y(38), stroke: '#2B1B4D', 'stroke-width': 2 }));
      svg.append(s('text', { x: 11, y: y(32) + g * .8, 'font-size': g * 3.1, 'font-family': 'Georgia,serif', 'font-style': 'italic', 'font-weight': 700, fill: '#6B4FD8' }, 'G'));
      svg.append(s('text', { x: 38, y: y(36) + 2, 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#2B1B4D', 'text-anchor': 'middle' }, '4'), s('text', { x: 38, y: y(32) + 4, 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#2B1B4D', 'text-anchor': 'middle' }, '4'));
      ['1', '&', '2', '&', '3', '&', '4', '&'].forEach((t, c) => svg.append(s('text', { x: x0 + (c + .5) * colW, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#716a82', 'data-col': c, class: 'blab' }, t)));
      if (keysMode) { const cc = cursor - base; if (cc >= 0 && cc < PER) svg.append(s('rect', { x: x0 + cc * colW + 1, y: y(visHi) + 1, width: colW - 2, height: y(visLo) - y(visHi) - 2, fill: 'none', stroke: '#6B4FD8', 'stroke-width': 2.5, 'stroke-dasharray': '5 3', rx: 6 })); }
      // tap targets for empty spots
      for (let c = 0; c < PER; c++) for (let st = LO; st <= HI; st++) {
        const r = s('rect', { x: x0 + c * colW, y: y(st) - g / 4, width: colW, height: g / 2, fill: 'transparent', style: { cursor: 'pointer' } });
        r.addEventListener('pointerdown', ev => { ev.preventDefault(); gridTap(base + c, st); }); svg.append(r);
      }
      // notes
      for (let c = 0; c < PER; c++) {
        const e = song.mel[base + c]; if (!e) continue;
        const st = MU.stepOf(e.n), cx = x0 + (c + .5) * colW, cy = y(st), isSel = sel === base + c, col = isSel ? '#E0529C' : '#2B1B4D', info = lenInfo(e.len);
        const grp = s('g', { style: { cursor: 'pointer' } });
        for (let l = 28; l >= st; l -= 2) grp.append(s('line', { x1: cx - 13, x2: cx + 13, y1: y(l), y2: y(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
        for (let l = 40; l <= st; l += 2) grp.append(s('line', { x1: cx - 13, x2: cx + 13, y1: y(l), y2: y(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
        if (e.len > 1) grp.append(s('rect', { x: cx, y: cy - 3, width: Math.max(2, (e.len - .5) * colW - 4), height: 6, rx: 3, fill: isSel ? '#E0529C' : '#6B4FD8', opacity: .28 }));
        const open = e.len >= 4, up = st < 34;
        if (info.kind !== 'whole') {
          grp.append(s('line', up ? { x1: cx + 7, x2: cx + 7, y1: cy, y2: cy - g * 3.3, stroke: col, 'stroke-width': 2 } : { x1: cx - 7, x2: cx - 7, y1: cy, y2: cy + g * 3.3, stroke: col, 'stroke-width': 2 }));
          if (e.len === 1) grp.append(s('path', up ? { d: 'M' + (cx + 7) + ' ' + (cy - g * 3.3) + ' q 10 6 4 16', fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' } : { d: 'M' + (cx - 7) + ' ' + (cy + g * 3.3) + ' q 10 -6 4 -16', fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
        }
        grp.append(s('ellipse', { cx, cy, rx: 8, ry: 5.8, fill: open ? '#fff' : col, stroke: col, 'stroke-width': open ? 2.4 : 1, transform: 'rotate(-20 ' + cx + ' ' + cy + ')' }));
        if (info.kind === 'whole') grp.append(s('ellipse', { cx, cy, rx: 3.4, ry: 6.6, fill: col, transform: 'rotate(25 ' + cx + ' ' + cy + ')' }));
        if (info.dot) grp.append(s('circle', { cx: cx + 14, cy: cy + (st % 2 === 0 ? -3 : 0), r: 2.4, fill: col }));
        if (isSharp(e.n)) grp.append(sharpShape(cx - 16, cy, col));
        if (showNames) grp.append(s('text', { x: cx, y: 12, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: LC[e.n[0]] }, pretty(e.n).replace(/\d/, '')));
        grp.append(s('circle', { cx, cy, r: 14, fill: 'transparent' }));
        grp.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); sel = base + c; if (keysMode) cursor = base + c + e.len; sound(e.n, e.len); render(); });
        svg.append(grp);
      }
      return h('div', { class: 'svgwrap staffwrap' }, svg);
    }

    /* ----- drum rows (Song Studio) ----- */
    function drumView() {
      const base = bar * PER, wrap = h('div', { class: 'mt12' }, h('b', { class: 'small' }, '🥁 Beats'));
      const grid = h('div', { class: 'mgrid mt8', style: { gridTemplateColumns: COLS, gridTemplateRows: 'repeat(' + DRUMS.length + ', 34px)' } });
      DRUMS.forEach((d, ri) => {
        grid.append(h('div', { class: 'mlab', style: { gridRow: ri + 1, gridColumn: 1 } }, d.n));
        for (let c = 0; c < PER; c++) {
          const on = song.drums[d.k][base + c];
          const cell = h('button', { class: 'cell' + (c % 2 === 0 ? ' beat' : '') + (on ? ' on' : ''), 'data-col': c, style: { gridRow: ri + 1, gridColumn: c + 2, '--c': d.c, minHeight: 0 }, 'aria-label': d.n + ' step ' + (c + 1) });
          cell.onclick = () => { const v = !song.drums[d.k][base + c]; song.drums[d.k][base + c] = v; cell.classList.toggle('on', v); if (v) MU.drum(d.k, { vol: .6 }); };
          grid.append(cell);
        }
      });
      wrap.append(grid); return wrap;
    }

    /* ----- edit panel + input ----- */
    function lenChips() {
      const row = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
      const cur = drawSel() ? drawSel().len : curLen;
      LENS.filter(l => l.lvl <= lvl).forEach(l => {
        const b = h('button', { class: 'chip btnlike lenchip' + (cur === l.len ? ' on' : ''), title: l.name }, MU.noteShape(l.kind, 30), h('span', { class: 'small' }, l.dot ? l.name.replace('Dotted ', '') + ' •' : l.name));
        b.onclick = () => { if (drawSel()) editLen(l.len); else { curLen = l.len; render(); } }; row.append(b);
      });
      return row;
    }
    function editPanel() {
      editBox.innerHTML = ''; const e = drawSel(); if (!e) return;
      const info = lenInfo(e.len);
      editBox.append(h('div', { class: 'card flat editbar mt12' },
        h('b', null, '✏️ Editing: ' + pretty(e.n) + ' · ' + info.name.toLowerCase() + ' note'),
        keysMode ? h('p', { class: 'small muted' }, 'Tap a piano key to change this note, or use the buttons.') : h('p', { class: 'small muted' }, 'Change it with the buttons, or tap a different spot to add another note.'),
        h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: () => editPitch(1) }, '⬆ Higher'), h('button', { class: 'btn ghost', onclick: () => editPitch(-1) }, '⬇ Lower'),
          lvl >= 2 ? h('button', { class: 'btn ghost', onclick: editSharp }, isSharp(e.n) ? '♮ Natural' : '♯ Sharp') : null,
          h('button', { class: 'btn ghost', onclick: () => editMove(-1) }, '◀ Earlier'), h('button', { class: 'btn ghost', onclick: () => editMove(1) }, 'Later ▶')),
        h('p', { class: 'small mt8 center' }, 'Length:'), lenChips(),
        h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
          h('button', { class: 'btn coral', onclick: editDelete }, '🗑 Delete note'), h('button', { class: 'btn mint', onclick: () => { sel = -1; render(); } }, '✔ Done editing'))));
    }
    function inputPanel() {
      inputBox.innerHTML = '';
      if (!drawSel()) inputBox.append(h('p', { class: 'small center mt12' }, h('b', null, 'New note length:')), lenChips());
      if (keysMode) {
        const to = lvl >= 2 ? 'C6' : 'C5';
        kb = MU.keyboard({ from: 'C4', to, labels: 'names', height: lvl >= 2 ? 120 : 150, inst: song.inst, dur: .5, onPlay: keyPress });
        kb.el.classList.add('hidesharp');
        inputBox.append(h('div', { class: 'mt12' }, kb.el),
          h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: addRest }, '⏸ Rest'), h('button', { class: 'btn ghost', onclick: back }, '⌫ Back'),
            h('button', { class: 'btn ghost', onclick: () => { cursor = 0; bar = 0; sel = -1; render(); } }, '⏮ Start')),
          h('p', { class: 'small muted center mt8' }, drawSel() ? '' : 'Notes go in at the dashed marker. Tap any empty square to move the marker.'));
      } else if (lvl >= 2) {
        inputBox.append(h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, h('button', { class: 'chip btnlike' + (sharpMode ? ' on' : ''), onclick: () => { sharpMode = !sharpMode; render(); } }, sharpMode ? '♯ Sharps ON' : '♯ Sharps off')));
      }
    }

    /* ----- footer: save / open / clear / finish ----- */
    function footer() {
      foot.innerHTML = '';
      foot.append(h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } },
        h('button', { class: 'btn ghost', onclick: saveDialog }, '💾 Save'), h('button', { class: 'btn ghost', onclick: openDialog }, '📂 My songs'),
        h('button', { class: 'btn ghost', onclick: () => { if (!noteCount() && !(cfg.drums && Object.values(song.drums).some(a => a.some(Boolean)))) return; if (confirm('Clear everything and start fresh?')) { song.mel = []; Object.keys(song.drums).forEach(k => song.drums[k] = []); fit(); sel = -1; cursor = 0; bar = 0; savedId = null; render(); } } }, '🧹 Clear')),
        h('button', { class: 'btn navy wide mt12', onclick: finish }, "I'm happy with my song ✔"));
    }
    function saveDialog() {
      if (!noteCount()) return MU.toast('Add some notes first');
      const inp = h('input', { class: 'inp', maxlength: 28, placeholder: 'Name your song', value: song.name || '' });
      MU.modal(h('div', null, h('div', { class: 'bigem' }, '💾'), h('h3', null, 'Save your song'), h('div', { class: 'mt12' }, inp),
        h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: MU.closeModal }, 'Cancel'),
          h('button', { class: 'btn mint', onclick: () => { song.name = (inp.value || '').trim() || 'My song'; savedId = MU.saveSong(Object.assign(pack(song), { name: song.name, kind: cfg.kind }), savedId); MU.closeModal(); MU.toast('Saved!'); } }, 'Save'))), { dismiss: true });
      setTimeout(() => inp.focus(), 60);
    }
    function openDialog() {
      const list = MU.songList(); const box = h('div', null, h('h3', null, '📂 My songs'));
      if (!list.length) box.append(h('p', { class: 'muted mt8' }, 'Nothing saved yet. Make a song and press Save!'));
      list.forEach(sg => box.append(h('div', { class: 'row mt8', style: { justifyContent: 'space-between' } }, h('span', { style: { flex: 1, textAlign: 'left' } }, h('b', null, sg.name || 'My song'), h('div', { class: 'small muted' }, new Date(sg.ts).toLocaleDateString())),
        h('button', { class: 'chip btnlike', onclick: () => { stop(); const sn = unpack(sg); song.bars = sn.bars; song.tempo = sn.tempo; song.inst = sn.inst; song.mel = sn.mel; song.drums = sn.drums; song.name = sg.name; savedId = sg.id; tempo.value = song.tempo; tempoLbl.textContent = song.tempo + ' BPM'; instSel.value = song.inst; fit(); bar = 0; sel = -1; cursor = Math.min(total(), (song.mel.map((e, i) => e ? i + e.len : 0).reduce((a, b) => Math.max(a, b), 0))); MU.closeModal(); render(); } }, 'Open'),
        h('button', { class: 'chip btnlike', onclick: e => { if (confirm('Delete "' + (sg.name || 'My song') + '"?')) { MU.deleteSong(sg.id); e.currentTarget.parentNode.remove(); } } }, '🗑'))));
      box.append(h('div', { class: 'center mt16' }, h('button', { class: 'btn ghost', onclick: MU.closeModal }, 'Close')));
      MU.modal(box, { dismiss: true });
    }
    function finish() {
      const n = noteCount(); if (n < 3) return MU.toast('Add at least 3 notes first');
      const pitches = new Set(song.mel.filter(Boolean).map(e => e.n)).size, lens = new Set(song.mel.filter(Boolean).map(e => e.len)).size;
      const dr = cfg.drums ? DRUMS.filter(d => song.drums[d.k].some(Boolean)).length : 0;
      let score = 1; if (n >= 6 && pitches >= 3) score = 2; if (n >= 8 && pitches >= 4 && lens >= 2 && (!cfg.drums || dr >= 2)) score = 3;
      stop(); ctx.finish(score, 3, 'Your song has ' + n + ' notes, ' + pitches + ' different pitches' + (cfg.drums ? ' and ' + dr + ' beat sound' + (dr === 1 ? '' : 's') : '') + '.' + (score < 3 ? ' Try more notes, different lengths' + (cfg.drums ? ' and more drums' : '') + ' for 3 stars!' : ' Wonderful!'));
    }

    /* ----- playhead highlight ----- */
    function markNow() {
      const c = playStep >= 0 && Math.floor(playStep / PER) === bar ? playStep - bar * PER : -1;
      root.querySelectorAll('[data-col]').forEach(el => {
        const on = Number(el.getAttribute('data-col')) === c;
        if (el.classList.contains('colbg')) el.setAttribute('fill', on ? 'rgba(245,184,61,.4)' : (Number(el.getAttribute('data-col')) % 2 === 0 ? 'rgba(107,79,216,.05)' : 'transparent'));
        else el.classList.toggle('now', on);
      });
    }

    /* ----- main render ----- */
    function render() {
      if (keysMode && cursor > total()) cursor = total();
      body.innerHTML = ''; body.append(tabs(), view === 'staff' ? staffView() : blockView());
      if (cfg.drums) body.append(drumView());
      editPanel(); inputPanel(); footer(); markNow();
    }
    render();
    MU.onLeave(() => { stop(); });
    // allow a quick starter so little ones see how it works
    if (cfg.starter) { cfg.starter(song, place); fit(); cursor = Math.min(total(), song.mel.map((e, i) => e ? i + e.len : 0).reduce((a, b) => Math.max(a, b), 0)); render(); }
  };

  /* =====================================================================================================
   * Labs
   * ===================================================================================================== */
  const L = (id, o) => { MU.labs[id] = o; };
  L('key-tunes', {
    emoji: '🎹', title: 'Keyboard Tune Maker', blurb: 'Play the keys to write a tune, bar by bar',
    run(ctx) {
      MU.songEditor(ctx, { kind: 'keys', input: 'keys', view: 'block', drums: false, bars: 4,
        prompt: 'Pick how long the note is, then play the keys. Each note goes into your bars. Tap a note to edit it!' });
    }
  });
  L('staff-songwriter', {
    emoji: '🎼', title: 'Staff Songwriter', blurb: 'Write notes straight onto the music staff',
    run(ctx) {
      MU.songEditor(ctx, { kind: 'staff', input: 'grid', view: 'staff', drums: false, bars: 4,
        prompt: 'Tap the staff to place a note. The line or space decides the pitch, and the column decides when it plays. Tap a note to edit it!' });
    }
  });
  L('song-studio', {
    emoji: '🎛️', title: 'Song Studio', blurb: 'Melody and beats together, as blocks or on the staff',
    run(ctx) {
      MU.songEditor(ctx, { kind: 'studio', input: 'grid', view: 'block', drums: true, bars: 4,
        prompt: 'Make a whole song: put notes on top and drum beats underneath. Switch between Blocks and Staff any time. Tap a note to edit it!' });
    }
  });

  /* =====================================================================================================
   * Studio hub screen
   * ===================================================================================================== */
  MU.screens.studio = function () {
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎛️ Music Studio', '/', MU.starPill()));
    wrap.append(h('p', { class: 'muted' }, 'Make your own music! Every tool plays what you build, and you can save songs to open again.'));
    const T = [['rhythm-grid', '#E0529C'], ['key-tunes', '#6B4FD8'], ['staff-songwriter', '#2F8FD0'], ['song-studio', '#12B58C']];
    T.forEach(([id, col]) => { const lab = MU.labs[id]; if (!lab) return; const st = MU.labStars(id);
      wrap.append(h('button', { class: 'labcard', style: { marginBottom: '10px', borderLeft: '8px solid ' + col }, onclick: () => MU.go('/lab/' + id) }, h('span', { class: 'em' }, lab.emoji), h('span', { style: { flex: 1 } }, h('b', null, lab.title), h('span', { class: 'd' }, lab.blurb)), st ? MU.starsEl(st) : h('span', { class: 'chip' }, 'Make')));
    });
    wrap.append(h('h3', { class: 'sec' }, '📂 My songs'));
    const list = MU.songList(); let clk = null;
    MU.onLeave(() => { clk && clk.stop(); });
    if (!list.length) wrap.append(h('p', { class: 'muted small' }, 'Songs you save in Keyboard Tune Maker, Staff Songwriter or Song Studio show up here.'));
    list.forEach(sg => {
      const nNotes = (sg.mel || []).filter(Boolean).length;
      const play = h('button', { class: 'chip btnlike' }, '▶ Play');
      play.onclick = () => { if (clk) { clk.stop(); clk = null; } MU.stopAll(); clk = MU.playSongData(sg, () => { play.textContent = '▶ Play'; }); play.textContent = '▶ Playing'; };
      wrap.append(h('div', { class: 'card flat', style: { padding: '10px 14px', margin: '8px 0' } }, h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, h('b', null, sg.name || 'My song'), h('div', { class: 'small muted' }, nNotes + ' notes · ' + sg.bars + ' bars · ' + new Date(sg.ts).toLocaleDateString())), play)));
    });
    return wrap;
  };
})();
