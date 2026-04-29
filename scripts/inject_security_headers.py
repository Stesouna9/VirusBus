#!/usr/bin/env python3
"""Idempotent injection of security meta tags into all HTML files.

Adds CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy
right after <meta charset...> on every .html page. Re-runnable safely
(detects marker block and replaces it).

Usage: python3 scripts/inject_security_headers.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://gc.zgo.at; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
    "font-src 'self' data: https://fonts.gstatic.com; "
    "img-src 'self' data: https:; "
    "media-src 'self'; "
    "connect-src 'self' https://gc.zgo.at; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'self'; "
    "upgrade-insecure-requests"
)

BLOCK = f"""  <!-- security headers (managed by scripts/inject_security_headers.py) -->
  <meta http-equiv="Content-Security-Policy" content="{CSP}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" />
  <!-- /security headers -->
"""

MARKER_RE = re.compile(
    r"  <!-- security headers \(managed.*?\n.*?  <!-- /security headers -->\n",
    re.DOTALL,
)
CHARSET_RE = re.compile(r'(  <meta charset="utf-8" />\n)')


def patch(html: str) -> str:
    cleaned = MARKER_RE.sub("", html)
    if not CHARSET_RE.search(cleaned):
        return cleaned
    return CHARSET_RE.sub(lambda m: m.group(1) + BLOCK, cleaned, count=1)


def main() -> None:
    pages = list(ROOT.glob("*.html")) + list(ROOT.glob("episodes/*.html")) + list(ROOT.glob("personnages/*.html"))
    changed = 0
    for p in pages:
        original = p.read_text(encoding="utf-8")
        patched = patch(original)
        if patched != original:
            p.write_text(patched, encoding="utf-8")
            changed += 1
            print(f"  updated  {p.relative_to(ROOT)}")
        else:
            print(f"  ok       {p.relative_to(ROOT)}")
    print(f"\n{changed} file(s) updated, {len(pages) - changed} already up to date.")


if __name__ == "__main__":
    main()
