/* The Last Psyop — the eye (exact gate eye)
 *
 *  - the gate's eye: lid shut until the cursor moves, pupil tracks it, iris
 *    reddens + a red dread wash blooms as you get close, info-"i" in the pupil
 *  - CLICK the eye → a random rabbit hole (psyop history / war-news front page)
 *  - DRAG the ❤️ onto the eye → it blinks twice, the "i" becomes a heart, hearts
 *    erupt from the eye, and the page fades into "The Last Psyop"
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement, body = document.body;
  const hazard = $('hazard'), lid = $('lid'), gaze = $('gaze'), pupil = $('pupil'),
        eyeHit = $('eyeHit'), crease = $('crease'), heart = $('heart'), boom = $('boom'),
        hero = $('hero'), revealEl = $('reveal');
  const irisStops = ['s0', 's1', 's2', 's3'].map($);

  /* ---- geometry (viewBox 600×560) ---- */
  const EX = 300, EY = 355, GAZE_X = 34, GAZE_Y = 20, REACH = 260;
  const HEART_FAR = 480, DRAG_FAR = 540;   // anger ramps with cursor→heart / heart→eye distance

  /* ---- colour ---- */
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const COOL = ['#fffbd0', '#f2dd00', '#a07a00', '#3a2a00'].map(hex);  // yellow/amber iris (no green)
  const HOT  = ['#ffe3d6', '#ff2a00', '#5e0a00', '#180200'].map(hex);
  const PINK = ['#ffe1f0', '#ff5fa6', '#a8005a', '#3a0020'];
  const GLOW_COOL = hex('#eaff00'), GLOW_HOT = hex('#ff1500');

  /* ---- state ---- */
  let openness = 1, gx = 0, gy = 0, tgx = 0, tgy = 0;   // start open & ready (no load-time blink)
  let intensity = 0, targetInt = 0;
  let blessed = false, dragging = false, busy = false, woken = false;

  // the rabbit holes the eye throws you into
  const LINKS = [
    'https://en.wikipedia.org/wiki/Operation_Mockingbird',
    'https://en.wikipedia.org/wiki/Project_MKUltra',
    'https://en.wikipedia.org/wiki/Operation_INFEKTION',
    'https://en.wikipedia.org/wiki/COINTELPRO',
    'https://en.wikipedia.org/wiki/Operation_Northwoods',
    'https://en.wikipedia.org/wiki/Active_measures',
    'https://en.wikipedia.org/wiki/Gulf_of_Tonkin_incident',
    'https://en.wikipedia.org/wiki/Operation_Gladio',
    'https://en.wikipedia.org/wiki/Operation_Paperclip',
    'https://en.wikipedia.org/wiki/Psychological_warfare',
    'https://en.wikipedia.org/wiki/Psychological_operations_(United_States)',
    'https://en.wikipedia.org/wiki/Ghost_Army',
    'https://en.wikipedia.org/wiki/Memetic_warfare',
    'https://en.wikipedia.org/wiki/Information_warfare',
    'https://www.lesswrong.com/w/information-hazards',
    'https://en.wikipedia.org/wiki/USS_Liberty_incident',
    'https://en.wikipedia.org/wiki/Lavon_Affair',
    'https://es.wikipedia.org/wiki/Folke_Bernadotte',
    'https://en.wikipedia.org/wiki/Project_Blue_Book',
    'https://www.cia.gov/readingroom/docs/CIA-RDP96-00789R002800180001-2.pdf',      // CIA Gateway Process
    'https://www.ussc.gov/sites/default/files/pdf/training/annual-national-training-seminar/2018/Emerging_Tech_Bitcoin_Crypto.pdf',
    'https://www.goodreads.com/book/show/57540.The_Ethnic_Cleansing_of_Palestine',  // Ilan Pappé
    'https://www.goodreads.com/book/show/213079154',                                // Hijacking Bitcoin
    'https://www.youtube.com/watch?v=s2b-I0Yqisc',                                  // Bezmenov — Griffin interview
    'https://www.youtube.com/watch?v=yErKTVdETpw',                                  // Bezmenov — four stages
    'https://www.youtube.com/watch?v=g4XiKChyK7A',
    'https://www.youtube.com/watch?v=-gGLvg0n-uY',
    'https://www.youtube.com/watch?v=sjoad6gcRzs',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://web.english.upenn.edu/~cavitch/pdf-library/Bernays_Propaganda.pdf',       // Bernays — Propaganda
    'https://en.wikipedia.org/wiki/Born_secret',
    'https://dn790007.ca.archive.org/0/items/pdfy-NekqfnoWIEuYgdZl/Manufacturing%20Consent%20%5BThe%20Political%20Economy%20Of%20The%20Mass%20Media%5D.pdf',  // Herman & Chomsky
    'https://www.cnn.com/world',
    'https://www.foxnews.com/world',
    'https://www.nytimes.com/section/world',
  ];

  // kick off the reveal-asset loads immediately (the <link rel=preload> in <head> starts the
  // network fetch). assetsReady resolves once the LED font + serifs are loaded AND the background
  // video has its first frame decoded — the reveal waits on it, so it never flashes black.
  const revvid = document.getElementById('revvid');
  const assetsReady = (function warm() {
    const vidP = new Promise((res) => {
      if (!revvid) return res();
      try { revvid.muted = true; revvid.play().catch(() => {}); } catch (e) {}
      if (revvid.readyState >= 2) return res();                       // already has a frame
      const done = () => res();
      revvid.addEventListener('loadeddata', done, { once: true });
      revvid.addEventListener('canplay', done, { once: true });
      revvid.addEventListener('error', done, { once: true });
      setTimeout(done, 5000);                                        // never block the reveal forever
    });
    const fontP = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load("400 184px 'LEDLIGHT'"),
          document.fonts.load("600 48px 'Cormorant Garamond'"),
          document.fonts.load("400 22px 'EB Garamond'"),
          document.fonts.load("italic 400 22px 'EB Garamond'"),
        ]).catch(() => {}) : Promise.resolve();
    return Promise.all([vidP, fontP]);
  })();

  const toSvg = (cx, cy) => {
    const r = hazard.getBoundingClientRect();
    const s = Math.min(r.width / 600, r.height / 560);
    return { x: (cx - r.left - (r.width - 600 * s) / 2) / s, y: (cy - r.top - (r.height - 560 * s) / 2) / s };
  };
  const eyeCenterScreen = () => { const r = eyeHit.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const heartCenterScreen = () => { const r = heart.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  // is an SVG-space point inside the warning triangle? (vertices A,B,C)
  function inTriangle(px, py) {
    const A = [300, 46], B = [542, 498], C = [58, 498];
    const sign = (a, b) => (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
    const d1 = sign(A, B), d2 = sign(B, C), d3 = sign(C, A);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  /* ---- pointer helpers (mouse + touch unified) ---- */
  const overRect = (el, x, y, m) => { const r = el.getBoundingClientRect(); return x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m; };
  const overEye = (x, y) => overRect(eyeHit, x, y, 36);          // generous — for dropping the heart
  const overHeart = (x, y) => overRect(heart, x, y, 14);   // tight — you must actually tap/touch the heart
  const onEye = (x, y) => {                                      // tight — the visible eye only (NOT the triangle)
    const r = eyeHit.getBoundingClientRect();
    const nx = (x - (r.left + r.width / 2)) / (r.width / 2 * 0.85);
    const ny = (y - (r.top + r.height / 2)) / (r.height / 2 * 0.85);
    return nx * nx + ny * ny <= 1;
  };

  function updateGaze(x, y) {                         // the eye follows the cursor / finger
    const p = toSvg(x, y);
    if (!woken) { if (inTriangle(p.x, p.y)) woken = true; else { tgx = 0; tgy = 0; targetInt = 0; return false; } }
    const dx = p.x - EX, dy = p.y - EY, len = Math.hypot(dx, dy) || 1, reach = Math.min(1, len / REACH);
    tgx = (dx / len) * GAZE_X * reach; tgy = (dy / len) * GAZE_Y * reach;
    return true;
  }
  function updateAnger(x, y) {                        // anger from the HEART (worse near the eye while held)
    if (dragging) {
      const ec = eyeCenterScreen();
      const near = 1 - Math.min(1, Math.hypot(x - ec.x, y - ec.y) / DRAG_FAR);
      targetInt = 0.66 + near * 0.34;
    } else {
      const hc = heartCenterScreen();
      const near = 1 - Math.min(1, Math.hypot(x - hc.x, y - hc.y) / HEART_FAR);
      targetInt = (near * 0.82) ** 1.4;
    }
  }

  function applyIntensity(t) {
    if (blessed) {
      for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', PINK[i]);
      pupil.setAttribute('r', '23');
      gaze.style.filter = 'drop-shadow(0 0 14px #ff8fd0)';
      root.style.setProperty('--dread', '0'); hazard.style.transform = '';
      return;
    }
    const ct = Math.min(1, t);
    for (let i = 0; i < 4; i++) irisStops[i].setAttribute('stop-color', toHex(mix(COOL[i], HOT[i], ct)));
    // round pupil; widens (and accelerates) with fear — widest when the held heart nears the eye
    pupil.setAttribute('r', (20 + Math.pow(ct, 1.4) * 24).toFixed(1));
    gaze.style.filter = `drop-shadow(0 0 ${(6 + t * 22).toFixed(0)}px ${toHex(mix(GLOW_COOL, GLOW_HOT, ct))})`;
    root.style.setProperty('--dread', Math.min(0.9, t * 0.6 + (dragging ? 0.18 : 0)).toFixed(3));
    const j = t * t * 10 + (dragging ? 6 : 0);     // shakier while the heart is held
    if (j > 0.8) hazard.style.transform = `translate(${((Math.random() - .5) * j).toFixed(1)}px,${((Math.random() - .5) * j).toFixed(1)}px)`;
    else hazard.style.transform = '';
  }

  (function tick() {
    intensity += ((blessed ? 0 : targetInt) - intensity) * 0.12;
    openness += (1 - openness) * 0.16;                 // the eye stays open
    gx += (tgx - gx) * 0.14; gy += (tgy - gy) * 0.14;
    if (!busy) lid.setAttribute('transform', `translate(${EX} ${EY}) scale(1 ${openness.toFixed(4)}) translate(${-EX} ${-EY})`);
    gaze.setAttribute('transform', `translate(${gx.toFixed(2)} ${gy.toFixed(2)})`);
    crease.style.opacity = (1 - Math.min(1, openness * 1.25)).toFixed(3);
    applyIntensity(intensity);
    requestAnimationFrame(tick);
  })();

  /* ---- heart explosion from the eye ---- */
  function explode() {
    const c = eyeCenterScreen();
    boom.style.display = 'block';
    boom.style.width = innerWidth + 'px'; boom.style.height = innerHeight + 'px';
    const ctx = boom.getContext('2d');
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    boom.width = innerWidth * DPR; boom.height = innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // pre-render a few glowing heart sprites ONCE — drawImage()'ing these per frame is far cheaper
    // than the old per-heart fillText + shadowBlur (canvas shadowBlur was the main cause of the lag).
    const SPR = 64, sprites = [];
    for (let k = 0; k < 5; k++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = SPR;
      const sx = cv.getContext('2d');
      sx.translate(SPR / 2, SPR / 2);
      sx.fillStyle = `hsl(${330 + k * 6},100%,${64 + k * 2}%)`;
      sx.shadowColor = sx.fillStyle; sx.shadowBlur = 7;          // glow baked in here, not every frame
      sx.font = `bold ${(SPR * 0.66) | 0}px ui-monospace, Menlo, monospace`;
      sx.textAlign = 'center'; sx.textBaseline = 'middle';
      sx.fillText('♥', 0, 0);
      sprites.push(cv);
    }

    const N = window.matchMedia('(max-width: 640px)').matches ? 64 : 100;   // fewer hearts
    const P = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 12;
      P.push({
        x: c.x + (Math.random() - .5) * 8, y: c.y + (Math.random() - .5) * 8,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
        spr: sprites[(Math.random() * sprites.length) | 0],
        size: 17 + Math.random() * 20, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .4, gone: false,
      });
    }
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const el = Math.max(0, t - t0);
      if (el < 200) {
        const fa = 1 - el / 200, fr = 10 + (1 - fa) * 90;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, fr);
        g.addColorStop(0, `rgba(255,180,220,${0.9 * fa})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, fr, 0, 7); ctx.fill();
      }
      let alive = 0;
      for (const p of P) {
        if (p.gone) continue;
        p.vy += 0.15; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.rot += p.vr;   // gravity carries them off
        // a heart vanishes by flying off screen: full opacity on-screen, a soft fade across a
        // margin band as it crosses an edge (left/right/bottom — upward ones arc back down via gravity)
        const m = p.size + 50;
        const over = Math.max(-p.x, p.x - innerWidth, p.y - innerHeight, 0);
        if (over >= m) { p.gone = true; continue; }                            // fully off screen
        alive++;
        const d = p.size * 1.7;
        ctx.globalAlpha = 1 - over / m;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.drawImage(p.spr, -d / 2, -d / 2, d, d);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);   // reset transform (cheaper than save/restore per heart)
      }
      ctx.globalAlpha = 1;
      // end only once every heart has flown off (never a hard mid-air cut); el cap is just a safety net
      if (alive > 0 && el < 7000) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, innerWidth, innerHeight); boom.style.display = 'none'; }
    })(t0);
  }

  /* ---- blessing: double blink → heart pupil → explosion → reveal ---- */
  function bless() {
    if (blessed) return; blessed = true; busy = true;
    heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.left = ''; heart.style.top = '';
    const start = performance.now(), DUR = 1200;
    (function anim(now) {
      const p = Math.min(1, (now - start) / DUR);
      const o = Math.abs(1 - 2 * ((p * 2) % 1));            // two blinks
      lid.setAttribute('transform', `translate(${EX} ${EY}) scale(1 ${o.toFixed(3)}) translate(${-EX} ${-EY})`);
      if (p < 1) requestAnimationFrame(anim); else { openness = 1; busy = false; }
    })(start);
    setTimeout(() => { pupil.setAttribute('mask', 'url(#heartMask)'); body.classList.add('blessed'); }, DUR * 0.75);
    setTimeout(() => { explode(); reveal(); }, DUR);
  }
  function reveal() {
    body.classList.add('revealed');
    document.documentElement.classList.add('revealed');   // dark root → no white showing on overscroll
    // the reveal is gesture-driven, so this play() is allowed even if autoplay was deferred
    if (revvid) { revvid.muted = true; revvid.play().catch(() => {}); }
    bgmFadeIn();                                          // muzak fades in as we enter The Last Psyop
    hero.style.opacity = '0';
    setTimeout(() => {
      hero.style.display = 'none';
      revealEl.hidden = false;                       // rendered but still opacity:0 (invisible)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // only fade the text in once the LED font + video frame are ready, so the title never flashes
      // in the fallback font and the backdrop is already painted
      assetsReady.finally(() => requestAnimationFrame(() => revealEl.classList.add('show')));
    }, 1000);
  }

  /* ---- sparkle trail ---- */
  function sparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'sparkle'; s.textContent = Math.random() < 0.28 ? '💫' : '✨';
    s.style.left = (x + (Math.random() - .5) * 18) + 'px';
    s.style.top = (y + (Math.random() - .5) * 18) + 'px';
    s.style.fontSize = (12 + Math.random() * 12) + 'px';
    s.style.setProperty('--dx', ((Math.random() - .5) * 34).toFixed(0) + 'px');
    s.style.setProperty('--dy', (10 + Math.random() * 32).toFixed(0) + 'px');
    body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }

  /* ---- unified pointer handling (mouse + touch) ---- */
  let lastSpX = 0, lastSpY = 0, pdown = false, downX = 0, downY = 0, moved = false;
  const moveHeart = (x, y) => { heart.style.left = x + 'px'; heart.style.top = y + 'px'; };
  function grab(x, y) {
    dragging = true; woken = true;
    heart.classList.add('dragging'); heart.textContent = '💖';
    lastSpX = x; lastSpY = y; targetInt = Math.max(targetInt, 0.85);
    moveHeart(x, y);
  }
  const dropHeart = () => { heart.classList.remove('dragging'); heart.textContent = '❤️'; heart.style.left = ''; heart.style.top = ''; };
  function alarmAndGo() {                         // tapping the eye: it flares red + the "i" lights up, then the rabbit hole
    busy = true; woken = true;
    document.body.classList.add('alarm');
    targetInt = 1; intensity = Math.max(intensity, 0.7);
    const url = LINKS[(Math.random() * LINKS.length) | 0];
    setTimeout(() => {
      // reset to the calm resting state RIGHT BEFORE leaving — so the snapshot mobile
      // browsers cache (and restore on Back) is a normal, re-clickable eye, not a frozen red one
      body.classList.remove('alarm');
      busy = false; pdown = false; dragging = false; moved = false; woken = false;
      targetInt = 0; intensity = 0; tgx = 0; tgy = 0;
      applyIntensity(0);
      window.location.href = url;
    }, 520);
  }

  window.addEventListener('pointerdown', (e) => {
    if (blessed) return;
    pdown = true; moved = false; downX = e.clientX; downY = e.clientY;
    if (overHeart(e.clientX, e.clientY)) grab(e.clientX, e.clientY);                 // tap / press the heart
    else { woken = true; updateGaze(e.clientX, e.clientY); updateAnger(e.clientX, e.clientY); }  // any tap wakes it → eye drifts toward the tap
  });
  window.addEventListener('pointermove', (e) => {
    if (blessed) return;
    if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 8) moved = true;
    if (!dragging && pdown && overHeart(e.clientX, e.clientY)) grab(e.clientX, e.clientY);   // swipe past the heart grabs it
    const awake = updateGaze(e.clientX, e.clientY);                                  // eye locks onto the moving finger
    if (dragging) {
      moveHeart(e.clientX, e.clientY); updateAnger(e.clientX, e.clientY);
      if (Math.hypot(e.clientX - lastSpX, e.clientY - lastSpY) > 14) { sparkle(e.clientX, e.clientY); lastSpX = e.clientX; lastSpY = e.clientY; }
    } else if (awake) updateAnger(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', (e) => {
    if (blessed) { pdown = false; return; }
    if (dragging) {
      dragging = false;
      if (overEye(e.clientX, e.clientY)) bless();          // let go over the eye → open the site
      else dropHeart();
    } else if (!moved && !busy && onEye(e.clientX, e.clientY)) {
      alarmAndGo();                                        // tap the EYE only (not the triangle) → alarm → rabbit hole
    }
    pdown = false;
  });
  window.addEventListener('pointercancel', () => { if (dragging) { dragging = false; dropHeart(); } pdown = false; });

  // back button / bfcache restore / returning to the tab: the page can come back showing stale
  // red pixels (the cached snapshot was painted mid-alarm). Forcibly restore the calm resting state
  // AND repaint now via applyIntensity(0) — removing an already-removed class wouldn't repaint.
  function resetEye() {
    if (blessed) return;
    body.classList.remove('alarm');
    busy = false; pdown = false; dragging = false; moved = false; woken = false;
    dropHeart();
    targetInt = 0; intensity = 0; tgx = 0; tgy = 0; gx = 0; gy = 0;
    root.style.setProperty('--dread', '0');
    applyIntensity(0);   // force the resting visuals immediately (don't wait for the rAF tick)
  }
  window.addEventListener('pageshow', resetEye);
  window.addEventListener('pagehide', resetEye);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resetEye(); });

  /* ---- the feature video at the bottom: autoplay WITH sound when scrolled into view, centre
     play/pause toggle, bottom-left mute. The page already has user activation from the heart-drag,
     so audio playback is normally permitted; if a browser still blocks it we fall back to muted
     autoplay and surface the unmute button. ---- */
  (function featureVideo() {
    const vf = document.querySelector('.vfeature');
    if (!vf) return;
    const v = vf.querySelector('.vfeature__vid');
    const setMuted = (m) => { v.muted = m; vf.classList.toggle('is-muted', m); };
    v.addEventListener('play', () => vf.classList.add('is-playing'));
    v.addEventListener('pause', () => vf.classList.remove('is-playing'));
    const toggle = () => { if (v.paused) v.play().catch(() => {}); else v.pause(); };
    vf.querySelector('.vfeature__center').addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    vf.querySelector('.vfeature__mute').addEventListener('click', (e) => { e.stopPropagation(); setMuted(!v.muted); });
    setMuted(false);   // audio on by default

    // ── scrub bar: click / drag to seek back and forth ──
    const bar = vf.querySelector('.vfeature__bar'), played = vf.querySelector('.vfeature__played');
    if (bar && played) {
      let scrubbing = false;
      const draw = () => { if (v.duration) played.style.width = (Math.min(1, v.currentTime / v.duration) * 100).toFixed(2) + '%'; };
      const seekAt = (clientX) => {
        const r = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        if (v.duration) { v.currentTime = ratio * v.duration; played.style.width = (ratio * 100).toFixed(2) + '%'; }
      };
      v.addEventListener('timeupdate', () => { if (!scrubbing) draw(); });
      v.addEventListener('loadedmetadata', draw);
      bar.addEventListener('pointerdown', (e) => { e.stopPropagation(); scrubbing = true; try { bar.setPointerCapture(e.pointerId); } catch (_) {} seekAt(e.clientX); });
      bar.addEventListener('pointermove', (e) => { if (scrubbing) seekAt(e.clientX); });
      const endScrub = (e) => { if (scrubbing) { scrubbing = false; e.stopPropagation(); } };
      bar.addEventListener('pointerup', endScrub);
      bar.addEventListener('pointercancel', endScrub);
      bar.addEventListener('click', (e) => e.stopPropagation());   // the bar seeks; don't toggle play
    }

    let started = false;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!started) {                       // first time it scrolls in → start WITH sound
            started = true; setMuted(false);
            v.play().catch(() => { setMuted(true); v.play().catch(() => {}); });   // blocked w/ audio → muted fallback
          } else if (v.paused) { v.play().catch(() => {}); }
        } else if (!en.isIntersecting) {
          v.pause();
        }
      }
    }, { threshold: [0, 0.5] });
    io.observe(v);
  })();

  /* ---- background muzak for The Last Psyop: fades in on reveal; elegant top-right toggle ---- */
  const bgm = $('bgm'), bgmBtn = $('bgm-toggle');
  let bgmWanted = true, bgmFadeT = 0;
  function bgmFadeIn() {
    if (!bgm || !bgmWanted) return;
    try { bgm.volume = 0; bgm.play().catch(() => {}); } catch (e) { return; }
    clearInterval(bgmFadeT);
    bgmFadeT = setInterval(() => {                 // ~2s ramp to a soft background level
      bgm.volume = Math.min(0.4, bgm.volume + 0.01);
      if (bgm.volume >= 0.4) clearInterval(bgmFadeT);
    }, 50);
  }
  if (bgmBtn) bgmBtn.addEventListener('click', () => {
    bgmWanted = !bgmWanted;
    bgmBtn.classList.toggle('is-off', !bgmWanted);
    bgmBtn.setAttribute('aria-pressed', String(bgmWanted));
    if (bgmWanted) bgmFadeIn(); else if (bgm) { clearInterval(bgmFadeT); bgm.pause(); }
  });

  // pause all audio (muzak + the feature video) when the tab/page is hidden; resume on return
  const fvid = document.querySelector('.vfeature__vid');
  let bgmWasOn = false, fvWasOn = false;
  function pauseMedia() {
    bgmWasOn = !!(bgm && !bgm.paused); fvWasOn = !!(fvid && !fvid.paused);
    clearInterval(bgmFadeT); if (bgm) bgm.pause(); if (fvid) fvid.pause();
  }
  function resumeMedia() {
    if (bgm && bgmWasOn && bgmWanted) bgm.play().catch(() => {});
    if (fvid && fvWasOn) fvid.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseMedia(); else resumeMedia(); });
  window.addEventListener('pagehide', pauseMedia);

})();
