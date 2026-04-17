/* ---------- Virus Bus — Wavesurfer audio reader with VTT sync ---------- */
window.addEventListener('load', () => {
  const article = document.querySelector('.read-article');
  const player = document.querySelector('.player');
  if (!article || !player) return;
  if (!window.WaveSurfer) { console.warn('Wavesurfer not loaded'); return; }

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
  const waveContainer = player.querySelector('.wave-container');
  const volSlider = player.querySelector('.vol-slider');
  const volBtn = player.querySelector('.vol-btn');
  const volWrap = player.querySelector('.volume');

  const iconPlay = `<svg viewBox="0 0 24 24"><path d="M7 5v14l12-7z"/></svg>`;
  const iconPause = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>`;

  // Create Wavesurfer instance
  const ws = WaveSurfer.create({
    container: waveContainer,
    waveColor: 'rgba(148, 170, 210, 0.28)',
    progressColor: '#4FA8FF',
    cursorColor: 'rgba(127, 190, 255, 0.9)',
    cursorWidth: 2,
    barWidth: 2,
    barGap: 2,
    barRadius: 3,
    height: 36,
    normalize: true,
    url: AUDIO_SRC,
    backend: 'MediaElement',
  });

  let rate = 1.0;
  let cues = [];
  let sentenceCues = [];
  let currentSentIdx = -1;

  /* ---- VTT / SRT parsing (edge-tts outputs SRT-like) ---- */
  function parseVTT(raw) {
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
      while (i < lines.length && lines[i].trim()) { textLines.push(lines[i].trim()); i++; }
      out.push({ start, end, text: textLines.join(' ') });
    }
    return out;
  }

  function alignSentencesToCues() {
    if (!cues.length || !sentences.length) return;
    const words = [];
    cues.forEach((c) => {
      const tokens = c.text.split(/\s+/).filter(Boolean);
      const count = tokens.length || 1;
      const dur = (c.end - c.start) / count;
      tokens.forEach((tok, k) => {
        words.push({ tok, start: c.start + dur * k, end: c.start + dur * (k + 1) });
      });
    });
    const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, '').replace(/\s+/g, ' ').trim();
    let w = 0;
    sentenceCues = sentences.map((s) => {
      const sNorm = normalize(s.textContent);
      const sTokens = sNorm.split(/\s+/).filter(Boolean);
      if (!sTokens.length) return { start: 0, end: 0 };
      let matchStart = -1;
      for (let probe = w; probe < Math.min(words.length, w + 200); probe++) {
        const wTok = normalize(words[probe].tok);
        if (wTok === sTokens[0]) { matchStart = probe; break; }
        if (sTokens[0].startsWith(wTok) || wTok.startsWith(sTokens[0])) { matchStart = probe; break; }
      }
      if (matchStart < 0) {
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

  if (VTT_SRC) {
    fetch(VTT_SRC).then((r) => r.text()).then((txt) => {
      cues = parseVTT(txt);
      alignSentencesToCues();
    }).catch(() => {});
  }

  /* ---- Sentence highlight sync ---- */
  function setActive(n) {
    currentSentIdx = n;
    sentences.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('past', i < n);
    });
    const el = sentences[n];
    if (el && ws.isPlaying()) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top < vh * 0.2 || rect.bottom > vh * 0.75) {
        window.scrollTo({ top: window.scrollY + rect.top - vh * 0.4, behavior: 'smooth' });
      }
    }
  }

  function updateHighlight() {
    if (!sentenceCues.length) return;
    const t = ws.getCurrentTime();
    let idx = -1;
    for (let i = 0; i < sentenceCues.length; i++) {
      if (t >= sentenceCues[i].start && t < (sentenceCues[i].end + 0.05)) { idx = i; break; }
      if (t < sentenceCues[i].start) { idx = Math.max(0, i - 1); break; }
    }
    if (idx < 0 && t >= (sentenceCues[sentenceCues.length - 1]?.end || 0)) {
      idx = sentenceCues.length - 1;
    }
    if (idx !== currentSentIdx) setActive(idx);
  }

  function fmtTime(t) {
    if (!isFinite(t) || t < 0) return '--:--';
    const m = Math.floor(t / 60); const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* ---- Wavesurfer events ---- */
  function render() {
    const playing = ws.isPlaying();
    playBtn.innerHTML = playing ? iconPause : iconPlay;
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
    player.classList.toggle('playing', playing);
  }

  ws.on('ready', () => {
    progressEl.textContent = `0:00 / ${fmtTime(ws.getDuration())}`;
  });
  ws.on('audioprocess', () => {
    progressEl.textContent = `${fmtTime(ws.getCurrentTime())} / ${fmtTime(ws.getDuration())}`;
    updateHighlight();
  });
  ws.on('seeking', () => { updateHighlight(); });
  ws.on('play', render);
  ws.on('pause', render);
  ws.on('finish', render);

  /* ---- Transport ---- */
  function togglePlay() { ws.playPause(); }
  function stop() { ws.pause(); ws.seekTo(0); updateHighlight(); render(); }
  function next() {
    const n = Math.min(sentences.length - 1, currentSentIdx + 1);
    if (sentenceCues[n]) ws.setTime(sentenceCues[n].start);
  }
  function prev() {
    const n = Math.max(0, currentSentIdx - 1);
    if (sentenceCues[n]) ws.setTime(sentenceCues[n].start);
  }
  function cycleSpeed() {
    const speeds = [0.85, 1.0, 1.15, 1.3];
    const i = speeds.indexOf(rate);
    rate = speeds[(i + 1) % speeds.length];
    ws.setPlaybackRate(rate, true);
    speedChip.textContent = `${rate}×`;
  }

  sentences.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (sentenceCues[i]) {
        ws.setTime(sentenceCues[i].start);
        if (!ws.isPlaying()) ws.play();
      }
    });
  });

  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  stopBtn.addEventListener('click', stop);
  speedChip.addEventListener('click', cycleSpeed);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.code === 'Escape') stop();
  });

  /* ---- Volume ---- */
  const VOL_KEY = 'virusbus.vol';
  let savedVol = parseFloat(localStorage.getItem(VOL_KEY));
  if (!isFinite(savedVol) || savedVol < 0 || savedVol > 1) savedVol = 1;
  ws.setVolume(savedVol);
  if (volSlider) volSlider.value = savedVol;
  let lastVol = savedVol > 0 ? savedVol : 1;

  function applyVolumeUI(v) {
    const pct = Math.round(v * 100);
    if (volSlider) volSlider.style.setProperty('--vol', pct + '%');
    if (volWrap) volWrap.classList.toggle('muted', v === 0);
  }
  applyVolumeUI(savedVol);

  if (volSlider) {
    volSlider.addEventListener('input', () => {
      const v = parseFloat(volSlider.value);
      ws.setVolume(v);
      ws.setMuted(v === 0);
      if (v > 0) lastVol = v;
      localStorage.setItem(VOL_KEY, String(v));
      applyVolumeUI(v);
    });
  }
  if (volBtn) {
    volBtn.addEventListener('click', () => {
      const curr = ws.getVolume();
      if (curr === 0 || ws.getMuted()) {
        ws.setMuted(false); ws.setVolume(lastVol);
        volSlider.value = lastVol; applyVolumeUI(lastVol);
        localStorage.setItem(VOL_KEY, String(lastVol));
      } else {
        lastVol = curr; ws.setMuted(true); ws.setVolume(0);
        volSlider.value = 0; applyVolumeUI(0);
      }
    });
  }

  speedChip.textContent = `${rate}×`;
  render();
});
