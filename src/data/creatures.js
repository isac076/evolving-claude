// Creatures that return to restored land. They are never saved — they come and
// go around the player — so adding one is just a data entry here, a draw
// function in render/creature_sprites.js and (if it needs new behaviour) a
// move type in world/creatures.js.
//
// move     = how it behaves: 'flutter', 'moth', 'bird', 'hop', 'swim'
// tiles    = ground types it appears on
// when     = 'day', 'night' or 'any'
// restore  = how restored (0..1) the land must be for it to appear
// nearLight= appears only close to a lantern (radius in px)
// cap      = most of this kind around the screen at once
// group    = [min, max] that arrive together
// flee     = how close (px) the spirit can get before it moves away
// sound    = effect played when it startles / leaps (see G.SFX)
// meet     = message shown the first time you meet one
// shelter  = hides away while it rains     rainy = only comes out while it rains
window.G = window.G || {};

G.CREATURES = {
  butterfly: {
    name: 'Butterfly', move: 'flutter', tiles: ['grass', 'forest', 'sand'], when: 'day', restore: 0.7,
    cap: 9, group: [1, 2], flee: 34, shelter: true, hues: [48, 28, 200, 285, 330, 160],
    meet: 'A butterfly! Life is finding its way back to the coloured land.',
  },
  bird: {
    name: 'Songbird', move: 'bird', tiles: ['grass', 'sand', 'forest'], when: 'day', restore: 0.75,
    cap: 7, group: [2, 4], flee: 80, shelter: true, sound: 'flutter', hues: [25, 210, 8, 45],
    meet: 'Songbirds have come home. Walk gently — they startle easily.',
  },
  rabbit: {
    name: 'Rabbit', move: 'hop', tiles: ['grass'], when: 'day', restore: 0.8,
    cap: 3, group: [1, 2], flee: 95, shelter: true, hues: [30, 35, 40],
    meet: 'A rabbit peeks out of the grass. It will come back if it runs.',
  },
  frog: {
    name: 'Frog', move: 'hop', tiles: ['grass', 'sand'], when: 'any', restore: 0.6, rainy: true,
    cap: 5, group: [1, 2], flee: 60, hues: [100, 120, 85, 140],
    meet: 'A frog! Frogs only come out to play in the rain.',
  },
  fish: {
    name: 'Fish', move: 'swim', tiles: ['water', 'deep'], when: 'any', restore: 0.6,
    cap: 8, group: [1, 3], flee: 56, sound: 'splash', hues: [20, 35, 200, 0],
    meet: 'Fish are swimming in the restored water. Watch for one to leap!',
  },
  moth: {
    name: 'Moth', move: 'moth', tiles: ['grass', 'forest', 'sand', 'stone'], when: 'night', restore: 0,
    nearLight: 60, cap: 9, group: [1, 3], flee: 0, shelter: true, hues: [45, 30, 60],
    meet: 'Moths dance around your lantern in the dark.',
  },
};
