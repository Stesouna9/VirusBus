/* ---------- Virus Bus — Atropos 3D cards + glitch title + cursor polish ---------- */
window.addEventListener('load', () => {

  /* --- Atropos 3D parallax on perso cards --- */
  if (window.Atropos) {
    document.querySelectorAll('.perso-card.atropos').forEach((el) => {
      Atropos({
        el,
        activeOffset: 36,
        shadow: false,
        rotateXMax: 8,
        rotateYMax: 8,
        duration: 350,
        eventsEl: el,
        onEnter() { el.classList.add('atropos-hover'); },
        onLeave() { el.classList.remove('atropos-hover'); },
      });
    });
  }

  /* --- Glitch the hero title "Virus Bus" every 8-12s --- */
  const title = document.querySelector('.hero-title');
  if (title) {
    // Capture original text of each word span
    const wordSpans = title.querySelectorAll('.word > span');
    if (wordSpans.length) {
      const originals = Array.from(wordSpans).map((s) => s.textContent);
      const GLITCH_CHARS = 'АБВГДЁЖЗИЙКЛМНОПРСТУФЩЪЫЬЭЮЯ@#∞%¢∂ƒ©≈÷×ø∆';

      function scramble(original, intensity = 0.5) {
        return original
          .split('')
          .map((ch) =>
            Math.random() < intensity
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : ch
          )
          .join('');
      }

      async function glitchPass() {
        title.classList.add('glitching');
        const frames = 6;
        for (let i = 0; i < frames; i++) {
          wordSpans.forEach((s, idx) => {
            s.textContent = scramble(originals[idx], 0.35 + (Math.random() * 0.35));
          });
          await new Promise((r) => setTimeout(r, 55 + Math.random() * 35));
        }
        wordSpans.forEach((s, idx) => { s.textContent = originals[idx]; });
        title.classList.remove('glitching');
      }

      function scheduleNextGlitch() {
        const delay = 8000 + Math.random() * 4000;
        setTimeout(async () => {
          await glitchPass();
          scheduleNextGlitch();
        }, delay);
      }
      scheduleNextGlitch();
    }
  }

  /* Cursor est géré dans ambient.js (custom lerp), pas de changement ici. */
});
