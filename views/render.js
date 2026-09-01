const {
  STEM_CONTENT,
  BLOOD_CONTENT,
  BLOOD_COMPAT_CONTENT,
  BLOOD_COMPAT_TEXT,
  COMPAT_LEVEL_LABEL,
  SEIMEI_GAKU_MEANING,
  seimeiSummary,
} = require('../data/fortune-content');
const { STEM_KEYS } = require('../lib/fortune');
const { MEIMEI_FEATURED } = require('../data/seo-longtail');

const SITE_NAME = 'しんだんラボ';
const SITE_URL = process.env.SITE_URL || 'https://example.onrender.com'; // デプロイ後、実際のドメインに置き換えてください
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || '';
const ADSENSE_CLIENT_ID = process.env.ADSENSE_CLIENT_ID || ''; // 例: ca-pub-8602848692420724
const AFFILIATE_URL = /^https?:\/\//.test(process.env.AFFILIATE_URL || '')
  ? process.env.AFFILIATE_URL
  : '';
const AFFILIATE_TITLE = process.env.AFFILIATE_TITLE || 'もっと詳しく知りたい方へ';
const AFFILIATE_DESCRIPTION = process.env.AFFILIATE_DESCRIPTION || '診断結果をもとに、専門サービスでさらに詳しく相談できます。';
const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/.test(process.env.GA_MEASUREMENT_ID || '')
  ? process.env.GA_MEASUREMENT_ID
  : '';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function baseLayout({ title, description, ogUrl, bodyClass, content, themeColor, structuredData }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(ogUrl)}" />
${GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(GOOGLE_SITE_VERIFICATION)}" />` : ''}
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
${GA_MEASUREMENT_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(GA_MEASUREMENT_ID)}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)});\n</script>` : ''}
${ADSENSE_CLIENT_ID ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(ADSENSE_CLIENT_ID)}" crossorigin="anonymous"></script>` : ''}
${structuredData ? `<script type="application/ld+json">${safeJsonLd(structuredData)}</script>` : ''}
</head>
<body class="${bodyClass || ''}">
${content}
<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">当サイトの診断・占いコンテンツはエンタメ目的であり、公式の心理検査・医学的診断・専門家による鑑定の代わりになるものではありません。血液型と性格の関連性、姓名判断・四柱推命の的中性は科学的に証明されたものではありません。</p>
    <nav class="footer-nav">
      <a href="/">ホーム</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>
    </nav>
  </div>
</footer>
${GA_MEASUREMENT_ID ? `<script>
(function () {
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.tagName !== 'FORM') return;
    track('tool_submit', {
      tool_path: form.getAttribute('action') || window.location.pathname,
    });
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.origin === window.location.origin) return;
    track(link.dataset.affiliate === 'true' ? 'affiliate_outbound_click' : 'outbound_click', {
      link_url: link.href,
      page_path: window.location.pathname,
    });
  });
})();
</script>` : ''}
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').catch(function () {});
  });
}
</script>
</body>
</html>`;
}

// 承認済みの広告URLが設定された場合だけ表示します。
function affiliateSlot() {
  if (!AFFILIATE_URL) return '';
  return `
    <section class="affiliate-card">
      <p class="affiliate-eyebrow">PR</p>
      <h2>${escapeHtml(AFFILIATE_TITLE)}</h2>
      <p>${escapeHtml(AFFILIATE_DESCRIPTION)}</p>
      <a class="quiz-btn quiz-btn-outline" href="${escapeHtml(AFFILIATE_URL)}" target="_blank" rel="sponsored nofollow noopener" data-affiliate="true">サービスを見る</a>
    </section>`;
}

function siteHeaderNav() {
  return `<a href="/" class="logo">しんだんラボ</a>`;
}

// ---------------------------------------------------------------------------
// ホーム
// ---------------------------------------------------------------------------

function renderHome(quizzes, fortuneTools) {
  const quizCards = quizzes
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

  const fortuneCards = fortuneTools
    .map(
      (t) => `
      <a href="${t.href}" class="quiz-card" style="--accent:${t.themeColor}">
        <div class="quiz-card-badge">${t.emoji}</div>
        <h2>${escapeHtml(t.title)}</h2>
        <p>${escapeHtml(t.subtitle)}</p>
        <span class="quiz-card-cta">診断スタート →</span>
      </a>`
    )
    .join('\n');

  const content = `
  <header class="site-header">
    <div class="container">
      ${siteHeaderNav()}
      <p class="tagline">姓名判断・血液型占い・四柱推命から、話題の性格診断まで。無料、会員登録なしですぐ診断できます</p>
    </div>
  </header>


  <main class="container">
    <section class="content-section">
      <h2 class="section-title">占い</h2>
      <div class="quiz-grid">
        ${fortuneCards}
      </div>
    </section>

    <section class="content-section">
      <h2 class="section-title">タイプ診断</h2>
      <div class="quiz-grid">
        ${quizCards}
      </div>
    </section>

  </main>`;

  return baseLayout({
    title: '無料占い・姓名判断・血液型占い・四柱推命診断まとめ - しんだんラボ',
    description: '姓名判断、血液型占い、四柱推命の十干タイプ診断から、推し活タイプ・隠れた性格診断まで。無料・会員登録なしで今すぐ診断できる総合診断サイトです。',
    ogUrl: SITE_URL + '/',
    content,
  });
}

// ---------------------------------------------------------------------------
// タイプ診断（選択式クイズ、既存エンジン）
// ---------------------------------------------------------------------------

function renderQuizPage(quiz) {
  const content = `
  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">
    <div class="container">
      ${siteHeaderNav()}
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

function renderResultPage(quiz, resultKey, matchScore) {
  const result = quiz.results[resultKey];
  const shareUrl = `${SITE_URL}/q/${quiz.id}/r/${resultKey}`;
  const scoreHtml = Number.isInteger(matchScore)
    ? `
      <div class="compat-box" style="text-align:center;">
        <p class="result-eyebrow">私の「${escapeHtml(result.title)}」一致率</p>
        <p style="font-size:2.2rem;font-weight:800;color:${quiz.themeColor};margin:4px 0;">${matchScore}%</p>
      </div>`
    : '';

  const content = `
  <header class="site-header quiz-header" style="--accent:${quiz.themeColor}">
    <div class="container">
      ${siteHeaderNav()}
    </div>
  </header>

  <main class="container">
    <section class="tool-card result-card" style="--accent:${quiz.themeColor}">
      <p class="result-eyebrow">${escapeHtml(quiz.title)} 結果</p>
      <div class="result-badge">${result.emoji}</div>
      <h1>${escapeHtml(result.title)}</h1>
      <p class="result-desc">${escapeHtml(result.desc)}</p>
      ${scoreHtml}

      <div class="result-actions">
        <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(shareUrl)}" data-text="${escapeHtml(result.shareText)}">
          リンクをコピーしてシェア
        </button>
        <a href="/q/${quiz.id}" class="quiz-btn quiz-btn-outline">もう一度診断する</a>
      </div>
    </section>


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

// ---------------------------------------------------------------------------
// 共通: フォームページの外枠
// ---------------------------------------------------------------------------

function formPageShell({ accent, emoji, title, subtitle, formHtml, ogUrl, description }) {
  const content = `
  <header class="site-header quiz-header" style="--accent:${accent}">
    <div class="container">
      ${siteHeaderNav()}
      <div class="quiz-hero-badge">${emoji}</div>
      <h1>${escapeHtml(title)}</h1>
      <p class="tagline">${escapeHtml(subtitle)}</p>
    </div>
  </header>

  <main class="container">
    <section class="tool-card" style="--accent:${accent}">
      ${formHtml}
    </section>

  </main>`;

  return baseLayout({
    title: `${title} - しんだんラボ`,
    description,
    ogUrl,
    themeColor: accent,
    content,
  });
}

function resultPageShell({ accent, eyebrow, emoji, title, bodyHtml, ogUrl, ogTitle, description, backHref, backLabel, structuredData }) {
  const content = `
  <header class="site-header quiz-header" style="--accent:${accent}">
    <div class="container">
      ${siteHeaderNav()}
    </div>
  </header>

  <main class="container">
    <section class="tool-card result-card" style="--accent:${accent}">
      <p class="result-eyebrow">${escapeHtml(eyebrow)}</p>
      <div class="result-badge">${emoji}</div>
      <h1>${escapeHtml(title)}</h1>
      ${bodyHtml}
      <div class="result-actions">
        <a href="${backHref}" class="quiz-btn quiz-btn-outline">${escapeHtml(backLabel)}</a>
      </div>
    </section>


    ${affiliateSlot()}

    <section class="info-card">
      <h2>他の診断もやってみる</h2>
      <p><a href="/">しんだんラボのホームで他の診断を見る →</a></p>
    </section>
  </main>`;

  return baseLayout({
    title: ogTitle,
    description,
    ogUrl,
    themeColor: accent,
    content,
    structuredData,
  });
}

// ---------------------------------------------------------------------------
// 簡易四柱推命（十干タイプ診断）
// ---------------------------------------------------------------------------

const SHICHUU_ACCENT = '#8a6fd8';

function renderShichuuForm() {
  const currentYear = 2026;
  const years = [];
  for (let y = currentYear; y >= currentYear - 90; y--) years.push(y);

  const yearOptions = years.map((y) => `<option value="${y}">${y}年</option>`).join('');
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
    .map((m) => `<option value="${m}">${m}月</option>`)
    .join('');
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)
    .map((d) => `<option value="${d}">${d}日</option>`)
    .join('');

  const formHtml = `
    <p class="tool-desc">生年月日から、あなたの「十干（じっかん）」タイプを診断します。十干は四柱推命のベースとなる考え方で、生まれ年をもとに10種類・木火土金水（五行）のいずれかのタイプに分類されます。※月柱・日柱まで含めた本格的な四柱推命ではなく、年柱（生まれ年）のみを使った簡易版です。</p>
    <form method="GET" action="/shichuu/compute">
      <div class="form-row">
        <label for="year">生年月日</label>
        <div class="form-select-group">
          <select name="year" id="year" required>${yearOptions}</select>
          <select name="month" id="month" required>${monthOptions}</select>
          <select name="day" id="day" required>${dayOptions}</select>
        </div>
      </div>
      <button type="submit" class="quiz-btn">診断する</button>
    </form>
    <div class="link-grid">
      <p class="link-grid-title">十干タイプ一覧から見る</p>
      <div class="link-grid-items">
        ${STEM_KEYS.map((k) => {
          const s = STEM_CONTENT[k];
          return `<a href="/shichuu/r/${k}" class="link-grid-item">${escapeHtml(s.emoji)} ${escapeHtml(s.title)}</a>`;
        }).join('\n        ')}
      </div>
    </div>`;

  return formPageShell({
    accent: SHICHUU_ACCENT,
    emoji: '☯️',
    title: '四柱推命 無料診断（十干タイプ・簡易命式）',
    subtitle: '生まれ年から、あなたの五行タイプを診断',
    formHtml,
    ogUrl: `${SITE_URL}/shichuu`,
    description: '無料の四柱推命診断。生年月日から十干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）のタイプと命式を診断する簡易四柱推命ツールです。',
  });
}

function renderShichuuResult(stemKey) {
  const s = STEM_CONTENT[stemKey];
  const shareUrl = `${SITE_URL}/shichuu/r/${stemKey}`;
  const pageTitle = `私の十干タイプは「${s.title}」 ${s.emoji} - しんだんラボ`;

  const bodyHtml = `
    <p class="result-desc" style="text-align:center;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(s.subtitle)}</p>
    <p class="result-desc">${escapeHtml(s.desc)}</p>
    <div class="result-actions" style="margin-bottom:14px;">
      <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(shareUrl)}" data-text="${escapeHtml(s.shareText)}">
        リンクをコピーしてシェア
      </button>
    </div>`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: s.shareText,
      url: shareUrl,
      inLanguage: 'ja',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '十干タイプ診断', item: `${SITE_URL}/shichuu` },
        { '@type': 'ListItem', position: 3, name: s.title, item: shareUrl },
      ],
    },
  ];

  return resultPageShell({
    accent: SHICHUU_ACCENT,
    eyebrow: '十干タイプ診断 結果',
    emoji: s.emoji,
    title: s.title,
    bodyHtml: bodyHtml + `<script src="/js/result-share.js"></script>`,
    ogUrl: shareUrl,
    ogTitle: pageTitle,
    description: s.shareText,
    backHref: '/shichuu',
    backLabel: 'もう一度診断する',
    structuredData,
  });
}

// ---------------------------------------------------------------------------
// 血液型占い
// ---------------------------------------------------------------------------

const KETSUEKI_ACCENT = '#d64550';
const BLOOD_TYPES = ['A', 'B', 'O', 'AB'];

function renderKetsuekiForm() {
  const typeOptions = () =>
    BLOOD_TYPES.map((t) => `<option value="${t}">${t}型</option>`).join('');

  const pairLinks = [];
  BLOOD_TYPES.forEach((type, index) => {
    BLOOD_TYPES.slice(index).forEach((partner) => {
      pairLinks.push(`<a href="/ketsueki/r/${type}/${partner}" class="link-grid-item">${type}型×${partner}型</a>`);
    });
  });

  const formHtml = `
    <p class="tool-desc">あなたと気になる相手の血液型を選ぶと、組み合わせごとの性格傾向・恋愛・すれ違いやすい点・付き合い方のヒントを読めます。</p>
    <form method="GET" action="/ketsueki/compute">
      <div class="form-row">
        <label for="type">あなたの血液型</label>
        <select name="type" id="type" required>
          <option value="">選択してください</option>
          ${typeOptions()}
        </select>
      </div>
      <div class="form-row">
        <label for="partner">気になる相手の血液型（任意）</label>
        <select name="partner" id="partner">
          <option value="">選択しない</option>
          ${typeOptions()}
        </select>
      </div>
      <button type="submit" class="quiz-btn">診断する</button>
    </form>
    <div class="link-grid">
      <p class="link-grid-title">血液型の組み合わせ相性10通り</p>
      <div class="link-grid-items">
        ${pairLinks.join('\n        ')}
      </div>
    </div>
    <div class="compat-box">
      <h2>血液型相性占いの見方</h2>
      <p class="result-desc">血液型占いは、日本で会話のきっかけとして親しまれてきたエンタメです。同じ血液型でも性格や関係性は一人ひとり異なります。結果で相手を決めつけず、二人の違いを話すヒントとしてお楽しみください。</p>
    </div>`;

  return formPageShell({
    accent: KETSUEKI_ACCENT,
    emoji: '🩸',
    title: '血液型相性占い 無料｜性格・恋愛の相性診断',
    subtitle: 'A型・B型・O型・AB型、10通りの組み合わせをチェック',
    formHtml,
    ogUrl: `${SITE_URL}/ketsueki`,
    description: '無料の血液型相性占い。A型・B型・O型・AB型の10通りの組み合わせごとに、恋愛傾向、すれ違いやすい点、うまく付き合うコツを紹介します。',
  });
}

function renderKetsuekiResult(type, partnerType) {
  const b = BLOOD_CONTENT[type];
  const hasPartner = !!partnerType;
  const shareUrl = hasPartner ? `${SITE_URL}/ketsueki/r/${type}/${partnerType}` : `${SITE_URL}/ketsueki/r/${type}`;

  let compatHtml = '';
  let relatedHtml = '';
  let compat = null;

  if (hasPartner) {
    const partner = BLOOD_CONTENT[partnerType];
    const compatKey = `${type}-${partnerType}`;
    compat = BLOOD_COMPAT_CONTENT[compatKey];

    const relatedLinks = [];
    BLOOD_TYPES.forEach((first, index) => {
      BLOOD_TYPES.slice(index).forEach((second) => {
        if (first === type && second === partnerType) return;
        if (first === type || second === type || first === partnerType || second === partnerType) {
          relatedLinks.push(`<a href="/ketsueki/r/${first}/${second}" class="link-grid-item">${first}型×${second}型</a>`);
        }
      });
    });

    compatHtml = `
      <div class="compat-box">
        <h2>${escapeHtml(type)}型と${escapeHtml(partnerType)}型｜相性の特徴</h2>
        <p class="result-desc">${escapeHtml(compat.summary)}</p>
        <h2>恋愛では</h2>
        <p class="result-desc">${escapeHtml(compat.love)}</p>
        <h2>すれ違いやすい点</h2>
        <p class="result-desc">${escapeHtml(compat.friction)}</p>
        <h2>うまく付き合うコツ</h2>
        <p class="result-desc">${escapeHtml(compat.tip)}</p>
      </div>
      <div class="compat-box">
        <h2>それぞれの性格傾向</h2>
        <h3>${escapeHtml(type)}型の傾向</h3>
        <p class="result-desc">${escapeHtml(b.desc)}</p>
        <h3>${escapeHtml(partnerType)}型の傾向</h3>
        <p class="result-desc">${escapeHtml(partner.desc)}</p>
      </div>`;

    relatedHtml = `
      <div class="link-grid">
        <p class="link-grid-title">関連する血液型相性を見る</p>
        <div class="link-grid-items">${relatedLinks.slice(0, 6).join('\n')}</div>
      </div>`;
  }

  const pairShareText = hasPartner
    ? `${type}型と${partnerType}型の相性をチェックしました｜しんだんラボ`
    : b.shareText;

  const bodyHtml = `
    ${hasPartner ? compatHtml : `<p class="result-desc">${escapeHtml(b.desc)}</p>`}
    <p class="disclaimer" style="text-align:left;margin:0 0 18px;">血液型と性格の関連性は科学的には証明されていません。日本で広く親しまれてきたエンタメとしてお楽しみください。</p>
    ${relatedHtml}
    <div class="result-actions" style="margin-bottom:14px;">
      <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(shareUrl)}" data-text="${escapeHtml(pairShareText)}">
        リンクをコピーしてシェア
      </button>
    </div>`;

  const pageTitle = hasPartner
    ? `${type}型と${partnerType}型の相性｜恋愛・性格・うまく付き合うコツ`
    : `${b.title}の性格傾向｜血液型占い`;
  const pageDescription = hasPartner
    ? `${type}型と${partnerType}型の相性を血液型占いで紹介。恋愛傾向、すれ違いやすい点、うまく付き合うコツまで解説します。${compat.summary}`
    : b.shareText;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: shareUrl,
      inLanguage: 'ja',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '血液型相性占い', item: `${SITE_URL}/ketsueki` },
        {
          '@type': 'ListItem',
          position: 3,
          name: hasPartner ? `${type}型と${partnerType}型の相性` : `${type}型の性格傾向`,
          item: shareUrl,
        },
      ],
    },
  ];

  return resultPageShell({
    accent: KETSUEKI_ACCENT,
    eyebrow: hasPartner ? '血液型相性占い' : '血液型占い 結果',
    emoji: b.emoji,
    title: hasPartner ? `${type}型と${partnerType}型の相性` : b.title,
    bodyHtml: bodyHtml + `<script src="/js/result-share.js"></script>`,
    ogUrl: shareUrl,
    ogTitle: `${pageTitle} - しんだんラボ`,
    description: pageDescription,
    backHref: '/ketsueki',
    backLabel: '別の組み合わせを見る',
    structuredData,
  });
}

// ---------------------------------------------------------------------------
// 姓名判断
// ---------------------------------------------------------------------------

const MEIMEI_ACCENT = '#3f7d5c';

function renderMeimeiForm(errorMessage) {
  const errorHtml = errorMessage
    ? `<p class="form-error">${escapeHtml(errorMessage)}</p>`
    : '';

  const formHtml = `
    <p class="tool-desc">姓名の漢字の画数から「天格・人格・地格・外格・総格」の五格を算出し、吉凶を診断します。漢字のお名前でお試しください（ひらがな・カタカナには対応していません）。</p>
    ${errorHtml}
    <form method="GET" action="/meimei/result">
      <div class="form-row">
        <label for="sei">姓（苗字）</label>
        <input type="text" name="sei" id="sei" placeholder="例：田中" required />
      </div>
      <div class="form-row">
        <label for="mei">名（下の名前）</label>
        <input type="text" name="mei" id="mei" placeholder="例：太郎" required />
      </div>
      <button type="submit" class="quiz-btn">診断する</button>
    </form>
    <div class="link-grid">
      <p class="link-grid-title">人気の組み合わせ例を見る</p>
      <div class="link-grid-items">
        ${MEIMEI_FEATURED.map(
          ({ sei, mei }) =>
            `<a href="/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}" class="link-grid-item">${escapeHtml(sei)} ${escapeHtml(mei)}</a>`
        ).join('\n        ')}
      </div>
    </div>`;

  return formPageShell({
    accent: MEIMEI_ACCENT,
    emoji: '🖋️',
    title: '姓名判断 無料診断｜画数でわかる五格・吉凶',
    subtitle: '漢字の画数から五格・吉凶をチェック',
    formHtml,
    ogUrl: `${SITE_URL}/meimei`,
    description: '無料の姓名判断。姓名の漢字の画数から天格・人格・地格・外格・総格の五格を算出し、吉凶を診断するツールです。',
  });
}

function renderMeimeiResult(sei, mei, calcResult) {
  const shareUrl = `${SITE_URL}/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}`;
  const fullName = `${sei} ${mei}`;

  if (!calcResult.ok) {
    const bodyHtml = `
      <p class="result-desc">「${escapeHtml(sei)} ${escapeHtml(mei)}」を診断できませんでした。姓名判断は漢字のお名前にのみ対応しています（ひらがな・カタカナ・一部の異体字は非対応の場合があります）。別の表記でもう一度お試しください。</p>`;

    return resultPageShell({
      accent: MEIMEI_ACCENT,
      eyebrow: '姓名判断',
      emoji: '🖋️',
      title: '診断できませんでした',
      bodyHtml,
      ogUrl: shareUrl,
      ogTitle: `姓名判断 - しんだんラボ`,
      description: '姓名判断ツール',
      backHref: '/meimei',
      backLabel: 'もう一度入力する',
    });
  }

  const rows = calcResult.grid
    .map(
      (g) => `
      <tr class="seimei-row seimei-row-${g.judge}">
        <td class="seimei-label">${escapeHtml(g.label)}</td>
        <td class="seimei-value">${g.value}</td>
        <td class="seimei-judge">${g.judge === 'kichi' ? '吉' : '凶'}</td>
        <td class="seimei-meaning">${escapeHtml(SEIMEI_GAKU_MEANING[g.key])}</td>
      </tr>`
    )
    .join('\n');

  const shareText = `姓名判断「${fullName}」の結果は五格中${calcResult.kichiCount}つが吉数でした`;
  const pageTitle = `「${fullName}」の姓名判断結果 - しんだんラボ`;

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: shareText,
      url: shareUrl,
      inLanguage: 'ja',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '姓名判断', item: `${SITE_URL}/meimei` },
        { '@type': 'ListItem', position: 3, name: fullName, item: shareUrl },
      ],
    },
  ];

  const bodyHtml = `
    <p class="result-desc" style="text-align:center;">「${escapeHtml(fullName)}」さんの診断結果</p>
    <div class="seimei-table-wrap">
      <table class="seimei-table">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    <p class="result-desc">${escapeHtml(seimeiSummary(calcResult.kichiCount))}</p>
    <p class="disclaimer" style="text-align:left;margin:0 0 18px;">この計算は現代（新字体）の画数を使った簡易版です。流派によっては旧字体の画数を用いる場合があり、結果が異なることがあります。エンタメとしてお楽しみください。</p>
    <div class="result-actions" style="margin-bottom:14px;">
      <button id="copy-link-btn" class="quiz-btn" data-url="${escapeHtml(shareUrl)}" data-text="${escapeHtml(shareText)}">
        リンクをコピーしてシェア
      </button>
    </div>`;

  return resultPageShell({
    accent: MEIMEI_ACCENT,
    eyebrow: '姓名判断 結果',
    emoji: calcResult.kichiCount >= 3 ? '🖋️' : '🖋️',
    title: `${fullName}`,
    bodyHtml: bodyHtml + `<script src="/js/result-share.js"></script>`,
    ogUrl: shareUrl,
    ogTitle: pageTitle,
    description: shareText,
    backHref: '/meimei',
    backLabel: '別の名前で診断する',
    structuredData,
  });
}

module.exports = {
  renderHome,
  renderQuizPage,
  renderResultPage,
  renderShichuuForm,
  renderShichuuResult,
  renderKetsuekiForm,
  renderKetsuekiResult,
  renderMeimeiForm,
  renderMeimeiResult,
  SITE_NAME,
  SITE_URL,
};
