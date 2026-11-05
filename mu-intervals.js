/* Music Adventure - Interval Detective: see, hear, count and name the distance between two notes. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SIZE = { 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: 'octave' };
  // natural-note pairs only: key = letter distance : semitones
  const QUAL = { '2:1': 'Minor 2nd', '2:2': 'Major 2nd', '3:3': 'Minor 3rd', '3:4': 'Major 3rd', '4:5': 'Perfect 4th', '5:7': 'Perfect 5th', '6:8': 'Minor 6th', '6:9': 'Major 6th', '7:10': 'Minor 7th', '7:11': 'Major 7th', '8:12': 'Octave' };
  const TIP = {
    'Minor 2nd': 'The two notes of the Jaws theme sound like a minor 2nd.', 'Major 2nd': 'The first two different notes of "Happy Birthday" make a major 2nd.',
    'Minor 3rd': 'The start of "Greensleeves" climbs a minor 3rd.', 'Major 3rd': 'The start of "When the Saints Go Marching In" climbs a major 3rd.',
    'Perfect 4th': '"Here Comes the Bride" starts with a perfect 4th.', 'Perfect 5th': '"Twinkle, Twinkle, Little Star" starts with a perfect 5th.',
    'Major 6th': '"My Bonnie Lies Over the Ocean" starts with a major 6th.', 'Octave': '"Somewhere Over the Rainbow" starts with an octave leap.'
  };
  const TIPSIZE = { '2nd': 'A 2nd is a step to the very next letter.', '3rd': 'A 3rd skips one letter: C to E.', '4th': 'A 4th is "Here Comes the Bride".', '5th': 'A 5th is the start of "Twinkle, Twinkle".', '6th': 'A 6th is a big, warm leap.', '7th': 'A 7th is almost an octave. It wants to go home!', 'octave': 'An octave is the same letter, higher or lower.' };

  function pair(lvl, dirs) {
    const maxD = lvl === 1 ? 5 : 8, whites = MU.whiteRange('C4', lvl === 1 ? 'C5' : 'C6');
    for (let t = 0; t < 60; t++) {
      const a = MU.pick(whites), sa = MU.stepOf(a), d = MU.rand(maxD - 1) + 2, up = dirs ? Math.random() < .6 : true;
      const sb = up ? sa + d - 1 : sa - (d - 1), b = MU.nameOfStep(sb);
      if (MU.midi(b) < MU.midi('C4') || MU.midi(b) > MU.midi(lvl === 1 ? 'C5' : 'C6')) continue;
      const lo = Math.min(sa, sb), hi = Math.max(sa, sb), semi = Math.abs(MU.midi(MU.nameOfStep(hi)) - MU.midi(MU.nameOfStep(lo)));
      const q = QUAL[d + ':' + semi]; if (!q) continue;
      return { a, b, d, up, q, size: SIZE[d] };
    }
    return { a: 'C4', b: 'G4', d: 5, up: true, q: 'Perfect 5th', size: '5th' };
  }
  const hearPair = (p, together) => () => { if (together) { MU.chord([p.a, p.b], 1.4, { inst: 'piano', vol: .26 }); } else MU.play([[p.a, 1], [p.b, 2]], { tempo: 80, inst: 'piano', noteVol: .28 }); };

  MU.labs.intervals = {
    unit: 2, emoji: '📏', title: 'Interval Detective', blurb: 'Count, see and hear the distance between two notes',
    run(ctx) {
      const lvl = ctx.lvl, box = h('div', { class: 'stage' }); ctx.root.append(box);
      /* ---------- phase 1: explorer ---------- */
      function explorer() {
        box.innerHTML = '';
        box.append(ctx.sayPrompt('An interval is the distance between two notes. Tap a low key, then another key, and count the letters (include both ends!).'));
        const out = h('div', { class: 'card flat center mt12' }, h('span', { class: 'muted' }, 'Tap two white keys to see the interval.'));
        let first = null;
        const kb = MU.keyboard({ from: 'C4', to: lvl === 1 ? 'C5' : 'C6', labels: 'names', height: 130, onPlay: nm => {
          if (/#/.test(nm)) { out.innerHTML = ''; out.append(h('span', { class: 'muted' }, 'Black keys make sharps. Try white keys for counting.')); return; }
          if (!first) { first = nm; kb.clear(); kb.mark(nm, 'next'); out.innerHTML = ''; out.append(h('b', null, 'Start note: ' + nm.replace(/\d/, '')), h('div', { class: 'muted small' }, 'Now tap a second key.')); return; }
          const A = first, B = nm; first = null; kb.clear();
          const sa = MU.stepOf(A), sb = MU.stepOf(B), lo = Math.min(sa, sb), hi = Math.max(sa, sb), d = hi - lo + 1;
          const semi = Math.abs(MU.midi(B) - MU.midi(A)), q = QUAL[(d > 8 ? 99 : d) + ':' + semi];
          const letters = []; for (let s = lo; s <= hi; s++) letters.push(LET[s % 7]);
          out.innerHTML = '';
          if (d === 1) { out.append(h('b', null, 'Same note: a unison.'), h('div', { class: 'small muted mt8' }, 'No distance at all!')); }
          else {
            out.append(h('div', { style: { fontSize: '1.2rem', fontWeight: 800, color: '#2B1B4D' } }, letters.map((l, i) => h('span', { style: { margin: '0 4px' } }, l, h('sub', null, i + 1)))),
              h('div', { class: 'mt8' }, h('b', null, 'That is a ' + (SIZE[d] || d + 'th') + (q ? ' (' + q + ')' : '') + (sa > sb ? ', going down' : ', going up'))),
              TIP[q] ? h('div', { class: 'small muted mt8' }, '🎵 ' + TIP[q]) : (TIPSIZE[SIZE[d]] ? h('div', { class: 'small muted mt8' }, TIPSIZE[SIZE[d]]) : null));
          }
          out.append(h('div', { class: 'wrapx mt12', style: { justifyContent: 'center' } },
            h('button', { class: 'chip btnlike', onclick: () => MU.play([[A, 1], [B, 2]], { tempo: 80, inst: 'piano', noteVol: .28 }) }, '▶ One after the other'),
            h('button', { class: 'chip btnlike', onclick: () => MU.chord([A, B], 1.4, { inst: 'piano', vol: .26 }) }, '▶ Together')));
          kb.mark(A, 'next'); kb.mark(B, 'next');
        } });
        box.append(kb.el, out);
        box.append(h('div', { class: 'card flat small mt12' }, h('b', null, 'How to count: '), 'Say each letter from the first note to the last, counting the first one as 1. C D E is 3 letters, so C to E is a 3rd.'));
        box.append(h('button', { class: 'btn mint wide mt16', onclick: quiz }, 'Start the detective game →'));
      }
      /* ---------- phase 2: rounds ---------- */
      function quiz() {
        box.remove(); const n = 9;
        const names = lvl === 3;
        MU.runRounds(ctx, {
          n, cols: 2, autoplay: true,
          make(i) {
            const kind = ['staff', 'ear', 'find'][i % 3], p = pair(lvl, lvl >= 2);
            const answer = names ? p.q : p.size;
            const sizePool = lvl === 1 ? ['2nd', '3rd', '4th', '5th'] : ['2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];
            const namePool = Object.values(QUAL);
            let opts;
            if (names) {
              const sameSize = Object.values(QUAL).filter(x => x !== p.q && (x.indexOf(p.size) > -1 || (p.size === 'octave' && x === 'Octave')));
              opts = [p.q].concat(sameSize.slice(0, 1)).concat(MU.shuffle(namePool.filter(x => x !== p.q && !sameSize.includes(x))).slice(0, 3 - Math.min(1, sameSize.length)));
            } else opts = [p.size].concat(MU.shuffle(sizePool.filter(x => x !== p.size)).slice(0, 3));
            const dirTxt = p.up ? 'going up' : 'going down';
            const why = p.a.replace(/\d/, '') + ' to ' + p.b.replace(/\d/, '') + (p.up ? '' : ' (down)') + ': ' + Array.from({ length: p.d }, (x, k) => LET[(MU.stepOf(p.up ? p.a : p.b) + k) % 7]).join(' ') + ' is ' + p.d + ' letters, so it is a ' + (names ? p.q : p.size) + '.' + (names && TIP[p.q] ? ' ' + TIP[p.q] : '');
            if (kind === 'staff') {
              const st = MU.staff({ clef: 'treble', w: 300, notes: [p.a, p.b], names: ctx.lvl === 1 });
              return { prompt: 'How big is this interval?' + (names ? ' (size and quality)' : ''), visual: h('div', { class: 'center' }, MU.staffWrap(st), h('div', { class: 'small muted' }, dirTxt)), opts, a: 0, why, play: hearPair(p), hearLabel: 'Hear the two notes' };
            }
            if (kind === 'ear') return { prompt: 'Listen. How big is the jump?', opts, a: 0, why, play: hearPair(p), hearLabel: 'Hear it again' };
            // find: name the second note
            const sa = MU.stepOf(p.a), steps = p.d - 1, target = MU.nameOfStep(sa + steps), tl = target[0];
            const fo = [tl].concat(MU.shuffle(LET.filter(x => x !== tl)).slice(0, 3));
            const st = MU.staff({ clef: 'treble', w: 300, notes: [p.a], names: true });
            return { prompt: 'Which note is a ' + p.size + ' ABOVE ' + p.a.replace(/\d/, '') + '?', visual: MU.staffWrap(st), opts: fo, a: 0, why: 'Count up from ' + p.a.replace(/\d/, '') + ': ' + Array.from({ length: p.d }, (x, k) => LET[(sa + k) % 7]).join(' ') + '. The ' + p.size + ' is ' + tl + '.', after: () => MU.play([[p.a, 1], [target, 2]], { tempo: 80, inst: 'piano', noteVol: .28 }) };
          }
        });
      }
      explorer();
    }
  };
})();
