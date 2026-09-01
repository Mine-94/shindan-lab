#!/usr/bin/env python3
"""Apply the data-driven Japanese homepage ordering with strict anchors."""

from __future__ import annotations

from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def replace_function_range(
    text: str, start_signature: str, next_signature: str, replacement: str, label: str
) -> str:
    start = text.find(start_signature)
    if start == -1:
        raise RuntimeError(f"Missing {label} start signature: {start_signature}")
    end = text.find(next_signature, start)
    if end == -1:
        raise RuntimeError(f"Missing {label} end signature: {next_signature}")
    return f"{text[:start]}{replacement.rstrip()}\n\n{text[end:]}"


def patch_type16_renderer() -> None:
    path = Path("views/type16-render.js")
    text = path.read_text(encoding="utf-8")

    if "require('../data/home-priority')" not in text:
        text = replace_once(
            text,
            "} = require('../data/type16');",
            "} = require('../data/type16');\n"
            "const {\n"
            "  HOME_PRIORITY_VERSION,\n"
            "  HOME_PRIORITY_ITEMS,\n"
            "  sortByPriority,\n"
            "} = require('../data/home-priority');",
            "home priority import",
        )

    replacement = r'''function homePriorityAttributes(itemId, rank) {
  const item = HOME_PRIORITY_ITEMS[itemId];
  if (!item) throw new Error(`Unknown homepage priority item: ${itemId}`);
  return [
    `data-home-priority-id="${itemId}"`,
    `data-home-priority-rank="${rank}"`,
    `data-home-priority-score="${item.score.toFixed(1)}"`,
  ].join(' ');
}

function homePriorityBadge(rank) {
  return `<span class="home-priority-badge">データ優先 ${rank}位</span>`;
}

function homeType16Block() {
  return `
    <section class="content-section type16-home-section home-priority-section" aria-labelledby="type16-home-title" data-home-priority-version="${HOME_PRIORITY_VERSION}">
      <div class="type16-section-heading home-priority-heading">
        <div>
          <p class="content-kicker">DATA PRIORITY</p>
          <h2 class="section-title" id="type16-home-title">16タイプ・MBTI関連を中心に、今おすすめの診断</h2>
          <p>日本の公開調査、実サービスの利用行動、検索意図、初めて使う人の始めやすさを点数化し、上位3件を先に表示しています。</p>
          <p class="home-priority-method">編集順位の最終更新: 2026年9月2日。サイト内の実測データが十分にたまった後は、クリック率・完了率・共有率を優先して見直します。</p>
        </div>
        <a class="type16-text-link" href="/16type">16タイプ一覧を見る →</a>
      </div>
      <div class="quiz-grid home-priority-grid">
        <a href="/16type/test" class="quiz-card home-priority-card" style="--accent:#6f5cd7" ${homePriorityAttributes('type16-test', 1)}>
          ${homePriorityBadge(1)}
          <div class="quiz-card-badge">🧩</div>
          <h2>16タイプ簡易診断</h2>
          <p>20問でE/I・S/N・T/F・J/Pの今の傾向をチェック</p>
          <span class="quiz-card-cta">無料で診断する →</span>
        </a>
        <a href="/16type/compatibility" class="quiz-card home-priority-card" style="--accent:#e26d8a" ${homePriorityAttributes('type16-compatibility', 2)}>
          ${homePriorityBadge(2)}
          <div class="quiz-card-badge">💞</div>
          <h2>16タイプ相性チェック</h2>
          <p>恋愛・友達・仕事・家族に分けて、二人の違いと会話のコツを確認</p>
          <span class="quiz-card-cta">相性を見る →</span>
        </a>
        <a href="/q/oshikatsu-type" class="quiz-card home-priority-card" style="--accent:#ff5c8a" ${homePriorityAttributes('quiz:oshikatsu-type', 3)}>
          ${homePriorityBadge(3)}
          <div class="quiz-card-badge">💗</div>
          <h2>あなたの推し活タイプ診断</h2>
          <p>現場・共有・自分のペース・深掘りから、今の推し方を言葉にする</p>
          <span class="quiz-card-cta">診断スタート →</span>
        </a>
      </div>
    </section>
    <script src="/js/home-priority.js"></script>`;
}

function insertType16HomeBlock(html) {
  const anchor = '<main class="container">';
  const index = html.indexOf(anchor);
  if (index === -1) {
    throw new Error('Could not find the main container for the homepage priority section');
  }
  const insertAt = index + anchor.length;
  return `${html.slice(0, insertAt)}\n${homeType16Block()}\n${html.slice(insertAt)}`;
}

function findHomeSection(html, title) {
  const heading = `<h2 class="section-title">${title}</h2>`;
  const headingIndex = html.indexOf(heading);
  if (headingIndex === -1) throw new Error(`Missing homepage section heading: ${title}`);

  const start = html.lastIndexOf('<section class="content-section">', headingIndex);
  const closingTag = '</section>';
  const closingIndex = html.indexOf(closingTag, headingIndex);
  if (start === -1 || closingIndex === -1) {
    throw new Error(`Could not isolate homepage section: ${title}`);
  }

  const end = closingIndex + closingTag.length;
  return { start, end, content: html.slice(start, end) };
}

function reorderCoreHomeSections(html) {
  const fortune = findHomeSection(html, '占い');
  const quizzes = findHomeSection(html, 'タイプ診断');
  if (quizzes.start < fortune.start) return html;

  return [
    html.slice(0, fortune.start),
    quizzes.content,
    html.slice(fortune.end, quizzes.start),
    fortune.content,
    html.slice(quizzes.end),
  ].join('');
}'''

    text = replace_function_range(
        text,
        "function homeType16Block() {",
        "function axisExplanationHtml(escapeHtml) {",
        replacement,
        "homepage type16 block",
    )

    old_render = """  function renderHome(quizzes, fortuneTools) {
    return withType16Styles(insertType16HomeBlock(original.renderHome(quizzes, fortuneTools)));
  }"""
    new_render = """  function renderHome(quizzes, fortuneTools) {
    const sortedQuizzes = sortByPriority(quizzes, (quiz) => `quiz:${quiz.id}`);
    const sortedFortuneTools = sortByPriority(
      fortuneTools,
      (tool) => `fortune:${tool.id}`
    );
    const baseHome = original.renderHome(sortedQuizzes, sortedFortuneTools);
    const reorderedHome = reorderCoreHomeSections(baseHome);
    return withType16Styles(insertType16HomeBlock(reorderedHome));
  }"""
    text = replace_once(text, old_render, new_render, "renderHome priority wrapper")

    required = (
        "data-home-priority-version",
        "sortByPriority(quizzes",
        "reorderCoreHomeSections",
        "quiz:oshikatsu-type",
        "/js/home-priority.js",
    )
    for marker in required:
        if marker not in text:
            raise RuntimeError(f"Homepage priority renderer marker missing: {marker}")

    path.write_text(text, encoding="utf-8")


def patch_type16_css() -> None:
    path = Path("public/css/type16.css")
    text = path.read_text(encoding="utf-8")
    marker = "/* Data-driven homepage priority */"
    if marker in text:
        return

    text += r'''

/* Data-driven homepage priority */
.home-priority-section {
  margin-top: 0;
  padding-top: 30px;
}

.home-priority-heading {
  align-items: flex-start;
}

.home-priority-method {
  margin-top: 7px;
  color: #706979;
  font-size: 0.86rem;
}

.home-priority-card {
  position: relative;
  padding-top: 54px;
  border-width: 2px;
  box-shadow: 0 12px 32px rgba(51, 42, 72, 0.09);
}

.home-priority-card:hover,
.home-priority-card:focus-visible {
  box-shadow: 0 16px 36px rgba(51, 42, 72, 0.14);
}

.home-priority-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  min-height: 27px;
  padding: 4px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent, #6f5cd7) 12%, white);
  color: var(--accent, #6f5cd7);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .home-priority-section {
    padding-top: 22px;
  }

  .home-priority-card {
    padding-top: 50px;
  }
}
'''
    path.write_text(text, encoding="utf-8")


def patch_quality_test() -> None:
    path = Path("scripts/test-quality.js")
    text = path.read_text(encoding="utf-8")
    marker = "Homepage priority section must be first"
    if marker in text:
        return

    old = """    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');
    assert(home.text.includes('\"@type\":\"FAQPage\"'), 'Home FAQ structured data is missing');"""
    new = """    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');

    const priorityIndex = home.text.indexOf('data-home-priority-version=\"2026-09-02\"');
    const quizSectionIndex = home.text.indexOf('<h2 class=\"section-title\">タイプ診断</h2>');
    const fortuneSectionIndex = home.text.indexOf('<h2 class=\"section-title\">占い</h2>');
    assert(
      priorityIndex !== -1 && priorityIndex < quizSectionIndex && quizSectionIndex < fortuneSectionIndex,
      'Homepage priority section must be first, followed by quizzes and fortune'
    );

    const firstPriority = home.text.indexOf('data-home-priority-id=\"type16-test\"');
    const secondPriority = home.text.indexOf('data-home-priority-id=\"type16-compatibility\"');
    const thirdPriority = home.text.indexOf('data-home-priority-id=\"quiz:oshikatsu-type\"');
    assert(
      firstPriority < secondPriority && secondPriority < thirdPriority,
      'Top three homepage priority cards are out of order'
    );
    assert(home.text.includes('/js/home-priority.js'), 'Homepage priority tracking is missing');

    const quizSection = home.text.slice(
      quizSectionIndex,
      home.text.indexOf('</section>', quizSectionIndex)
    );
    assert(
      quizSection.indexOf('/q/oshikatsu-type') < quizSection.indexOf('/q/honto-no-seikaku') &&
        quizSection.indexOf('/q/honto-no-seikaku') < quizSection.indexOf('/q/kakure-chara') &&
        quizSection.indexOf('/q/kakure-chara') < quizSection.indexOf('/q/jinsei-balance-game'),
      'Quiz cards are not rendered in data-priority order'
    );

    const fortuneSection = home.text.slice(
      fortuneSectionIndex,
      home.text.indexOf('</section>', fortuneSectionIndex)
    );
    assert(
      fortuneSection.indexOf('href=\"/ketsueki\"') < fortuneSection.indexOf('href=\"/shichuu\"') &&
        fortuneSection.indexOf('href=\"/shichuu\"') < fortuneSection.indexOf('href=\"/meimei\"'),
      'Fortune cards are not rendered in data-priority order'
    );

    assert(home.text.includes('\"@type\":\"FAQPage\"'), 'Home FAQ structured data is missing');"""
    text = replace_once(text, old, new, "homepage quality assertions")
    path.write_text(text, encoding="utf-8")


def patch_daily_log() -> None:
    path = Path("docs/japan-seo-daily-log.md")
    text = path.read_text(encoding="utf-8")
    heading = "## 2026-09-02 — 홈페이지 데이터 기반 우선순위 배치"
    if heading in text:
        return

    entry = f'''{heading}

### 내부 데이터 상태

- 최근 확인된 しんだんラボ Search Console 표본은 색인 1건, 최근 7일 노출 3회, 클릭 0회로 페이지별 승자를 고르기에는 부족하다.
- 따라서 현재 배치는 일본 공개조사·외부 서비스 이용 로그·검색 의도·첫 방문 진입성을 합친 편집 점수로 결정하고, GA4 표본이 쌓이면 실측 중심으로 교체한다.

### 적용한 점수 모델

- 일본 시장 수요 40%
- 반복 이용·공유 가능성 25%
- SEO 확장성 20%
- 첫 방문 진입성 15%

### 1차 배치 결과

1. 16タイプ簡易診断 — 92.7점
2. 16タイプ相性チェック — 90.0점
3. 推し活タイプ診断 — 83.3점
4. 16タイプ性格一覧 — 80.3점
5. 血液型占い — 71.1점

홈 첫 화면에는 상위 3개를 배치한다. 이후 섹션은 타입 진단을 점술보다 먼저 표시하며, 타입 진단 내부는 推し活 → 本当の性格 → かくれキャラ → 人生バランス 순서로 정리한다. 점술 내부는 2026년 조사 수치(血液型24.3%、四柱推命15.5%)를 반영해 血液型 → 十干 → 姓名判断 순서로 변경한다.

### 실측 전환 준비

- `home_priority_view` 이벤트 추가
- `home_priority_click` 이벤트에 항목 ID·순위·편집점수·도착 경로 기록
- 우선 영역 노출 300회, 후보별 시작 30회 이상이 쌓일 때까지 현재 외부 모델 유지
- 이후 홈페이지 CTR 40%·완료율 30%·공유율 20%·재방문 기여 10%로 사이트 고유 점수 재계산

상세 모델은 `docs/home-priority-model.md`에 기록한다.

---

'''
    separator = "---\n\n"
    if separator not in text:
        raise RuntimeError("Could not find daily log insertion separator")
    text = text.replace(separator, separator + entry, 1)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    patch_type16_renderer()
    patch_type16_css()
    patch_quality_test()
    patch_daily_log()
    print("Applied data-driven Japanese homepage priority ordering.")


if __name__ == "__main__":
    main()
