/* ---------- Virus Bus — GLightbox wrapper ---------- */
// Remplace l'ancien lightbox maison par GLightbox (animations, swipe,
// pinch-zoom, fullscreen mobile). Rétro-compatible avec data-lightbox :
// on migre automatiquement à .glightbox au chargement.
(function () {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  // Retire le vieux <div id="lightbox"> si présent (inutile avec GLightbox)
  const oldLb = document.getElementById('lightbox');
  if (oldLb) oldLb.remove();

  // Marque les liens pour GLightbox et groupe-les (galerie)
  triggers.forEach((a) => {
    a.classList.add('glightbox');
    if (!a.hasAttribute('data-gallery')) {
      a.setAttribute('data-gallery', 'page-gallery');
    }
    a.removeAttribute('data-lightbox');
  });

  function init() {
    if (!window.GLightbox) {
      console.warn('GLightbox not loaded');
      return;
    }
    window.GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      keyboardNavigation: true,
      closeOnOutsideClick: true,
      openEffect: 'fade',
      closeEffect: 'fade',
      slideEffect: 'slide',
    });
  }

  if (window.GLightbox) init();
  else {
    // GLightbox chargé en defer, attendre
    window.addEventListener('load', init);
  }
})();
