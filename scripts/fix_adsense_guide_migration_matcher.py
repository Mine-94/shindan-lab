#!/usr/bin/env python3
"""Correct the dynamic navigation indentation in the one-time guide migration."""

from pathlib import Path

path = Path(__file__).resolve().with_name("apply_adsense_seo_guides_2026_09_05.py")
text = path.read_text(encoding="utf-8")
old = '    text = replace_if_present(text, OLD_NAV_PAIR, NEW_NAV_PAIR, "dynamic navigation guide link")'
new = '''    dynamic_old = """      <a href=\\"/ketsueki\\">占い</a>
      <a href=\\"/about.html\\">運営情報</a>"""
    dynamic_new = """      <a href=\\"/ketsueki\\">占い</a>
      <a href=\\"/guide/\\">使い方</a>
      <a href=\\"/about.html\\">運営情報</a>"""
    text = replace_if_present(text, dynamic_old, dynamic_new, "dynamic navigation guide link")'''

if new in text:
    print("Dynamic navigation matcher is already corrected.")
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("Corrected the dynamic navigation matcher.")
else:
    raise SystemExit("Expected dynamic navigation matcher was not found.")
