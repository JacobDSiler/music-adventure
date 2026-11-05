/* Music Adventure - the nine movements: story, labs, quiz, sessions, vocabulary, badge. */
(function () {
  'use strict';
  const MU = window.MU;
  const Q = (q, opts, a, why, snd) => ({ q, opts, a, why, snd: snd || null });
  const V = (w, d) => ({ w, d });
  const S = (title, kid, parent, parts, sprout) => ({ title, kid, parent, parts: parts || [], sprout: sprout || '' });
  const M = MU.MEL;
  const maj = ['C4', 'E4', 'G4'], min = ['C4', 'Eb4', 'G4'];

  MU.units = [
    /* ===================== 1 ===================== */
    {
      id: 1, title: 'Beat & Rhythm', emoji: '🥁', color: '#E0529C', tagline: 'Find the pulse, clap the pattern',
      bigQuestion: 'What makes you want to tap your foot?',
      story: 'Every song has a heartbeat called the beat. It is steady, like a clock or your footsteps. On top of the beat, music has rhythm: a pattern of long and short sounds. Beat is the "walking", rhythm is the "words".',
      answer: 'The beat is the steady pulse. Rhythm is the pattern of long and short sounds that rides on top of it. Tempo is how fast the beat goes.',
      labs: ['beat-tap', 'rhythm-grid', 'meter-feel'],
      listen: ['bolero', 'beethoven5', 'entertainer', 'blue-danube'],
      vocab: [V('beat', 'the steady pulse of music'), V('rhythm', 'a pattern of long and short sounds'), V('tempo', 'how fast or slow the beat is'), V('measure', 'one group of beats (also called a bar)'), V('meter', 'how the beats are grouped, like 2, 3 or 4 beats'), V('rest', 'a moment of silence in the music'), V('syncopation', 'accenting the "off" beats, as in ragtime and jazz')],
      sessions: [
        S('March the beat', 'Put on music with a clear beat. March around the room. Everyone keeps the SAME beat. When the music stops, freeze!', 'Choose recordings with a steady pulse (a march, a folk song, Joplin). Alternate walking the beat and clapping the rhythm of the words. Stop the music suddenly: ask the children to keep the beat silently in their feet for four counts. If they do, their inner beat is working.', ['Music player', 'Open floor'], 'Pat knees slowly to the beat while you sing a nursery rhyme.'),
        S('Kitchen band', 'Make a band with pots, wooden spoons and a shaker (rice in a jar). Leader plays a 4-beat pattern. The band echoes it back.', 'Teach "ta" (one beat) and "ti-ti" (two sounds in one beat) and a silent beat for rest (say "shh"). Write patterns on sticky notes: ta ta ti-ti ta. Reading rhythm is early reading, early fractions, and a great mental workout. Keep sounds friendly to the ears: soft spoons on upturned pots!', ['Pots', 'Spoons', 'Rice shaker'], 'Copy one big bang, one soft pat.'),
        S('Name rhythms', 'Clap the syllables in every family member\'s name and in your favourite foods. Which name has the most claps? Can you clap two names together?', 'Syllables are the easiest way to feel rhythm. Combine names into a "rhythm sentence" (Mar-co / Ma-ri-a / Mar-co) and speak it over a steady beat. Older children can notate it with note shapes: quarter notes for one-syllable names and pairs of eighth notes for two.', ['Pencil', 'Paper'], 'Clap your own name, then Mum\'s, then Dad\'s.')
      ],
      quiz: [
        Q('What is the "beat" of a song?', ['The steady pulse you can tap your foot to', 'The highest note', 'How loud it is'], 0, 'The beat is the steady pulse underneath the music.'),
        Q('Rhythm is...', ['The pattern of long and short sounds', 'A very high singing voice', 'The name of an instrument'], 0, 'Rhythm is the pattern of long and short sounds.'),
        Q('What does a rest tell you to do?', ['Be silent for a moment', 'Play louder', 'Play higher'], 0, 'A rest is a planned silence; it still takes up time.'),
        Q('How many beats are in each bar of a waltz?', ['2', '3', '4'], 1, 'A waltz is in three: ONE-two-three, ONE-two-three.'),
        Q('Which note lasts the longest?', ['Whole note', 'Half note', 'Quarter note', 'Eighth note'], 0, 'A whole note lasts four beats in 4/4.'),
        Q('How many eighth notes fit in one quarter note?', ['1', '2', '4'], 1, 'Two eighth notes (ti-ti) share the time of one quarter note (ta).'),
        Q('Tempo means...', ['How fast or slow the beat is', 'How loud the music is', 'What key it is in'], 0, 'Tempo is the speed of the beat.'),
        Q('A jig in 6/8 feels like...', ['Two groups of three: DUM-da-da DUM-da-da', 'Four even beats', 'Three even beats'], 0, 'Jigs bounce in two big beats, each divided into three.')
      ],
      badge: { emoji: '🥁', name: 'Beat Keeper', how: 'Finish all three labs and pass the quiz.', earned: 'You can find the beat and keep it steady. Every musician needs that!' }
    },
    /* ===================== 2 ===================== */
    {
      id: 2, title: 'Melody & Pitch', emoji: '🎹', color: '#6B4FD8', tagline: 'High, low, steps and leaps',
      bigQuestion: 'Why do some notes sound high and others low?',
      story: 'Pitch is how high or low a note sounds. Fast vibrations make high sounds, slow vibrations make low sounds. A melody is a line of pitches that moves up and down like a path, with steps, skips and leaps. Seven letters, A to G, name the notes, and then they start again.',
      answer: 'Pitch depends on how fast something vibrates. A melody is pitches in a row, moving by steps, skips and leaps, usually built on a scale.',
      labs: ['keyboard', 'steps-leaps', 'scale-ladder', 'pentatonic', 'intervals'],
      listen: ['ode-joy', 'hymn-joy', 'twinkle-var', 'lark'],
      vocab: [V('pitch', 'how high or low a note sounds'), V('melody', 'a line of notes that make a tune'), V('scale', 'notes in order going up or down'), V('step', 'moving to the next note'), V('leap', 'a big jump between notes'), V('octave', 'the distance from one note to the next note with the same name'), V('pentatonic', 'a five-note scale that always sounds nice'), V('solfège', 'Do, Re, Mi, Fa, Sol, La, Ti: singing names for notes')],
      sessions: [
        S('Siren voices', 'Slide your voice from low to high like a siren. Draw the sound in the air with a scarf. Then sing "Twinkle" and draw its shape.', 'Voices are the first instrument. Children match pitch gradually; use sliding "siren" sounds first, then short echoes ("sing back what I sing"). Don\'t correct harshly: model and invite. Draw melodies as up-and-down lines, then add dots for notes.', ['Scarf', 'Paper'], 'Bird voice up high, bear voice down low.'),
        S('Stair scale', 'Walk up the stairs singing Do Re Mi Fa Sol La Ti Do, one note per stair. Walk down the same way.', 'Place the "Do-Re-Mi" ladder on the wall. Add hand signs if you know them (Kodály/Curwen). Ask: which steps feel stable (Do, Mi, Sol) and which want to move (Ti wants Do)? Sing "Joy to the World" starting at the top: its first line is a downwards scale.', ['Stairs or a taped ladder on the wall'], 'Climb and step with your fingers on the keys.'),
        S('Black-key music', 'Play only the black keys, or any five tuned bells. Make up a tune. There are no wrong notes!', 'Black keys form a pentatonic scale, so anything sounds pleasant. Take turns: one plays a steady low note (drone) while another improvises. Ask for a "question phrase" and an "answer phrase". Record a favourite and play it back.', ['Piano, keyboard or bells'], 'Press any black keys and listen for a long time.')
      ],
      quiz: [
        Q('Pitch means...', ['How high or low a note sounds', 'How long a note lasts', 'How loud a note is'], 0, 'High and low is pitch.'),
        Q('On a piano, notes to the RIGHT sound...', ['Higher', 'Lower', 'The same'], 0, 'Moving right goes up in pitch.', { seq: [['C4', 1], ['E4', 1], ['G4', 1], ['C5', 1.5]], tempo: 100, inst: 'piano' }),
        Q('A melody that moves to the next note up or down is moving by...', ['Steps', 'Leaps', 'Rests'], 0, 'Neighbouring notes make a step.'),
        Q('How many different note names are in the musical alphabet?', ['7 (A to G)', '5', '12'], 0, 'A B C D E F G, then the letters start again.'),
        Q('A major scale has how many different notes before it starts again at the top?', ['7', '5', '12'], 0, 'Do Re Mi Fa Sol La Ti, and then Do again.'),
        Q('A pentatonic scale has...', ['5 notes', '7 notes', '3 notes'], 0, '"Penta" means five.'),
        Q('A leap is...', ['A big jump between notes', 'A very quiet note', 'A silent beat'], 0, 'Leaps skip over several notes.'),
        Q('Why does a short guitar string sound higher than a long one?', ['It vibrates faster', 'It is louder', 'It vibrates slower'], 0, 'Shorter strings vibrate faster, so the pitch is higher.')
      ],
      badge: { emoji: '🎹', name: 'Melody Maker', how: 'Finish all four labs and pass the quiz.', earned: 'You understand pitch, scales and melody, and you can make your own tunes.' }
    },
    /* ===================== 3 ===================== */
    {
      id: 3, title: 'Reading Music', emoji: '🎼', color: '#2F7DE1', tagline: 'Staff, clefs and note values',
      bigQuestion: 'How can paper tell you what to play?',
      story: 'Written music is a map for sound. Five lines called the staff hold the notes. A note\'s height on the staff shows its pitch, and its shape shows how long it lasts. A clef at the start tells you which notes the lines are. Treble clef is for higher notes and bass clef for lower notes.',
      answer: 'Where a note sits on the staff is its pitch. How the note looks is its length. The clef tells you which notes the lines and spaces are.',
      labs: ['staff-reader', 'staff-builder', 'note-values'],
      listen: ['cello-suite', 'canon-d', 'elise'],
      vocab: [V('staff', 'five lines and four spaces where notes live'), V('clef', 'the sign at the start of the staff that tells which notes are where'), V('treble clef', 'for higher notes; also called the G clef'), V('bass clef', 'for lower notes; also called the F clef'), V('ledger line', 'a little extra line for notes above or below the staff'), V('time signature', 'two numbers that tell how many beats are in a bar'), V('middle C', 'the C near the middle of the piano')],
      sessions: [
        S('Floor staff', 'Make a giant staff with 5 strips of tape on the floor. Children step onto the lines and spaces as notes. Say the letter names out loud.', 'Treble clef lines (bottom to top): E G B D F, "Every Good Boy Does Fine". Spaces: F A C E. Bass clef lines: G B D F A ("Good Boys Do Fine Always"), spaces A C E G ("All Cows Eat Grass"). Have children place a bean bag (note) and play the matching key.', ['Masking tape', 'Bean bags'], 'Hop from line to line, up and down.'),
        S('Note-value fractions', 'Cut a paper plate or draw a pizza. A whole is 4 beats. Cut it into halves, quarters, eighths. Clap each size.', 'Link to fraction learning: whole = 1, half = 1/2, quarter = 1/4, eighth = 1/8. Build a bar of 4/4 with paper note cards: how many ways can you fill four beats? Include rests. Check each bar adds up.', ['Paper plates', 'Scissors', 'Pen'], 'Clap one big whole note slowly, then four quick quarter notes.'),
        S('Write and play', 'Write a four-bar tune on your own staff paper (print it from the Parents tab). Then play it on piano, bells or recorder.', 'Print blank staff paper from the Parent area. Start with notes C D E G A on a treble staff and rhythm from ta, ti-ti and rests. Play the tune back, then ask the child to change one note and listen to the difference. Compare with the Staff Builder lab.', ['Staff paper', 'Pencil', 'Any instrument'], 'Stick coloured dots on the keys that match coloured dots on a card.')
      ],
      quiz: [
        Q('How many lines does a staff have?', ['5', '4', '7'], 0, 'A staff has 5 lines and 4 spaces.'),
        Q('The treble clef is also called the...', ['G clef', 'F clef', 'C clef'], 0, 'It curls around the G line.'),
        Q('The lines of the treble staff from bottom to top are...', ['E G B D F', 'F A C E', 'A B C D E'], 0, 'Every Good Boy Does Fine.'),
        Q('The spaces of the treble staff spell...', ['F A C E', 'E G B D', 'C A B E'], 0, 'F, A, C, E: FACE!'),
        Q('How many beats does a half note get in 4/4?', ['2', '1', '4'], 0, 'Whole = 4, half = 2, quarter = 1.'),
        Q('Two eighth notes equal...', ['One quarter note', 'One half note', 'One whole note'], 0, 'Eighths are half a beat each.'),
        Q('Which clef is mostly used for low notes?', ['Bass clef', 'Treble clef'], 0, 'The bass clef (F clef) is for lower notes.'),
        Q('The time signature 3/4 means...', ['3 beats in each bar, and a quarter note gets one beat', '3 notes in each song', 'The song is 3 minutes long'], 0, 'The top number counts the beats; the bottom number says which note gets one beat.')
      ],
      badge: { emoji: '🎼', name: 'Note Reader', how: 'Finish all three labs and pass the quiz.', earned: 'You can read the map of music. Every score in the world uses these same signs.' }
    },
    /* ===================== 4 ===================== */
    {
      id: 4, title: 'Loud, Soft, Fast, Slow', emoji: '🎚️', color: '#E08A00', tagline: 'Dynamics, tempo and expression',
      bigQuestion: 'How does music show feelings without words?',
      story: 'Composers use dynamics (loud and soft) and tempo (fast and slow) to show feelings. Many of the words they use are Italian: forte means loud, piano means soft, allegro means fast. A sudden change can make you jump. A gradual change, like a crescendo, builds excitement.',
      answer: 'Dynamics and tempo change the feeling of a piece. Words like forte, piano, allegro and adagio tell players how to perform.',
      labs: ['dynamics', 'tempo-ear', 'term-match'],
      listen: ['surprise', 'mountain-king', 'bolero', 'planets'],
      vocab: [V('dynamics', 'how loud or soft the music is'), V('forte (f)', 'loud'), V('piano (p)', 'soft'), V('crescendo', 'gradually louder'), V('allegro', 'fast and lively'), V('adagio', 'slow and at ease'), V('legato', 'smooth and connected'), V('staccato', 'short and detached'), V('accelerando', 'gradually faster')],
      sessions: [
        S('Statue dynamics', 'Move big when the music is loud and small when it is soft. Freeze like a statue when it stops.', 'Use Mountain King or Boléro. Ask: how did your body know it was getting louder? Introduce pp–ff cards and hold them up as the "conductor". Children can also sing "Twinkle" at pp, mf and ff, then crescendo through a whole verse.', ['Music player'], 'Tiptoe for quiet, stomp for loud.'),
        S('Tempo walk', 'Walk to a ticking beat. Start slow (Largo), get faster until you are running (Presto)!', 'Use the Tempo lab or any metronome set at 50, 70, 92, 112, 140 and 184 BPM. Connect the Italian words with feelings: Largo = heavy, Allegro = bouncing, Presto = racing. Discuss how a lullaby would feel at Presto.', ['Metronome or the Tempo lab'], 'Turtle walk and rabbit hop.'),
        S('Conduct the family', 'You are the conductor! Lead everyone singing a song. Make big arms for loud, small for soft, and speed up or slow down.', 'Teach 4-beat conducting pattern (down, left, right, up). Agree signals for crescendo (hands rise) and decrescendo (hands lower). Swap conductors. Record the performance and listen back: did the dynamics show?', ['Pencil as a baton'], 'Wave a scarf big and small.')
      ],
      quiz: [
        Q('Forte means...', ['Loud', 'Soft', 'Fast'], 0, 'Forte = loud. (Think "fort" = strong.)'),
        Q('In music, piano (p) means...', ['Soft', 'The instrument only', 'Loud'], 0, 'Pianoforte means "soft-loud": the instrument can do both!'),
        Q('A crescendo is...', ['Gradually getting louder', 'Suddenly very soft', 'Playing very fast'], 0, 'Crescendo = growing.'),
        Q('Allegro means...', ['Fast and lively', 'Slow and sad', 'Very quiet'], 0, 'Allegro is a happy, lively speed.'),
        Q('Adagio is...', ['Slow', 'Fast', 'Loud'], 0, 'Adagio = at ease: slow.'),
        Q('Staccato notes are...', ['Short and detached', 'Smooth and connected', 'Very long'], 0, 'Staccato = detached.'),
        Q('Which marking is the loudest?', ['ff', 'mf', 'p', 'pp'], 0, 'ff = fortissimo, very loud.'),
        Q('Ritardando means...', ['Gradually slower', 'Gradually louder', 'Gradually faster'], 0, 'Ritardando = holding back.')
      ],
      badge: { emoji: '🎚️', name: 'Expression Expert', how: 'Finish all three labs and pass the quiz.', earned: 'You know how composers use loud, soft, fast and slow to tell stories.' }
    },
    /* ===================== 5 ===================== */
    {
      id: 5, title: 'Instruments & the Orchestra', emoji: '🎻', color: '#0FA67F', tagline: 'Four families and how they sound',
      bigQuestion: 'What makes a violin sound different from a trumpet?',
      story: 'An orchestra has about 80 to 100 players in four families: strings, woodwinds, brass and percussion. Each makes sound in its own way and has its own timbre, the colour of the sound. The same note on a flute and a trumpet is the same pitch but a different colour.',
      answer: 'Instruments make sound in different ways (bowing, blowing, buzzing, hitting), so each has a different timbre, even on the same pitch.',
      labs: ['families', 'orchestra', 'timbre', 'sound-lab'],
      listen: ['young-person', 'peter-wolf', 'carnival', 'nutcracker'],
      vocab: [V('orchestra', 'a large group of instruments playing together'), V('strings', 'violin, viola, cello, double bass, harp'), V('woodwinds', 'flute, oboe, clarinet, bassoon'), V('brass', 'trumpet, horn, trombone, tuba'), V('percussion', 'instruments you hit, shake or scrape'), V('timbre', 'the colour or quality of a sound'), V('conductor', 'the leader who keeps the orchestra together'), V('vibrate', 'to move back and forth very fast')],
      sessions: [
        S('Instrument hunt', 'Find five things in the house that make a sound. Sort them: Do you scrape them, blow them, pluck them, or hit them?', 'Sorting by how the sound is made is how the orchestra families work. Compare a pot (percussion), a rubber band on a box (strings), a bottle (blow across the top = woodwind-like), a kazoo-like buzz with lips (brass-like).', ['Household objects'], 'Shake, bang and tap objects. Which is loud?'),
        S('Go and listen', 'Watch a real orchestra or band (on video or live). Count how many players you can see from each family.', 'Try Britten\'s Young Person\'s Guide to the Orchestra on video. Look out for local concerts, school bands, church organs or music shops where children can see and touch real instruments. Many orchestras have free family concerts.', ['A video or a concert'], 'Point to the biggest and smallest instrument.'),
        S('Make an instrument', 'Make a bottle xylophone by filling bottles with different amounts of water. Tap them, then blow across the top. Which sounds higher?', 'Connect pitch to the size of the vibrating thing. Tapping the glass: more water sounds lower. Blowing across the top: more water means a shorter column of air, so the sound is higher. Safety: no small parts for under-threes, and wash straws. Try a rubber-band "guitar" on a tub too.', ['Glass bottles', 'Water', 'Spoon'], 'Shake a sealed bottle with rice inside.')
      ],
      quiz: [
        Q('What are the four families of the orchestra?', ['Strings, woodwinds, brass, percussion', 'High, low, loud, soft', 'Piano, drums, guitar, voice'], 0, 'Strings, woodwinds, brass, percussion.'),
        Q('Which is a string instrument?', ['Cello', 'Trumpet', 'Flute'], 0, 'The cello is bowed.'),
        Q('The trumpet belongs to which family?', ['Brass', 'Woodwinds', 'Strings'], 0, 'Brass players buzz their lips into a mouthpiece.'),
        Q('The clarinet belongs to which family?', ['Woodwinds', 'Brass', 'Percussion'], 0, 'It has a reed, so it is a woodwind.'),
        Q('What is timbre?', ['The colour or quality of a sound', 'How fast the beat is', 'How high a note is'], 0, 'Timbre is what lets you tell a flute from a violin.'),
        Q('Which is the biggest string instrument?', ['Double bass', 'Violin', 'Harp'], 0, 'The double bass stands taller than a child.'),
        Q('A glockenspiel is in which family?', ['Percussion', 'Brass', 'Strings'], 0, 'You hit its metal bars with mallets.'),
        Q('How does a brass player make a sound?', ['By buzzing their lips into a mouthpiece', 'By plucking strings', 'By hitting bars'], 0, 'Buzzing lips start the vibration.')
      ],
      badge: { emoji: '🎻', name: 'Orchestra Explorer', how: 'Finish all four labs and pass the quiz.', earned: 'You can tell the four families apart and you know what timbre is.' }
    },
    /* ===================== 6 ===================== */
    {
      id: 6, title: 'Form & Texture', emoji: '🧩', color: '#D9534F', tagline: 'Patterns, rounds and mood',
      bigQuestion: 'How is a song put together?',
      story: 'Music has shape, just like a story has a beginning, middle and end. Letters name the sections: A is the first idea and B is something different. If A comes back, you have ABA. Music also has texture: one voice alone, a melody with accompaniment, or many voices singing the same tune in a round. And major and minor change the mood.',
      answer: 'Form is the plan of a piece (ABA, rondo, theme and variations). Texture is how many layers sound at once. Major sounds bright, minor sounds darker.',
      labs: ['form-detective', 'major-minor', 'round'],
      listen: ['sumer', 'canon-d', 'turca', 'twinkle-var', 'brandenburg'],
      vocab: [V('form', 'the shape or plan of a piece'), V('ABA', 'a section, a different section, then the first section again'), V('rondo', 'a main tune that keeps coming back: ABACA'), V('theme and variations', 'a tune that is changed in different ways'), V('round (canon)', 'everyone sings the same tune starting at different times'), V('texture', 'how many layers of sound there are'), V('harmony', 'notes sounding together'), V('major / minor', 'bright-sounding / darker-sounding scales')],
      sessions: [
        S('Sing a round', 'Sing Frère Jacques in two groups. Group 2 starts when group 1 gets to the second line. Try three groups!', 'Rounds are the easiest way to experience harmony. Practise the tune alone first, keep a steady beat, and give each group a strong leader. Use the Round lab to hear how the parts stack up. Try Sumer is icumen in as an older example.', ['Voices'], 'Sing it together at one speed.'),
        S('ABA moves', 'Make an A move (jump!) and a B move (spin!). Listen to a piece and do A when you hear the first tune, B when something new starts.', 'Choose short pieces: Twinkle (ABA with "Up above the world so high"), Für Elise (rondo). Ask the children to hold up A or B cards. Draw the shape of a favourite song as coloured blocks.', ['A/B cards', 'Coloured paper'], 'Clap when the tune comes back.'),
        S('Mood faces', 'Play a tune in major and in minor. Draw a face for how each one feels. Do they feel the same to everyone?', 'Use the Major/Minor lab or play on any keyboard: C-E-G (major) and C-E♭-G (minor). Notice that the mood is not always "happy vs sad". Minor can be mysterious, calm or serious. Look for minor tunes children already know (e.g. "Greensleeves" or "We Three Kings").', ['Keyboard or the Major/Minor lab'], 'Smile for the bright one, frown for the dark one.')
      ],
      quiz: [
        Q('Form in music means...', ['The shape or plan of a piece', 'How loud it is', 'What instruments play'], 0, 'Form is the plan: A, B, A and so on.'),
        Q('ABA form means...', ['A tune, something different, then the first tune again', 'Three completely new tunes', 'The same tune three times'], 0, 'The first idea returns at the end.'),
        Q('In a round, singers...', ['Start the same tune at different times', 'Sing different words and tunes', 'Take turns on one note'], 0, 'Frère Jacques is a famous round.'),
        Q('Major music often sounds...', ['Bright', 'Dark'], 0, 'Major scales often feel bright; minor often feels darker.', { seq: [[maj, 2]], tempo: 70, inst: 'piano' }),
        Q('Harmony is...', ['Notes sounding together', 'A very fast tempo', 'A silent beat'], 0, 'Harmony is notes layered together, such as in a chord.'),
        Q('A rondo is...', ['A form where the main tune keeps coming back', 'A kind of drum', 'A very slow tempo'], 0, 'A B A C A: the A tune returns.'),
        Q('Theme and variations means...', ['A tune that is changed in different ways', 'A tune that never changes', 'Two tunes at once'], 0, 'Mozart\'s Twinkle Variations is a famous example.'),
        Q('Texture is about...', ['How many layers of sound there are', 'How fast the beat is', 'Where the piece was written'], 0, 'One voice alone is thin; a full choir is thick.')
      ],
      badge: { emoji: '🧩', name: 'Pattern Detective', how: 'Finish all three labs and pass the quiz.', earned: 'You can spot the shape of music and tell major from minor.' }
    },
    /* ===================== 7 ===================== */
    {
      id: 7, title: 'Eras & Composers', emoji: '🕰️', color: '#8A6D3B', tagline: 'Meet the people behind the music',
      bigQuestion: 'Who wrote the music, and when?',
      story: 'People have been making music for as long as there have been people. Western classical music is usually grouped into eras: Medieval, Renaissance, Baroque, Classical, Romantic and the 20th century onward. Each era has its own sound, its own instruments and its own famous composers. Some are well known, but many women and people from many places have been left out of the story. Let\'s meet them all.',
      answer: 'Music changes over time. Each era has a style, and each composer adds their own voice to it.',
      labs: ['timeline', 'era-sort', 'who-am-i'],
      listen: ['viridissima', 'sicut', 'spring', 'nachtmusik', 'ode-joy', 'la-mer', 'price-sym'],
      vocab: [V('composer', 'a person who writes music'), V('era', 'a long period of time with a shared style'), V('Medieval', 'about 500–1400: chant and early songs'), V('Renaissance', 'about 1400–1600: smooth voices together'), V('Baroque', 'about 1600–1750: ornate, energetic (Bach, Vivaldi)'), V('Classical', 'about 1750–1820: clear and balanced (Mozart, Haydn)'), V('Romantic', 'about 1820–1900: big feelings and stories'), V('prodigy', 'a child with an amazing gift')],
      sessions: [
        S('Composer of the month', 'Choose a composer from the cards. Listen to two pieces, learn one fact, and draw a portrait.', 'Pick one composer per month and give them a place on the wall. Listen to a piece each day for a week, tell one fact each day, and finish with a drawing or a short narration. Keep a "composer notebook" page for each. Mix voices: include women and composers from many places.', ['Paper', 'Crayons'], 'Listen to a short piece and wave a scarf.'),
        S('Washing-line timeline', 'Make a timeline on a string. Peg composer cards by birth year. Colour the cards by era.', 'Use the Time Machine lab or print cards from the Composers page. Add world events (the first telescope, the American Revolution) so children can place music in history. Which composers might have met each other?', ['String', 'Pegs', 'Cards'], 'Peg three pictures in order.'),
        S('Court concert', 'Hold a family concert dressed as an era: Baroque candlelight, Classical powdered wigs (paper!), Romantic capes.', 'Let each child introduce a piece (name, composer, one fact, what to listen for). It builds confidence and public speaking. Record the concert. Send a copy to grandparents!', ['Costumes', 'Programme card'], 'Take a bow after each tune.')
      ],
      quiz: [
        Q('Which came first?', ['Baroque', 'Romantic'], 0, 'Baroque (1600–1750) came before Romantic (1820–1900).'),
        Q('Who wrote The Four Seasons?', ['Vivaldi', 'Mozart', 'Chopin'], 0, 'Antonio Vivaldi, about 1720.'),
        Q('Beethoven lost his...', ['Hearing', 'Sight', 'Voice'], 0, 'He went deaf but kept writing music.'),
        Q('Which composer was a child prodigy who toured Europe at a very young age?', ['Mozart', 'Pachelbel', 'Vaughan Williams'], 0, 'Mozart was writing music at five.'),
        Q('Hildegard von Bingen was a...', ['Medieval abbess and composer', 'Baroque opera singer', 'Romantic pianist'], 0, 'She lived 1098–1179.'),
        Q('Who wrote The Nutcracker?', ['Tchaikovsky', 'Bach', 'Haydn'], 0, 'Pyotr Ilyich Tchaikovsky, 1892.'),
        Q('Florence Price was born in which US state?', ['Arkansas', 'New York', 'Texas'], 0, 'She was born in Little Rock, Arkansas in 1887.'),
        Q('Bach and Handel both lived in which era?', ['Baroque', 'Classical', 'Medieval'], 0, 'Both were born in 1685.'),
        Q('Clara Schumann was famous as a...', ['Concert pianist (and composer)', 'Trumpeter', 'Conductor of cannons'], 0, 'She toured Europe as a pianist for decades.')
      ],
      badge: { emoji: '🕰️', name: 'Time Traveller', how: 'Finish all three labs and pass the quiz.', earned: 'You can travel through the eras and meet the composers.' }
    },
    /* ===================== 8 ===================== */
    {
      id: 8, title: 'Stories in Music', emoji: '📖', color: '#1C9AA8', tagline: 'Sky, sea, animals and tales',
      bigQuestion: 'Can music paint a picture or tell a story?',
      story: 'Some music has a story or a picture behind it. This is called programme music. Debussy paints the sea, Mendelssohn paints a cave, Prokofiev tells a story with instruments as characters. Composers use pitch, rhythm, speed and instruments to make you see things with your ears.',
      answer: 'Composers use instruments, speed, loudness and tune shapes to stand for characters and scenes. A short tune that stands for a character is a leitmotif.',
      labs: ['peter-wolf', 'carnival', 'soundscape', 'leitmotif'],
      listen: ['peter-wolf', 'carnival', 'la-mer', 'hebrides', 'spring', 'pictures', 'humpback'],
      vocab: [V('programme music', 'music that tells a story or paints a picture'), V('leitmotif', 'a short tune that stands for a character or idea'), V('overture', 'an opening piece for an opera, ballet or play'), V('narrator', 'someone who tells the story'), V('mood', 'the feeling of a piece'), V('imitation', 'music that copies sounds of nature, like a cuckoo'), V('soundscape', 'a picture made of sounds')],
      sessions: [
        S('Paint to music', 'Listen to La Mer or Clair de Lune while you paint with watercolours. What colours does the music make?', 'Offer paper and paints but no instructions. Play the music twice, once for listening and once for painting. Afterwards ask: which instruments did you hear? Where did the picture change? Compare pictures: there are no wrong answers, but each picture is evidence of listening.', ['Watercolours', 'Paper', 'Music'], 'Finger-paint while the music plays.'),
        S('Peter and the Wolf', 'Act out Peter and the Wolf. Everyone picks a character and plays their own "theme" on an instrument or with their voice.', 'Listen to a narrated recording. Give each child an animal and a matching instrument (flute = bird, oboe = duck, clarinet = cat, bassoon = grandfather, horns = wolf, strings = Peter). Let them tell the story using their instruments only.', ['Narrated recording', 'Instruments or toys'], 'Fly like the bird, waddle like the duck.'),
        S('Soundscape walk', 'Go outside, close your eyes and list every sound: wind, birds, waves, rain. Come back and make the sounds with your voices and instruments.', 'Try this at the shore, in a wood, or on a windy day. Record the real sounds on a phone, then create an imitation and compare. Link it to the Soundscape lab. Ask: which of these sounds are high or low, steady or changing?', ['A phone for recording', 'Instruments or voices'], 'Whoosh like the wind, splash like waves.')
      ],
      quiz: [
        Q('Music that tells a story or paints a picture is called...', ['Programme music', 'Round', 'Scale'], 0, 'Programme music has a story or scene behind it.'),
        Q('In Peter and the Wolf, which instruments play the wolf?', ['French horns', 'Flutes', 'Triangles'], 0, 'Three horns play the wolf\'s menacing theme.'),
        Q('In Peter and the Wolf, which instrument is the bird?', ['Flute', 'Tuba', 'Violin'], 0, 'The flute flutters like a bird.'),
        Q('In Carnival of the Animals, The Swan is played by...', ['Cello', 'Trumpet', 'Drum'], 0, 'A smooth, gliding cello tune.'),
        Q('Debussy\'s La Mer is about...', ['The sea', 'A circus', 'A mountain'], 0, 'La mer is French for "the sea".'),
        Q('Mendelssohn\'s Hebrides overture was inspired by...', ['A sea cave in Scotland', 'A castle in Spain', 'A river in Austria'], 0, 'He visited Fingal\'s Cave in 1829.'),
        Q('A leitmotif is...', ['A short tune that stands for a character or idea', 'A very loud chord', 'A kind of drum'], 0, 'Think of a character\'s theme tune.'),
        Q('In Beethoven\'s "Pastoral" Symphony, which instrument is the cuckoo?', ['Clarinet', 'Trombone', 'Harp'], 0, 'Beethoven wrote it in the score: flute = nightingale, oboe = quail, clarinet = cuckoo.'),
        Q('In The Lark Ascending, which instrument imitates the skylark?', ['Solo violin', 'Tuba', 'Timpani'], 0, 'The violin rises and flutters like a bird.')
      ],
      badge: { emoji: '📖', name: 'Story Listener', how: 'Finish all four labs and pass the quiz.', earned: 'You can hear the stories hidden inside the music.' }
    },
    /* ===================== 9 ===================== */
    {
      id: 9, title: 'Folk, Hymns & Home', emoji: '☘️', color: '#5C8A2E', tagline: 'Songs we sing together',
      bigQuestion: 'Why do people sing together?',
      story: 'Long before concert halls, people sang at work, at worship and at home. Folk songs are passed on by ear from person to person. Hymns carry words of faith to tunes everyone can sing. Sea shanties kept sailors pulling together. Irish traditional music has jigs, reels and slow airs on fiddle, whistle, pipes and bodhrán. Singing together is music at its oldest.',
      answer: 'Folk music is learned by ear and passed on. Different kinds of songs have different jobs: dancing, working, worship and storytelling.',
      labs: ['dance-rhythms', 'chords', 'irish-instruments', 'shanty'],
      listen: ['session', 'wellerman', 'hymn-vision', 'hymn-fount', 'hymn-saints', 'carolan', 'appalachian'],
      vocab: [V('folk music', 'songs and tunes passed on by ear'), V('hymn', 'a song of worship with verses sung to one tune'), V('verse', 'a section with new words sung to the same tune'), V('refrain', 'a part that repeats after each verse'), V('call and response', 'one person leads, the group answers'), V('jig', 'a lively Irish dance in 6/8'), V('reel', 'a fast Irish dance in 4/4'), V('chord', 'three or more notes played together'), V('SATB', 'soprano, alto, tenor, bass: the four parts of a choir')],
      sessions: [
        S('Sing a hymn', 'Choose a hymn your family loves. Sing the melody, then a second time with a drone note, then a third time hum along softly.', 'Talk about the words first: what is it asking, saying or thanking? Notice the verse/refrain shape. Older children can follow the notes on the Sight Singing app and find the high point of the melody. Try singing in two parts, with the lower part following the same rhythm.', ['Hymnbook', 'Sight Singing app (optional)'], 'Sway and hum along while the family sings.'),
        S('Jig or reel?', 'March to a jig: DUM-da-da DUM-da-da. Then gallop to a reel: da-da-da-da. Can you tell which is which with your eyes closed?', 'Tap on a tambourine, wooden spoons or a frame drum (bodhrán-style). Use the Dance Rhythms lab, then listen to a real session (The Chieftains or any local trad group). If there is a local session or céilí, go and watch.', ['Spoons or tambourine', 'Recorded session'], 'Bounce on a knee for the jig.'),
        S('Shanty work-song', 'Pretend to haul a rope! One person calls a line, everyone answers on the chorus, and everyone pulls on the strong beat.', 'Sea shanties were work songs sung to coordinate heavy tasks. The leader sang verses (often improvised), the crew answered. Give children a real job (carry laundry, stack firewood) to do to a shanty. Note: shanties come from the age of sail and whaling; talk about how different the world was then.', ['A rope or scarf', 'A chore'], 'Pull a rope on the strong beat.')
      ],
      quiz: [
        Q('A jig is danced in...', ['6/8, two groups of three', '4/4, four even beats', '3/4, like a waltz'], 0, 'DUM-da-da DUM-da-da.', { seq: [['!bodhran', .5], ['!wood', .5], ['!wood', .5], ['!bodhran', .5], ['!wood', .5], ['!wood', .5], ['!bodhran', .5], ['!wood', .5], ['!wood', .5], ['!bodhran', .5], ['!wood', .5], ['!wood', .5]], tempo: 190 }),
        Q('A bodhrán is...', ['An Irish frame drum', 'A kind of flute', 'A kind of fiddle'], 0, 'It is played with a double-ended stick called a tipper.'),
        Q('A sea shanty is...', ['A work song with call and response', 'A very quiet lullaby', 'A symphony'], 0, 'Shanties coordinated the crew\'s pulling.'),
        Q('A hymn usually has...', ['Several verses sung to the same tune', 'No words', 'Only drums'], 0, 'Verses share a tune; a refrain may repeat.'),
        Q('What is the national emblem of Ireland?', ['The harp', 'The violin', 'The trumpet'], 0, 'The harp is on Irish coins and the presidential flag.'),
        Q('Uilleann pipes are...', ['Irish bagpipes blown with a bellows under the arm', 'A kind of whistle', 'A drum'], 0, 'The bellows is squeezed with the elbow ("uilleann" means elbow).'),
        Q('Call and response means...', ['A leader sings, the group answers', 'Everyone sings together all the time', 'Silence followed by drums'], 0, 'One calls, others reply.'),
        Q('SATB stands for...', ['Soprano, alto, tenor, bass', 'Slow, accent, tempo, beat', 'Strings, air, trumpet, bell'], 0, 'The four parts of a standard choir.')
      ],
      badge: { emoji: '☘️', name: 'Song Friend', how: 'Finish all four labs and pass the quiz.', earned: 'You know why we sing together, and you know a jig from a reel.' }
    }
  ];
})();
