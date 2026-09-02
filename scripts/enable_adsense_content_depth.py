#!/usr/bin/env python3
"""Enable the tested AdSense content-depth renderer in the production stack."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_server() -> None:
    path = "server.js"
    text = read(path)
    block = """const { createGrowthRenderers } = require('./views/growth-render');
Object.assign(originalRender, createGrowthRenderers({ ...originalRender }));
const { createAdsenseContentRenderers } = require('./views/adsense-content-render');
Object.assign(originalRender, createAdsenseContentRenderers({ ...originalRender }));"""
    if "createAdsenseContentRenderers" not in text:
        text = replace_once(
            text,
            """const { createGrowthRenderers } = require('./views/growth-render');
Object.assign(originalRender, createGrowthRenderers({ ...originalRender }));""",
            block,
            "growth renderer stack",
        )
    if text.index("createAdsenseContentRenderers") > text.index("const {\n  renderHome"):
        raise RuntimeError("AdSense content layer must be applied before renderer destructuring")
    write(path, text)


def lengthen_static_descriptions() -> None:
    replacements = {
        "public/editorial-policy.html": (
            'しんだんラボの質問、結果文、占い解説をどのように企画、作成、確認、訂正しているかを説明します。',
            'しんだんラボの質問、結果文、占い解説をどのように企画・作成・確認・訂正しているか、独自性、広告との分離、AI支援ツールの扱いまで説明します。',
        ),
        "public/contact.html": (
            'しんだんラボへの不具合報告、内容の訂正依頼、権利・プライバシー・広告に関するお問い合わせ窓口です。',
            'しんだんラボへの表示不具合報告、内容の訂正依頼、著作権・商標・プライバシー、広告表示、運営に関する連絡方法をご案内します。',
        ),
    }
    for path, (old, new) in replacements.items():
        text = read(path)
        if new not in text:
            if text.count(old) < 1:
                raise RuntimeError(f"Static description anchor missing in {path}")
            text = text.replace(old, new)
        write(path, text)


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    scripts = data.setdefault("scripts", {})
    current = scripts.get("test", "")
    commands = [
        "node scripts/test-adsense-content-depth.js",
        "node scripts/audit-adsense-content.js",
    ]
    for command in reversed(commands):
        if command not in current:
            current = f"{command} && {current}" if current else command
    scripts["test"] = current
    write(path, json.dumps(data, ensure_ascii=False, indent=2))


def patch_approval_doc() -> None:
    path = "docs/adsense-approval-readiness-2026-09-02.md"
    text = read(path)
    section = """
## 2차 콘텐츠 전수 감사 및 보강

60개 색인 대상 페이지를 실제 렌더링해 본문 길이, H1, 메타 설명, canonical, 내부 링크, 동일 계열 페이지 유사도를 검사했다. 첫 감사에서 자동 생성 페이지 간 고유성 문제는 발견되지 않았지만, 홈 H1 누락과 20개 페이지의 설명 부족이 확인됐다.

이에 다음을 보강했다.

- 홈에 검색 의도를 명확히 설명하는 H1 추가
- 기존 선택형 심리테스트 4종에 고유한 이용 장면, 답변 방법, 결과 유형 미리보기, 결과 활용법, FAQ 추가
- 십간 결과 10종에 유형별 강점, 일·학습, 인간관계, 균형 조절, 같은 오행의 음양 차이 추가
- 혈액형 단독 결과 4종에 강점, 스트레스 상황, 관계, 전달 방법을 서로 다른 원고로 추가
- 혈액형 입력 페이지에 이용 방법과 한계, FAQ 추가
- 姓名判断 입력 페이지에 오격 계산 방식, 확인 순서, 개인정보·결과 URL 안내, FAQ 추가
- 짧았던 십간·혈액형 단독 결과의 검색 설명을 고유 문구로 교체

본문 550자와 유사도 0.78은 Google의 공식 기준이 아니라 내부 검토선으로만 사용한다. 최종 목표는 숫자를 맞추는 것이 아니라, 각 페이지가 결과의 의미와 한계를 독립적으로 설명하는 것이다.
"""
    if "## 2차 콘텐츠 전수 감사 및 보강" not in text:
        text += section
    write(path, text)


def main() -> None:
    patch_server()
    lengthen_static_descriptions()
    patch_package()
    patch_approval_doc()

    server = read("server.js")
    package = read("package.json")
    assert "createAdsenseContentRenderers" in server
    assert "test-adsense-content-depth.js" in package
    assert "audit-adsense-content.js" in package
    print("Enabled the AdSense content-depth layer and added it to the full test command.")


if __name__ == "__main__":
    main()
