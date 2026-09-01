#!/usr/bin/env python3
"""Run the 16-type migration with a unique live-verifier anchor."""

from __future__ import annotations

from pathlib import Path

import enable_type16 as base


def patch_live_verifier() -> None:
    path = Path(".github/workflows/verify-live-quality.yml")
    text = path.read_text(encoding="utf-8")

    old_paths = """    paths:
      - .github/workflows/verify-live-quality.yml"""
    new_paths = """    paths:
      - server.js
      - views/**
      - data/**
      - public/**
      - package*.json
      - .github/workflows/verify-live-quality.yml"""
    if old_paths in text:
        text = base.replace_once(text, old_paths, new_paths, "live verifier paths")

    text = text.replace("= '88'", "= '107'")
    text = text.replace("== 88", "== 107")
    text = text.replace("88 sitemap URLs", "107 sitemap URLs")

    if "/tmp/type16.html" not in text:
        old_curls = """          curl -fsS --max-time 45 https://shindan-lab.onrender.com/editorial-policy.html -o /tmp/policy.html
          curl -fsS --max-time 45 https://shindan-lab.onrender.com/sitemap.xml -o /tmp/sitemap.xml"""
        new_curls = """          curl -fsS --max-time 45 https://shindan-lab.onrender.com/editorial-policy.html -o /tmp/policy.html
          curl -fsS --max-time 45 https://shindan-lab.onrender.com/sitemap.xml -o /tmp/sitemap.xml
          curl -fsS --max-time 45 https://shindan-lab.onrender.com/16type -o /tmp/type16.html
          curl -fsS --max-time 45 https://shindan-lab.onrender.com/16type/test -o /tmp/type16-test.html
          curl -fsS --max-time 45 'https://shindan-lab.onrender.com/16type/r/ENFP?e=80&s=20&t=20&j=20' -o /tmp/type16-result.html
          curl -fsS --max-time 45 'https://shindan-lab.onrender.com/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend' -o /tmp/type16-compat.html"""
        text = base.replace_once(text, old_curls, new_curls, "unique live type16 curl block")

        old_assertions = """          grep -q '他サイトの文章をコピーしません' /tmp/policy.html
          grep -q '/editorial-policy.html</loc>' /tmp/sitemap.xml"""
        new_assertions = """          grep -q '他サイトの文章をコピーしません' /tmp/policy.html
          grep -q '/editorial-policy.html</loc>' /tmp/sitemap.xml
          grep -q '16タイプ性格一覧' /tmp/type16.html
          grep -q 'window.__TYPE16_TEST__' /tmp/type16-test.html
          grep -q '今回の回答バランス' /tmp/type16-result.html
          grep -q '友達の相性目安' /tmp/type16-compat.html
          grep -q 'noindex, follow' /tmp/type16-compat.html
          grep -q '/16type/r/ENFP</loc>' /tmp/sitemap.xml"""
        text = base.replace_once(
            text,
            old_assertions,
            new_assertions,
            "unique live type16 assertion block",
        )

    if "107" not in text or "/tmp/type16.html" not in text:
        raise RuntimeError("Live verifier was not fully updated for the 16-type release")
    path.write_text(text, encoding="utf-8")


def main() -> None:
    base.patch_render_exports()
    base.patch_server()
    base.patch_run_tests()
    base.patch_quality_integration_test()
    base.patch_package()
    base.patch_indexnow()
    patch_live_verifier()
    base.patch_daily_log()
    base.patch_readme()

    server = Path("server.js").read_text(encoding="utf-8")
    assert "app.get('/16type'" in server
    assert "TYPE16_CODES.map" in server
    assert "createType16Renderers" in server

    render = Path("views/render.js").read_text(encoding="utf-8")
    assert "  baseLayout," in render
    assert "  siteHeaderNav," in render

    print("16-type production migration v2 applied; expected sitemap count: 107.")


if __name__ == "__main__":
    main()
