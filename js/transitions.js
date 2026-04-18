/* ---------- Virus Bus — Page transitions (vortex overlay) ---------- */
// Approche légère : pas de SPA, pas de Barba complet. Overlay plein écran
// avec flash vortex au clic sur un lien interne, puis navigation normale.
// Avantages :
//  - zéro risque de casser les scripts par page (audio reader, atropos, etc.)
//  - compatible PWA, SW cache tout
//  - fonctionne aussi en back/forward
(function () {
  // Crée l'overlay une seule fois
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  overlay.innerHTML = `
    <div class="pt-ring"></div>
    <div class="pt-ring delay1"></div>
    <div class="pt-ring delay2"></div>
    <div class="pt-flash"></div>
  `;
  document.body.appendChild(overlay);

  // Fade out quand la page arrive (navigation normale ou via bfcache)
  function revealIn() {
    requestAnimationFrame(() => {
      overlay.classList.remove('active');
      overlay.classList.add('reveal');
      setTimeout(() => overlay.classList.remove('reveal'), 700);
    });
  }
  // Au chargement
  if (document.readyState === 'complete') revealIn();
  else window.addEventListener('load', revealIn);
  // bfcache (back/forward)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) revealIn();
  });

  // Sur clic d'un lien interne : active l'overlay puis laisse la nav se faire
  function isInternalLink(a) {
    if (!a || a.target === '_blank') return false;
    if (a.hasAttribute('download')) return false;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(a.href, location.href);
      return url.origin === location.origin;
    } catch { return false; }
  }

  document.addEventListener('click', (e) => {
    // Ne pas intercepter cmd-click / middle-click
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const a = e.target.closest('a');
    if (!isInternalLink(a)) return;
    // Ne pas intercepter les liens ancre de la même page
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) return;

    e.preventDefault();
    overlay.classList.add('active');
    // Courte animation vortex avant navigation
    setTimeout(() => {
      location.href = a.href;
    }, 380);
  });
})();
