#!/usr/bin/env python3
"""Tour 3 : variations de voice_settings sur les voix free."""
import os, sys, time
from pathlib import Path

from elevenlabs.client import ElevenLabs

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
client = ElevenLabs(api_key=API_KEY)
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio" / "voice_samples"
OUT.mkdir(parents=True, exist_ok=True)

# Preset grave/posé : moins d'expressivité, plus de stabilité, voix plus neutre
GRAVE = {"stability": 0.85, "similarity_boost": 0.9, "style": 0.05, "use_speaker_boost": True}
# Preset dramatique : plus d'émotion
DRAMA = {"stability": 0.3, "similarity_boost": 0.85, "style": 0.7, "use_speaker_boost": True}

CANDIDATES = {
    "narrateur": {
        "line": "Le bus avait cessé de vibrer. Dehors, une lumière orange saturait les vitres. Aucun des quatre ne parla pendant une longue seconde.",
        "voices": [
            ("alice_grave",   "Xb7hH8MSUJpSbSDYk0k2", "Alice — grave",   GRAVE),
            ("matilda_grave", "XrExE9yKIg1WjnnlVkGX", "Matilda — grave", GRAVE),
            ("laura_narrator","FGY2WhTYpPnrIDTdsKH5", "Laura — narrator",GRAVE),
            ("sarah_grave",   "EXAVITQu4vr4xnSDxMaL", "Sarah — grave",   GRAVE),
        ],
    },
    "gabriel": {
        "line": "Qu'est-ce que tu veux dire par 'changé' ?",
        "voices": [
            ("adam_soft",     "pNInz6obpgDQGcFmaJgB", "Adam — adouci",   {"stability":0.65,"similarity_boost":0.85,"style":0.2,"use_speaker_boost":True}),
            ("eric_hesitant", "cjVigY5qzO86Huf0OWal", "Eric — hésitant", DRAMA),
            ("liam_grave",    "TX3LPaxmHKxFdv7VOQHJ", "Liam — posé",     GRAVE),
        ],
    },
    "daniel": {
        "line": "On n'est plus sur Terre. Les constantes physiques ont changé.",
        "voices": [
            ("brian_grave",   "nPczCjzI2devNBz1zQrb", "Brian — grave",    GRAVE),
            ("antoni_grave",  "ErXwobaYiN019PkySvjV", "Antoni — grave",   GRAVE),
            ("roger_articul", "CwhRBWXzGAHq8TQ4Fs17", "Roger — articulé", GRAVE),
        ],
    },
    "solange": {
        "line": "Épargnez-nous la science, Jasner. Où est la sortie ?",
        "voices": [
            ("matilda_cut",   "XrExE9yKIg1WjnnlVkGX", "Matilda — coupante", GRAVE),
            ("laura_cut",     "FGY2WhTYpPnrIDTdsKH5", "Laura — coupante",   GRAVE),
            ("alice_cut",     "Xb7hH8MSUJpSbSDYk0k2", "Alice — coupante",   GRAVE),
        ],
    },
}

def synth(text, vid, path, settings):
    stream = client.text_to_speech.convert(
        text=text, voice_id=vid,
        model_id="eleven_multilingual_v2",
        voice_settings=settings,
        output_format="mp3_44100_128",
    )
    with open(path, "wb") as f:
        for c in stream:
            if c: f.write(c)

total = sum(len(r["voices"]) for r in CANDIDATES.values())
print(f"Tour 3 : {total} variations\n")
ok = 0
for role, d in CANDIDATES.items():
    print(f"=== {role.upper()}")
    for slug, vid, label, s in d["voices"]:
        out = OUT / f"{role}_{slug}.mp3"
        print(f"  → {label}", end=" ", flush=True)
        try:
            synth(d["line"], vid, out, s)
            size = out.stat().st_size / 1024
            if size < 2: print(f"SKIP"); out.unlink(missing_ok=True)
            else: print(f"OK ({size:.0f} KB)"); ok += 1
        except Exception as e:
            print(f"ERR: {str(e)[:80]}")
        time.sleep(0.3)
print(f"\n→ {ok} OK")
