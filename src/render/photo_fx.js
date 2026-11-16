// G.PhotoFX — the looks of photo mode (Night 24): filters laid over the finished
// frame with canvas blend modes, and frames around it (a soft edge, cinema bars,
// a keepsake card with where and when written on it). Drawn into the game canvas
// itself, so the photo you keep is exactly what you saw.
window.G = window.G || {};

(function () {
let buf = null, grain = null;

// a small copy of the picture, smoothed back up: a cheap soft bloom
function bloom(ctx, W, H, a) {
  const c = ctx.canvas, bw = Math.max(8, Math.round(W / 7)), bh = Math.max(8, Math.round(H / 7));
  if (!buf) buf = document.createElement('canvas');
  if (buf.width !== bw || buf.height !== bh) { buf.width = bw; buf.height = bh; }
  const b = buf.getContext('2d');
  b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
  b.clearRect(0, 0, bw, bh);
  b.drawImage(c, 0, 0, c.width, c.height, 0, 0, bw, bh);
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a;
  ctx.drawImage(buf, 0, 0, W, H);
  ctx.globalAlpha = a * 0.5;
  ctx.drawImage(buf, -W * 0.02, -H * 0.02, W * 1.04, H * 1.04);   // a second, wider halo
  ctx.restore();
}

// film grain: one small noise tile, shifted a little each frame
function grainTile() {
  if (grain) return grain;
  grain = document.createElement('canvas'); grain.width = grain.height = 96;
  const g = grain.getContext('2d'), img = g.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 120;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return grain;
}

function fill(ctx, op, style, W, H, a = 1) {
  ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = style; ctx.fillRect(0, 0, W, H);
}
function radial(ctx, x, y, r0, r1, c0, c1) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
}

G.PhotoFX = {
  // lay a filter over the whole picture (logical size W×H, the canvas transform already set)
  filter(ctx, id, W, H, time) {
    if (!id || id === 'natural') return;
    ctx.save();
    const M = Math.max(W, H);
    if (id === 'golden') {
      fill(ctx, 'soft-light', 'rgb(255,168,78)', W, H, 0.6);
      fill(ctx, 'screen', radial(ctx, W * 0.86, -H * 0.12, 0, M * 0.95, 'rgba(255,206,130,.42)', 'rgba(255,170,90,0)'), W, H);
      fill(ctx, 'multiply', radial(ctx, W / 2, H / 2, M * 0.35, M * 0.8, 'rgba(255,255,255,0)', 'rgba(150,80,40,.35)'), W, H);
    } else if (id === 'dream') {
      ctx.restore(); bloom(ctx, W, H, 0.5); ctx.save();
      fill(ctx, 'soft-light', 'rgb(255,214,240)', W, H, 0.45);
      fill(ctx, 'screen', 'rgb(70,50,90)', W, H, 0.18);
      fill(ctx, 'screen', radial(ctx, W * 0.5, H * 0.42, 0, M * 0.6, 'rgba(255,240,250,.14)', 'rgba(255,240,250,0)'), W, H);
    } else if (id === 'moon') {
      fill(ctx, 'multiply', 'rgb(118,140,212)', W, H, 0.9);
      fill(ctx, 'screen', 'rgb(24,34,80)', W, H, 0.4);
      fill(ctx, 'screen', radial(ctx, W * 0.2, -H * 0.1, 0, M * 0.8, 'rgba(200,220,255,.28)', 'rgba(200,220,255,0)'), W, H);
    } else if (id === 'old') {
      fill(ctx, 'saturation', 'hsl(0,0%,50%)', W, H, 0.88);   // the grey of the Fading…
      fill(ctx, 'soft-light', 'rgb(196,150,96)', W, H, 0.75);  // …kept like an old sepia print
      fill(ctx, 'multiply', radial(ctx, W / 2, H / 2, M * 0.3, M * 0.78, 'rgba(255,255,255,0)', 'rgba(90,60,30,.55)'), W, H);
      const pat = ctx.createPattern(grainTile(), 'repeat'), still = G.calm;
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16;
      ctx.translate(still ? 0 : (time * 997) % 96, still ? 0 : (time * 613) % 96);
      ctx.fillStyle = pat; ctx.fillRect(-96, -96, W + 192, H + 192);
    }
    ctx.restore();
  },

  // the frame around the picture; cap = { place, when } for frames that write on it
  frame(ctx, id, W, H, cap) {
    if (!id || id === 'none') return;
    ctx.save();
    const M = Math.max(W, H), S = Math.min(W, H);
    if (id === 'soft') {
      ctx.fillStyle = radial(ctx, W / 2, H / 2, S * 0.36, M * 0.72, 'rgba(10,8,24,0)', 'rgba(10,8,24,.78)');
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';   // a faint warm light-leak in one corner
      ctx.fillStyle = radial(ctx, W * 0.04, H * 0.96, 0, S * 0.5, 'rgba(255,150,90,.22)', 'rgba(255,150,90,0)');
      ctx.fillRect(0, 0, W, H);
    } else if (id === 'wide') {
      const bar = W > H * 1.2 ? Math.max(H * 0.08, (H - W / 2.35) / 2) : H * 0.1;   // a tall phone screen keeps more picture
      ctx.fillStyle = '#07070f';
      ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
      if (cap) {
        const fs = Math.max(11, Math.min(17, bar * 0.3)), y = H - bar / 2;
        ctx.textBaseline = 'middle';
        ctx.font = `${fs}px Georgia, serif`; ctx.fillStyle = '#ffe2a0'; ctx.textAlign = 'left';
        spaced(ctx, cap.place.toUpperCase(), Math.max(16, W * 0.04), y, fs * 0.22);
        ctx.font = `italic ${fs * 0.9}px Georgia, serif`; ctx.fillStyle = 'rgba(247,236,210,.62)'; ctx.textAlign = 'right';
        ctx.fillText(cap.when, W - Math.max(16, W * 0.04), y);
      }
    } else if (id === 'card') {
      const m = Math.max(12, S * 0.035), foot = Math.max(m * 2.6, 44);
      const inner = [m, m, W - 2 * m, H - m - foot];
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(inner[0], inner[1], inner[2], inner[3]);
      const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
      g.addColorStop(0, '#f8f1e2'); g.addColorStop(1, '#ece0c8');
      ctx.fillStyle = g; ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(90,64,30,.28)'; ctx.lineWidth = 1;   // the edge of the print
      ctx.strokeRect(inner[0] - 0.5, inner[1] - 0.5, inner[2] + 1, inner[3] + 1);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(inner[0], inner[1], inner[2], 3);   // a soft inner shadow under the top edge
      if (cap) {
        const fs = Math.max(13, Math.min(22, foot * 0.36)), y = H - foot / 2;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.font = `italic ${fs}px Georgia, serif`; ctx.fillStyle = '#5a4026';
        ctx.fillText(cap.place, m + 4, y - fs * 0.32);
        ctx.font = `${fs * 0.62}px Georgia, serif`; ctx.fillStyle = 'rgba(90,64,38,.7)';
        ctx.fillText(cap.when, m + 4, y + fs * 0.62);
        lanternMark(ctx, W - m - 14, y, fs * 0.9);
      }
    }
    ctx.restore();
  },
};

// letters drawn one by one with a little space between them (canvas letterSpacing isn't everywhere yet)
function spaced(ctx, s, x, y, gap) {
  for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + gap; }
}

// a tiny inked lantern, the game's mark, in the corner of a keepsake card
function lanternMark(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
  ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(0, -10); ctx.lineTo(3, -6); ctx.stroke();
  ctx.fillStyle = 'rgba(232,170,70,.85)';
  ctx.beginPath(); ctx.ellipse(0, 1, 2.4, 3.4, 0, 0, 6.283); ctx.fill();
  ctx.restore();
}
})();
