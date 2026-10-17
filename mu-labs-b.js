/* Music Adventure - labs for movements 4-6: expression, instruments, form & texture. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const L = (id, o) => { MU.labs[id] = o; };

  /* ---------- 4. Volume Dial ---------- */
  const dynIndex = v => v < 12 ? 0 : v < 28 ? 1 : v < 45 ? 2 : v < 62 ? 3 : v < 80 ? 4 : 5;
  const volOf = v => 0.03 + 0.5 * Math.pow(v / 100, 2);
  L('dynamics', {
    unit: 4, emoji: '🎚️', title: 'Volume Dial', blurb: 'Set the dynamics: pp, p, mf, f, ff and crescendo',
    run(ctx) {
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Press Play, then use the dial to match what you are asked.'));
      const label = h('div', { class: 'bigem', style: { fontFamily: 'Baloo 2', color: '#2B1B4D', fontSize: '3rem' } }, 'mf');
      const sub = h('div', { class: 'muted center' }, 'medium loud');
      const dial = h('input', { type: 'range', min: 0, max: 100, value: 50, 'aria-label': 'Volume' });
      const meter = h('div', { class: 'meter mt8' }, h('i', { style: { width: '50%' } }));
      const task = h('div', { class: 'prompt mt12' }, '');
      const fbk = h('div', { class: 'feedback' });
      const play = h('button', { class: 'btn mint' }, '▶ Play');
      const check = h('button', { class: 'btn navy' }, 'Check ✔');
      box.append(h('div', { class: 'center' }, label, sub), h('div', { class: 'row mt12' }, h('span', null, '🔈'), dial, h('span', null, '🔊')), meter, task, fbk, h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } }, play, check));
      const tasks = [{ t: 'pp' }, { t: 'f' }, { t: 'p' }, { t: 'ff' }, { t: 'mf' }, { t: 'cresc' }];
      if (ctx.lvl >= 2) tasks.push({ t: 'decresc' });
      let ti = 0, right = 0, clk = null, recent = [];
      const refresh = () => { const v = Number(dial.value), i = dynIndex(v), d = MU.DYNAMICS[i]; label.textContent = d.term; sub.textContent = d.long + ': ' + d.d; meter.firstChild.style.width = v + '%'; };
      dial.oninput = refresh;
      function setTask() {
        const t = tasks[ti]; fbk.textContent = '';
        if (t.t === 'cresc') task.textContent = 'Crescendo! Start soft and slowly turn it up while the tune plays.';
        else if (t.t === 'decresc') task.textContent = 'Decrescendo! Start loud and slowly turn it down.';
        else { const d = MU.DYNAMICS.find(x => x.term === t.t); task.textContent = 'Set the dial to ' + d.term + ' (' + d.long + ', ' + d.d + ').'; }
        if (t.t === 'cresc') { dial.value = 10; } else if (t.t === 'decresc') { dial.value = 90; }
        refresh();
      }
      const mel = MU.MEL.ode.seq.filter(e => e[0]).slice(0, 12).map(e => e[0]);
      play.onclick = () => {
        if (clk && clk.running) { clk.stop(); play.textContent = '▶ Play'; return; }
        recent = [];
        clk = MU.clock({ bpm: 112, steps: mel.length, onStep: (i, when, secs) => {
          const v = Number(dial.value); recent.push(v); if (recent.length > 8) recent.shift();
          MU.note(mel[i], .45, { when: secs, inst: 'piano', vol: volOf(v) });
        } });
        clk.start(); play.textContent = '■ Stop';
      };
      check.onclick = () => {
        const t = tasks[ti]; let ok = false;
        if (t.t === 'cresc' || t.t === 'decresc') {
          if (recent.length < 6) { fbk.textContent = 'Press Play first and turn the dial while it plays.'; fbk.className = 'feedback bad'; return; }
          const first = recent[0], last = recent[recent.length - 1], diff = last - first;
          ok = t.t === 'cresc' ? diff >= 30 : diff <= -30;
        } else ok = MU.DYNAMICS[dynIndex(Number(dial.value))].term === t.t;
        if (ok) { right++; fbk.textContent = '✅ Yes!'; fbk.className = 'feedback good'; MU.sfx.ok(); } else { fbk.textContent = '💡 Not quite. The label above the dial should show the target.'; fbk.className = 'feedback bad'; MU.sfx.bad(); }
        check.disabled = true;
        MU.after(() => { check.disabled = false; if (++ti < tasks.length) setTask(); else { clk && clk.stop(); ctx.finish(right, tasks.length); } }, 1100);
      };
      setTask();
      MU.onLeave(() => clk && clk.stop());
    }
  });

  /* ---------- 4. Tempo by Ear ---------- */
  L('tempo-ear', {
    unit: 4, emoji: '⏱️', title: 'Tempo by Ear', blurb: 'Slow, medium, fast: and getting faster or slower',
    run(ctx) {
      const phrase = MU.MEL.twinkle.seq.slice(0, 8);
      const T1 = [{ n: 'Slow 🐢', bpm: 60 }, { n: 'Medium 🚶', bpm: 108 }, { n: 'Fast 🐇', bpm: 170 }];
      const T2 = MU.TEMPOS.filter(x => ['Adagio', 'Moderato', 'Allegro', 'Presto'].includes(x.term));
      const T3 = MU.TEMPOS;
      function accel(dir) { return phrase.map((e, i) => [e[0], e[1] * (dir > 0 ? Math.pow(0.9, i) : Math.pow(1.12, i))]); }
      MU.runRounds(ctx, {
        n: 8,
        make(i) {
          if (ctx.lvl >= 2 && i % 4 === 3) {
            const dir = Math.random() < .5 ? 1 : -1;
            return { prompt: 'Is the music speeding up or slowing down?', opts: ['Speeding up (accelerando)', 'Slowing down (ritardando)', 'Staying the same'], a: dir > 0 ? 0 : 1, why: dir > 0 ? 'The notes get shorter and shorter: accelerando.' : 'The notes get longer: ritardando.', play: () => MU.play(accel(dir), { tempo: dir > 0 ? 80 : 150, inst: 'piano' }) };
          }
          if (ctx.lvl === 1) { const k = MU.pick(T1); return { prompt: 'How fast is the music?', opts: T1.map(x => x.n), a: T1.indexOf(k), why: 'That was ' + k.bpm + ' beats per minute.', play: () => MU.play(phrase, { tempo: k.bpm, inst: 'piano' }) }; }
          const pool = ctx.lvl === 2 ? T2 : T3; const k = MU.pick(pool);
          const opts = ctx.lvl === 2 ? pool : MU.shuffle(T3).slice(0, 4);
          if (!opts.includes(k)) opts[0] = k;
          const sorted = opts.slice().sort((a, b) => a.bpm - b.bpm);
          return { prompt: 'Which tempo word fits?', opts: sorted.map(x => x.term), a: sorted.indexOf(k), why: k.term + ' means ' + k.d + ' (about ' + k.bpm + ' beats per minute).', play: () => MU.play(phrase, { tempo: k.bpm, inst: 'piano' }) };
        }
      });
    }
  });

  /* ---------- 4. Word Match (Italian terms) ---------- */
  function demo(term) {
    const ph = [['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1], ['C4', 2]];
    const D = {
      pp: () => MU.play(ph, { tempo: 100, noteVol: .04 }), p: () => MU.play(ph, { tempo: 100, noteVol: .09 }), mp: () => MU.play(ph, { tempo: 100, noteVol: .15 }), mf: () => MU.play(ph, { tempo: 100, noteVol: .24 }), f: () => MU.play(ph, { tempo: 100, noteVol: .38 }), ff: () => MU.play(ph, { tempo: 100, noteVol: .55 }),
      crescendo: () => MU.play(ph.map((e, i) => [e[0], e[1], { vol: .04 + i * .1 }]), { tempo: 100 }), decrescendo: () => MU.play(ph.map((e, i) => [e[0], e[1], { vol: .45 - i * .09 }]), { tempo: 100 }),
      staccato: () => MU.play(ph.map(e => [e[0], e[1]]), { tempo: 100, legato: .25 }), legato: () => MU.play(ph, { tempo: 100, legato: 1 }),
      accelerando: () => MU.play(ph.map((e, i) => [e[0], e[1] * Math.pow(.8, i)]), { tempo: 90 }), ritardando: () => MU.play(ph.map((e, i) => [e[0], e[1] * Math.pow(1.25, i)]), { tempo: 130 })
    };
    MU.TEMPOS.forEach(t => { D[t.term.toLowerCase()] = () => MU.play(ph, { tempo: t.bpm }); });
    return D[term];
  }
  L('term-match', {
    unit: 4, emoji: '🇮🇹', title: 'Word Match', blurb: 'Italian music words and what they mean',
    run(ctx) {
      const base = [];
      MU.DYNAMICS.forEach(x => base.push({ k: x.term === 'p' ? 'piano (p)' : x.term === 'f' ? 'forte (f)' : x.long + ' (' + x.term + ')', d: x.d, demo: x.term }));
      MU.TEMPOS.forEach(x => base.push({ k: x.term, d: x.d, demo: x.term.toLowerCase() }));
      MU.TERMS.forEach(x => base.push({ k: x.t, d: x.d, demo: x.t }));
      const pool = ctx.lvl === 1 ? base.filter(x => ['forte (f)', 'piano (p)', 'Allegro', 'Adagio', 'Presto', 'crescendo', 'staccato', 'legato'].includes(x.k)) : ctx.lvl === 2 ? base.filter(x => !['fermata', 'a tempo', 'cantabile', 'maestoso', 'Moderato'].includes(x.k) || true).slice(0, 22) : base;
      MU.runRounds(ctx, {
        n: 8, make(i) {
          const w = MU.pick(pool); const fw = demo(w.demo);
          const rev = ctx.lvl >= 2 && i % 2 === 1;
          const others = MU.shuffle(pool.filter(x => x.d !== w.d)).slice(0, 3);
          if (!rev) { const opts = MU.shuffle([w].concat(others)).map(x => x.d); return { prompt: 'What does "' + w.k + '" mean?', opts, a: opts.indexOf(w.d), why: w.k + ' means ' + w.d + '.', play: fw ? () => fw() : null, hearLabel: 'Hear an example', autoplay: false }; }
          const opts = MU.shuffle([w].concat(others)).map(x => x.k); return { prompt: 'Which word means "' + w.d + '"?', opts, a: opts.indexOf(w.k), why: w.k + ' means ' + w.d + '.', play: fw ? () => fw() : null, hearLabel: 'Hear an example', autoplay: false };
        }
      });
    }
  });

  /* ---------- 5. Sort the Instruments ---------- */
  L('families', {
    unit: 5, emoji: '🗂️', title: 'Sort the Instruments', blurb: 'Which family does each instrument belong to?',
    run(ctx) {
      const pool = ctx.lvl === 1 ? MU.INSTR.filter(i => ['violin', 'cello', 'harp', 'flute', 'clarinet', 'trumpet', 'horn', 'snare', 'timpani', 'xylophone'].includes(i.id)) : MU.INSTR;
      MU.runRounds(ctx, {
        n: 10, cols: 2, make() {
          const ins = MU.pick(pool);
          const card = MU.h('div', { class: 'center' }, MU.h('div', { class: 'bigem' }, ins.e), MU.h('b', { style: { fontSize: '1.3rem', color: '#2B1B4D' } }, ins.name));
          const fam = MU.FAMILIES.find(f => f.id === ins.fam);
          const q = { prompt: 'Which family does this instrument belong to?', visual: card, opts: MU.FAMILIES.map(f => f.e + ' ' + f.name), a: MU.FAMILIES.indexOf(fam), why: ins.name + ' is in the ' + fam.name + ' family. ' + ins.d };
          if (ins.synth || ins.drum) { q.play = () => MU.hearInstr(ins); q.hearLabel = 'Hear a synth version'; q.autoplay = false; }
          return q;
        }
      });
    }
  });

  /* ---------- 5. Build the Orchestra ---------- */
  L('orchestra', {
    unit: 5, emoji: '🎼', title: 'Build the Orchestra', blurb: 'Add each family one by one and hear the sound grow',
    run(ctx) {
      const ode = MU.MEL.ode.seq, up = (seq, k) => seq.map(e => e[0] ? [MU.nameOf(MU.midi(e[0]) + k), e[1]] : e);
      const chordSeq = [[['C3', 'E3', 'G3'], 4], [['G2', 'B2', 'D3'], 4], [['C3', 'E3', 'G3'], 4], [['G2', 'B2', 'D3'], 4], [['C3', 'E3', 'G3'], 4], [['G2', 'B2', 'D3'], 4], [['C3', 'E3', 'G3'], 4], [['G2', 'B2', 'D3'], 2], [['C3', 'E3', 'G3'], 2]];
      const bassSeq = [['C2', 4], ['G1', 4], ['C2', 4], ['G1', 4], ['C2', 4], ['G1', 4], ['C2', 4], ['G1', 2], ['C2', 2]];
      const timp = []; for (let b = 0; b < 8; b++) timp.push(['!timp', 2], [null, 2]);
      const spark = []; for (let b = 0; b < 8; b++) spark.push(['C6', .5], [null, 3.5]);
      const LAYERS = [
        { id: 'violins', n: 'Violins play the tune', fam: 'strings', e: '🎻', inst: 'violin', seq: up(ode, 12), vol: .26 },
        { id: 'flutes', n: 'Flutes double the tune', fam: 'woodwinds', e: '🎶', inst: 'flute', seq: up(ode, 12), vol: .24 },
        { id: 'horns', n: 'Horns hold the chords', fam: 'brass', e: '📯', inst: 'horn', seq: chordSeq, vol: .1 },
        { id: 'basses', n: 'Double basses play the roots', fam: 'strings', e: '🎻', inst: 'bass', seq: bassSeq, vol: .3 },
        { id: 'timp', n: 'Timpani mark the bar', fam: 'percussion', e: '🥁', inst: 'piano', seq: timp, vol: .22 },
        { id: 'glock', n: 'Glockenspiel sparkles', fam: 'percussion', e: '🔔', inst: 'glock', seq: spark, vol: .18 }
      ];
      const on = {}; const heardFam = new Set(); let ctrls = {}, playing = false, timer = null;
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Switch on each part while the music plays. Listen to how each family changes the sound.'));
      const list = h('div', null);
      const famBadges = h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } });
      const drawFam = () => { famBadges.innerHTML = ''; MU.FAMILIES.forEach(f => famBadges.append(h('span', { class: 'chip', style: { background: heardFam.has(f.id) ? '#b9f3df' : '#eeeaff' } }, (heardFam.has(f.id) ? '✔ ' : '') + f.e + ' ' + f.name))); };
      LAYERS.forEach(Ly => {
        const row = h('button', { class: 'labcard', style: { marginBottom: '8px' } }, h('span', { class: 'em' }, Ly.e), h('span', { style: { flex: 1 } }, h('b', null, Ly.n), h('span', { class: 'd' }, MU.FAMILIES.find(f => f.id === Ly.fam).name + ' family')), h('span', { class: 'chip', id: 'sw-' + Ly.id }, 'OFF'));
        row.onclick = () => {
          on[Ly.id] = !on[Ly.id]; const sw = row.querySelector('.chip'); sw.textContent = on[Ly.id] ? 'ON' : 'OFF'; sw.style.background = on[Ly.id] ? '#12B58C' : ''; sw.style.color = on[Ly.id] ? '#fff' : '';
          if (ctrls[Ly.id]) ctrls[Ly.id].setVol(on[Ly.id] ? 1 : 0);
          if (on[Ly.id] && playing) { heardFam.add(Ly.fam); drawFam(); }
        };
        list.append(row);
      });
      drawFam();
      const bar = h('div', { class: 'progress' }, h('i', { style: { width: '0%' } }));
      const play = h('button', { class: 'btn mint' }, '▶ Play the orchestra');
      function startAll() {
        stopAll(); playing = true; play.textContent = '■ Stop';
        LAYERS.forEach(Ly => { ctrls[Ly.id] = MU.play(Ly.seq, { tempo: 100, inst: Ly.inst, noteVol: Ly.vol, delay: .1, vol: on[Ly.id] ? 1 : 0 }); });
        LAYERS.forEach(Ly => { if (on[Ly.id]) heardFam.add(Ly.fam); }); drawFam();
        const t0 = performance.now(), total = ctrls.violins.seconds * 1000;
        timer = setInterval(() => { const p = (performance.now() - t0) / total; bar.firstChild.style.width = Math.min(100, p * 100) + '%'; if (p >= 1) startAll(); }, 120);
      }
      function stopAll() { playing = false; clearInterval(timer); Object.values(ctrls).forEach(c => c.stop()); ctrls = {}; play.textContent = '▶ Play the orchestra'; bar.firstChild.style.width = '0%'; }
      play.onclick = () => playing ? stopAll() : startAll();
      box.append(list, bar, h('div', { class: 'center' }, play), h('p', { class: 'small muted center mt12' }, 'Hear all four families at least once to finish:'), famBadges);
      box.append(h('button', { class: 'btn navy wide mt16', onclick: () => { if (heardFam.size < 2) return MU.toast('Switch on a few parts while it plays'); stopAll(); ctx.finish(heardFam.size, 4, 'You heard ' + heardFam.size + ' of 4 families working together.'); } }, "I'm done ✔"));
      MU.onLeave(() => { clearInterval(timer); });
    }
  });

  /* ---------- 5. Guess the Instrument ---------- */
  L('timbre', {
    unit: 5, emoji: '👂', title: 'Guess the Instrument', blurb: 'Same notes, different colours of sound',
    run(ctx) {
      const NAMES = { violin: 'Violin', cello: 'Cello', flute: 'Flute', oboe: 'Oboe', clarinet: 'Clarinet', trumpet: 'Trumpet', horn: 'French horn', harp: 'Harp', xylophone: 'Xylophone', piano: 'Piano', organ: 'Organ', glock: 'Glockenspiel' };
      const EM = { violin: '🎻', cello: '🎻', flute: '🎶', oboe: '🎶', clarinet: '🎶', trumpet: '🎺', horn: '📯', harp: '🎶', xylophone: '🎵', piano: '🎹', organ: '⛪', glock: '🔔' };
      const easy = ['violin', 'flute', 'trumpet', 'xylophone', 'piano', 'harp'], mid = easy.concat(['cello', 'clarinet', 'organ', 'glock']), hard = Object.keys(NAMES);
      const pool = ctx.lvl === 1 ? easy : ctx.lvl === 2 ? mid : hard, nopts = ctx.lvl === 1 ? 3 : 4;
      const motif = [['E4', 1], ['G4', 1], ['C5', 1.5], ['G4', 1.5]];
      MU.runRounds(ctx, {
        n: 8, cols: 2, make() {
          const k = MU.pick(pool); const wrong = MU.shuffle(pool.filter(x => x !== k)).slice(0, nopts - 1);
          const opts = MU.shuffle([k].concat(wrong));
          const lowInst = ['cello', 'horn'].includes(k);
          const m = lowInst ? motif.map(e => [MU.nameOf(MU.midi(e[0]) - 12), e[1]]) : motif;
          return { prompt: 'Which instrument is playing?', opts: opts.map(x => EM[x] + ' ' + NAMES[x]), a: opts.indexOf(k), why: 'That was the ' + NAMES[k] + ' (a synthesised imitation: real ones sound richer).', play: () => MU.play(m, { tempo: 96, inst: k, noteVol: .3 }) };
        }
      });
    }
  });

  /* ---------- 5. Wave Lab ---------- */
  L('sound-lab', {
    unit: 5, emoji: '🌊', title: 'Wave Lab', blurb: 'See what pitch and loudness look like',
    run(ctx) {
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('Sound is vibration. Press Hold Sound and change the dials to see the wave move!'));
      const cv = h('canvas', { class: 'scope', width: 600, height: 220 }); const g = cv.getContext('2d');
      let wave = 'sine', midi = 57, vol = .3, osc = null, gain = null, raf = null;
      const readout = h('div', { class: 'center', style: { fontWeight: 800, color: '#2B1B4D' } }, '');
      const pitch = h('input', { type: 'range', min: 36, max: 96, value: midi, 'aria-label': 'Pitch' });
      const loud = h('input', { type: 'range', min: 5, max: 100, value: 30, 'aria-label': 'Loudness' });
      const wbox = h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, ['sine', 'triangle', 'square', 'sawtooth'].map(w => h('button', { class: 'chip btnlike' + (w === wave ? ' on' : ''), onclick: e => { wave = w; wbox.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); if (osc) osc.type = w; } }, w)));
      function upd() { midi = Number(pitch.value); vol = Number(loud.value) / 100; const f = MU.freq(midi); readout.textContent = MU.nameOf(midi) + ' · ' + f.toFixed(1) + ' Hz (vibrations per second)'; if (osc) { osc.frequency.setTargetAtTime(f, MU.now(), .02); gain.gain.setTargetAtTime(vol * .4, MU.now(), .02); } }
      pitch.oninput = upd; loud.oninput = upd; upd();
      const hold = h('button', { class: 'btn big coral wide mt12' }, '🔊 Hold Sound');
      const start = () => { if (osc) return; const c = MU.ac(); osc = c.createOscillator(); gain = c.createGain(); osc.type = wave; osc.frequency.value = MU.freq(midi); gain.gain.value = 0.0001; osc.connect(gain); gain.connect(MU.master()); osc.start(); gain.gain.setTargetAtTime(vol * .4, c.currentTime, .02); };
      const stop = () => { if (!osc) return; const o = osc, gg = gain; osc = null; gain = null; gg.gain.setTargetAtTime(0.0001, MU.now(), .03); setTimeout(() => { try { o.stop(); } catch (e) { } }, 150); };
      hold.addEventListener('pointerdown', e => { e.preventDefault(); start(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, stop));
      function draw() {
        raf = requestAnimationFrame(draw); g.fillStyle = '#1d1236'; g.fillRect(0, 0, 600, 220);
        g.strokeStyle = '#F5B83D'; g.lineWidth = 3; g.beginPath();
        if (osc && MU.analyser) {
          const buf = new Float32Array(MU.analyser.fftSize); MU.analyser.getFloatTimeDomainData(buf);
          // trigger on rising zero crossing for a steady picture
          let s0 = 0; for (let i = 1; i < buf.length / 2; i++) { if (buf[i - 1] < 0 && buf[i] >= 0) { s0 = i; break; } }
          for (let i = 0; i < 500; i++) { const y = 110 - (buf[s0 + i] || 0) * 360; i ? g.lineTo(i * 1.2, y) : g.moveTo(0, y); }
        } else { g.moveTo(0, 110); g.lineTo(600, 110); }
        g.stroke();
      }
      draw();
      MU.onLeave(() => { cancelAnimationFrame(raf); stop(); });
      const learn = h('div', { class: 'card flat small' }, h('b', null, 'What am I seeing? '), 'Each bump is one vibration. High notes have lots of tiny bumps squeezed together. Loud notes have tall bumps. Different shapes (sine, square) give different timbres.');
      box.append(cv, readout, h('label', { class: 'lbl' }, 'Pitch (low → high)'), pitch, h('label', { class: 'lbl' }, 'Loudness'), loud, wbox, hold, learn);
      // challenges
      const tasks = [
        { t: 'Make a HIGH note (above 800 Hz) and hold it.', ok: () => MU.freq(midi) > 800 },
        { t: 'Make a LOW note (below 150 Hz) and hold it.', ok: () => MU.freq(midi) < 150 },
        { t: 'Find A4 = 440 Hz, the note the orchestra tunes to!', ok: () => midi === 69 }
      ];
      let ti = 0, score = 0; const tbox = h('div', { class: 'card mt12' }), tmsg = h('div', { class: 'feedback' });
      const tcheck = h('button', { class: 'btn navy wide mt8' }, 'Check ✔');
      const showT = () => { tbox.innerHTML = ''; tbox.append(h('b', null, 'Challenge ' + (ti + 1) + ' of ' + tasks.length), h('p', { class: 'mt8' }, tasks[ti].t), tcheck, tmsg); };
      tcheck.onclick = () => {
        if (!osc) { tmsg.textContent = 'Hold the sound button, and check with your other finger or tap Check while holding.'; tmsg.className = 'feedback bad'; }
        const ok = tasks[ti].ok(); if (ok) { score++; tmsg.textContent = '✅ Yes!'; tmsg.className = 'feedback good'; MU.sfx.ok(); } else { tmsg.textContent = '💡 Not yet. Move the pitch dial.'; tmsg.className = 'feedback bad'; MU.sfx.bad(); }
        if (ok) { MU.after(() => { if (++ti < tasks.length) { tmsg.textContent = ''; showT(); } else { stop(); ctx.finish(score, tasks.length); } }, 900); }
      };
      showT(); ctx.root.append(tbox);
    }
  });

  /* ---------- 6. Form Detective ---------- */
  const SEC = {
    A: [['E4', 1], ['G4', 1], ['C5', 1], ['G4', 1], ['E4', 1], ['G4', 1], ['C5', 2]],
    B: [['A4', 1], ['F4', 1], ['D4', 1], ['F4', 1], ['A4', 1], ['F4', 1], ['D4', 2]],
    C: [['G4', .5], ['G4', .5], ['A4', 1], ['B4', 1], ['C5', 1], ['B4', 1], ['G4', 1], ['E4', 1], ['G4', 2]].slice(0, 9)
  };
  const SECCOL = { A: '#E0529C', B: '#12B58C', C: '#E08A00' };
  L('form-detective', {
    unit: 6, emoji: '🔍', title: 'Form Detective', blurb: 'Is it ABA, AAB, or a rondo?',
    run(ctx) {
      const forms = ctx.lvl === 1 ? ['ABA', 'AAB', 'ABB'] : ctx.lvl === 2 ? ['ABA', 'AABA', 'ABAB', 'AAB'] : ['ABA', 'ABACA', 'AABA', 'ABCA'];
      const blocks = f => h('div', { class: 'row', style: { justifyContent: 'center', gap: '6px' } }, f.split('').map(ch => h('span', { style: { background: SECCOL[ch], color: '#fff', fontWeight: 800, borderRadius: '10px', padding: '8px 14px', fontFamily: 'Baloo 2', fontSize: '1.2rem' } }, ch)));
      MU.runRounds(ctx, {
        n: 6, make() {
          const f = MU.pick(forms), insts = ctx.lvl === 1 ? { A: 'piano', B: 'flute', C: 'harp' } : { A: 'piano', B: 'piano', C: 'piano' };
          const wrongs = MU.shuffle(forms.filter(x => x !== f)).slice(0, 3); const opts = MU.shuffle([f].concat(wrongs)).map(x => x.split('').join(' '));
          const seq = []; f.split('').forEach(ch => SEC[ch].forEach(e => seq.push([e[0], e[1], { inst: insts[ch] }])));
          return { prompt: 'Listen for the sections. What is the form?', opts, a: opts.indexOf(f.split('').join(' ')), why: 'Order of sections: ' + f.split('').join(' - ') + (f === 'ABA' ? ' (the first tune comes back)' : f.includes('ACA') ? ' (a rondo: A keeps returning)' : '') + '.',
            play: () => MU.play(seq, { tempo: 126, inst: 'piano', noteVol: .28 }), after: () => { }, cols: 2 };
        }, cols: 2
      });
    }
  });

  /* ---------- 6. Happy or Sad? (major vs minor) ---------- */
  L('major-minor', {
    unit: 6, emoji: '🎭', title: 'Bright or Dark?', blurb: 'Hear the difference between major and minor',
    run(ctx) {
      const tunes = [
        { M: [['C4', 1], ['D4', 1], ['E4', 1], ['G4', 2]], m: [['C4', 1], ['D4', 1], ['Eb4', 1], ['G4', 2]] },
        { M: [['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1], ['C4', 2]], m: [['C4', 1], ['Eb4', 1], ['G4', 1], ['Eb4', 1], ['C4', 2]] },
        { M: [['G4', 1], ['A4', 1], ['B4', 1], ['C5', 2]], m: [['G4', 1], ['A4', 1], ['Bb4', 1], ['C5', 2]] }
      ];
      // minor scales as ascending/descending for lvl3
      const scaleMaj = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], scaleMin = ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'];
      MU.runRounds(ctx, {
        n: 8, make() {
          const isMaj = Math.random() < .5; const shift = MU.pick([0, 2, 3, 5, -2, -3]);
          const t = MU.pick(tunes); let seq = isMaj ? t.M : t.m;
          if (ctx.lvl === 3 && Math.random() < .5) seq = (isMaj ? scaleMaj : scaleMin).map(n => [n, .6]);
          const sh = seq.map(e => [MU.nameOf(MU.midi(e[0]) + shift), e[1]]);
          const opts = ctx.lvl === 1 ? ['😊 Bright (major)', '🌙 Darker (minor)'] : ['Major', 'Minor'];
          return { prompt: 'Does this sound major or minor?', opts, a: isMaj ? 0 : 1, why: isMaj ? 'Major: the third note is higher, giving a brighter colour.' : 'Minor: the third note is lowered by one semitone, giving a darker colour.', play: () => MU.play(sh, { tempo: 90, inst: 'piano' }) };
        }
      });
    }
  });

  /* ---------- 6. Round Together ---------- */
  L('round', {
    unit: 6, emoji: '🔁', title: 'Round Together', blurb: 'Layer a round like Frère Jacques, voice by voice',
    run(ctx) {
      const mel = MU.MEL.frere.seq; const LEN = 32, OFFS = [0, 8, 16, 24], INS = ['flute', 'clarinet', 'violin', 'cello'], COL = ['#E0529C', '#12B58C', '#E08A00', '#6B4FD8'];
      let voices = 2, ctrls = [], timer = null, maxVoices = 0;
      const box = h('div', { class: 'stage' }); ctx.root.append(box);
      box.append(ctx.sayPrompt('In a round, every voice sings the same tune but starts later. Choose how many voices and press play.'));
      const lanes = h('div', null);
      const bars = [];
      for (let v = 0; v < 4; v++) {
        const lane = h('div', { style: { position: 'relative', height: '26px', background: '#f1edf9', borderRadius: '8px', margin: '6px 0' } });
        const total = LEN + OFFS[3];
        const seg = h('div', { style: { position: 'absolute', left: (OFFS[v] / total * 100) + '%', width: (LEN / total * 100) + '%', top: 0, bottom: 0, background: COL[v], borderRadius: '8px', opacity: v < voices ? 1 : .15 } }, h('span', { style: { color: '#fff', fontSize: '.75rem', fontWeight: 800, padding: '4px 8px', display: 'block' } }, 'Voice ' + (v + 1) + ' · ' + INS[v]));
        lane.append(seg); lanes.append(lane); bars.push(seg);
      }
      const head = h('div', { style: { position: 'absolute', top: 0, bottom: 0, width: '3px', background: '#2B1B4D', left: 0 } });
      const lw = h('div', { style: { position: 'relative' } }, lanes, head);
      const pick = h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } }, [1, 2, 3, 4].map(n => h('button', { class: 'chip btnlike' + (n === voices ? ' on' : ''), onclick: e => { voices = n; pick.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); bars.forEach((b, i) => { b.style.opacity = i < voices ? 1 : .15; }); } }, n + (n === 1 ? ' voice' : ' voices'))));
      const play = h('button', { class: 'btn mint' }, '▶ Play the round');
      function stop() { ctrls.forEach(c => c.stop()); ctrls = []; clearInterval(timer); play.textContent = '▶ Play the round'; head.style.left = '0%'; }
      play.onclick = () => {
        if (ctrls.length) return stop();
        maxVoices = Math.max(maxVoices, voices);
        for (let v = 0; v < voices; v++) {
          const seq = (OFFS[v] ? [[null, OFFS[v]]] : []).concat(mel.map(e => (v === 3 && e[0]) ? [MU.nameOf(MU.midi(e[0]) - 12 < 40 ? MU.midi(e[0]) : MU.midi(e[0]) - 12), e[1]] : e));
          ctrls.push(MU.play(seq, { tempo: 112, inst: INS[v], noteVol: .24, delay: .12 }));
        }
        play.textContent = '■ Stop'; const t0 = performance.now(), total = (LEN + OFFS[voices - 1]) * 60 / 112 * 1000;
        timer = setInterval(() => { const p = (performance.now() - t0) / total; head.style.left = (p * (LEN + OFFS[voices - 1]) / (LEN + OFFS[3]) * 100) + '%'; if (p >= 1.02) stop(); }, 100);
      };
      box.append(lw, pick, h('div', { class: 'center mt12' }, play), h('p', { class: 'small muted center mt12' }, 'Try 1, 2, 3 and 4 voices. Notice how the music gets thicker (texture) as more voices join.'));
      box.append(h('button', { class: 'btn navy wide mt16', onclick: () => { if (maxVoices < 3) return MU.toast('Play it with at least 3 voices first'); stop(); ctx.finish(maxVoices >= 4 ? 3 : 2, 3, 'You layered a round with ' + maxVoices + ' voices.'); } }, "I'm done ✔"));
      MU.onLeave(stop);
    }
  });
})();
