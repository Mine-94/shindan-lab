'use strict';

const {
  STEM_EDITORIAL,
  BLOOD_EDITORIAL,
  QUIZ_GUIDES,
  MEIMEI_GUIDE,
  KETSUEKI_GUIDE,
} = require('../data/adsense-editorial');

const CONTENT_DEPTH_VERSION = '2026-09-02-v1';

function fallbackEscapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function insertBeforeLast(html, anchor, block) {
  const index = String(html).lastIndexOf(anchor);
  if (index === -1) throw new Error(`Missing content-depth insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function insertBeforeFirst(html, anchor, block) {
  const index = String(html).indexOf(anchor);
  if (index === -1) throw new Error(`Missing content-depth insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function withContentDepthStyles(html) {
  if (String(html).includes('/css/adsense-content.css')) return html;
  return String(html).replace(
    '</head>',
    '<link rel="stylesheet" href="/css/adsense-content.css" />\n</head>'
  );
}

function replaceDescriptions(html, description, escapeHtml) {
  const escaped = escapeHtml(description);
  let output = String(html);
  output = output.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escaped}" />`
  );
  output = output.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escaped}" />`
  );
  output = output.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escaped}" />`
  );
  return output;
}

function listHtml(items, escapeHtml, className = 'editorial-list') {
  return `<ul class="${className}">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function definitionCards(items, escapeHtml) {
  return `<div class="editorial-definition-grid">${items
    .map(
      ([title, body]) => `
      <article class="editorial-definition-card">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </article>`
    )
    .join('')}</div>`;
}

function faqHtml(items, escapeHtml) {
  return `<div class="faq-list editorial-faq">${items
    .map(
      ([question, answer]) => `
      <details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`
    )
    .join('')}</div>`;
}

function quizGuideHtml(quiz, guide, escapeHtml) {
  const resultCards = Object.values(quiz.results)
    .map(
      (result) => `
      <article class="editorial-result-preview">
        <span aria-hidden="true">${result.emoji || '🔎'}</span>
        <div>
          <h3>${escapeHtml(result.title)}</h3>
          <p>${escapeHtml(result.desc)}</p>
        </div>
      </article>`
    )
    .join('');

  return `
    <section class="info-card editorial-depth-block" data-content-depth="quiz-${escapeHtml(
      quiz.id
    )}" data-content-depth-version="${CONTENT_DEPTH_VERSION}">
      <p class="content-kicker">BEFORE YOU START</p>
      <h2>${escapeHtml(guide.heading)}</h2>
      <p>${escapeHtml(guide.lead)}</p>

      <h3>この診断で考える4つの場面</h3>
      ${listHtml(guide.situations, escapeHtml)}

      <h3>答えるときのコツ</h3>
      <p>${escapeHtml(guide.answerTip)}</p>

      <h3>表示される結果</h3>
      <div class="editorial-result-grid">${resultCards}</div>

      <h3>結果が出たあとに試せること</h3>
      <p>${escapeHtml(guide.after)}</p>
    </section>

    <section class="info-card editorial-depth-block" aria-labelledby="quiz-faq-${escapeHtml(
      quiz.id
    )}">
      <p class="content-kicker">FAQ</p>
      <h2 id="quiz-faq-${escapeHtml(quiz.id)}">${escapeHtml(quiz.title)}のよくある質問</h2>
      ${faqHtml(guide.faq, escapeHtml)}
    </section>`;
}

function stemGuideHtml(stemKey, stem, guide, escapeHtml) {
  return `
    <section class="info-card editorial-depth-block stem-editorial" data-content-depth="stem-${escapeHtml(
      stemKey
    )}" data-content-depth-version="${CONTENT_DEPTH_VERSION}">
      <p class="content-kicker">DEEPER GUIDE</p>
      <h2>${escapeHtml(stem.title)}を日常で読むと</h2>
      <p>${escapeHtml(guide.theme)}</p>

      <h3>強みが出やすい場面</h3>
      ${listHtml(guide.strengths, escapeHtml)}

      <div class="editorial-two-column">
        <article>
          <h3>仕事・学び</h3>
          <p>${escapeHtml(guide.work)}</p>
        </article>
        <article>
          <h3>人間関係</h3>
          <p>${escapeHtml(guide.relationships)}</p>
        </article>
      </div>

      <h3>偏りを感じたときの整え方</h3>
      <p>${escapeHtml(guide.balance)}</p>

      <h3>同じ五行の陰陽との違い</h3>
      <p>${escapeHtml(guide.contrast)}</p>
      <p class="small-note">このページは生まれ年の年柱だけを見る簡易版です。月柱・日柱・時柱、出生時刻、節入りまで含める本格的な四柱推命とは結果の範囲が異なります。</p>
    </section>`;
}

function bloodGuideHtml(type, blood, guide, escapeHtml) {
  return `
    <section class="info-card editorial-depth-block blood-editorial" data-content-depth="blood-${escapeHtml(
      type
    )}" data-content-depth-version="${CONTENT_DEPTH_VERSION}">
      <p class="content-kicker">DEEPER GUIDE</p>
      <h2>${escapeHtml(blood.title)}の傾向をもう少し詳しく</h2>
      <p>${escapeHtml(guide.summary)}</p>

      <h3>強みとして表れやすいところ</h3>
      ${listHtml(guide.strengths, escapeHtml)}

      <div class="editorial-two-column">
        <article>
          <h3>疲れやすい場面と整え方</h3>
          <p>${escapeHtml(guide.stress)}</p>
        </article>
        <article>
          <h3>恋愛・友達との付き合い方</h3>
          <p>${escapeHtml(guide.relationships)}</p>
        </article>
      </div>

      <h3>伝わりやすくする一言</h3>
      <p>${escapeHtml(guide.communication)}</p>
      <p class="small-note">血液型と性格の関連性は科学的に証明されていません。医療情報や能力判定ではなく、日本で親しまれてきた会話用のエンタメとしてお読みください。</p>
    </section>`;
}

function meimeiGuideHtml(escapeHtml) {
  return `
    <section class="info-card editorial-depth-block" data-content-depth="meimei-guide" data-content-depth-version="${CONTENT_DEPTH_VERSION}">
      <p class="content-kicker">HOW IT WORKS</p>
      <h2>この姓名判断の計算方法</h2>
      <p>${escapeHtml(MEIMEI_GUIDE.intro)}</p>

      <h3>五格で見る5つの区分</h3>
      ${definitionCards(MEIMEI_GUIDE.grids, escapeHtml)}

      <h3>結果を確認する順番</h3>
      ${listHtml(MEIMEI_GUIDE.howTo, escapeHtml)}

      <h3>入力した名前と結果URLについて</h3>
      <p>${escapeHtml(MEIMEI_GUIDE.privacy)}</p>
    </section>

    <section class="info-card editorial-depth-block" aria-labelledby="meimei-faq">
      <p class="content-kicker">FAQ</p>
      <h2 id="meimei-faq">姓名判断についてよくある質問</h2>
      ${faqHtml(MEIMEI_GUIDE.faq, escapeHtml)}
    </section>`;
}

function ketsuekiGuideHtml(escapeHtml) {
  return `
    <section class="info-card editorial-depth-block" data-content-depth="ketsueki-guide" data-content-depth-version="${CONTENT_DEPTH_VERSION}">
      <p class="content-kicker">GUIDE</p>
      <h2>血液型占いをどう使う？</h2>
      <p>${escapeHtml(KETSUEKI_GUIDE.lead)}</p>
      ${definitionCards(KETSUEKI_GUIDE.uses, escapeHtml)}

      <h3>結果を読むときの注意</h3>
      <p>${escapeHtml(KETSUEKI_GUIDE.cautions)}</p>
    </section>

    <section class="info-card editorial-depth-block" aria-labelledby="ketsueki-faq">
      <p class="content-kicker">FAQ</p>
      <h2 id="ketsueki-faq">血液型占いについてよくある質問</h2>
      ${faqHtml(KETSUEKI_GUIDE.faq, escapeHtml)}
    </section>`;
}

function addHomeH1(html) {
  if (String(html).includes('data-content-depth="home-h1"')) return html;
  return insertBeforeFirst(
    html,
    '<p class="tagline">',
    `<h1 class="home-main-title" data-content-depth="home-h1" data-content-depth-version="${CONTENT_DEPTH_VERSION}">無料の性格診断・16タイプ相性・占いをまとめて楽しむ</h1>`
  );
}

function createAdsenseContentRenderers(original) {
  if (!original || typeof original.renderHome !== 'function') {
    throw new TypeError('Original render module is required');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;

  function renderHome(quizzes, fortuneTools) {
    return withContentDepthStyles(addHomeH1(original.renderHome(quizzes, fortuneTools)));
  }

  function renderQuizPage(quiz) {
    const guide = QUIZ_GUIDES[quiz && quiz.id];
    let html = original.renderQuizPage(quiz);
    if (!guide) return html;
    html = insertBeforeLast(html, '</main>', `${quizGuideHtml(quiz, guide, escapeHtml)}\n  `);
    return withContentDepthStyles(html);
  }

  function renderShichuuResult(stemKey) {
    const guide = STEM_EDITORIAL[stemKey];
    const stem = require('../data/fortune-content').STEM_CONTENT[stemKey];
    let html = original.renderShichuuResult(stemKey);
    if (!guide || !stem) return html;
    html = insertBeforeLast(html, '</main>', `${stemGuideHtml(stemKey, stem, guide, escapeHtml)}\n  `);
    html = replaceDescriptions(html, guide.meta, escapeHtml);
    return withContentDepthStyles(html);
  }

  function renderKetsuekiForm() {
    let html = original.renderKetsuekiForm();
    html = insertBeforeLast(html, '</main>', `${ketsuekiGuideHtml(escapeHtml)}\n  `);
    return withContentDepthStyles(html);
  }

  function renderKetsuekiResult(type, partnerType) {
    let html = original.renderKetsuekiResult(type, partnerType);
    if (partnerType) return html;
    const guide = BLOOD_EDITORIAL[type];
    const blood = require('../data/fortune-content').BLOOD_CONTENT[type];
    if (!guide || !blood) return html;
    html = insertBeforeLast(html, '</main>', `${bloodGuideHtml(type, blood, guide, escapeHtml)}\n  `);
    html = replaceDescriptions(html, guide.meta, escapeHtml);
    return withContentDepthStyles(html);
  }

  function renderMeimeiForm(errorMessage) {
    let html = original.renderMeimeiForm(errorMessage);
    html = insertBeforeLast(html, '</main>', `${meimeiGuideHtml(escapeHtml)}\n  `);
    return withContentDepthStyles(html);
  }

  return {
    renderHome,
    renderQuizPage,
    renderShichuuResult,
    renderKetsuekiForm,
    renderKetsuekiResult,
    renderMeimeiForm,
  };
}

module.exports = {
  CONTENT_DEPTH_VERSION,
  createAdsenseContentRenderers,
};
