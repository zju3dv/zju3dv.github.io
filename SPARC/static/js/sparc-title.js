/*
 * <sparc-title> — animated SPARC wordmark.
 * Five clay cubes (5x5 token grids) are carved by a pair of scissors into the
 * letters S P A R C; pruned tokens fly away, the remaining ones light up.
 *
 * Usage:
 *   <script src="sparc-title.js"></script>
 *   <sparc-title></sparc-title>
 * Size via CSS:   sparc-title { --cell: 20px; }
 * Replay:         click the title, or call element.play()
 */
(() => {
  const GLYPHS = {
    S: ['.####', '#....', '.###.', '....#', '####.'],
    P: ['####.', '#...#', '####.', '#....', '#....'],
    A: ['.###.', '#...#', '#####', '#...#', '#...#'],
    R: ['####.', '#...#', '####.', '#..#.', '#...#'],
    C: ['.####', '#....', '#....', '#....', '.####'],
  };
  const WORD = 'SPARC';
  const PALETTE = [
    [356, 85, 66],
    [36, 95, 58],
    [168, 58, 46],
    [222, 86, 64],
    [266, 68, 64],
  ];
  const ROT_CUBE = [-24, -30, 1];
  const ROT_FINAL = [-12, 16, 0.4];
  const GAP_FINAL = 1.4;
  const FACES = ['f', 'k', 't', 'b', 'l', 'r'];

  const CSS = `
:host{display:block;overflow-x:clip;--cell:clamp(9px,2.3vw,24px);--depth:calc(var(--cell)*5);
  --grid:rgba(40,30,60,.13);
  --clay-f:#EFE8DC;--clay-t:#FBF8F2;--clay-l:#E3DACB;--clay-r:#D3C7B4;--clay-b:#C5B8A4;
  -webkit-tap-highlight-color:transparent}
.stage{position:relative;display:flex;justify-content:center;align-items:center;
  gap:calc(var(--cell)*2.9);padding:calc(var(--cell)*2.6) var(--cell) calc(var(--cell)*3);
  perspective:calc(var(--cell)*70);perspective-origin:50% 40%;
  cursor:pointer;user-select:none;-webkit-user-select:none}
.slot{position:relative;flex:none;width:calc(var(--cell)*5);height:calc(var(--cell)*5);transform-style:preserve-3d}
.shadow{position:absolute;left:50%;top:100%;width:calc(var(--cell)*7);height:calc(var(--cell)*1.5);
  margin:calc(var(--cell)*.9) 0 0 calc(var(--cell)*-3.5);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(30,20,50,.22),rgba(30,20,50,0))}
.bob,.letter{position:absolute;inset:0;transform-style:preserve-3d}
.cell{position:absolute;width:var(--cell);height:var(--cell);transform-style:preserve-3d;
  left:calc(var(--cell)*var(--c));top:calc(var(--cell)*var(--r))}
.face{position:absolute;left:0;top:0;width:var(--cell);height:var(--cell);box-sizing:border-box;
  backface-visibility:hidden;-webkit-backface-visibility:hidden;
  box-shadow:inset 0 0 0 .5px var(--grid);transition:background-color .5s ease var(--d,0s)}
.f,.k{background-color:var(--clay-f)}
.f{transform:translateZ(calc(var(--depth)/2))}
.k{transform:rotateY(180deg) translateZ(calc(var(--depth)/2))}
.l,.r{width:var(--depth);left:calc((var(--cell) - var(--depth))/2);
  background-image:repeating-linear-gradient(to right,var(--grid) 0 1px,transparent 1px var(--cell))}
.l{background-color:var(--clay-l);transform:rotateY(-90deg) translateZ(calc(var(--cell)/2))}
.r{background-color:var(--clay-r);transform:rotateY(90deg) translateZ(calc(var(--cell)/2))}
.t,.b{height:var(--depth);top:calc((var(--cell) - var(--depth))/2);
  background-image:repeating-linear-gradient(to bottom,var(--grid) 0 1px,transparent 1px var(--cell))}
.t{background-color:var(--clay-t);transform:rotateX(90deg) translateZ(calc(var(--cell)/2))}
.b{background-color:var(--clay-b);transform:rotateX(-90deg) translateZ(calc(var(--cell)/2))}
.lit .on .f,.lit .on .k{background-color:var(--lf)}
.lit .on .t{background-color:var(--lt)}
.lit .on .l{background-color:var(--ll)}
.lit .on .r{background-color:var(--lr)}
.lit .on .b{background-color:var(--lb)}
.scissors{position:absolute;left:0;top:0;width:calc(var(--cell)*6.4);z-index:5;pointer-events:none;
  opacity:0;filter:drop-shadow(0 calc(var(--cell)*.3) 0 rgba(30,20,50,.16))}
.scissors svg{display:block;width:100%;height:auto;overflow:visible}
.fx{position:absolute;left:0;top:0;pointer-events:none;z-index:6}
.slash{position:absolute;left:0;top:-2px;height:4px;border-radius:4px;
  background:linear-gradient(90deg,rgba(255,255,255,0),#fff 25%,#FFD54A 50%,#fff 75%,rgba(255,255,255,0));
  box-shadow:0 0 10px rgba(255,190,40,.85)}
.spark{position:absolute;left:0;top:-1.5px;height:3px;border-radius:3px;background:#2B2D42}
.idle .bob{animation:float 3.4s ease-in-out infinite;animation-delay:calc(var(--i)*-.45s)}
.idle .shadow{animation:shade 3.4s ease-in-out infinite;animation-delay:calc(var(--i)*-.45s)}
@keyframes float{50%{transform:translateY(calc(var(--cell)*-.3))}}
@keyframes shade{50%{transform:scale(.88);opacity:.75}}
@media (prefers-reduced-motion:reduce){.face{transition:none}}
`;

  const SCISSORS_HALF = `
    <path d="M62 60 L36 84" stroke="#2B2D42" stroke-width="13" stroke-linecap="round"/>
    <path d="M62 60 L36 84" stroke="#FF5D73" stroke-width="7" stroke-linecap="round"/>
    <circle cx="28" cy="91" r="14" fill="none" stroke="#2B2D42" stroke-width="13"/>
    <circle cx="28" cy="91" r="14" fill="none" stroke="#FF5D73" stroke-width="7"/>
    <path d="M54 60 L152 60 Q132 45 76 47 Q57 49 54 60 Z" fill="#E9EEF6" stroke="#2B2D42" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M78 52 Q112 50 134 55" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  const SCISSORS_SVG = `
<svg viewBox="0 0 160 120" aria-hidden="true">
  <g class="ha"><g>${SCISSORS_HALF}</g></g>
  <g class="hb"><g transform="matrix(1 0 0 -1 0 120)">${SCISSORS_HALF}</g></g>
  <circle cx="62" cy="60" r="6" fill="#FFC93C" stroke="#2B2D42" stroke-width="3"/>
</svg>`;
  const SC_W = 160, SC_H = 120, SC_TIP = [112, 60], SC_PIVOT = [62, 60];

  const ease = {
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hsl = (h, s, l) => `hsl(${h} ${s}% ${Math.max(0, Math.min(100, l))}%)`;
  const rot = ([x, y, z = 1]) => `rotateX(${x}deg) rotateY(${y}deg) scale3d(1,1,${z})`;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const el = (tag, cls) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };

  class SparcTitle extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._run = 0;
    }

    connectedCallback() {
      if (!this.stage) {
        this.shadowRoot.innerHTML = `<style>${CSS}</style>`;
        this.stage = el('div', 'stage');
        this.stage.setAttribute('role', 'img');
        this.stage.setAttribute('aria-label', 'SPARC');
        this.stage.setAttribute('part', 'stage');
        this.stage.addEventListener('click', () => this.play());
        this.shadowRoot.appendChild(this.stage);
      }
      requestAnimationFrame(() => this.play());
    }

    disconnectedCallback() {
      this._run++;
    }

    build() {
      const stage = this.stage;
      stage.getAnimations().forEach(a => a.cancel());
      stage.textContent = '';
      stage.classList.remove('idle');
      stage.style.gap = '';
      this.slots = [...WORD].map((ch, i) => {
        const g = GLYPHS[ch];
        const on = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5 && g[r][c] === '#';
        const slot = el('div', 'slot');
        const shadow = el('div', 'shadow');
        const bob = el('div', 'bob');
        const letter = el('div', 'letter');
        const [h, s, l] = PALETTE[i];
        slot.style.setProperty('--i', i);
        letter.style.cssText =
          `--lf:${hsl(h, s, l)};--lt:${hsl(h, s, l + 13)};--ll:${hsl(h, s, l - 5)};` +
          `--lr:${hsl(h, s, l - 13)};--lb:${hsl(h, s, l - 20)};transform:${rot(ROT_CUBE)}`;
        const debris = [[], []];
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            const keep = on(r, c);
            const cell = el('div', keep ? 'cell on' : 'cell');
            cell.style.cssText = `--r:${r};--c:${c};--d:${(c * 0.045 + r * 0.02).toFixed(3)}s`;
            const exposed = {
              f: true, k: true,
              t: !on(r - 1, c), b: !on(r + 1, c), l: !on(r, c - 1), r: !on(r, c + 1),
            };
            for (const f of FACES) if (!keep || exposed[f]) cell.appendChild(el('div', 'face ' + f));
            letter.appendChild(cell);
            if (!keep) debris[c <= 2 ? 0 : 1].push({ node: cell, r, c });
          }
        }
        bob.appendChild(letter);
        slot.append(shadow, bob);
        slot.addEventListener('pointerenter', () => {
          if (stage.classList.contains('idle')) this.hop(this.slots[i]);
        });
        stage.appendChild(slot);
        return { slot, shadow, bob, letter, debris };
      });

      this.sc = el('div', 'scissors');
      this.sc.innerHTML = SCISSORS_SVG;
      this.scA = this.sc.querySelector('.ha');
      this.scB = this.sc.querySelector('.hb');
      this.fx = el('div', 'fx');
      stage.append(this.sc, this.fx);
    }

    cellSize() {
      return this.slots[0].slot.getBoundingClientRect().width / 5;
    }

    async play() {
      const run = ++this._run;
      const alive = () => run === this._run && this.isConnected;
      this.build();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return this.settle();

      const cell = this.cellSize();
      const stagger = 90;
      this.slots.forEach((s, i) => {
        const opt = { delay: i * stagger, fill: 'backwards' };
        s.bob.animate(
          [{ transform: `translateY(${-4 * cell}px) scale(.3)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { ...opt, duration: 750, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        s.letter.animate(
          [{ transform: rot([ROT_CUBE[0], ROT_CUBE[1] - 120, 1]) }, { transform: rot(ROT_CUBE) }],
          { ...opt, duration: 950, easing: 'cubic-bezier(.22,1.2,.36,1)' });
        s.shadow.animate(
          [{ transform: 'scale(0)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { ...opt, duration: 700, easing: 'ease-out' });
      });
      await wait(950 + 4 * stagger - 250);
      if (!alive()) return;

      const first = this.cutPoint(0, 0);
      this.scState = { x: -this.scWidth(), y: first.y - 3 * cell, a: 40, open: 30 };
      this.sc.style.opacity = 1;
      this.drawScissors();

      for (let i = 0; i < this.slots.length; i++) {
        for (let k = 0; k < 2; k++) {
          const p = this.cutPoint(i, k);
          const longHop = k === 0;
          await this.moveScissors(p, longHop ? (i === 0 ? 200 : 130) : 85, longHop ? 1.1 * cell : 0.3 * cell, alive);
          if (!alive()) return;
          await this.snip(i, k, alive);
          if (!alive()) return;
        }
      }
      await this.finale(alive);
    }

    scWidth() {
      return this.sc.getBoundingClientRect().width || this.cellSize() * 6.4;
    }

    cutPoint(i, k) {
      const sr = this.stage.getBoundingClientRect();
      const r = this.slots[i].slot.getBoundingClientRect();
      return {
        x: r.left - sr.left + r.width * (k ? 0.76 : 0.28),
        y: r.top - sr.top + r.height * (k ? 0.58 : 0.4),
        a: k ? 12 : 26,
      };
    }

    drawScissors() {
      const { x, y, a, open } = this.scState;
      const w = this.scWidth();
      const s = w / SC_W;
      const ox = SC_TIP[0] * s, oy = SC_TIP[1] * s;
      this.sc.style.transformOrigin = `${ox}px ${oy}px`;
      this.sc.style.transform = `translate(${x - ox}px,${y - oy}px) rotate(${a}deg)`;
      this.scA.setAttribute('transform', `rotate(${-open} ${SC_PIVOT[0]} ${SC_PIVOT[1]})`);
      this.scB.setAttribute('transform', `rotate(${open} ${SC_PIVOT[0]} ${SC_PIVOT[1]})`);
    }

    tween(dur, fn, alive, easing = ease.inOut) {
      return new Promise(resolve => {
        const t0 = performance.now();
        const step = now => {
          if (!alive()) return resolve();
          const t = Math.min(1, (now - t0) / dur);
          fn(easing(t), t);
          t < 1 ? requestAnimationFrame(step) : resolve();
        };
        requestAnimationFrame(step);
      });
    }

    moveScissors(to, dur, arc, alive) {
      const from = { ...this.scState };
      return this.tween(dur, (e, t) => {
        this.scState.x = lerp(from.x, to.x, e);
        this.scState.y = lerp(from.y, to.y, e) - arc * Math.sin(Math.PI * t);
        this.scState.a = lerp(from.a, to.a, e);
        this.scState.open = lerp(from.open, 32, e);
        this.drawScissors();
      }, alive);
    }

    async snip(i, k, alive) {
      const o0 = this.scState.open;
      await this.tween(45, e => { this.scState.open = lerp(o0, 0, e); this.drawScissors(); }, alive, ease.in);
      if (!alive()) return;

      const s = this.slots[i];
      const cell = this.cellSize();
      this.cutFx(this.scState, cell);
      this.launch(s.debris[k], cell, k ? 1 : -1);
      s.bob.animate(
        [{ transform: 'none' }, { transform: `translateX(${(k ? 1 : -1) * cell * 0.15}px) scale(1.05,.93)` }, { transform: 'none' }],
        { duration: 160, easing: 'ease-out' });
      if (k === 1) s.letter.classList.add('lit');

      await this.tween(60, e => { this.scState.open = lerp(0, 28, e); this.drawScissors(); }, alive, ease.out);
    }

    cutFx({ x, y, a }, cell) {
      const len = cell * 7;
      const slash = el('div', 'slash');
      slash.style.width = `${len}px`;
      this.fx.appendChild(slash);
      const base = `translate(${x}px,${y}px) rotate(${a}deg) translateX(${-len / 2}px)`;
      slash.animate(
        [{ transform: `${base} scaleX(0)`, opacity: 1, transformOrigin: '0 50%' },
         { transform: `${base} scaleX(1)`, opacity: 1, offset: 0.45, transformOrigin: '0 50%' },
         { transform: `${base} scaleX(1)`, opacity: 0, transformOrigin: '0 50%' }],
        { duration: 340, easing: 'ease-out' }).onfinish = () => slash.remove();

      const tip = (SC_TIP[0] - SC_PIVOT[0]) / SC_W * this.scWidth() * 0.15;
      const cx = x + Math.cos(a * Math.PI / 180) * tip;
      const cy = y + Math.sin(a * Math.PI / 180) * tip;
      [-55, -15, 25].forEach(d => {
        const sp = el('div', 'spark');
        const w = cell * 0.75;
        sp.style.width = `${w}px`;
        this.fx.appendChild(sp);
        const ang = a + d - 90;
        const at = r => `translate(${cx}px,${cy}px) rotate(${ang}deg) translateX(${r}px)`;
        sp.animate(
          [{ transform: `${at(cell * 0.8)} scaleX(.2)`, opacity: 1 },
           { transform: `${at(cell * 1.6)} scaleX(1)`, opacity: 1, offset: 0.5 },
           { transform: `${at(cell * 2.3)} scaleX(.3)`, opacity: 0 }],
          { duration: 300, easing: 'ease-out' }).onfinish = () => sp.remove();
      });
    }

    launch(items, cell, side) {
      for (const { node, r, c } of items) {
        const vx = ((c - 2) * 0.7 + side * 0.5 + rand(-0.5, 0.5)) * cell * 1.7;
        const vy = (-rand(2, 3.6) + (r - 2) * 0.35) * cell;
        const vz = rand(2, 6) * cell;
        const g = 11 * cell;
        const rx = rand(-340, 340), ry = rand(-340, 340), rz = rand(-200, 200);
        const frames = [];
        for (let j = 0; j <= 12; j++) {
          const t = j / 12;
          frames.push({
            transform: `translate3d(${vx * t}px,${vy * t + g * t * t}px,${vz * t}px) ` +
              `rotateX(${rx * t}deg) rotateY(${ry * t}deg) rotateZ(${rz * t}deg) scale(${1 - 0.35 * t})`,
            opacity: t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4),
          });
        }
        node.animate(frames, { duration: rand(750, 1050), delay: rand(0, 50), fill: 'forwards' })
          .onfinish = () => node.remove();
      }
    }

    hop(s, delay = 0) {
      const c = this.cellSize();
      const opt = { duration: 700, delay, easing: 'ease-in-out' };
      s.bob.animate([
        { transform: 'none' },
        { transform: `translateY(${c * 0.25}px) scale(1.06,.9)`, offset: 0.15 },
        { transform: `translateY(${-c * 1.1}px) scale(.96,1.05)`, offset: 0.5 },
        { transform: `translateY(${c * 0.15}px) scale(1.05,.94)`, offset: 0.82 },
        { transform: 'none' },
      ], opt);
      s.shadow.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'scale(.6)', opacity: 0.45, offset: 0.5 },
        { transform: 'none', opacity: 1 },
      ], opt);
    }

    async finale(alive) {
      const from = { ...this.scState };
      const exitX = this.stage.getBoundingClientRect().width + this.scWidth();
      const exit = this.tween(520, e => {
        this.scState.x = lerp(from.x, exitX, e);
        this.scState.y = lerp(from.y, from.y - this.cellSize() * 5, e);
        this.scState.a = lerp(from.a, from.a - 300, e);
        this.drawScissors();
        this.sc.style.opacity = 1 - e * e;
      }, alive, ease.in);

      const tighten = this.stage.animate(
        [{ gap: getComputedStyle(this.stage).columnGap }, { gap: `${this.cellSize() * GAP_FINAL}px` }],
        { duration: 1000, delay: 120, easing: 'cubic-bezier(.34,1.3,.5,1)', fill: 'forwards' });
      tighten.finished.then(() => {
        this.stage.style.gap = `calc(var(--cell)*${GAP_FINAL})`;
        tighten.cancel();
      }).catch(() => {});

      this.slots.forEach((s, i) => {
        const anim = s.letter.animate(
          [{ transform: rot(ROT_CUBE) }, { transform: rot(ROT_FINAL) }],
          { duration: 1000, delay: 120 + i * 80, easing: 'cubic-bezier(.34,1.45,.5,1)', fill: 'forwards' });
        anim.finished.then(() => {
          s.letter.style.transform = rot(ROT_FINAL);
          anim.cancel();
        }).catch(() => {});
        this.hop(s, 120 + i * 80);
      });

      await exit;
      this.sc.style.display = 'none';
      await wait(1100);
      if (alive()) this.stage.classList.add('idle');
    }

    settle() {
      this.stage.style.gap = `calc(var(--cell)*${GAP_FINAL})`;
      for (const s of this.slots) {
        s.debris.flat().forEach(d => d.node.remove());
        s.letter.classList.add('lit');
        s.letter.style.transform = rot(ROT_FINAL);
      }
      this.sc.remove();
    }
  }

  if (!customElements.get('sparc-title')) customElements.define('sparc-title', SparcTitle);
})();
