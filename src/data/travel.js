// The lantern roads (Night 16): every light you have lit is joined to the
// others by an old road of light. Stand beside one, open the map (M) and click
// another light — the spirit leaps into the sky as a mote and flies there.
// Which lights are on the roads is data: add a structure id to G.TRAVEL_STOPS.
window.G = window.G || {};

G.TRAVEL = {
  reach: 2.6,        // tiles: how close to a light you must stand to set off
  minTime: 1.5,      // seconds for the shortest flight …
  maxTime: 3.4,      // … and the longest
  perTile: 0.022,    // extra seconds per tile of distance
  height: [70, 190], // px: how high the mote rises (short flights stay low, long ones climb)
  bend: 0.12,        // how much the road curves to one side (fraction of its length)
  pick: 13,          // px on the big map: how close a click must land to a light
  // where you land: tile offsets from the light, the first free one wins (in front, then the sides)
  land: [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, 2], [2, 1], [-2, 1], [0, -1]],
};

// Lights on the roads, and what to call them on the map ({place} = where it stands).
G.TRAVEL_STOPS = {
  heart:       { name: 'the Heart Stone', hue: 45 },
  lantern:     { name: 'Lantern {place}', hue: 38 },
  beacon:      { name: 'Crystal Beacon {place}', hue: 195 },
  emberlamp:   { name: 'Ember lantern {place}', hue: 20 },
  memorystone: { name: 'Memory stone {place}', hue: 215 },
  shrineflame: { name: '{shrine}', hue: 30 },
};
for (const id in G.TRAVEL_STOPS) if (G.STRUCTURES[id]) G.STRUCTURES[id].travel = true;

// "{place}" is the nearest village, else the ground a light stands on
G.TRAVEL_PLACES = {
  village: 'in {name}',
  grass: 'in the meadow', forest: 'in the woods', sand: 'on the shore', stone: 'in the highlands',
  water: 'by the water', deep: 'by the water',
};

G.TRAVEL_SAYS = {
  first: 'Your lanterns are joined by old roads of light. Open the map (M) beside one and click another light to fly there.',
  arrive: ['The road of light sets you down softly.', 'You land in a shower of sparks.', 'Home is wherever a lantern burns.',
           'The light remembers the way.'],
  firstArrive: 'You flew the lantern roads! Any light you build becomes a new stop — beacons, ember lanterns, woken memory stones and kindled shrines too.',
  notNear: 'Stand beside one of your lights to travel the lantern roads.',
  here: 'You are already here.',
  mapNear: '✦ You stand by a light — click another light to fly there',
  mapFar: 'Drag to look around · scroll to zoom · stand by a light to travel',
};
