/* ---------- Virus Bus — Giscus comments (GitHub Issues based, zéro backend) ---------- */
// Pour activer :
//   1. Va sur https://giscus.app (en étant connecté à GitHub)
//   2. Repo : Stesouna9/VirusBus
//   3. Active Discussions dans les settings du repo (gratuit, GitHub only)
//   4. Catégorie : "Announcements" ou crée "Comments"
//   5. Mapping : "pathname"
//   6. Installe l'app Giscus sur ton repo (bouton bleu sur giscus.app)
//   7. Giscus te donne un data-repo-id et data-category-id
//   8. Remplace YOUR_REPO_ID et YOUR_CATEGORY_ID ci-dessous
// Tant que c'est YOUR_REPO_ID, le bloc ne s'injecte pas (mode désactivé).
(function () {
  const article = document.querySelector('.read-article');
  if (!article) return;

  const REPO = 'Stesouna9/VirusBus';
  const REPO_ID = 'YOUR_REPO_ID';
  const CATEGORY = 'Comments';
  const CATEGORY_ID = 'YOUR_CATEGORY_ID';

  if (REPO_ID === 'YOUR_REPO_ID' || CATEGORY_ID === 'YOUR_CATEGORY_ID') {
    // Pas configuré, on n'injecte rien
    return;
  }

  // Container juste avant la fin de l'article nav
  const container = document.createElement('div');
  container.className = 'comments-section';
  container.innerHTML = `
    <h2 class="comments-title">Discussion</h2>
    <p class="comments-hint">Connecte-toi avec GitHub pour commenter cet épisode.</p>
    <div class="giscus"></div>
  `;
  const nav = document.querySelector('.episode-nav');
  if (nav) nav.insertAdjacentElement('beforebegin', container);
  else article.insertAdjacentElement('afterend', container);

  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.setAttribute('data-repo', REPO);
  s.setAttribute('data-repo-id', REPO_ID);
  s.setAttribute('data-category', CATEGORY);
  s.setAttribute('data-category-id', CATEGORY_ID);
  s.setAttribute('data-mapping', 'pathname');
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'bottom');
  s.setAttribute('data-theme', 'dark_dimmed');
  s.setAttribute('data-lang', 'fr');
  s.setAttribute('data-loading', 'lazy');
  s.crossOrigin = 'anonymous';
  s.async = true;
  container.querySelector('.giscus').appendChild(s);
})();
