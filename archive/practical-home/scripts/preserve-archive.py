#!/usr/bin/env python3
"""Preserve the earlier "The Practical Home" edition in place.

Run from the repository root:  python3 archive/practical-home/scripts/preserve-archive.py

What it does, and nothing else:
  1. rewrites the edition's absolute URLs to the archive path, so its canonicals,
     sitemap, feed and robots.txt describe where the files now live;
  2. injects a noindex meta tag, so search engines index one publication, not two;
  3. injects a visible banner linking back to the live edition.

No page content, styling, data or script of the earlier edition is altered.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]          # repository root
ARCH = Path(__file__).resolve().parents[1]          # archive/practical-home
OLD = "https://kanlerxz87-cyber.github.io/DIYHOME1/"
NEW = "https://kanlerxz87-cyber.github.io/DIYHOME1/archive/practical-home/"
BANNER_MARK = "archived-edition-banner"

BANNER = """<div id="{mark}" role="note" style="font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fdf4e4;border-bottom:1px solid #eddcbd;color:#5b4300;padding:10px 16px">
  <strong>Archived edition.</strong> This page is preserved from the earlier &ldquo;The Practical Home&rdquo; edition (PRs #2&ndash;#8) and is kept for the record, with its data and scripts intact. The live publication is <a href="{home}" style="color:#8a4b00;font-weight:700">DIY Home Upgrades</a> &mdash; products first, with a source register behind every claim.
</div>"""

changed = []
for path in sorted(ARCH.rglob("*.html")):
    depth = len(path.relative_to(ARCH).parts) - 1        # guides/x.html -> 1
    home = "../" * (depth + 2) or "./"
    text = path.read_text()
    original = text
    text = text.replace(OLD, NEW)
    if 'name="robots"' not in text:
        text = text.replace("<head>", '<head><meta name="robots" content="noindex,follow">', 1)
    if BANNER_MARK not in text:
        text = re.sub(r"(<body[^>]*>)", r"\1\n" + BANNER.format(mark=BANNER_MARK, home=home), text, count=1)
    if text != original:
        path.write_text(text)
        changed.append(path.relative_to(ROOT).as_posix())

for name in ("feed.xml", "sitemap.xml", "robots.txt"):
    p = ARCH / name
    if not p.exists():
        continue
    t = p.read_text()
    nt = t.replace(OLD, NEW)
    if nt != t:
        p.write_text(nt)
        changed.append(p.relative_to(ROOT).as_posix())

print(f"archive preserved: {len(changed)} files updated")
for c in changed:
    print("  " + c)
