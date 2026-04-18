/* ---------- Virus Bus — Lecture UX : progress bar + stats + next episode ---------- */
(function () {
  const article = document.querySelector('.read-article');
  if (!article) return;

  /* --- 1. Barre de progression en haut de page --- */
  const bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.innerHTML = '<div class="read-progress-fill"></div>';
  document.body.appendChild(bar);
  const fill = bar.querySelector('.read-progress-fill');

  function onScroll() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop || document.body.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (scrolled / max) * 100)) : 0;
    fill.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* --- 2. Stats lecture + écoute en tête d'article --- */
  // Compte les mots dans l'article (approximatif)
  const text = article.innerText || article.textContent || '';
  const words = text.split(/\s+/).filter(Boolean).length;
  const readMin = Math.round(words / 250);  // ~250 wpm lecture normale

  // Durée audio: depuis le data-audio + charge métadonnées du MP3
  const player = document.querySelector('.player');
  const audioPath = player && player.dataset.audio;

  const stats = document.createElement('div');
  stats.className = 'read-stats';
  stats.innerHTML = `
    <span>📖  <strong>${words.toLocaleString('fr-FR')}</strong> mots</span>
    <span>⏱  <strong>${readMin} min</strong> de lecture</span>
    <span class="listen-span" hidden>🎧  <strong class="listen-time">…</strong> d'écoute</span>
  `;
  // Insère après .read-header
  const header = document.querySelector('.read-header');
  if (header) header.appendChild(stats);

  // Charge la durée audio sans télécharger tout le fichier
  if (audioPath) {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioPath;
    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) return;
      const sec = Math.round(audio.duration);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      const formatted = s === 0 ? `${m} min` : `${m} min ${s}s`;
      const el = stats.querySelector('.listen-time');
      const span = stats.querySelector('.listen-span');
      if (el && span) {
        el.textContent = formatted;
        span.hidden = false;
      }
    });
  }

  /* --- 3. Navigation épisode suivant / précédent en fin d'article --- */
  // Detection automatique du numéro d'épisode depuis l'URL
  const match = location.pathname.match(/episode-(\d+)\.html/);
  if (match) {
    const num = parseInt(match[1], 10);
    const nav = document.createElement('nav');
    nav.className = 'episode-nav';

    const makeLink = (target, label, direction) => {
      const a = document.createElement('a');
      a.href = target;
      a.className = `episode-nav-link ${direction}`;
      a.innerHTML = label;
      return a;
    };

    // Bouton précédent (si pas E01)
    if (num > 1) {
      const prevNum = String(num - 1).padStart(2, '0');
      nav.appendChild(makeLink(
        `./episode-${prevNum}.html`,
        `<span class="dir">← Épisode ${prevNum}</span>`,
        'prev'
      ));
    } else {
      nav.appendChild(document.createElement('div'));
    }

    // Bouton "retour à l'index"
    const home = document.createElement('a');
    home.href = '../index.html#episodes';
    home.className = 'episode-nav-home';
    home.textContent = '↑  Liste des épisodes';
    nav.appendChild(home);

    // Bouton suivant (cherche episode-NN+1.html existant)
    // On fait un HEAD check async, si 404 on montre rien
    const nextNum = String(num + 1).padStart(2, '0');
    const nextHref = `./episode-${nextNum}.html`;
    const nextA = makeLink(
      nextHref,
      `<span class="dir">Épisode ${nextNum}  →</span><span class="cta">Continuer</span>`,
      'next'
    );
    nextA.style.display = 'none';
    nav.appendChild(nextA);

    fetch(nextHref, { method: 'HEAD' })
      .then((r) => { if (r.ok) nextA.style.display = ''; })
      .catch(() => {});

    // Insertion après le player (juste avant </body>)
    article.insertAdjacentElement('afterend', nav);
  }
})();
