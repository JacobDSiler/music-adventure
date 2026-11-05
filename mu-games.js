/* Music Adventure - games hub and ten quick games. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const G = {};
  const def = (id, o) => { G[id] = Object.assign({ id }, o); MU.games.push(G[id]); };

  /* 1 Echo Beat */
  def('echo-beat', {
    emoji: '👏', title: 'Echo Beat', blurb: 'Listen to a rhythm, then copy it on the pads', color: '#F2645A',
    run(ctx) {
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      const LEN = ctx.lvl === 1 ? 4 : 6, ROUNDS = 5;
      let r = 0, score = 0, pat = [], taps = [], t0 = 0, listening = true;
      const title = h('div', { class: 'prompt' }, ''), fb = h('div', { class: 'feedback' });
      const dots = h('div', { class: 'beatdots' }, Array.from({ length: LEN }, () => h('i')));
      const pad = h('button', { class: 'pad big', style: { width: '100%', height: '120px' } }, '🥁 TAP');
      const hear = MU.hearBtn('Hear it again', () => playPat());
      const go = h('button', { class: 'btn mint wide mt12' }, 'My turn →');
      function playPat() { MU.stopAll(); const s = pat.map((d, i) => ['!wood', d]); MU.play(s, { tempo: 100 }); }
      function newRound() {
        taps = []; fb.textContent = ''; title.textContent = 'Round ' + (r + 1) + ' of ' + ROUNDS + ': listen…';
        pat = Array.from({ length: LEN }, () => MU.pick(ctx.lvl === 1 ? [1, 1, 2] : [.5, 1, 1, 2]));
        listening = true; go.classList.remove('hide'); pad.disabled = true; MU.after(playPat, 300);
      }
      go.onclick = () => { listening = false; taps = []; t0 = 0; pad.disabled = false; go.classList.add('hide'); title.textContent = 'Now tap it back! (' + LEN + ' taps)'; };
      pad.addEventListener('pointerdown', e => {
        e.preventDefault(); if (listening) return; MU.drum('wood', {}); MU.pulse(pad); taps.push(performance.now());
        if (taps.length === LEN) {
          const gaps = taps.slice(1).map((t, i) => t - taps[i]), want = pat.slice(0, -1).map(d => d * 600);
          // normalise tempo: scale gaps by median ratio
          const ratios = gaps.map((g, i) => g / want[i]).sort((a, b) => a - b), med = ratios[Math.floor(ratios.length / 2)] || 1;
          const ok = gaps.every((g, i) => Math.abs(g / med - want[i]) < Math.max(160, want[i] * .45));
          if (ok) { score++; fb.textContent = '✅ In time!'; fb.className = 'feedback good'; MU.sfx.ok(); } else { fb.textContent = '💡 Close! Listen for long and short gaps.'; fb.className = 'feedback bad'; MU.sfx.bad(); }
          pad.disabled = true; MU.after(() => { if (++r < ROUNDS) newRound(); else ctx.finish(score, ROUNDS); }, 1400);
        }
      });
      box.append(title, h('div', { class: 'center' }, hear), pad, fb, go); newRound();
    }
  });

  /* 2 Higher or Lower */
  def('hi-lo', {
    emoji: '↕️', title: 'Higher or Lower?', blurb: 'Is the second note higher or lower than the first?', color: '#12B58C',
    run(ctx) {
      const gap = ctx.lvl === 1 ? [5, 12] : ctx.lvl === 2 ? [2, 5] : [1, 2];
      MU.runRounds(ctx, {
        n: 10, cols: 2, make() {
          const a = MU.pick(MU.noteRange('C4', 'C5').filter(x => !/#/.test(x))), d = MU.pick(Array.from({ length: gap[1] - gap[0] + 1 }, (_, i) => gap[0] + i)) * MU.pick([1, -1]);
          const m2 = MU.clamp(MU.midi(a) + d, 48, 84), b = MU.nameOf(m2), up = m2 > MU.midi(a);
          return { prompt: 'Is the SECOND note higher or lower?', opts: ['⬆️ Higher', '⬇️ Lower'], a: up ? 0 : 1, why: up ? 'It climbed up.' : 'It stepped down.', play: () => MU.play([[a, 1], [b, 1.5]], { tempo: 90, inst: 'piano' }) };
        }
      });
    }
  });

  /* 3 Melody Memory (Simon) */
  def('memory', {
    emoji: '🧠', title: 'Melody Memory', blurb: 'Copy the tune that keeps getting longer', color: '#6B4FD8',
    run(ctx) {
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      const keys = ctx.lvl === 1 ? ['C4', 'E4', 'G4', 'C5'] : ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
      const COL = ['#E0529C', '#12B58C', '#E08A00', '#6B4FD8', '#2F8F7A', '#C13C6B'];
      const seq = []; let pos = 0, busy = true, best = 0;
      const status = h('div', { class: 'prompt' }, 'Watch and listen…'), fb = h('div', { class: 'feedback' });
      const pads = keys.map((k, i) => { const b = h('button', { class: 'pad big', style: { background: COL[i], height: '90px', color: '#fff', fontWeight: 800 } }, MU.stepOf ? k.replace(/\d/, '') : k); b.onclick = () => press(i); return b; });
      const grid = h('div', { class: 'choices cols' + (keys.length === 4 ? 2 : 3) }, pads);
      function flash(i) { MU.note(keys[i], .5, { inst: 'xylophone', vol: .4 }); MU.pulse(pads[i]); pads[i].style.filter = 'brightness(1.5)'; setTimeout(() => pads[i].style.filter = '', 280); }
      async function show() { busy = true; status.textContent = 'Watch and listen…'; await MU.sleep(500); for (const i of seq) { flash(i); await MU.sleep(480); } busy = false; pos = 0; status.textContent = 'Your turn! Repeat ' + seq.length + (seq.length === 1 ? ' note' : ' notes'); }
      function add() { seq.push(Math.floor(Math.random() * keys.length)); show(); }
      function press(i) {
        if (busy) return; flash(i);
        if (i !== seq[pos]) { MU.sfx.bad(); busy = true; fb.textContent = 'Oops! You remembered ' + best + ' notes.'; fb.className = 'feedback bad'; MU.after(() => ctx.finish(Math.min(best, 8), 8, 'You remembered a tune ' + best + ' notes long.'), 1200); return; }
        if (++pos === seq.length) { best = seq.length; busy = true; fb.textContent = '✅ ' + best + ' in a row!'; fb.className = 'feedback good'; if (best >= 8) return MU.after(() => ctx.finish(8, 8), 800); MU.after(add, 900); }
      }
      box.append(status, grid, fb); add();
    }
  });

  /* 4 Name That Note */
  def('name-note', {
    emoji: '🎼', title: 'Name That Note', blurb: 'Read the note on the staff and pick its letter name', color: '#F5B83D',
    run(ctx) {
      const lo = ctx.lvl === 1 ? 'C4' : 'A3', hi = ctx.lvl === 1 ? 'G4' : ctx.lvl === 2 ? 'E5' : 'A5';
      const names = MU.whiteRange(lo, hi);
      MU.runRounds(ctx, {
        n: 10, cols: 4, make() {
          const n = MU.pick(names), st = MU.staff({ clef: 'treble', notes: [n], w: 260 });
          const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'], L = n[0];
          return { prompt: 'Which letter name is this note?', visual: h('div', { class: 'center' }, st.el), opts: letters, a: letters.indexOf(L), why: 'That note is ' + L + '. Hear it:', play: () => MU.note(n, 1, { inst: 'piano' }), autoplay: false, hearLabel: 'Hear it' };
        }
      });
    }
  });

  /* 5 Instrument Match */
  def('instrument-match', {
    emoji: '🎷', title: 'Instrument Ear', blurb: 'Hear a sound and pick the instrument', color: '#E0529C',
    run(ctx) {
      const S = [['piano', 'Piano', 'C4'], ['flute', 'Flute', 'G5'], ['violin', 'Violin', 'E5'], ['trumpet', 'Trumpet', 'C5'], ['xylophone', 'Xylophone', 'E5'], ['harp', 'Harp', 'G4'], ['organ', 'Organ', 'C4'], ['cello', 'Cello', 'C3'], ['clarinet', 'Clarinet', 'E4']];
      const pool = ctx.lvl === 1 ? S.slice(0, 5) : S;
      MU.runRounds(ctx, {
        n: 10, cols: 2, make() {
          const k = MU.pick(pool); const opts = MU.shuffle(pool.filter(x => x !== k)).slice(0, ctx.lvl === 1 ? 2 : 3).concat(k);
          return { prompt: 'Which instrument?', opts: opts.map(o => o[1]), a: opts.length - 1, why: k[1] + ' (synth imitation).', play: () => MU.play([[k[2], 1], [MU.nameOf(MU.midi(k[2]) + 4), 1], [MU.nameOf(MU.midi(k[2]) + 7), 2]], { tempo: 100, inst: k[0], noteVol: .3 }) };
        }
      });
    }
  });

  /* 6 Tempo Terms */
  def('tempo-terms', {
    emoji: '🐢', title: 'Slow or Fast?', blurb: 'Which of two tunes is faster?', color: '#2F8F7A',
    run(ctx) {
      const ph = MU.MEL.mary.seq.slice(0, 8);
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const base = MU.pick([60, 80, 100, 130, 160]), mult = ctx.lvl === 1 ? 1.8 : ctx.lvl === 2 ? 1.4 : 1.2, fast1 = Math.random() < .5;
          const t1 = fast1 ? base * mult : base, t2 = fast1 ? base : base * mult;
          return { prompt: 'Two versions play. Which was FASTER?', opts: ['First one', 'Second one'], a: fast1 ? 0 : 1, why: 'The faster one was ' + Math.round(Math.max(t1, t2)) + ' beats per minute against ' + Math.round(Math.min(t1, t2)) + '.', play: () => { const c1 = MU.play(ph, { tempo: t1, inst: 'piano' }); MU.after(() => MU.play(ph, { tempo: t2, inst: 'piano' }), c1.seconds * 1000 + 700); } };
        }
      });
    }
  });

  /* 7 Composer Timeline */
  def('composer-who', {
    emoji: '🎩', title: 'Composer Quick Quiz', blurb: 'Match composers to where and when they lived', color: '#B5651D',
    run(ctx) {
      const pool = MU.COMPOSERS.filter(c => c.from);
      MU.runRounds(ctx, {
        n: 8, cols: 2, make(i) {
          const c = MU.pick(pool);
          if (i % 2) { const opts = MU.shuffle(MU.ERAS).slice(0, 4); if (!opts.some(e => e.id === c.era)) opts[0] = MU.era(c.era); return { prompt: c.n + ' lived in which era?', opts: opts.map(e => e.e + ' ' + e.name), a: opts.findIndex(e => e.id === c.era), why: c.n + ' (' + yrs(c) + ') belongs to the ' + MU.era(c.era).name + ' era.' }; }
          const countries = Array.from(new Set(pool.map(x => x.from))); const opts = MU.shuffle(countries.filter(x => x !== c.from)).slice(0, 3).concat(c.from);
          return { prompt: 'Which country was ' + c.n + ' from?', opts, a: 3, why: c.n + ' was from ' + c.from + '.' };
        }
      });
      function yrs(c) { return c.b + '–' + c.d; }
    }
  });

  /* 8 Jig, Reel or Waltz */
  def('dance-ear', {
    emoji: '💃', title: 'Waltz or March?', blurb: 'Count the beats: 2, 3 or 4 in a bar?', color: '#C13C6B',
    run(ctx) {
      const M = { 2: ['March ✌️', 'ONE-two ONE-two'], 3: ['Waltz 💃', 'ONE-two-three'], 4: ['Common time 🚶', 'ONE-two-three-four'] };
      const keys = ctx.lvl === 1 ? [2, 3] : [2, 3, 4];
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const k = MU.pick(keys), s = [];
          for (let b = 0; b < 4; b++) for (let i = 0; i < k; i++) s.push([i === 0 ? '!kick' : '!hat', 1]);
          const mel = []; for (let b = 0; b < 4; b++) for (let i = 0; i < k; i++) mel.push([MU.pick(['C5', 'E5', 'G5']), 1, { vol: i === 0 ? .4 : .2 }]);
          return { prompt: 'How many beats in each bar? Feel the strong beat.', opts: keys.map(x => x + ' beats: ' + M[x][0]), a: keys.indexOf(k), why: k + ' beats: ' + M[k][1] + '.', play: () => { MU.play(s, { tempo: 110 }); MU.play(mel, { tempo: 110, inst: 'flute', noteVol: .22 }); } };
        }
      });
    }
  });

  /* 9 Major or Minor */
  def('mood-ear', {
    emoji: '🌗', title: 'Sunny or Shadowy?', blurb: 'Major or minor chords: can you hear it?', color: '#6B4FD8',
    run(ctx) {
      MU.runRounds(ctx, {
        n: 10, cols: 2, make() {
          const maj = Math.random() < .5, root = MU.midi(MU.pick(['C3', 'D3', 'E3', 'F3', 'G3', 'A3'])), ch = [root, root + (maj ? 4 : 3), root + 7, root + 12].map(MU.nameOf);
          return { prompt: 'Is this chord major (bright) or minor (shadowy)?', opts: ['☀️ Major', '🌑 Minor'], a: maj ? 0 : 1, why: maj ? 'Major chords have a raised third: bright.' : 'Minor chords have a lowered third: darker.', play: () => { MU.chord(ch, 2, { inst: 'piano', vol: .22 }); MU.after(() => MU.play(ch.map(n => [n, .5]), { tempo: 120, inst: 'piano' }), 1900); } };
        }
      });
    }
  });

  /* 10 Beat Counter */
  def('beat-count', {
    emoji: '🔢', title: 'Count the Beats', blurb: 'Add up note lengths to fill the bar', color: '#E08A00',
    run(ctx) {
      const V = ctx.lvl === 1 ? [['Quarter', 1], ['Half', 2]] : [['Quarter', 1], ['Half', 2], ['Whole', 4], ['Eighth', .5]];
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const bars = [], total = 4; let sum = 0, parts = [];
          while (sum < total) { const opt = V.filter(v => sum + v[1] <= total); const v = MU.pick(opt); parts.push(v); sum += v[1]; }
          const target = parts.reduce((a, v) => a + v[1], 0);
          const ans = String(target), wrong = MU.shuffle([target - 1, target + 1, target + 2, target - 2].filter(x => x > 0)).slice(0, 3).map(String);
          const opts = MU.shuffle([ans].concat(wrong));
          const label = parts.map(p => p[0]).join(' + ');
          return { prompt: 'In 4/4 time, how many beats do these notes make?  ' + label, opts, a: opts.indexOf(ans), why: parts.map(p => p[1]).join(' + ') + ' = ' + target + ' beats.' };
        }
      });
    }
  });

  /* ---------- screens ---------- */
  MU.screens.games = function () {
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎮 Music Games', '/', MU.starPill()));
    wrap.append(h('p', { class: 'muted' }, 'Quick games to train your ears. Every game helps you earn stars.'));
    wrap.append(h('button', { class: 'labcard', style: { marginBottom: '12px' }, onclick: () => MU.go('/studio') }, h('span', { class: 'em' }, '🎛️'), h('span', { style: { flex: 1 } }, h('b', null, 'Music Studio'), h('span', { class: 'd' }, 'Make your own beats, tunes and songs'))));
    const grid = h('div', { class: 'grid2' });
    MU.games.forEach(g => {
      const rec = (MU.PR().games || {})[g.id];
      grid.append(h('button', { class: 'gamecard', style: { '--c': g.color }, onclick: () => MU.go('/game/' + g.id) },
        h('div', { class: 'em' }, g.emoji), h('b', null, g.title), h('span', { class: 'small' }, g.blurb), rec ? MU.starsEl(rec.stars) : h('span', { class: 'small muted' }, 'New!')));
    });
    wrap.append(grid);
    return wrap;
  };
  MU.screens.game = function (parts) {
    const g = G[parts[1]]; if (!g) return h('p', null, 'Game not found');
    const wrap = h('div', { style: { '--c': g.color } });
    const prev = ((MU.PR().games || {})[g.id] || {}).stars || 0;
    wrap.append(MU.topbar(g.emoji + ' ' + g.title, '/games', MU.starsEl(prev)));
    const root = h('div', null); wrap.append(root);
    const ctx = {
      root, band: MU.band(), lvl: MU.lvl(),
      sayPrompt: t => h('div', { class: 'prompt' }, t, ' ', MU.sayBtn(t)),
      finish(score, max, msg) {
        const ratio = max ? score / max : 1, stars = ratio >= .9 ? 3 : ratio >= .6 ? 2 : 1;
        MU.recordGame(g.id, stars, score); MU.sfx.win(); if (stars === 3) MU.confetti();
        MU.modal(h('div', null, h('div', { class: 'bigem' }, ['🙂', '😀', '🤩', '🏆'][stars]), h('h2', null, ['', 'Nice try!', 'Great!', 'Fantastic!'][stars]),
          h('div', { class: 'mt8', style: { fontSize: '2rem' } }, MU.starsEl(stars)),
          h('p', { class: 'muted mt8' }, msg || (score + ' out of ' + max)),
          h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } },
            h('button', { class: 'btn ghost', onclick: () => { MU.closeModal(); MU.render(); } }, '🔁 Again'),
            h('button', { class: 'btn mint', onclick: () => { MU.closeModal(); MU.go('/games'); } }, 'More games'))));
      }
    };
    try { g.run(ctx); } catch (e) { console.error(e); root.append(h('p', null, 'This game hit a snag: ' + e.message)); }
    return wrap;
  };
})();
