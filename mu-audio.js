/* Music Adventure - audio engine. Everything is synthesised with the Web Audio API, so the app works offline and
 * needs no sample files. Instruments are approximations: the Listen shelf points to real recordings. */
(function () {
  'use strict';
  const MU = window.MU = window.MU || {};
  let ctx = null, master = null, comp = null, noiseBuf = null;

  MU.ac = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.85;
      comp = ctx.createDynamicsCompressor();
      MU.analyser = ctx.createAnalyser(); MU.analyser.fftSize = 1024;
      master.connect(comp); comp.connect(MU.analyser); MU.analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  MU.master = () => { MU.ac(); return master; };
  MU.now = () => MU.ac().currentTime;

  /* ---------- note maths ---------- */
  const LET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  MU.NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  MU.midi = function (n) {
    if (typeof n === 'number') return n;
    const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 60;
    return 12 * (Number(m[3]) + 1) + LET[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };
  MU.freq = n => 440 * Math.pow(2, (MU.midi(n) - 69) / 12);
  MU.nameOf = m => MU.NAMES[m % 12] + (Math.floor(m / 12) - 1);

  function noise() {
    const c = MU.ac();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.5), c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  MU.noiseBuffer = noise;

  /* ---------- building blocks ---------- */
  function adsr(g, t, a, hold, r, v) {
    hold = Math.max(0.02, hold);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.setValueAtTime(v, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
    return t + a + hold + r + 0.05;
  }
  function osc(c, type, f, t, end, dest, gain) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    if (gain != null) { const g = c.createGain(); g.gain.value = gain; o.connect(g); g.connect(dest); } else o.connect(dest);
    o.start(t); o.stop(end); return o;
  }
  function vibrato(c, o, t, end, rate, cents, delay) {
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(cents, t + (delay || 0.2));
    l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(end);
  }
  function bowed(c, out, f, t, d, v, o) {
    const g = c.createGain(); g.connect(out);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(f * o.bright, 6000); lp.Q.value = 0.7; lp.connect(g);
    const end = adsr(g, t, o.a, d - o.a * 0.3, o.r, v);
    const s = osc(c, 'sawtooth', f, t, end, lp); vibrato(c, s, t, end, o.vr, o.vc, 0.25);
    const s2 = osc(c, 'sawtooth', f * 1.003, t, end, lp, 0.6);
  }
  function reed(c, out, f, t, d, v, type, bright, a) {
    const g = c.createGain(); g.connect(out);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(f * bright, 5000); lp.connect(g);
    const end = adsr(g, t, a, d - a * 0.3, 0.09, v);
    const o = osc(c, type, f, t, end, lp); vibrato(c, o, t, end, 5, 5, 0.3);
  }

  const INST = {
    piano(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out);
      const life = Math.min(2.4, Math.max(0.9, d * 1.3 + 0.5));
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(v * 0.35, t + Math.min(0.4, life * 0.4));
      g.gain.exponentialRampToValueAtTime(0.0001, t + life);
      const end = t + life + 0.05;
      osc(c, 'triangle', f, t, end, g); osc(c, 'sine', f * 2, t, end, g, 0.3); osc(c, 'sine', f * 3, t, end, g, 0.08);
    },
    flute(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.07, d - 0.05, 0.1, v * 1.1);
      const o = osc(c, 'sine', f, t, end, g); osc(c, 'sine', f * 2, t, end, g, 0.12); vibrato(c, o, t, end, 5, 6, 0.3);
    },
    whistle(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.05, d - 0.04, 0.09, v);
      const o = osc(c, 'sine', f, t, end, g); osc(c, 'sine', f * 2, t, end, g, 0.05); vibrato(c, o, t, end, 6, 3, 0.4);
    },
    violin(c, out, f, t, d, v) { bowed(c, out, f, t, d, v * 0.7, { a: 0.09, r: 0.12, bright: 5, vr: 5.5, vc: 12 }); },
    fiddle(c, out, f, t, d, v) { bowed(c, out, f, t, d, v * 0.7, { a: 0.04, r: 0.08, bright: 7, vr: 5, vc: 7 }); },
    cello(c, out, f, t, d, v) { bowed(c, out, f, t, d, v * 0.8, { a: 0.12, r: 0.15, bright: 3.5, vr: 5, vc: 9 }); },
    bass(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.03, d - 0.02, 0.15, v * 1.2);
      osc(c, 'triangle', f, t, end, g); osc(c, 'sine', f * 2, t, end, g, 0.25);
    },
    trumpet(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2; lp.connect(g);
      lp.frequency.setValueAtTime(f * 2, t); lp.frequency.linearRampToValueAtTime(Math.min(f * 7, 6500), t + 0.09);
      const end = adsr(g, t, 0.04, d - 0.03, 0.08, v * 0.6);
      osc(c, 'sawtooth', f, t, end, lp);
    },
    horn(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(f * 3, 2400); lp.connect(g);
      const end = adsr(g, t, 0.09, d - 0.06, 0.14, v * 0.9);
      osc(c, 'sawtooth', f, t, end, lp);
    },
    clarinet(c, out, f, t, d, v) { reed(c, out, f, t, d, v * 0.55, 'square', 5, 0.05); },
    oboe(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out);
      const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1150; pk.Q.value = 2.5; pk.gain.value = 10; pk.connect(g);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600; lp.connect(pk);
      const end = adsr(g, t, 0.05, d - 0.03, 0.09, v * 0.7);
      const o = osc(c, 'sawtooth', f, t, end, lp); vibrato(c, o, t, end, 5.2, 6, 0.3);
    },
    organ(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.02, d - 0.01, 0.08, v * 0.8);
      [1, 2, 3, 4].forEach((m, i) => osc(c, 'sine', f * m, t, end, g, [1, 0.5, 0.33, 0.25][i]));
    },
    accordion(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(f * 4, 3500); lp.connect(g);
      const end = adsr(g, t, 0.03, d - 0.02, 0.07, v * 0.5);
      const a = osc(c, 'sawtooth', f, t, end, lp); a.detune.value = -7; const b = osc(c, 'sawtooth', f, t, end, lp); b.detune.value = 7;
    },
    harp(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      osc(c, 'triangle', f, t, t + 1.4, g); osc(c, 'sine', f * 2, t, t + 1.4, g, 0.25);
    },
    pluck(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc(c, 'sawtooth', f, t, t + 0.55, g, 0.5);
    },
    xylophone(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 1.1, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc(c, 'sine', f, t, t + 0.4, g); osc(c, 'sine', f * 3, t, t + 0.4, g, 0.4);
    },
    glock(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.9, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
      osc(c, 'sine', f, t, t + 1.05, g); osc(c, 'sine', f * 2.76, t, t + 1.05, g, 0.25);
    },
    bell(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
      [[1, 1], [2.76, 0.5], [5.4, 0.25]].forEach(p => osc(c, 'sine', f * p[0], t, t + 2.05, g, p[1]));
    },
    synth(c, out, f, t, d, v) {
      const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.01, d - 0.01, 0.06, v * 0.6); osc(c, 'square', f, t, end, g, 0.5);
    },
    sine(c, out, f, t, d, v) { const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.01, d - 0.01, 0.06, v); osc(c, 'sine', f, t, end, g); },
    triangle(c, out, f, t, d, v) { const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.01, d - 0.01, 0.06, v); osc(c, 'triangle', f, t, end, g); },
    square(c, out, f, t, d, v) { const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.01, d - 0.01, 0.06, v * 0.5); osc(c, 'square', f, t, end, g); },
    saw(c, out, f, t, d, v) { const g = c.createGain(); g.connect(out); const end = adsr(g, t, 0.01, d - 0.01, 0.06, v * 0.5); osc(c, 'sawtooth', f, t, end, g); }
  };
  MU.INSTRUMENTS = Object.keys(INST);

  function nz(c, out, t, dur, type, freq, q, v) {
    const s = c.createBufferSource(); s.buffer = noise();
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q || 0.7;
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function sweep(c, out, t, f0, f1, dur, v, type) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  const DRUM = {
    kick(c, o, t, v) { sweep(c, o, t, 150, 42, 0.35, v * 1.6); },
    snare(c, o, t, v) { nz(c, o, t, 0.18, 'bandpass', 1800, 0.6, v * 1.1); sweep(c, o, t, 220, 160, 0.1, v * 0.6, 'triangle'); },
    hat(c, o, t, v) { nz(c, o, t, 0.05, 'highpass', 7500, 0.7, v * 0.5); },
    ohat(c, o, t, v) { nz(c, o, t, 0.28, 'highpass', 7000, 0.7, v * 0.45); },
    tom(c, o, t, v) { sweep(c, o, t, 220, 100, 0.32, v * 1.2); },
    timp(c, o, t, v) { sweep(c, o, t, 118, 92, 1.0, v * 1.5); nz(c, o, t, 0.05, 'lowpass', 400, 0.7, v * 0.5); },
    wood(c, o, t, v) { sweep(c, o, t, 1100, 900, 0.05, v * 0.9, 'square'); },
    click(c, o, t, v) { sweep(c, o, t, 1000, 900, 0.05, v * 0.5, 'sine'); },
    accent(c, o, t, v) { sweep(c, o, t, 1600, 1400, 0.06, v * 0.6, 'sine'); },
    cymbal(c, o, t, v) { nz(c, o, t, 1.3, 'highpass', 5200, 0.7, v * 0.5); },
    triangle(c, o, t, v) { sweep(c, o, t, 3100, 3050, 1.0, v * 0.25); sweep(c, o, t, 7400, 7300, 0.8, v * 0.12); },
    bodhran(c, o, t, v) { sweep(c, o, t, 140, 85, 0.28, v * 1.4); nz(c, o, t, 0.04, 'lowpass', 900, 0.7, v * 0.6); },
    clap(c, o, t, v) { [0, 0.012, 0.026].forEach(x => nz(c, o, t + x, 0.06, 'bandpass', 1300, 1.2, v * 0.7)); },
    tamb(c, o, t, v) { nz(c, o, t, 0.09, 'highpass', 5500, 0.9, v * 0.5); sweep(c, o, t, 4200, 4000, 0.08, v * 0.1); }
  };
  MU.DRUMS = Object.keys(DRUM);

  /* ---------- one-shot playback ---------- */
  MU.note = function (n, dur, o) {
    o = o || {};
    const c = MU.ac(); const t = c.currentTime + (o.when || 0) + 0.005;
    const f = MU.freq(n); const fn = INST[o.inst || 'piano'] || INST.piano;
    fn(c, o.out || master, f, t, dur == null ? 0.5 : Math.max(0.05, dur), o.vol == null ? 0.22 : o.vol);
  };
  MU.drum = function (kind, o) {
    o = o || {};
    const c = MU.ac(); const t = c.currentTime + (o.when || 0) + 0.003;
    (DRUM[kind] || DRUM.click)(c, o.out || master, t, o.vol == null ? 0.5 : o.vol);
  };
  MU.chord = function (notes, dur, o) { notes.forEach(n => MU.note(n, dur, o)); };

  /* ---------- sequence player ----------
   * seq: [[note | [notes] | '!drum' | null(rest), beats, {inst, vol}?], ...]   tempo in BPM (quarter note = 1 beat)
   * returns a controller { stop(), seconds, done: Promise } */
  MU.active = new Set();
  MU.play = function (seq, o) {
    o = o || {};
    const c = MU.ac(); const spb = 60 / (o.tempo || 100);
    const bus = c.createGain(); bus.gain.value = o.vol == null ? 1 : o.vol; bus.connect(master);
    let t = c.currentTime + (o.delay == null ? 0.06 : o.delay); const t0 = t; const timers = []; let stopped = false;
    seq.forEach((e, idx) => {
      const n = e[0], beats = e[1], ev = e[2] || {}; const durS = beats * spb;
      const inst = ev.inst || o.inst || 'piano', vol = ev.vol == null ? (o.noteVol == null ? 0.22 : o.noteVol) : ev.vol;
      if (n != null) {
        (Array.isArray(n) ? n : [n]).forEach(x => {
          if (typeof x === 'string' && x[0] === '!') (DRUM[x.slice(1)] || DRUM.click)(c, bus, t, vol * 2.2);
          else (INST[inst] || INST.piano)(c, bus, MU.freq(x), t, Math.max(0.06, durS * (o.legato || 0.93)), vol);
        });
      }
      if (o.onNote) { const ms = Math.max(0, (t - c.currentTime) * 1000); timers.push(setTimeout(() => { if (!stopped) o.onNote(idx, n, e); }, ms)); }
      t += durS;
    });
    const total = t - t0;
    const ctrl = {
      seconds: total, startTime: t0, stopped: false,
      setVol(v) { try { bus.gain.setTargetAtTime(v, c.currentTime, 0.03); } catch (x) { } },
      stop() { if (stopped) return; stopped = true; ctrl.stopped = true; timers.forEach(clearTimeout); const now = c.currentTime; try { bus.gain.cancelScheduledValues(now); bus.gain.setTargetAtTime(0, now, 0.025); } catch (x) { } setTimeout(() => { try { bus.disconnect(); } catch (x) { } }, 400); MU.active.delete(ctrl); }
    };
    ctrl.done = new Promise(res => { timers.push(setTimeout(() => { MU.active.delete(ctrl); res(); }, (total + (o.delay == null ? 0.06 : o.delay)) * 1000 + 40)); });
    MU.active.add(ctrl);
    return ctrl;
  };
  MU.stopAll = function () { Array.from(MU.active).forEach(x => x.stop()); };

  /* ---------- lookahead step clock (metronomes, sequencers) ----------
   * MU.clock({bpm, stepsPerBeat, steps, onStep(step, when, secondsFromNow)}) -> {start, stop, setBpm, running} */
  MU.clock = function (opts) {
    const c = MU.ac(); let bpm = opts.bpm || 100, spb = opts.stepsPerBeat || 1, steps = opts.steps || 4;
    let step = 0, next = 0, id = null, running = false;
    const stepDur = () => 60 / bpm / spb;
    function tick() {
      while (next < c.currentTime + 0.14) {
        const when = next, s = step;
        opts.onStep && opts.onStep(s, when, Math.max(0, when - c.currentTime));
        next += stepDur(); step = (step + 1) % steps;
        if (opts.once && step === 0) { stop(); opts.onEnd && setTimeout(opts.onEnd, Math.max(0, (next - c.currentTime) * 1000)); return; }
      }
    }
    function start() { if (running) return; running = true; step = 0; next = c.currentTime + 0.08; tick(); id = setInterval(tick, 25); }
    function stop() { running = false; clearInterval(id); }
    const api = { start, stop, setBpm: b => { bpm = b; }, get running() { return running; }, get bpm() { return bpm; }, stepDur };
    MU.onLeave && MU.onLeave(stop);
    return api;
  };
  MU.nextBeatDelay = () => 0;

  /* ---------- sfx (UI feedback; D.sound in core can mute these) ---------- */
  MU.sfxRaw = {
    ok() { MU.note('C5', .14, { inst: 'glock' }); MU.note('E5', .14, { inst: 'glock', when: .1 }); MU.note('G5', .3, { inst: 'glock', when: .2 }); },
    bad() { MU.note('E3', .25, { inst: 'saw', vol: .1 }); MU.note('Eb3', .3, { inst: 'saw', vol: .1, when: .14 }); },
    click() { MU.drum('wood', { vol: .25 }); },
    win() { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => MU.note(n, .22, { inst: 'glock', when: i * .11 })); },
    star() { MU.note('B5', .12, { inst: 'glock' }); MU.note('E6', .25, { inst: 'glock', when: .09 }); }
  };
})();
