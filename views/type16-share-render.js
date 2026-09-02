'use strict';

const {
  TYPE16_AXES,
  TYPE16_CODES,
  TYPE16_RELATIONS,
  normalizeType16Code,
  normalizeRelation,
  getType16,
  calculateCompatibility,
} = require('../data/type16');

const SHARE_CARD_VERSION = '2026-09-02';

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

function insertBefore(html, anchor, block) {
  const index = html.indexOf(anchor);
  if (index === -1) throw new Error(`Missing share-card insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function withShareAssets(html, includeLinkShare) {
  let output = html;
  if (!output.includes('/css/type16-share.css')) {
    output = output.replace(
      '</head>',
      '<link rel="stylesheet" href="/css/type16-share.css" />\n</head>'
    );
  }

  const scripts = [];
  if (includeLinkShare && !output.includes('/js/result-share.js')) {
    scripts.push('<script src="/js/result-share.js"></script>');
  }
  if (!output.includes('/js/type16-share-card.js')) {
    scripts.push('<script src="/js/type16-share-card.js"></script>');
  }
  if (scripts.length) {
    output = output.replace('</body>', `${scripts.join('\n')}\n</body>`);
  }
  return output;
}

function parseAxisPercentages(query) {
  const keys = ['e', 's', 't', 'j'];
  const scores = {};
  for (const key of keys) {
    const value = Number.parseInt(query && query[key], 10);
    if (!Number.isInteger(value) || value < 0 || value > 100) return null;
    scores[key] = value;
  }
  return scores;
}

function typeScoreRows(scores) {
  if (!scores) return [];
  return [
    { axis: 'EI', left: 'E', leftPct: scores.e, right: 'I', rightPct: 100 - scores.e },
    { axis: 'SN', left: 'S', leftPct: scores.s, right: 'N', rightPct: 100 - scores.s },
    { axis: 'TF', left: 'T', leftPct: scores.t, right: 'F', rightPct: 100 - scores.t },
    { axis: 'JP', left: 'J', leftPct: scores.j, right: 'P', rightPct: 100 - scores.j },
  ];
}

function scoreQuery(scores) {
  if (!scores) return '';
  return `?e=${scores.e}&s=${scores.s}&t=${scores.t}&j=${scores.j}`;
}

function typePreview(type, scores, escapeHtml) {
  const scoreHtml = scores
    ? typeScoreRows(scores)
        .map(
          (row) => `
        <div class="type16-share-axis">
          <span>${row.left} ${row.leftPct}%</span>
          <i></i>
          <span>${row.rightPct}% ${row.right}</span>
        </div>`
        )
        .join('')
    : '<p class="type16-share-preview-note">20問の回答傾向から見る4文字タイプ</p>';

  return `
      <div class="type16-share-preview is-type" aria-label="${escapeHtml(
        `${type.code} ${type.name}の共有画像プレビュー`
      )}">
        <div class="type16-share-preview-topline">しんだんラボ / 16 TYPE RESULT</div>
        <div class="type16-share-preview-emoji">${type.emoji}</div>
        <strong class="type16-share-preview-code">${type.code}</strong>
        <h3>${escapeHtml(type.name)}</h3>
        <p>${escapeHtml(type.tagline)}</p>
        <div class="type16-share-preview-axes">${scoreHtml}</div>
        <small>公式MBTI®ではない独自のエンタメ診断</small>
      </div>`;
}

function compatibilityPreview(result, escapeHtml) {
  return `
      <div class="type16-share-preview is-compatibility" aria-label="${escapeHtml(
        `${result.selfType.code}と${result.partnerType.code}の共有画像プレビュー`
      )}">
        <div class="type16-share-preview-topline">しんだんラボ / COMPATIBILITY</div>
        <p class="type16-share-preview-relation">${escapeHtml(result.relationLabel)}の相性目安</p>
        <div class="type16-share-preview-pair">
          <div><span>${result.selfType.emoji}</span><strong>${result.selfType.code}</strong><small>${escapeHtml(
            result.selfType.name
          )}</small></div>
          <b>×</b>
          <div><span>${result.partnerType.emoji}</span><strong>${result.partnerType.code}</strong><small>${escapeHtml(
            result.partnerType.name
          )}</small></div>
        </div>
        <div class="type16-share-preview-score"><strong>${result.score}</strong><span>/100</span></div>
        <h3>${escapeHtml(result.relationLabel)}で大切にしたいこと</h3>
        <p>${escapeHtml(result.mainTip)}</p>
        <small>相性は関係の良し悪しを断定するものではありません</small>
      </div>`;
}

function typeSharePanel(type, scores, siteUrl, escapeHtml) {
  const shareUrl = `${siteUrl}/16type/r/${type.code}${scoreQuery(scores)}`;
  const shareText = `私の16タイプ簡易診断は「${type.code} ${type.name}」でした`;
  const payload = {
    version: SHARE_CARD_VERSION,
    kind: 'type',
    title: '16タイプ簡易診断 結果',
    code: type.code,
    name: type.name,
    emoji: type.emoji,
    tagline: type.tagline,
    axes: typeScoreRows(scores),
    url: shareUrl,
    shareText,
    filename: `shindan-lab-16type-${type.code}.png`,
  };

  return `
    <section class="type16-share-panel" data-type16-share data-type16-share-kind="type" data-type16-share-version="${SHARE_CARD_VERSION}">
      <div class="type16-share-copy">
        <p class="content-kicker">SHARE CARD</p>
        <h2>結果を4:5画像でシェア</h2>
        <p>Instagram・Threads・Xで見せやすい1080×1350pxの結果カードを、端末内で作成します。画像データはサーバーへ送信しません。</p>
      </div>
      ${typePreview(type, scores, escapeHtml)}
      <script type="application/json" class="type16-share-data">${safeInlineJson(payload)}</script>
      <div class="type16-share-actions">
        <button class="quiz-btn" type="button" data-type16-share-image>結果画像を作ってシェア</button>
        <button id="copy-link-btn" class="quiz-btn quiz-btn-outline" type="button" data-url="${escapeHtml(
          shareUrl
        )}" data-text="${escapeHtml(shareText)}">結果リンクをシェア</button>
      </div>
      <p class="type16-share-status" data-type16-share-status aria-live="polite"></p>
    </section>`;
}

function compatibilitySharePanel(result, siteUrl, escapeHtml) {
  const shareUrl = `${siteUrl}/16type/compatibility?self=${result.selfType.code}&partner=${result.partnerType.code}&relation=${result.relation}`;
  const payload = {
    version: SHARE_CARD_VERSION,
    kind: 'compatibility',
    title: `${result.relationLabel}の16タイプ相性`,
    self: {
      code: result.selfType.code,
      name: result.selfType.name,
      emoji: result.selfType.emoji,
    },
    partner: {
      code: result.partnerType.code,
      name: result.partnerType.name,
      emoji: result.partnerType.emoji,
    },
    relation: result.relation,
    relationLabel: result.relationLabel,
    score: result.score,
    label:
      result.score >= 84
        ? 'かなり噛み合いやすい'
        : result.score >= 78
          ? 'バランスを作りやすい'
          : result.score >= 72
            ? '違いを言葉にすると伸びる'
            : '丁寧なすり合わせが鍵',
    sameCount: result.sameCount,
    differentCount: result.differentCount,
    mainTip: result.mainTip,
    url: shareUrl,
    shareText: `16タイプ相性チェック：${result.selfType.code}×${result.partnerType.code}（${result.relationLabel}）`,
    filename: `shindan-lab-compatibility-${result.selfType.code}-${result.partnerType.code}-${result.relation}.png`,
  };

  return `
      <section class="type16-share-panel is-compatibility" data-type16-share data-type16-share-kind="compatibility" data-type16-share-version="${SHARE_CARD_VERSION}">
        <div class="type16-share-copy">
          <p class="content-kicker">SHARE CARD</p>
          <h2>二人の結果を画像でシェア</h2>
          <p>相性スコアだけでなく、関係の種類と会話のヒントを一枚にまとめます。画像は端末内で生成され、サーバーには保存されません。</p>
        </div>
        ${compatibilityPreview(result, escapeHtml)}
        <script type="application/json" class="type16-share-data">${safeInlineJson(payload)}</script>
        <div class="type16-share-actions">
          <button class="quiz-btn" type="button" data-type16-share-image>相性画像を作ってシェア</button>
        </div>
        <p class="type16-share-status" data-type16-share-status aria-live="polite"></p>
      </section>`;
}

function createType16ShareRenderers(original) {
  if (!original || typeof original.renderType16Result !== 'function') {
    throw new TypeError('renderType16Result is required before enabling share cards');
  }
  if (typeof original.renderType16Compatibility !== 'function') {
    throw new TypeError('renderType16Compatibility is required before enabling share cards');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;
  const siteUrl = original.SITE_URL;

  function renderType16Result(typeValue, query = {}) {
    const code = normalizeType16Code(typeValue);
    const type = getType16(code);
    if (!type) return original.renderType16Result(typeValue, query);

    const scores = parseAxisPercentages(query);
    let html = original.renderType16Result(code, query);
    html = insertBefore(
      html,
      '<div class="type16-detail-grid">',
      typeSharePanel(type, scores, siteUrl, escapeHtml)
    );
    return withShareAssets(html, true);
  }

  function renderType16Compatibility(query = {}) {
    const selfCode = normalizeType16Code(query.self);
    const partnerCode = normalizeType16Code(query.partner);
    const relation = normalizeRelation(query.relation);
    const result = calculateCompatibility(selfCode, partnerCode, relation);
    let html = original.renderType16Compatibility(query);

    if (!result || !TYPE16_CODES.includes(selfCode) || !TYPE16_CODES.includes(partnerCode)) {
      return html;
    }

    html = insertBefore(
      html,
      '<div class="result-actions">',
      compatibilitySharePanel(result, siteUrl, escapeHtml)
    );
    return withShareAssets(html, false);
  }

  return {
    renderType16Result,
    renderType16Compatibility,
  };
}

module.exports = {
  SHARE_CARD_VERSION,
  createType16ShareRenderers,
};
