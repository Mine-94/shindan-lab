'use strict';

const assert = require('assert');
const {
  TYPE16_AXES,
  TYPE16_QUESTIONS,
  TYPE16_TYPES,
  TYPE16_CODES,
  TYPE16_RELATIONS,
  calculateCompatibility,
} = require('../data/type16');
const { createType16Renderers } = require('../views/type16-render');

assert.strictEqual(TYPE16_CODES.length, 16, 'Exactly 16 type codes are required');
assert.strictEqual(new Set(TYPE16_CODES).size, 16, 'Type codes must be unique');
assert.strictEqual(TYPE16_QUESTIONS.length, 20, 'The quick test must contain 20 questions');

const axisCounts = { EI: 0, SN: 0, TF: 0, JP: 0 };
for (const question of TYPE16_QUESTIONS) {
  assert(TYPE16_AXES[question.axis], `Unknown question axis: ${question.axis}`);
  assert.strictEqual(question.options.length, 2, 'Every question must have two options');
  axisCounts[question.axis] += 1;
  const allowed = [TYPE16_AXES[question.axis].left, TYPE16_AXES[question.axis].right];
  const poles = question.options.map((option) => option.pole).sort();
  assert.deepStrictEqual(poles, [...allowed].sort(), `Question must cover both poles: ${question.text}`);
}
assert.deepStrictEqual(axisCounts, { EI: 5, SN: 5, TF: 5, JP: 5 });

for (const code of TYPE16_CODES) {
  assert(/^[EI][SN][TF][JP]$/.test(code), `Invalid type code: ${code}`);
  const item = TYPE16_TYPES[code];
  assert.strictEqual(item.code, code);
  for (const key of [
    'name',
    'group',
    'emoji',
    'tagline',
    'summary',
    'love',
    'friendship',
    'work',
    'communication',
  ]) {
    assert(item[key], `${code} is missing ${key}`);
  }
  assert.strictEqual(item.strengths.length, 3, `${code} needs three strengths`);
  assert.strictEqual(item.cautions.length, 2, `${code} needs two cautions`);
}

for (const self of TYPE16_CODES) {
  for (const partner of TYPE16_CODES) {
    for (const relation of Object.keys(TYPE16_RELATIONS)) {
      const result = calculateCompatibility(self, partner, relation);
      assert(result, `Compatibility missing: ${self}/${partner}/${relation}`);
      assert(result.score >= 55 && result.score <= 92, 'Compatibility score out of range');
      assert.strictEqual(result.comparisons.length, 4);
      assert.strictEqual(result.sameCount + result.differentCount, 4);
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseLayout({ title, content }) {
  return `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body>${content}</body></html>`;
}

const renderers = createType16Renderers({
  SITE_URL: 'https://example.test',
  SITE_NAME: 'しんだんラボ',
  escapeHtml,
  baseLayout,
  siteHeaderNav: () => '<a href="/">しんだんラボ</a>',
  renderHome: () => `<!doctype html><html><head></head><body>
    <main class="container">
      <section class="content-section">
        <h2 class="section-title">占い</h2>
        <div class="quiz-grid"></div>
      </section>
      <section class="content-section">
        <h2 class="section-title">タイプ診断</h2>
        <div class="quiz-grid"></div>
      </section>
      <section class="info-card site-guide" aria-labelledby="about-shindan-lab"></section>
    </main>
  </body></html>`,
});

const home = renderers.renderHome([], []);
assert(home.includes('16タイプ・MBTI関連'));
assert(home.includes('/16type/compatibility'));
assert(home.includes('/css/type16.css'));
assert(
  home.indexOf('data-home-priority-version=') < home.indexOf('<h2 class="section-title">タイプ診断</h2>')
);
assert(
  home.indexOf('<h2 class="section-title">タイプ診断</h2>') <
    home.indexOf('<h2 class="section-title">占い</h2>')
);

const hub = renderers.renderType16Hub();
assert(hub.includes('16タイプ性格一覧'));
for (const code of TYPE16_CODES) {
  assert(hub.includes(`/16type/r/${code}`), `Hub link missing: ${code}`);
}

const testPage = renderers.renderType16Test();
assert(testPage.includes('window.__TYPE16_TEST__'));
assert(testPage.includes('/js/type16-test.js'));
assert(testPage.includes('公式MBTI®ではありません'));

const resultPage = renderers.renderType16Result('ENFP', { e: '80', s: '20', t: '20', j: '20' });
assert(resultPage.includes('ENFP'));
assert(resultPage.includes('可能性拡張タイプ'));
assert(resultPage.includes('今回の回答バランス'));
assert(resultPage.includes('恋愛で出やすい傾向'));

const compatibilityPage = renderers.renderType16Compatibility({
  self: 'ENFP',
  partner: 'ISTJ',
  relation: 'friend',
});
assert(compatibilityPage.includes('ENFP'));
assert(compatibilityPage.includes('ISTJ'));
assert(compatibilityPage.includes('友達の相性目安'));
assert(compatibilityPage.includes('noindex, follow'));

console.log('PASS: 16 types, 20 questions, 1,024 compatibility contexts and all renderers validated.');
