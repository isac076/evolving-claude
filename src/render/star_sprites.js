// The Star lantern (Night 26): a slender silver post with a curl at the top, and
// a five-pointed glass star hanging from it, slowly turning and drifting through
// every colour of the sky. G.starHue() gives its colour now; G.StarChart keeps
// the night glow of every Star lantern in step with it.
window.G = window.G || {};

(function () {
  const circle = G.circle, shadow = G.shadow;

  // the colour of a Star lantern at time t (each one is a little out of step with the next)
  G.starHue = (t, tx, ty) => (248 + t * 7 + ((tx * 37 + ty * 61) % 360) + 360) % 360;

  function star(ctx, cx, cy, r, turn) {   // a five-pointed star, squashed by how far it has turned
    const sx = Math.max(0.3, Math.abs(Math.cos(turn)));
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      const x = cx + Math.cos(a) * rr * sx, y = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  Object.assign(G.STRUCTURE_SPRITES, {
    starlantern(ctx, x, y, f, t, st) {
      const tx = st && st.tx !== undefined ? st.tx : 0, ty = st && st.ty !== undefined ? st.ty : 0;
      const cx = x + 16, by = y + 29, hue = G.starHue(t, tx, ty), calm = G.calm;
      const p = 0.5 + 0.5 * Math.sin(t * 2.1 + tx), turn = calm ? 0.3 : t * 0.9 + tx * 0.7;
      const sway = calm ? 0 : Math.sin(t * 1.3 + ty) * 1.2;
      // a pool of coloured light on the ground
      const pool = ctx.createRadialGradient(cx, by - 1, 2, cx, by - 1, 22);
      pool.addColorStop(0, `hsla(${hue},90%,75%,${(0.22 + 0.08 * p).toFixed(2)})`); pool.addColorStop(1, `hsla(${hue},90%,70%,0)`);
      ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, by - 1, 22, 8, 0, 0, 6.2832); ctx.fill();
      shadow(ctx, cx, by, 8, 3);
      // the foot and the slender post
      ctx.fillStyle = '#5d6178'; ctx.beginPath(); ctx.ellipse(cx, by - 1.5, 6, 2.4, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#a9b0cc'; ctx.fillRect(cx - 1.2, by - 38, 2.4, 37);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx - 1.2, by - 38, 0.9, 37);
      // the curl at the top, reaching out over the star
      ctx.strokeStyle = '#a9b0cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, by - 37); ctx.quadraticCurveTo(cx + 2, by - 46, cx + 9, by - 44); ctx.quadraticCurveTo(cx + 13, by - 42, cx + 10, by - 39); ctx.stroke();
      // the thread and the star
      const sx = cx + 9 + sway, sy = by - 26;
      ctx.strokeStyle = 'rgba(220,226,255,.7)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(cx + 9.5, by - 39); ctx.lineTo(sx, sy - 9); ctx.stroke();
      const halo = ctx.createRadialGradient(sx, sy, 1, sx, sy, 17);
      halo.addColorStop(0, `hsla(${hue},100%,85%,${(0.55 + 0.25 * p).toFixed(2)})`); halo.addColorStop(1, `hsla(${hue},100%,70%,0)`);
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, 17, 0, 6.2832); ctx.fill();
      const g = ctx.createLinearGradient(sx - 7, sy - 7, sx + 7, sy + 7);
      g.addColorStop(0, `hsl(${hue},95%,92%)`); g.addColorStop(1, `hsl(${(hue + 40) % 360},85%,${(66 + p * 8).toFixed(0)}%)`);
      ctx.fillStyle = g; star(ctx, sx, sy, 9.5, turn); ctx.fill();
      ctx.strokeStyle = `hsla(${hue},60%,40%,.55)`; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; circle(ctx, sx, sy, 1.6 + p * 0.5);   // its bright heart
      // a speck of stardust drifting down now and then
      if (!calm) {
        const k = (t * 0.6 + tx * 0.13) % 1;
        ctx.fillStyle = `hsla(${(hue + 60) % 360},100%,88%,${(1 - k).toFixed(2)})`;
        circle(ctx, sx + Math.sin(k * 9 + tx) * 3, sy + 6 + k * 18, 0.9);
      }
    },
  });
})();
