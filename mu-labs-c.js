/* Music Adventure - labs for movements 7-9: eras, stories, folk & home. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const L = (id, o) => { MU.labs[id] = o; };
  const yrs = c => c.b + '–' + c.d;

  /* ---------- 7. Time Machine ---------- */
  L('timeline', {
    unit: 7, emoji: '⏳', title: 'Time Machine', blurb: 'Who lived first? Put composers in order',
    run(ctx) {
      const pool = ctx.lvl === 1 ? MU.COMPOSERS.filter(c => ['hildegard', 'bach', 'mozart', 'beethoven', 'debussy'].includes(c.id) || c.era !== 'baroque').slice(0, 14) : MU.COMPOSERS;
      const card = c => h('div', { class: 'card flat center', style: { flex: 1 } }, h('b', null, c.n), h('div', { class: 'small muted' }, c.from + ' · ' + c.did));
      MU.runRounds(ctx, {
        n: 8, cols: 1, make() {
          const k = ctx.lvl === 3 ? 3 : 2; let pick, tries = 0;
          do { pick = MU.shuffle(pool).slice(0, k); tries++; } while (tries < 20 && pick.some((c, i) => pick.some((d, j) => i < j && Math.abs(c.b - d.b) < 25)));
          const first = pick.slice().sort((a, b) => a.b - b.b)[0];
          const opts = pick.map(c => c.n);
          return { prompt: 'Who was born FIRST?', opts, a: pick.indexOf(first), why: first.n + ' was born in ' + first.b + ' (' + MU.era(first.era).name + ' era). ' + pick.filter(c => c !== first).map(c => c.n + ' ' + c.b).join(', ') + '.' };
        }
      });
    }
  });

  /* ---------- 7. Sort the Eras ---------- */
  L('era-sort', {
    unit: 7, emoji: '🏛️', title: 'Sort the Eras', blurb: 'Which era did each composer live in?',
    run(ctx) {
      const eras = ctx.lvl === 1 ? MU.ERAS.filter(e => ['baroque', 'classical', 'romantic'].includes(e.id)) : MU.ERAS;
      const pool = MU.COMPOSERS.filter(c => eras.some(e => e.id === c.era));
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const c = MU.pick(pool);
          const visual = h('div', { class: 'center' }, h('b', { style: { fontSize: '1.4rem', color: '#2B1B4D' } }, c.n), h('div', { class: 'muted' }, yrs(c) + ' · ' + c.from));
          const e = MU.era(c.era);
          const q = { prompt: 'Which era is this composer from?', visual, opts: eras.map(x => x.e + ' ' + x.name), a: eras.indexOf(e), why: c.n + ' belongs to the ' + e.name + ' era (' + e.span + '). ' + c.fact };
          if (c.play && MU.MEL[c.play]) { q.play = () => MU.playMel(c.play, {}); q.hearLabel = 'Hear a tune'; q.autoplay = false; }
          return q;
        }
      });
    }
  });

  /* ---------- 7. Who Am I? ---------- */
  L('who-am-i', {
    unit: 7, emoji: '🕵️', title: 'Who Am I?', blurb: 'Guess the composer from clues',
    run(ctx) {
      const pool = MU.COMPOSERS.filter(c => c.fact);
      MU.runRounds(ctx, {
        n: 8, cols: 1, make() {
          const c = MU.pick(pool); const wrong = MU.shuffle(pool.filter(x => x !== c && (ctx.lvl === 3 ? x.era === c.era : true))).slice(0, 3);
          const opts = MU.shuffle([c].concat(wrong));
          const clues = ['I was a ' + c.did + '.', 'I came from ' + c.from + '.', 'I lived from ' + c.b + ' to ' + c.d + '.'];
          const first = ctx.lvl === 1 ? 'I lived in the ' + MU.era(c.era).name + ' era. ' : '';
          return { prompt: first + clues.join(' ') + ' ' + c.fact.replace(new RegExp(c.n.split(' ').pop(), 'g'), '…'), opts: opts.map(x => x.n), a: opts.indexOf(c), why: 'I am ' + c.n + '.' };
        }
      });
    }
  });

  /* ---------- 8. Peter and the Wolf ---------- */
  L('peter-wolf', {
    unit: 8, emoji: '🐺', title: 'Peter and the Wolf', blurb: 'Prokofiev gave every character its own instrument',
    run(ctx) {
      const CH = [
        { n: '🐦 Bird', ins: 'Flute', sy: 'flute', note: ['C6', 'E6', 'D6', 'G6'], why: 'The bird is the high, fluttering flute.' },
        { n: '🦆 Duck', ins: 'Oboe', sy: 'oboe', note: ['G4', 'A4', 'G4', 'E4'], why: 'The duck waddles with a reedy oboe.' },
        { n: '🐱 Cat', ins: 'Clarinet', sy: 'clarinet', note: ['C4', 'E4', 'G4', 'E4'], why: 'The cat creeps along on a smooth, low clarinet.' },
        { n: '👴 Grandfather', ins: 'Bassoon', sy: 'cello', note: ['G2', 'D3', 'G2', 'B2'], why: 'Grandfather grumbles on the deep bassoon (shown here by a low cello-like sound).' },
        { n: '🐺 Wolf', ins: 'French horns', sy: 'horn', note: ['C3', 'Eb3', 'G3', 'Eb3'], why: 'Three French horns make the wolf sound big and dangerous.' },
        { n: '🧒 Peter', ins: 'Strings', sy: 'violin', note: ['C5', 'E5', 'G5', 'C6'], why: 'Peter bounces along with the bright string section.' }
      ];
      const pool = ctx.lvl === 1 ? CH.slice(0, 4) : CH;
      MU.runRounds(ctx, {
        n: 8, cols: 2, make(i) {
          const c = MU.pick(pool); const play = () => MU.play(c.note.map(x => [x, 1]), { tempo: 100, inst: c.sy, noteVol: .3 });
          if (ctx.lvl >= 2 && i % 2) { const opts = pool.map(x => x.n); return { prompt: 'This sound is one of the characters. Who?', opts, a: pool.indexOf(c), why: c.why + ' (Our synth is only an imitation.)', play }; }
          const opts = MU.shuffle(CH.filter(x => x !== c)).slice(0, 3).map(x => x.ins).concat(c.ins);
          return { prompt: 'Which instrument plays the ' + c.n + ' in Prokofiev\'s story?', opts, a: opts.length - 1, why: c.why, play, hearLabel: 'Hear a hint', autoplay: false };
        }
      });
    }
  });

  /* ---------- 8. Carnival of the Animals ---------- */
  L('carnival', {
    unit: 8, emoji: '🦁', title: 'Carnival Zoo', blurb: 'Which animal is the music painting?',
    run(ctx) {
      const A = [
        { n: '🦁 Lion', why: 'Low, heavy and proud: a lion\'s roar and stride.', seq: [['C2', 1], [null, .5], ['C2', .5], ['G1', 2]], inst: 'cello' },
        { n: '🐢 Tortoise', why: 'Very, very slow: a tortoise plods.', seq: [['E4', 3], ['D4', 3], ['C4', 3]], inst: 'piano', tempo: 50 },
        { n: '🐘 Elephant', why: 'Low and clumsy with a swaying waltz feel.', seq: [['C2', 1], ['G2', 1], ['G2', 1], ['C2', 1], ['G2', 1], ['G2', 1]], inst: 'bass' },
        { n: '🦘 Kangaroo', why: 'Short, bouncy hops with leaps.', seq: [['C4', .25], ['C5', .25], [null, .5], ['C4', .25], ['C5', .25], [null, .5], ['E5', .25], ['G5', .25]], inst: 'piano', legato: .3 },
        { n: '🐟 Aquarium', why: 'Shimmering, glittering high notes like light on water.', seq: [['C6', .5], ['E6', .5], ['G6', .5], ['B6', .5], ['G6', .5], ['E6', .5]], inst: 'glock' },
        { n: '🐦 Cuckoo', why: 'Two repeating notes: cuckoo, cuckoo!', seq: [['G4', 1], ['E4', 2], [null, 1], ['G4', 1], ['E4', 2]], inst: 'clarinet' },
        { n: '🦢 Swan', why: 'Long smooth notes that glide like a swan on a lake.', seq: [['G3', 3], ['A3', 1], ['B3', 3], ['D4', 1], ['G3', 4]], inst: 'cello', legato: 1 }
      ];
      const pool = ctx.lvl === 1 ? A.slice(0, 5) : A;
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const a = MU.pick(pool); const opts = MU.shuffle(pool.filter(x => x !== a)).slice(0, ctx.lvl === 1 ? 2 : 3).concat(a);
          return { prompt: 'Saint-Saëns painted animals in sound. Which animal might this music be?', opts: opts.map(x => x.n), a: opts.length - 1, why: a.why + ' (This is our own sketch in the same spirit.)', play: () => MU.play(a.seq, { tempo: a.tempo || 100, inst: a.inst, noteVol: .32, legato: a.legato }) };
        }
      });
    }
  });

  /* ---------- 8. Soundscape ---------- */
  L('soundscape', {
    unit: 8, emoji: '⛈️', title: 'Soundscape Studio', blurb: 'Layer rain, wind, waves and birds into a picture in sound',
    run(ctx) {
      const LAYERS = [
        { id: 'rain', e: '🌧️', n: 'Rain', step: (i, t) => { if (i % 1 === 0) MU.drum('hat', { when: t, vol: .04 + Math.random() * .05 }); } },
        { id: 'thunder', e: '⛈️', n: 'Thunder', step: (i, t) => { if (i % 16 === 0) MU.drum('timp', { when: t, vol: .5 }); if (i % 16 === 2) MU.drum('timp', { when: t, vol: .3 }); } },
        { id: 'waves', e: '🌊', n: 'Waves', step: (i, t) => { if (i % 8 === 0) MU.note('C2', 2, { when: t, inst: 'sine', vol: .12 }); if (i % 8 === 4) MU.drum('ohat', { when: t, vol: .05 }); } },
        { id: 'wind', e: '💨', n: 'Wind', step: (i, t) => { if (i % 4 === 0) MU.note(MU.pick(['A3', 'B3', 'C4', 'G3']), 1, { when: t, inst: 'flute', vol: .06 }); } },
        { id: 'birds', e: '🐦', n: 'Birds', step: (i, t) => { if (Math.random() < .2) MU.note(MU.pick(['C6', 'E6', 'G6', 'A6']), .15, { when: t, inst: 'whistle', vol: .1 }); } },
        { id: 'sun', e: '☀️', n: 'Sunshine', step: (i, t) => { if (i % 8 === 0) MU.chord(['C4', 'E4', 'G4', 'B4'], 2, { when: t, inst: 'harp', vol: .08 }); } }
      ];
      const on = {}; let clk = null, used = new Set();
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Switch layers on and off to paint a scene. Composers like Debussy and Vivaldi paint weather and water too.'));
      const grid = h('div', { class: 'choices cols2' });
      const sc = ['Make a calm sunny morning', 'Make a stormy night', 'Make a day at the seaside'];
      const want = { 0: ['sun', 'birds'], 1: ['rain', 'thunder', 'wind'], 2: ['waves', 'wind', 'birds'] };
      LAYERS.forEach(Ly => {
        const b = h('button', { class: 'choice' }, Ly.e + ' ' + Ly.n);
        b.onclick = () => { on[Ly.id] = !on[Ly.id]; b.classList.toggle('good', !!on[Ly.id]); if (on[Ly.id]) used.add(Ly.id); };
        grid.append(b);
      });
      const play = h('button', { class: 'btn mint' }, '▶ Start the weather');
      play.onclick = () => {
        if (clk && clk.running) { clk.stop(); play.textContent = '▶ Start the weather'; return; }
        clk = MU.clock({ bpm: 120, stepsPerBeat: 2, steps: 32, onStep: (i, t) => LAYERS.forEach(Ly => { if (on[Ly.id]) Ly.step(i, t); }) });
        clk.start(); play.textContent = '■ Stop';
      };
      let si = 0, score = 0; const task = h('div', { class: 'prompt mt12' }, ''), fb = h('div', { class: 'feedback' });
      const setT = () => { task.textContent = 'Scene ' + (si + 1) + ' of 3: ' + sc[si]; fb.textContent = ''; };
      const check = h('button', { class: 'btn navy wide mt8' }, 'Check my scene ✔');
      check.onclick = () => {
        const w = want[si]; const got = LAYERS.filter(x => on[x.id]).map(x => x.id);
        const okAll = w.every(x => got.includes(x)); const extra = got.filter(x => !w.includes(x));
        if (okAll && extra.length <= 1) { score++; fb.textContent = '✅ That paints the scene!'; fb.className = 'feedback good'; MU.sfx.ok(); } else { fb.textContent = '💡 Try ' + w.map(x => LAYERS.find(l => l.id === x).n).join(' + ') + '.'; fb.className = 'feedback bad'; MU.sfx.bad(); }
        check.disabled = true; MU.after(() => { check.disabled = false; if (++si < 3) setT(); else { clk && clk.stop(); ctx.finish(score, 3); } }, 1500);
      };
      setT(); box.append(grid, h('div', { class: 'center mt12' }, play), task, fb, check);
      MU.onLeave(() => clk && clk.stop());
    }
  });

  /* ---------- 8. Leitmotif ---------- */
  L('leitmotif', {
    unit: 8, emoji: '🧙', title: 'Character Themes', blurb: 'A leitmotif is a tune that stands for a person or idea',
    run(ctx) {
      const C = [
        { n: '🐉 Dragon', why: 'Low, slow, heavy notes in a minor key suit a dragon.', seq: [['C2', 2], ['Eb2', 1], ['C2', 1], ['Gb2', 2]], inst: 'horn', tempo: 70 },
        { n: '🧚 Fairy', why: 'Light, high, quick notes sparkle like a fairy.', seq: [['E6', .5], ['G6', .5], ['C7', .5], ['G6', .5], ['E6', .5], ['C7', 1]], inst: 'glock', tempo: 130 },
        { n: '🦸 Hero', why: 'A bold major-key fanfare leaping upward sounds heroic.', seq: [['C4', 1], ['G4', 1], ['C5', 2], ['E5', 1], ['G5', 3]], inst: 'trumpet', tempo: 112 },
        { n: '🌙 Sleepy moon', why: 'Slow, soft, gently falling notes feel sleepy.', seq: [['G4', 2], ['E4', 2], ['D4', 2], ['C4', 4]], inst: 'flute', tempo: 56 },
        { n: '🕵️ Sneaky thief', why: 'Short, quiet, creeping notes sound sneaky.', seq: [['C3', .5], [null, .5], ['Db3', .5], [null, .5], ['C3', .5], ['Eb3', .5], [null, 1]], inst: 'clarinet', tempo: 90 }
      ];
      const pool = ctx.lvl === 1 ? C.slice(0, 3) : C;
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const c = MU.pick(pool); const opts = pool.map(x => x.n);
          return { prompt: 'Whose theme tune is this?', opts, a: pool.indexOf(c), why: c.why, play: () => MU.play(c.seq, { tempo: c.tempo, inst: c.inst, noteVol: .3 }) };
        }
      });
    }
  });

  /* ---------- 9. Dance Rhythms ---------- */
  L('dance-rhythms', {
    unit: 9, emoji: '💃', title: 'Name That Dance', blurb: 'Jig, reel, waltz or slip jig: feel the pulse',
    run(ctx) {
      const tune = ['C5', 'G4', 'E4', 'G4', 'A4', 'F4', 'D4', 'F4'];
      const mk = {
        jig: () => { const s = []; for (let b = 0; b < 4; b++) tune.slice(0, 6).forEach((n, i) => s.push([n, .5, { vol: i % 3 === 0 ? .4 : .22 }])); return s; },
        reel: () => { const s = []; for (let b = 0; b < 3; b++) tune.forEach((n, i) => s.push([n, .5, { vol: i % 2 === 0 ? .38 : .22 }])); return s; },
        waltz: () => { const s = []; for (let b = 0; b < 6; b++) [['C4', .44], ['E4', .22], ['G4', .22]].forEach((e, i) => s.push([e[0], 1, { vol: i === 0 ? .4 : .2 }])); return s; },
        slip: () => { const s = []; for (let b = 0; b < 3; b++) tune.concat(['C5']).forEach((n, i) => s.push([n, .5, { vol: i % 3 === 0 ? .4 : .22 }])); return s; }
      };
      const D = { jig: { n: 'Jig 🕺', why: 'A jig has a bouncy 6/8 feel: ONE-two-three FOUR-five-six.' }, reel: { n: 'Reel 🏃', why: 'A reel runs in smooth, even 4/4 eighth notes.' }, waltz: { n: 'Waltz 💃', why: 'A waltz sways in 3: ONE-two-three.' }, slip: { n: 'Slip jig 🌀', why: 'A slip jig has 9 beats in a bar: ONE-two-three FOUR-five-six SEVEN-eight-nine.' } };
      const keys = ctx.lvl === 1 ? ['jig', 'waltz'] : ctx.lvl === 2 ? ['jig', 'reel', 'waltz'] : ['jig', 'reel', 'waltz', 'slip'];
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const k = MU.pick(keys);
          return { prompt: 'Which dance is this?', opts: keys.map(x => D[x].n), a: keys.indexOf(k), why: D[k].why, play: () => MU.play(mk[k]().concat([]), { tempo: k === 'waltz' ? 120 : 132, inst: 'accordion', noteVol: .3 }) };
        }
      });
    }
  });

  /* ---------- 9. Chord Builder ---------- */
  L('chords', {
    unit: 9, emoji: '🎸', title: 'Chord Band', blurb: 'Build up a song with C - F - G - C',
    run(ctx) {
      const CH = [['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C3', 'E3', 'G3']];
      const chordSeq = CH.map(c => [c, 4]), bass = [['C2', 4], ['F2', 4], ['G2', 4], ['C2', 4]];
      const melody = [['E5', 2], ['G5', 2], ['A5', 2], ['F5', 2], ['G5', 2], ['B5', 2], ['G5', 2], ['E5', 2]].map((e, i) => i === 3 ? ['A5', 2] : e);
      const beat = []; for (let i = 0; i < 16; i++) beat.push([i % 4 === 0 ? '!kick' : i % 4 === 2 ? '!snare' : '!hat', 1]);
      const LY = [
        { id: 'chords', e: '🎹', n: 'Chords: the harmony', seq: chordSeq, inst: 'organ', v: .09 },
        { id: 'bass', e: '🎸', n: 'Bass: the foundation', seq: bass, inst: 'bass', v: .3 },
        { id: 'melody', e: '🎤', n: 'Melody: the tune on top', seq: melody, inst: 'flute', v: .2 },
        { id: 'beat', e: '🥁', n: 'Drums: the heartbeat', seq: beat, inst: 'piano', v: .25 }
      ];
      let ctrls = {}, on = {}, timer = null, playing = false, quizDone = 0;
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('A chord is 3 or more notes together. Many folk songs and hymns use just three: I (C), IV (F) and V (G). Switch each part on while it plays.'));
      const list = h('div');
      LY.forEach(Ly => {
        const sw = h('span', { class: 'chip' }, 'OFF');
        const row = h('button', { class: 'labcard', style: { marginBottom: '8px' } }, h('span', { class: 'em' }, Ly.e), h('span', { style: { flex: 1 } }, h('b', null, Ly.n)), sw);
        row.onclick = () => { on[Ly.id] = !on[Ly.id]; sw.textContent = on[Ly.id] ? 'ON' : 'OFF'; sw.style.background = on[Ly.id] ? '#12B58C' : ''; sw.style.color = on[Ly.id] ? '#fff' : ''; ctrls[Ly.id] && ctrls[Ly.id].setVol(on[Ly.id] ? 1 : 0); };
        list.append(row);
      });
      const label = h('div', { class: 'bigem center', style: { fontFamily: 'Baloo 2', color: '#2B1B4D', fontSize: '2.4rem' } }, 'I');
      const names = ['I (C)', 'IV (F)', 'V (G)', 'I (C)'];
      const play = h('button', { class: 'btn mint' }, '▶ Play');
      function stop() { playing = false; Object.values(ctrls).forEach(c => c.stop()); ctrls = {}; clearInterval(timer); play.textContent = '▶ Play'; }
      function start() {
        stop(); playing = true; play.textContent = '■ Stop'; const t0 = performance.now(), dur = 16 * 60 / 100 * 1000;
        LY.forEach(Ly => { ctrls[Ly.id] = MU.play(Ly.seq, { tempo: 100, inst: Ly.inst, noteVol: Ly.v, delay: .1, vol: on[Ly.id] ? 1 : 0 }); });
        timer = setInterval(() => { const p = ((performance.now() - t0) % dur) / dur; label.textContent = names[Math.floor(p * 4)]; if (performance.now() - t0 >= dur) { start(); } }, 150);
      }
      play.onclick = () => playing ? stop() : start();
      box.append(list, label, h('div', { class: 'center' }, play));
      // quiz
      const qbox = h('div', { class: 'card mt16' }); box.append(qbox);
      const QS = [
        { q: 'Which part is the lowest and holds up the harmony?', o: ['Bass', 'Melody', 'Chords'], a: 0 },
        { q: 'Three or more notes played together make a…', o: ['Chord', 'Rest', 'Scale'], a: 0 },
        { q: 'The tune you can sing along to is the…', o: ['Melody', 'Bass', 'Beat'], a: 0 }
      ];
      let qi = 0, sc = 0;
      function showQ() {
        qbox.innerHTML = ''; const q = QS[qi]; const fb = h('div', { class: 'feedback' });
        qbox.append(h('b', null, 'Question ' + (qi + 1) + ' of 3'), h('p', { class: 'mt8' }, q.q));
        const ord = MU.shuffle(q.o.map((t, i) => ({ t, ok: i === q.a })));
        const bs = ord.map(x => h('button', { class: 'choice', onclick: e => { bs.forEach(b => b.disabled = true); if (x.ok) { sc++; e.currentTarget.classList.add('good'); fb.textContent = '✅'; MU.sfx.ok(); } else { e.currentTarget.classList.add('bad'); fb.textContent = '💡 It is ' + q.o[q.a] + '.'; MU.sfx.bad(); } MU.after(() => { if (++qi < QS.length) showQ(); else { stop(); ctx.finish(sc, 3); } }, 1100); } }, x.t));
        qbox.append(h('div', { class: 'choices' }, bs), fb);
      }
      showQ();
      MU.onLeave(stop);
    }
  });

  /* ---------- 9. Irish Instruments ---------- */
  L('irish-instruments', {
    unit: 9, emoji: '☘️', title: 'Irish Session', blurb: 'Meet the instruments of a traditional music session',
    run(ctx) {
      const I = [
        { n: 'Tin whistle', e: '🎶', d: 'a small six-holed metal flute that is cheap and loved by beginners', sy: 'whistle', seq: [['D5', .5], ['E5', .5], ['F#5', .5], ['A5', 1.5]] },
        { n: 'Fiddle', e: '🎻', d: 'the same instrument as a violin, but played in a lively folk style', sy: 'fiddle', seq: [['A4', .5], ['B4', .5], ['C#5', .5], ['E5', .5], ['D5', 1]] },
        { n: 'Bodhrán', e: '🥁', d: 'a frame drum made of goatskin, played with a wooden stick called a tipper', sy: null, drum: 'bodhran' },
        { n: 'Uilleann pipes', e: '🎷', d: 'bagpipes pumped by an elbow bellows instead of blown by mouth', sy: 'oboe', seq: [['D4', 1], ['E4', .5], ['F#4', .5], ['A4', 2]] },
        { n: 'Irish harp', e: '🪕', d: 'the national symbol of Ireland, with strings plucked by the fingers', sy: 'harp', seq: [['G4', .5], ['B4', .5], ['D5', .5], ['G5', 1.5]] },
        { n: 'Accordion', e: '🪗', d: 'a squeezebox that plays by pushing and pulling air through reeds', sy: 'accordion', seq: [['G4', .5], ['A4', .5], ['B4', .5], ['D5', 1.5]] }
      ];
      const pool = ctx.lvl === 1 ? I.filter(x => ['Tin whistle', 'Fiddle', 'Bodhrán', 'Irish harp'].includes(x.n)) : I;
      const play = x => () => x.drum ? MU.play([['!bodhran', .5], ['!bodhran', .25], ['!bodhran', .25], ['!bodhran', .5], ['!bodhran', .5], ['!bodhran', 1]], { tempo: 120 }) : MU.play(x.seq, { tempo: 100, inst: x.sy, noteVol: .3 });
      MU.runRounds(ctx, {
        n: 8, cols: 2, make(i) {
          const x = MU.pick(pool);
          if (i % 2) { const opts = MU.shuffle(pool.filter(y => y !== x)).slice(0, 3).concat(x); return { prompt: 'Which instrument is described? It is ' + x.d + '.', opts: opts.map(y => y.e + ' ' + y.n), a: 3, why: x.n + ': ' + x.d + '.' }; }
          const opts = MU.shuffle(pool.filter(y => y !== x)).slice(0, 3).concat(x);
          return { prompt: 'Which instrument do you think is playing? (A synthesised imitation.)', opts: opts.map(y => y.e + ' ' + y.n), a: 3, why: x.n + ' is ' + x.d + '.', play: play(x) };
        }
      });
    }
  });

  /* ---------- 9. Call and Response (shanty) ---------- */
  L('shanty', {
    unit: 9, emoji: '⚓', title: 'Call and Response', blurb: 'Sea shanties had a leader and a crowd: echo the rhythm!',
    run(ctx) {
      const STEPS = 8, ROUNDS = 5, dens = ctx.lvl === 1 ? 3 : ctx.lvl === 2 ? 4 : 5;
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Sailors hauled ropes together to a call from the shanty man. Listen to the CALL, then tap the cells to answer with the same rhythm.'));
      let r = 0, score = 0, call = [], mine = [];
      const cells = [], row = h('div', { class: 'seqgrid', style: { gridTemplateColumns: 'repeat(' + STEPS + ', 1fr)' } });
      for (let i = 0; i < STEPS; i++) { const c = h('button', { class: 'cell', 'aria-label': 'Step ' + (i + 1) }); c.onclick = () => { mine[i] = !mine[i]; c.classList.toggle('on', !!mine[i]); MU.drum('wood', {}); }; cells.push(c); row.append(c); }
      const title = h('div', { class: 'prompt' }, ''), fb = h('div', { class: 'feedback' });
      const hear = MU.hearBtn('Hear the call', () => playCall());
      const hearMine = MU.hearBtn('Play my answer', () => { const s = []; for (let i = 0; i < STEPS; i++) s.push([mine[i] ? '!wood' : null, .5]); MU.play(s, { tempo: 100 }); });
      const check = h('button', { class: 'btn navy wide mt12' }, 'Check ✔');
      function playCall() { MU.stopAll(); const s = []; for (let i = 0; i < STEPS; i++) s.push([call[i] ? '!wood' : null, .5]); MU.play(s, { tempo: 100 }); }
      function newRound() {
        mine = []; cells.forEach(c => c.classList.remove('on', 'good', 'bad')); fb.textContent = ''; title.textContent = 'Round ' + (r + 1) + ' of ' + ROUNDS;
        call = new Array(STEPS).fill(false); call[0] = true; let n = 1; while (n < dens) { const k = Math.floor(Math.random() * STEPS); if (!call[k]) { call[k] = true; n++; } }
        MU.after(playCall, 400);
      }
      check.onclick = () => {
        let ok = true; for (let i = 0; i < STEPS; i++) { if (!!mine[i] !== !!call[i]) { ok = false; cells[i].classList.add('bad'); } }
        if (ok) { score++; fb.textContent = '✅ A perfect echo!'; fb.className = 'feedback good'; MU.sfx.ok(); } else { fb.textContent = '💡 Red cells are different. Hear the call again.'; fb.className = 'feedback bad'; MU.sfx.bad(); call.forEach((v, i) => { if (v) cells[i].classList.add('good'); }); }
        check.disabled = true; MU.after(() => { check.disabled = false; if (++r < ROUNDS) newRound(); else ctx.finish(score, ROUNDS); }, ok ? 1000 : 2200);
      };
      box.append(title, h('div', { class: 'center mt8' }, hear), row, h('div', { class: 'center mt8' }, hearMine), fb, check);
      newRound();
    }
  });
})();
