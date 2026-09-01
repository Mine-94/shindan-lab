#!/usr/bin/env python3
"""Enable the validated 16-type feature in the production server."""

from __future__ import annotations

import json
from pathlib import Path

EXPECTED_SITEMAP_COUNT = 107


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_render_exports() -> None:
    path = Path("views/render.js")
    text = path.read_text(encoding="utf-8")
    marker = "  baseLayout,\n  escapeHtml,\n  safeJsonLd,\n  siteHeaderNav,\n  renderHome,"
    if marker not in text:
        text = replace_once(
            text,
            "module.exports = {\n  renderHome,",
            "module.exports = {\n  baseLayout,\n  escapeHtml,\n  safeJsonLd,\n  siteHeaderNav,\n  renderHome,",
            "render module exports",
        )
    path.write_text(text, encoding="utf-8")


def patch_server() -> None:
    path = Path("server.js")
    text = path.read_text(encoding="utf-8")

    if "require('./data/type16')" not in text:
        text = replace_once(
            text,
            "const { allMeimeiCombos } = require('./data/seo-longtail');",
            "const { allMeimeiCombos } = require('./data/seo-longtail');\n"
            "const { TYPE16_CODES, normalizeType16Code } = require('./data/type16');",
            "type16 data import",
        )

    if "createType16Renderers" not in text:
        text = replace_once(
            text,
            "Object.assign(originalRender, createQualityRenderers({ ...originalRender }));",
            "Object.assign(originalRender, createQualityRenderers({ ...originalRender }));\n"
            "const { createType16Renderers } = require('./views/type16-render');\n"
            "Object.assign(originalRender, createType16Renderers({ ...originalRender }));",
            "type16 renderer wrapper",
        )

    if "  renderType16Hub," not in text:
        text = replace_once(
            text,
            "  renderMeimeiResult,\n  SITE_URL,",
            "  renderMeimeiResult,\n"
            "  renderType16Hub,\n"
            "  renderType16Test,\n"
            "  renderType16Result,\n"
            "  renderType16Compatibility,\n"
            "  SITE_URL,",
            "type16 renderer destructuring",
        )

    if "'/16type'," not in text:
        text = replace_once(
            text,
            "    ...quizzes.map((q) => `/q/${q.id}`),\n",
            "    ...quizzes.map((q) => `/q/${q.id}`),\n"
            "    '/16type',\n"
            "    '/16type/test',\n"
            "    '/16type/compatibility',\n"
            "    ...TYPE16_CODES.map((code) => `/16type/r/${code}`),\n",
            "type16 sitemap paths",
        )

    if "app.get('/16type'," not in text:
        routes = """// --- 16タイプ診断・相性チェック（公式MBTIとは別の独自コンテンツ） ---
app.get('/16type', (req, res) => {
  res.send(renderType16Hub());
});

app.get('/16type/test', (req, res) => {
  res.send(renderType16Test());
});

app.get('/16type/r/:code', (req, res) => {
  const code = normalizeType16Code(req.params.code);
  if (!TYPE16_CODES.includes(code)) return res.redirect('/16type');
  res.send(renderType16Result(code, req.query));
});

app.get('/16type/compatibility', (req, res) => {
  res.send(renderType16Compatibility(req.query));
});

"""
        text = replace_once(
            text,
            "// --- 簡易四柱推命（十干タイプ診断） ---",
            routes + "// --- 簡易四柱推命（十干タイプ診断） ---",
            "type16 routes",
        )

    path.write_text(text, encoding="utf-8")


def patch_run_tests() -> None:
    path = Path("run_tests.sh")
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "静的12+十干10+血液型単4+血液型ペア10+姓名判断52=88",
        "静的31+十干10+血液型単4+血液型ペア10+姓名判断52=107",
    )
    text = text.replace('if [ "$url_count" == "88" ]; then', 'if [ "$url_count" == "107" ]; then')
    text = text.replace(
        'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 88)"',
        'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 107)"',
    )

    if "=== 16タイプ診断・相性チェック ===" not in text:
        block = '''echo ""
echo "=== 16タイプ診断・相性チェック ==="
check_status "16タイプ一覧" "$BASE/16type" 200
check_contains "ホームに16タイプ・MBTI関連セクション" "$BASE/" "16タイプ・MBTI関連"
check_contains "16タイプ一覧に公式MBTIとの区別" "$BASE/16type" "公式MBTI®ではありません"
check_status "16タイプ簡易診断" "$BASE/16type/test" 200
check_contains "簡易診断に20問データ" "$BASE/16type/test" "window.__TYPE16_TEST__"
check_status "16タイプ結果(ENFP)" "$BASE/16type/r/ENFP?e=80&s=20&t=20&j=20" 200
check_contains "ENFP結果に回答バランス" "$BASE/16type/r/ENFP?e=80&s=20&t=20&j=20" "今回の回答バランス"
check_contains "ENFP結果に恋愛解説" "$BASE/16type/r/ENFP" "恋愛で出やすい傾向"
check_redirect_location "不正な16タイプ→一覧" "$BASE/16type/r/XXXX" "/16type"
check_status "16タイプ相性フォーム" "$BASE/16type/compatibility" 200
check_status "16タイプ相性結果" "$BASE/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend" 200
check_contains "相性結果に友達場面" "$BASE/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend" "友達の相性目安"
check_contains "相性クエリ結果はnoindex" "$BASE/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend" "noindex, follow"
check_contains "sitemapに16タイプ診断" "$BASE/sitemap.xml" "/16type/test</loc>"
check_contains "sitemapにENFP詳細" "$BASE/sitemap.xml" "/16type/r/ENFP</loc>"

'''
        text = replace_once(
            text,
            'echo ""\necho "=== タイプ+一致率結合型(?s=0~100) ==="',
            block + 'echo ""\necho "=== タイプ+一致率結合型(?s=0~100) ==="',
            "type16 regression test insertion",
        )

    if 'if [ "$url_count" == "107" ]; then' not in text:
        raise RuntimeError("run_tests.sh sitemap expectation was not updated to 107")
    path.write_text(text, encoding="utf-8")


def patch_quality_integration_test() -> None:
    path = Path("scripts/test-quality.js")
    text = path.read_text(encoding="utf-8")

    if "TYPE16_CODES" not in text:
        text = replace_once(
            text,
            "const editorial = require('../data/quiz-editorial');",
            "const editorial = require('../data/quiz-editorial');\n"
            "const { TYPE16_CODES } = require('../data/type16');",
            "type16 integration test import",
        )

    if "Home 16-type section is missing" not in text:
        text = replace_once(
            text,
            "    assert(home.text.includes('目的から診断を選ぶ'), 'Home guide is missing');",
            "    assert(home.text.includes('目的から診断を選ぶ'), 'Home guide is missing');\n"
            "    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');",
            "home type16 assertion",
        )

    if "const type16Hub = await fetchText('/16type');" not in text:
        block = """    const type16Hub = await fetchText('/16type');
    assert(type16Hub.response.status === 200, '16-type hub did not return 200');
    assert(type16Hub.text.includes('16タイプ性格一覧'), '16-type hub heading is missing');
    assert(type16Hub.text.includes('公式MBTI®ではありません'), 'Official MBTI distinction is missing');

    const type16Test = await fetchText('/16type/test');
    assert(type16Test.response.status === 200, '16-type test did not return 200');
    assert(type16Test.text.includes('window.__TYPE16_TEST__'), '16-type test data is missing');

    for (const code of TYPE16_CODES) {
      const typeResult = await fetchText(`/16type/r/${code}`);
      assert(typeResult.response.status === 200, `16-type result did not return 200: ${code}`);
      assert(typeResult.text.includes(code), `16-type code missing from result: ${code}`);
      assert(
        typeResult.text.includes('恋愛で出やすい傾向'),
        `Love guidance missing from 16-type result: ${code}`
      );
    }

    const type16Compatibility = await fetchText(
      '/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend'
    );
    assert(type16Compatibility.response.status === 200, '16-type compatibility did not return 200');
    assert(type16Compatibility.text.includes('友達の相性目安'), 'Compatibility context is missing');
    assert(type16Compatibility.text.includes('noindex, follow'), 'Query result noindex is missing');

"""
        text = replace_once(
            text,
            "    for (const quiz of quizzes) {",
            block + "    for (const quiz of quizzes) {",
            "type16 integration assertions",
        )

    text = text.replace(
        "assert(urlCount === 88, `Unexpected sitemap URL count: ${urlCount}`);",
        "assert(urlCount === 107, `Unexpected sitemap URL count: ${urlCount}`);",
    )
    text = text.replace(
        "console.log('PASS: home, trust pages, structured data, HTML and sitemap checks passed.');",
        "console.log('PASS: home, trust pages, 16-type pages, structured data, HTML and sitemap checks passed.');",
    )
    if "assert(urlCount === 107" not in text:
        raise RuntimeError("scripts/test-quality.js sitemap expectation was not updated")
    path.write_text(text, encoding="utf-8")


def patch_package() -> None:
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("scripts", {})["test"] = (
        "node scripts/test-type16.js && node scripts/test-quality.js"
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def patch_indexnow() -> None:
    path = Path(".github/workflows/indexnow.yml")
    text = path.read_text(encoding="utf-8")
    text = text.replace("88-page", "107-page")
    text = text.replace("all 88 sitemap URLs", "all 107 sitemap URLs")
    text = text.replace('"$url_count" = \'88\'', '"$url_count" = \'107\'')
    text = text.replace("len(urls) != 88", "len(urls) != 107")
    text = text.replace("Expected 88 verified URLs", "Expected 107 verified URLs")
    text = text.replace("Prepared 88 URLs", "Prepared 107 URLs")
    text = text.replace("88-URL", "107-URL")
    if "len(urls) != 107" not in text or '"$url_count" = \'107\'' not in text:
        raise RuntimeError("IndexNow workflow was not updated to 107 URLs")
    path.write_text(text, encoding="utf-8")


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
        text = replace_once(text, old_paths, new_paths, "live verifier paths")

    text = text.replace("= '88'", "= '107'")
    text = text.replace("== 88", "== 107")
    text = text.replace("88 sitemap URLs", "107 sitemap URLs")

    if "/tmp/type16.html" not in text:
        text = replace_once(
            text,
            "          curl -fsS --max-time 45 https://shindan-lab.onrender.com/sitemap.xml -o /tmp/sitemap.xml",
            "          curl -fsS --max-time 45 https://shindan-lab.onrender.com/sitemap.xml -o /tmp/sitemap.xml\n"
            "          curl -fsS --max-time 45 https://shindan-lab.onrender.com/16type -o /tmp/type16.html\n"
            "          curl -fsS --max-time 45 https://shindan-lab.onrender.com/16type/test -o /tmp/type16-test.html\n"
            "          curl -fsS --max-time 45 'https://shindan-lab.onrender.com/16type/r/ENFP?e=80&s=20&t=20&j=20' -o /tmp/type16-result.html\n"
            "          curl -fsS --max-time 45 'https://shindan-lab.onrender.com/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend' -o /tmp/type16-compat.html",
            "live type16 curls",
        )
        text = replace_once(
            text,
            "          grep -q '/editorial-policy.html</loc>' /tmp/sitemap.xml",
            "          grep -q '/editorial-policy.html</loc>' /tmp/sitemap.xml\n"
            "          grep -q '16タイプ性格一覧' /tmp/type16.html\n"
            "          grep -q 'window.__TYPE16_TEST__' /tmp/type16-test.html\n"
            "          grep -q '今回の回答バランス' /tmp/type16-result.html\n"
            "          grep -q '友達の相性目安' /tmp/type16-compat.html\n"
            "          grep -q 'noindex, follow' /tmp/type16-compat.html\n"
            "          grep -q '/16type/r/ENFP</loc>' /tmp/sitemap.xml",
            "live type16 assertions",
        )

    if "107" not in text:
        raise RuntimeError("Live verifier was not updated to 107 URLs")
    path.write_text(text, encoding="utf-8")


def patch_daily_log() -> None:
    path = Path("docs/japan-seo-daily-log.md")
    text = path.read_text(encoding="utf-8")
    if "## 2026-09-02 — 16타입·MBTI 관련 검색 의도 확장" in text:
        return

    entry = """## 2026-09-02 — 16타입·MBTI 관련 검색 의도 확장

### 오늘 확인한 일본 시장 신호

- 2026년 1~8월 일본의 16타입 상성 서비스 한 곳이 공개한 이용 로그에서는 14,507건의 진단 행동과 6,245명의 고유 이용자가 집계됐다. 해당 서비스 내부 데이터라 일본 전체를 대표하지는 않지만, `16タイプ 相性`이 실제 반복 이용되는 도구형 검색 의도라는 근거로 참고할 수 있다.
- 같은 서비스의 2026년 8월 27일 공개 자료에서는 17세 이하 이용자의 43.0%가 친구 관계로 상성을 확인했고, 관계 선택지를 늘린 뒤 친구 진단 건수가 크게 늘었다. 따라서 연애만 제공하기보다 친구·직장·가족까지 관계 맥락을 나누는 편이 이용 목적과 맞는다.
- 일본에서는 2026년에도 16타입 형식을 직업·돈·간호사·취미 등 특정 상황에 적용한 신규 진단이 계속 공개되고 있다. 단순히 16개 이름을 나열하는 페이지보다, 진단 후 실제 행동 팁까지 연결하는 구조가 공통적이다.
- 일본MBTI협회는 무료 16타입 성격진단과 정식 MBTI®가 전혀 다른 것이라고 명확히 안내한다. 검색어 유입을 위해 `MBTI`를 쓰더라도 공식 검사처럼 표시하거나 제휴 관계를 암시하면 안 된다.

### 오늘의 판단

사용자의 추가 지시인 “MBTI 관련 궁합, 유형, 심리테스트도 추가”를 반영해, 얇은 퀴즈 여러 개 대신 하나의 16타입 허브를 구축한다.

1. `16タイプ簡易診断`: 20문항, E/I·S/N·T/F·J/P 각 5문항
2. `16タイプ相性チェック`: 연애·친구·직장·가족 4개 관계
3. `16タイプ性格一覧`: 16개 유형별 강점·주의점·연애·친구·직장·대화 팁

### 구현 원칙

- 16개 유형명과 설명, 20개 질문, 상성 계산 문구를 모두 자체 제작했다.
- 16Personalities의 캐릭터명·그림·설명문을 복제하지 않았다.
- 모든 관련 페이지에 `公式MBTI®ではありません` 고지와 일본MBTI협회 안내 링크를 표시한다.
- 상성 수치는 과학적 예측값이 아니라 4개 축과 관계 맥락을 조합한 편집부 독자 기준임을 밝힌다.
- 256개 조합별 얇은 SEO 페이지를 만들지 않는다. 상성 쿼리 결과는 `noindex, follow`로 처리하고, 도구 본문 한 페이지에 설명과 FAQ를 집중한다.
- 반대로 16개 유형 상세 페이지는 각각 고유한 장문 해설을 제공하므로 사이트맵에 포함한다.
- 추가 후 사이트맵은 88개에서 107개 URL로 증가한다.

### 참고 출처

- 일본MBTI협회: 무료 16타입 진단과 공식 MBTI®의 차이에 관한 안내
- M16合同会社 / PR TIMES: 2026년 1~8월 16타입 상성 이용 행동 로그
- M16合同会社 / PR TIMES: 2026년 8월 27일 10대 친구 관계 이용 자료
- 2026년 공개된 일본의 직업·금전 분야 16타입 진단 사례

---

"""
    text = replace_once(
        text,
        "## 2026-09-01",
        entry + "## 2026-09-01",
        "daily log insertion",
    )
    path.write_text(text, encoding="utf-8")


def patch_readme() -> None:
    path = Path("README.md")
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "姓名判断・血液型占い・簡易四柱推命の3ツールと、SNSで共有しやすい性格診断3種を提供します。",
        "姓名判断・血液型占い・簡易四柱推命の3ツール、複数の独自性格診断、16タイプ簡易診断と関係別相性チェックを提供します。",
    )
    old = """### タイプ診断（既存、選択式クイズ）
- 推し活タイプ診断 / 本当の性格タイプ診断 / 人生の選択バランスゲーム（`/q/:id`）
"""
    new = """### タイプ診断（選択式クイズ）
- 推し活タイプ診断 / 本当の性格タイプ診断 / 人生の選択バランスゲーム / かくれキャラ診断（`/q/:id`）

### 16タイプ・MBTI関連（非公式）
- **16タイプ簡易診断** (`/16type/test`) — 20問でE/I・S/N・T/F・J/Pの回答傾向を整理。
- **16タイプ相性チェック** (`/16type/compatibility`) — 恋愛・友達・仕事・家族の4場面で、二人の違いと会話のコツを表示。
- **16タイプ性格一覧** (`/16type`) — 16タイプそれぞれの強み・注意点・恋愛・友情・仕事・コミュニケーションを独自解説。

これらは公式MBTI®ではありません。MBTI®はThe Myers-Briggs Companyの登録商標であり、当サイトは日本MBTI協会およびThe Myers-Briggs Companyと関係のない非公式エンタメコンテンツです。
"""
    if old in text:
        text = replace_once(text, old, new, "README type section")
    path.write_text(text, encoding="utf-8")


def main() -> None:
    patch_render_exports()
    patch_server()
    patch_run_tests()
    patch_quality_integration_test()
    patch_package()
    patch_indexnow()
    patch_live_verifier()
    patch_daily_log()
    patch_readme()

    server = Path("server.js").read_text(encoding="utf-8")
    assert "app.get('/16type'" in server
    assert "TYPE16_CODES.map" in server
    assert "createType16Renderers" in server

    render = Path("views/render.js").read_text(encoding="utf-8")
    assert "  baseLayout," in render
    assert "  siteHeaderNav," in render

    print(
        f"16-type production migration applied; expected sitemap count: {EXPECTED_SITEMAP_COUNT}."
    )


if __name__ == "__main__":
    main()
