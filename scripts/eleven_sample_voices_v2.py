#!/usr/bin/env python3
"""
Tour 2 : nouvelles voix candidates ElevenLabs (Narrateur, Gabriel, Daniel, Solange).
Lara déjà validée avec Jessica → pas regénérée.

Usage:
    export ELEVENLABS_API_KEY="sk_..."
    python3 scripts/eleven_sample_voices_v2.py
"""
import os, sys, time
from pathlib import Path

try:
    from elevenlabs.client import ElevenLabs
except ImportError:
    print("ERROR: pip3 install --user elevenlabs", file=sys.stderr); sys.exit(1)

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
if not API_KEY:
    print("ERROR: ELEVENLABS_API_KEY manquante", file=sys.stderr); sys.exit(1)

client = ElevenLabs(api_key=API_KEY)
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "voice_samples"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Voice settings par défaut (lecture "neutre")
DEFAULT_SETTINGS = {
    "stability": 0.55, "similarity_boost": 0.85,
    "style": 0.35, "use_speaker_boost": True,
}
# Voice settings "coupante / clinique" pour Solange
COLD_SETTINGS = {
    "stability": 0.8, "similarity_boost": 0.9,
    "style": 0.1, "use_speaker_boost": True,
}

CANDIDATES = {
    "narrateur": {
        "line": "Le bus avait cessé de vibrer. Dehors, une lumière orange saturait les vitres. Aucun des quatre ne parla pendant une longue seconde.",
        "description": "Féminine grave, posée, littéraire.",
        "voices": [
            ("rachel",  "21m00Tcm4TlvDq8ikWAM", "Rachel — ample",     DEFAULT_SETTINGS),
            ("serena",  "pMsXgVXv3BLzUgSXRplE", "Serena — middle-age",DEFAULT_SETTINGS),
            ("grace",   "oWAxZDx7w5VEj9dCyTzz", "Grace — Southern",   DEFAULT_SETTINGS),
            ("nicole",  "piTKgcLEGmPE4e6mEKli", "Nicole — whisper",   DEFAULT_SETTINGS),
        ],
    },
    "gabriel": {
        "line": "Qu'est-ce que tu veux dire par 'changé' ?",
        "description": "Masculine 32 ans, pudique, hésitante.",
        "voices": [
            ("ethan",   "g5CIjZEefAph4nQFvHAz", "Ethan — jeune posé",    DEFAULT_SETTINGS),
            ("adam",    "pNInz6obpgDQGcFmaJgB", "Adam — deep neutre",    DEFAULT_SETTINGS),
            ("josh",    "TxGEqnHWrfWFTfGW9XjX", "Josh — doux",           DEFAULT_SETTINGS),
            ("eric",    "cjVigY5qzO86Huf0OWal", "Eric — middle-age",     DEFAULT_SETTINGS),
        ],
    },
    "daniel": {
        "line": "On n'est plus sur Terre. Les constantes physiques ont changé.",
        "description": "Masculine 44 ans, analytique, articulé.",
        "voices": [
            ("brian",   "nPczCjzI2devNBz1zQrb", "Brian — deep warm",     DEFAULT_SETTINGS),
            ("antoni",  "ErXwobaYiN019PkySvjV", "Antoni — posé",         DEFAULT_SETTINGS),
            ("roger",   "CwhRBWXzGAHq8TQ4Fs17", "Roger — mature ferme",  DEFAULT_SETTINGS),
            ("arnold",  "VR6AewLTigWG4xSOukaG", "Arnold — crisp",        DEFAULT_SETTINGS),
        ],
    },
    "solange": {
        "line": "Épargnez-nous la science, Jasner. Où est la sortie ?",
        "description": "Féminine 35 ans, commandante, coupante.",
        "voices": [
            ("rachel_cold",  "21m00Tcm4TlvDq8ikWAM", "Rachel — cold",         COLD_SETTINGS),
            ("laura_cold",   "FGY2WhTYpPnrIDTdsKH5", "Laura — cold",          COLD_SETTINGS),
            ("serena",       "pMsXgVXv3BLzUgSXRplE", "Serena — middle-age",   DEFAULT_SETTINGS),
            ("matilda_cold", "XrExE9yKIg1WjnnlVkGX", "Matilda — cold",        COLD_SETTINGS),
        ],
    },
}

def synthesize(text, voice_id, out_path, settings):
    stream = client.text_to_speech.convert(
        text=text, voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        voice_settings=settings,
        output_format="mp3_44100_128",
    )
    with open(out_path, "wb") as f:
        for chunk in stream:
            if chunk: f.write(chunk)

def main():
    total = sum(len(r["voices"]) for r in CANDIDATES.values())
    print(f"Tour 2 : {total} nouveaux échantillons\n")
    ok, fail = 0, 0
    for role, data in CANDIDATES.items():
        print(f"=== {role.upper()} — {data['description']}")
        for slug, vid, label, settings in data["voices"]:
            out = OUT_DIR / f"{role}_{slug}.mp3"
            print(f"  → {label}  ({slug})", end=" ", flush=True)
            try:
                synthesize(data["line"], vid, out, settings)
                size = out.stat().st_size / 1024
                if size < 2:
                    print(f"SKIP (payante ? {size:.0f} KB)"); fail += 1
                    out.unlink(missing_ok=True)
                else:
                    print(f"OK ({size:.0f} KB)"); ok += 1
            except Exception as e:
                msg = str(e)
                if "paid_plan_required" in msg: print("SKIP (voix payante)")
                elif "rate" in msg.lower(): print(f"RATELIMIT"); time.sleep(5)
                else: print(f"ERREUR: {msg[:100]}")
                fail += 1
            time.sleep(0.3)
    print(f"\n→ {ok} OK, {fail} skip/fail  ({OUT_DIR.relative_to(ROOT)})")

if __name__ == "__main__":
    main()
