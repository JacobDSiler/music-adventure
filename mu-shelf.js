/* Music Adventure - listening shelf, piece pages and composer pages. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const MOODS = ['😊 Happy', '😌 Calm', '😮 Surprised', '😴 Sleepy', '⚡ Excited', '🌧️ Gloomy', '🦁 Strong', '✨ Magical'];
  const eraOf = id => MU.era(id) || { name: id, e: '🎵', color: '#6B4FD8', span: '' };

  function pieceRow(p) {
    const heard = !!(MU.PR().listened || {})[p.id];
    return h('button', { class: 'piece' + (heard ? ' heard' : ''), onclick: () => MU.go('/piece/' + p.id) },
      h('span', { class: 'em' }, heard ? '✅' : '🎧'),
      h('span', { style: { flex: 1 } }, h('b', null, p.title), h('span', { class: 'd' }, p.composer + ' · ' + p.year), h('span', { class: 'd' }, p.hook)));
  }

  MU.screens.shelf = function (parts, qs) {
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎧 Listening Shelf', '/', MU.starPill()));
    const tag = qs.get('tag') || '', tab = qs.get('tab') || 'pieces';
    const heard = MU.listenedCount(), total = MU.pieces.length;
    wrap.append(h('p', { class: 'muted' }, 'You have heard ' + heard + ' of ' + total + ' pieces. Pick one, play a real recording, then tell us what you noticed.'));
    wrap.append(h('div', { class: 'tabs' },
      [['pieces', '🎧 Pieces'], ['composers', '🎩 Composers']].map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => MU.go('/shelf?tab=' + k) }, l))));
    if (tab === 'composers') {
      MU.ERAS.forEach(e => {
        const cs = MU.COMPOSERS.filter(c => c.era === e.id).sort((a, b) => a.b - b.b); if (!cs.length) return;
        wrap.append(h('div', { class: 'era', style: { background: e.color } }, h('span', null, e.e + ' ' + e.name), h('small', null, e.span)));
        const tl = h('div', { class: 'tl' });
        cs.forEach(c => tl.append(h('button', { class: 'tlitem', style: { '--c': e.color, width: '100%', textAlign: 'left' }, onclick: () => MU.go('/composer/' + c.id) },
          h('span', { class: 'em' }, '🎩'), h('span', { style: { flex: 1 } }, h('b', null, c.n), h('span', { class: 'd' }, c.b + '–' + c.d + ' · ' + c.from + ' · ' + c.did)))));
        wrap.append(tl);
      });
      return wrap;
    }
    wrap.append(h('div', { class: 'filters' }, [{ id: '', e: '🌈', name: 'All' }].concat(MU.THEMES).map(t => h('button', { class: tag === t.id ? 'on' : '', onclick: () => MU.go('/shelf' + (t.id ? '?tag=' + t.id : '')) }, t.e + ' ' + t.name))));
    const list = tag ? MU.piecesBy(tag) : MU.pieces.slice();
    if (!list.length) wrap.append(h('p', { class: 'muted' }, 'Nothing here yet.'));
    if (tag) { list.forEach(p => wrap.append(h('div', { class: 'mt8' }, pieceRow(p)))); return wrap; }
    MU.ERAS.forEach(e => {
      const ps = list.filter(p => p.era === e.id); if (!ps.length) return;
      wrap.append(h('div', { class: 'era', style: { background: e.color } }, h('span', null, e.e + ' ' + e.name), h('small', null, e.span)));
      ps.forEach(p => wrap.append(h('div', { class: 'mt8' }, pieceRow(p))));
    });
    return wrap;
  };

  MU.screens.piece = function (parts) {
    const p = MU.piece(parts[1]); if (!p) return h('p', null, 'Piece not found.');
    const e = eraOf(p.era), c = p.cid ? MU.composer(p.cid) : null;
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎧 ' + p.title, '/shelf', MU.starPill()));
    wrap.append(h('div', { class: 'card', style: { borderTop: '6px solid ' + e.color } },
      h('h2', null, p.title),
      h('p', { class: 'muted' }, (c ? '' : '') + p.composer + ' · ' + p.year),
      h('span', { class: 'chip', style: { background: e.color, color: '#fff' } }, e.e + ' ' + e.name),
      h('p', { class: 'mt12' }, p.hook, ' ', MU.sayBtn(p.hook))));
    wrap.append(h('div', { class: 'card' }, h('h3', null, '👂 Listen for…'), h('ul', { class: 'mt8', style: { paddingLeft: '20px' } }, p.listen.map(l => h('li', { style: { margin: '6px 0' } }, l)))));
    const row = h('div', { class: 'card center' });
    row.append(h('p', { class: 'small muted' }, 'Find a recording to listen to with a grown-up. Sound quality and performers vary.'));
    row.append(MU.ytLink(p.q, '▶ Find a recording'));
    if (p.melody && MU.MEL[p.melody]) row.append(h('div', { class: 'mt12' }, MU.hearBtn('Hear the main tune (our synth)', () => MU.playMel(p.melody, {}))));
    wrap.append(row);
    const done = !!(MU.PR().listened || {})[p.id];
    const mbox = h('div', { class: 'wrapx' }); let mood = ((MU.PR().listened || {})[p.id] || {}).mood || '';
    MOODS.forEach(m => { const b = h('button', { class: 'chip btnlike' + (m === mood ? ' on' : '') }, m); b.onclick = () => { mood = m; mbox.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); }; mbox.append(b); });
    const heardBtn = h('button', { class: 'btn mint wide mt12' }, done ? '✅ Heard (tap to save mood)' : "✔ I've heard it!");
    heardBtn.onclick = () => { const first = !(MU.PR().listened || {})[p.id]; MU.markListened(p.id, mood ? { mood } : {}); MU.sfx.ok(); if (first) MU.confetti(); MU.toast(first ? 'Added to your heard list!' : 'Saved'); heardBtn.textContent = '✅ Heard (tap to save mood)'; };
    wrap.append(h('div', { class: 'card' }, h('h3', null, 'How did it feel?'), h('div', { class: 'mt8' }, mbox), heardBtn,
      h('button', { class: 'btn ghost wide mt8', onclick: () => MU.go('/journal/new?piece=' + p.id) }, '📓 Write in my journal')));
    if (c) wrap.append(h('button', { class: 'labcard', onclick: () => MU.go('/composer/' + c.id) }, h('span', { class: 'em' }, '🎩'), h('span', { style: { flex: 1 } }, h('b', null, 'About ' + c.n), h('span', { class: 'd' }, c.b + '–' + c.d + ' · ' + c.from))));
    return wrap;
  };

  MU.screens.composer = function (parts) {
    const c = MU.composer(parts[1]); if (!c) return h('p', null, 'Composer not found.');
    const e = eraOf(c.era), ps = MU.pieces.filter(p => p.cid === c.id);
    const wrap = h('div', null);
    wrap.append(MU.topbar('🎩 ' + c.n, '/shelf?tab=composers', MU.starPill()));
    wrap.append(h('div', { class: 'card', style: { borderTop: '6px solid ' + e.color } },
      h('h2', null, c.n), h('p', { class: 'muted' }, c.b + '–' + c.d + ' · ' + c.from + ' · ' + c.did), h('span', { class: 'chip', style: { background: e.color, color: '#fff' } }, e.e + ' ' + e.name + ' era'),
      h('p', { class: 'mt12' }, c.fact, ' ', MU.sayBtn(c.fact)),
      c.play && MU.MEL[c.play] ? h('div', { class: 'mt12' }, MU.hearBtn('Hear a tune', () => MU.playMel(c.play, {}))) : null,
      h('p', { class: 'small muted mt8' }, 'Lived for about ' + (c.d - c.b) + ' years.')));
    if (ps.length) { wrap.append(h('h3', { class: 'mt16' }, 'Listen to…')); ps.forEach(p => wrap.append(h('div', { class: 'mt8' }, pieceRow(p)))); }
    wrap.append(h('div', { class: 'center mt16' }, MU.ytLink(c.n + ' music for children', '▶ Find music by ' + c.n.split(' ').pop())));
    return wrap;
  };
})();
