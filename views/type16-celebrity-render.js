'use strict';

const { TYPE16_CODES, getType16 } = require('../data/type16');
const {
  VERIFIED_AT,
  TYPE16_CELEBRITIES,
  getType16Celebrities,
} = require('../data/type16-celebrities');

const CELEBRITY_PRIORITY = Object.freeze([
  'JENNIE',
  'JISOO',
  'LISA',
  'ROSÉ',
  'RM',
  'JIN',
  'SUGA',
  'j-hope',
  'JIMIN',
  'V',
  'JUNG KOOK',
  'G-DRAGON',
  'TAEYANG',
  'D-LITE',
  '北川景子',
  '広瀬すず',
  '大西流星',
  '道枝駿佑',
  '高橋恭平',
  '藤田ニコル',
  '永瀬廉',
  '佐々木舞香',
  '齊藤なぎさ',
  '池田瑛紗',
]);

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

function insertAfterFirst(html, anchor, block) {
  const index = String(html).indexOf(anchor);
  if (index === -1) throw new Error(`Missing celebrity insertion anchor: ${anchor}`);
  const insertAt = index + anchor.length;
  return `${html.slice(0, insertAt)}\n${block}${html.slice(insertAt)}`;
}

function replaceMetadata(html, title, description, escapeHtml) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  let output = String(html).replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`);
  output = output.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapedDescription}" />`
  );
  output = output.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapedTitle}" />`
  );
  output = output.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapedDescription}" />`
  );
  output = output.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`
  );
  output = output.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapedDescription}" />`
  );
  return output;
}

function withCelebrityMetadata(html, type, celebrities, escapeHtml) {
  const names = celebrities.map((person) => person.name).join('、');
  const title = `${type.code}の有名人・芸能人｜性格・恋愛・仕事の16タイプ解説`;
  const description = `${type.code}「${type.name}」の性格、恋愛、友達、仕事の傾向と、${names}など同じタイプとして公表された有名人を紹介。公式MBTI®とは別の非公式16タイプ情報です。`;
  return replaceMetadata(html, title, description, escapeHtml);
}

function withHubMetadata(html, escapeHtml) {
  return replaceMetadata(
    html,
    '16タイプ性格一覧・有名人｜BTS・BLACKPINK・無料診断',
    '16タイプの性格一覧と、BTS・BIGBANG・BLACKPINK・日本の俳優やアイドルを含む公表済み有名人48人を一つの一覧で紹介。名前・グループ名・タイプから探せます。公式MBTI®とは別の非公式情報です。',
    escapeHtml
  );
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

function sortedCelebrityDirectory() {
  const priority = new Map(CELEBRITY_PRIORITY.map((name, index) => [name, index]));
  const entries = TYPE16_CODES.flatMap((typeCode) =>
    (TYPE16_CELEBRITIES[typeCode] || []).map((person) => ({ ...person, typeCode }))
  );

  return entries.sort((left, right) => {
    const leftPriority = priority.has(left.name) ? priority.get(left.name) : Number.MAX_SAFE_INTEGER;
    const rightPriority = priority.has(right.name) ? priority.get(right.name) : Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return `${left.affiliation}-${left.name}`.localeCompare(`${right.affiliation}-${right.name}`, 'ja');
  });
}

function celebrityResultCardHtml(typeCode, person, escapeHtml) {
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
}

function celebritySectionHtml(typeCode, celebrities, escapeHtml) {
  const cards = celebrities
    .map((person) => celebrityResultCardHtml(typeCode, person, escapeHtml))
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

function celebrityDirectoryCardHtml(entry, escapeHtml) {
  const sourceUrl = safeHttpsUrl(entry.sourceUrl);
  if (!sourceUrl) throw new Error(`Invalid celebrity source URL: ${entry.name}`);
  const searchText = `${entry.name} ${entry.affiliation} ${entry.typeCode}`.normalize('NFKC').toLowerCase();
  return `
        <article class="type16-celebrity-directory-card" data-celebrity-directory-entry data-search-text="${escapeHtml(
          searchText
        )}">
          <a class="type16-celebrity-directory-main" href="/16type/r/${escapeHtml(
            entry.typeCode
          )}" data-type16-celebrity-profile data-celebrity-name="${escapeHtml(
            entry.name
          )}" data-type-code="${escapeHtml(entry.typeCode)}">
            <div class="type16-celebrity-visual" aria-hidden="true"><span>${escapeHtml(
              entry.visual
            )}</span></div>
            <div class="type16-celebrity-directory-copy">
              <span class="type16-celebrity-type">${escapeHtml(entry.typeCode)}</span>
              <h3>${escapeHtml(entry.name)}</h3>
              <p>${escapeHtml(entry.affiliation)}</p>
            </div>
          </a>
          <a class="type16-celebrity-directory-source" href="${escapeHtml(
            sourceUrl
          )}" target="_blank" rel="nofollow noopener noreferrer" data-type16-celebrity-source data-celebrity-name="${escapeHtml(
            entry.name
          )}" data-type-code="${escapeHtml(entry.typeCode)}">公表情報</a>
        </article>`;
}

function celebrityDirectoryHtml(escapeHtml) {
  const entries = sortedCelebrityDirectory();
  const cards = entries.map((entry) => celebrityDirectoryCardHtml(entry, escapeHtml)).join('');
  return `
    <section class="info-card type16-celebrity-directory" id="celebrity-directory" data-type16-celebrity-directory data-celebrity-count="${entries.length}" aria-labelledby="celebrity-directory-title">
      <p class="content-kicker">FIND YOUR OSHI</p>
      <h2 id="celebrity-directory-title">推し・有名人から16タイプを探す</h2>
      <p>BTS、BIGBANG、BLACKPINK、日本の俳優・アイドルなど、本人または公式コンテンツで4文字タイプが公表された人物を一つの一覧にまとめました。国や活動分野では分けず、名前・グループ名・タイプから探せます。</p>
      <div class="type16-celebrity-search">
        <label for="type16-celebrity-search-input">名前・グループ名・4文字タイプで検索</label>
        <input id="type16-celebrity-search-input" type="search" inputmode="search" autocomplete="off" placeholder="例：BTS、BLACKPINK、北川景子、ISFP" data-type16-celebrity-search />
        <p class="type16-celebrity-search-status" data-type16-celebrity-search-status aria-live="polite">${entries.length}人を掲載</p>
      </div>
      <div class="type16-celebrity-directory-grid is-collapsed" data-type16-celebrity-directory-grid>${cards}</div>
      <p class="type16-celebrity-empty" data-type16-celebrity-empty hidden>該当する人物は見つかりませんでした。表記を変えるか、4文字タイプで検索してください。</p>
      <button class="type16-celebrity-toggle" type="button" data-type16-celebrity-toggle aria-expanded="false">48人をすべて見る</button>
      <div class="type16-celebrity-directory-actions">
        <a class="quiz-btn" href="/16type/test">自分の16タイプを診断する</a>
        <a class="quiz-btn quiz-btn-outline" href="/16type/compatibility">推し・友達との相性を見る</a>
      </div>
      <p class="small-note">同じ4文字タイプでも性格や価値観が同じという意味ではありません。タイプは再診断や公表時期によって変わることがあります。掲載情報の最終確認：${escapeHtml(
        formatJapaneseDate(VERIFIED_AT)
      )}</p>
    </section>`;
}

function homeCelebrityTeaserHtml() {
  return `
    <section class="type16-celebrity-home-teaser" data-type16-celebrity-home-teaser aria-labelledby="celebrity-home-title">
      <div>
        <p class="content-kicker">FIND YOUR OSHI</p>
        <h2 id="celebrity-home-title">推し・有名人から16タイプを探す</h2>
        <p>BTS、BIGBANG、BLACKPINK、日本の俳優・アイドルを含む48人を、カテゴリー分けせず一つの一覧から探せます。</p>
      </div>
      <a class="quiz-btn" href="/16type#celebrity-directory" data-type16-celebrity-directory-cta>有名人一覧を見る →</a>
    </section>`;
}

function createType16CelebrityRenderers(original) {
  if (!original || typeof original.renderType16Result !== 'function') {
    throw new TypeError('Original type16 result renderer is required');
  }
  if (typeof original.renderType16Hub !== 'function' || typeof original.renderHome !== 'function') {
    throw new TypeError('Original home and type16 hub renderers are required');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;

  function renderHome(quizzes, fortuneTools) {
    let html = original.renderHome(quizzes, fortuneTools);
    html = insertAfterFirst(
      html,
      '<script src="/js/home-priority.js"></script>',
      homeCelebrityTeaserHtml()
    );
    return withCelebrityAssets(html);
  }

  function renderType16Hub() {
    let html = original.renderType16Hub();
    html = insertBeforeFirst(
      html,
      '<aside class="type16-disclaimer">',
      `${celebrityDirectoryHtml(escapeHtml)}\n\n    `
    );
    html = withHubMetadata(html, escapeHtml);
    return withCelebrityAssets(html);
  }

  function renderType16Result(typeValue, query = {}) {
    const typeCode = String(typeValue || '').trim().toUpperCase();
    const type = getType16(typeCode);
    const celebrities = getType16Celebrities(typeCode);
    let html = original.renderType16Result(typeValue, query);
    if (!type || !celebrities.length) return html;

    const anchor = '<section class="info-card">\n      <h2>関連する診断</h2>';
    html = insertBeforeFirst(
      html,
      anchor,
      `${celebritySectionHtml(typeCode, celebrities, escapeHtml)}\n\n    `
    );
    html = withCelebrityMetadata(html, type, celebrities, escapeHtml);
    return withCelebrityAssets(html);
  }

  return { renderHome, renderType16Hub, renderType16Result };
}

module.exports = {
  createType16CelebrityRenderers,
};
