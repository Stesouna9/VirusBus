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

/* ---------- Live Minuteur (real-time, persisted countdown to next jump) ---------- */
(function () {
  const el = document.getElementById('minuteur-time');
  if (!el) return;

  // Persistent state across reloads
  const TARGET_KEY = 'virusbus.jumpTarget';
  const COUNT_KEY = 'virusbus.worldCount';

  function randomJumpMs() {
    // Between 12h and 3 days
    return (12 * 3600 + Math.floor(Math.random() * (3 * 86400 - 12 * 3600))) * 1000;
  }

  function getTarget() {
    const raw = localStorage.getItem(TARGET_KEY);
    const t = raw ? parseInt(raw, 10) : NaN;
    if (!isFinite(t) || t < Date.now() - 86400 * 1000) {
      // No target yet, or very stale (>1 day past)
      const fresh = Date.now() + (2 * 86400 + 10 * 3600 + 34 * 60 + 29) * 1000;
      localStorage.setItem(TARGET_KEY, String(fresh));
      return fresh;
    }
    return t;
  }

  function getCount() {
    const n = parseInt(localStorage.getItem(COUNT_KEY) || '1', 10);
    return isFinite(n) && n >= 1 ? n : 1;
  }
  function setCount(n) { localStorage.setItem(COUNT_KEY, String(n)); }

  let target = getTarget();
  let worldCount = getCount();

  function pad(n, w = 2) { return String(n).padStart(w, '0'); }
  function render() {
    const diffMs = Math.max(0, target - Date.now());
    const total = Math.floor(diffMs / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    el.textContent = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // Overlay elements (shared)
  const flash = document.createElement('div');
  flash.className = 'vortex-flash';
  document.body.appendChild(flash);
  const jumpMsg = document.createElement('div');
  jumpMsg.className = 'jump-msg';
  document.body.appendChild(jumpMsg);

  function triggerJump() {
    worldCount += 1;
    setCount(worldCount);
    target = Date.now() + randomJumpMs();
    localStorage.setItem(TARGET_KEY, String(target));

    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    jumpMsg.textContent = `SAUT ↗ MONDE N°${worldCount}`;
    jumpMsg.classList.remove('on'); void jumpMsg.offsetWidth; jumpMsg.classList.add('on');

    const hero = document.querySelector('.hero');
    if (hero) { hero.classList.add('shake'); setTimeout(() => hero.classList.remove('shake'), 700); }
  }

  render();
  setInterval(() => {
    if (Date.now() >= target) {
      render();
      triggerJump();
    } else {
      render();
    }
  }, 1000);

  // Easter egg: click the minuteur to force a jump
  el.style.cursor = 'none';
  el.addEventListener('click', () => {
    target = Date.now();
    render();
    triggerJump();
  });

  // When tab is refocused, re-sync immediately (clock may have ticked while idle)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
})();

/* Vortex is now handled by vortex.js (OGL WebGL shader) */
