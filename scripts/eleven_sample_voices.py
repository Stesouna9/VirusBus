#!/usr/bin/env python3
"""
Génère des échantillons vocaux ElevenLabs pour chaque rôle (Narrateur,
Gabriel, Daniel, Solange, Lara) avec plusieurs voix candidates.
Permet à l'utilisateur d'écouter et de choisir avant la génération finale.

Usage:
    export ELEVENLABS_API_KEY="sk_..."
    python3 scripts/eleven_sample_voices.py

Les MP3 sont écrits dans assets/audio/voice_samples/
Page d'écoute : voice-selection.html à la racine.
"""
import os
import sys
import time
from pathlib import Path

try:
    from elevenlabs.client import ElevenLabs
except ImportError:
    print("ERROR: pip3 install --user elevenlabs pydub", file=sys.stderr)
    sys.exit(1)

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
if not API_KEY:
    print("ERROR: ELEVENLABS_API_KEY non définie dans l'environnement.", file=sys.stderr)
    sys.exit(1)

client = ElevenLabs(api_key=API_KEY)

# Dossier racine du site
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "voice_samples"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Voix candidates par rôle (voice_id de la librairie publique ElevenLabs)
CANDIDATES = {
    "narrateur": {
        "line": "Le bus avait cessé de vibrer. Dehors, une lumière orange saturait les vitres. Aucun des quatre ne parla pendant une longue seconde.",
        "description": "Féminine grave, posée, littéraire.",
        "voices": [
            ("alice",     "Xb7hH8MSUJpSbSDYk0k2", "Alice — claire, posée"),
            ("charlotte", "XB0fDUnXU5powFXDhCwa", "Charlotte — sophistiquée"),
            ("matilda",   "XrExE9yKIg1WjnnlVkGX", "Matilda — chaleureuse"),
        ],
    },
    "gabriel": {
        "line": "Qu'est-ce que tu veux dire par 'changé' ?",
        "description": "Masculine 30 ans, pudique, légèrement hésitante.",
        "voices": [
            ("liam",    "TX3LPaxmHKxFdv7VOQHJ", "Liam — jeune, naturel"),
            ("charlie", "IKne3meq5aSn9XLyUdCD", "Charlie — décontracté"),
            ("chris",   "iP95p4xoKVk53GoZ742B", "Chris — amical"),
        ],
    },
    "daniel": {
        "line": "On n'est plus sur Terre. Les constantes physiques ont changé.",
        "description": "Masculine 44 ans, physicien, analytique, articulée.",
        "voices": [
            ("george",  "JBFqnCBsd6RMkjVDRZzb", "George — mature, calme"),
            ("daniel",  "onwK4e9ZLuTAKqWW03F9", "Daniel — grave, posé"),
            ("bill",    "pqHfZKP75CvOlQylNhV4", "Bill — narrateur doc"),
        ],
    },
    "solange": {
        "line": "Épargnez-nous la science, Jasner. Où est la sortie ?",
        "description": "Féminine 35 ans, commandante militaire, ferme, coupante.",
        "voices": [
            ("matilda", "XrExE9yKIg1WjnnlVkGX", "Matilda — autoritaire"),
            ("laura",   "FGY2WhTYpPnrIDTdsKH5", "Laura — claire, nette"),
            ("aria",    "9BWtsMINqrJLrRacOk9x", "Aria — expressive"),
        ],
    },
    "lara": {
        "line": "Là. Derrière vous. Vous ne la voyez pas parce qu'elle est à moitié enfouie dans le sol.",
        "description": "Féminine 29 ans, biologiste, douce, intuitive.",
        "voices": [
            ("sarah",   "EXAVITQu4vr4xnSDxMaL", "Sarah — douce"),
            ("lily",    "pFZP5JQG7iQjIQuC4Bku", "Lily — chaleureuse"),
            ("jessica", "cgSgspJ2msm6clMCkdW9", "Jessica — jeune, posée"),
        ],
    },
}

VOICE_SETTINGS = {
    "stability": 0.55,
    "similarity_boost": 0.85,
    "style": 0.35,
    "use_speaker_boost": True,
}

def synthesize(text, voice_id, out_path):
    """Génère un MP3 via ElevenLabs text-to-speech."""
    audio_stream = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        voice_settings=VOICE_SETTINGS,
        output_format="mp3_44100_128",
    )
    with open(out_path, "wb") as f:
        for chunk in audio_stream:
            if chunk:
                f.write(chunk)

def main():
    total_candidates = sum(len(role["voices"]) for role in CANDIDATES.values())
    print(f"Génération de {total_candidates} échantillons…\n")

    for role, data in CANDIDATES.items():
        print(f"=== {role.upper()} — {data['description']}")
        for slug, voice_id, label in data["voices"]:
            out = OUT_DIR / f"{role}_{slug}.mp3"
            print(f"  → {label}  ({slug})", end=" ", flush=True)
            try:
                synthesize(data["line"], voice_id, out)
                size = out.stat().st_size / 1024
                print(f"OK ({size:.0f} KB)")
            except Exception as e:
                print(f"ERREUR: {e}")
            time.sleep(0.3)  # petite pause anti-ratelimit

    print(f"\n{total_candidates} MP3 dans {OUT_DIR.relative_to(ROOT)}")
    print("→ Ouvre voice-selection.html pour écouter et choisir.")

if __name__ == "__main__":
    main()
