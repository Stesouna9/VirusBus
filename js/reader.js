/* ---------- Virus Bus — MP3 audio reader with VTT sync ---------- */
(function () {
  const article = document.querySelector('.read-article');
  const player = document.querySelector('.player');
  if (!article || !player) return;

  const AUDIO_SRC = player.dataset.audio;
  const VTT_SRC = player.dataset.vtt;
  if (!AUDIO_SRC) return;

  const sentences = Array.from(article.querySelectorAll('.s'));
  const playBtn = player.querySelector('.play-btn');
  const prevBtn = player.querySelector('.prev-btn');
  const nextBtn = player.querySelector('.next-btn');
  const stopBtn = player.querySelector('.stop-btn');
  const speedChip = player.querySelector('.speed-chip');
  const progressEl = player.querySelector('.progress');
  const scrubber = player.querySelector('.scrubber');
  const scrubFill = player.querySelector('.scrub-fill');
  const volSlider = player.querySelector('.vol-slider');
  const volBtn = player.querySelector('.vol-btn');
  const volWrap = player.querySelector('.volume');

  const iconPlay = `<svg viewBox="0 0 24 24"><path d="M7 5v14l12-7z"/></svg>`;
  const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>`;

  // --- Audio element ---
  const audio = new Audio();
  audio.src = AUDIO_SRC;
  audio.preload = 'metadata';

  let rate = 1.0;
  let cues = [];          // [{start, end, text}] from VTT (word-level from edge-tts)
  let sentenceCues = [];  // [{start, end}] aligned to sentences array
  let currentSentIdx = -1;

  // --- VTT / SRT parsing (edge-tts outputs SRT-like with commas for ms) ---
  function parseVTT(raw) {
    // Normalize commas in timestamps to dots so one regex handles both
    const text = raw.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    const lines = text.split(/\r?\n/);
    const out = [];
    let i = 0;
    if (lines[0] && lines[0].startsWith('WEBVTT')) i = 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }
      if (!line.includes('-->')) { i++; continue; }
      const m = line.match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)\s*-->\s*(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/);
      if (!m) { i++; continue; }
      const toSec = (h, mm, ss) => (parseInt(h || 0) * 3600) + (parseInt(mm) * 60) + parseFloat(ss);
      const start = toSec(m[1], m[2], m[3]);
      const end = toSec(m[4], m[5], m[6]);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim()) {
        textLines.push(lines[i].trim());
        i++;
      }
      out.push({ start, end, text: textLines.join(' ') });
    }
    return out;
  }

  // --- Align VTT word cues to sentences by matching text positions ---
  function alignSentencesToCues() {
    if (!cues.length || !sentences.length) return;
    // Build one long word timeline from cues
    const fullText = cues.map(c => c.text).join(' ').toLowerCase();
    const words = [];
    let cursor = 0;
    cues.forEach((c) => {
      const tokens = c.text.split(/\s+/).filter(Boolean);
      const count = tokens.length || 1;
      const dur = (c.end - c.start) / count;
      tokens.forEach((tok, k) => {
        words.push({ tok, start: c.start + dur * k, end: c.start + dur * (k + 1) });
      });
    });

    // Walk sentences, consume words sequentially that match sentence text
    const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, '').replace(/\s+/g, ' ').trim();
    let w = 0;
    sentenceCues = sentences.map((s) => {
      const sNorm = normalize(s.textContent);
      const sTokens = sNorm.split(/\s+/).filter(Boolean);
      if (!sTokens.length) return { start: 0, end: 0 };
      // find contiguous match of sTokens starting at words[w..]
      let matchStart = -1;
      for (let probe = w; probe < Math.min(words.length, w + 200); probe++) {
        const wTok = normalize(words[probe].tok);
        if (wTok === sTokens[0]) { matchStart = probe; break; }
        // fallback: prefix match
        if (sTokens[0].startsWith(wTok) || wTok.startsWith(sTokens[0])) { matchStart = probe; break; }
      }
      if (matchStart < 0) {
        // could not align; fall back to next-after-last
        const prev = sentenceCues[sentenceCues.length - 1];
        const start = prev ? prev.end : 0;
        return { start, end: start + 1 };
      }
      const start = words[matchStart].start;
      const endWordIdx = Math.min(words.length - 1, matchStart + sTokens.length - 1);
      const end = words[endWordIdx].end;
      w = endWordIdx + 1;
      return { start, end };
    });
  }

  // --- Fetch VTT ---
  if (VTT_SRC) {
    fetch(VTT_SRC).then((r) => r.text()).then((txt) => {
      cues = parseVTT(txt);
      alignSentencesToCues();
    }).catch(() => {});
  }

  // --- Sync highlight with audio currentTime ---
  function updateHighlight() {
    if (!sentenceCues.length) return;
    const t = audio.currentTime;
    let idx = -1;
    for (let i = 0; i < sentenceCues.length; i++) {
      if (t >= sentenceCues[i].start && t < (sentenceCues[i].end + 0.05)) {
        idx = i; break;
      }
      if (t < sentenceCues[i].start) { idx = Math.max(0, i - 1); break; }
    }
    if (idx < 0 && t >= (sentenceCues[sentenceCues.length - 1]?.end || 0)) {
      idx = sentenceCues.length - 1;
    }
    if (idx !== currentSentIdx) setActive(idx);
  }

  function setActive(n) {
    currentSentIdx = n;
    sentences.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('past', i < n);
    });
    progressEl.textContent = `${String(Math.max(0, n) + 1).padStart(3, '0')} / ${String(sentences.length).padStart(3, '0')}`;
    const el = sentences[n];
    if (el && !audio.paused) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top < vh * 0.2 || rect.bottom > vh * 0.75) {
        window.scrollTo({ top: window.scrollY + rect.top - vh * 0.4, behavior: 'smooth' });
      }
    }
  }

  // --- Scrubber ---
  function fmtTime(t) {
    if (!isFinite(t)) return '--:--';
    const m = Math.floor(t / 60); const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  audio.addEventListener('timeupdate', () => {
    updateHighlight();
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      scrubFill.style.width = pct + '%';
    }
    progressEl.textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
  });
  audio.addEventListener('loadedmetadata', () => {
    progressEl.textContent = `0:00 / ${fmtTime(audio.duration)}`;
  });
  audio.addEventListener('ended', () => { render(); });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);

  scrubber.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = scrubber.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(audio.duration, pct * audio.duration));
  });

  // --- Transport ---
  function togglePlay() {
    if (audio.paused) audio.play(); else audio.pause();
  }
  function stop() { audio.pause(); audio.currentTime = 0; }
  function nextSent() {
    if (currentSentIdx < 0) { if (sentenceCues[0]) audio.currentTime = sentenceCues[0].start; return; }
    const n = Math.min(sentences.length - 1, currentSentIdx + 1);
    if (sentenceCues[n]) audio.currentTime = sentenceCues[n].start;
  }
  function prevSent() {
    const n = Math.max(0, currentSentIdx - 1);
    if (sentenceCues[n]) audio.currentTime = sentenceCues[n].start;
  }
  function cycleSpeed() {
    const speeds = [0.85, 1.0, 1.15, 1.3];
    const i = speeds.indexOf(rate);
    rate = speeds[(i + 1) % speeds.length];
    audio.playbackRate = rate;
    speedChip.textContent = `${rate}×`;
  }

  function render() {
    playBtn.innerHTML = audio.paused ? iconPlay : iconPause;
    playBtn.setAttribute('aria-label', audio.paused ? 'Lecture' : 'Pause');
    player.classList.toggle('playing', !audio.paused);
  }

  // --- Click on sentence to jump ---
  sentences.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (sentenceCues[i]) {
        audio.currentTime = sentenceCues[i].start;
        if (audio.paused) audio.play();
      }
    });
  });

  // --- Controls ---
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', nextSent);
  prevBtn.addEventListener('click', prevSent);
  stopBtn.addEventListener('click', stop);
  speedChip.addEventListener('click', cycleSpeed);

  // --- Keyboard ---
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); nextSent(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); prevSent(); }
    else if (e.code === 'Escape') stop();
  });

  // --- Volume control ---
  const VOL_KEY = 'virusbus.vol';
  let savedVol = parseFloat(localStorage.getItem(VOL_KEY));
  if (!isFinite(savedVol) || savedVol < 0 || savedVol > 1) savedVol = 1;
  audio.volume = savedVol;
  if (volSlider) volSlider.value = savedVol;

  let lastVol = savedVol > 0 ? savedVol : 1;
  function applyVolumeUI(v) {
    const pct = Math.round(v * 100);
    volSlider.style.setProperty('--vol', pct + '%');
    volWrap.classList.toggle('muted', v === 0 || audio.muted);
  }
  applyVolumeUI(audio.volume);

  if (volSlider) {
    volSlider.addEventListener('input', () => {
      const v = parseFloat(volSlider.value);
      audio.volume = v;
      audio.muted = v === 0;
      if (v > 0) lastVol = v;
      localStorage.setItem(VOL_KEY, String(v));
      applyVolumeUI(v);
    });
  }
  if (volBtn) {
    volBtn.addEventListener('click', () => {
      if (audio.volume === 0 || audio.muted) {
        audio.muted = false;
        audio.volume = lastVol;
        volSlider.value = lastVol;
        applyVolumeUI(lastVol);
        localStorage.setItem(VOL_KEY, String(lastVol));
      } else {
        lastVol = audio.volume;
        audio.muted = true;
        audio.volume = 0;
        volSlider.value = 0;
        applyVolumeUI(0);
      }
    });
  }

  // --- Init ---
  speedChip.textContent = `${rate}×`;
  render();
})();
