/* ---------- Custom cursor ---------- */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  document.body.appendChild(cursor);

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let gx = mx, gy = my;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  function tick() {
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .perso-card, .episode-row, .s, .speed-chip')) {
      cursor.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .perso-card, .episode-row, .s, .speed-chip')) {
      cursor.classList.remove('hover');
    }
  });
})();

/* ---------- Scroll reveal ---------- */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
})();

/* ---------- Nav scrolled state ---------- */
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Live Minuteur (global deterministic countdown — same for everyone) ---------- */
(function () {
  const el = document.getElementById('minuteur-time');
  if (!el) return;

  // Fixed anchor: same reference for every visitor worldwide
  const EPOCH = Date.UTC(2026, 3, 18, 0, 0, 0); // 18 avril 2026 00:00 UTC
  const MIN_MS = 20 * 60 * 1000;           // 20 minutes
  const MAX_MS = 14 * 24 * 3600 * 1000;    // 14 jours

  // Deterministic PRNG: cycle index → duration in ms. Same result on every device.
  function cycleDurationMs(n) {
    let h = (n * 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    const r = h / 0xFFFFFFFF;
    return MIN_MS + r * (MAX_MS - MIN_MS);
  }

  // Find the current jump target and cycle index based on EPOCH + deterministic durations
  function computeState(now) {
    let t = EPOCH;
    let n = 0;
    while (t <= now) {
      n += 1;
      t += cycleDurationMs(n);
    }
    return { target: t, worldCount: n }; // worldCount = 1 before first jump, then 2, 3...
  }

  let { target, worldCount } = computeState(Date.now());
  let lastSeenCount = worldCount;

  function pad(n, w = 2) { return String(n).padStart(w, '0'); }
  function render() {
    const now = Date.now();
    const state = computeState(now);
    target = state.target;
    if (state.worldCount !== lastSeenCount) {
      const increased = state.worldCount > lastSeenCount;
      lastSeenCount = state.worldCount;
      worldCount = state.worldCount;
      if (increased) triggerJumpAnimation();
    } else {
      worldCount = state.worldCount;
    }
    const diffMs = Math.max(0, target - now);
    const total = Math.floor(diffMs / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    el.textContent = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // Overlay elements for jump animation
  const flash = document.createElement('div');
  flash.className = 'vortex-flash';
  document.body.appendChild(flash);
  const jumpMsg = document.createElement('div');
  jumpMsg.className = 'jump-msg';
  document.body.appendChild(jumpMsg);

  function triggerJumpAnimation() {
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    jumpMsg.textContent = `SAUT ↗ MONDE N°${worldCount}`;
    jumpMsg.classList.remove('on'); void jumpMsg.offsetWidth; jumpMsg.classList.add('on');
    const hero = document.querySelector('.hero');
    if (hero) { hero.classList.add('shake'); setTimeout(() => hero.classList.remove('shake'), 700); }
  }

  render();
  setInterval(render, 1000);

  // Easter egg: click the minuteur → local-only preview of jump animation (does not alter global clock)
  el.style.cursor = 'none';
  el.addEventListener('click', () => {
    const tempCount = worldCount + 1;
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    jumpMsg.textContent = `SAUT ↗ MONDE N°${tempCount} (aperçu)`;
    jumpMsg.classList.remove('on'); void jumpMsg.offsetWidth; jumpMsg.classList.add('on');
    const hero = document.querySelector('.hero');
    if (hero) { hero.classList.add('shake'); setTimeout(() => hero.classList.remove('shake'), 700); }
  });

  // Re-sync when tab is refocused
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
})();

/* Vortex is now handled by vortex.js (OGL WebGL shader) */
