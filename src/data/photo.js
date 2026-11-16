// Photo mode and the title screen (Night 24): every knob and every word lives here.
// Filters and frames are lists, so a new look is one more entry (G.PhotoFX draws them by id).
window.G = window.G || {};

G.PHOTO = {
  reach: 16,              // how far (tiles) the camera may wander from the spirit
  pan: 340,               // camera speed with the keys (px per second, before zoom)
  zoom: { min: 0.75, max: 2.2, step: 1.15 },
  speeds: [               // how fast the world moves while you frame a photo
    { id: 'still', name: 'Still', k: 0 },
    { id: 'slow', name: 'Slow', k: 0.25 },
    { id: 'normal', name: 'Normal', k: 1 },
    { id: 'quick', name: 'Quick', k: 8 },       // to chase a sunset or the night
  ],
  album: 12,              // photos kept in the journal's album (oldest let go first)
  thumb: 560,             // width of an album copy (px)
  quality: 0.82,          // JPEG quality of an album copy
  hintDay: 2,             // from this day on, the first lovely moment suggests photo mode once
};

// filters: drawn over the live picture, so what you see is what you keep
G.PHOTO_FILTERS = [
  { id: 'natural', name: 'Natural' },
  { id: 'golden', name: 'Golden hour' },
  { id: 'dream', name: 'Dreamy' },
  { id: 'moon', name: 'Moonlit' },
  { id: 'old', name: 'Old days' },          // the grey of the Fading, remembered
];

// frames: around the edge of the picture; `caption` frames print where and when
G.PHOTO_FRAMES = [
  { id: 'none', name: 'None' },
  { id: 'soft', name: 'Soft edge' },
  { id: 'wide', name: 'Cinema', caption: true },
  { id: 'card', name: 'Keepsake', caption: true },
];

// names for a place when nothing nearer (a sign, a village, a hollow…) names it
G.PHOTO_GROUNDS = {
  grass: 'The meadow', forest: 'The old woods', sand: 'The shore', stone: 'The highlands',
  water: 'Still water', deep: 'The open sea', mushwood: 'A glowcap hollow', frost: 'The snowfields',
};

G.PHOTO_SAYS = {
  open: 'Photo mode · the world holds its breath. WASD or drag to look around, scroll to zoom, Space to take the photo.',
  openTouch: 'Photo mode · drag to look around, then tap the round shutter.',
  kept: 'Kept in your album',
  full: 'Your album is full — the oldest photo was let go.',
  noRoom: 'This browser has no room to keep photos — use Download to save it.',
  hint: 'What a view. Press P (or the little camera at the top) to take a photo.',
  hintTouch: 'What a view. Tap the little camera at the top to take a photo.',
  emptyAlbum: 'No photos yet. Press P (or tap the little camera at the top) for photo mode: frame the moment, pick a filter, and the shutter keeps it here.',
  albumNote: n => `${n} photo${n === 1 ? '' : 's'} in your album. Tap one to look closer.`,
};

// the title screen
G.TITLE = {
  bloomDelay: 0.5,        // seconds of grey before the colour blooms
  bloomTime: 3.6,         // how long the colour takes to come back (CSS transition)
  tour: 16,               // seconds the camera drifts from one light to the next
  timeSpeed: 2.5,         // the day passes a little faster behind the title
  motes: 26,              // warm motes rising behind the letters
  arrive: { veil: 0.45, zoom: 1.35, time: 1.9 },   // the way into the world: dim, set down, ease out
};
G.TITLE_LINES = {
  summary: (day, season, lights, friends) => [`Day ${day}`, season, lights ? `${lights} lantern${lights === 1 ? '' : 's'} lit` : '',
    friends ? `${friends} friend${friends === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '),
  fresh: 'A grey world waits for its first light.',
};
