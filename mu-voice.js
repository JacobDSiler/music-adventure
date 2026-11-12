/* Music Adventure - Sing it: turn a sung or hummed melody into notes.
 * Microphone -> pitch detection (YIN) -> steps of eighth notes -> review -> added to a Studio voice.
 * Everything happens on the device; no audio is recorded to a file or sent anywhere. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h, s = MU.s;
  const PER = 8, WHITE = [0, 2, 4, 5, 7, 9, 11];
  const LO = 24, HI = 84; // C1 .. C6
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12), ftom = f => 69 + 12 * Math.log2(f / 440);

  /* ---- pitch detection (YIN). Returns {f, c} (c = confidence 0..1) or null ---- */
  MU.detectPitch = function (buf, sr) {
    const W = 1024, tMin = Math.floor(sr / 1100), tMax = Math.min(Math.floor(sr / 70), buf.length - W - 1), d = new Float32Array(tMax + 1);
    if (tMax <= tMin + 2) return null;
    for (let t = 1; t <= tMax; t++) { let sum = 0; for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + t]; sum += x * x; } d[t] = sum; }
    let run = 0; d[0] = 1; for (let t = 1; t <= tMax; t++) { run += d[t]; d[t] = run ? d[t] * t / run : 1; }
    let t = tMin; for (; t < tMax; t++) if (d[t] < 0.15) { while (t + 1 < tMax && d[t + 1] < d[t]) t++; break; }
    if (t >= tMax) { let best = tMin; for (let k = tMin; k < tMax; k++) if (d[k] < d[best]) best = k; if (d[best] > 0.3) return null; t = best; }
    let tau = t; if (t > 1 && t < tMax) { const a = d[t - 1], b = d[t], c = d[t + 1], den = a + c - 2 * b; if (den) tau = t + (a - c) / (2 * den); }
    return { f: sr / tau, c: 1 - d[t] };
  };

  /* ---- turn raw frames [{t, m}] (t in seconds from record start, m = midi float or null) into notes ---- */
  function quantize(frames, o) {
    const stepSec = 60 / o.tempo / 2, N = o.bars * PER, per = Array.from({ length: N }, () => []), tot = Array(N).fill(0);
    frames.forEach(f => { const k = Math.floor((f.t - o.lag) / stepSec); if (k < 0 || k >= N) return; tot[k]++; if (f.m != null) per[k].push(f.m); });
    let steps = per.map((a, i) => {
      if (!tot[i] || a.length < Math.max(1, tot[i] * 0.35)) return null;
      a.sort((x, y) => x - y); let m = a[Math.floor(a.length / 2)];
      if (o.snap) { let best = null; for (let r = Math.round(m) - 3; r <= Math.round(m) + 3; r++) if (WHITE.indexOf(((r % 12) + 12) % 12) > -1 && (best === null || Math.abs(r - m) < Math.abs(best - m))) best = r; return best; }
      return Math.round(m);
    });
    for (let i = 1; i < N - 1; i++) { const p = steps[i], a = steps[i - 1], b = steps[i + 1]; if (p != null && a != null && b != null && Math.abs(a - b) <= 2 && Math.abs(p - a) >= 10) steps[i] = p - 12 * Math.sign(p - a); } // lone octave slips
    steps = steps.map(m => m == null ? null : m + o.shift * 12).map(m => (m == null || m < LO || m > HI) ? null : m);
    const notes = []; let i = 0;
    while (i < N) {
      if (steps[i] == null) { i++; continue; }
      let j = i; while (j + 1 < N && steps[j + 1] === steps[i] && Math.floor((j + 1) / PER) === Math.floor(i / PER)) j++;
      let len = j - i + 1, at = i;
      if (len >= o.minLen) while (len > 0) { const take = [8, 6, 4, 3, 2, 1].find(x => x <= len); notes.push({ s: at, n: MU.nameOf(steps[i]), len: take }); at += take; len -= take; }
      i = j + 1;
    }
    return notes;
  }
  MU.voiceQuantize = quantize;

  /* ---- the dialog ---- */
  MU.voiceDialog = function (cfg) {
    // cfg: { tempo, bars (available from startBar), startBar, voice, voiceName, voiceColor, inst, lvl, onApply(notes(rel steps), startBar, bars) }
    let bars = Math.min(cfg.bars, 2), snap = cfg.lvl < 3, minLen = 1, shift = 0, nudge = 0, countIn = true, click = false, frames = [], stream = null, actx = null, timer = null, raf = null, prevClk = null;
    const box = h('div', { class: 'voicebox' }); MU.modal(box, { dismiss: false });
    const cleanup = () => { clearInterval(timer); cancelAnimationFrame(raf); timer = raf = null; if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } if (actx) { actx.close().catch(() => {}); actx = null; } };
    const close = () => { cleanup(); if (prevClk) prevClk.stop(); MU.stopAll && MU.stopAll(); MU.closeModal(); };
    const stepSec = () => 60 / cfg.tempo / 2;
    const stepName = m => MU.nameOf(m);

    function setup() {
      cleanup(); box.innerHTML = '';
      const barBtns = h('div', { class: 'wrapx', style: { justifyContent: 'center' } });
      for (let b = 1; b <= Math.min(4, cfg.bars); b++) barBtns.append(h('button', { class: 'chip btnlike' + (bars === b ? ' on' : ''), onclick: () => { bars = b; setup(); } }, b + (b === 1 ? ' bar' : ' bars')));
      const tog = (label, on, fn) => h('button', { class: 'chip btnlike' + (on ? ' on' : ''), onclick: fn }, label);
      box.append(h('div', { class: 'bigem' }, '🎤'), h('h3', null, 'Sing it!'),
        h('p', { class: 'small muted mt8' }, 'Sing or hum one note at a time (“la la la” works well). It will turn your tune into notes for the ' + cfg.voiceName + ' voice, starting at Bar ' + (cfg.startBar + 1) + '. Nothing is saved or sent: it only listens while you record.'),
        h('p', { class: 'small mt12' }, h('b', null, 'How long?')), barBtns,
        h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
          tog(snap ? '🎹 Snap to white keys (C major)' : '🎹 Snap to white keys: off', snap, () => { snap = !snap; setup(); }),
          tog(click ? '🥁 Beat while I sing' : '🥁 No beat while I sing', click, () => { click = !click; setup(); })),
        h('p', { class: 'small muted mt8' }, click ? 'Use headphones for the beat, or the microphone will hear it too.' : 'You get a 4-beat count-in first. Tip: a quiet room and headphones work best.'),
        h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: close }, 'Cancel'), h('button', { class: 'btn coral', onclick: record }, '🎤 Start')));
    }

    async function record() {
      box.innerHTML = ''; box.append(h('p', { class: 'muted' }, 'Asking to use the microphone…'));
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nomic');
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        const AC = window.AudioContext || window.webkitAudioContext; actx = new AC(); if (actx.state === 'suspended') await actx.resume();
      } catch (e) {
        cleanup(); box.innerHTML = '';
        box.append(h('div', { class: 'bigem' }, '🎤'), h('h3', null, 'No microphone'), h('p', { class: 'small muted mt8' }, e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'The microphone is switched off for this page. Allow it in the browser’s site settings (the little lock or tune icon by the address), then try again.' : 'This device did not give us a microphone. Check that one is plugged in or allowed, then try again.'),
          h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: close }, 'Close'), h('button', { class: 'btn mint', onclick: setup }, 'Try again')));
        return;
      }
      const src = actx.createMediaStreamSource(stream), an = actx.createAnalyser(); an.fftSize = 4096; src.connect(an);
      const buf = new Float32Array(an.fftSize), sr = actx.sampleRate, beat = 60 / cfg.tempo, inSec = countIn ? 4 * beat : 0, recSec = bars * PER * stepSec();
      const big = h('div', { style: { fontSize: '3rem', fontWeight: 900, minHeight: '3.6rem', color: cfg.voiceColor } }, countIn ? '…' : '🎤'), sub = h('p', { class: 'small muted' }, 'Get ready'), meter = h('div', { class: 'vmeter' }, h('i')), prog = h('div', { class: 'vprog' }, h('i'));
      const cv = h('canvas', { width: 320, height: 110, style: { width: '100%', background: '#fff', borderRadius: '12px', border: '2px solid var(--line)' } }), g = cv.getContext('2d');
      box.innerHTML = ''; box.append(h('h3', null, 'Sing it!'), big, sub, meter, cv, prog, h('div', { class: 'center mt12' }, h('button', { class: 'btn ghost', onclick: close }, 'Cancel')));
      // clicks
      const t0 = performance.now(); frames = []; const rec0 = t0 + inSec * 1000; let noise = []; let lastBeatShown = -1;
      if (countIn) for (let i = 0; i < 4; i++) MU.drum(i === 0 ? 'kick' : 'hat', { when: i * beat, vol: .7 });
      if (click) for (let i = 0; i < bars * 4; i++) MU.drum(i % 4 === 0 ? 'kick' : 'hat', { when: inSec + i * beat, vol: .5 });
      let gate = 0.012, finished = false;
      timer = setInterval(() => {
        an.getFloatTimeDomainData(buf); let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]; const rms = Math.sqrt(sum / buf.length), now = performance.now();
        meter.firstChild.style.width = Math.min(100, rms * 600) + '%';
        if (now < rec0) { noise.push(rms); return; }
        if (!gate || noise.length) { noise.sort((a, b) => a - b); const q = noise.length ? noise[Math.floor(noise.length * 0.3)] : 0; gate = Math.max(0.012, q * 3); noise = []; }
        const tt = (now - rec0) / 1000 - 0.5 * buf.length / sr; if (tt > recSec + 0.1) { if (!finished) { finished = true; clearInterval(timer); timer = null; review(); } return; }
        let m = null; if (rms > gate) { const p = MU.detectPitch(buf, sr); if (p && p.c > 0.8 && p.f > 70 && p.f < 1100) m = ftom(p.f); }
        frames.push({ t: tt, m, rms });
        big.textContent = m != null ? stepName(Math.round(m)) : '…';
      }, 30);
      const draw = () => {
        const now = performance.now(), el = (now - t0) / 1000;
        if (now < rec0) { const b = Math.min(4, Math.floor(el / beat) + 1); if (b !== lastBeatShown) { lastBeatShown = b; big.textContent = String(b); } sub.textContent = 'Count-in… then sing!'; }
        else { sub.textContent = 'Recording: Bar ' + (Math.min(bars - 1, Math.floor((now - rec0) / 1000 / (PER * stepSec()))) + 1) + ' of ' + bars; prog.firstChild.style.width = Math.min(100, (now - rec0) / 10 / recSec) + '%'; }
        g.clearRect(0, 0, 320, 110); g.strokeStyle = '#e6dff5'; g.lineWidth = 1;
        for (let k = 0; k <= bars * PER; k += PER) { const x = k / (bars * PER) * 320; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 110); g.stroke(); }
        g.fillStyle = cfg.voiceColor; frames.forEach(f => { if (f.m == null) return; const x = f.t / recSec * 320, y = 110 - Math.max(0, Math.min(1, (f.m - 36) / 48)) * 100 - 5; g.fillRect(x, y - 2, 3, 4); });
        if (timer) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }

    function review() {
      cleanup(); box.innerHTML = '';
      const opts = () => ({ tempo: cfg.tempo, bars, snap, shift, minLen, lag: 0.08 + nudge * stepSec() });
      let notes = quantize(frames, opts());
      const rollWrap = h('div'), info = h('p', { class: 'small muted' }); let playing = null;
      const drawRoll = () => {
        rollWrap.innerHTML = ''; notes = quantize(frames, opts());
        if (!notes.length) { rollWrap.append(h('p', { class: 'feedback bad' }, 'I could not hear any notes. Sing a little louder or closer to the microphone, then try again.')); info.textContent = ''; return; }
        const ms = notes.map(n => MU.midi(n.n)), lo = Math.min.apply(null, ms) - 2, hi = Math.max.apply(null, ms) + 2, W = 320, Hh = Math.max(70, (hi - lo) * 7), cw = W / (bars * PER);
        const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + Hh, style: { width: '100%', background: '#fff', borderRadius: '12px', border: '2px solid var(--line)' } });
        for (let k = 0; k <= bars; k++) svg.append(s('line', { x1: k * PER * cw, x2: k * PER * cw, y1: 0, y2: Hh, stroke: '#cfc6e6', 'stroke-width': 1.5 }));
        notes.forEach(n => { const m = MU.midi(n.n), y = (hi - m) * (Hh / (hi - lo + 1)); svg.append(s('rect', { x: n.s * cw + 1, y, width: n.len * cw - 2, height: Math.max(8, Hh / (hi - lo + 1) - 1), rx: 4, fill: cfg.voiceColor }), s('text', { x: n.s * cw + 4, y: y + 9, 'font-size': 8, 'font-weight': 800, fill: '#fff', 'font-family': 'Nunito,sans-serif' }, n.n.replace('#', '♯'))); });
        rollWrap.append(svg);
        info.textContent = notes.length + ' note' + (notes.length === 1 ? '' : 's') + ': ' + notes.map(n => n.n.replace('#', '♯')).join(' ');
      };
      const preview = () => {
        if (playing) { playing.stop(); playing = null; } if (!notes.length) return;
        playing = MU.clock({ bpm: cfg.tempo, stepsPerBeat: 2, steps: bars * PER, once: true, onEnd: () => { playing = null; }, onStep: (i, w, secs) => notes.forEach(n => { if (n.s === i) MU.note(n.n, Math.max(.15, n.len * stepSec() * .95), { when: secs, inst: cfg.inst, vol: .32 }); }) }); playing.start(); prevClk = playing;
      };
      const rerender = () => { drawRoll(); shiftLbl.textContent = shift === 0 ? 'Octave: as sung' : 'Octave: ' + (shift > 0 ? '+' : '') + shift; nudgeLbl.textContent = nudge === 0 ? 'Timing: as heard' : 'Timing: ' + (nudge > 0 ? 'later ' : 'earlier ') + Math.abs(nudge) + ' step' + (Math.abs(nudge) > 1 ? 's' : ''); };
      const shiftLbl = h('b', { class: 'small' }), nudgeLbl = h('b', { class: 'small' });
      const tog = (label, on, fn) => h('button', { class: 'chip btnlike' + (on ? ' on' : ''), onclick: fn }, label);
      const ctl = h('div', null);
      const drawCtl = () => {
        ctl.innerHTML = ''; ctl.append(
          h('div', { class: 'row mt8', style: { justifyContent: 'center', gap: '6px', flexWrap: 'wrap' } }, h('button', { class: 'chip btnlike', onclick: () => { shift = Math.max(-3, shift - 1); rerender(); } }, '⬇ Octave'), shiftLbl, h('button', { class: 'chip btnlike', onclick: () => { shift = Math.min(3, shift + 1); rerender(); } }, '⬆ Octave')),
          h('div', { class: 'row mt8', style: { justifyContent: 'center', gap: '6px', flexWrap: 'wrap' } }, h('button', { class: 'chip btnlike', onclick: () => { nudge = Math.max(-4, nudge - 1); rerender(); } }, '◀ Earlier'), nudgeLbl, h('button', { class: 'chip btnlike', onclick: () => { nudge = Math.min(4, nudge + 1); rerender(); } }, 'Later ▶')),
          h('div', { class: 'wrapx mt8', style: { justifyContent: 'center' } }, tog('🎹 Snap to white keys', snap, () => { snap = !snap; drawCtl(); rerender(); }), tog('Skip tiny blips', minLen > 1, () => { minLen = minLen > 1 ? 1 : 2; drawCtl(); rerender(); })));
      };
      box.append(h('h3', null, '🎧 Here is what I heard'), h('p', { class: 'small muted' }, 'Play it back and check it. Fix the height or timing with the buttons.'), rollWrap, info, ctl,
        h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } }, h('button', { class: 'btn mint', onclick: preview }, '▶ Play it'), h('button', { class: 'btn ghost', onclick: () => { if (playing) playing.stop(); setup(); } }, '🔁 Try again')),
        h('div', { class: 'wrapx mt16', style: { justifyContent: 'center' } }, h('button', { class: 'btn ghost', onclick: close }, 'Cancel'),
          h('button', { class: 'btn navy', onclick: () => { if (!notes.length) return MU.toast('No notes to add yet'); const out = notes.slice(); close(); cfg.onApply(out, cfg.startBar, bars); } }, '✔ Add to ' + cfg.voiceName + ' (Bar ' + (cfg.startBar + 1) + (bars > 1 ? '–' + (cfg.startBar + bars) : '') + ')')));
      drawCtl(); rerender();
    }
    setup();
  };
})();
