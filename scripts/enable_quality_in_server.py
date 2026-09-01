#!/usr/bin/env python3
"""One-time, assertion-heavy migration that enables quality renderers in server.js."""

from __future__ import annotations

import json
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_server() -> None:
    path = Path("server.js")
    text = path.read_text(encoding="utf-8")
    marker = "createQualityRenderers"
    if marker not in text:
        old = """const {
  renderHome,
  renderQuizPage,
  renderResultPage,
  renderShichuuForm,
  renderShichuuResult,
  renderKetsuekiForm,
  renderKetsuekiResult,
  renderMeimeiForm,
  renderMeimeiResult,
  SITE_URL,
} = require('./views/render');"""
        new = """const originalRender = require('./views/render');
const { createQualityRenderers } = require('./views/quality-render');
Object.assign(originalRender, createQualityRenderers({ ...originalRender }));
const {
  renderHome,
  renderQuizPage,
  renderResultPage,
  renderShichuuForm,
  renderShichuuResult,
  renderKetsuekiForm,
  renderKetsuekiResult,
  renderMeimeiForm,
  renderMeimeiResult,
  SITE_URL,
} = originalRender;"""
        text = replace_once(text, old, new, "render import")

    if "'/about.html'," not in text:
        old = """    ...quizzes.map((q) => `/q/${q.id}`),
    '/privacy.html',
    '/terms.html',"""
        new = """    ...quizzes.map((q) => `/q/${q.id}`),
    '/about.html',
    '/editorial-policy.html',
    '/privacy.html',
    '/terms.html',"""
        text = replace_once(text, old, new, "sitemap trust pages")

    path.write_text(text, encoding="utf-8")


def patch_test_runner() -> None:
    path = Path("scripts/test-quality.js")
    text = path.read_text(encoding="utf-8")
    old = "const child = spawn(process.execPath, ['server-quality-entry.js'], {"
    new = "const child = spawn(process.execPath, [process.env.SERVER_ENTRY || 'server.js'], {"
    if old in text:
        text = replace_once(text, old, new, "quality test server entry")
    if "process.env.SERVER_ENTRY || 'server.js'" not in text:
        raise RuntimeError("Quality integration test does not target server.js")
    path.write_text(text, encoding="utf-8")


def patch_existing_tests() -> None:
    path = Path("run_tests.sh")
    text = path.read_text(encoding="utf-8")
    replacements = (
        (
            'echo "sitemap内のURL数: $url_count (期待値: 静的10+十干10+血液型単4+血液型ペア10+姓名判断52=86)"',
            'echo "sitemap内のURL数: $url_count (期待値: 静的12+十干10+血液型単4+血液型ペア10+姓名判断52=88)"',
        ),
        ('if [ "$url_count" == "86" ]; then', 'if [ "$url_count" == "88" ]; then'),
        (
            'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 86)"',
            'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 88)"',
        ),
    )
    for old, new in replacements:
        if old in text:
            text = replace_once(text, old, new, "sitemap test count")
    if 'if [ "$url_count" == "88" ]; then' not in text:
        raise RuntimeError("Existing test suite was not updated to 88 sitemap URLs")
    path.write_text(text, encoding="utf-8")


def patch_package() -> None:
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["main"] = "server.js"
    scripts = data.setdefault("scripts", {})
    scripts["start"] = "node server.js"
    scripts["dev"] = "node server.js"
    scripts["test"] = "node scripts/test-quality.js"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    patch_server()
    patch_test_runner()
    patch_existing_tests()
    patch_package()

    server = Path("server.js").read_text(encoding="utf-8")
    assert "createQualityRenderers({ ...originalRender })" in server
    assert "'/about.html'," in server
    assert "'/editorial-policy.html'," in server
    print("Quality renderer migration applied to server.js with verified anchors.")


if __name__ == "__main__":
    main()
