'use strict';

const {
  TYPE16_AXES,
  TYPE16_QUESTIONS,
  TYPE16_TYPES,
  TYPE16_CODES,
  TYPE16_RELATIONS,
  normalizeType16Code,
  normalizeRelation,
  getType16,
  calculateCompatibility,
} = require('../data/type16');
const {
  HOME_PRIORITY_VERSION,
  HOME_PRIORITY_ITEMS,
  sortByPriority,
} = require('../data/home-priority');

const GROUPS = {
  NT: {
    name: '分析・戦略グループ',
    description: '仕組み、可能性、論理を使って問題を考えやすい4タイプです。',
  },
  NF: {
    name: '共感・理想グループ',
    description: '人の気持ち、意味、可能性を結びつけて考えやすい4タイプです。',
  },
  SJ: {
    name: '安定・誠実グループ',
    description: '経験、責任、継続を大切にし、日常を整えやすい4タイプです。',
  },
  SP: {
    name: '行動・柔軟グループ',
    description: '今の状況を読み、感覚と行動で柔軟に対応しやすい4タイプです。',
  },
};

const HUB_FAQS = [
  {
    question: 'この16タイプ診断はMBTI®ですか？',
    answer:
      'いいえ。MBTI®公式検査ではなく、4つの対照的な傾向を20問で整理する、しんだんラボ独自の非公式エンタメ診断です。日本MBTI協会やThe Myers-Briggs Companyとは関係ありません。',
  },
  {
    question: '4文字のアルファベットは何を表していますか？',
    answer:
      '人や外の刺激／一人で整理、具体的情報／可能性、論理／気持ち、計画／柔軟性という4つの観点で、今の回答に近い側を1文字ずつ並べています。',
  },
  {
    question: '診断結果が以前と変わっても大丈夫ですか？',
    answer:
      '問題ありません。仕事中と休日、安心できる相手の前と初対面の場では答え方が変わることがあります。結果は固定された性格証明ではなく、今の傾向を振り返る材料として使ってください。',
  },
];

const TEST_FAQS = [
  {
    question: '20問でタイプを正確に決められますか？',
    answer:
      '20問は短時間で4つの傾向を確認する簡易版です。正式な心理検査ではなく、結果を確定するものでもありません。迷った軸は結果ページの比率と説明を見て、自分にしっくりくる方を考えてください。',
  },
  {
    question: 'どちらの選択肢にも当てはまる場合は？',
    answer:
      '理想ではなく、最近の日常で自然にしている方を選んでください。場面によって変わる場合は、より疲れずに続けられる方を選ぶと答えやすくなります。',
  },
  {
    question: '友達や恋人との相性も見られますか？',
    answer:
      '診断後の結果ページから、恋愛・友達・仕事・家族の4場面に分けた16タイプ相性チェックへ進めます。',
  },
];

const COMPATIBILITY_FAQS = [
  {
    question: '相性スコアが低いと関係はうまくいきませんか？',
    answer:
      'いいえ。スコアは4つの回答傾向から会話や予定の合わせやすさを整理した独自の目安です。低い・高いだけで関係の良し悪しや将来を判断するものではありません。',
  },
  {
    question: '恋愛と友達で結果が変わるのはなぜですか？',
    answer:
      '恋愛では気持ちの確認、友達では会う頻度、仕事では判断と締切、家族では生活リズムの影響が大きいため、同じ二人でも場面ごとに注目する点を変えています。',
  },
  {
    question: '相手のタイプが分からない場合は？',
    answer:
      '本人が診断していないタイプを決めつけるのは避けてください。一緒に簡易診断を受けるか、タイプを使わずに結果内のコミュニケーションのヒントだけを参考にする方法がおすすめです。',
  },
];

function fallbackEscapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeInlineJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

function faqHtml(faqs, escapeHtml) {
  return faqs
    .map(
      ({ question, answer }) => `
      <details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`
    )
    .join('');
}

function withType16Styles(html) {
  if (html.includes('/css/type16.css')) return html;
  return html.replace('</head>', '<link rel="stylesheet" href="/css/type16.css" />\n</head>');
}

function noindexQueryResult(html) {
  return html.replace(
    '</head>',
    '<meta name="robots" content="noindex, follow" />\n</head>'
  );
}

function officialDisclaimer() {
  return `
    <aside class="type16-disclaimer">
      <strong>公式MBTI®ではありません。</strong>
      <p>MBTI®はThe Myers-Briggs Companyの登録商標です。このページの16タイプ診断・相性チェックは、しんだんラボが独自に作成した非公式のエンタメコンテンツで、日本MBTI協会およびThe Myers-Briggs Companyとは関係ありません。無料の16タイプ診断と正式なMBTI®は別のものです。詳しくは<a href="https://www.mbti.or.jp/attention/" target="_blank" rel="nofollow noopener">日本MBTI協会の案内</a>をご確認ください。</p>
    </aside>`;
}

function typeOptions(selected, escapeHtml) {
  const normalized = normalizeType16Code(selected);
  return TYPE16_CODES.map((code) => {
    const item = TYPE16_TYPES[code];
    return `<option value="${code}"${code === normalized ? ' selected' : ''}>${code}｜${escapeHtml(item.name)}</option>`;
  }).join('');
}

function typeCard(type, escapeHtml) {
  return `
    <a class="type16-card" href="/16type/r/${type.code}">
      <span class="type16-card-code">${type.code}</span>
      <span class="type16-card-emoji">${type.emoji}</span>
      <strong>${escapeHtml(type.name)}</strong>
      <span>${escapeHtml(type.tagline)}</span>
    </a>`;
}

function typeGridHtml(escapeHtml) {
  return Object.entries(GROUPS)
    .map(([groupKey, group]) => {
      const cards = TYPE16_CODES.filter((code) => TYPE16_TYPES[code].group === groupKey)
        .map((code) => typeCard(TYPE16_TYPES[code], escapeHtml))
        .join('');
      return `
      <section class="type16-group" aria-labelledby="group-${groupKey}">
        <div class="type16-group-heading">
          <p class="content-kicker">${groupKey}</p>
          <h2 id="group-${groupKey}">${escapeHtml(group.name)}</h2>
          <p>${escapeHtml(group.description)}</p>
        </div>
        <div class="type16-grid">${cards}</div>
      </section>`;
    })
    .join('');
}

function homePriorityAttributes(itemId, rank) {
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
}

function axisExplanationHtml(escapeHtml) {
  return Object.entries(TYPE16_AXES)
    .map(
      ([key, axis]) => `
      <div class="type16-axis-card">
        <p class="type16-axis-code">${key}</p>
        <h3>${escapeHtml(axis.label)}</h3>
        <p><strong>${axis.left}</strong> ${escapeHtml(axis.leftLabel)}</p>
        <p><strong>${axis.right}</strong> ${escapeHtml(axis.rightLabel)}</p>
      </div>`
    )
    .join('');
}

function parseAxisPercentages(query) {
  const keys = ['e', 's', 't', 'j'];
  const result = {};
  for (const key of keys) {
    const value = Number.parseInt(query && query[key], 10);
    if (!Number.isInteger(value) || value < 0 || value > 100) return null;
    result[key] = value;
  }
  return result;
}

function axisScoreRowsHtml(scores, escapeHtml) {
  if (!scores) return '';
  const rows = [
    ['EI', 'E', scores.e, 'I', 100 - scores.e],
    ['SN', 'S', scores.s, 'N', 100 - scores.s],
    ['TF', 'T', scores.t, 'F', 100 - scores.t],
    ['JP', 'J', scores.j, 'P', 100 - scores.j],
  ];
  return `
    <section class="type16-score-panel" aria-labelledby="type16-score-title">
      <h2 id="type16-score-title">今回の回答バランス</h2>
      <p>数値は性格の強さではなく、20問のうち各側を選んだ割合です。</p>
      ${rows
        .map(
          ([axis, left, leftPct, right, rightPct]) => `
        <div class="type16-score-row">
          <div class="type16-score-labels">
            <span><strong>${left}</strong> ${leftPct}%</span>
            <span>${axis}</span>
            <span>${rightPct}% <strong>${right}</strong></span>
          </div>
          <div class="type16-score-track" role="img" aria-label="${escapeHtml(
            `${axis}: ${left} ${leftPct}%、${right} ${rightPct}%`
          )}">
            <span style="width:${leftPct}%"></span>
          </div>
        </div>`
        )
        .join('')}
    </section>`;
}

function resultList(title, values, className, escapeHtml) {
  return `
    <section class="type16-detail-card ${className}">
      <h2>${escapeHtml(title)}</h2>
      <ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>
    </section>`;
}

function compatibilityLabel(score) {
  if (score >= 84) return 'かなり噛み合いやすい';
  if (score >= 78) return 'バランスを作りやすい';
  if (score >= 72) return '違いを言葉にすると伸びる';
  return '丁寧なすり合わせが鍵';
}

function createType16Renderers(original) {
  if (!original || typeof original.renderHome !== 'function') {
    throw new TypeError('Original render module is required');
  }
  if (typeof original.baseLayout !== 'function') {
    throw new TypeError('baseLayout must be exported from views/render.js');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;
  const siteUrl = original.SITE_URL;
  const siteName = original.SITE_NAME || 'しんだんラボ';

  function renderHome(quizzes, fortuneTools) {
    const sortedQuizzes = sortByPriority(quizzes, (quiz) => `quiz:${quiz.id}`);
    const sortedFortuneTools = sortByPriority(
      fortuneTools,
      (tool) => `fortune:${tool.id}`
    );
    const baseHome = original.renderHome(sortedQuizzes, sortedFortuneTools);
    const reorderedHome = reorderCoreHomeSections(baseHome);
    return withType16Styles(insertType16HomeBlock(reorderedHome));
  }

  function renderType16Hub() {
    const content = `
  <header class="site-header quiz-header type16-hero" style="--accent:#6f5cd7">
    <div class="container">
      ${original.siteHeaderNav()}
      <div class="quiz-hero-badge">🔤</div>
      <h1>16タイプ性格一覧</h1>
      <p class="tagline">MBTI関連でよく見かける4文字タイプを、独自の日本語解説で整理</p>
    </div>
  </header>

  <main class="container type16-page">
    <section class="tool-card type16-intro-card">
      <p class="content-kicker">START</p>
      <h2>自分のタイプを調べる・二人の相性を見る</h2>
      <p>4文字タイプが分からない方は20問の簡易診断へ。自分と相手のタイプが分かる方は、恋愛・友達・仕事・家族の場面別に相性のヒントを確認できます。</p>
      <div class="type16-cta-row">
        <a class="quiz-btn" href="/16type/test">20問の簡易診断を始める</a>
        <a class="quiz-btn quiz-btn-outline" href="/16type/compatibility">二人の相性を調べる</a>
      </div>
    </section>

    <section class="info-card">
      <p class="content-kicker">4 AXES</p>
      <h2>4文字タイプの見方</h2>
      <p>各文字は優劣ではなく、日常でどちらの反応を取りやすいかを整理するための目印です。状況によって両方を使うことがあります。</p>
      <div class="type16-axis-grid">${axisExplanationHtml(escapeHtml)}</div>
    </section>

    ${typeGridHtml(escapeHtml)}

    ${officialDisclaimer()}

    <section class="info-card faq-list">
      <p class="content-kicker">FAQ</p>
      <h2>16タイプについてよくある質問</h2>
      ${faqHtml(HUB_FAQS, escapeHtml)}
    </section>
  </main>`;

    const html = original.baseLayout({
      title: '16タイプ性格一覧・無料簡易診断・相性チェック - しんだんラボ',
      description:
        'MBTI関連でよく見かけるE/I・S/N・T/F・J/Pの4文字タイプを、公式MBTIとは別の独自解説で整理。無料20問診断、恋愛・友達・仕事・家族の相性チェック、16タイプ一覧を利用できます。',
      ogUrl: `${siteUrl}/16type`,
      ogImage: '/og/16type.png',
      themeColor: '#6f5cd7',
      content,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: '16タイプ性格一覧',
          description: '16タイプの特徴、無料簡易診断、相性チェックをまとめたページ。',
          url: `${siteUrl}/16type`,
          inLanguage: 'ja',
          isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: '16タイプ性格一覧', item: `${siteUrl}/16type` },
          ],
        },
        faqJsonLd(HUB_FAQS),
      ],
    });
    return withType16Styles(html);
  }

  function renderType16Test() {
    const clientData = {
      questions: TYPE16_QUESTIONS,
      resultBase: '/16type/r/',
    };
    const content = `
  <header class="site-header quiz-header type16-hero" style="--accent:#6f5cd7">
    <div class="container">
      ${original.siteHeaderNav()}
      <div class="quiz-hero-badge">🧩</div>
      <h1>16タイプ簡易診断</h1>
      <p class="tagline">20問・約3分。4つの回答傾向から今の4文字タイプをチェック</p>
    </div>
  </header>

  <main class="container type16-page">
    <section class="tool-card type16-test-app" data-type16-test>
      <div id="type16-intro">
        <p class="tool-desc">日常で起こりやすい20の場面から、E/I・S/N・T/F・J/Pのどちらを選びやすいかを整理します。理想の自分ではなく、最近自然にしている方を選んでください。</p>
        <ul class="type16-test-facts">
          <li>登録不要・無料</li>
          <li>20問・二択</li>
          <li>16タイプ結果＋4軸の割合</li>
        </ul>
        <button id="type16-start-btn" class="quiz-btn" type="button">診断を始める</button>
      </div>

      <div id="type16-play" hidden>
        <div class="quiz-progress"><div class="quiz-progress-bar" id="type16-progress-bar"></div></div>
        <p class="quiz-question-count" id="type16-question-count"></p>
        <p class="type16-axis-hint" id="type16-axis-hint"></p>
        <h2 id="type16-question-text"></h2>
        <div id="type16-options" class="quiz-options"></div>
        <button id="type16-back-btn" class="type16-back-btn" type="button">← ひとつ戻る</button>
      </div>
    </section>

    <section class="info-card">
      <p class="content-kicker">METHOD</p>
      <h2>結果の出し方</h2>
      <p>4つの軸ごとに5問ずつ回答し、多く選んだ側の文字を順番に並べます。例えば、E・N・F・Pを多く選ぶとENFPになります。同数にならないよう各軸を5問にしています。</p>
      <div class="type16-axis-grid">${axisExplanationHtml(escapeHtml)}</div>
    </section>

    ${officialDisclaimer()}

    <section class="info-card faq-list">
      <p class="content-kicker">FAQ</p>
      <h2>診断前によくある質問</h2>
      ${faqHtml(TEST_FAQS, escapeHtml)}
    </section>
  </main>

  <script>window.__TYPE16_TEST__ = ${safeInlineJson(clientData)};</script>
  <script src="/js/type16-test.js"></script>`;

    const html = original.baseLayout({
      title: '16タイプ性格診断（無料・20問）｜MBTI®とは別の非公式テスト',
      description:
        '無料・登録不要の16タイプ簡易診断。20問でE/I・S/N・T/F・J/Pの今の傾向と4文字タイプを確認できます。公式MBTIとは別の独自エンタメ診断です。',
      ogUrl: `${siteUrl}/16type/test`,
      ogImage: '/og/16type.png',
      themeColor: '#6f5cd7',
      content,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '16タイプ性格診断（無料・20問）',
          description: '20問で4つの回答傾向と16タイプを確認する非公式の簡易診断。',
          url: `${siteUrl}/16type/test`,
          inLanguage: 'ja',
          isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: '16タイプ', item: `${siteUrl}/16type` },
            {
              '@type': 'ListItem',
              position: 3,
              name: '16タイプ簡易診断',
              item: `${siteUrl}/16type/test`,
            },
          ],
        },
        faqJsonLd(TEST_FAQS),
      ],
    });
    return withType16Styles(html);
  }

  function renderType16Result(typeValue, query = {}) {
    const type = getType16(typeValue);
    if (!type) throw new Error(`Unknown 16-type code: ${typeValue}`);
    const scores = parseAxisPercentages(query);

    const content = `
  <header class="site-header quiz-header type16-hero" style="--accent:#6f5cd7">
    <div class="container">
      ${original.siteHeaderNav()}
      <p class="type16-result-overline">16タイプ簡易診断 結果</p>
      <div class="quiz-hero-badge">${type.emoji}</div>
      <h1><span class="type16-result-code">${type.code}</span> ${escapeHtml(type.name)}</h1>
      <p class="tagline">${escapeHtml(type.tagline)}</p>
    </div>
  </header>

  <main class="container type16-page">
    <section class="tool-card type16-result-summary">
      <p class="result-desc">${escapeHtml(type.summary)}</p>
      ${axisScoreRowsHtml(scores, escapeHtml)}
      <div class="type16-cta-row">
        <a class="quiz-btn" href="/16type/compatibility?self=${type.code}">このタイプで相性を調べる</a>
        <a class="quiz-btn quiz-btn-outline" href="/16type/test">もう一度診断する</a>
      </div>
    </section>

    <div class="type16-detail-grid">
      ${resultList('強み', type.strengths, 'is-strength', escapeHtml)}
      ${resultList('気をつけたいこと', type.cautions, 'is-caution', escapeHtml)}
    </div>

    <section class="type16-context-grid">
      <article class="type16-context-card">
        <p class="content-kicker">LOVE</p>
        <h2>恋愛で出やすい傾向</h2>
        <p>${escapeHtml(type.love)}</p>
      </article>
      <article class="type16-context-card">
        <p class="content-kicker">FRIENDSHIP</p>
        <h2>友達との付き合い方</h2>
        <p>${escapeHtml(type.friendship)}</p>
      </article>
      <article class="type16-context-card">
        <p class="content-kicker">WORK</p>
        <h2>仕事で活きるところ</h2>
        <p>${escapeHtml(type.work)}</p>
      </article>
      <article class="type16-context-card">
        <p class="content-kicker">TIP</p>
        <h2>伝わりやすくする一言</h2>
        <p>${escapeHtml(type.communication)}</p>
      </article>
    </section>

    <section class="info-card">
      <h2>関連する診断</h2>
      <div class="guide-link-list">
        <a href="/q/honto-no-seikaku"><strong>外から見える自分と本音の差を確かめる</strong><span>本当の性格タイプ診断</span></a>
        <a href="/q/kakure-chara"><strong>友達からどう見られているかを確かめる</strong><span>かくれキャラ診断</span></a>
        <a href="/16type"><strong>ほかの4文字タイプを読む</strong><span>16タイプ一覧</span></a>
      </div>
    </section>

    ${officialDisclaimer()}
  </main>`;

    let html = original.baseLayout({
      title: `${type.code} ${type.name}の性格・恋愛・仕事・相性 - 16タイプ解説`,
      description: `${type.code}「${type.name}」の特徴を独自解説。強み、注意点、恋愛、友達、仕事、コミュニケーションのコツを確認できます。公式MBTIとは別の非公式16タイプ情報です。`,
      ogUrl: `${siteUrl}/16type/r/${type.code}`,
      ogImage: '/og/16type.png',
      themeColor: '#6f5cd7',
      content,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${type.code} ${type.name}の16タイプ解説`,
          description: type.summary,
          url: `${siteUrl}/16type/r/${type.code}`,
          inLanguage: 'ja',
          isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: '16タイプ', item: `${siteUrl}/16type` },
            {
              '@type': 'ListItem',
              position: 3,
              name: `${type.code} ${type.name}`,
              item: `${siteUrl}/16type/r/${type.code}`,
            },
          ],
        },
      ],
    });
    html = withType16Styles(html);
    return html;
  }

  function renderType16Compatibility(query = {}) {
    const selfCode = normalizeType16Code(query.self);
    const partnerCode = normalizeType16Code(query.partner);
    const relation = normalizeRelation(query.relation);
    const result = calculateCompatibility(selfCode, partnerCode, relation);
    const hasPartialInput = Boolean(query.self || query.partner || query.relation);
    const selectSelf = TYPE16_CODES.includes(selfCode) ? selfCode : '';
    const selectPartner = TYPE16_CODES.includes(partnerCode) ? partnerCode : '';

    const resultHtml = result
      ? `
    <section class="tool-card type16-compat-result" aria-labelledby="compat-result-title">
      <p class="result-eyebrow">${escapeHtml(result.relationLabel)}の相性目安</p>
      <div class="type16-pair-heading">
        <div><span>${result.selfType.emoji}</span><strong>${result.selfType.code}</strong><small>${escapeHtml(result.selfType.name)}</small></div>
        <b>×</b>
        <div><span>${result.partnerType.emoji}</span><strong>${result.partnerType.code}</strong><small>${escapeHtml(result.partnerType.name)}</small></div>
      </div>
      <div class="type16-compat-score">
        <span>${result.score}</span><small>/ 100</small>
        <strong>${escapeHtml(compatibilityLabel(result.score))}</strong>
      </div>
      <p>${escapeHtml(result.relationIntro)}</p>
      <p class="small-note">4軸のうち、同じ傾向は${result.sameCount}個、異なる傾向は${result.differentCount}個です。違いが多いことは相性が悪いという意味ではなく、補い合える点と説明が必要な点が増えることを表します。</p>

      <div class="type16-comparison-list">
        ${result.comparisons
          .map((item) => {
            const axis = TYPE16_AXES[item.axis];
            return `
          <article class="type16-comparison-card">
            <div class="type16-comparison-heading">
              <span>${item.axis}</span>
              <strong>${item.selfLetter} × ${item.partnerLetter}</strong>
              <em>${item.same ? '近い傾向' : '異なる傾向'}</em>
            </div>
            <h3>${escapeHtml(axis.label)}</h3>
            <p><b>活かせるところ：</b>${escapeHtml(item.strength)}</p>
            <p><b>すれ違いやすいところ：</b>${escapeHtml(item.friction)}</p>
          </article>`;
          })
          .join('')}
      </div>

      <section class="type16-main-tip">
        <p class="content-kicker">ONE TIP</p>
        <h2>まず試したい会話のコツ</h2>
        <p>${escapeHtml(result.mainTip)}</p>
      </section>

      <div class="result-actions">
        <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(
          `${siteUrl}/16type/compatibility?self=${result.selfType.code}&partner=${result.partnerType.code}&relation=${result.relation}`
        )}" data-text="${escapeHtml(
          `16タイプ相性チェック：${result.selfType.code}×${result.partnerType.code}（${result.relationLabel}）`
        )}">結果リンクをコピー</button>
        <a class="quiz-btn quiz-btn-outline" href="/16type/compatibility">別の組み合わせを見る</a>
      </div>
    </section>`
      : hasPartialInput
        ? `
    <section class="info-card type16-form-error" role="alert">
      <h2>二人のタイプを選んでください</h2>
      <p>自分と相手の4文字タイプを両方選ぶと、場面別の相性ヒントが表示されます。</p>
    </section>`
        : '';

    const content = `
  <header class="site-header quiz-header type16-hero" style="--accent:#e26d8a">
    <div class="container">
      ${original.siteHeaderNav()}
      <div class="quiz-hero-badge">💞</div>
      <h1>16タイプ相性チェック</h1>
      <p class="tagline">恋愛・友達・仕事・家族。二人の違いを、会話のヒントに変える</p>
    </div>
  </header>

  <main class="container type16-page">
    <section class="tool-card">
      <form class="type16-compat-form" action="/16type/compatibility" method="get">
        <div class="form-group">
          <label for="type16-self">自分の4文字タイプ</label>
          <select id="type16-self" name="self" required>
            <option value="">選択してください</option>
            ${typeOptions(selectSelf, escapeHtml)}
          </select>
        </div>
        <div class="type16-form-symbol">×</div>
        <div class="form-group">
          <label for="type16-partner">相手の4文字タイプ</label>
          <select id="type16-partner" name="partner" required>
            <option value="">選択してください</option>
            ${typeOptions(selectPartner, escapeHtml)}
          </select>
        </div>
        <div class="form-group type16-relation-field">
          <label for="type16-relation">どんな関係ですか？</label>
          <select id="type16-relation" name="relation">
            ${Object.entries(TYPE16_RELATIONS)
              .map(
                ([key, label]) =>
                  `<option value="${key}"${key === relation ? ' selected' : ''}>${escapeHtml(label)}</option>`
              )
              .join('')}
          </select>
        </div>
        <button class="quiz-btn" type="submit">二人の相性を見る</button>
      </form>
      <p class="type16-form-help">タイプが分からない方は、先に<a href="/16type/test">20問の簡易診断</a>を利用できます。</p>
    </section>

    ${resultHtml}

    <section class="info-card">
      <p class="content-kicker">HOW TO READ</p>
      <h2>相性の見方</h2>
      <p>このチェックは、4文字が同じか違うかだけで「良い・悪い」を決めません。似ている軸は説明が少なくても伝わりやすく、異なる軸は役割を補いやすい一方、言葉にしないと誤解されやすいと考えて整理しています。</p>
      <div class="type16-axis-grid">${axisExplanationHtml(escapeHtml)}</div>
      <p class="small-note">表示スコアは、しんだんラボ編集部が4つの軸と関係場面を組み合わせた独自ルールによる目安です。心理学的・統計的に二人の将来を予測する数値ではありません。</p>
    </section>

    ${officialDisclaimer()}

    <section class="info-card faq-list">
      <p class="content-kicker">FAQ</p>
      <h2>16タイプ相性についてよくある質問</h2>
      ${faqHtml(COMPATIBILITY_FAQS, escapeHtml)}
    </section>
  </main>
  ${result ? '<script src="/js/result-share.js"></script>' : ''}`;

    let html = original.baseLayout({
      title: '16タイプ相性チェック｜恋愛・友達・仕事・家族の相性を無料確認',
      description:
        '自分と相手の4文字タイプを選び、恋愛・友達・仕事・家族の場面別に、噛み合いやすい点、すれ違いやすい点、会話のコツを確認。MBTI公式とは別の非公式16タイプ相性ツールです。',
      ogUrl: `${siteUrl}/16type/compatibility`,
      ogImage: '/og/16type.png',
      themeColor: '#e26d8a',
      content,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: '16タイプ相性チェック',
          description: '恋愛・友達・仕事・家族の場面別に16タイプの相性ヒントを確認するツール。',
          url: `${siteUrl}/16type/compatibility`,
          inLanguage: 'ja',
          isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: '16タイプ', item: `${siteUrl}/16type` },
            {
              '@type': 'ListItem',
              position: 3,
              name: '16タイプ相性チェック',
              item: `${siteUrl}/16type/compatibility`,
            },
          ],
        },
        faqJsonLd(COMPATIBILITY_FAQS),
      ],
    });
    html = withType16Styles(html);
    if (result || hasPartialInput) html = noindexQueryResult(html);
    return html;
  }

  return {
    renderHome,
    renderType16Hub,
    renderType16Test,
    renderType16Result,
    renderType16Compatibility,
  };
}

module.exports = {
  createType16Renderers,
};
