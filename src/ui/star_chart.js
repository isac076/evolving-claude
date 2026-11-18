// G.StarChartView — the journal's Stars page (Night 26): a night sky with your
// nine constellations (data in src/data/stars.js). Lit stars glow in their
// constellation's colour and are joined by lines; stars still to earn are faint,
// with a thin ring showing how close you are. Click a constellation to read its
// stars below the sky. The sky twinkles while the page is open (still with
// Calm motion). G.Journal calls html() for the page and mount() right after.
window.G = window.G || {};

(function () {
const COLS = 3;

G.StarChartView = class {
  constructor(state) {
    this.state = state;
    this.sel = null;          // the constellation being read
    this.canvas = null;
    this.dust = [];           // faint background stars: { x, y, r, ph }
    for (let i = 0; i < 170; i++) this.dust.push({ x: G.hash2(i, 3, 2601), y: G.hash2(i, 7, 2602), r: 0.35 + G.hash2(i, 1, 2603) * 0.9, ph: G.hash2(i, 9, 2604) * 6.3 });
  }

  html() {
    const s = this.state, lit = G.StarChart.count(s), all = G.StarChart.total();
    const done = G.CONSTELLATIONS.filter(c => G.StarChart.complete(s, c)).length;
    s.stats.chartOpened = (s.stats.chartOpened || 0) + 1;
    const fresh = s.chart && s.chart.fresh;
    if (!this.sel || fresh !== this.seenFresh) { this.seenFresh = fresh; this.sel = this.pick(); }
    return `<p class="j-note">${lit ? G.STARS_SAYS.note(lit, all, done) : G.STARS_SAYS.empty}</p>
      <canvas id="star-sky" aria-label="Your star chart"></canvas><div id="star-list">${this.list()}</div>`;
  }

  // the constellation to show first: the one with the newest star, else the closest to done
  pick() {
    const s = this.state, chart = this.state.stats.chart || {}, fresh = s.chart && s.chart.fresh;
    const hasFresh = fresh && G.CONSTELLATIONS.find(c => c.stars.some(st => st.id === fresh));
    if (hasFresh) return hasFresh;
    let best = G.CONSTELLATIONS[0], bv = -1;
    for (const c of G.CONSTELLATIONS) {
      const n = c.stars.filter(st => chart[st.id]).length, v = n === c.stars.length ? -0.5 : n / c.stars.length;
      if (v > bv) { bv = v; best = c; }
    }
    return best;
  }

  list() {
    const s = this.state, c = this.sel, chart = s.stats.chart || {};
    let h = `<div class="sc-head" style="--hue:${c.hue}"><b>${c.name}</b><span>${c.about}</span></div>`;
    for (const st of c.stars) {
      const day = chart[st.id], need = G.StarChart.need(st), v = Math.min(need, G.StarChart.value(s, st));
      if (day) h += `<div class="sc-star lit" style="--hue:${c.hue}"><i></i><b>${st.name}</b><span>${st.text}</span><em>day ${day}</em></div>`;
      else h += `<div class="sc-star" style="--hue:${c.hue}"><i></i><b>${st.name}</b><span>${st.text}</span>
        <em>${need > 1 ? `${fmt(v)} / ${fmt(need)}` : 'not yet'}</em>${need > 1 ? `<u style="width:${(v / need * 100).toFixed(1)}%"></u>` : ''}</div>`;
    }
    if (G.StarChart.complete(s, c)) h += `<p class="j-note sc-done">✦ Complete — every star of ${c.name} shines.</p>`;
    return h;
  }

  mount() {
    const cv = document.getElementById('star-sky');
    if (!cv) return;
    this.canvas = cv; this.w = 0;
    cv.onclick = e => this.click(e);
    const loop = () => {
      if (this.canvas !== cv || !cv.isConnected) return;
      this.draw(performance.now() / 1000);
      if (document.getElementById('journal').classList.contains('open')) requestAnimationFrame(loop);
    };
    loop();
  }

  // the box of constellation i inside a w × h sky
  cell(i, w, h) {
    const cw = w / COLS, ch = h / Math.ceil(G.CONSTELLATIONS.length / COLS), cx = (i % COLS) * cw, cy = Math.floor(i / COLS) * ch;
    const px = cw * 0.2, top = ch * 0.12, bottom = 24;
    return { x: cx, y: cy, w: cw, h: ch, ix: cx + px, iy: cy + top, iw: cw - px * 2, ih: ch - top - bottom };
  }

  click(e) {
    const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    G.CONSTELLATIONS.forEach((c, i) => {
      const b = this.cell(i, r.width, r.height);
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h && this.sel !== c) {
        this.sel = c; G.Sound.play('page');
        const el = document.getElementById('star-list'); if (el) el.innerHTML = this.list();
      }
    });
  }

  draw(t) {
    const cv = this.canvas, dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = Math.round(w * 0.6);
    if (w !== this.w) { this.w = w; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    if (!w) return;
    const ctx = cv.getContext('2d'), s = this.state, chart = s.stats.chart || {}, calm = G.calm, tw = calm ? 0 : t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // the sky: deep blue to night, a soft milky band, faint far stars
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, '#1d2350'); bg.addColorStop(0.6, '#10142e'); bg.addColorStop(1, '#070917');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.42);
    for (let i = 0; i < 5; i++) {
      const g = ctx.createRadialGradient((i - 2) * w * 0.2, 0, 2, (i - 2) * w * 0.2, 0, w * 0.22);
      g.addColorStop(0, `rgba(${150 + i * 12},${150 + i * 6},255,.07)`); g.addColorStop(1, 'rgba(150,150,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse((i - 2) * w * 0.2, 0, w * 0.24, h * 0.12, 0, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    for (const d of this.dust) {
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(tw * 1.3 + d.ph);
      ctx.fillStyle = '#dfe6ff'; ctx.beginPath(); ctx.arc(d.x * w, d.y * h, d.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    G.CONSTELLATIONS.forEach((c, i) => {
      const b = this.cell(i, w, h), pos = c.stars.map(st => [b.ix + st.at[0] * b.iw, b.iy + st.at[1] * b.ih]);
      const on = c.stars.map(st => !!chart[st.id]), n = on.filter(Boolean).length, whole = n === c.stars.length;
      if (this.sel === c) {   // a soft glow behind the one being read
        const g = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h * 0.48, 4, b.x + b.w / 2, b.y + b.h * 0.48, b.w * 0.55);
        g.addColorStop(0, `hsla(${c.hue},70%,60%,.16)`); g.addColorStop(1, `hsla(${c.hue},70%,60%,0)`);
        ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      // the lines of the figure
      for (const [a, z] of c.lines) {
        const both = on[a] && on[z];
        ctx.strokeStyle = both ? `hsla(${c.hue},85%,82%,${whole ? 0.75 : 0.5})` : 'rgba(190,200,255,.13)';
        ctx.lineWidth = both ? (whole ? 1.6 : 1.2) : 1;
        ctx.setLineDash(both ? [] : [2, 4]);
        ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[z][0], pos[z][1]); ctx.stroke();
      }
      ctx.setLineDash([]);
      // the stars
      c.stars.forEach((st, k) => {
        const [x, y] = pos[k];
        if (on[k]) {
          const fresh = s.chart && s.chart.fresh === st.id;
          const p = 0.5 + 0.5 * Math.sin(tw * (1.6 + k * 0.37) + i * 2.1 + k);
          const r = (whole ? 13 : 10) + p * 3 + (fresh ? 4 : 0);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `hsla(${c.hue},90%,92%,.95)`); g.addColorStop(0.25, `hsla(${c.hue},90%,72%,.45)`); g.addColorStop(1, `hsla(${c.hue},90%,60%,0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
          const spike = (whole || fresh ? 9 : 6) + p * 2;   // a four-pointed sparkle
          ctx.fillStyle = `hsla(${c.hue},100%,94%,${(0.55 + p * 0.4).toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(x, y - spike); ctx.lineTo(x + 1.1, y - 1.1); ctx.lineTo(x + spike, y); ctx.lineTo(x + 1.1, y + 1.1);
          ctx.lineTo(x, y + spike); ctx.lineTo(x - 1.1, y + 1.1); ctx.lineTo(x - spike, y); ctx.lineTo(x - 1.1, y - 1.1); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 6.2832); ctx.fill();
        } else {
          const need = G.StarChart.need(st), f = Math.min(1, G.StarChart.value(s, st) / need);
          ctx.fillStyle = 'rgba(200,210,255,.32)'; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 6.2832); ctx.fill();
          if (f > 0) {   // how close it is: a thin arc around it
            ctx.strokeStyle = `hsla(${c.hue},70%,75%,.55)`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(x, y, 5, -Math.PI / 2, -Math.PI / 2 + f * 6.2832); ctx.stroke();
          }
        }
      });
      // its name
      ctx.font = `${this.sel === c ? 'italic ' : ''}${w < 420 ? 10.5 : 12.5}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = whole ? `hsl(${c.hue},90%,82%)` : n ? 'rgba(240,232,210,.82)' : 'rgba(200,205,230,.42)';
      ctx.fillText(`${c.name}${whole ? ' ✦' : ''}`, b.x + b.w / 2, b.y + b.h - 8);
    });
  }
};

function fmt(v) { return Math.floor(v).toLocaleString('en'); }
})();
