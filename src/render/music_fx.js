// G.MusicFX — the little glowing notes that float up from friends playing along
// (and, now and then, from the spirit itself while the land sings).
// Drawn by main.js after the night lighting, so they shine in the dark too.
window.G = window.G || {};

G.MusicFX = {
  draw(ctx, notes, camX, camY, W, H) {
    if (!notes.length) return;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of notes) {
      if (n.delay > 0) continue;
      const x = n.x - camX, y = n.y - camY;
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      // fade in quickly, drift up, fade out slowly
      const a = Math.min(1, n.age * 5) * Math.min(1, n.life / 0.9) * n.a;
      const size = 12 + 5 * Math.min(1, n.age * 3);
      ctx.font = `bold ${size.toFixed(1)}px Georgia, serif`;
      ctx.globalAlpha = a;
      ctx.lineJoin = 'round'; ctx.lineWidth = 3;
      ctx.shadowColor = `hsl(${n.hue},95%,70%)`; ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255,250,235,.85)';
      ctx.strokeText(n.g, x, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `hsl(${n.hue},75%,48%)`;
      ctx.fillText(n.g, x, y);
    }
    ctx.restore();
  },
};
