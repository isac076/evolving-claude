// G.TravelFX — how a flight along the lantern roads looks (Night 16).
// Drawn after the night lighting, so the mote and its road glow in the dark:
// a faint road of light arcing ahead, the bright mote with a tail of light,
// its soft shadow on the ground, a beam rising from the light you fly to,
// a warm veil over the screen at the top of the leap, and a ring where you land.
window.G = window.G || {};

G.TravelFX = {
  draw(ctx, state, camX, camY, W, H, t, dark) {
    const tr = state.travel;
    if (!tr) return;
    if (tr.trip) this.flight(ctx, tr, camX, camY, W, H, t, dark);
    if (tr.landed) this.landing(ctx, tr.landed, camX, camY);
  },

  flight(ctx, tr, camX, camY, W, H, t, dark) {
    const trip = tr.trip, u = G.clamp(trip.t / trip.dur, 0, 1), lift = Math.sin(Math.PI * u);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // the light you set off from flares, and a ring rolls out from it
    if (trip.t < 0.9) {
      const k = trip.t / 0.9, fx = trip.from.x - camX, fy = trip.from.y - camY - 10;
      ctx.lineWidth = 6 * (1 - k); ctx.strokeStyle = `rgba(255,225,160,${0.5 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(fx, fy + 18, 14 + k * 70, (14 + k * 70) * 0.45, 0, 0, 6.2832); ctx.stroke();
    }

    // a beam of light rises over the light you are flying to
    const bx = trip.to.x - camX, by = trip.to.y - camY - 20, ba = 0.08 + 0.3 * u;
    const bg = ctx.createLinearGradient(0, by, 0, by - 420);
    bg.addColorStop(0, `rgba(255,232,170,${ba})`); bg.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(bx - 8, by); ctx.lineTo(bx - 30, by - 420); ctx.lineTo(bx + 30, by - 420); ctx.lineTo(bx + 8, by); ctx.closePath(); ctx.fill();

    // the road itself: a faint curve of light still ahead of the mote
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const v = u + (1 - u) * i / 40, q = tr.at(v), x = q.x - camX, y = q.y - q.z - camY;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.setLineDash([3, 9]); ctx.lineDashOffset = -t * 60;
    ctx.lineWidth = 2.2; ctx.strokeStyle = `rgba(255,230,170,${0.18 + 0.25 * dark})`; ctx.stroke();
    ctx.setLineDash([]);

    // the tail of light behind the mote
    const tl = tr.trail;
    for (let i = 1; i < tl.length; i++) {
      const k = i / tl.length;
      ctx.lineWidth = 1 + k * 9;
      ctx.strokeStyle = `rgba(255,${200 + k * 40},${130 + k * 80},${k * 0.35})`;
      ctx.beginPath(); ctx.moveTo(tl[i - 1].x - camX, tl[i - 1].y - camY); ctx.lineTo(tl[i].x - camX, tl[i].y - camY); ctx.stroke();
    }

    // the mote: a soft halo, little turning rays and a white-hot middle
    const p = tr.at(u), mx = p.x - camX, my = p.y - p.z - camY - 8;
    const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 46);
    halo.addColorStop(0, 'rgba(255,245,215,.85)'); halo.addColorStop(0.3, 'rgba(255,210,140,.35)'); halo.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, 46, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const a = t * 2.5 + i * Math.PI / 2, r1 = 9, r2 = 17 + Math.sin(t * 7 + i) * 4;
      ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); ctx.lineTo(mx + Math.cos(a) * r2, my + Math.sin(a) * r2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ffd77a'; ctx.beginPath(); ctx.arc(mx, my, 2.6, 0, 6.2832); ctx.fill();

    // its shadow, far below on the ground, small and faint while high up
    const sx = p.x - camX, sy = p.y - camY + 4, sr = 10 - lift * 5;
    ctx.fillStyle = `rgba(10,12,30,${0.25 - lift * 0.15})`;
    ctx.beginPath(); ctx.ellipse(sx, sy, sr, sr * 0.4, 0, 0, 6.2832); ctx.fill();

    // a warm veil at the top of the leap, brightest at the edges
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
    vg.addColorStop(0, `rgba(255,238,200,${lift * 0.05})`); vg.addColorStop(1, `rgba(255,226,170,${lift * 0.32})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  landing(ctx, L, camX, camY) {
    const k = L.t / 1.6, x = L.x - camX, y = L.y - camY + 4;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [w, a, s] of [[10, 0.25, 1], [3, 0.7, 1], [2, 0.45, 0.6]]) {
      const r = (12 + k * 80) * s;
      ctx.lineWidth = w * (1 - k); ctx.strokeStyle = `rgba(255,228,170,${a * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, 6.2832); ctx.stroke();
    }
    const fl = Math.max(0, 1 - k * 3);
    if (fl > 0) {
      const g = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 70);
      g.addColorStop(0, `rgba(255,245,220,${0.6 * fl})`); g.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 10, 70, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  },
};
