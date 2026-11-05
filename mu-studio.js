/* Music Adventure - Studio: Keyboard Tune Maker, Staff Songwriter, Song Studio (notes + beats).
 * One shared, polyphonic editor (MU.songEditor): four voices (Melody, Harmony, Chords, Bass), stacked notes,
 * chord stamps, a harmony-line helper, auto chords, a grand staff, saved songs and MIDI export.
 * A song is 1-8 bars of 4/4; each bar = 8 eighth-note steps. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h, s = MU.s;
  const PER = 8, MAXBARS = 8, LENS_SEC = 0.95;
  const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LO = MU.stepOf('C1'), HI = MU.stepOf('C6'), SPLIT = MU.stepOf('C4'); // notes from C4 up live on the treble staff
  const LENS = [
    { len: 1, name: 'Eighth', kind: 'eighth', lvl: 2 }, { len: 2, name: 'Quarter', kind: 'quarter', lvl: 1 },
    { len: 3, name: 'Dotted quarter', kind: 'quarter', dot: true, lvl: 3 }, { len: 4, name: 'Half', kind: 'half', lvl: 1 },
    { len: 6, name: 'Dotted half', kind: 'half', dot: true, lvl: 3 }, { len: 8, name: 'Whole', kind: 'whole', lvl: 1 }
  ];
  const lenInfo = n => LENS.find(l => l.len === n) || { len: n, name: n + ' steps', kind: n >= 8 ? 'whole' : n >= 4 ? 'half' : n >= 2 ? 'quarter' : 'eighth' };
  const DRUMS = [{ k: 'kick', n: 'Kick', c: '#E0529C', gm: 36 }, { k: 'snare', n: 'Snare', c: '#6B4FD8', gm: 38 }, { k: 'hat', n: 'Hi-hat', c: '#12B58C', gm: 42 }, { k: 'tamb', n: 'Shaker', c: '#E08A00', gm: 54 }];
  const INSTS = [['piano', 'Piano', 0], ['flute', 'Flute', 73], ['violin', 'Violin', 40], ['cello', 'Cello', 42], ['harp', 'Harp', 46], ['organ', 'Organ', 19], ['xylophone', 'Xylophone', 13],
    ['glock', 'Glockenspiel', 9], ['trumpet', 'Trumpet', 56], ['clarinet', 'Clarinet', 71], ['horn', 'French horn', 60], ['bass', 'Bass', 33]];
  const instName = k => (INSTS.find(x => x[0] === k) || [0, k])[1];
  const VOICES = [
    { name: 'Melody', e: '🎤', c: '#E0529C', inst: 'piano', vol: .3 }, { name: 'Harmony', e: '🎶', c: '#2F8FD0', inst: 'violin', vol: .24 },
    { name: 'Chords', e: '🎹', c: '#12B58C', inst: 'organ', vol: .13 }, { name: 'Bass', e: '🎸', c: '#E08A00', inst: 'cello', vol: .3 }
  ];
  const newVoices = () => VOICES.map(v => ({ inst: v.inst, mute: false }));
  const stepName = (st, sharp) => LET[((st % 7) + 7) % 7] + (sharp ? '#' : '') + Math.floor(st / 7);
  const canSharp = st => ['C', 'D', 'F', 'G', 'A'].includes(LET[((st % 7) + 7) % 7]);
  const isSharp = n => n.indexOf('#') > -1;
  const pretty = n => n.replace('#', '♯');
  const pc = n => ((MU.midi(n) % 12) + 12) % 12;
  const CHORDS = [['I', 0, 1], ['ii', 1, 2], ['iii', 2, 2], ['IV', 3, 1], ['V', 4, 1], ['vi', 5, 2], ['vii°', 6, 3]];
  function chordNotes(deg, seventh, oct) {
    const r = deg + 7 * (oct == null ? 3 : oct), st = [r, r + 2, r + 4].concat(seventh ? [r + 6] : []);
    return st.map(x => stepName(x, false));
  }
  function chordName(deg, seventh) {
    const q = [['', ''], ['m', 'm'], ['m', 'm'], ['', ''], ['', ''], ['m', 'm'], ['dim', 'dim']][deg][0];
    let sfx = q; if (seventh) sfx = deg === 0 || deg === 3 ? 'maj7' : deg === 4 ? '7' : deg === 6 ? 'm7♭5' : 'm7';
    return LET[deg] + sfx;
  }

  /* ---------------- saved songs (kept in the explorer's progress, so they sync) ---------------- */
  function songsObj() { const pr = MU.PR(); if (!pr) return {}; if (!pr.songs) pr.songs = {}; return pr.songs; }
  MU.songList = () => Object.values(songsObj()).filter(x => x && !x.del).sort((a, b) => b.ts - a.ts);
  MU.saveSong = (data, id) => { const o = songsObj(); id = id || 's' + Date.now().toString(36); o[id] = Object.assign({}, data, { id, ts: Date.now() }); MU.save(); return id; };
  MU.deleteSong = id => { const o = songsObj(); o[id] = { id, del: true, ts: Date.now() }; MU.save(); };
  const pack = song => ({ v: 2, bars: song.bars, tempo: song.tempo, dm: song.drumMute ? 1 : 0, voices: song.voices.map(v => ({ inst: v.inst, mute: !!v.mute })), notes: song.notes.map(n => [n.s, n.n, n.len, n.v]),
    drums: Object.fromEntries(Object.keys(song.drums).map(k => [k, song.drums[k].map(x => x ? 1 : 0)])) });
  function unpack(d) {
    const bars = Math.max(1, Math.min(MAXBARS, d.bars || 4)), T = bars * PER;
    const song = { bars, drumMute: !!d.dm, tempo: d.tempo || 90, voices: newVoices(), notes: [], drums: { kick: [], snare: [], hat: [], tamb: [] } };
    if (d.voices) d.voices.forEach((v, i) => { if (song.voices[i]) { song.voices[i].inst = v.inst || song.voices[i].inst; song.voices[i].mute = !!v.mute; } });
    if (d.notes) d.notes.forEach(a => { if (a[0] < T) song.notes.push({ s: a[0], n: a[1], len: a[2], v: a[3] || 0 }); });
    else if (d.mel) { if (d.inst) song.voices[0].inst = d.inst; d.mel.forEach((e, i) => { if (e && i < T) { const p = String(e).split(':'); song.notes.push({ s: i, n: p[0], len: Number(p[1]) || 2, v: 0 }); } }); } // songs saved by the first Studio
    Object.keys(song.drums).forEach(k => { for (let i = 0; i < T; i++) song.drums[k][i] = !!(d.drums && d.drums[k] && d.drums[k][i]); });
    return song;
  }
  /* what to play at one step: notes starting there (with their voices) */
  function noteVol(song, n) {
    const same = song.notes.filter(x => x.v === n.v && x.s === n.s).length;
    return VOICES[n.v].vol * Math.min(1, 1.5 / Math.sqrt(same)) * (song.voices[n.v].inst === 'organ' ? .7 : 1);
  }
  function playStep(song, i, secs, withDrums) {
    const sd = 60 / song.tempo / 2;
    song.notes.forEach(n => { if (n.s === i && !song.voices[n.v].mute) MU.note(n.n, Math.max(.12, n.len * sd * LENS_SEC), { when: secs, inst: song.voices[n.v].inst, vol: noteVol(song, n) }); });
    if (withDrums && !song.drumMute) DRUMS.forEach(d => { if (song.drums[d.k][i]) MU.drum(d.k, { when: secs, vol: .6 }); });
  }
  MU.playSongData = function (data, onEnd) {
    const song = unpack(data);
    const clk = MU.clock({ bpm: song.tempo, stepsPerBeat: 2, steps: song.bars * PER, once: true, onEnd, onStep: (i, w, secs) => playStep(song, i, secs, true) });
    clk.start(); return clk;
  };

  /* ---------------- MIDI export (so tunes can go into a DAW or a game project) ---------------- */
  function vlq(n) { const b = [n & 127]; while ((n >>= 7)) b.unshift((n & 127) | 128); return b; }
  function midiBytes(song) {
    const TPS = 240, ev = (arr) => { arr.sort((a, b) => a.t - b.t || a.o - b.o); let last = 0, out = []; arr.forEach(e => { out = out.concat(vlq(e.t - last), e.b); last = e.t; }); return out.concat(vlq(0), [0xFF, 0x2F, 0]); };
    const chunk = (id, data) => [].concat(Array.from(id).map(c => c.charCodeAt(0)), [(data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255], data);
    const mpq = Math.round(60000000 / song.tempo), tracks = [];
    tracks.push(chunk('MTrk', ev([{ t: 0, o: 0, b: [0xFF, 0x51, 3, (mpq >> 16) & 255, (mpq >> 8) & 255, mpq & 255] }, { t: 0, o: 0, b: [0xFF, 0x58, 4, 4, 2, 24, 8] }, { t: 0, o: 0, b: [0xFF, 0x03, 5, 77, 117, 115, 105, 99] }])));
    song.voices.forEach((vc, vi) => {
      const list = song.notes.filter(n => n.v === vi); if (!list.length) return;
      const prog = (INSTS.find(x => x[0] === vc.inst) || [0, 0, 0])[2], evs = [{ t: 0, o: 0, b: [0xC0 | vi, prog] }];
      list.forEach(n => { const m = MU.midi(n.n), t0 = n.s * TPS, t1 = (n.s + n.len) * TPS - 6; evs.push({ t: t0, o: 2, b: [0x90 | vi, m, 88] }, { t: t1, o: 1, b: [0x80 | vi, m, 0] }); });
      tracks.push(chunk('MTrk', ev(evs)));
    });
    const dr = []; DRUMS.forEach(d => song.drums[d.k].forEach((on, i) => { if (on) dr.push({ t: i * TPS, o: 2, b: [0x99, d.gm, 100] }, { t: i * TPS + 60, o: 1, b: [0x89, d.gm, 0] }); }));
    if (dr.length) tracks.push(chunk('MTrk', ev(dr)));
    const head = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (tracks.length >> 8) & 255, tracks.length & 255, (480 >> 8) & 255, 480 & 255];
    return new Uint8Array([].concat.apply([], [head].concat(tracks)));
  }
  MU.midiBytes = midiBytes; MU.unpackSong = unpack;

  /* ---------------- little SVG helper ---------------- */
  function sharpShape(x, y, col) {
    const g = s('g', { stroke: col, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    g.append(s('line', { x1: x - 2.5, y1: y - 8, x2: x - 2.5, y2: y + 8 }), s('line', { x1: x + 2.5, y1: y - 9, x2: x + 2.5, y2: y + 7 }),
      s('line', { x1: x - 6, y1: y - 2, x2: x + 6, y2: y - 4, 'stroke-width': 2.4 }), s('line', { x1: x - 6, y1: y + 4, x2: x + 6, y2: y + 2, 'stroke-width': 2.4 }));
    return g;
  }

  /* =====================================================================================================
   * MU.songEditor(ctx, cfg)   cfg: { kind, input: 'keys'|'grid', view: 'block'|'staff', drums, bars, prompt }
   * ===================================================================================================== */
  MU.songEditor = function (ctx, cfg) {
    const lvl = ctx.lvl, keysMode = cfg.input === 'keys';
    const song = { bars: cfg.bars || 4, tempo: lvl === 1 ? 80 : 96, voices: newVoices(), notes: [], drums: { kick: [], snare: [], hat: [], tamb: [] } };
    let view = cfg.view || 'block', bar = 0, sel = null, cursor = 0, curLen = 2, sharpMode = false, showNames = lvl === 1, loop = true;
    let keyReplace = false, loopA = 0, loopB = null, targets = new Set(), undoStack = [], scope = { d: true, v: [true, true, true, true] };
    let av = 0, win = 'high', stack = false, chordSel = null, seventh = false, clk = null, playPos = -1, savedId = null;
    const total = () => song.bars * PER;
    function fit() {
      const T = total(); song.notes = song.notes.filter(n => n.s < T);
      Object.keys(song.drums).forEach(k => { song.drums[k].length = T; for (let i = 0; i < T; i++) if (song.drums[k][i] === undefined) song.drums[k][i] = false; });
    }
    fit();
    const snap = () => { undoStack.push(JSON.stringify({ n: song.notes, d: song.drums, b: song.bars })); if (undoStack.length > 30) undoStack.shift(); };
    function undo() {
      const e = undoStack.pop(); if (!e) return MU.toast('Nothing to undo'); const o = JSON.parse(e);
      song.notes = o.n; song.drums = o.d; song.bars = o.b; fit(); if (bar >= song.bars) bar = song.bars - 1; sel = null; render();
    }
    const WINS = { high: ['C4', 'C6', '🔼 High (C4–C6)', 'Higher keys'], low: ['C3', 'C5', '🔽 Low (C3–C5)', 'Lower keys'], bass: ['C2', 'C4', '🎸 Bass (C2–C4)', 'Bass keys'], deep: ['C1', 'C3', '⏬ Deep (C1–C3)', 'Deep keys'] };
    const winLo = () => MU.stepOf(WINS[win][0]), winHi = () => winLo() + 14;

    /* ----- model ----- */
    function addNote(st, name, len, v) {
      const barEnd = (Math.floor(st / PER) + 1) * PER; len = Math.max(1, Math.min(len, barEnd - st));
      song.notes = song.notes.filter(x => !(x.v === v && x.n === name && x.s < st + len && x.s + x.len > st)); // same voice + same pitch cannot double up
      const n = { s: st, n: name, len, v }; song.notes.push(n); return n;
    }
    const inBar = b => song.notes.filter(n => n.s >= b * PER && n.s < (b + 1) * PER);
    const covering = (st, row) => song.notes.filter(n => n.s <= st && n.s + n.len > st && MU.stepOf(n.n) === row);
    const sound = (name, len, v) => MU.note(name, Math.min(1.2, Math.max(.25, (len || 2) * 60 / song.tempo / 2)), { inst: song.voices[v == null ? av : v].inst, vol: .3 });
    const vcol = v => VOICES[v].c;

    /* ----- editing the selected note ----- */
    function editPitch(dir) { if (!sel) return; const st = MU.stepOf(sel.n) + dir; if (st < LO || st > HI) return MU.toast('That is as far as the notes go'); sel.n = stepName(st, false); sound(sel.n, sel.len, sel.v); render(); }
    function editSharp() { if (!sel) return; const st = MU.stepOf(sel.n); if (isSharp(sel.n)) sel.n = stepName(st, false); else if (canSharp(st) && st < HI) sel.n = stepName(st, true); else return MU.toast('There is no sharp for that note'); sound(sel.n, sel.len, sel.v); render(); }
    function editLen(len) { if (!sel) return; const barEnd = (Math.floor(sel.s / PER) + 1) * PER; sel.len = Math.min(len, barEnd - sel.s); sound(sel.n, sel.len, sel.v); render(); }
    function editMove(dir) {
      if (!sel) return; const ns = sel.s + dir, b0 = Math.floor(sel.s / PER) * PER;
      if (ns < b0 || ns + sel.len > b0 + PER) return MU.toast('Use the bar tabs to work in another bar');
      sel.s = ns; render();
    }
    function editVoice(v) { if (!sel) return; song.notes = song.notes.filter(x => x === sel || !(x.v === v && x.n === sel.n && x.s < sel.s + sel.len && x.s + x.len > sel.s)); sel.v = v; sound(sel.n, sel.len, v); render(); }
    function editDelete() { if (!sel) return; snap(); song.notes = song.notes.filter(x => x !== sel); sel = null; render(); }
    const select = n => { sel = n; sound(n.n, n.len, n.v); if (keysMode) cursor = Math.min(total(), n.s + n.len); render(); };

    /* ----- adding ----- */
    function stampChord(deg, st) {
      if (av < 2) { av = 2; MU.toast('Chords go in the Chords voice'); } win = av === 3 ? 'bass' : 'low';
      const v = av, names = chordNotes(deg, seventh, v === 3 ? 2 : 3); let len = 0;
      snap(); const e = Math.min((Math.floor(st / PER) + 1) * PER, st + curLen);
      song.notes = song.notes.filter(x => !(x.v === v && x.s < e && x.s + x.len > st)); // a new chord replaces what was under it
      names.forEach(nm => { len = addNote(st, nm, curLen, v).len; });
      MU.chord(names, Math.min(1.4, len * 60 / song.tempo / 2), { inst: song.voices[v].inst, vol: .2 }); return len;
    }
    function gridTap(st, row) {
      if (chordSel != null) { stampChord(chordSel, st); sel = null; render(); return; }
      if (keysMode) { sel = null; cursor = st; render(); return; }
      snap(); const nm = stepName(row, sharpMode && canSharp(row) && row < HI), n = addNote(st, nm, curLen, av); sound(nm, n.len); sel = null; render();
    }
    const advance = () => { const barEnd = (Math.floor(cursor / PER) + 1) * PER; cursor = Math.min(total(), cursor + Math.min(curLen, barEnd - cursor)); bar = Math.min(song.bars - 1, Math.floor(Math.min(cursor, total() - 1) / PER)); };
    function keyPress(nm) {
      const st = MU.stepOf(nm); if (st < LO || st > HI) return;
      if (sel && keyReplace) { snap(); sel.n = nm; render(); return; }
      sel = null;
      if (cursor >= total()) return MU.toast('The song is full. Add a bar or press play!');
      snap(); const n = addNote(cursor, nm, curLen, av);
      if (!stack) { cursor = Math.min(total(), cursor + n.len); bar = Math.min(song.bars - 1, Math.floor(Math.min(cursor, total() - 1) / PER)); }
      render();
    }
    function keysChord(deg) {
      if (cursor >= total()) return MU.toast('The song is full. Add a bar or press play!');
      const len = stampChord(deg, cursor); const barEnd = (Math.floor(cursor / PER) + 1) * PER; cursor = Math.min(total(), cursor + Math.min(len, barEnd - cursor)); bar = Math.min(song.bars - 1, Math.floor(Math.min(cursor, total() - 1) / PER)); render();
    }
    function back() {
      if (cursor <= 0) return; const ends = song.notes.filter(n => n.v === av && n.s + n.len === cursor);
      if (ends.length) { const m = Math.min.apply(null, ends.map(n => n.s)); song.notes = song.notes.filter(n => ends.indexOf(n) < 0); cursor = m; } else cursor -= 1;
      bar = Math.floor(cursor / PER); sel = null; render();
    }

    /* ----- helpers: harmony line, auto chords ----- */
    const HARM = [['3rd below', -2], ['3rd above', 2], ['5th below', -4], ['6th below', -5], ['Octave above', 7]];
    function harmonize(delta) {
      const src = song.notes.filter(n => n.v === 0); if (!src.length) return MU.toast('Write a melody first (in the Melody voice)');
      if (song.notes.some(n => n.v === 1) && !confirm('Replace your Harmony line?')) return;
      snap(); song.notes = song.notes.filter(n => n.v !== 1); let skipped = 0;
      src.forEach(n => { const st = MU.stepOf(n.n) + delta; if (st < LO || st > HI) { skipped++; return; } song.notes.push({ s: n.s, n: stepName(st, false), len: n.len, v: 1 }); });
      av = 1; sel = null; render(); MU.toast('Harmony added! Press play.' + (skipped ? ' (' + skipped + ' notes were out of range)' : ''));
    }
    function autoChords() {
      if (!song.notes.some(n => n.v === 0)) return MU.toast('Write a melody first (in the Melody voice)');
      if (song.notes.some(n => n.v === 2) && !confirm('Replace your Chords?')) return;
      snap(); song.notes = song.notes.filter(n => n.v !== 2); const degs = lvl === 1 ? [0, 3, 4] : [0, 3, 4, 5, 1, 2];
      for (let b = 0; b < song.bars; b++) {
        const mel = inBar(b).filter(n => n.v === 0); if (!mel.length) continue;
        let best = 0, bestScore = -1;
        degs.forEach(d => { const pcs = chordNotes(d, false).map(pc); const sc = mel.reduce((a, n) => a + (pcs.indexOf(pc(n.n)) > -1 ? n.len : 0), 0) + (d === 0 ? .01 : 0); if (sc > bestScore) { bestScore = sc; best = d; } });
        chordNotes(best, false, 3).forEach(nm => song.notes.push({ s: b * PER, n: nm, len: PER, v: 2 }));
      }
      av = 2; sel = null; render(); MU.toast('Chords added! Press play.');
    }

    /* ----- skeleton ----- */
    const root = h('div', { class: 'stage' }); ctx.root.append(root);
    root.append(ctx.sayPrompt(cfg.prompt));
    const transport = h('div'), loopBox = h('div'), toolsBox = h('div'), voiceBox = h('div'), body = h('div'), editBox = h('div'), inputBox = h('div'), helpBox = h('div'), foot = h('div');
    root.append(transport, loopBox, voiceBox, body, editBox, inputBox, helpBox, toolsBox, foot);

    const playBtn = h('button', { class: 'btn mint' }, '▶ Play'), tempoLbl = h('b', null, song.tempo + ' BPM');
    const tempo = h('input', { type: 'range', min: 50, max: 160, value: song.tempo, 'aria-label': 'Tempo' });
    tempo.oninput = () => { song.tempo = Number(tempo.value); tempoLbl.textContent = song.tempo + ' BPM'; clk && clk.setBpm(song.tempo); };
    const loopBtn = h('button', { class: 'chip btnlike on' }, '🔁 Loop'); loopBtn.onclick = () => { loop = !loop; loopBtn.classList.toggle('on', loop); };
    function stop() { if (clk) { clk.stop(); clk = null; } playBtn.textContent = '▶ Play'; playPos = -1; markNow(); }
    function start() {
      stop(); MU.stopAll();
      const a = Math.min(loopA, song.bars - 1), b = Math.max(a, Math.min(loopB == null ? song.bars - 1 : loopB, song.bars - 1)), off = a * PER;
      clk = MU.clock({ bpm: song.tempo, stepsPerBeat: 2, steps: (b - a + 1) * PER, once: !loop, onEnd: () => { clk = null; playBtn.textContent = '▶ Play'; playPos = -1; markNow(); },
        onStep: (i0, w, secs) => { const i = i0 + off; playStep(song, i, secs, cfg.drums); setTimeout(() => { if (clk) { playPos = i; markNow(); } }, secs * 1000); } });
      clk.start(); playBtn.textContent = '■ Stop';
    }
    playBtn.onclick = () => (clk && clk.running) ? stop() : start();
    const viewBtns = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
    function drawViewBtns() {
      viewBtns.innerHTML = '';
      [['block', '▦ Blocks'], ['staff', '🎼 Staff']].forEach(([k, t]) => viewBtns.append(h('button', { class: 'chip btnlike' + (view === k ? ' on' : ''), onclick: () => { view = k; drawViewBtns(); render(); } }, t)));
      viewBtns.append(h('button', { class: 'chip btnlike' + (showNames ? ' on' : ''), onclick: () => { showNames = !showNames; drawViewBtns(); render(); } }, 'ABC names'));
    }
    transport.append(h('div', { class: 'row', style: { justifyContent: 'center', gap: '10px', flexWrap: 'wrap' } }, playBtn, loopBtn),
      h('div', { class: 'row mt8' }, h('span', null, '🐢'), tempo, h('span', null, '🐇')), h('div', { class: 'center small' }, tempoLbl), h('div', { class: 'mt8' }, viewBtns));
    drawViewBtns();

    /* loop section */
    function drawLoop() {
      loopBox.innerHTML = '';
      if (loopA >= song.bars) loopA = song.bars - 1; if (loopB != null && loopB >= song.bars) loopB = song.bars - 1; if (loopB != null && loopB < loopA) loopB = loopA;
      const opt = (i, cur) => h('option', { value: i, selected: i === cur }, 'Bar ' + (i + 1));
      const selA = h('select', { class: 'inp', style: { width: 'auto', padding: '6px 10px' }, 'aria-label': 'Loop from bar', onchange: e => { loopA = Number(e.target.value); if (loopB != null && loopB < loopA) loopB = loopA; if (clk) start(); drawLoop(); } }, Array.from({ length: song.bars }, (_, i) => opt(i, loopA)));
      const selB = h('select', { class: 'inp', style: { width: 'auto', padding: '6px 10px' }, 'aria-label': 'Loop to bar', onchange: e => { loopB = Number(e.target.value); if (loopB < loopA) loopA = loopB; if (clk) start(); drawLoop(); } }, Array.from({ length: song.bars }, (_, i) => i >= loopA ? opt(i, loopB == null ? song.bars - 1 : loopB) : null));
      loopBox.append(h('div', { class: 'row mt8', style: { justifyContent: 'center', gap: '8px', flexWrap: 'wrap' } }, h('span', { class: 'small' }, '🔁 Play from'), selA, h('span', { class: 'small' }, 'to'), selB,
        h('button', { class: 'chip btnlike', onclick: () => { loopA = bar; loopB = bar; loop = true; loopBtn.classList.add('on'); drawLoop(); start(); } }, 'Loop this bar'),
        h('button', { class: 'chip btnlike', onclick: () => { loopA = 0; loopB = null; if (clk) start(); drawLoop(); } }, 'Whole song'),
        h('button', { class: 'chip btnlike', onclick: undo }, '↩ Undo' + (undoStack.length ? ' (' + undoStack.length + ')' : ''))));
    }
    /* bar tools: clear, copy ("loop") one bar's layers into other bars */
    const layerName = i => i < 0 ? '🥁 Beats' : VOICES[i].e + ' ' + VOICES[i].name;
    const inScope = () => { const l = []; if (cfg.drums && scope.d) l.push(-1); scope.v.forEach((x, i) => { if (x) l.push(i); }); return l; };
    function clearBar(b, layers) {
      const a = b * PER, e = a + PER; song.notes = song.notes.filter(n => !(n.s >= a && n.s < e && layers.indexOf(n.v) > -1));
      if (layers.indexOf(-1) > -1) Object.keys(song.drums).forEach(k => { for (let i = a; i < e; i++) song.drums[k][i] = false; });
    }
    function copyBar(src, dst, layers) {
      clearBar(dst, layers); const so = src * PER, dof = dst * PER;
      song.notes.filter(n => n.s >= so && n.s < so + PER && layers.indexOf(n.v) > -1 && !n.__c).slice().forEach(n => song.notes.push({ s: n.s - so + dof, n: n.n, len: n.len, v: n.v }));
      if (layers.indexOf(-1) > -1) Object.keys(song.drums).forEach(k => { for (let i = 0; i < PER; i++) song.drums[k][dof + i] = !!song.drums[k][so + i]; });
    }
    function drawTools() {
      toolsBox.innerHTML = ''; const layers = inScope(); [...targets].forEach(t => { if (t >= song.bars || t === bar) targets.delete(t); });
      const lay = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
      if (cfg.drums) lay.append(h('button', { class: 'chip btnlike' + (scope.d ? ' on' : ''), onclick: () => { scope.d = !scope.d; render(); } }, '🥁 Beats'));
      VOICES.forEach((V, i) => lay.append(h('button', { class: 'chip btnlike' + (scope.v[i] ? ' on' : ''), style: scope.v[i] ? { background: V.c } : null, onclick: () => { scope.v[i] = !scope.v[i]; render(); } }, V.e + ' ' + V.name)));
      const tg = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
      for (let b = 0; b < song.bars; b++) if (b !== bar) tg.append(h('button', { class: 'chip btnlike' + (targets.has(b) ? ' on' : ''), onclick: () => { targets.has(b) ? targets.delete(b) : targets.add(b); drawTools(); } }, 'Bar ' + (b + 1)));
      const quick = h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } },
        h('button', { class: 'chip btnlike', onclick: () => { targets = new Set(Array.from({ length: song.bars }, (_, i) => i).filter(i => i !== bar)); drawTools(); } }, 'All other bars'),
        h('button', { class: 'chip btnlike', onclick: () => { targets = new Set(Array.from({ length: song.bars }, (_, i) => i).filter(i => i > bar)); drawTools(); } }, 'Bars after this'),
        h('button', { class: 'chip btnlike', onclick: () => { targets = new Set(Array.from({ length: song.bars }, (_, i) => i).filter(i => i > bar && (i - bar) % 2 === 0)); drawTools(); } }, 'Every other bar'),
        h('button', { class: 'chip btnlike', onclick: () => { targets = new Set(); drawTools(); } }, 'None'));
      const names = layers.map(layerName).join(', ') || 'nothing picked';
      toolsBox.append(h('div', { class: 'card flat mt16' }, h('b', null, '🧰 Bar tools'),
        h('p', { class: 'small muted mt8' }, 'Pick which layers to work on, then clear them or repeat this bar. Pasted bars are real notes, so you can still edit every one. Made a mistake? ↩ Undo.'), lay,
        h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: () => { if (!layers.length) return MU.toast('Pick a layer first'); snap(); clearBar(bar, layers); sel = null; render(); } }, 'Clear Bar ' + (bar + 1)),
          h('button', { class: 'btn ghost', onclick: () => { if (!layers.length) return MU.toast('Pick a layer first'); if (!confirm('Clear ' + names + ' in the whole song?')) return; snap(); for (let b = 0; b < song.bars; b++) clearBar(b, layers); sel = null; render(); } }, 'Clear whole song')),
        h('p', { class: 'small mt12 center' }, h('b', null, 'Repeat Bar ' + (bar + 1) + ' (' + names + ') into:')), tg, quick,
        h('div', { class: 'center mt12' }, h('button', { class: 'btn mint', onclick: () => { if (!layers.length) return MU.toast('Pick a layer first'); if (!targets.size) return MU.toast('Pick the bars to repeat into'); snap(); [...targets].forEach(t => copyBar(bar, t, layers)); sel = null; MU.toast('Repeated into ' + targets.size + ' bar' + (targets.size > 1 ? 's' : '') + '. Replaced what was there.'); render(); } }, '📋 Replace those bars with this one'))));
    }

    /* voices */
    function drawVoices() {
      voiceBox.innerHTML = '';
      const chips = h('div', { class: 'voices' });
      VOICES.forEach((V, i) => {
        const on = av === i, vs = song.voices[i], count = song.notes.filter(n => n.v === i).length;
        const b = h('button', { class: 'voicechip' + (on ? ' on' : '') + (vs.mute ? ' muted' : ''), style: { '--c': V.c } }, h('span', { class: 'vd' }), h('span', null, V.e + ' ' + V.name), h('small', null, count ? count + ' notes' : 'empty'));
        b.onclick = () => { av = i; win = i === 3 ? 'bass' : i === 2 ? 'low' : 'high'; sel = null; render(); };
        const m = h('button', { class: 'vmute', 'aria-label': (vs.mute ? 'Unmute ' : 'Mute ') + V.name, title: vs.mute ? 'Muted' : 'Playing' }, vs.mute ? '🔇' : '🔊');
        m.onclick = e => { e.stopPropagation(); vs.mute = !vs.mute; render(); };
        chips.append(h('div', { class: 'vwrap' }, b, m));
      });
      if (cfg.drums) { const dm = song.drumMute; const b = h('div', { class: 'vwrap' }, h('div', { class: 'voicechip', style: { '--c': '#6B4FD8', opacity: dm ? .55 : 1 } }, h('span', null, '🥁 Beats'), h('small', null, 'drum rows')), h('button', { class: 'vmute', 'aria-label': dm ? 'Unmute beats' : 'Mute beats', onclick: () => { song.drumMute = !song.drumMute; render(); } }, dm ? '🔇' : '🔊')); chips.append(b); }
      const sel2 = h('select', { class: 'inp', style: { width: 'auto', padding: '6px 10px' }, 'aria-label': 'Sound for ' + VOICES[av].name, onchange: e => { song.voices[av].inst = e.target.value; sound('C4', 2); } }, INSTS.map(([k, t]) => h('option', { value: k, selected: k === song.voices[av].inst }, t)));
      voiceBox.append(h('div', { class: 'small center mt12' }, h('b', null, 'Voices'), ' are layers that play together. Pick one, then add notes to it.'), chips,
        h('div', { class: 'row mt8', style: { justifyContent: 'center', gap: '8px' } }, h('span', { class: 'small' }, VOICES[av].e + ' ' + VOICES[av].name + ' plays:'), sel2));
    }

    /* tabs + shared header */
    function tabs() {
      const row = h('div', { class: 'tabs mt12' });
      for (let b = 0; b < song.bars; b++) {
        const has = inBar(b).length || (cfg.drums && Object.values(song.drums).some(a => a.slice(b * PER, b * PER + PER).some(Boolean)));
        const playing = playPos >= 0 && Math.floor(playPos / PER) === b;
        row.append(h('button', { class: bar === b ? 'on' : '', onclick: () => { bar = b; sel = null; if (keysMode && Math.floor(cursor / PER) !== b) cursor = b * PER; render(); } }, 'Bar ' + (b + 1) + (playing ? ' ▶' : has ? ' •' : '')));
      }
      if (song.bars < MAXBARS) row.append(h('button', { onclick: () => { song.bars++; fit(); bar = song.bars - 1; render(); } }, '＋ Bar'));
      if (song.bars > 1) row.append(h('button', { onclick: () => { if (inBar(song.bars - 1).length && !confirm('Remove the last bar and its notes?')) return; snap(); song.bars--; fit(); if (bar >= song.bars) bar = song.bars - 1; if (cursor > total()) cursor = total(); sel = null; render(); } }, '－ Bar'));
      return row;
    }
    const COLS = '16.4% repeat(8, 1fr)';
    const beatHead = () => h('div', { class: 'mgrid', style: { gridTemplateColumns: COLS, gridTemplateRows: '16px' } }, h('div'), ['1', '&', '2', '&', '3', '&', '4', '&'].map((x, i) => h('div', { class: 'mhead', 'data-col': i }, x)));
    const dimmed = n => song.voices[n.v].mute ? .3 : (n.v === av ? 1 : .62);

    /* ----- block view ----- */
    function blockView() {
      const base = bar * PER, lo = winLo(), hi = winHi(), rows = []; for (let st = hi; st >= lo; st--) rows.push(st);
      const wrap = h('div', null);
      const out = inBar(bar).filter(n => { const st = MU.stepOf(n.n); return st < lo || st > hi; });
      const ctl = h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, Object.keys(WINS).map(k => h('button', { class: 'chip btnlike' + (win === k ? ' on' : ''), onclick: () => { win = k; render(); } }, WINS[k][2])));
      if (out.length) ctl.append(h('span', { class: 'small muted' }, out.length + ' note' + (out.length > 1 ? 's' : '') + ' out of view'));
      wrap.append(ctl, beatHead());
      const grid = h('div', { class: 'mgrid', style: { gridTemplateColumns: COLS, gridTemplateRows: 'repeat(' + rows.length + ', 27px)' } });
      rows.forEach((st, ri) => {
        const L = LET[st % 7]; grid.append(h('div', { class: 'mlab' + (L === 'C' ? ' c' : ''), style: { gridRow: ri + 1, gridColumn: 1 } }, L === 'C' ? L + Math.floor(st / 7) : L));
        for (let c = 0; c < PER; c++) {
          const step = base + c;
          if (!covering(step, st).length) {
            const cell = h('button', { class: 'mcell' + (c % 2 === 0 ? ' beat' : '') + (keysMode && step === cursor ? ' cur' : ''), 'data-col': c, style: { gridRow: ri + 1, gridColumn: c + 2 }, 'aria-label': L + ' step ' + (c + 1) });
            cell.onclick = () => gridTap(step, st); grid.append(cell);
          }
        }
      });
      inBar(bar).forEach(n => {
        const st = MU.stepOf(n.n); if (st < lo || st > hi) return; const c = n.s - base;
        const b = h('button', { class: 'mblock' + (sel === n ? ' sel' : ''), style: { gridRow: (hi - st) + 1, gridColumn: (c + 2) + ' / span ' + n.len, '--c': vcol(n.v), opacity: dimmed(n) }, 'aria-label': VOICES[n.v].name + ' ' + n.n }, pretty(n.n).replace(/\d/, ''));
        b.onclick = () => select(n); grid.append(b);
      });
      wrap.append(grid); return wrap;
    }

    /* ----- grand staff view ----- */
    function staffView() {
      const g = 12, W = 330, x0 = 54, colW = (W - x0 - 8) / PER, base = bar * PER;
      const tTop = 24, tHi = HI + 3, tLo = 26, yT = st => tTop + (tHi - st) * g / 2;
      const bTop = yT(tLo) + 14, bHi = 29, bLo = 5, yB = st => bTop + (bHi - st) * g / 2, H = yB(bLo) + 30;
      const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'staffsvg', role: 'img', 'aria-label': 'Grand staff for bar ' + (bar + 1), style: { touchAction: 'manipulation' } });
      const tt = { y: yT, lines: [30, 32, 34, 36, 38], hi: tHi, lo: tLo }, bb = { y: yB, lines: [18, 20, 22, 24, 26], hi: bHi, lo: bLo };
      [tt, bb].forEach(S => { for (let c = 0; c < PER; c++) svg.append(s('rect', { x: x0 + c * colW, y: S.y(S.hi), width: colW, height: S.y(S.lo) - S.y(S.hi), fill: c % 2 === 0 ? 'rgba(107,79,216,.05)' : 'transparent', 'data-col': c, class: 'colbg' }));
        S.lines.forEach(st => svg.append(s('line', { x1: 8, x2: W - 6, y1: S.y(st), y2: S.y(st), stroke: '#2B1B4D', 'stroke-width': 1.4 })));
        svg.append(s('line', { x1: 8, x2: 8, y1: S.y(S.lines[0]), y2: S.y(S.lines[4]), stroke: '#2B1B4D', 'stroke-width': 2 }), s('line', { x1: W - 6, x2: W - 6, y1: S.y(S.lines[0]), y2: S.y(S.lines[4]), stroke: '#2B1B4D', 'stroke-width': 2 })); });
      svg.append(s('path', { d: 'M8 ' + yT(38) + ' L8 ' + yB(18), stroke: '#2B1B4D', 'stroke-width': 3, fill: 'none' }));
      svg.append(s('text', { x: 12, y: yT(32) + g * .8, 'font-size': g * 3.1, 'font-family': 'Georgia,serif', 'font-style': 'italic', 'font-weight': 700, fill: '#6B4FD8' }, 'G'));
      svg.append(s('text', { x: 12, y: yB(20) + g * .8, 'font-size': g * 2.9, 'font-family': 'Georgia,serif', 'font-style': 'italic', 'font-weight': 700, fill: '#6B4FD8' }, 'F'));
      svg.append(s('circle', { cx: 40, cy: yB(25), r: 2.2, fill: '#6B4FD8' }), s('circle', { cx: 40, cy: yB(23), r: 2.2, fill: '#6B4FD8' }));
      [[yT, 36, 32], [yB, 24, 20]].forEach(([f, a, b]) => svg.append(s('text', { x: 38, y: f(a) + 3, 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#2B1B4D', 'text-anchor': 'middle' }, '4'), s('text', { x: 38, y: f(b) + 4, 'font-size': 13, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#2B1B4D', 'text-anchor': 'middle' }, '4')));
      ['1', '&', '2', '&', '3', '&', '4', '&'].forEach((t, c) => svg.append(s('text', { x: x0 + (c + .5) * colW, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: '#716a82', 'data-col': c, class: 'blab' }, t)));
      if (keysMode) { const cc = cursor - base; if (cc >= 0 && cc < PER) [tt, bb].forEach(S => svg.append(s('rect', { x: x0 + cc * colW + 1, y: S.y(S.hi) + 1, width: colW - 2, height: S.y(S.lo) - S.y(S.hi) - 2, fill: 'none', stroke: '#6B4FD8', 'stroke-width': 2.5, 'stroke-dasharray': '5 3', rx: 6 }))); }
      // tap targets (treble: C4 up, bass: below C4)
      for (let c = 0; c < PER; c++) for (let st = LO; st <= HI; st++) {
        const S = st >= SPLIT ? tt : bb;
        const r = s('rect', { x: x0 + c * colW, y: S.y(st) - g / 4, width: colW, height: g / 2, fill: 'transparent', style: { cursor: 'pointer' } });
        r.addEventListener('pointerdown', ev => { ev.preventDefault(); gridTap(base + c, st); }); svg.append(r);
      }
      // notes, grouped so close seconds do not sit on top of each other
      for (let c = 0; c < PER; c++) {
        const list = song.notes.filter(n => n.s === base + c).sort((a, b) => MU.stepOf(a.n) - MU.stepOf(b.n)); let prevSt = -9, prevOff = false;
        list.forEach(n => {
          const st = MU.stepOf(n.n), S = st >= SPLIT ? tt : bb, y = S.y, treble = S === tt, mid = treble ? 34 : 22;
          const off = (st - prevSt === 1 && !prevOff); prevSt = st; prevOff = off;
          const cx = x0 + (c + .5) * colW + (off ? 11 : 0), cy = y(st), isSel = sel === n, col = vcol(n.v), info = lenInfo(n.len), up = st < mid, op = dimmed(n);
          const grp = s('g', { style: { cursor: 'pointer' }, opacity: op });
          if (isSel) grp.append(s('circle', { cx, cy, r: 13, fill: 'rgba(245,184,61,.55)' }));
          for (let l = 28; l >= st && treble; l -= 2) grp.append(s('line', { x1: cx - 13, x2: cx + 13, y1: y(l), y2: y(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
          for (let l = 16; l >= st && !treble; l -= 2) grp.append(s('line', { x1: cx - 13, x2: cx + 13, y1: y(l), y2: y(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
          for (let l = 40; l <= st && treble; l += 2) grp.append(s('line', { x1: cx - 13, x2: cx + 13, y1: y(l), y2: y(l), stroke: '#2B1B4D', 'stroke-width': 1.4 }));
          if (n.len > 1) grp.append(s('rect', { x: cx, y: cy - 3, width: Math.max(2, (n.len - .5) * colW - 4), height: 6, rx: 3, fill: col, opacity: .3 }));
          if (info.kind !== 'whole') {
            grp.append(s('line', up ? { x1: cx + 7, x2: cx + 7, y1: cy, y2: cy - g * 3.3, stroke: col, 'stroke-width': 2 } : { x1: cx - 7, x2: cx - 7, y1: cy, y2: cy + g * 3.3, stroke: col, 'stroke-width': 2 }));
            if (n.len === 1) grp.append(s('path', up ? { d: 'M' + (cx + 7) + ' ' + (cy - g * 3.3) + ' q 10 6 4 16', fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' } : { d: 'M' + (cx - 7) + ' ' + (cy + g * 3.3) + ' q 10 -6 4 -16', fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
          }
          const open = n.len >= 4;
          grp.append(s('ellipse', { cx, cy, rx: 8, ry: 5.8, fill: open ? '#fff' : col, stroke: col, 'stroke-width': open ? 2.4 : 1, transform: 'rotate(-20 ' + cx + ' ' + cy + ')' }));
          if (info.kind === 'whole') grp.append(s('ellipse', { cx, cy, rx: 3.4, ry: 6.6, fill: col, transform: 'rotate(25 ' + cx + ' ' + cy + ')' }));
          if (info.dot) grp.append(s('circle', { cx: cx + 14, cy: cy + (st % 2 === 0 ? -3 : 0), r: 2.4, fill: col }));
          if (isSharp(n.n)) grp.append(sharpShape(cx - 16, cy, col));
          if (showNames) grp.append(s('text', { x: cx + 12, y: cy + 4, 'font-size': 10, 'font-weight': 800, 'font-family': 'Nunito,sans-serif', fill: col }, pretty(n.n).replace(/\d/, '')));
          grp.append(s('circle', { cx, cy, r: 11, fill: 'transparent' }));
          grp.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); select(n); });
          svg.append(grp);
        });
      }
      return h('div', { class: 'svgwrap staffwrap' }, svg);
    }

    /* ----- drums ----- */
    function drumView() {
      const base = bar * PER, wrap = h('div', { class: 'mt12' }, h('b', { class: 'small' }, '🥁 Beats'));
      const grid = h('div', { class: 'mgrid mt8', style: { gridTemplateColumns: COLS, gridTemplateRows: 'repeat(' + DRUMS.length + ', 34px)' } });
      DRUMS.forEach((d, ri) => {
        grid.append(h('div', { class: 'mlab', style: { gridRow: ri + 1, gridColumn: 1 } }, d.n));
        for (let c = 0; c < PER; c++) {
          const cell = h('button', { class: 'cell' + (c % 2 === 0 ? ' beat' : '') + (song.drums[d.k][base + c] ? ' on' : ''), 'data-col': c, style: { gridRow: ri + 1, gridColumn: c + 2, '--c': d.c, minHeight: 0 }, 'aria-label': d.n + ' step ' + (c + 1) });
          cell.onclick = () => { const v = !song.drums[d.k][base + c]; song.drums[d.k][base + c] = v; cell.classList.toggle('on', v); if (v) MU.drum(d.k, { vol: .6 }); }; grid.append(cell);
        }
      });
      wrap.append(grid); return wrap;
    }

    /* ----- edit panel ----- */
    function lenChips() {
      const row = h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, ); const cur = sel ? sel.len : curLen;
      LENS.filter(l => l.lvl <= lvl).forEach(l => { const b = h('button', { class: 'chip btnlike lenchip' + (cur === l.len ? ' on' : '') }, MU.noteShape(l.kind, 30), h('span', { class: 'small' }, l.dot ? l.name.replace('Dotted ', '') + ' •' : l.name)); b.onclick = () => { if (sel) editLen(l.len); else { curLen = l.len; render(); } }; row.append(b); });
      return row;
    }
    function chordGroup() { return sel ? song.notes.filter(x => x.v === sel.v && x.s === sel.s && x.len === sel.len) : []; }
    function chordSwap() {
      const grp = chordGroup(); if (grp.length < 2) return null;
      const degs = lvl === 1 ? [0, 3, 4] : [0, 1, 2, 3, 4, 5, 6], v = sel.v, s0 = sel.s, ln = sel.len;
      const row = h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, degs.map(d => h('button', { class: 'chip btnlike', onclick: () => {
        snap(); song.notes = song.notes.filter(x => grp.indexOf(x) < 0); const names = chordNotes(d, seventh && lvl >= 3, v === 3 ? 2 : 3);
        names.forEach(nm => addNote(s0, nm, ln, v)); MU.chord(names, 1, { inst: song.voices[v].inst, vol: .2 }); sel = song.notes.find(x => x.v === v && x.s === s0 && x.n === names[0]) || null; render(); } }, chordName(d, seventh && lvl >= 3))));
      return h('div', null, h('p', { class: 'small mt8 center' }, h('b', null, '🎹 Change this whole chord (' + grp.length + ' notes) to:')), row,
        h('div', { class: 'center mt8' }, h('button', { class: 'btn ghost', onclick: () => { snap(); song.notes = song.notes.filter(x => grp.indexOf(x) < 0); sel = null; render(); } }, '🗑 Delete the whole chord')));
    }
    function editPanel() {
      editBox.innerHTML = ''; if (!sel) return;
      const V = VOICES[sel.v];
      editBox.append(h('div', { class: 'card flat editbar mt12' },
        h('b', null, '✏️ Editing: ' + pretty(sel.n) + ' · ' + lenInfo(sel.len).name.toLowerCase() + ' note · ' + V.e + ' ' + V.name),
        keysMode ? h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, h('button', { class: 'chip btnlike' + (keyReplace ? ' on' : ''), onclick: () => { keyReplace = !keyReplace; render(); } }, keyReplace ? '🎹 Keys change this note: ON' : '🎹 Keys change this note: off'), h('span', { class: 'small muted' }, keyReplace ? 'Tap a key to swap the pitch.' : 'Keys add new notes; use ⬆⬇ to change this one.')) : h('p', { class: 'small muted' }, 'Change it with the buttons, or tap an empty spot to add another note.'),
        h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: () => editPitch(1) }, '⬆ Higher'), h('button', { class: 'btn ghost', onclick: () => editPitch(-1) }, '⬇ Lower'),
          lvl >= 2 ? h('button', { class: 'btn ghost', onclick: editSharp }, isSharp(sel.n) ? '♮ Natural' : '♯ Sharp') : null,
          h('button', { class: 'btn ghost', onclick: () => editMove(-1) }, '◀ Earlier'), h('button', { class: 'btn ghost', onclick: () => editMove(1) }, 'Later ▶')),
        h('p', { class: 'small mt8 center' }, 'Length:'), lenChips(),
        chordSwap(),
        h('p', { class: 'small mt8 center' }, 'Voice:'), h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, VOICES.map((vv, i) => h('button', { class: 'chip btnlike' + (sel.v === i ? ' on' : ''), style: sel.v === i ? { background: vv.c } : null, onclick: () => editVoice(i) }, vv.e + ' ' + vv.name))),
        h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, h('button', { class: 'btn coral', onclick: editDelete }, '🗑 Delete note (Del)'), h('button', { class: 'btn mint', onclick: () => { sel = null; render(); } }, '✔ Done editing'))));
    }

    /* ----- input: lengths, chord stamps, keyboard ----- */
    function chordRow() {
      const degs = lvl === 1 ? [0, 3, 4] : lvl === 2 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
      const box = h('div', { class: 'mt12' }, h('p', { class: 'small center' }, h('b', null, '🎹 Chords'), keysMode ? ': tap one to add it at the marker.' : ': tap one, then tap a column to stamp it.'));
      const row = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
      degs.forEach(d => { const nm = chordName(d, seventh && lvl >= 3); const b = h('button', { class: 'chip btnlike' + (chordSel === d ? ' on' : ''), style: chordSel === d ? { background: VOICES[2].c } : null }, nm, lvl >= 2 ? h('small', { style: { opacity: .7, marginLeft: '4px' } }, CHORDS[d][0]) : null);
        b.onclick = () => { if (keysMode) { sel = null; keysChord(d); } else { chordSel = chordSel === d ? null : d; if (chordSel != null && av < 2) av = 2; render(); } }; row.append(b); });
      if (lvl >= 3) row.append(h('button', { class: 'chip btnlike' + (seventh ? ' on' : ''), onclick: () => { seventh = !seventh; render(); } }, '7th'));
      box.append(row);
      if (!keysMode && chordSel != null) box.append(h('div', { class: 'feedback good mt8' }, 'Stamping ' + chordName(chordSel, seventh && lvl >= 3) + ': tap a column. Longer note length = longer chord. ', h('button', { class: 'chip btnlike', onclick: () => { chordSel = null; render(); } }, 'Stop stamping')));
      return box;
    }
    function inputPanel() {
      inputBox.innerHTML = '';
      if (!sel) inputBox.append(h('p', { class: 'small center mt12' }, h('b', null, 'New note length:')), lenChips());
      if (!sel) inputBox.append(chordRow());
      if (keysMode) {
        const from = WINS[win][0], to = WINS[win][1];
        const kb = MU.keyboard({ from, to, labels: 'names', height: 120, inst: song.voices[av].inst, dur: .5, onPlay: keyPress }); kb.el.classList.add('hidesharp');
        inputBox.append(h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
          Object.keys(WINS).map(k => h('button', { class: 'chip btnlike' + (win === k ? ' on' : ''), onclick: () => { win = k; render(); } }, WINS[k][3] + ' (' + WINS[k][0] + '–' + WINS[k][1] + ')')),
          h('button', { class: 'chip btnlike' + (stack ? ' on' : ''), onclick: () => { stack = !stack; render(); } }, stack ? '🥞 Stacking ON' : '🥞 Stack notes')),
          h('div', { class: 'mt8' }, kb.el),
          h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, stack ? h('button', { class: 'btn mint', onclick: () => { advance(); render(); } }, 'Next ▶') : null, h('button', { class: 'btn ghost', onclick: () => { advance(); render(); } }, '⏸ Rest'), h('button', { class: 'btn ghost', onclick: back }, '⌫ Back'),
            h('button', { class: 'btn ghost', onclick: () => { cursor = 0; bar = 0; sel = null; render(); } }, '⏮ Start')),
          h('p', { class: 'small muted center mt8' }, sel ? '' : (stack ? 'Stacking: each key adds to the same spot, so you can build a chord. Press Next to move on.' : 'Notes go in at the dashed marker. Tap an empty square to move it. Turn on Stack to play two notes at once.')));
      } else if (lvl >= 2) inputBox.append(h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, h('button', { class: 'chip btnlike' + (sharpMode ? ' on' : ''), onclick: () => { sharpMode = !sharpMode; render(); } }, sharpMode ? '♯ Sharps ON' : '♯ Sharps off')));
    }
    function helpers() {
      helpBox.innerHTML = '';
      const hr = h('div', { class: 'wrapx', style: { justifyContent: 'center' } }, HARM.slice(0, lvl === 1 ? 2 : 5).map(([t, d]) => h('button', { class: 'chip btnlike', onclick: () => harmonize(d) }, t)));
      helpBox.append(h('div', { class: 'card flat mt16' }, h('b', null, '✨ Helpers'), h('p', { class: 'small muted mt8' }, 'Polyphony means more than one note or line at once. Let the studio start one for you, then change it.'),
        h('p', { class: 'small mt8' }, h('b', null, 'Add a harmony line'), ' under your melody:'), hr,
        h('div', { class: 'center mt12' }, h('button', { class: 'btn ghost', onclick: autoChords }, '🎹 Suggest chords for my melody'))));
    }

    /* ----- footer ----- */
    function footer() {
      foot.innerHTML = '';
      foot.append(h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } },
        h('button', { class: 'btn ghost', onclick: saveDialog }, '💾 Save'), h('button', { class: 'btn ghost', onclick: openDialog }, '📂 My songs'), h('button', { class: 'btn ghost', onclick: exportMidi }, '⬇ MIDI file'),
        h('button', { class: 'btn ghost', onclick: () => { if (!song.notes.length && !Object.values(song.drums).some(a => a.some(Boolean))) return; if (confirm('Clear everything and start fresh?')) { snap(); song.notes = []; Object.keys(song.drums).forEach(k => song.drums[k] = []); fit(); sel = null; cursor = 0; bar = 0; savedId = null; render(); } } }, '🧹 Clear')),
        h('button', { class: 'btn navy wide mt12', onclick: finish }, "I'm happy with my song ✔"));
    }
    function exportMidi() {
      if (!song.notes.length && !Object.values(song.drums).some(a => a.some(Boolean))) return MU.toast('Make something first');
      const bytes = midiBytes(song), blob = new Blob([bytes], { type: 'audio/midi' }), a = h('a', { href: URL.createObjectURL(blob), download: ((song.name || 'my-song').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'my-song') + '.mid' });
      document.body.append(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(a.href); }, 500); MU.toast('MIDI file saved. Open it in any music program or game engine tool.');
    }
    function saveDialog() {
      if (!song.notes.length) return MU.toast('Add some notes first');
      const inp = h('input', { class: 'inp', maxlength: 28, placeholder: 'Name your song', value: song.name || '' });
      MU.modal(h('div', null, h('div', { class: 'bigem' }, '💾'), h('h3', null, 'Save your song'), h('div', { class: 'mt12' }, inp),
        h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: MU.closeModal }, 'Cancel'),
          h('button', { class: 'btn mint', onclick: () => { song.name = (inp.value || '').trim() || 'My song'; savedId = MU.saveSong(Object.assign(pack(song), { name: song.name, kind: cfg.kind }), savedId); MU.closeModal(); MU.toast('Saved!'); } }, 'Save'))), { dismiss: true });
      setTimeout(() => inp.focus(), 60);
    }
    function openDialog() {
      const list = MU.songList(), box = h('div', null, h('h3', null, '📂 My songs'));
      if (!list.length) box.append(h('p', { class: 'muted mt8' }, 'Nothing saved yet. Make a song and press Save!'));
      list.forEach(sg => box.append(h('div', { class: 'row mt8', style: { justifyContent: 'space-between' } }, h('span', { style: { flex: 1, textAlign: 'left' } }, h('b', null, sg.name || 'My song'), h('div', { class: 'small muted' }, new Date(sg.ts).toLocaleDateString())),
        h('button', { class: 'chip btnlike', onclick: () => { stop(); const sn = unpack(sg); song.bars = sn.bars; song.tempo = sn.tempo; song.voices = sn.voices; song.drumMute = sn.drumMute; undoStack = []; song.notes = sn.notes; song.drums = sn.drums; song.name = sg.name; savedId = sg.id; tempo.value = song.tempo; tempoLbl.textContent = song.tempo + ' BPM'; fit(); bar = 0; sel = null; cursor = Math.min(total(), song.notes.reduce((a, n) => Math.max(a, n.s + n.len), 0)); MU.closeModal(); render(); } }, 'Open'),
        h('button', { class: 'chip btnlike', onclick: e => { if (confirm('Delete "' + (sg.name || 'My song') + '"?')) { MU.deleteSong(sg.id); e.currentTarget.parentNode.remove(); } } }, '🗑'))));
      box.append(h('div', { class: 'center mt16' }, h('button', { class: 'btn ghost', onclick: MU.closeModal }, 'Close'))); MU.modal(box, { dismiss: true });
    }
    function finish() {
      const n = song.notes.length; if (n < 3) return MU.toast('Add at least 3 notes first');
      const pitches = new Set(song.notes.map(x => x.n)).size, lens = new Set(song.notes.map(x => x.len)).size, voices = new Set(song.notes.map(x => x.v)).size, dr = cfg.drums ? DRUMS.filter(d => song.drums[d.k].some(Boolean)).length : 0;
      let score = 1; if (n >= 6 && pitches >= 3) score = 2; if (n >= 8 && pitches >= 4 && lens >= 2 && voices >= 2 && (!cfg.drums || dr >= 2)) score = 3;
      stop(); ctx.finish(score, 3, 'Your song has ' + n + ' notes in ' + voices + ' voice' + (voices === 1 ? '' : 's') + ', with ' + pitches + ' different pitches' + (cfg.drums ? ' and ' + dr + ' beat sound' + (dr === 1 ? '' : 's') : '') + '.' + (score < 3 ? ' For 3 stars add a second voice (a harmony or chords), more note lengths' + (cfg.drums ? ' and more drums' : '') + '.' : ' Wonderful music!'));
    }
    function markNow() {
      const c = playPos >= 0 && Math.floor(playPos / PER) === bar ? playPos - bar * PER : -1;
      root.querySelectorAll('[data-col]').forEach(el => {
        const on = Number(el.getAttribute('data-col')) === c;
        if (el.classList.contains('colbg')) el.setAttribute('fill', on ? 'rgba(245,184,61,.4)' : (Number(el.getAttribute('data-col')) % 2 === 0 ? 'rgba(107,79,216,.05)' : 'transparent'));
        else el.classList.toggle('now', on);
      });
    }
    function render() {
      if (cursor > total()) cursor = total();
      drawLoop(); drawVoices(); body.innerHTML = ''; body.append(tabs(), view === 'staff' ? staffView() : blockView());
      if (cfg.drums) body.append(drumView());
      editPanel(); inputPanel(); helpers(); drawTools(); footer(); markNow();
    }
    const onKey = e => {
      const t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.querySelector('.modal')) return;
      if (e.key === 'Delete' && sel) { e.preventDefault(); editDelete(); }
      else if (e.key === 'Escape' && sel) { sel = null; render(); }
    };
    document.addEventListener('keydown', onKey);
    render();
    MU.onLeave(() => { stop(); document.removeEventListener('keydown', onKey); });
  };

  /* =====================================================================================================
   * Labs
   * ===================================================================================================== */
  const L = (id, o) => { MU.labs[id] = o; };
  const common = 'Use the voices to play several parts at once: a melody, a harmony, chords and a bass. ';
  L('key-tunes', { emoji: '🎹', title: 'Keyboard Tune Maker', blurb: 'Play the keys to write tunes, harmonies and chords',
    run(ctx) { MU.songEditor(ctx, { kind: 'keys', input: 'keys', view: 'block', drums: false, bars: 4, prompt: 'Pick a note length, then play the keys: each note goes into your bars. ' + common + 'Tap a note to edit it!' }); } });
  L('staff-songwriter', { emoji: '🎼', title: 'Staff Songwriter', blurb: 'Write melodies, harmonies and chords on the grand staff',
    run(ctx) { MU.songEditor(ctx, { kind: 'staff', input: 'grid', view: 'staff', drums: false, bars: 4, prompt: 'Tap the staff to place a note: the line or space is the pitch and the column is the time. ' + common + 'Tap a note to edit it!' }); } });
  L('song-studio', { emoji: '🎛️', title: 'Song Studio', blurb: 'Voices, chords and beats together, as blocks or on the staff',
    run(ctx) { MU.songEditor(ctx, { kind: 'studio', input: 'grid', view: 'block', drums: true, bars: 4, prompt: 'Make a whole song: melody, harmony, chords and bass on top, drum beats underneath. Switch between Blocks and Staff any time. Tap a note to edit it!' }); } });

  /* =====================================================================================================
   * Studio hub
   * ===================================================================================================== */
  MU.screens.studio = function () {
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎛️ Music Studio', '/', MU.starPill()));
    wrap.append(h('p', { class: 'muted' }, 'Make your own music, with as many voices as you like. Layer a melody, a harmony, chords and a bass, add beats, and save your songs.'));
    [['rhythm-grid', '#E0529C'], ['key-tunes', '#6B4FD8'], ['staff-songwriter', '#2F8FD0'], ['song-studio', '#12B58C']].forEach(([id, col]) => {
      const lab = MU.labs[id]; if (!lab) return; const st = MU.labStars(id);
      wrap.append(h('button', { class: 'labcard', style: { marginBottom: '10px', borderLeft: '8px solid ' + col }, onclick: () => MU.go('/lab/' + id) }, h('span', { class: 'em' }, lab.emoji), h('span', { style: { flex: 1 } }, h('b', null, lab.title), h('span', { class: 'd' }, lab.blurb)), st ? MU.starsEl(st) : h('span', { class: 'chip' }, 'Make')));
    });
    wrap.append(h('h3', { class: 'sec' }, '📂 My songs'));
    const list = MU.songList(); let clk = null; MU.onLeave(() => { clk && clk.stop(); });
    if (!list.length) wrap.append(h('p', { class: 'muted small' }, 'Songs you save in the Studio tools show up here.'));
    list.forEach(sg => {
      const nNotes = (sg.notes ? sg.notes.length : (sg.mel || []).filter(Boolean).length), play = h('button', { class: 'chip btnlike' }, '▶ Play'), mid = h('button', { class: 'chip btnlike', title: 'Download as a MIDI file' }, '⬇ MIDI');
      play.onclick = () => { if (clk) { clk.stop(); clk = null; } MU.stopAll(); clk = MU.playSongData(sg, () => { play.textContent = '▶ Play'; }); play.textContent = '▶ Playing'; };
      mid.onclick = () => { const bytes = MU.midiBytes(MU.unpackSong(sg)), a = h('a', { href: URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' })), download: ((sg.name || 'my-song').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'my-song') + '.mid' }); document.body.append(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(a.href); }, 500); };
      wrap.append(h('div', { class: 'card flat', style: { padding: '10px 14px', margin: '8px 0' } }, h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, h('b', null, sg.name || 'My song'), h('div', { class: 'small muted' }, nNotes + ' notes · ' + sg.bars + ' bars · ' + new Date(sg.ts).toLocaleDateString())), play, mid)));
    });
    return wrap;
  };
})();
