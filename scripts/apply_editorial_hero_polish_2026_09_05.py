#!/usr/bin/env python3
"""Polish homepage typography and responsive navigation after screenshot review."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_MARKER = "EDITORIAL_HERO_POLISH_2026_09_05"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}, found {count}")
    return text.replace(old, new, 1)


def patch_renderer() -> None:
    path = "views/visual-refresh-render.js"
    text = read(path)
    old = '<h1 class="home-main-title" data-content-depth="home-h1" data-content-depth-version="2026-09-05-v1">無料の性格診断・<br />16タイプ相性・占いを、<br /><span>見やすく一つに。</span></h1>'
    new = '''<h1 class="home-main-title" data-content-depth="home-h1" data-content-depth-version="2026-09-05-v2">
            <span class="home-title-line">無料の性格診断</span>
            <span class="home-title-line">16タイプ相性・占いを、</span>
            <span class="home-title-line is-accent">見やすく一つに。</span>
          </h1>'''
    if new not in text:
        text = replace_once(text, old, new, "homepage title markup")
    write(path, text)


def patch_css() -> None:
    path = "public/css/visual-refresh.css"
    text = read(path)
    if CSS_MARKER in text:
        return
    text += f'''

/* {CSS_MARKER}
   Intentional Japanese line breaks and stable proportions. At tablet width the
   hero becomes one column; at phone width the seven utility links use a balanced
   four-column grid instead of leaving one orphaned link or hiding links offscreen. */
.visual-refresh .home-hero-layout {{
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: clamp(38px, 5vw, 66px);
}}

.visual-refresh .home-main-title {{
  width: 100%;
  max-width: none;
  font-size: clamp(2.35rem, 4vw, 3.35rem);
  line-height: 1.24;
}}

.visual-refresh .home-main-title .home-title-line {{
  display: block;
  color: #15142a;
  white-space: nowrap;
}}

.visual-refresh .home-main-title .home-title-line.is-accent {{
  color: var(--vr-brand-dark);
}}

@media (max-width: 860px) {{
  .visual-refresh .home-hero-layout {{
    grid-template-columns: minmax(0, 1fr);
    gap: 38px;
  }}

  .visual-refresh .site-nav {{
    flex-wrap: nowrap;
    scroll-snap-type: inline proximity;
  }}

  .visual-refresh .site-nav a {{
    flex: 0 0 auto;
    scroll-snap-align: start;
  }}
}}

@media (max-width: 620px) {{
  .visual-refresh .site-nav {{
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px 6px;
    overflow: visible;
    scroll-snap-type: none;
  }}

  .visual-refresh .site-nav a {{
    min-width: 0;
    min-height: 36px;
    padding: 7px 2px;
    justify-content: center;
    text-align: center;
    font-size: 0.72rem;
  }}

  .visual-refresh .home-main-title {{
    font-size: clamp(1.65rem, 7vw, 2rem);
    line-height: 1.3;
    letter-spacing: -0.055em;
  }}
}}
'''
    write(path, text)


def patch_visual_test() -> None:
    path = "scripts/test-visual-refresh.js"
    text = read(path)
    anchor = "    assert(home.text.includes('見やすく一つに。'), 'Improved home headline is missing');\n"
    addition = "    assert(home.text.includes('class=\"home-title-line\"'), 'Intentional title line markup is missing');\n    assert(home.text.includes('data-content-depth-version=\"2026-09-05-v2\"'), 'Polished hero version is missing');\n"
    if "Intentional title line markup is missing" not in text:
        text = replace_once(text, anchor, anchor + addition, "editorial title test anchor")
    write(path, text)


def verify() -> None:
    renderer = read("views/visual-refresh-render.js")
    css = read("public/css/visual-refresh.css")
    test = read("scripts/test-visual-refresh.js")

    for marker in (
        'class="home-title-line"',
        'class="home-title-line is-accent"',
        'data-content-depth-version="2026-09-05-v2"',
    ):
        if marker not in renderer:
            raise RuntimeError(f"visual-refresh-render.js is missing {marker}")

    for marker in (
        CSS_MARKER,
        "grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);",
        "grid-template-columns: repeat(4, minmax(0, 1fr));",
        "white-space: nowrap;",
        "overflow: visible;",
    ):
        if marker not in css:
            raise RuntimeError(f"visual-refresh.css is missing {marker}")

    if "Intentional title line markup is missing" not in test:
        raise RuntimeError("The visual regression test does not cover title line balance")

    print("Applied intentional Japanese title lines and balanced responsive navigation.")


def main() -> None:
    patch_renderer()
    patch_css()
    patch_visual_test()
    verify()


if __name__ == "__main__":
    main()
