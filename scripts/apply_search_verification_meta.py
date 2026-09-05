#!/usr/bin/env python3
"""Add optional Google, Naver and Bing ownership metadata to the homepage head."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}, found {count}")
    return text.replace(old, new, 1)


def patch_render() -> None:
    path = "views/render.js"
    text = read(path)

    old_constants = "const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || '';"
    new_constants = """const GOOGLE_SITE_VERIFICATION = (process.env.GOOGLE_SITE_VERIFICATION || '').trim();
const NAVER_SITE_VERIFICATION = (process.env.NAVER_SITE_VERIFICATION || '').trim();
const BING_SITE_VERIFICATION = (process.env.BING_SITE_VERIFICATION || '').trim();"""
    if new_constants not in text:
        text = replace_once(text, old_constants, new_constants, "verification constants")

    old_meta = "${GOOGLE_SITE_VERIFICATION ? `<meta name=\"google-site-verification\" content=\"${escapeHtml(GOOGLE_SITE_VERIFICATION)}\" />` : ''}"
    new_meta = """${GOOGLE_SITE_VERIFICATION ? `<meta name=\"google-site-verification\" content=\"${escapeHtml(GOOGLE_SITE_VERIFICATION)}\" />` : ''}
${NAVER_SITE_VERIFICATION ? `<meta name=\"naver-site-verification\" content=\"${escapeHtml(NAVER_SITE_VERIFICATION)}\" />` : ''}
${BING_SITE_VERIFICATION ? `<meta name=\"msvalidate.01\" content=\"${escapeHtml(BING_SITE_VERIFICATION)}\" />` : ''}"""
    if new_meta not in text:
        text = replace_once(text, old_meta, new_meta, "verification meta output")

    write(path, text)


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    command = "node scripts/test-search-verification.js"
    test = data.setdefault("scripts", {}).get("test", "")
    if command not in test:
        parts = test.split(" && ") if test else []
        insert_at = 1 if parts and parts[0] == "node scripts/check-project-scope.js" else 0
        parts.insert(insert_at, command)
        data["scripts"]["test"] = " && ".join(parts)
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def patch_readme() -> None:
    path = "README.md"
    text = read(path)
    marker = "`GOOGLE_SITE_VERIFICATION`"
    if "`NAVER_SITE_VERIFICATION`" not in text:
        paragraph = """

### 검색엔진 소유 확인 환경변수

홈페이지 `<head>`에 소유 확인 메타태그를 출력하려면 Render 환경변수에 각 서비스가 발급한 `content` 값만 등록합니다.

- `GOOGLE_SITE_VERIFICATION`: Google Search Console의 `google-site-verification` 값
- `NAVER_SITE_VERIFICATION`: Naver Search Advisor의 `naver-site-verification` 값
- `BING_SITE_VERIFICATION`: Bing Webmaster Tools의 `msvalidate.01` 값

값을 등록하지 않으면 해당 메타태그는 출력되지 않습니다. 사이트맵은 `https://shindan24.com/sitemap.xml`을 제출하며, 개인 이름·점수·초대 조건이 포함된 `noindex` 결과 URL은 제출하지 않습니다.
"""
        if marker in text:
            text += paragraph
        else:
            text += paragraph
    write(path, text)


def verify() -> None:
    render = read("views/render.js")
    for marker in (
        "NAVER_SITE_VERIFICATION",
        "BING_SITE_VERIFICATION",
        'name="naver-site-verification"',
        'name="msvalidate.01"',
    ):
        if marker not in render:
            raise RuntimeError(f"views/render.js is missing {marker}")

    package = json.loads(read("package.json"))
    if "node scripts/test-search-verification.js" not in package["scripts"]["test"]:
        raise RuntimeError("Search verification test is missing from npm test")

    print("Added optional Google, Naver and Bing ownership metadata support.")


def main() -> None:
    patch_render()
    patch_package()
    patch_readme()
    verify()


if __name__ == "__main__":
    main()
