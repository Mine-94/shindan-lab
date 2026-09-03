'use strict';

const { VERIFIED_AT, getType16Celebrities } = require('../data/type16-celebrities');

function fallbackEscapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch (_error) {
    return '';
  }
}

function formatJapaneseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return String(value);
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

function insertBeforeFirst(html, anchor, block) {
  const index = String(html).indexOf(anchor);
  if (index === -1) throw new Error(`Missing celebrity insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function withCelebrityAssets(html) {
  let output = String(html);
  if (!output.includes('/css/type16-celebrities.css')) {
    output = output.replace(
      '</head>',
      '<link rel="stylesheet" href="/css/type16-celebrities.css" />\n</head>'
    );
  }
  if (!output.includes('/js/type16-celebrities.js')) {
    output = output.replace(
      '</body>',
      '<script src="/js/type16-celebrities.js"></script>\n</body>'
    );
  }
  return output;
}

function celebritySectionHtml(typeCode, celebrities, escapeHtml) {
  const cards = celebrities
    .map((person) => {
      const sourceUrl = safeHttpsUrl(person.sourceUrl);
      if (!sourceUrl) throw new Error(`Invalid celebrity source URL: ${person.name}`);
      return `
        <article class="type16-celebrity-card">
          <div class="type16-celebrity-visual" aria-hidden="true">
            <span>${escapeHtml(person.visual)}</span>
          </div>
          <div class="type16-celebrity-copy">
            <h3>${escapeHtml(person.name)}</h3>
            <p>${escapeHtml(person.affiliation)}</p>
            <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="nofollow noopener noreferrer" data-type16-celebrity-source data-celebrity-name="${escapeHtml(person.name)}" data-type-code="${escapeHtml(typeCode)}">公表情報を確認</a>
          </div>
        </article>`;
    })
    .join('');

  return `
    <section class="info-card type16-celebrity-section" data-type16-celebrity-section data-type-code="${escapeHtml(
      typeCode
    )}" data-celebrity-count="${celebrities.length}" aria-labelledby="same-type-celebrities-${escapeHtml(
      typeCode
    )}">
      <p class="content-kicker">SAME TYPE</p>
      <h2 id="same-type-celebrities-${escapeHtml(typeCode)}">あなたと同じ${escapeHtml(
        typeCode
      )}タイプとして公表された有名人</h2>
      <p>本人または公式コンテンツで4文字タイプが公表されたことを確認できる人物を、国や活動分野で分けずに一つの一覧で紹介しています。</p>
      <div class="type16-celebrity-grid">${cards}</div>
      <p class="small-note">同じ4文字タイプでも、性格・価値観・生き方が同じという意味ではありません。タイプは再診断や公表時期によって変わることがあります。掲載情報の最終確認：${escapeHtml(
        formatJapaneseDate(VERIFIED_AT)
      )}</p>
    </section>`;
}

function createType16CelebrityRenderers(original) {
  if (!original || typeof original.renderType16Result !== 'function') {
    throw new TypeError('Original type16 result renderer is required');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;

  function renderType16Result(typeValue, query = {}) {
    const typeCode = String(typeValue || '').trim().toUpperCase();
    const celebrities = getType16Celebrities(typeCode);
    let html = original.renderType16Result(typeValue, query);
    if (!celebrities.length) return html;

    const anchor = '<section class="info-card">\n      <h2>関連する診断</h2>';
    html = insertBeforeFirst(
      html,
      anchor,
      `${celebritySectionHtml(typeCode, celebrities, escapeHtml)}\n\n    `
    );
    return withCelebrityAssets(html);
  }

  return { renderType16Result };
}

module.exports = {
  createType16CelebrityRenderers,
};
