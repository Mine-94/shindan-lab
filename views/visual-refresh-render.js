'use strict';

const VISUAL_REFRESH_VERSION = '2026-09-05-v1';

function brandLogoHtml() {
  return `<a href="/" class="logo" aria-label="しんだんラボ ホーム">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="brand-copy"><strong>しんだんラボ</strong><small>知ることで、もっと自分らしく</small></span>
    </a>`;
}

function addBodyClasses(html, pageClass) {
  const classes = ['visual-refresh', pageClass].filter(Boolean).join(' ');
  if (/<body class="[^"]*">/.test(html)) {
    return html.replace(/<body class="([^"]*)">/, (_match, existing) => {
      const merged = `${existing} ${classes}`.trim().replace(/\s+/g, ' ');
      return `<body class="${merged}" data-visual-refresh="${VISUAL_REFRESH_VERSION}">`;
    });
  }
  return html.replace(
    '<body>',
    `<body class="${classes}" data-visual-refresh="${VISUAL_REFRESH_VERSION}">`
  );
}

function addVisualStyles(html) {
  if (html.includes('/css/visual-refresh.css')) return html;
  return html.replace(
    '</head>',
    '<link rel="stylesheet" href="/css/visual-refresh.css" />\n</head>'
  );
}

function upgradeBrandAndNavigation(html) {
  let output = String(html).replaceAll(
    '<a href="/" class="logo">しんだんラボ</a>',
    brandLogoHtml()
  );

  output = output.replace(/<nav class="site-nav"([^>]*)>([\s\S]*?)<\/nav>/g, (match, attrs, inner) => {
    if (inner.includes('site-nav-cta')) return match;
    return `<nav class="site-nav"${attrs}>${inner}\n      <a class="site-nav-cta" href="/16type/test">診断を始める</a>\n    </nav>`;
  });
  return output;
}

function withVisualRefresh(html, pageClass) {
  let output = String(html);
  output = upgradeBrandAndNavigation(output);
  output = addBodyClasses(output, pageClass);
  output = addVisualStyles(output);
  return output;
}

function homeHeroHtml() {
  return `<div class="home-hero-layout">
        <div class="home-hero-copy">
          <p class="home-hero-kicker">自分を知る、相手を知る</p>
          <h1 class="home-main-title" data-content-depth="home-h1" data-content-depth-version="2026-09-05-v2">
            <span class="home-title-line">無料の性格診断</span>
            <span class="home-title-line">16タイプ相性・占いを、</span>
            <span class="home-title-line is-accent">見やすく一つに。</span>
          </h1>
          <p class="tagline">16タイプ、心理テスト、恋愛・友達・仕事の相性、姓名判断、血液型占い、十干タイプ診断を無料で楽しめます。結果を決めつけではなく、自分と相手を理解する会話のきっかけとして使えるように整理しています。</p>
          <div class="home-hero-actions">
            <a class="quiz-btn" href="/16type/test">16タイプ診断を始める →</a>
            <a class="quiz-btn quiz-btn-outline" href="/16type/compatibility">二人の相性を見る</a>
          </div>
          <ul class="home-hero-points" aria-label="利用の特徴">
            <li><i aria-hidden="true">✓</i>会員登録不要</li>
            <li><i aria-hidden="true">✓</i>スマホで使いやすい</li>
            <li><i aria-hidden="true">✓</i>恋愛・友達・仕事に対応</li>
          </ul>
        </div>
        <div class="home-hero-visual" aria-hidden="true">
          <div class="home-hero-card">
            <span class="home-hero-card-kicker">16タイプを見つける</span>
            <div class="home-hero-wheel"></div>
            <strong>しんだんラボ</strong>
            <small>知ることで、選び方が少し見える。</small>
          </div>
        </div>
      </div>`;
}

function upgradeHomeHero(html) {
  if (html.includes('class="home-hero-layout"')) return html;
  let output = String(html).replace(
    '<header class="site-header">',
    '<header class="site-header home-site-header">'
  );
  const pattern = /<h1 class="home-main-title"[^>]*>[\s\S]*?<\/h1>\s*<p class="tagline">[\s\S]*?<\/p>/;
  if (!pattern.test(output)) {
    throw new Error('Could not locate the homepage title and tagline for the visual refresh');
  }
  return output.replace(pattern, homeHeroHtml());
}

function polishHomePriorityCopy(html) {
  return String(html)
    .replace('<p class="content-kicker">DATA PRIORITY</p>', '<p class="content-kicker">まずはこちら</p>')
    .replace('16タイプ・MBTI関連を中心に、今おすすめの診断', 'はじめての方におすすめの診断')
    .replace(
      '日本の公開調査、実サービスの利用行動、検索意図、初めて使う人の始めやすさを点数化し、上位3件を先に表示しています。',
      'どれから始めるか迷った方へ。まず自分の傾向を知り、次に相性や心理テストへ進める順番で案内しています。'
    )
    .replace(
      '編集順位の最終更新: 2026年9月2日。サイト内の実測データが十分にたまった後は、クリック率・完了率・共有率を優先して見直します。',
      '利用状況や診断の完了率を確認しながら、案内の順番と説明を定期的に見直しています。'
    )
    .replaceAll('データ優先 1位', 'おすすめ 1')
    .replaceAll('データ優先 2位', 'おすすめ 2')
    .replaceAll('データ優先 3位', 'おすすめ 3')
    .replace('<div class="quiz-card-badge">🧩</div>', '<div class="quiz-card-badge" aria-hidden="true">01</div>')
    .replace('<div class="quiz-card-badge">💞</div>', '<div class="quiz-card-badge" aria-hidden="true">02</div>')
    .replace('<div class="quiz-card-badge">💗</div>', '<div class="quiz-card-badge" aria-hidden="true">03</div>');
}

function celebrityHomeTeaserHtml() {
  return `<section class="type16-celebrity-home-teaser" data-type16-celebrity-home-teaser aria-labelledby="celebrity-home-title">
      <div class="celebrity-teaser-copy">
        <p class="content-kicker">推しから探す</p>
        <h2 id="celebrity-home-title">推し・有名人から16タイプを探す</h2>
        <p>BTS、BIGBANG、BLACKPINK、日本の俳優・アイドルなど、公表情報を確認できた48人を一つの一覧にまとめています。名前や4文字タイプから、気になる人物との共通点を探せます。</p>
      </div>
      <div class="celebrity-teaser-side">
        <div class="celebrity-teaser-faces" aria-hidden="true">
          <span>RM</span><span>JISOO</span><span>GD</span><span>北川</span><span>V</span>
        </div>
        <a class="quiz-btn" href="/16type#celebrity-directory" data-type16-celebrity-directory-cta>有名人一覧を見る →</a>
      </div>
    </section>`;
}

function upgradeCelebrityHomeTeaser(html) {
  if (!html.includes('type16-celebrity-home-teaser')) return html;
  const pattern = /<section class="type16-celebrity-home-teaser"[\s\S]*?<\/section>/;
  if (!pattern.test(html)) {
    throw new Error('Could not locate the homepage celebrity teaser for the visual refresh');
  }
  return String(html).replace(pattern, celebrityHomeTeaserHtml());
}

function replaceFirstHeroBadge(html, label, caption = 'TYPE') {
  if (html.includes('class="type16-brand-mark"')) return html;
  const pattern = /<div class="quiz-hero-badge">[\s\S]*?<\/div>/;
  if (!pattern.test(html)) return html;
  return String(html).replace(
    pattern,
    `<div class="type16-brand-mark service-brand-mark" aria-hidden="true"><span>${label}</span><small>${caption}</small></div>`
  );
}

function polishType16Hub(html) {
  return replaceFirstHeroBadge(
    String(html).replace(
      'MBTI関連でよく見かける4文字タイプを、独自の日本語解説で整理',
      '4つの傾向から、自分の考え方や行動パターンを整理'
    ),
    '16',
    'TYPE'
  );
}

function polishType16Test(html) {
  return replaceFirstHeroBadge(
    String(html).replace(
      '20問・約3分。4つの回答傾向から今の4文字タイプをチェック',
      '20問・約3分。今の回答傾向を4つの軸で確認'
    ),
    '20',
    '問'
  );
}

function wrap(original, name, pageClass, transform) {
  if (typeof original[name] !== 'function') return null;
  return (...args) => {
    let html = original[name](...args);
    if (transform) html = transform(html, ...args);
    return withVisualRefresh(html, pageClass);
  };
}

function createVisualRefreshRenderers(original) {
  if (!original || typeof original.renderHome !== 'function') {
    throw new TypeError('Original render module is required');
  }

  const renderers = {};

  renderers.renderHome = wrap(original, 'renderHome', 'page-home', (html) =>
    upgradeCelebrityHomeTeaser(polishHomePriorityCopy(upgradeHomeHero(html)))
  );
  renderers.renderQuizPage = wrap(original, 'renderQuizPage', 'page-quiz', (html) => replaceFirstHeroBadge(html, '診', 'テスト'));
  renderers.renderResultPage = wrap(original, 'renderResultPage', 'page-result');
  renderers.renderShichuuForm = wrap(original, 'renderShichuuForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '十', '干'));
  renderers.renderShichuuResult = wrap(original, 'renderShichuuResult', 'page-result');
  renderers.renderKetsuekiForm = wrap(original, 'renderKetsuekiForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '血', '型'));
  renderers.renderKetsuekiResult = wrap(original, 'renderKetsuekiResult', 'page-result');
  renderers.renderMeimeiForm = wrap(original, 'renderMeimeiForm', 'page-tool', (html) => replaceFirstHeroBadge(html, '名', '前'));
  renderers.renderMeimeiResult = wrap(original, 'renderMeimeiResult', 'page-result');
  renderers.renderType16Hub = wrap(original, 'renderType16Hub', 'page-type16-hub', polishType16Hub);
  renderers.renderType16Test = wrap(original, 'renderType16Test', 'page-type16-test', polishType16Test);
  renderers.renderType16Result = wrap(original, 'renderType16Result', 'page-type16-result');
  renderers.renderType16Compatibility = wrap(original, 'renderType16Compatibility', 'page-type16-compat', (html) => replaceFirstHeroBadge(html, '相', '性'));
  renderers.renderType16RelationGuide = wrap(original, 'renderType16RelationGuide', 'page-relation-guide', (html) => replaceFirstHeroBadge(html, '相', '性'));

  return Object.fromEntries(Object.entries(renderers).filter(([, value]) => value));
}

module.exports = {
  VISUAL_REFRESH_VERSION,
  createVisualRefreshRenderers,
};
