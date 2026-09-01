'use strict';

const QUIZ_EDITORIAL = require('../data/quiz-editorial');

const HOME_FAQS = [
  {
    question: 'すべて無料で使えますか？',
    answer:
      '現在公開している診断と占いは、会員登録なしで無料で利用できます。外部サービスを紹介する場合は、該当箇所に「PR」と表示します。',
  },
  {
    question: '診断結果は科学的・医学的な判定ですか？',
    answer:
      'いいえ。タイプ診断、血液型占い、姓名判断、簡易四柱推命はエンタメ目的で、公式の心理検査、医学的診断、専門家の鑑定を代替するものではありません。',
  },
  {
    question: '十干タイプ診断は本格的な四柱推命と同じですか？',
    answer:
      '同じではありません。当サイトでは生年月日から年柱の十干を求める簡易版で、月柱・日柱・時柱や正確な節入り時刻までは計算していません。',
  },
  {
    question: '結果を友達に共有できますか？',
    answer:
      '各結果ページの共有ボタンからリンクをコピーできます。姓名判断の結果URLには入力した名前が含まれるため、共有したい場合だけリンクを送ってください。',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function normalizeQuiz(quiz) {
  if (!quiz || quiz.id !== 'honto-no-seikaku') return quiz;
  return {
    ...quiz,
    subtitle: String(quiz.subtitle).replace(
      'MBTIだけじゃ分からない',
      '16タイプ診断だけじゃ分からない'
    ),
  };
}

function fixMalformedMain(html) {
  return String(html).replace(/\n\s*main>/g, '\n  </main>');
}

function injectBeforeClosing(html, tag, block) {
  const index = html.indexOf(tag);
  if (index === -1) throw new Error(`Missing closing anchor: ${tag}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function injectBeforeFirst(html, anchor, block) {
  const index = html.indexOf(anchor);
  if (index === -1) throw new Error(`Missing insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function injectJsonLd(html, data) {
  const script = `<script type="application/ld+json">${safeJsonLd(data)}</script>`;
  return injectBeforeClosing(html, '</head>', `${script}\n`);
}

function replaceMetaContent(html, selector, content) {
  const escaped = escapeHtml(content);
  const patterns = {
    description: /<meta name="description" content="[^"]*" \/>/,
    ogDescription: /<meta property="og:description" content="[^"]*" \/>/,
    twitterDescription: /<meta name="twitter:description" content="[^"]*" \/>/,
  };
  const pattern = patterns[selector];
  if (!pattern || !pattern.test(html)) return html;
  const prefix = {
    description: '<meta name="description" content="',
    ogDescription: '<meta property="og:description" content="',
    twitterDescription: '<meta name="twitter:description" content="',
  }[selector];
  return html.replace(pattern, `${prefix}${escaped}" />`);
}

function addSharedEnhancements(html) {
  let output = fixMalformedMain(html);

  if (!output.includes('/css/quality.css')) {
    output = injectBeforeClosing(
      output,
      '</head>',
      '<link rel="stylesheet" href="/css/quality.css" />\n'
    );
  }

  if (!output.includes('href="/about.html"')) {
    output = output.replace(
      '<a href="/privacy.html">プライバシーポリシー</a>',
      [
        '<a href="/about.html">しんだんラボについて</a>',
        '<a href="/editorial-policy.html">編集・診断ポリシー</a>',
        '<a href="/privacy.html">プライバシーポリシー</a>',
      ].join('\n      ')
    );
  }

  return output;
}

function homeContentBlock() {
  const faqHtml = HOME_FAQS.map(
    ({ question, answer }) => `
      <details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`
  ).join('');

  return `
    <section class="info-card site-guide" aria-labelledby="about-shindan-lab">
      <p class="content-kicker">ABOUT</p>
      <h2 id="about-shindan-lab">しんだんラボについて</h2>
      <p>姓名判断・血液型占い・十干タイプ診断と、友達同士で結果を見せ合いやすいタイプ診断を一つにまとめた無料サイトです。結果を断定するのではなく、自分の考え方や相手との違いを話すきっかけとして楽しめるよう、計算方法と簡略化している点を明記しています。</p>
      <p>診断の質問・結果文・解説は、既存サービスの文章をコピーせず、しんだんラボ向けに独自に編集しています。占いやタイプ分けはエンタメとして利用し、大切な判断は一つの結果だけで決めないでください。</p>
      <p><a href="/about.html">サイトの目的と運営方針を読む →</a></p>
    </section>

    <section class="info-card site-guide" aria-labelledby="choose-diagnosis">
      <p class="content-kicker">GUIDE</p>
      <h2 id="choose-diagnosis">目的から診断を選ぶ</h2>
      <div class="guide-link-list">
        <a href="/meimei"><strong>名前の画数と五格を見たい</strong><span>姓名判断</span></a>
        <a href="/shichuu"><strong>生まれ年から十干・五行タイプを知りたい</strong><span>十干タイプ診断</span></a>
        <a href="/ketsueki"><strong>血液型ごとの性格傾向や二人の相性を見たい</strong><span>血液型占い</span></a>
        <a href="/q/oshikatsu-type"><strong>自分の推し方を言葉にしたい</strong><span>推し活タイプ診断</span></a>
        <a href="/q/honto-no-seikaku"><strong>外から見える自分と本音の差を確かめたい</strong><span>本当の性格タイプ診断</span></a>
      </div>
    </section>

    <section class="info-card faq-list" aria-labelledby="home-faq">
      <p class="content-kicker">FAQ</p>
      <h2 id="home-faq">よくある質問</h2>${faqHtml}
    </section>`;
}

function quizEditorialBlock(quiz, editorial) {
  const axes = editorial.axes.map((axis) => `<li>${escapeHtml(axis)}</li>`).join('');
  return `
    <section class="info-card quiz-explainer" aria-labelledby="quiz-method-${escapeHtml(quiz.id)}">
      <p class="content-kicker">HOW IT WORKS</p>
      <h2 id="quiz-method-${escapeHtml(quiz.id)}">${escapeHtml(quiz.title)}で分かること</h2>
      <p>${escapeHtml(editorial.overview)}</p>
      <h3>診断の見方</h3>
      <p>${escapeHtml(editorial.basis)}</p>
      <ul class="axis-list">${axes}</ul>
      <p class="small-note">回答時の気分や状況によって結果は変わります。正式な心理検査ではなく、今の自分を振り返るためのエンタメ診断としてお楽しみください。</p>
    </section>`;
}

function resultInsightBlock(insight) {
  return `
      <section class="result-analysis" aria-label="結果の詳しい解説">
        <h2>このタイプをもう少し詳しく</h2>
        <div class="result-analysis-grid">
          <div><p class="result-analysis-label">強み</p><p>${escapeHtml(insight.strength)}</p></div>
          <div><p class="result-analysis-label">気をつけたいこと</p><p>${escapeHtml(insight.caution)}</p></div>
          <div><p class="result-analysis-label">人との付き合い方</p><p>${escapeHtml(insight.relationships)}</p></div>
          <div><p class="result-analysis-label">今日からできること</p><p>${escapeHtml(insight.action)}</p></div>
        </div>
      </section>`;
}

function createQualityRenderers(original) {
  if (!original || typeof original.renderHome !== 'function') {
    throw new TypeError('Original render module is required');
  }

  const siteUrl = original.SITE_URL;
  const siteName = original.SITE_NAME || 'しんだんラボ';

  function renderHome(quizzes, fortuneTools) {
    const normalizedQuizzes = quizzes.map(normalizeQuiz);
    let html = addSharedEnhancements(original.renderHome(normalizedQuizzes, fortuneTools));
    html = injectBeforeClosing(html, '</main>', `${homeContentBlock()}\n  `);
    html = injectJsonLd(html, [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: `${siteUrl}/`,
        inLanguage: 'ja',
        description:
          '姓名判断・血液型占い・十干タイプ診断と、独自のタイプ診断を無料で楽しめる総合診断サイト。',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: HOME_FAQS.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ]);
    return html;
  }

  function renderQuizPage(quiz) {
    const normalizedQuiz = normalizeQuiz(quiz);
    const editorial = QUIZ_EDITORIAL[normalizedQuiz.id];
    let html = addSharedEnhancements(original.renderQuizPage(normalizedQuiz));

    if (editorial) {
      html = injectBeforeClosing(
        html,
        '</main>',
        `${quizEditorialBlock(normalizedQuiz, editorial)}\n  `
      );
    }

    const description = `${normalizedQuiz.intro} 無料・会員登録なしで、8つの質問から今の回答傾向をチェックできます。`;
    html = replaceMetaContent(html, 'description', description);
    html = replaceMetaContent(html, 'ogDescription', description);
    html = replaceMetaContent(html, 'twitterDescription', description);
    html = injectJsonLd(html, [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: normalizedQuiz.title,
        description: normalizedQuiz.intro,
        url: `${siteUrl}/q/${normalizedQuiz.id}`,
        inLanguage: 'ja',
        isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: normalizedQuiz.title,
            item: `${siteUrl}/q/${normalizedQuiz.id}`,
          },
        ],
      },
    ]);
    return html;
  }

  function renderResultPage(quiz, resultKey, matchScore) {
    const normalizedQuiz = normalizeQuiz(quiz);
    const result = normalizedQuiz.results[resultKey];
    const editorial = QUIZ_EDITORIAL[normalizedQuiz.id];
    const insight = editorial && editorial.results ? editorial.results[resultKey] : null;
    let html = addSharedEnhancements(
      original.renderResultPage(normalizedQuiz, resultKey, matchScore)
    );

    if (insight) {
      html = injectBeforeFirst(
        html,
        '<div class="result-actions">',
        `${resultInsightBlock(insight)}\n      `
      );
    }

    const shareUrl = `${siteUrl}/q/${normalizedQuiz.id}/r/${resultKey}`;
    const description = `${result.shareText} ${result.desc}`;
    html = replaceMetaContent(html, 'description', description);
    html = replaceMetaContent(html, 'ogDescription', description);
    html = replaceMetaContent(html, 'twitterDescription', description);
    html = injectJsonLd(html, [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${normalizedQuiz.title}「${result.title}」の結果`,
        description,
        url: shareUrl,
        inLanguage: 'ja',
        isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: normalizedQuiz.title,
            item: `${siteUrl}/q/${normalizedQuiz.id}`,
          },
          { '@type': 'ListItem', position: 3, name: result.title, item: shareUrl },
        ],
      },
    ]);
    return html;
  }

  return { renderHome, renderQuizPage, renderResultPage };
}

module.exports = { createQualityRenderers };
