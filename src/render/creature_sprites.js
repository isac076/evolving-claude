// How each creature is drawn. (sx, sy) is the spot on the ground below it;
// c.z is how high above the ground it is. c.hue picks its colouring.
window.G = window.G || {};

(function () {
  const circle = G.circle;
  function groundShadow(ctx, x, y, w, z, a = 0.2) {
    const k = Math.max(0.25, 1 - z / 120);
    ctx.fillStyle = `rgba(0,0,10,${(a * k).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(x, y, w * k, w * 0.4 * k, 0, 0, 6.2832); ctx.fill();
  }

  G.CREATURE_SPRITES = {
    butterfly(ctx, c, sx, sy) {
      groundShadow(ctx, sx, sy, 4, c.z, 0.16);
      const y = sy - c.z;
      const open = c.state === 'rest' ? 0.35 + 0.65 * Math.abs(Math.sin(c.ph)) : 0.15 + 0.85 * Math.abs(Math.sin(c.ph));
      const h = c.hue;
      for (const side of [-1, 1]) {
        const w = side * open;
        ctx.fillStyle = `hsl(${h},85%,62%)`;
        ctx.beginPath(); ctx.ellipse(sx + w * 4, y - 2, Math.max(0.6, 4.2 * open), 3.4, side * -0.5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `hsl(${h + 20},80%,72%)`;
        ctx.beginPath(); ctx.ellipse(sx + w * 3, y + 2, Math.max(0.5, 2.8 * open), 2.2, side * 0.5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        circle(ctx, sx + w * 5, y - 3, 0.8 * open + 0.2);
      }
      ctx.fillStyle = '#3a2c3a';
      ctx.fillRect(sx - 0.7, y - 4, 1.4, 7.5);
    },

    moth(ctx, c, sx, sy) {
      const y = sy - c.z, open = 0.25 + 0.75 * Math.abs(Math.sin(c.ph));
      ctx.fillStyle = `hsla(${c.hue},45%,86%,.9)`;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(sx + side * open * 2.6, y, Math.max(0.5, 2.8 * open), 2.2, side * -0.4, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = `hsl(${c.hue},30%,55%)`;
      ctx.fillRect(sx - 0.6, y - 2.4, 1.2, 4.8);
    },

    bird(ctx, c, sx, sy) {
      const f = c.face, h = c.hue, flying = c.state === 'fly' || c.state === 'arrive';
      groundShadow(ctx, sx, sy, 5, c.z, 0.2);
      const y = sy - c.z - 4;
      const body = `hsl(${h},45%,42%)`, belly = `hsl(${h + 15},55%,70%)`, wing = `hsl(${h},40%,30%)`;
      if (flying) {
        const flap = Math.sin(c.ph);
        ctx.strokeStyle = wing; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - 7, y - flap * 6); ctx.quadraticCurveTo(sx - 3, y - 2 - flap * 2, sx, y);
        ctx.quadraticCurveTo(sx + 3, y - 2 - flap * 2, sx + 7, y - flap * 6);
        ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(sx, y + 0.5, 3.5, 2.3, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = belly; circle(ctx, sx + f * 3, y - 0.5, 1.8);
        return;
      }
      const peck = c.peck > 0 ? 1 : 0;
      // tail
      ctx.fillStyle = wing;
      ctx.beginPath(); ctx.moveTo(sx - f * 3, y); ctx.lineTo(sx - f * 8.5, y - 2.5); ctx.lineTo(sx - f * 8, y + 1); ctx.closePath(); ctx.fill();
      // body + belly + wing
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(sx, y, 5, 3.6, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(sx + f * 1.5, y + 1.3, 3.2, 2, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = wing; ctx.beginPath(); ctx.ellipse(sx - f * 1, y - 0.6, 3.2, 2, f * 0.2, 0, 6.2832); ctx.fill();
      // head
      const hx = sx + f * (4.5 + peck), hy = y - 3 + peck * 4;
      ctx.fillStyle = body; circle(ctx, hx, hy, 2.6);
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.moveTo(hx + f * 2.2, hy - 0.8); ctx.lineTo(hx + f * 4.6, hy + 0.2 + peck); ctx.lineTo(hx + f * 2.2, hy + 0.9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1c1a22'; circle(ctx, hx + f * 1, hy - 0.6, 0.7);
      // legs
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(sx - 1, y + 3); ctx.lineTo(sx - 1, sy); ctx.moveTo(sx + 1.2, y + 3); ctx.lineTo(sx + 1.2, sy); ctx.stroke();
    },

    frog(ctx, c, sx, sy, t) {   // a little round frog that only comes out in the rain
      const f = c.face, h = c.hue, hop = c.state === 'hop';
      groundShadow(ctx, sx, sy, 7, c.z, 0.24);
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1.3, 1.3); ctx.translate(-sx, -sy);
      const y = sy - c.z - 3;
      const skin = `hsl(${h},55%,40%)`, light = `hsl(${h + 8},60%,58%)`, belly = `hsl(${h + 20},40%,72%)`;
      // back legs: tucked when sitting, stretched out in a hop
      ctx.fillStyle = skin;
      if (hop) { ctx.beginPath(); ctx.ellipse(sx - f * 6, y + 2, 4.5, 1.4, f * 0.5, 0, 6.2832); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(sx - f * 3.5, y + 2, 3.4, 2.4, 0, 0, 6.2832); ctx.fill(); }
      // body
      ctx.beginPath(); ctx.ellipse(sx, y, 5.6, hop ? 3.4 : 4, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(sx - f * 0.6, y - 1.6, 3.4, 1.8, 0, 0, 6.2832); ctx.fill();
      // throat puffs out as it croaks
      const puff = !hop ? Math.max(0, Math.sin(t * 2.2 + c.seed * 9) * 3 - 2) : 0;
      ctx.fillStyle = belly; circle(ctx, sx + f * 3.4, y + 1.5, 1.6 + puff * puff * 1.8);
      // eyes on top of the head
      for (const ex of [1.4, 4.2]) {
        ctx.fillStyle = light; circle(ctx, sx + f * ex, y - 3.6, 1.7);
        ctx.fillStyle = '#16141c'; circle(ctx, sx + f * (ex + 0.4), y - 3.8, 0.8);
      }
      ctx.restore();
    },
    rabbit(ctx, c, sx, sy) {
      const f = c.face, h = c.hue;
      groundShadow(ctx, sx, sy, 8, c.z, 0.24);
      const y = sy - c.z - 5, stretch = c.state === 'hop' ? 1.5 : 0;
      const fur = `hsl(${h},28%,58%)`, dark = `hsl(${h},24%,44%)`;
      // tail puff
      ctx.fillStyle = '#f4efe6'; circle(ctx, sx - f * (7 + stretch), y - 1, 2.6);
      // body
      ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(sx, y, 7.5 + stretch, 5.2 - stretch * 0.4, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(sx - f * 3, y + 2, 3.6, 2.8, 0, 0, 6.2832); ctx.fill();
      // head
      const hx = sx + f * (6 + stretch), hy = y - 3.5;
      ctx.fillStyle = fur; circle(ctx, hx, hy, 3.8);
      // ears (one twitches now and then)
      const tw = c.ear > 0 ? Math.sin(c.ear * 30) * 0.4 : 0;
      ctx.save(); ctx.translate(hx - f * 1, hy - 2.5);
      for (const [ox, rot] of [[-f * 1.4, -f * 0.25 + tw], [f * 0.8, f * 0.12]]) {
        ctx.save(); ctx.translate(ox, 0); ctx.rotate(rot - (c.state === 'hop' ? f * 0.5 : 0));
        ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, -5, 1.6, 5, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'hsl(350,55%,78%)'; ctx.beginPath(); ctx.ellipse(0, -5, 0.7, 3.6, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = '#1c1a22'; circle(ctx, hx + f * 1.4, hy - 0.6, 0.9);
      ctx.fillStyle = 'hsl(350,55%,72%)'; circle(ctx, hx + f * 3.6, hy + 0.6, 0.8);
    },

    fish(ctx, c, sx, sy) {
      const wig = Math.sin(c.ph) * 0.35, jump = c.state === 'jump';
      ctx.save();
      ctx.translate(sx, sy - c.z);
      let ang = c.dir;
      if (jump) {    // arc up and over, nose first
        const k = c.jt / 0.8, right = Math.cos(c.dir) >= 0;
        ang = right ? -0.9 + k * 1.8 : Math.PI + 0.9 - k * 1.8;
      }
      ctx.rotate(ang);
      const size = 0.8 + c.seed * 0.5;
      ctx.scale(size, size);
      if (jump) {
        ctx.fillStyle = `hsl(${c.hue},70%,62%)`;
      } else {
        ctx.fillStyle = `hsla(${c.hue},45%,28%,.42)`;
      }
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.6, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.lineTo(-10.5, -3 + wig * 6); ctx.lineTo(-10.5, 3 + wig * 6); ctx.closePath(); ctx.fill();
      if (jump) {
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.beginPath(); ctx.ellipse(1, -1, 4, 0.9, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#1c1a22'; circle(ctx, 4.5, -0.6, 0.7);
      }
      ctx.restore();
    },
  };
})();
