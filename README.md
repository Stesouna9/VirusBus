# Virus Bus — Site officiel

Site cinématographique pour le roman-série SF **Virus Bus** de Doc Laundal (OKALAM Studio).

## Structure

```
virus-bus-web/
├── index.html               Accueil (vortex Star Nest, hero, personnages, liste des épisodes)
├── episodes/
│   └── episode-01.html      E01 "Virus" — lecture immersive + audio Vivienne synchronisé
├── css/main.css             Design system
├── js/
│   ├── vortex.js            Shader WebGL vanilla (Star Nest)
│   ├── ambient.js           Curseur custom, scroll reveal, minuteur, saut
│   └── reader.js            Lecteur MP3 + sync phrase/audio via VTT
└── assets/
    ├── img/                 Personnages + univers (optimisés JPEG)
    └── audio/               MP3 + VTT par épisode
```

## Développement local

```bash
python3 -m http.server 4177
# puis http://localhost:4177
```

**Important** : ne pas ouvrir via `file://` — Safari bloque les modules ES et certains formats audio.

## Régénérer l'audio d'un épisode

```bash
pip3 install --user edge-tts
edge-tts --voice fr-FR-VivienneMultilingualNeural \
  --file episode_plain.txt \
  --write-media assets/audio/e0X_nom.mp3 \
  --write-subtitles assets/audio/e0X_nom.vtt
```

## Crédits

- Shader vortex : « Star Nest » de Pablo Roman Andrioli (ShaderToy, CC-BY-NC-SA), retinté.
- Voix audio : Microsoft Neural TTS (fr-FR Vivienne) via [edge-tts](https://github.com/rany2/edge-tts).
- Typographies : Fraunces, EB Garamond, JetBrains Mono (Google Fonts).

© 2026 Doc Laundal — OKALAM Studio
