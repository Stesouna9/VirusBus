/* ---------- Virus Bus — Lenis smooth scroll + GSAP scroll reveals ---------- */
window.addEventListener('load', () => {

  /* --- Lenis smooth scroll --- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    // Re-link anchor nav: Lenis intercepts smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const el = document.querySelector(id);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el, { duration: 1.4 });
          }
        }
      });
    });
  }

  /* --- Splitting: split section titles into chars for stagger reveal --- */
  let splitTargets = [];
  if (window.Splitting) {
    try {
      splitTargets = Splitting({ target: 'section h2', by: 'chars' });
    } catch (_) {}
  }

  /* --- GSAP ScrollTrigger reveals --- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Lenis <-> ScrollTrigger wiring
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Disable the old IntersectionObserver reveals by immediately marking them
    // then re-animate with GSAP for richer control
    document.querySelectorAll('.reveal').forEach((el) => {
      el.classList.remove('in');
      gsap.set(el, { opacity: 0, y: 50 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Stagger reveal of section h2 chars (Splitting produced .char spans)
    splitTargets.forEach((t) => {
      const chars = t.chars || t.el.querySelectorAll('.char');
      if (!chars || !chars.length) return;
      gsap.set(chars, { opacity: 0, y: 30, rotateZ: 4 });
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        rotateZ: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.025,
        scrollTrigger: {
          trigger: t.el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Stagger persos cards
    const persoCards = document.querySelectorAll('.perso-card');
    if (persoCards.length) {
      gsap.set(persoCards, { opacity: 0, y: 60 });
      gsap.to(persoCards, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: persoCards[0].parentElement,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Parallax on the concept visual (the bus image)
    const conceptImg = document.querySelector('.concept-visual img');
    if (conceptImg) {
      gsap.to(conceptImg, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: conceptImg.closest('section'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
    }

    // Episode row hover-expand on scroll
    document.querySelectorAll('.episode-row').forEach((row, i) => {
      gsap.set(row, { opacity: 0, x: -30 });
      gsap.to(row, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 88%', toggleActions: 'play none none none' },
      });
    });
  }
});
