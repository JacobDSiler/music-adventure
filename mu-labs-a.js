/* Music Adventure - labs for movements 1-3: rhythm, melody & pitch, reading music. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const L = (id, o) => { MU.labs[id] = o; };

  /* ---------- 1. Steady Beat ---------- */
  L('beat-tap', {
    unit: 1, emoji: '👣', title: 'Steady Beat', blurb: 'Tap along with the click, then keep going on your own',
    run(ctx) {
      const bpm = [0, 84, 100, 116][ctx.lvl], TOTAL = 16, COUNTIN = 4;
      const silentAfter = ctx.lvl >= 2 ? 8 : 99;
      const box = h('div', { class: 'stage center' });
      const dots = h('div', { class: 'beatdots' }, [0, 1, 2, 3].map(i => h('i', { class: i === 0 ? 'acc' : '' })));
      const msg = h('div', { class: 'prompt' }, 'Press Start. Listen to the count-in, then tap the big drum on every beat!');
      const info = h('div', { class: 'feedback' }, '');
      const pad = h('button', { class: 'bigbtn', style: { margin: '10px auto', minWidth: '200px', minHeight: '200px', borderRadius: '50%', fontSize: '4.5rem', background: '#E0529C', boxShadow: '0 9px 0 #a8326f' } }, '🥁');
      const start = h('button', { class: 'btn big mint mt8' }, '▶ Start');
      box.append(ctx.sayPrompt(ctx.lvl >= 2 ? 'Tap on every beat. The click will stop halfway: keep the beat going yourself!' : 'Tap on every beat along with the click!'), dots, msg, pad, info, start);
      ctx.root.append(box);
      let running = false, T0 = null, I = 60000 / bpm, taps = [], idx = -1, clk = null, done = false;
      function flashDot(i, accent) { const d = dots.children[i % 4]; d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 140); }
      function begin() {
        if (running) return; running = true; taps = []; T0 = null; idx = -1; done = false; start.classList.add('hide'); info.textContent = '';
        clk = MU.clock({
          bpm, steps: 1000, onStep: (i, when, secs) => {
            idx = i;
            const audible = i < COUNTIN || (i - COUNTIN) < silentAfter;
            if (audible) MU.drum(i % 4 === 0 ? 'accent' : 'click', { when: secs, vol: .7 });
            setTimeout(() => {
              if (!running) return;
              if (i < COUNTIN) { msg.textContent = 'Listen… ' + (i + 1); } else if (i === COUNTIN) { msg.textContent = 'Tap!'; } else if (audible === false && (i - COUNTIN) === silentAfter) { msg.textContent = 'The click stopped. Keep the beat going!'; }
              flashDot(i % 4); }, secs * 1000);
            if (i === COUNTIN) T0 = performance.now() + secs * 1000;
            if (i === COUNTIN + TOTAL) { clk.stop(); setTimeout(finish, I * 0.6); }
          }
        });
        clk.start();
      }
      function finish() {
        running = false; if (done) return; done = true;
        // score: for each of TOTAL beats, was there a tap within 25% of a beat?
        let hits = 0; const used = new Set();
        taps.forEach(t => { const k = Math.round((t - T0) / I); const err = Math.abs(t - T0 - k * I); if (k >= 0 && k < TOTAL && err <= I * 0.28 && !used.has(k)) { used.add(k); hits++; } });
        ctx.finish(hits, TOTAL, 'You tapped ' + hits + ' of ' + TOTAL + ' beats on time.');
      }
      pad.addEventListener('pointerdown', e => {
        e.preventDefault(); MU.drum('tom', { vol: .5 }); pad.classList.add('held'); setTimeout(() => pad.classList.remove('held'), 100);
        if (!running || T0 == null) return;
        const t = performance.now(); taps.push(t);
        const k = Math.round((t - T0) / I), err = t - T0 - k * I;
        if (k >= 0 && k < TOTAL) { info.textContent = Math.abs(err) <= I * 0.28 ? (Math.abs(err) < I * 0.12 ? '✅ Right on the beat!' : (err < 0 ? '👍 a little early' : '👍 a little late')) : (err < 0 ? '⚡ too early' : '🐢 too late'); info.className = 'feedback ' + (Math.abs(err) <= I * 0.28 ? 'good' : 'bad'); }
      });
      start.onclick = begin;
      MU.onLeave(() => { running = false; clk && clk.stop(); });
    }
  });

  /* ---------- 1. Beat Maker (step sequencer) ---------- */
  L('rhythm-grid', {
    unit: 1, emoji: '🎛️', title: 'Beat Maker', blurb: 'Build a groove with drums',
    run(ctx) {
      const ROWS = [{ k: 'kick', n: 'Kick', c: '#E0529C' }, { k: 'snare', n: 'Snare', c: '#6B4FD8' }, { k: 'hat', n: 'Hi-hat', c: '#12B58C' }, { k: 'tamb', n: 'Shaker', c: '#E08A00' }];
      if (ctx.lvl >= 2) ROWS.push({ k: 'bodhran', n: 'Bodhrán', c: '#5C8A2E' });
      const N = 8; const grid = ROWS.map(() => Array(N).fill(false));
      const PRESETS = {
        'Rock': { kick: [0, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] },
        'March': { kick: [0, 2, 4, 6], snare: [1, 3, 5, 7] },
        'Heartbeat': { kick: [0, 1, 4, 5] },
        'Jig-ish': { bodhran: [0, 3], tamb: [1, 2, 4, 5] }
      };
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Tap squares to place sounds. Press play to hear your groove loop!'));
      const labels = h('div', { class: 'row', style: { justifyContent: 'space-between', padding: '0 0 0 68px', fontWeight: 800, color: '#716a82', fontSize: '.8rem' } }, ['1', '&', '2', '&', '3', '&', '4', '&'].map((x, i) => h('span', { style: { flex: 1, textAlign: 'center' } }, x)));
      box.append(labels);
      const sg = h('div', { class: 'seqgrid', style: { gridTemplateColumns: '64px repeat(' + N + ',1fr)' } });
      const cells = ROWS.map((r, ri) => {
        sg.append(h('div', { class: 'lab' }, r.n));
        return Array.from({ length: N }, (x, ci) => {
          const c = h('button', { class: 'cell' + (ci % 2 === 0 ? ' beat' : ''), style: { '--c': r.c }, 'aria-label': r.n + ' step ' + (ci + 1) });
          c.onclick = () => { grid[ri][ci] = !grid[ri][ci]; c.classList.toggle('on', grid[ri][ci]); if (grid[ri][ci]) MU.drum(r.k, { vol: .6 }); };
          sg.append(c); return c;
        });
      });
      box.append(sg);
      let bpm = ctx.lvl === 1 ? 80 : 100;
      const tempoLbl = h('b', null, bpm + ' BPM');
      const slider = h('input', { type: 'range', min: 60, max: 160, value: bpm, 'aria-label': 'Tempo' });
      slider.oninput = () => { bpm = Number(slider.value); tempoLbl.textContent = bpm + ' BPM'; clk && clk.setBpm(bpm); };
      box.append(h('div', { class: 'row mt12' }, h('span', null, '🐢'), slider, h('span', null, '🐇')), h('div', { class: 'center small' }, tempoLbl));
      let clk = null;
      const play = h('button', { class: 'btn mint' }, '▶ Play');
      play.onclick = () => {
        if (clk && clk.running) { clk.stop(); play.textContent = '▶ Play'; cells.flat().forEach(c => c.classList.remove('now')); return; }
        clk = MU.clock({ bpm, stepsPerBeat: 2, steps: N, onStep: (s, when, secs) => {
          ROWS.forEach((r, ri) => { if (grid[ri][s]) MU.drum(r.k, { when: secs, vol: .6 }); });
          setTimeout(() => { cells.flat().forEach(c => c.classList.remove('now')); ROWS.forEach((r, ri) => cells[ri][s].classList.add('now')); }, secs * 1000);
        } });
        clk.start(); play.textContent = '■ Stop';
      };
      const setPreset = name => { const p = PRESETS[name]; grid.forEach((r, ri) => r.fill(false)); Object.keys(p).forEach(k => { const ri = ROWS.findIndex(r => r.k === k); if (ri >= 0) p[k].forEach(ci => { grid[ri][ci] = true; }); }); cells.forEach((r, ri) => r.forEach((c, ci) => c.classList.toggle('on', grid[ri][ci]))); };
      const pre = h('div', { class: 'wrapx mt12' }, Object.keys(PRESETS).filter(k => k !== 'Jig-ish' || ctx.lvl >= 2).map(k => h('button', { class: 'chip btnlike', onclick: () => setPreset(k) }, k)),
        h('button', { class: 'chip btnlike', onclick: () => { grid.forEach(r => r.fill(false)); cells.flat().forEach(c => c.classList.remove('on')); } }, 'Clear'));
      box.append(h('div', { class: 'row mt12', style: { justifyContent: 'center' } }, play), h('p', { class: 'small muted center mt8' }, 'Try a preset, then change it to make it yours.'), pre);
      box.append(h('button', { class: 'btn navy wide mt16', onclick: () => {
        const hits = grid.flat().filter(Boolean).length, used = grid.filter(r => r.some(Boolean)).length;
        if (hits < 4) return MU.toast('Add at least 4 sounds first');
        clk && clk.stop();
        ctx.finish(used >= 3 && hits >= 10 ? 3 : used >= 2 ? 2 : 1, 3, 'Your groove has ' + hits + ' sounds on ' + used + ' instruments.');
      } }, "I'm happy with my groove ✔"));
      MU.onLeave(() => clk && clk.stop());
    }
  });

  /* ---------- 1. Count the Beats (meter by ear) ---------- */
  L('meter-feel', {
    unit: 1, emoji: '🔢', title: 'Count the Beats', blurb: 'Feel the strong beat: 2, 3, 4 or a jig?',
    run(ctx) {
      const kinds = [{ id: 2, label: '2 beats (a march)' }, { id: 3, label: '3 beats (a waltz)' }, { id: 4, label: '4 beats' }];
      if (ctx.lvl >= 3) kinds.push({ id: 6, label: 'Jig: two groups of three' });
      function bars(k, n) {
        const seq = [];
        for (let b = 0; b < n; b++) {
          if (k === 6) { for (let i = 0; i < 6; i++) seq.push([i === 0 ? '!tom' : i === 3 ? '!kick' : '!wood', .5]); }
          else for (let i = 0; i < k; i++) seq.push([i === 0 ? '!tom' : '!wood', 1]);
        }
        return seq;
      }
      MU.runRounds(ctx, {
        n: 6,
        make() {
          const k = MU.pick(kinds);
          return { prompt: 'Listen: where does the strong beat come back?', opts: kinds.map(x => x.label), a: kinds.indexOf(k),
            why: 'The big drum plays on beat 1 and comes back every ' + (k.id === 6 ? 'three eighth notes (6/8)' : k.id + ' beats') + '.',
            play: () => MU.play(bars(k.id, 4), { tempo: k.id === 6 ? 180 : 104, noteVol: .3 }) };
        }
      });
    }
  });

  /* ---------- 2. Play the Piano ---------- */
  L('keyboard', {
    unit: 2, emoji: '🎹', title: 'Play the Piano', blurb: 'Learn the keys and play a tune by following the lights',
    run(ctx) {
      const songs = [['hotcross', 'Hot Cross Buns'], ['mary', 'Mary Had a Little Lamb'], ['twinkle', 'Twinkle, Twinkle']];
      if (ctx.lvl >= 2) songs.push(['ode', 'Ode to Joy'], ['joy', 'Joy to the World']);
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Tap the keys! Then pick a song and follow the green lights.'));
      let labelMode = ctx.lvl === 1 ? 'names' : 'names';
      const kb = MU.keyboard({ from: 'C4', to: 'C5', labels: labelMode, height: 190, onPlay: nm => onKey(nm) });
      box.append(kb.el);
      const modes = h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
        [['names', 'ABC names'], ['solfege', 'Do Re Mi'], ['none', 'No labels']].map(([m, t]) => h('button', { class: 'chip btnlike' + (m === labelMode ? ' on' : ''), onclick: e => { labelMode = m; kb.setLabels(m); modes.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, t)));
      box.append(modes);
      const pick = h('select', { class: 'inp mt12' }, [h('option', { value: '' }, 'Free play (no song)')].concat(songs.map(([id, t]) => h('option', { value: id }, t))));
      const hearBtn = h('button', { class: 'hear' }, '🔈 Hear the song');
      const goBtn = h('button', { class: 'btn mint' }, 'Start the song');
      const status = h('div', { class: 'feedback' }, '');
      box.append(h('label', { class: 'lbl' }, 'Song'), pick, h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, hearBtn, goBtn), status);
      let targets = [], pos = 0, mistakes = 0, active = false;
      const songNotes = id => MU.MEL[id].seq.filter(e => e[0]).map(e => e[0]);
      function showNext() { kb.clear(); if (pos < targets.length) kb.mark(targets[pos], 'next'); }
      function onKey(nm) {
        if (!active) return;
        if (nm === targets[pos]) { pos++; status.textContent = pos + ' / ' + targets.length; status.className = 'feedback good'; if (pos >= targets.length) { active = false; kb.clear(); const tot = targets.length; ctx.finish(Math.max(0, tot - mistakes), tot, 'You played the whole song with ' + mistakes + ' wrong note' + (mistakes === 1 ? '' : 's') + '.'); } else showNext(); }
        else { mistakes++; kb.flash(nm, 'bad', 300); status.textContent = 'Try the green key'; status.className = 'feedback bad'; }
      }
      hearBtn.onclick = () => { if (pick.value) MU.playMel(pick.value); else MU.toast('Pick a song first'); };
      goBtn.onclick = () => { if (!pick.value) return MU.toast('Pick a song first'); targets = songNotes(pick.value); pos = 0; mistakes = 0; active = true; status.textContent = '0 / ' + targets.length; status.className = 'feedback'; showNext(); };
      pick.onchange = () => { active = false; kb.clear(); status.textContent = ''; };
    }
  });

  /* ---------- 2. Steps, Skips and Leaps ---------- */
  L('steps-leaps', {
    unit: 2, emoji: '🪜', title: 'Steps, Skips & Leaps', blurb: 'How far did the melody jump?',
    run(ctx) {
      const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const L1 = ['Step', 'Leap'], L2 = ['Step', 'Skip', 'Leap'], L3 = ['2nd', '3rd', '4th', '5th'];
      MU.runRounds(ctx, {
        n: 8,
        make() {
          let d;
          if (ctx.lvl === 1) d = MU.pick([1, 1, 4, 5]); else if (ctx.lvl === 2) d = MU.pick([1, 2, 3, 4, 5]); else d = MU.pick([1, 2, 3, 4]);
          const lo = MU.rand(8 - d); const up = Math.random() < .5;
          const a = up ? lo : lo + d, b = up ? lo + d : lo;
          const st = MU.staff({ clef: 'treble', w: 280, notes: [scale[a], scale[b]] });
          let opts, ans;
          if (ctx.lvl === 1) { opts = L1; ans = d === 1 ? 0 : 1; }
          else if (ctx.lvl === 2) { opts = L2; ans = d === 1 ? 0 : d === 2 ? 1 : 2; }
          else { opts = L3; ans = d - 1; }
          const why = ctx.lvl === 3 ? 'The notes are ' + d + ' letters apart counting the first, so it is a ' + L3[d - 1] + '.' : (d === 1 ? 'Neighbouring notes: a step.' : d === 2 ? 'One note skipped between: a skip.' : 'Several notes skipped: a leap.');
          return { prompt: 'Listen to the two notes. Step, skip or leap?', visual: MU.staffWrap(st), opts, a: ans, why,
            play: () => MU.play([[scale[a], 1.2], [scale[b], 1.6]], { tempo: 90, inst: 'piano' }) };
        }
      });
    }
  });

  /* ---------- 2. Scale Ladder ---------- */
  L('scale-ladder', {
    unit: 2, emoji: '🪄', title: 'Scale Ladder', blurb: 'Climb Do-Re-Mi and name the mystery note',
    run(ctx) {
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], syl = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
      const cols = ['#F2645A', '#F5A33D', '#F5D63D', '#8BCB4B', '#12B58C', '#3A9BDC', '#6B4FD8', '#F2645A'];
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Tap the ladder from bottom to top. Each rung is one step of the scale.'));
      const lad = h('div', { style: { display: 'flex', flexDirection: 'column-reverse', gap: '6px', maxWidth: '320px', margin: '0 auto' } });
      notes.forEach((n, i) => {
        const b = h('button', { class: 'pad', style: { background: cols[i], minHeight: '46px', width: (60 + i * 5) + '%', alignSelf: 'center', fontSize: '1.15rem' } }, syl[i] + (i === 0 ? ' (home)' : ''));
        b.addEventListener('pointerdown', e => { e.preventDefault(); MU.note(n, .8, { inst: 'piano', vol: .3 }); MU.pulse(b); MU.say(syl[i]); }); lad.append(b);
      });
      box.append(lad, h('div', { class: 'center mt12' }, h('button', { class: 'hear', onclick: () => { MU.stopAll(); MU.play(notes.map(n => [n, 1]), { tempo: 130, inst: 'piano', onNote: i => { const el = lad.children[i]; MU.pulse(el); } }); } }, '🔈 Hear the whole scale')));
      box.append(h('p', { class: 'muted small center mt12' }, 'Now a challenge: you will hear "Do" first, then a mystery note. Which one is it?'));
      const pool = ctx.lvl === 1 ? [0, 2, 4] : ctx.lvl === 2 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
      const holder = h('div', null); ctx.root.append(holder);
      const sub = { root: holder, finish: ctx.finish };
      MU.runRounds(sub, {
        n: 6, make() {
          const i = MU.pick(pool.slice(ctx.lvl === 1 ? 0 : 1)); const optIdx = MU.shuffle(pool).slice(0, Math.min(4, pool.length)); if (!optIdx.includes(i)) optIdx[0] = i;
          const opts = MU.shuffle(optIdx).map(x => syl[x]);
          return { prompt: 'Do is the home note. Which note comes next?', opts, a: opts.indexOf(syl[i]), why: 'That was ' + syl[i] + ', step ' + (i + 1) + ' of the scale.',
            play: () => MU.play([['C4', 1.2], [notes[i], 1.6]], { tempo: 90, inst: 'piano' }), hearLabel: 'Hear Do, then the mystery note' };
        }
      });
    }
  });

  /* ---------- 2. Magic Black Keys (pentatonic) ---------- */
  L('pentatonic', {
    unit: 2, emoji: '✨', title: 'Magic Black Keys', blurb: 'Five notes that always sound good',
    run(ctx) {
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('The black keys make a pentatonic scale. Play any of them in any order: it always sounds nice!'));
      let count = 0, rec = [], drone = null;
      const counter = h('div', { class: 'feedback' }, 'Black notes played: 0');
      const kb = MU.keyboard({ from: 'C4', to: 'C5', labels: 'none', height: 190, inst: ctx.lvl >= 2 ? 'harp' : 'piano', onPlay: nm => {
        if (/#/.test(nm)) { count++; rec.push(nm); if (rec.length > 24) rec.shift(); counter.textContent = 'Black notes played: ' + count; counter.className = 'feedback good'; }
        else { counter.textContent = 'That is a white key. Try the black ones!'; counter.className = 'feedback'; }
      } });
      Object.values(kb.keys).forEach(k => { if (k.classList.contains('blk')) k.style.boxShadow = '0 0 0 3px #F5B83D inset'; });
      box.append(kb.el, counter);
      const dr = h('button', { class: 'chip btnlike mt8' }, '🎶 Add a soft drone');
      dr.onclick = () => {
        if (drone) { drone.stop(); drone = null; dr.textContent = '🎶 Add a soft drone'; return; }
        drone = MU.clock({ bpm: 60, steps: 2, onStep: (i, w, secs) => { MU.note('F#2', 2.2, { when: secs, inst: 'cello', vol: .14 }); MU.note('C#3', 2.2, { when: secs, inst: 'cello', vol: .1 }); } });
        drone.start(); dr.textContent = '■ Stop the drone';
      };
      const pb = h('button', { class: 'hear mt8' }, '🔈 Play back what I played');
      pb.onclick = () => { if (!rec.length) return MU.toast('Play some black keys first'); MU.stopAll(); MU.play(rec.map(n => [n, .5]), { tempo: 110, inst: ctx.lvl >= 2 ? 'harp' : 'piano' }); };
      box.append(h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, dr, pb));
      box.append(h('button', { class: 'btn navy wide mt16', onclick: () => { if (count < 6) return MU.toast('Play at least 6 black keys first'); drone && drone.stop(); ctx.finish(Math.min(count, 16), 16, 'You played ' + count + ' notes of the pentatonic scale.'); } }, "I'm done ✔"));
      MU.onLeave(() => drone && drone.stop());
    }
  });

  /* ---------- 3. Name That Note ---------- */
  const lineSpace = (clef, st) => {
    const bottom = clef === 'treble' ? 30 : 18, off = st - bottom;
    if (off < 0) return off % 2 === 0 ? 'a ledger line below the staff' : 'just below the staff';
    if (off > 8) return off % 2 === 0 ? 'a ledger line above the staff' : 'just above the staff';
    return off % 2 === 0 ? 'line ' + (off / 2 + 1) : 'space ' + ((off + 1) / 2);
  };
  const stepsRange = (a, b) => { const out = []; for (let s = MU.stepOf(a); s <= MU.stepOf(b); s++) out.push(MU.nameOfStep(s)); return out; };
  function notePool(lvl) {
    if (lvl === 1) return [{ clef: 'treble', notes: stepsRange('E4', 'C5') }];
    if (lvl === 2) return [{ clef: 'treble', notes: stepsRange('C4', 'A5') }];
    return [{ clef: 'treble', notes: stepsRange('C4', 'A5') }, { clef: 'bass', notes: stepsRange('E2', 'C4') }];
  }
  L('staff-reader', {
    unit: 3, emoji: '👀', title: 'Name That Note', blurb: 'Read the note on the staff',
    run(ctx) {
      const pools = notePool(ctx.lvl);
      MU.runRounds(ctx, {
        n: 8,
        make() {
          const p = MU.pick(pools), nm = MU.pick(p.notes), letter = nm[0];
          const st = MU.staff({ clef: p.clef, w: 280, notes: [nm] });
          const letters = MU.shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'G'].filter(x => x !== letter)).slice(0, ctx.lvl === 1 ? 2 : 3); letters.push(letter);
          const opts = MU.shuffle(letters);
          return { prompt: 'Which note is this?', visual: MU.staffWrap(st), opts, a: opts.indexOf(letter), why: letter + ' is on ' + lineSpace(p.clef, MU.stepOf(nm)) + ' of the ' + p.clef + ' staff.', play: () => MU.note(nm, 1.2, { inst: 'piano' }), hearLabel: 'Hear the note', autoplay: false };
        }
      });
    }
  });

  /* ---------- 3. Place the Note ---------- */
  L('staff-builder', {
    unit: 3, emoji: '✍️', title: 'Place the Note', blurb: 'Tap the staff where the note belongs',
    run(ctx) {
      const pools = notePool(ctx.lvl), N = 8; let i = 0, right = 0;
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      function show() {
        MU.stopAll(); box.innerHTML = '';
        const p = MU.pick(pools), want = MU.pick(p.notes); let answered = false;
        const fbk = h('div', { class: 'feedback' });
        const next = h('button', { class: 'btn mint wide mt12 hide' }, i === N - 1 ? 'See my score' : 'Next →');
        const lo = MU.stepOf(p.notes[0]) - 1, hi = MU.stepOf(p.notes[p.notes.length - 1]) + 1;
        const staff = MU.staff({ clef: p.clef, w: 320, lo, hi, onPick: (nm, st) => {
          if (answered) { MU.note(nm, .8); return; }
          answered = true; MU.note(nm, 1, { inst: 'piano' });
          if (nm === want) { right++; staff.set([{ name: nm, color: '#058a68' }]); fbk.textContent = '✅ Yes! That is ' + want[0] + '.'; fbk.className = 'feedback good'; MU.sfx.ok(); }
          else { staff.set([{ name: nm, color: '#d44', label: 'you' }, { name: want, color: '#058a68', label: 'here' }]); fbk.textContent = '💡 ' + want[0] + ' goes on ' + lineSpace(p.clef, MU.stepOf(want)) + '.'; fbk.className = 'feedback bad'; MU.sfx.bad(); }
          next.classList.remove('hide');
        } });
        next.onclick = () => { if (++i < N) show(); else ctx.finish(right, N); };
        box.append(h('div', { class: 'progress' }, h('i', { style: { width: (i / N * 100) + '%' } })),
          h('div', { class: 'prompt' }, 'Tap where ', h('span', { style: { color: '#6B4FD8', fontSize: '1.6rem' } }, want[0]), ' goes on the ' + p.clef + ' staff'),
          MU.staffWrap(staff), fbk, next);
      }
      show();
    }
  });

  /* ---------- 3. Fill the Bar (note values) ---------- */
  const VALS = { whole: 4, half: 2, quarter: 1, eighth: .5 };
  function randomBar(cap, kinds) {
    const bar = []; let left = cap;
    while (left > 0) { const ok = kinds.filter(k => VALS[k] <= left); const k = MU.pick(ok); bar.push(k); left -= VALS[k]; }
    return bar;
  }
  const sumBar = bar => bar.reduce((a, k) => a + VALS[k], 0);
  const barNode = bar => h('div', { class: 'row', style: { gap: '4px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' } }, bar.map(k => MU.noteShape(k, 42)));
  L('note-values', {
    unit: 3, emoji: '🍕', title: 'Fill the Bar', blurb: 'Whole, half, quarter, eighth: which bar adds up?',
    run(ctx) {
      const info = h('div', { class: 'stage' }); ctx.root.append(info);
      info.append(ctx.sayPrompt('Meet the notes. Tap each one to hear how long it lasts.'));
      const rows = [['whole', 'Whole note', '4 beats'], ['half', 'Half note', '2 beats'], ['quarter', 'Quarter note', '1 beat'], ['eighth', 'Eighth note', '½ beat']];
      const grid = h('div', { class: 'choices cols2' });
      rows.forEach(([k, n, b]) => {
        const c = h('button', { class: 'choice' }, MU.noteShape(k, 50), h('span', null, n), h('small', { class: 'muted' }, b));
        c.onclick = () => { MU.stopAll(); const beats = VALS[k]; const seq = []; seq.push(['!tom', 0.0001]); seq.push([['C5'], beats]); MU.play([['C5', beats]], { tempo: 90, inst: 'glock' }); MU.say(n + ': ' + b); };
        grid.append(c);
      });
      info.append(grid);
      const holder = h('div', null); ctx.root.append(holder);
      const kinds = ctx.lvl === 1 ? ['half', 'quarter'] : ['half', 'quarter', 'eighth'];
      const kindsHard = ['whole', 'half', 'quarter', 'eighth'];
      MU.runRounds({ root: holder, finish: ctx.finish }, {
        n: 6, cls: 'wide',
        make() {
          const cap = ctx.lvl === 3 ? MU.pick([3, 4]) : 4;
          const pool = ctx.lvl === 3 ? kindsHard : kinds;
          const good = randomBar(cap, pool);
          const wrong = [];
          while (wrong.length < 2) {
            let b = randomBar(cap + MU.pick([-1, 1, -.5, .5, 1]), pool);
            if (sumBar(b) !== cap && b.length) wrong.push(b);
          }
          const all = [good, ...wrong];
          return { prompt: 'Which bar has exactly ' + cap + ' beats?', opts: all.map(barNode), a: 0, why: 'Add them up: ' + good.map(k => VALS[k]).join(' + ') + ' = ' + cap + ' beats.' };
        }
      });
    }
  });
})();
