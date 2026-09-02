#!/usr/bin/env python3
"""Enable the tested 16-type share-card layer in production."""

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
    marker = "createType16ShareRenderers"
    if marker not in text:
        old = """const { createType16Renderers } = require('./views/type16-render');
Object.assign(originalRender, createType16Renderers({ ...originalRender }));"""
        new = """const { createType16Renderers } = require('./views/type16-render');
Object.assign(originalRender, createType16Renderers({ ...originalRender }));
const { createType16ShareRenderers } = require('./views/type16-share-render');
Object.assign(originalRender, createType16ShareRenderers({ ...originalRender }));"""
        text = replace_once(text, old, new, "type16 renderer stack")

    if text.index("createType16ShareRenderers") < text.index("const {\n  renderHome"):
        path.write_text(text, encoding="utf-8")
        return
    raise RuntimeError("Share renderer must be enabled before renderer destructuring")


def patch_package() -> None:
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})
    current = scripts.get("test", "")
    share_test = "node scripts/test-type16-share.js"
    if share_test not in current:
        scripts["test"] = f"{share_test} && {current}" if current else share_test
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def patch_daily_log() -> None:
    path = Path("docs/japan-seo-daily-log.md")
    text = path.read_text(encoding="utf-8")
    heading = "## 2026-09-02 — 16타입 결과·궁합 공유 이미지 개선"
    if heading in text:
        return

    entry = """## 2026-09-02 — 16타입 결과·궁합 공유 이미지 개선

### 오늘 확인한 데이터

- 16타입 상성 서비스 `ふたりのトリセツ`가 공개한 2026년 7월 20일~8월 19일 GA4 실측은 약 3.7만 이용자, 약 10.6만 페이지뷰였다. 이 서비스는 결과를 한 장 이미지로 저장·공유할 수 있고 7가지 디자인을 제공한다. 공유 이미지가 성장의 단독 원인이라는 뜻은 아니지만, 반복 이용되는 상성 도구에서 결과 이미지가 핵심 제품 기능으로 사용된다는 직접 사례다.
- Makko 진단 포털은 누적 1억 회 이상의 이용 데이터를 토대로 SNS에서 공유되는 진단의 특징을 별도로 분석했다. 또한 2026년 상반기 인기 진단에서는 친구나 연인과 결과를 비교하기 쉬운 콘텐츠가 이용을 모았다고 밝혔다.
- 현재 しんだんラボ의 최상단 1·2위인 `16タイプ簡易診断`과 `16タイプ相性チェック`은 링크 공유만 가능해, 이미지 중심인 Instagram·Threads에서 결과를 바로 보여주기 어려웠다.

### 오늘의 판단

신규 테스트를 또 추가하기보다 이미 최상단에 배치한 16타입 진단과 궁합의 **공유 완료율을 높이는 개선**을 먼저 적용한다. 외부 서비스의 캐릭터·디자인은 복제하지 않고, しんだんラボ 전용 4:5 결과 카드를 자체 제작한다.

### 구현 내용

- 16타입 결과 페이지에 1080×1350px 결과 카드 생성 기능 추가
- E/I·S/N·T/F·J/P 응답 비율이 있는 경우 이미지에도 표시
- 궁합 결과에 두 유형, 관계 종류, 점수, 대화 팁을 한 장으로 구성
- 모바일에서 파일 공유가 지원되면 운영체제 공유 메뉴 사용
- 파일 공유가 지원되지 않는 데스크톱에서는 PNG 다운로드로 자동 전환
- Canvas를 이용해 브라우저 안에서만 생성하며 이미지·개인정보를 서버에 업로드하지 않음
- GA4 이벤트 `type16_share_card`에 이미지 공유/다운로드 방식, 유형, 상대 유형, 관계를 기록
- 기존 링크 공유도 함께 유지

### 참고 출처

- ふたりのトリセツ 16타입 상성 실측 보고서: https://futari-no-torisetsu.com/report/16type-compatibility-2026
- M16合同会社 / PR TIMES: https://prtimes.jp/main/html/rd/p/000000007.000175516.html
- Makko 진단 공유 분석: https://www.rbbtoday.com/release/prtimes2-today/20260526/1278691.html
- Makko 2026년 상반기 인기 진단: https://prtimes.jp/main/html/rd/p/000000021.000143217.html

---

"""
    anchor = "---\n\n"
    text = replace_once(text, anchor, anchor + entry, "daily log first separator")
    path.write_text(text, encoding="utf-8")


def main() -> None:
    patch_server()
    patch_package()
    patch_daily_log()

    server = Path("server.js").read_text(encoding="utf-8")
    package = json.loads(Path("package.json").read_text(encoding="utf-8"))
    assert "createType16ShareRenderers({ ...originalRender })" in server
    assert "node scripts/test-type16-share.js" in package["scripts"]["test"]
    print("Enabled the Japanese 16-type share-card layer and test coverage.")


if __name__ == "__main__":
    main()
