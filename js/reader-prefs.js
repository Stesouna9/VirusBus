/* ---------- Virus Bus — Préférences de lecture (page épisode uniquement) ---------- */
// Toggle clair/sombre + 3 tailles de police (S / M / L).
// Mémorisé dans localStorage. S'affiche uniquement sur les pages .read-page.
(function () {
  if (!document.body.classList.contains('read-page')) return;

  const THEME_KEY = 'virusbus.reader.theme';
  const SIZE_KEY  = 'virusbus.reader.size';

  // Restaure les préférences au chargement
  const savedTheme = localStorage.getItem(THEME_KEY);
  const savedSize  = localStorage.getItem(SIZE_KEY);
  if (savedTheme) document.body.dataset.readerTheme = savedTheme;
  if (savedSize)  document.body.dataset.readerSize  = savedSize;

  // Crée la barre de préférences en bas à droite
  const prefs = document.createElement('div');
  prefs.className = 'reader-prefs';
  prefs.innerHTML = `
    <button class="rp-btn" data-size="sm" title="Police petite">A</button>
    <button class="rp-btn" data-size="md" title="Police normale">A</button>
    <button class="rp-btn" data-size="lg" title="Police grande">A</button>
    <span class="rp-sep"></span>
    <button class="rp-btn rp-theme" title="Basculer clair / sombre">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    </button>
  `;
  document.body.appendChild(prefs);

  // Marque le bouton taille actif
  const sizeButtons = prefs.querySelectorAll('[data-size]');
  const currentSize = document.body.dataset.readerSize || 'md';
  sizeButtons.forEach((b) => {
    if (b.dataset.size === currentSize) b.classList.add('active');
    b.addEventListener('click', () => {
      const newSize = b.dataset.size;
      document.body.dataset.readerSize = newSize;
      localStorage.setItem(SIZE_KEY, newSize);
      sizeButtons.forEach((bb) => bb.classList.toggle('active', bb === b));
    });
  });

  // Toggle thème
  prefs.querySelector('.rp-theme').addEventListener('click', () => {
    const current = document.body.dataset.readerTheme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.readerTheme = next;
    localStorage.setItem(THEME_KEY, next);
  });
})();
