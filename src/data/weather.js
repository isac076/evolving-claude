// Kinds of weather. The sky drifts from one to the next on its own (see
// world/weather.js); everything is a number from 0 to 1 that the renderer,
// the soundscape, the creatures and the sprites read.
//
// weight  = how often it is picked next (bigger = more often)
// dur     = [min, max] seconds it lasts
// rain    = how hard it rains          wind   = how hard it blows (sways plants, blows leaves)
// fog     = how thick the mist is      cloud  = how grey and dim the sky is
// shadows = drifting cloud shadows on the ground
// after   = weights for what may follow this one (otherwise `weight` is used)
// rainbow = a rainbow can appear when it clears on a bright day
// say     = the message when it begins (first = the longer one, the first time ever)
window.G = window.G || {};

G.WEATHER = {
  clear: {
    name: 'Clear', weight: 5, dur: [100, 210], rain: 0, wind: 0.12, fog: 0, cloud: 0, shadows: 0.35,
  },
  breezy: {
    name: 'Breezy', weight: 2.2, dur: [60, 130], rain: 0, wind: 0.85, fog: 0, cloud: 0.1, shadows: 1,
    say: 'A breeze picks up.', first: 'A breeze picks up — listen to the trees, and watch leaves and petals ride the wind.',
  },
  overcast: {
    name: 'Overcast', weight: 1.4, dur: [50, 100], rain: 0, wind: 0.35, fog: 0, cloud: 0.45, shadows: 0.6,
    after: { drizzle: 3, rain: 2, clear: 1, breezy: 1 },
    say: 'Grey clouds gather.', first: 'Grey clouds gather. Rain may be on its way.',
  },
  drizzle: {
    name: 'Light rain', weight: 1, dur: [50, 110], rain: 0.38, wind: 0.25, fog: 0.1, cloud: 0.5, shadows: 0, rainbow: true,
    after: { clear: 3, rain: 1, fog: 1, breezy: 1 },
    say: 'A soft rain begins.', first: 'A soft rain begins. Plants grow back faster while it falls, and some creatures shelter.',
  },
  rain: {
    name: 'Rain', weight: 0.6, dur: [60, 120], rain: 1, wind: 0.55, fog: 0.15, cloud: 0.8, shadows: 0, rainbow: true,
    after: { clear: 3, drizzle: 2, breezy: 1 },
    say: 'Rain pours down.', first: 'Rain pours down! Plants grow back faster in the rain — and when it clears on a sunny day, look up.',
  },
  fog: {
    name: 'Fog', weight: 1, dur: [60, 120], rain: 0, wind: 0.04, fog: 1, cloud: 0.25, shadows: 0,
    after: { clear: 3, overcast: 1 },
    say: 'Mist rolls in.', first: 'A soft mist rolls in. The world goes quiet; your light feels warmer than ever.',
  },
};

G.RAINBOW_TIME = 55;   // seconds a rainbow stays in the sky
