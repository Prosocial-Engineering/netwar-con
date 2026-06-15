/* The Last Psyop — infohazard gate
 *
 *  - eyelid shut until the cursor moves; pupil tracks the cursor (Big Brother)
 *  - the closer the cursor, the redder / more intense (iris reddens, pupil
 *    dilates, red "dread" wash, the whole sign jitters)
 *  - click the void: nothing.  click the EYE: lights snap shut → enter the site
 *  - settings (Cmd/Ctrl+Shift+L, ESC / ✕ to close):
 *      ASCII render · Invert colors · Biohazard symbol · Info-"i" pupil · Eye explodes
 */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const splash = $('splash'), main = $('main'), hazard = $('hazard');
  const lid = $('lid'), gaze = $('gaze'), eyeHit = $('eyeHit'), crease = $('crease');
  const pupil = $('pupil'), hint = $('hint'), ascii = $('ascii'), boom = $('boom');
  const settings = $('settings'), closeBtn = $('closeSettings');
  const tAscii = $('t-ascii'), tInvert = $('t-invert'), tGlow = $('t-glow'), tBio = $('t-bio'),
        tInfoi = $('t-infoi'), tExplode = $('t-explode');
  const irisStops = ['s0', 's1', 's2', 's3'].map($);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- geometry (SVG viewBox is 600 × 560) ---- */
  const EX = 300, EY = 355;
  const GAZE_X = 34, GAZE_Y = 20, REACH = 260;
  const INT_FAR = 250, INT_NEAR = 26;
  const IDLE_CLOSE_MS = 2800;
  const EASE_OPEN = reduce ? 1 : 0.16, EASE_GAZE = reduce ? 1 : 0.14;

  /* ---- colour helpers ---- */
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const COOL = ['#fdffc2', '#eaff00', '#5c6d00', '#161a00'].map(hex);  // calm yellow iris
  const HOT  = ['#ffe3d6', '#ff2a00', '#5e0a00', '#180200'].map(hex);  // hot red iris
  const INV  = ['#fff36a', '#f2dd00', '#dcc600', '#cdb800'];           // invert: yellow eye
  const GLOW_COOL = hex('#eaff00'), GLOW_HOT = hex('#ff1500');

  /* ---- state ---- */
  let openness = 0, targetOpen = reduce ? 1 : 0;
  let gx = 0, gy = 0, tgx = 0, tgy = 0;
  let intensity = 0, targetInt = 0;
  let idleTimer = null, shuttingDown = false, entered = false;

  function toSvg(cx, cy) {
    const r = hazard.getBoundingClientRect();
    const s = Math.min(r.width / 600, r.height / 560);
    return { x: (cx - r.left - (r.width - 600 * s) / 2) / s,
             y: (cy - r.top  - (r.height - 560 * s) / 2) / s };
  }
  // exact on-screen centre of the eye — anchors the explosion to the eye itself
  function eyeCenterScreen() {
    const r = eyeHit.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onMove(e) {
    if (shuttingDown || entered) return;
    const p = toSvg(e.clientX, e.clientY);
    const dx = p.x - EX, dy = p.y - EY, len = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, len / REACH);
    tgx = (dx / len) * GAZE_X * reach;
    tgy = (dy / len) * GAZE_Y * reach;
    targetOpen = 1;
    targetInt = Math.max(0, Math.min(1, (INT_FAR - len) / (INT_FAR - INT_NEAR))) ** 2;
    if (!reduce) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!shuttingDown) { targetOpen = 0; targetInt = 0; } }, IDLE_CLOSE_MS);
    }
  }

  function applyIntensity(t) {
    const invert = body.classList.contains('invert');
    for (let i = 0; i < 4; i++)
      irisStops[i].setAttribute('stop-color', invert ? INV[i] : toHex(mix(COOL[i], HOT[i], t)));
    pupil.setAttribute('r', (20 + t * 9).toFixed(1));
    gaze.style.filter = (shuttingDown || invert) ? 'none'
      : `drop-shadow(0 0 ${(6 + t * 22).toFixed(0)}px ${toHex(mix(GLOW_COOL, GLOW_HOT, t))})`;
    splash.style.setProperty('--dread', (t * 0.6).toFixed(3));
    ascii.style.color = invert ? '#141414' : toHex(mix(GLOW_COOL, GLOW_HOT, t));
    if (!reduce && !shuttingDown && t > 0.18) {
      const j = t * t * 5;
      const tf = `translate(${((Math.random() - .5) * j).toFixed(1)}px,${((Math.random() - .5) * j).toFixed(1)}px)`;
      hazard.style.transform = tf; ascii.style.transform = tf;
    } else { hazard.style.transform = ''; ascii.style.transform = ''; }
  }

  function tick() {
    intensity += ((shuttingDown ? 0 : targetInt) - intensity) * 0.12;
    openness += (targetOpen - openness) * EASE_OPEN;
    if (Math.abs(targetOpen - openness) < 0.001) openness = targetOpen;
    gx += (tgx - gx) * EASE_GAZE;
    gy += (tgy - gy) * EASE_GAZE;

    const lidT = `translate(${EX} ${EY}) scale(1 ${openness.toFixed(4)}) translate(${-EX} ${-EY})`;
    lid.setAttribute('transform', lidT);
    gaze.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
    crease.style.opacity = (1 - Math.min(1, openness * 1.25)).toFixed(3);

    applyIntensity(intensity);
    if (body.classList.contains('ascii')) renderAscii();
    requestAnimationFrame(tick);
  }

  /* ---- high-detail ASCII renderer ---- */
  const COLS = 146, ROWS = 82, EDGE = 8.5;
  const A = [300, 46], B = [542, 498], C = [58, 498];
  const BIO = [[300, 251], [390.07, 407], [209.93, 407]], BIO_R = 40;
  const RAMP = '8WMZ%&$#*o!+=;:~-.';   // dense (centre) → sparse (rim)
  function distSeg(px, py, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1], wx = px - a[0], wy = py - a[1];
    let u = (wx * vx + wy * vy) / (vx * vx + vy * vy);
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    return Math.hypot(px - (a[0] + u * vx), py - (a[1] + u * vy));
  }
  function bioHit(x, y) {
    for (const b of BIO) {
      if (Math.abs(Math.hypot(x - b[0], y - b[1]) - BIO_R) < 7) return true;
      if (distSeg(x, y, [EX, EY], b) < 8) { const d = Math.hypot(x - EX, y - EY); if (d > 34 && d < 70) return true; }
    }
    return false;
  }
  // the info "i" carved into the pupil (dot + stem), relative to the pupil centre
  function inI(x, y, px, py) {
    return Math.hypot(x - px, y - (py - 8.5)) < 3.8 ||
           (Math.abs(x - px) < 3.4 && y >= py - 3.5 && y <= py + 11);
  }
  function renderAscii() {
    const o = openness, px = EX + gx, py = EY + gy;
    const pupilR = 20 + intensity * 9, irisR = 47, eyeRX = 120, eyeRY = Math.max(4, 66 * o);
    const showBio = body.classList.contains('bio'), showI = body.classList.contains('infoi');
    let out = '';
    for (let r = 0; r < ROWS; r++) {
      const y = (r + 0.5) / ROWS * 560;
      let line = '';
      for (let c = 0; c < COLS; c++) {
        const x = (c + 0.5) / COLS * 600;
        let ch = ' ';
        const ex = (x - EX) / eyeRX, ey = (y - EY) / eyeRY;
        if (o > 0.12 && ex * ex + ey * ey <= 1) {
          const di = Math.hypot(x - px, y - py);
          if (di < pupilR) ch = (showI && inI(x, y, px, py)) ? ' ' : '@';   // "i" carved out of the pupil
          else if (di < irisR) ch = RAMP[Math.min(RAMP.length - 1, (((di - pupilR) / (irisR - pupilR)) * RAMP.length) | 0)];
          else ch = '.';
        } else if (o <= 0.12 && Math.abs(y - EY) < 4 && Math.abs(x - EX) < eyeRX) {
          ch = '-';                                   // closed lid
        } else if (showBio && bioHit(x, y)) {
          ch = '0';
        } else if (distSeg(x, y, B, C) < EDGE) ch = '_';
        else if (distSeg(x, y, A, C) < EDGE) ch = '/';
        else if (distSeg(x, y, A, B) < EDGE) ch = '\\';
        line += ch;
      }
      out += line + '\n';
    }
    ascii.textContent = out;
  }

  /* ---- enter the site (click the eye) ---- */
  function enterSite() {
    if (shuttingDown || entered) return;
    shuttingDown = true;
    clearTimeout(idleTimer);
    if (hint) hint.classList.add('gone');
    hazard.classList.add('off');
    if (body.classList.contains('explode')) {
      openness = 0; targetOpen = 0;                   // eye snaps gone → it bursts
      gaze.style.opacity = '0';
      const c = eyeCenterScreen();
      explode(c.x, c.y, finishReveal);
    } else {
      targetOpen = 0; tgx = 0; tgy = 0;
      setTimeout(() => { splash.classList.add('fade'); setTimeout(finishReveal, 1100); }, 720);
    }
  }
  function finishReveal() {
    splash.style.display = 'none';
    main.hidden = false;
    requestAnimationFrame(() => main.classList.add('show'));
    entered = true;
  }

  /* ---- colourful 0/1 explosion, bursting from the eye ---- */
  function explode(x, y, done) {
    boom.style.display = 'block';
    boom.style.width = innerWidth + 'px'; boom.style.height = innerHeight + 'px';
    const ctx = boom.getContext('2d');
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    boom.width = innerWidth * DPR; boom.height = innerHeight * DPR;
    ctx.scale(DPR, DPR);
    const N = reduce ? 110 : 320, P = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 11;
      P.push({
        x: x + (Math.random() - .5) * 8, y: y + (Math.random() - .5) * 8,   // tight at the eye
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        ch: Math.random() < 0.5 ? '0' : '1',
        color: `hsl(${(Math.random() * 360) | 0},100%,${(58 + Math.random() * 14) | 0}%)`,
        size: 12 + Math.random() * 16, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .4, life: 1,
      });
    }
    const t0 = performance.now();
    let faded = false;
    function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const el0 = Math.max(0, t - t0);                  // first rAF stamp can precede t0 → keep radius ≥ 0
      if (el0 < 200) {                                  // bright flash at the eye
        const fa = 1 - el0 / 200, fr = 10 + (1 - fa) * 90;
        const fg = ctx.createRadialGradient(x, y, 0, x, y, fr);
        fg.addColorStop(0, `rgba(255,255,255,${0.9 * fa})`);
        fg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y, fr, 0, 7); ctx.fill();
      }
      let alive = 0;
      for (const p of P) {
        if (p.life <= 0) continue;
        p.vy += 0.12; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.012;
        if (p.life <= 0) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.font = `bold ${p.size}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.textAlign = 'center';
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      }
      const el = t - t0;
      if (!faded && el > 420) { faded = true; splash.classList.add('fade'); }
      if (alive > 0 && el < 2400) requestAnimationFrame(frame);
      else { boom.style.display = 'none'; if (done) done(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---- settings panel ---- */
  const openPanel  = () => { settings.hidden = false; requestAnimationFrame(() => settings.classList.add('show')); };
  const closePanel = () => { settings.classList.remove('show'); setTimeout(() => { settings.hidden = true; }, 200); };
  const togglePanel = () => (settings.hidden ? openPanel() : closePanel());

  function applyToggles() {
    body.classList.toggle('ascii', tAscii.checked);
    body.classList.toggle('invert', tInvert.checked);
    body.classList.toggle('glow', tGlow.checked);
    body.classList.toggle('bio', tBio.checked);
    body.classList.toggle('infoi', tInfoi.checked);
    body.classList.toggle('explode', tExplode.checked);
    pupil.setAttribute('mask', tInfoi.checked ? 'url(#iMask)' : '');   // carve the "i" out of the pupil
    try {
      localStorage.setItem('psyop', JSON.stringify({
        a: tAscii.checked, i: tInvert.checked, g: tGlow.checked,
        b: tBio.checked, n: tInfoi.checked, e: tExplode.checked,
      }));
    } catch (_) {}
  }
  try {
    const s = JSON.parse(localStorage.getItem('psyop') || '{}');
    tAscii.checked = !!s.a; tInvert.checked = !!s.i; tGlow.checked = !!s.g;
    tBio.checked = !!s.b; tInfoi.checked = !!s.n; tExplode.checked = !!s.e;
  } catch (_) {}
  // invert (white sign) and glow (black lit void) are opposite worlds — keep them exclusive
  tInvert.addEventListener('change', () => { if (tInvert.checked) tGlow.checked = false; });
  tGlow.addEventListener('change', () => { if (tGlow.checked) tInvert.checked = false; });
  applyToggles();

  /* ---- events ---- */
  window.addEventListener('pointermove', onMove, { passive: true });
  eyeHit.addEventListener('click', (e) => { e.stopPropagation(); enterSite(); });
  [tAscii, tInvert, tGlow, tBio, tInfoi, tExplode].forEach((t) => t.addEventListener('change', applyToggles));
  closeBtn.addEventListener('click', closePanel);
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.code === 'KeyL' || e.key.toLowerCase() === 'l')) {
      e.preventDefault(); togglePanel(); return;
    }
    if (e.key === 'Escape' && !settings.hidden) { e.preventDefault(); closePanel(); return; }
    if (e.key === 'Enter' && settings.hidden) enterSite();
  });

  requestAnimationFrame(tick);
})();
