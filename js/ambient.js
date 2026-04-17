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

/* ---------- Live Minuteur (SF countdown with jump event) ---------- */
(function () {
  const el = document.getElementById('minuteur-time');
  if (!el) return;

  // Starting time (visible on load, decrements in real time)
  let total = 2 * 86400 + 10 * 3600 + 34 * 60 + 29;
  let worldCount = 1;

  function pad(n, w = 2) { return String(n).padStart(w, '0'); }
  function render() {
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    el.textContent = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // Flash overlay element (inserted once)
  const flash = document.createElement('div');
  flash.className = 'vortex-flash';
  document.body.appendChild(flash);

  const jumpMsg = document.createElement('div');
  jumpMsg.className = 'jump-msg';
  document.body.appendChild(jumpMsg);

  function triggerJump() {
    worldCount += 1;
    // Flash
    flash.classList.remove('on');
    void flash.offsetWidth; // restart animation
    flash.classList.add('on');
    // Message
    jumpMsg.textContent = `SAUT ↗ MONDE N°${worldCount}`;
    jumpMsg.classList.remove('on');
    void jumpMsg.offsetWidth;
    jumpMsg.classList.add('on');
    // Subtle page shake on hero
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.classList.add('shake');
      setTimeout(() => hero.classList.remove('shake'), 700);
    }
    // New random countdown: 12h - 3 days
    total = 12 * 3600 + Math.floor(Math.random() * (3 * 86400 - 12 * 3600));
  }

  render();
  setInterval(() => {
    total -= 1;
    if (total <= 0) {
      total = 0;
      render();
      triggerJump();
    } else {
      render();
    }
  }, 1000);

  // Easter egg: click the minuteur to force a jump (for testing / fun)
  el.style.cursor = 'none';
  el.addEventListener('click', () => {
    total = 0;
    render();
    triggerJump();
  });
})();

/* Vortex is now handled by vortex.js (OGL WebGL shader) */
