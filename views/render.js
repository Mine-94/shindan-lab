const SITE_NAME = 'しんだんラボ';
const SITE_URL = process.env.SITE_URL || 'https://example.onrender.com'; // デプロイ後、実際のドメインに置き換えてください

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseLayout({ title, description, ogUrl, bodyClass, content, themeColor }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(ogUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${themeColor ? `<meta name="theme-color" content="${themeColor}" />` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css" />
</head>
<body class="${bodyClass || ''}">
${content}
<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">当サイトの診断はエンタメ目的のコンテンツであり、公式の心理検査・医学的診断ではありません。</p>
    <nav class="footer-nav">
      <a href="/">ホーム</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>
    </nav>
  </div>
</footer>
</body>
</html>`;
}

function renderHome(quizzes) {
  const cards = quizzes
    .map(
      (q) => `
      <a href="/q/${q.id}" class="quiz-card" style="--accent:${q.themeColor}">
        <div class="quiz-card-badge">${q.emoji}</div>
        <h2>${escapeHtml(q.title)}</h2>
        <p>${escapeHtml(q.subtitle)}</p>
        <span class="quiz-card-cta">診断スタート →</span>
      </a>`
    )
    .join('\n');

  const content = `
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">今話題の診断・タイプ分けだけを集めました — 無料、会員登録なしで30秒完了</p>
    </div>
  </header>

  <div class="ad-slot ad-slot-top container">
    <div class="ad-placeholder">広告枠（上部）</div>
  </div>

  <main class="container">
    <section class="quiz-grid">
      ${cards}
    </section>

    <div class="ad-slot ad-slot-bottom">
      <div class="ad-placeholder">広告枠（下部）</div>
    </div>
  </main>`;

  return baseLayout({
    title: 'しんだんラボ - 今話題の性格診断・タイプ分け・バランスゲーム',
    description: '推し活タイプ、隠れた性格、人生の価値観バランスゲームまで。SNSでシェアしたくなる診断を集めました。',
    ogUrl: SITE_URL + '/',
    content,
  });
}

function renderQuizPage(quiz) {
  const content = `
  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <div class="quiz-hero-badge">${quiz.emoji}</div>
      <h1>${escapeHtml(quiz.title)}</h1>
      <p class="tagline">${escapeHtml(quiz.subtitle)}</p>
    </div>
  </header>

  <main class="container">
    <section class="tool-card quiz-app" style="--accent:${quiz.themeColor}" data-quiz-id="${quiz.id}">
      <div id="quiz-intro">
        <p class="tool-desc">${escapeHtml(quiz.intro)}</p>
        <button id="start-btn" class="quiz-btn">診断スタート</button>
      </div>

      <div id="quiz-play" hidden>
        <div class="quiz-progress"><div class="quiz-progress-bar" id="progress-bar"></div></div>
        <p class="quiz-question-count" id="question-count"></p>
        <h2 id="question-text"></h2>
        <div id="options-list" class="quiz-options"></div>
      </div>
    </section>

    <div class="ad-slot ad-slot-bottom">
      <div class="ad-placeholder">広告枠（下部）</div>
    </div>
  </main>

  <script>window.__QUIZ__ = ${JSON.stringify(quiz)};</script>
  <script src="/js/quiz-app.js"></script>
  `;

  return baseLayout({
    title: `${quiz.title} - しんだんラボ`,
    description: quiz.subtitle,
    ogUrl: `${SITE_URL}/q/${quiz.id}`,
    themeColor: quiz.themeColor,
    content,
  });
}

function renderResultPage(quiz, resultKey) {
  const result = quiz.results[resultKey];
  const shareUrl = `${SITE_URL}/q/${quiz.id}/r/${resultKey}`;

  const content = `
  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
    </div>
  </header>

  <main class="container">
    <section class="tool-card result-card" style="--accent:${quiz.themeColor}">
      <p class="result-eyebrow">${escapeHtml(quiz.title)} 結果</p>
      <div class="result-badge">${result.emoji}</div>
      <h1>${escapeHtml(result.title)}</h1>
      <p class="result-desc">${escapeHtml(result.desc)}</p>

      <div class="result-actions">
        <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(shareUrl)}" data-text="${escapeHtml(result.shareText)}">
          リンクをコピーしてシェア
        </button>
        <a href="/q/${quiz.id}" class="quiz-btn quiz-btn-outline">もう一度診断する</a>
      </div>
    </section>

    <div class="ad-slot ad-slot-bottom">
      <div class="ad-placeholder">広告枠（下部）</div>
    </div>

    <section class="info-card">
      <h2>他の診断もやってみる</h2>
      <p><a href="/">しんだんラボのホームで他の診断を見る →</a></p>
    </section>
  </main>

  <script src="/js/result-share.js"></script>
  `;

  return baseLayout({
    title: `私の結果は「${result.title}」 ${result.emoji} - ${quiz.title}`,
    description: result.shareText,
    ogUrl: shareUrl,
    themeColor: quiz.themeColor,
    content,
  });
}

module.exports = { renderHome, renderQuizPage, renderResultPage, SITE_NAME };
