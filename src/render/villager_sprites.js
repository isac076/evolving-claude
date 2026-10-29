// How lost spirits and villagers are drawn: a little cloaked figure with a
// round face, a hat that shows what they love, and a tiny lantern of their
// own. Lost spirits are grey, see-through and sad; a follower's colour comes
// back as you lead it into restored land. Speech bubbles and the thread of
// light that joins followers to you are drawn on top of everything.
window.G = window.G || {};

(function () {
  const circle = G.circle;

  // ---------- hats (one per VILLAGER_KINDS[...].hat) ----------
  const HATS = G.VILLAGER_HATS = {
    leaf(ctx, x, y, f, v) {        // a sprouting leaf
      ctx.strokeStyle = G.shade(110, 45, 30, f); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y - 4); ctx.stroke();
      const sw = Math.sin(v.ph * 2) * 0.2;
      ctx.fillStyle = G.shade(105, 60, 45, f);
      ctx.beginPath(); ctx.ellipse(x + 3.5, y - 5, 4, 1.8, -0.5 + sw, 0, 6.2832); ctx.fill();
      ctx.fillStyle = G.shade(95, 55, 55, f);
      ctx.beginPath(); ctx.ellipse(x - 2, y - 4, 2.8, 1.4, 0.6 - sw, 0, 6.2832); ctx.fill();
    },
    cap(ctx, x, y, f, v) {         // a flat work cap
      ctx.fillStyle = G.shade(28, 40, 32, f);
      ctx.beginPath(); ctx.ellipse(x, y + 1.5, 6, 3.4, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(x + v.face * 2 - 4, y + 0.5, 8, 2);
      ctx.fillStyle = G.shade(28, 40, 42, f); ctx.fillRect(x - 5, y + 0.5, 10, 1);
    },
    star(ctx, x, y, f, v) {        // a tall dreamy hat with a star
      ctx.fillStyle = G.shade(235, 40, 30, f);
      ctx.beginPath(); ctx.moveTo(x - 6, y + 2); ctx.quadraticCurveTo(x + 1, y - 4, x - v.face * 4, y - 11); ctx.lineTo(x + 6, y + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,230,140,${0.5 + 0.5 * f})`;
      circle(ctx, x - v.face * 4, y - 11, 1.5);
    },
    hood(ctx, x, y, f, v) {        // a traveller's hood over the head
      ctx.fillStyle = G.shade(v.hue, 35, 34, f, 0.95);
      ctx.beginPath(); ctx.arc(x, y + 6, 7.4, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x - v.face * 6, y + 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - v.face * 5, y + 2); ctx.lineTo(x - v.face * 10, y + 5); ctx.lineTo(x - v.face * 6, y + 6); ctx.fill();
    },
    bow(ctx, x, y, f, v) {         // a ribbon bow
      ctx.fillStyle = G.shade(355, 70, 58, f);
      const bx = x + v.face * 3, by = y + 1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 4, by - 3); ctx.lineTo(bx - 4, by + 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by - 3); ctx.lineTo(bx + 4, by + 2); ctx.closePath(); ctx.fill();
      circle(ctx, bx, by, 1.2);
    },
  };

  // (sx, sy) = the spot on the ground under the villager
  G.VILLAGER_SCALE = 1.3;
  G.drawVillager = function (ctx, v, sx, sy, t) {
    const K = G.VILLAGER_SCALE;
    ctx.save();
    ctx.translate(sx, sy); ctx.scale(K, K); ctx.translate(-sx, -sy);
    drawFigure(ctx, v, sx, sy, t);
    ctx.restore();
  };

  function drawFigure(ctx, v, sx, sy, t) {
    const lost = v.mode === 'lost', asleep = v.state === 'sleep';
    const f = lost ? Math.min(v.f, 0.12) : v.f, alpha = lost ? (0.5 + Math.sin(v.ph * 2.3) * 0.08) * v.a : 1;
    const step = v.walking ? Math.sin(v.ph * 11) : 0;
    const float = lost ? 4 + Math.sin(v.ph * 1.6) * 2 : 0;
    const lift = (v.sit || 0) * 19;
    const bob = (v.walking ? Math.abs(step) * 1.8 : Math.sin(v.ph * 2) * 0.5) + float + lift;
    const squash = asleep ? 0.8 : 1;
    const fc = v.face || 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    // shadow
    ctx.fillStyle = `rgba(0,0,10,${lost ? 0.1 : 0.22})`;
    ctx.beginPath(); ctx.ellipse(sx, sy - lift + 1, 8 - float * 0.4, 3, 0, 0, 6.2832); ctx.fill();
    const by = sy - bob;
    // feet
    if (!lost) {
      ctx.fillStyle = G.shade(v.hue, 25, 22, f);
      ctx.beginPath(); ctx.ellipse(sx - 3 + step * 2, by, 2.4, 1.6, 0, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 3 - step * 2, by, 2.4, 1.6, 0, 0, 6.2832); ctx.fill();
    }
    // cloak: a soft bell shape
    const top = by - 17 * squash, body = lost ? 'hsl(230,8%,72%)' : G.shade(v.hue, 52, 50, f);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(sx - 8, by - 1);
    ctx.quadraticCurveTo(sx - 7.5, top + 3, sx, top);
    ctx.quadraticCurveTo(sx + 7.5, top + 3, sx + 8, by - 1);
    if (lost) {   // a ragged, wispy hem
      for (let i = 0; i <= 4; i++) ctx.lineTo(sx + 8 - i * 4, by - 1 + (i % 2 ? -2.5 : 1.5) + Math.sin(v.ph * 3 + i) * 1);
    } else ctx.quadraticCurveTo(sx, by + 1.5, sx - 8, by - 1);
    ctx.closePath(); ctx.fill();
    if (!lost) {   // a lighter trim and a little shading
      ctx.fillStyle = G.shade(v.hue, 45, 64, f);
      ctx.fillRect(sx - 7, by - 4, 14, 1.6);
      ctx.fillStyle = 'rgba(0,0,20,.12)';
      ctx.beginPath(); ctx.ellipse(sx - fc * 4, by - 8 * squash, 2.5, 6 * squash, 0, 0, 6.2832); ctx.fill();
    }
    // face
    const hx = sx + fc * 1.2, hy = top - 2 * squash;
    ctx.fillStyle = lost ? 'hsl(225,10%,84%)' : G.shade(32, 55, 86, Math.max(f, 0.6));
    circle(ctx, hx, hy, 6);
    // eyes
    const ex = hx + fc * 1.5;
    ctx.strokeStyle = ctx.fillStyle = lost ? 'rgba(60,60,80,.8)' : '#3b2c4a';
    if (asleep) {
      ctx.lineWidth = 1;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(ex + s * 2.4, hy, 1.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    } else {
      const blink = Math.sin(v.ph * 0.9 + v.hue) > 0.985 ? 0.25 : 1;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(ex + s * 2.4, hy + (lost ? 0.8 : 0), 1.05, 1.4 * blink, 0, 0, 6.2832); ctx.fill(); }
      if (lost) {   // worried brows
        ctx.lineWidth = 0.8;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ex + s * 1.2, hy - 1.8); ctx.lineTo(ex + s * 3.4, hy - 1); ctx.stroke(); }
      }
    }
    if (!lost && f > 0.4) {   // rosy cheeks once colour is back
      ctx.fillStyle = `rgba(255,120,130,${0.35 * f})`;
      circle(ctx, ex - 4, hy + 2, 1.3); circle(ctx, ex + 4, hy + 2, 1.3);
    }
    // hat (followers get theirs back as the colour returns)
    if (!lost && HATS[v.def.hat]) HATS[v.def.hat](ctx, hx, hy - 6, f, v);

    // their own little lantern, held out on a stick
    if (!lost && !asleep) {
      const lx = sx + fc * 9, ly = by - 9, sw = Math.sin(v.ph * 2.2) * 0.25 + (v.walking ? step * 0.3 : 0);
      ctx.strokeStyle = G.shade(28, 30, 28, f); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx + fc * 5, by - 7); ctx.lineTo(lx, ly - 4); ctx.stroke();
      const ox = lx + Math.sin(sw) * 3, oy = ly + Math.cos(sw) * 3 - 2;
      const glow = 0.35 + 0.65 * f;
      ctx.fillStyle = `hsla(${v.hue + 30},90%,75%,${0.25 * glow})`; circle(ctx, ox, oy, 5);
      ctx.fillStyle = `hsla(${(v.hue + 40) % 360},95%,82%,${glow})`; circle(ctx, ox, oy, 2.2);
    } else if (!lost && asleep) {   // set down beside them, glowing softly
      ctx.fillStyle = `hsla(${(v.hue + 40) % 360},95%,82%,.8)`; circle(ctx, sx + fc * 10, sy - 2, 1.8);
    }

    // what they're busy with
    if (v.state === 'busy' && v.def) {
      const d = v.def.doing;
      if (d === 'tend' || d === 'tinker') {
        const k = (v.ph * (d === 'tinker' ? 3 : 1.4)) % 1;
        ctx.fillStyle = d === 'tinker' ? `rgba(255,220,120,${1 - k})` : `hsla(${v.hue},90%,80%,${1 - k})`;
        const a = v.hue + Math.floor(v.ph * (d === 'tinker' ? 3 : 1.4)) * 2.4;
        circle(ctx, sx + fc * 12 + Math.cos(a) * 4, by - 4 - k * 10, 1.4);
      } else if (d === 'hum') {
        const k = (v.ph * 0.7) % 1;
        ctx.fillStyle = `hsla(${v.hue},70%,85%,${(1 - k) * 0.9})`;
        ctx.font = '11px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillText(Math.floor(v.ph * 0.7) % 2 ? '♪' : '♫', sx + fc * 6 + Math.sin(k * 6) * 4, top - 12 - k * 18);
      }
    }
    if (asleep) {   // z z z
      ctx.fillStyle = 'rgba(230,235,255,.75)'; ctx.font = 'italic 9px Georgia, serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const k = (v.ph * 0.35 + i / 3) % 1;
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
        ctx.fillText('z', sx + 6 + k * 8, top - 6 - k * 16);
      }
    }
    // a little golden sparkle: they have something for you
    if (v.giftReady && !asleep) {
      const k = 0.5 + 0.5 * Math.sin(v.ph * 4);
      ctx.globalAlpha = 0.6 + 0.4 * k;
      ctx.fillStyle = '#ffe9a8';
      const gx = hx, gy = hy - 15 - k * 2;
      ctx.beginPath(); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + 1.2, gy - 1.2); ctx.lineTo(gx + 4, gy); ctx.lineTo(gx + 1.2, gy + 1.2);
      ctx.lineTo(gx, gy + 4); ctx.lineTo(gx - 1.2, gy + 1.2); ctx.lineTo(gx - 4, gy); ctx.lineTo(gx - 1.2, gy - 1.2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // lost spirits shed faint pale motes
    if (lost) {
      ctx.fillStyle = `rgba(225,228,255,${0.35 * v.a})`;
      for (let i = 0; i < 3; i++) {
        const k = (v.ph * 0.4 + i / 3) % 1;
        circle(ctx, sx + Math.sin(v.ph + i * 2) * 8, by - 8 - k * 26, 1.2 * (1 - k));
      }
    }
  }

  // ---------- drawn over everything (after the night lighting) ----------
  // a gentle thread of light from you to each follower
  G.drawFollowThreads = function (ctx, player, followers, camX, camY, t) {
    if (!followers.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash([2, 5]); ctx.lineDashOffset = -t * 14; ctx.lineCap = 'round';
    let a = player;
    for (const v of followers) {
      const x0 = a.x - camX, y0 = a.y - camY - 10, x1 = v.x - camX, y1 = v.y - camY - 12;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + 10 + Math.sin(t * 2 + v.ph) * 3;
      ctx.strokeStyle = `rgba(255,220,150,${0.25 + 0.2 * v.f})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
      a = v;
    }
    ctx.restore();
  };

  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // a paper speech bubble above someone's head
  G.drawSpeech = function (ctx, v, sx, sy, W, H) {
    if (!v.say) return;
    const lost = v.mode === 'lost';
    const a = Math.min(1, v.sayT * 2.5);
    ctx.save();
    ctx.font = (lost ? 'italic ' : '') + '12px Georgia, serif';
    const lines = wrap(ctx, v.say, 170);
    const lh = 15, name = lost ? '' : v.name;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width), name ? 40 : 0) + 18;
    const h = lines.length * lh + (name ? 14 : 0) + 10;
    let bx = sx - w / 2, byy = sy - 46 - (v.sit || 0) * 24 - h;
    bx = G.clamp(bx, 8, W - w - 8); byy = Math.max(8, byy);
    ctx.globalAlpha = a;
    ctx.fillStyle = lost ? 'rgba(210,214,232,.82)' : 'rgba(255,248,232,.94)';
    ctx.strokeStyle = lost ? 'rgba(120,125,160,.5)' : `hsla(${v.hue},45%,55%,.7)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, byy, w, h, 9); else ctx.rect(bx, byy, w, h);
    ctx.fill(); ctx.stroke();
    // tail
    const tx = G.clamp(sx, bx + 12, bx + w - 12);
    ctx.beginPath(); ctx.moveTo(tx - 5, byy + h - 0.5); ctx.lineTo(sx, byy + h + 7); ctx.lineTo(tx + 5, byy + h - 0.5); ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let y = byy + 6;
    if (name) {
      ctx.font = '600 10px Georgia, serif'; ctx.fillStyle = `hsl(${v.hue},45%,38%)`;
      ctx.fillText(name.toUpperCase(), bx + 9, y); y += 14;
      ctx.font = '12px Georgia, serif';
    }
    ctx.fillStyle = lost ? '#4a4d66' : '#3b2c4a';
    for (const l of lines) { ctx.fillText(l, bx + 9, y); y += lh; }
    ctx.restore();
  };
})();
