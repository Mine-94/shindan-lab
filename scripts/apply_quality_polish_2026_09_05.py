#!/usr/bin/env python3
"""Fix layout and editorial issues found by the first Chromium quality audit."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_MARKER = "BROWSER_QUALITY_FIX_2026_09_05"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}, found {count}")
    return text.replace(old, new, 1)


def replace_if_present(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    return replace_once(text, old, new, label)


def patch_css() -> None:
    path = ROOT / "public/css/visual-refresh.css"
    text = path.read_text(encoding="utf-8")
    if CSS_MARKER in text:
        return

    text += f"""

/* {CSS_MARKER}
   Browser audit fixes: readable microcopy and a true one-column priority list.
   The previous generic three-column quiz rule overrode the priority component
   and compressed Japanese text into vertical fragments on desktop. */
.visual-refresh .brand-copy small {{
  color: #5f5c6c;
  font-size: 0.68rem;
  font-weight: 700;
}}

.visual-refresh.page-home .content-section .home-priority-grid {{
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}}

.visual-refresh.page-home .home-priority-card {{
  grid-template-columns: minmax(0, 1fr) 28px;
  min-width: 0;
}}

.visual-refresh.page-home .home-priority-card h2,
.visual-refresh.page-home .home-priority-card p {{
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: normal;
  writing-mode: horizontal-tb;
}}
"""
    path.write_text(text, encoding="utf-8")


def patch_renderer() -> None:
    path = ROOT / "views/visual-refresh-render.js"
    text = path.read_text(encoding="utf-8")

    text = replace_if_present(
        text,
        "<p class=\"home-hero-kicker\">SELF DISCOVERY, MADE CLEAR</p>",
        "<p class=\"home-hero-kicker\">自分を知る、相手を知る</p>",
        "Japanese homepage kicker",
    )
    text = replace_if_present(
        text,
        "<span class=\"home-hero-card-kicker\">DISCOVER YOUR PATTERN</span>",
        "<span class=\"home-hero-card-kicker\">16タイプを見つける</span>",
        "Japanese hero-card label",
    )
    text = replace_if_present(
        text,
        ".replace('<p class=\"content-kicker\">DATA PRIORITY</p>', '<p class=\"content-kicker\">PICK UP</p>')",
        ".replace('<p class=\"content-kicker\">DATA PRIORITY</p>', '<p class=\"content-kicker\">まずはこちら</p>')",
        "Japanese priority label",
    )
    text = replace_if_present(
        text,
        "<p class=\"content-kicker\">FIND YOUR OSHI</p>",
        "<p class=\"content-kicker\">推しから探す</p>",
        "Japanese celebrity label",
    )

    text = replace_if_present(
        text,
        "function replaceFirstHeroBadge(html, label) {",
        "function replaceFirstHeroBadge(html, label, caption = 'TYPE') {",
        "hero badge function signature",
    )
    text = replace_if_present(
        text,
        "`<div class=\"type16-brand-mark\" aria-hidden=\"true\"><span>${label}</span><small>TYPE</small></div>`",
        "`<div class=\"type16-brand-mark service-brand-mark\" aria-hidden=\"true\"><span>${label}</span><small>${caption}</small></div>`",
        "purposeful service badge markup",
    )

    text = replace_if_present(
        text,
        "    '16'\n  );",
        "    '16',\n    'TYPE'\n  );",
        "16-type hub badge caption",
    )
    text = replace_if_present(
        text,
        "    '20'\n  );",
        "    '20',\n    '問'\n  );",
        "16-type test badge caption",
    )

    renderer_replacements = [
        (
            "  renderers.renderQuizPage = wrap(original, 'renderQuizPage', 'page-quiz');",
            "  renderers.renderQuizPage = wrap(original, 'renderQuizPage', 'page-quiz', (html) => replaceFirstHeroBadge(html, '診', 'テスト'));",
            "generic quiz badge",
        ),
        (
            "  renderers.renderShichuuForm = wrap(original, 'renderShichuuForm', 'page-tool');",
            "  renderers.renderShichuuForm = wrap(original, 'renderShichuuForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '十', '干'));",
            "ten-stems badge",
        ),
        (
            "  renderers.renderKetsuekiForm = wrap(original, 'renderKetsuekiForm', 'page-tool');",
            "  renderers.renderKetsuekiForm = wrap(original, 'renderKetsuekiForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '血', '型'));",
            "blood-type badge",
        ),
        (
            "  renderers.renderMeimeiForm = wrap(original, 'renderMeimeiForm', 'page-tool');",
            "  renderers.renderMeimeiForm = wrap(original, 'renderMeimeiForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '名', '前'));",
            "name-fortune badge",
        ),
        (
            "  renderers.renderType16Compatibility = wrap(original, 'renderType16Compatibility', 'page-type16-compat');",
            "  renderers.renderType16Compatibility = wrap(original, 'renderType16Compatibility', 'page-type16-compat', (html) => replaceFirstHeroBadge(html, '相', '性'));",
            "compatibility badge",
        ),
        (
            "  renderers.renderType16RelationGuide = wrap(original, 'renderType16RelationGuide', 'page-relation-guide');",
            "  renderers.renderType16RelationGuide = wrap(original, 'renderType16RelationGuide', 'page-relation-guide', (html) => replaceFirstHeroBadge(html, '相', '性'));",
            "relation-guide badge",
        ),
    ]
    for old, new, label in renderer_replacements:
        text = replace_if_present(text, old, new, label)

    path.write_text(text, encoding="utf-8")


def verify() -> None:
    css = (ROOT / "public/css/visual-refresh.css").read_text(encoding="utf-8")
    renderer = (ROOT / "views/visual-refresh-render.js").read_text(encoding="utf-8")

    required_css = [
        CSS_MARKER,
        ".content-section .home-priority-grid",
        "grid-template-columns: minmax(0, 1fr);",
        "color: #5f5c6c;",
        "writing-mode: horizontal-tb;",
    ]
    for marker in required_css:
        if marker not in css:
            raise RuntimeError(f"visual-refresh.css is missing {marker}")

    required_renderer = [
        "自分を知る、相手を知る",
        "16タイプを見つける",
        "まずはこちら",
        "推しから探す",
        "service-brand-mark",
        "replaceFirstHeroBadge(html, '診', 'テスト')",
        "replaceFirstHeroBadge(html, '十', '干')",
        "replaceFirstHeroBadge(html, '血', '型')",
        "replaceFirstHeroBadge(html, '名', '前')",
        "replaceFirstHeroBadge(html, '相', '性')",
    ]
    for marker in required_renderer:
        if marker not in renderer:
            raise RuntimeError(f"visual-refresh-render.js is missing {marker}")

    print("Applied the first browser-audit fixes and Japanese-first visual labels.")


def main() -> None:
    patch_css()
    patch_renderer()
    verify()


if __name__ == "__main__":
    main()
