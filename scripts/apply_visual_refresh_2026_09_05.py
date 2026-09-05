#!/usr/bin/env python3
"""Enable the actual 2026-09-05 visual redesign after full validation."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "2026-09-05-v1"
STYLE_LINK = '<link rel="stylesheet" href="/css/visual-refresh.css" />'

BRAND_LOGO = '''<a href="/" class="logo" aria-label="しんだんラボ ホーム">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="brand-copy"><strong>しんだんラボ</strong><small>知ることで、もっと自分らしく</small></span>
        </a>'''


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}, found {count}")
    return text.replace(old, new, 1)


def static_document_files() -> list[Path]:
    candidates = sorted((ROOT / "public").glob("*.html")) + sorted(
        (ROOT / "public" / "guide").glob("*.html")
    )
    files = []
    for file in candidates:
        text = file.read_text(encoding="utf-8")
        # Search-engine ownership verification files contain only a token and
        # are intentionally not full HTML documents.
        if "</head>" in text and re.search(r"<body(?:\s|>)", text):
            files.append(file)
    return files


def patch_server() -> None:
    path = "server.js"
    text = read(path)
    marker = "createVisualRefreshRenderers"
    if marker not in text:
        anchor = """const { createType16CelebrityRenderers } = require('./views/type16-celebrity-render');
Object.assign(originalRender, createType16CelebrityRenderers({ ...originalRender }));"""
        replacement = anchor + """
const { createVisualRefreshRenderers } = require('./views/visual-refresh-render');
Object.assign(originalRender, createVisualRefreshRenderers({ ...originalRender }));"""
        text = replace_once(text, anchor, replacement, "visual renderer insertion point")
    write(path, text)


def patch_static_html() -> None:
    files = static_document_files()
    if not files:
        raise RuntimeError("No complete static HTML documents were found")

    for file in files:
        text = file.read_text(encoding="utf-8")

        if STYLE_LINK not in text:
            text = text.replace("</head>", f"{STYLE_LINK}\n</head>", 1)

        if 'data-visual-refresh=' not in text:
            class_match = re.search(r'<body class="([^"]*)">', text)
            if class_match:
                existing = class_match.group(1).strip()
                classes = f"{existing} visual-refresh page-static".strip()
                replacement = f'<body class="{classes}" data-visual-refresh="{VERSION}">'
                text = text[: class_match.start()] + replacement + text[class_match.end() :]
            elif "<body>" in text:
                text = text.replace(
                    "<body>",
                    f'<body class="visual-refresh page-static" data-visual-refresh="{VERSION}">',
                    1,
                )
            else:
                raise RuntimeError(f"{file.relative_to(ROOT)} has no supported body tag")

        text = text.replace('<a href="/" class="logo">しんだんラボ</a>', BRAND_LOGO)

        def add_nav_cta(match: re.Match[str]) -> str:
            opening, inner = match.group(1), match.group(2)
            if "site-nav-cta" in inner:
                return match.group(0)
            return (
                f'{opening}{inner}\n          '
                '<a class="site-nav-cta" href="/16type/test">診断を始める</a>\n'
                "        </nav>"
            )

        text = re.sub(
            r'(<nav class="site-nav"[^>]*>)([\s\S]*?)</nav>',
            add_nav_cta,
            text,
            count=1,
        )

        file.write_text(text, encoding="utf-8")


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    command = "node scripts/test-visual-refresh.js"
    current = data.setdefault("scripts", {}).get("test", "")
    if command not in current:
        parts = current.split(" && ") if current else []
        insert_at = 1 if parts and parts[0] == "node scripts/check-project-scope.js" else 0
        parts.insert(insert_at, command)
        data["scripts"]["test"] = " && ".join(parts)
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def patch_regression_expectations() -> None:
    run_tests_path = "run_tests.sh"
    run_tests = read(run_tests_path)
    old = 'check_contains "ホームに16タイプ・MBTI関連セクション" "$BASE/" "16タイプ・MBTI関連"'
    new = 'check_contains "ホームにおすすめ診断セクション" "$BASE/" "はじめての方におすすめの診断"'
    if old in run_tests:
        run_tests = replace_once(run_tests, old, new, "shell homepage recommendation assertion")
    write(run_tests_path, run_tests)

    quality_path = "scripts/test-quality.js"
    quality = read(quality_path)
    old_quality = "    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');"
    new_quality = "    assert(home.text.includes('はじめての方におすすめの診断'), 'Home recommendation section is missing');"
    if old_quality in quality:
        quality = replace_once(quality, old_quality, new_quality, "quality homepage recommendation assertion")
    write(quality_path, quality)


def verify_source() -> None:
    server = read("server.js")
    if "createVisualRefreshRenderers" not in server:
        raise RuntimeError("server.js does not enable the visual refresh renderer")

    package = json.loads(read("package.json"))
    if "node scripts/test-visual-refresh.js" not in package["scripts"]["test"]:
        raise RuntimeError("The visual refresh test is missing from npm test")

    static_files = static_document_files()
    for file in static_files:
        text = file.read_text(encoding="utf-8")
        for marker in (STYLE_LINK, 'data-visual-refresh="2026-09-05-v1"', 'class="brand-mark"'):
            if marker not in text:
                raise RuntimeError(f"{file.relative_to(ROOT)} is missing {marker}")
        if 'class="site-nav"' in text and 'class="site-nav-cta"' not in text:
            raise RuntimeError(f"{file.relative_to(ROOT)} is missing the navigation CTA")

    print(f"Enabled the actual visual redesign across {len(static_files)} static pages and all dynamic renderers.")


def main() -> None:
    patch_server()
    patch_static_html()
    patch_package()
    patch_regression_expectations()
    verify_source()


if __name__ == "__main__":
    main()
