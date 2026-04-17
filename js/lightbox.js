/* ---------- Virus Bus — Photo lightbox ---------- */
(function () {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbImg = lb.querySelector('img');
  const closeBtn = lb.querySelector('.lightbox-close');
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  let currentIdx = 0;
  const urls = Array.from(triggers).map((a) => a.getAttribute('href'));

  function open(idx) {
    currentIdx = idx;
    lbImg.src = urls[idx];
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('on');
    lbImg.src = '';
    document.body.style.overflow = '';
  }
  function next(delta) {
    const n = (currentIdx + delta + urls.length) % urls.length;
    open(n);
  }

  triggers.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
    if (e.code === 'Escape') close();
    else if (e.code === 'ArrowRight') next(1);
    else if (e.code === 'ArrowLeft') next(-1);
  });
})();
