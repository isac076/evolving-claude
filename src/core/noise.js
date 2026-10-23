// Smooth "value noise" — used to shape terrain (height, moisture...).
window.G = window.G || {};

G.valueNoise = function (x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const s = t => t * t * (3 - 2 * t);
  const a = G.hash2(xi, yi, seed), b = G.hash2(xi + 1, yi, seed);
  const c = G.hash2(xi, yi + 1, seed), d = G.hash2(xi + 1, yi + 1, seed);
  const u = s(xf), v = s(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// Fractal noise: several layers of noise at growing detail.
G.fbm = function (x, y, seed, octaves = 4) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * G.valueNoise(x * freq, y * freq, seed + i * 1013);
    norm += amp; amp *= 0.5; freq *= 2;
  }
  return sum / norm;
};
