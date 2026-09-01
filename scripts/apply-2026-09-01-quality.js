'use strict';

const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, value) {
  fs.writeFileSync(path, value, 'utf8');
}

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first === -1) throw new Error(`Anchor not found: ${label}`);
  if (source.indexOf(search, first + search.length) !== -1) {
    throw new Error(`Anchor is not unique: ${label}`);
  }
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function lines(items) {
  return items.join('\n');
}

function patchRender() {
  const path = 'views/render.js';
  let source = read(path);

  if (source.includes("const QUIZ_EDITORIAL = require('../data/quiz-editorial');")) {
    console.log('render.js already contains the 2026-09-01 quality update');
    return;
  }

  source = replaceOnce(
    source,
    "const { MEIMEI_FEATURED } = require('../data/seo-longtail');",
    lines([
      "const { MEIMEI_FEATURED } = require('../data/seo-longtail');",
      "const QUIZ_EDITORIAL = require('../data/quiz-editorial');",
    ]),
    'quiz editorial import'
  );

  const malformedMatches = source.match(/\n\s*main>`;/g) || [];
  if (malformedMatches.length !== 2) {
    throw new Error(`Expected exactly 2 malformed main closings, found ${malformedMatches.length}`);
  }
  source = source.replace(/\n\s*main>`;/g, '\n  </main>`;');

  source = replaceOnce(
    source,
    lines([
      '    <nav class="footer-nav">',
      '      <a href="/">ホーム</a>',
      '      <a href="/privacy.html">プライバシーポリシー</a>',
      '      <a href="/terms.html">利用規約</a>',
      '    </nav>',
    ]),
    lines([
      '    <nav class="footer-nav">',
      '      <a href="/">ホーム</a>',
      '      <a href="/about.html">しんだんラボについて</a>',
      '      <a href="/editorial-policy.html">編集・診断ポリシー</a>',
      '      <a href="/privacy.html">プライバシーポリシー</a>',
      '      <a href="/terms.html">利用規約</a>',
      '    </nav>',
    ]),
    'footer navigation'
  );

  const homeAnchor = lines([
    '    <section class="content-section">',
    '      <h2 class="section-title">タイプ診断</h2>',
    '      <div class="quiz-grid">',
    '        ${quizCards}',
    '      </div>',
    '    </section>',
    '',
    '  </main>`;',
  ]);

  const homeReplacement = lines([
    '    <section class="content-section">',
    '      <h2 class="section-title">タイプ診断</h2>',
    '      <div class="quiz-grid">',
    '        ${quizCards}',
    '      </div>',
    '    </section>',
    '',
    '    <section class="info-card site-guide" aria-labelledby="about-shindan-lab">',
    '      <p class="content-kicker">ABOUT</p>',
    '      <h2 id="about-shindan-lab">しんだんラボについて</h2>',
    '      <p>姓名判断・血液型占い・十干タイプ診断と、友達同士で結果を見せ合いやすいタイプ診断を一つにまとめた無料サイトです。結果を断定するのではなく、自分の考え方や相手との違いを話すきっかけとして楽しめるよう、計算方法と簡略化している点を明記しています。</p>',
    '      <p>診断の質問・結果文・解説は、既存サービスの文章をコピーせず、しんだんラボ向けに独自に編集しています。占いやタイプ分けはエンタメとして利用し、大切な判断は一つの結果だけで決めないでください。</p>',
    '      <p><a href="/about.html">サイトの目的と運営方針を読む →</a></p>',
    '    </section>',
    '',
    '    <section class="info-card site-guide" aria-labelledby="choose-diagnosis">',
    '      <p class="content-kicker">GUIDE</p>',
    '      <h2 id="choose-diagnosis">目的から診断を選ぶ</h2>',
    '      <div class="guide-link-list">',
    '        <a href="/meimei"><strong>名前の画数と五格を見たい</strong><span>姓名判断</span></a>',
    '        <a href="/shichuu"><strong>生まれ年から十干・五行タイプを知りたい</strong><span>十干タイプ診断</span></a>',
    '        <a href="/ketsueki"><strong>血液型ごとの性格傾向や二人の相性を見たい</strong><span>血液型占い</span></a>',
    '        <a href="/q/oshikatsu-type"><strong>自分の推し方を言葉にしたい</strong><span>推し活タイプ診断</span></a>',
    '        <a href="/q/honto-no-seikaku"><strong>外から見える自分と本音の差を確かめたい</strong><span>本当の性格タイプ診断</span></a>',
    '      </div>',
    '    </section>',
    '',
    '    <section class="info-card faq-list" aria-labelledby="home-faq">',
    '      <p class="content-kicker">FAQ</p>',
    '      <h2 id="home-faq">よくある質問</h2>',
    '      <details>',
    '        <summary>すべて無料で使えますか？</summary>',
    '        <p>現在公開している診断と占いは、会員登録なしで無料で利用できます。外部サービスを紹介する場合は、該当箇所に「PR」と表示します。</p>',
    '      </details>',
    '      <details>',
    '        <summary>診断結果は科学的・医学的な判定ですか？</summary>',
    '        <p>いいえ。タイプ診断、血液型占い、姓名判断、簡易四柱推命はエンタメ目的です。公式の心理検査、医学的診断、専門家の鑑定を代替するものではありません。</p>',
    '      </details>',
    '      <details>',
    '        <summary>十干タイプ診断は本格的な四柱推命と同じですか？</summary>',
    '        <p>同じではありません。当サイトでは生年月日から年柱の十干を求める簡易版です。本格的な四柱推命で扱う月柱・日柱・時柱や、正確な節入り時刻までは計算していません。</p>',
    '      </details>',
    '      <details>',
    '        <summary>結果を友達に共有できますか？</summary>',
    '        <p>各結果ページの共有ボタンからリンクをコピーできます。姓名判断の結果URLには入力した名前が含まれるため、共有したい場合だけリンクを送ってください。</p>',
    '      </details>',
    '    </section>',
    '',
    '  </main>`;',
  ]);

  source = replaceOnce(source, homeAnchor, homeReplacement, 'home content sections');

  source = replaceOnce(
    source,
    lines([
      "    title: '無料占い・姓名判断・血液型占い・四柱推命診断まとめ - しんだんラボ',",
      "    description: '姓名判断、血液型占い、四柱推命の十干タイプ診断から、推し活タイプ・隠れた性格診断まで。無料・会員登録なしで今すぐ診断できる総合診断サイトです。',",
      "    ogUrl: SITE_URL + '/',",
      '    content,',
      '  });',
    ]),
    lines([
      "    title: '無料占い・姓名判断・血液型占い・四柱推命診断まとめ - しんだんラボ',",
      "    description: '姓名判断、血液型占い、四柱推命の十干タイプ診断から、推し活タイプ・隠れた性格診断まで。無料・会員登録なしで今すぐ診断できる総合診断サイトです。',",
      "    ogUrl: SITE_URL + '/',",
      '    content,',
      '    structuredData: [',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'WebSite',",
      '        name: SITE_NAME,',
      "        url: SITE_URL + '/',",
      "        inLanguage: 'ja',",
      "        description: '姓名判断・血液型占い・十干タイプ診断と、独自のタイプ診断を無料で楽しめる総合診断サイト。',",
      '      },',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'FAQPage',",
      '        mainEntity: [',
      '          {',
      "            '@type': 'Question',",
      "            name: 'すべて無料で使えますか？',",
      "            acceptedAnswer: { '@type': 'Answer', text: '現在公開している診断と占いは、会員登録なしで無料で利用できます。外部サービスを紹介する場合は、該当箇所に「PR」と表示します。' },",
      '          },',
      '          {',
      "            '@type': 'Question',",
      "            name: '診断結果は科学的・医学的な判定ですか？',",
      "            acceptedAnswer: { '@type': 'Answer', text: 'いいえ。タイプ診断、血液型占い、姓名判断、簡易四柱推命はエンタメ目的で、公式の心理検査、医学的診断、専門家の鑑定を代替するものではありません。' },",
      '          },',
      '          {',
      "            '@type': 'Question',",
      "            name: '十干タイプ診断は本格的な四柱推命と同じですか？',",
      "            acceptedAnswer: { '@type': 'Answer', text: '同じではありません。当サイトでは生年月日から年柱の十干を求める簡易版で、月柱・日柱・時柱や正確な節入り時刻までは計算していません。' },",
      '          },',
      '          {',
      "            '@type': 'Question',",
      "            name: '結果を友達に共有できますか？',",
      "            acceptedAnswer: { '@type': 'Answer', text: '各結果ページの共有ボタンからリンクをコピーできます。姓名判断の結果URLには入力した名前が含まれるため、共有したい場合だけリンクを送ってください。' },",
      '          },',
      '        ],',
      '      },',
      '    ],',
      '  });',
    ]),
    'home metadata and structured data'
  );

  source = replaceOnce(
    source,
    lines([
      'function renderQuizPage(quiz) {',
      '  const content = `',
    ]),
    lines([
      'function renderQuizPage(quiz) {',
      '  const editorial = QUIZ_EDITORIAL[quiz.id];',
      '  const editorialHtml = editorial',
      '    ? `',
      '    <section class="info-card quiz-explainer" aria-labelledby="quiz-method-${quiz.id}">',
      '      <p class="content-kicker">HOW IT WORKS</p>',
      '      <h2 id="quiz-method-${quiz.id}">${escapeHtml(quiz.title)}で分かること</h2>',
      '      <p>${escapeHtml(editorial.overview)}</p>',
      '      <h3>診断の見方</h3>',
      '      <p>${escapeHtml(editorial.basis)}</p>',
      '      <ul class="axis-list">${editorial.axes.map((axis) => `<li>${escapeHtml(axis)}</li>`).join(\'\')}</ul>',
      '      <p class="small-note">回答時の気分や状況によって結果は変わります。正式な心理検査ではなく、今の自分を振り返るためのエンタメ診断としてお楽しみください。</p>',
      '    </section>`',
      "    : '';",
      '',
      '  const content = `',
    ]),
    'quiz editorial setup'
  );

  source = replaceOnce(
    source,
    lines([
      '    </section>',
      '',
      '  </main>',
      '',
      '  <script>window.__QUIZ__ = ${JSON.stringify(quiz)};</script>',
    ]),
    lines([
      '    </section>',
      '',
      '    ${editorialHtml}',
      '  </main>',
      '',
      '  <script>window.__QUIZ__ = ${JSON.stringify(quiz)};</script>',
    ]),
    'quiz editorial body'
  );

  source = replaceOnce(
    source,
    lines([
      '  return baseLayout({',
      '    title: `${quiz.title} - しんだんラボ`,',
      '    description: quiz.subtitle,',
      '    ogUrl: `${SITE_URL}/q/${quiz.id}`,',
      '    themeColor: quiz.themeColor,',
      '    content,',
      '  });',
    ]),
    lines([
      '  return baseLayout({',
      '    title: `${quiz.title} - しんだんラボ`,',
      "    description: `${quiz.intro} 無料・会員登録なしで、8つの質問から今の回答傾向をチェックできます。`,",
      '    ogUrl: `${SITE_URL}/q/${quiz.id}`,',
      '    themeColor: quiz.themeColor,',
      '    content,',
      '    structuredData: [',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'WebPage',",
      '        name: quiz.title,',
      '        description: quiz.intro,',
      '        url: `${SITE_URL}/q/${quiz.id}`,',
      "        inLanguage: 'ja',",
      "        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },",
      '      },',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'BreadcrumbList',",
      '        itemListElement: [',
      "          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },",
      "          { '@type': 'ListItem', position: 2, name: quiz.title, item: `${SITE_URL}/q/${quiz.id}` },",
      '        ],',
      '      },',
      '    ],',
      '  });',
    ]),
    'quiz metadata and structured data'
  );

  source = replaceOnce(
    source,
    lines([
      'function renderResultPage(quiz, resultKey, matchScore) {',
      '  const result = quiz.results[resultKey];',
      '  const shareUrl = `${SITE_URL}/q/${quiz.id}/r/${resultKey}`;',
    ]),
    lines([
      'function renderResultPage(quiz, resultKey, matchScore) {',
      '  const result = quiz.results[resultKey];',
      '  const shareUrl = `${SITE_URL}/q/${quiz.id}/r/${resultKey}`;',
      '  const editorial = QUIZ_EDITORIAL[quiz.id];',
      '  const insight = editorial && editorial.results ? editorial.results[resultKey] : null;',
    ]),
    'result editorial lookup'
  );

  source = replaceOnce(
    source,
    lines([
      "    : '';",
      '',
      '  const content = `',
      '  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">',
    ]),
    lines([
      "    : '';",
      '  const insightHtml = insight',
      '    ? `',
      '      <section class="result-analysis" aria-label="結果の詳しい解説">',
      '        <h2>このタイプをもう少し詳しく</h2>',
      '        <div class="result-analysis-grid">',
      '          <div><p class="result-analysis-label">強み</p><p>${escapeHtml(insight.strength)}</p></div>',
      '          <div><p class="result-analysis-label">気をつけたいこと</p><p>${escapeHtml(insight.caution)}</p></div>',
      '          <div><p class="result-analysis-label">人との付き合い方</p><p>${escapeHtml(insight.relationships)}</p></div>',
      '          <div><p class="result-analysis-label">今日からできること</p><p>${escapeHtml(insight.action)}</p></div>',
      '        </div>',
      '      </section>`',
      "    : '';",
      '',
      '  const content = `',
      '  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">',
    ]),
    'result editorial html'
  );

  source = replaceOnce(
    source,
    lines([
      '      <p class="result-desc">${escapeHtml(result.desc)}</p>',
      '      ${scoreHtml}',
      '',
      '      <div class="result-actions">',
    ]),
    lines([
      '      <p class="result-desc">${escapeHtml(result.desc)}</p>',
      '      ${scoreHtml}',
      '      ${insightHtml}',
      '',
      '      <div class="result-actions">',
    ]),
    'result editorial insertion'
  );

  source = replaceOnce(
    source,
    lines([
      '  return baseLayout({',
      '    title: `私の結果は「${result.title}」 ${result.emoji} - ${quiz.title}`,',
      '    description: result.shareText,',
      '    ogUrl: shareUrl,',
      '    themeColor: quiz.themeColor,',
      '    content,',
      '  });',
    ]),
    lines([
      '  return baseLayout({',
      '    title: `私の結果は「${result.title}」 ${result.emoji} - ${quiz.title}`,',
      '    description: `${result.shareText} ${result.desc}`,',
      '    ogUrl: shareUrl,',
      '    themeColor: quiz.themeColor,',
      '    content,',
      '    structuredData: [',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'WebPage',",
      '        name: `${quiz.title}「${result.title}」の結果`,',
      '        description: `${result.shareText} ${result.desc}`,',
      '        url: shareUrl,',
      "        inLanguage: 'ja',",
      "        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },",
      '      },',
      '      {',
      "        '@context': 'https://schema.org',",
      "        '@type': 'BreadcrumbList',",
      '        itemListElement: [',
      "          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },",
      "          { '@type': 'ListItem', position: 2, name: quiz.title, item: `${SITE_URL}/q/${quiz.id}` },",
      "          { '@type': 'ListItem', position: 3, name: result.title, item: shareUrl },",
      '        ],',
      '      },',
      '    ],',
      '  });',
    ]),
    'result metadata and structured data'
  );

  write(path, source);
}

function patchQuizData() {
  const path = 'data/quizzes.js';
  let source = read(path);
  if (source.includes('MBTIだけじゃ分からない')) {
    source = source.replace('MBTIだけじゃ分からない', '16タイプ診断だけじゃ分からない');
  }
  write(path, source);
}

function patchServer() {
  const path = 'server.js';
  let source = read(path);
  if (!source.includes("    '/about.html',")) {
    source = replaceOnce(
      source,
      lines([
        "    '/privacy.html',",
        "    '/terms.html',",
      ]),
      lines([
        "    '/about.html',",
        "    '/editorial-policy.html',",
        "    '/privacy.html',",
        "    '/terms.html',",
      ]),
      'sitemap trust pages'
    );
  }
  write(path, source);
}

function patchTests() {
  const path = 'run_tests.sh';
  let source = read(path);

  if (!source.includes('ホームにサイト説明')) {
    source = replaceOnce(
      source,
      'check_status "ホーム" "$BASE/" 200',
      lines([
        'check_status "ホーム" "$BASE/" 200',
        'check_contains "ホームにサイト説明" "$BASE/" "しんだんラボについて"',
        'check_not_contains "ホームに壊れたmain文字列がない" "$BASE/" "main>"',
        'check_status "サイト説明ページ" "$BASE/about.html" 200',
        'check_status "編集・診断ポリシー" "$BASE/editorial-policy.html" 200',
      ]),
      'basic quality tests'
    );
  }

  source = source.replace(
    'echo "sitemap内のURL数: $url_count (期待値: 静的10+十干10+血液型単4+血液型ペア10+姓名判断52=86)"',
    'echo "sitemap内のURL数: $url_count (期待値: 静的12+十干10+血液型単4+血液型ペア10+姓名判断52=88)"'
  );
  source = source.replace('if [ "$url_count" == "86" ]; then', 'if [ "$url_count" == "88" ]; then');
  source = source.replace(
    'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 86)"',
    'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 88)"'
  );

  const quizTestAnchor = 'check_status "フォーム" "$BASE/shichuu" 200';
  if (!source.includes('推し活診断に独自の診断解説')) {
    source = replaceOnce(
      source,
      quizTestAnchor,
      lines([
        'check_status "推し活タイプ診断" "$BASE/q/oshikatsu-type" 200',
        'check_contains "推し活診断に独自の診断解説" "$BASE/q/oshikatsu-type" "現場へ動く行動力"',
        'check_not_contains "推し活診断に壊れたmain文字列がない" "$BASE/q/oshikatsu-type" "main>"',
        'check_contains "推し活結果に詳しい独自解説" "$BASE/q/oshikatsu-type/r/kamiseki" "今日からできること"',
        'check_contains "性格診断の表記を一般化" "$BASE/q/honto-no-seikaku" "16タイプ診断だけじゃ分からない"',
        '',
        quizTestAnchor,
      ]),
      'quiz content tests'
    );
  }

  write(path, source);
}

function patchCss() {
  const path = 'public/css/style.css';
  let source = read(path);
  if (source.includes('2026-09-01 editorial depth')) return;

  source += `

/* 2026-09-01 editorial depth: 説明・FAQ・結果解説 */
.content-kicker {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #8a6fd8;
}

.site-guide,
.quiz-explainer,
.faq-list {
  margin-top: 28px;
}

.site-guide > p,
.quiz-explainer > p,
.result-analysis p {
  line-height: 1.85;
}

.guide-link-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.guide-link-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border: 1px solid #e6e0f2;
  border-radius: 14px;
  background: #fbfaff;
  text-decoration: none;
}

.guide-link-list a:hover {
  border-color: #8a6fd8;
  transform: translateY(-1px);
}

.guide-link-list span {
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 700;
  color: #6d5bb5;
}

.faq-list details {
  padding: 14px 0;
  border-top: 1px solid #ece8f2;
}

.faq-list details:first-of-type {
  margin-top: 8px;
}

.faq-list summary {
  cursor: pointer;
  font-weight: 700;
}

.faq-list details p {
  margin: 10px 0 0;
  line-height: 1.8;
}

.axis-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  margin: 14px 0 18px;
  padding-left: 1.25rem;
}

.small-note {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f5fb;
  font-size: 0.9rem;
  color: #5d5868;
}

.result-analysis {
  margin: 26px 0;
  padding-top: 24px;
  border-top: 1px solid #e9e4ef;
  text-align: left;
}

.result-analysis h2 {
  margin: 0 0 16px;
  text-align: center;
  font-size: 1.25rem;
}

.result-analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.result-analysis-grid > div {
  padding: 16px;
  border: 1px solid #e9e4ef;
  border-radius: 14px;
  background: #fcfbfe;
}

.result-analysis-label {
  margin: 0 0 7px !important;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--accent, #6d5bb5);
}

.result-analysis-grid p:last-child {
  margin: 0;
}

@media (max-width: 640px) {
  .guide-link-list a {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .axis-list,
  .result-analysis-grid {
    grid-template-columns: 1fr;
  }
}
`;

  write(path, source);
}

function patchReadme() {
  const path = 'README.md';
  let source = read(path);
  source = source.replace('性格診断3種を提供します。', '性格診断4種を提供します。');
  source = source.replace(
    '- 推し活タイプ診断 / 本当の性格タイプ診断 / 人生の選択バランスゲーム（`/q/:id`）',
    '- 推し活タイプ診断 / 本当の性格タイプ診断 / 人生の選択バランスゲーム / かくれキャラ診断（`/q/:id`）'
  );
  if (!source.includes('2026年9月のコンテンツ品質改善')) {
    source = source.replace(
      '## 7. SEO関連',
      lines([
        '## 7. SEO関連',
        '',
        '- **2026年9月のコンテンツ品質改善**: ホームにサイト説明・目的別導線・FAQを追加し、タイプ診断4種の開始ページに診断軸と判定方法を明示。全14結果へ「強み・注意点・人との付き合い方・今日からできること」の独自解説を追加しました。壊れていた `main>` のHTML出力も修正しています。',
      ])
    );
  }
  write(path, source);
}

patchRender();
patchQuizData();
patchServer();
patchTests();
patchCss();
patchReadme();

for (const required of [
  'views/render.js',
  'data/quizzes.js',
  'data/quiz-editorial.js',
  'server.js',
  'run_tests.sh',
  'public/css/style.css',
]) {
  if (!fs.existsSync(required)) throw new Error(`Missing required file: ${required}`);
}

const finalRender = read('views/render.js');
if (/(^|\n)\s*main>/.test(finalRender)) throw new Error('Malformed main> remains in render.js');
if (!finalRender.includes('result-analysis')) throw new Error('Result analysis was not inserted');
if (!finalRender.includes("'@type': 'FAQPage'")) throw new Error('Home FAQ structured data was not inserted');

console.log('2026-09-01 Japanese quality patch applied successfully.');
