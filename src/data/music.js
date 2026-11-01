// The music of Lumen: everything the little composer (audio/music.js) needs.
// It writes a fresh tune for every piece, in the same key as every chime
// (D major pentatonic), and lets the world decide how it sounds:
//  - how coloured the land is decides which parts play (grey = a few lonely notes)
//  - time of day and weather pick the mood (tempo, chords, 4/4 or a 3/4 lullaby)
//  - the ground under you picks the instrument of the tune
//  - friends who are awake nearby join in, each kind with its own part
window.G = window.G || {};

G.MUSIC = {
  root: 146.83,          // D3 in Hz — semitone 0 below
  // how coloured the land must be for each part: [silent at, full at]
  layers: {
    lonely:  [0.5, 0.15],  // a few soft, far-apart notes — they fade AWAY as colour returns
    bass:    [0.22, 0.48],
    melody:  [0.4, 0.68],
    sparkle: [0.74, 0.96],
  },
  fade: 3,               // seconds for a part to fade in or out
  band: { range: 9, colour: 0.5 },   // friends this many tiles away, in land this coloured, play along
  phrase: 8,             // bars in one statement of the tune (A B A C)
  repeats: 2,            // how many times a piece plays its tune
  restBars: [1, 2],      // quiet bars (just pad and bass) between pieces
  captionGap: 150,       // seconds before the same title may be shown again
};

// Chords as semitones above D.
G.CHORDS = {
  D: [0, 4, 7], Em: [2, 5, 9], 'F#m': [4, 7, 11], G: [5, 9, 12], A: [7, 11, 14], Bm: [9, 12, 16],
};

// Moods: chosen by the time of day and the weather (see G.Music.moodFor).
// bpm = speed, beats = beats in a bar, density = how busy the tune is (0..1),
// inst = forces the tune's instrument (otherwise the ground chooses).
G.MUSIC_MOODS = {
  morning: { bpm: 78, beats: 4, density: 0.85, progs: [['D', 'G', 'D', 'A'], ['G', 'D', 'A', 'D'], ['D', 'Bm', 'G', 'A']],
    titles: ['Morning in the {place}', 'The {place} wakes up', 'First light on the {place}'] },
  day:     { bpm: 90, beats: 4, density: 1, progs: [['D', 'G', 'Bm', 'A'], ['D', 'A', 'Bm', 'G'], ['G', 'D', 'Em', 'A'], ['D', 'Bm', 'G', 'A']],
    titles: ['Song of the {place}', 'A sunny day in the {place}', 'Walking through the {place}', 'The {place} is singing'] },
  dusk:    { bpm: 74, beats: 4, density: 0.8, progs: [['Bm', 'G', 'D', 'A'], ['G', 'A', 'D', 'Bm'], ['Em', 'G', 'D', 'A']],
    titles: ['Evening over the {place}', 'The {place} at dusk', 'Lanterns waking in the {place}'] },
  night:   { bpm: 62, beats: 3, density: 0.7, inst: 'musicbox', progs: [['Bm', 'G', 'D', 'A'], ['D', 'Bm', 'Em', 'A'], ['G', 'D', 'Bm', 'A']],
    titles: ['Lullaby for the {place}', 'The {place} under the stars', 'The {place} is dreaming'] },
  rain:    { bpm: 70, beats: 4, density: 0.6, progs: [['Bm', 'A', 'G', 'A'], ['G', 'D', 'A', 'Bm'], ['Bm', 'G', 'Em', 'A']],
    titles: ['Rain on the {place}', 'Puddles in the {place}', 'The {place} in the rain'] },
  fog:     { bpm: 58, beats: 3, density: 0.5, inst: 'glass', progs: [['Bm', 'G', 'Bm', 'A'], ['D', 'Em', 'G', 'A']],
    titles: ['Fog over the {place}', 'The {place}, softly'] },
};
// what the tune is called when the land around you is still grey
G.MUSIC_GREY_TITLES = ['Echoes in the grey', 'A faint, faraway tune', 'The grey remembers a song'];

// The ground decides who plays the tune, and what the place is called in titles.
G.MUSIC_PLACES = {
  grass:  { place: 'meadow',    inst: 'flute' },
  forest: { place: 'woods',     inst: 'marimba' },
  sand:   { place: 'shore',     inst: 'kalimba' },
  stone:  { place: 'highlands', inst: 'glass' },
  water:  { place: 'water',     inst: 'harp' },
  deep:   { place: 'deep water', inst: 'harp' },
};

// Rhythms for one bar, in eighth notes; negative numbers are rests.
G.MUSIC_RHYTHMS = {
  4: [[2, 2, 2, 2], [2, 1, 1, 2, 2], [3, 1, 2, 2], [2, 2, 4], [1, 1, 2, 2, 2], [4, 2, 2], [2, -1, 1, 2, 2], [3, 1, 4]],
  3: [[2, 2, 2], [4, 2], [2, 1, 1, 2], [3, 1, 2], [2, 4], [6]],
};
// the last bar of each tune: a long, settling note
G.MUSIC_ENDINGS = { 4: [[2, 2, 4], [4, 4], [2, 6]], 3: [[2, 4], [6]] };

// The band: each kind of friend plays its own part when awake and near you.
// part = how they play (see G.Music.bandPart), inst = their instrument (audio/instruments.js)
G.MUSIC_BAND = {
  singer:   { part: 'harmony', inst: 'voice',     joins: 'sings along' },
  gardener: { part: 'arp',     inst: 'harp',      joins: 'plucks a little harp' },
  tinkerer: { part: 'rhythm',  inst: 'woodblock', joins: 'taps out the beat' },
  dreamer:  { part: 'chime',   inst: 'chime',     joins: 'rings the wind chimes' },
  wanderer: { part: 'counter', inst: 'pipe',      joins: 'plays a wooden pipe' },
};
