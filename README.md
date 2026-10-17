# Music Adventure

Music appreciation and study for the Siler family school. A sibling of Math, Words and Electronics Adventure.

- Vanilla JS PWA, no build step. Open `index.html` through any static server.
- Nine movements (beat, melody, reading, expression, instruments, form, eras, stories, folk/Irish), 31 labs, 10 games, a 56-piece listening shelf and a parent area.
- All sounds are synthesised in the browser (Web Audio). Real recordings are linked via search, not bundled.
- Shares the family code system and Firebase project with the other apps (doc `families/{CODE}_mu`).
- Deploys to music.jacobsiler.com via GitHub Pages (`push.cmd`).

Firestore rules must allow `families/{code}_mu` just like `_ea`.
