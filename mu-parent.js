/* Music Adventure - parent area: progress, lesson plan, listening checklist, resources, staff paper, settings. */
(function () {
  'use strict';
  const MU = window.MU, h = MU.h;
  const D = () => MU.D();
  const UNLOCK_MS = 10 * 60 * 1000;
  let tab = 'progress';

  function unlocked() {
    try {
      if (MU.fromHarbor && sessionStorage.getItem('mu_harbor_parent')) return true;
      return Date.now() - Number(sessionStorage.getItem('mu_unlock') || 0) < UNLOCK_MS;
    } catch (e) { return false; }
  }
  const unlock = () => { try { sessionStorage.setItem('mu_unlock', String(Date.now())); } catch (e) { } };

  function gate() {
    const d = D(), real = d.pin || d.famPin;
    const wrap = h('div', null, MU.topbar('🔒 Parents', '/'));
    const msg = h('div', { class: 'feedback' });
    const inp = h('input', { class: 'inp mono', type: 'password', inputmode: 'numeric', maxlength: 4, placeholder: '••••', style: { textAlign: 'center', fontSize: '1.6rem', letterSpacing: '8px', maxWidth: '220px', margin: '0 auto', display: 'block' } });
    if (!real) {
      wrap.append(h('div', { class: 'card center' }, h('div', { class: 'bigem' }, '🔑'), h('h3', null, 'Set a parent PIN'), h('p', { class: 'muted small mt8' }, 'Four digits. It keeps the lesson plans and settings for grown-ups.'), h('div', { class: 'mt12' }, inp), msg,
        h('button', { class: 'btn mint mt12', onclick: () => { if (!/^\d{4}$/.test(inp.value)) { msg.textContent = 'Please use exactly 4 digits.'; msg.className = 'feedback bad'; return; } d.pin = inp.value; MU.save(); unlock(); MU.render(); } }, 'Save PIN')));
      return wrap;
    }
    inp.addEventListener('input', () => {
      if (inp.value === d.pin || inp.value === d.famPin) { unlock(); MU.render(); }
      else if (inp.value.length === 4) { msg.textContent = 'That is not the PIN.'; msg.className = 'feedback bad'; inp.value = ''; MU.sfx.bad(); }
    });
    wrap.append(h('div', { class: 'card center' }, h('div', { class: 'bigem' }, '🔒'), h('h3', null, 'Grown-ups only'), h('p', { class: 'muted small mt8' }, 'Enter the parent PIN. If you joined a family code, the family PIN from Math Adventure also works.'), h('div', { class: 'mt12' }, inp), msg));
    setTimeout(() => inp.focus(), 50);
    return wrap;
  }

  function progressTab() {
    const d = D(), box = h('div', null);
    d.profiles.forEach(p => {
      const pr = MU.PR(p.id);
      const rows = MU.units.map(u => {
        const st = MU.unitStatus(u, p.id);
        return h('tr', null, h('td', null, u.emoji + ' ' + u.title), h('td', null, st.labsDone + '/' + st.labsTotal), h('td', null, st.quizBest == null ? '—' : st.quizBest + '%'), h('td', null, st.mDone + '/' + st.mTotal), h('td', null, st.badge ? u.badge.emoji : '·'));
      });
      const bandSel = h('select', { class: 'inp', style: { width: 'auto', padding: '6px 10px' }, onchange: e => { p.band = e.target.value; MU.save(); MU.toast('Level changed'); } },
        MU.BANDS.map(b => h('option', { value: b.id, selected: b.id === p.band }, b.name + ' (' + b.ages + ')')));
      box.append(h('div', { class: 'card' },
        h('div', { class: 'row' }, h('span', { style: { fontSize: '2.2rem' } }, p.avatar), h('div', { style: { flex: 1 } }, h('b', null, p.name), h('div', { class: 'small muted' }, '⭐ ' + MU.totalStars(p.id) + ' stars · ' + Object.keys(pr.badges).length + '/' + MU.units.length + ' badges · ' + Object.keys(pr.listened).length + '/' + MU.pieces.length + ' pieces heard')), bandSel),
        h('table', { class: 'plain mt12' }, h('thead', null, h('tr', null, ['Movement', 'Labs', 'Quiz', 'Sessions', 'Badge'].map(x => h('th', null, x)))), h('tbody', null, rows))));
    });
    if (!d.profiles.length) box.append(h('p', { class: 'muted' }, 'No explorers yet.'));
    return box;
  }

  function planTab() {
    const d = D(), box = h('div', null);
    box.append(h('p', { class: 'muted small' }, MU.units.reduce((n, u) => n + u.sessions.length, 0) + ' offline sessions, about two a week. Listen, move, make, talk. Tap a name to tick a session done.'));
    MU.units.forEach(u => {
      box.append(h('h3', { class: 'sec', style: { color: u.color } }, u.emoji + ' ' + u.title));
      box.append(h('p', { class: 'small' }, h('b', null, 'Big question: '), u.bigQuestion, h('br'), h('b', null, 'They discover: '), u.answer));
      u.sessions.forEach((m, i) => {
        const key = 'u' + u.id + 's' + i, chips = h('div', { class: 'wrapx mt8 noprint' });
        d.profiles.forEach(p => {
          const done = !!MU.PR(p.id).missions[key];
          const c = h('button', { class: 'chip btnlike', style: { background: done ? '#b9f3df' : '#eeeaff' } }, p.avatar + ' ' + p.name + (done ? ' ✔' : ''));
          c.onclick = () => { const pr = MU.PR(p.id); if (pr.missions[key]) delete pr.missions[key]; else pr.missions[key] = true; MU.save(); MU.render(); };
          chips.append(c);
        });
        box.append(h('details', { class: 'sess' }, h('summary', null, (i + 1) + '. ' + m.title),
          h('div', { class: 'in' }, h('p', { class: 'small' }, h('b', null, 'Try: '), m.kid), h('p', { class: 'small mt8' }, m.parent),
            m.parts && m.parts.length ? h('div', { class: 'parts' }, m.parts.map(x => h('span', null, x))) : null,
            m.sprout ? h('p', { class: 'small mt8' }, '🌱 ', h('b', null, 'Little ones: '), m.sprout) : null, chips)));
      });
    });
    box.append(h('button', { class: 'btn ghost mt16 noprint', onclick: () => document.querySelectorAll('details.sess').forEach(x => x.open = true) }, 'Open all'), ' ',
      h('button', { class: 'btn ghost mt16 noprint', onclick: () => { document.querySelectorAll('details.sess').forEach(x => x.open = true); window.print(); } }, '🖨 Print lesson plan'));
    return box;
  }

  function listenTab() {
    const d = D(), box = h('div', null);
    box.append(h('p', { class: 'muted small' }, 'Every piece on the shelf, with a search link for recordings. Choose performances you like; sound quality varies. Tick who has heard each piece.'));
    MU.ERAS.forEach(e => {
      const ps = MU.pieces.filter(p => p.era === e.id); if (!ps.length) return;
      box.append(h('h3', { class: 'sec', style: { color: e.color } }, e.e + ' ' + e.name));
      ps.forEach(p => {
        const who = d.profiles.map(pr => (MU.PR(pr.id).listened || {})[p.id] ? pr.avatar : '').join('');
        box.append(h('div', { class: 'card', style: { padding: '10px 14px', margin: '6px 0' } }, h('div', { class: 'row' }, h('span', { style: { flex: 1 } }, h('b', null, p.title), h('div', { class: 'small muted' }, p.composer + ' · ' + p.year)), h('span', null, who || '·'), h('a', { class: 'chip', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(p.q), target: '_blank', rel: 'noopener' }, '▶ Find'))));
      });
    });
    box.append(h('button', { class: 'btn ghost mt16 noprint', onclick: () => window.print() }, '🖨 Print checklist'));
    return box;
  }

  function resourcesTab() {
    const box = h('div', null);
    const R = [
      ['Musopen', 'https://musopen.org', 'Free public-domain recordings and sheet music.'],
      ['IMSLP (Petrucci Music Library)', 'https://imslp.org', 'Huge free library of public-domain scores.'],
      ['Internet Archive: Audio', 'https://archive.org/details/audio_music', 'Free old recordings and folk collections.'],
      ['Classics for Kids', 'https://www.classicsforkids.com', 'Free lessons, games and composer pages for children.'],
      ['Comhaltas Ceoltóirí Éireann', 'https://comhaltas.ie', 'Irish traditional music, tunes and learning resources.']
    ];
    box.append(h('p', { class: 'muted small' }, 'Links open in a new tab. Check each site yourself before sharing it with children; content and availability can change.'));
    R.forEach(([n, u, d]) => box.append(h('a', { class: 'card flat', style: { display: 'block' }, href: u, target: '_blank', rel: 'noopener' }, h('b', null, n), h('div', { class: 'small muted mt8' }, d))));
    box.append(h('div', { class: 'card' }, h('b', null, 'How the app makes sound'), h('p', { class: 'small mt8' }, 'Every instrument you hear in the labs is generated by the browser (synthesis). It is a fair sketch of each instrument, never the real thing. That is why the Listen shelf points you to real recordings.')));
    return box;
  }

  function paperTab() {
    const box = h('div', null);
    box.append(h('p', { class: 'muted small' }, 'Blank staff paper for writing melodies by hand. Choose a clef and print.'));
    let clef = 'treble', systems = 8;
    const sheet = h('div', { class: 'card staffpaper' });
    const draw = () => {
      sheet.innerHTML = '';
      for (let s = 0; s < systems; s++) {
        const svg = MU.s('svg', { viewBox: '0 0 400 56', style: { width: '100%', height: 'auto', display: 'block', marginBottom: '10px' } });
        [12, 22, 32, 42, 52].forEach(y => svg.append(MU.s('line', { x1: 2, y1: y - 6, x2: 398, y2: y - 6, stroke: '#222', 'stroke-width': 1 })));
        svg.append(MU.s('text', { x: 6, y: 40, 'font-size': 30, 'font-weight': 800, fill: '#222', 'font-family': 'Baloo 2, sans-serif' }, clef === 'treble' ? 'G' : 'F'));
        svg.append(MU.s('line', { x1: 2, y1: 6, x2: 2, y2: 46, stroke: '#222', 'stroke-width': 1.5 }), MU.s('line', { x1: 398, y1: 6, x2: 398, y2: 46, stroke: '#222', 'stroke-width': 1.5 }));
        sheet.append(svg);
      }
    };
    const pick = h('div', { class: 'wrapx noprint' }, [['treble', 'Treble clef'], ['bass', 'Bass clef']].map(([k, l]) => h('button', { class: 'chip btnlike' + (k === clef ? ' on' : ''), onclick: e => { clef = k; pick.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); } }, l)));
    draw();
    box.append(pick, sheet, h('button', { class: 'btn ghost mt12 noprint', onclick: () => window.print() }, '🖨 Print staff paper'));
    return box;
  }

  function settingsTab() {
    const d = D(), box = h('div', null);
    const sw = (label, key) => { const b = h('button', { class: 'chip btnlike' }, (d[key] ? '✅ ' : '⬜ ') + label); b.onclick = () => { d[key] = !d[key]; MU.save(); b.textContent = (d[key] ? '✅ ' : '⬜ ') + label; }; return b; };
    box.append(h('div', { class: 'card' }, h('b', null, 'Sound & reading'), h('div', { class: 'wrapx mt8' }, sw('Sound effects', 'sound'), sw('Read-aloud voice', 'tts'))));
    const msg = h('div', { class: 'feedback' });
    const code = h('input', { class: 'inp', placeholder: 'MA-AB12', maxlength: 7, value: d.fam || '', autocapitalize: 'characters', autocorrect: 'off', spellcheck: 'false', oninput: e => { e.target.value = MU.fmtFam(e.target.value); } });
    box.append(h('div', { class: 'card' }, h('b', null, '🏠 Family code'), h('p', { class: 'small muted mt8' }, d.fam ? 'Joined ' + d.fam + '. Progress syncs to the cloud.' : 'Join with the same code Math Adventure and Words Adventure use. Explorers and progress sync across devices.'), h('div', { class: 'mt8' }, code),
      h('div', { class: 'wrapx mt8' },
        h('button', { class: 'btn', onclick: async () => { msg.textContent = 'Working…'; msg.className = 'feedback'; const r = await MU.joinFamily(code.value); msg.textContent = r.msg; msg.className = 'feedback ' + (r.ok ? 'good' : 'bad'); } }, d.fam ? 'Re-join / refresh' : 'Join'),
        d.fam ? h('button', { class: 'btn ghost', onclick: async () => { msg.textContent = 'Syncing…'; const ok = await MU.syncNow(); msg.textContent = ok ? 'Synced ✔' : 'Could not sync right now.'; msg.className = 'feedback ' + (ok ? 'good' : 'bad'); } }, 'Sync now') : null,
        d.fam ? h('button', { class: 'btn ghost', onclick: () => { if (confirm('Leave this family on this device? Your progress stays saved in the cloud.')) { MU.leaveFamily(); MU.render(); } } }, 'Leave') : null), msg));
    const pin = h('input', { class: 'inp mono', maxlength: 4, inputmode: 'numeric', placeholder: 'New 4-digit PIN', style: { maxWidth: '220px' } });
    box.append(h('div', { class: 'card' }, h('b', null, '🔑 Parent PIN'), h('div', { class: 'row mt8' }, pin, h('button', { class: 'btn', onclick: () => { if (!/^\d{4}$/.test(pin.value)) return MU.toast('Use exactly 4 digits'); d.pin = pin.value; MU.save(); pin.value = ''; MU.toast('PIN updated'); } }, 'Save'))));
    const ex = h('div', { class: 'card' }, h('b', null, '🎵 Explorers'));
    d.profiles.forEach(p => ex.append(h('div', { class: 'row mt8' }, h('span', { style: { fontSize: '1.6rem' } }, p.avatar), h('span', { style: { flex: 1 } }, p.name),
      h('button', { class: 'chip btnlike', onclick: () => { if (confirm('Reset all of ' + p.name + "'s progress? This cannot be undone.")) { d.prog[p.id] = MU.emptyPR(); MU.save(); MU.render(); } } }, 'Reset progress'),
      MU.managed() ? null : h('button', { class: 'chip btnlike', onclick: () => { if (confirm('Remove ' + p.name + ' from this device?')) { d.profiles = d.profiles.filter(x => x.id !== p.id); delete d.prog[p.id]; if (d.cur === p.id) d.cur = d.profiles[0] ? d.profiles[0].id : null; MU.save(); MU.go(d.profiles.length ? '/parent' : '/welcome'); } } }, 'Remove'))));
    ex.append(h('button', { class: 'btn ghost mt12', onclick: () => MU.go('/who') }, MU.managed() ? 'Switch explorer' : '+ Add or switch explorer'));
    box.append(ex);
    box.append(h('div', { class: 'card' }, h('b', null, '💾 Backup'), h('p', { class: 'small muted mt8' }, "Save or restore this device's explorers and progress as a file."),
      h('div', { class: 'wrapx mt8' },
        h('button', { class: 'btn ghost', onclick: () => { const blob = new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'music-adventure-backup.json' }); document.body.append(a); a.click(); a.remove(); } }, 'Download backup'),
        h('label', { class: 'btn ghost' }, 'Restore backup', h('input', { type: 'file', accept: '.json', class: 'hide', onchange: e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (!j.profiles) throw 0; Object.assign(d, j); MU.save(); MU.toast('Restored'); MU.render(); } catch (x) { MU.toast('That file did not look right'); } }); } })))));
    box.append(h('p', { class: 'small muted center mt16' }, 'Music Adventure v' + MU.VERSION + ' · by Siler Technology'));
    box.append(h('button', { class: 'btn ghost wide mt12', onclick: () => { try { sessionStorage.removeItem('mu_unlock'); sessionStorage.removeItem('mu_harbor_parent'); } catch (e) { } MU.go('/'); } }, 'Lock & leave'));
    return box;
  }

  MU.screens.parent = function () {
    if (!unlocked()) return gate();
    const wrap = h('div', null, MU.topbar('Parent area', '/'));
    const body = h('div', null);
    const T = [['progress', '📊 Progress', progressTab], ['plan', '📅 Lesson plan', planTab], ['listen', '🎧 Listening', listenTab], ['paper', '📝 Staff paper', paperTab], ['resources', '🔗 Resources', resourcesTab], ['settings', '⚙️ Settings', settingsTab]];
    const tabs = h('div', { class: 'tabs mt12' });
    const draw = () => { tabs.innerHTML = ''; T.forEach(([id, label]) => tabs.append(h('button', { class: tab === id ? 'on' : '', onclick: () => { tab = id; draw(); show(); } }, label))); };
    const show = () => { body.innerHTML = ''; body.append(T.find(t => t[0] === tab)[2]()); };
    draw(); show(); wrap.append(tabs, body);
    return wrap;
  };
})();
