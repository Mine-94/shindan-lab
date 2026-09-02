'use strict';

const baseRender = require('../views/render');
const quizzes = require('../data/quizzes');
const { STEM_KEYS } = require('../lib/fortune');
const { BLOOD_TYPES } = require('../lib/fortune');
const { createQualityRenderers } = require('../views/quality-render');
const { createType16Renderers } = require('../views/type16-render');
const { createType16ShareRenderers } = require('../views/type16-share-render');
const { createGrowthRenderers } = require('../views/growth-render');
const {
  CONTENT_DEPTH_VERSION,
  createAdsenseContentRenderers,
} = require('../views/adsense-content-render');
const {
  STEM_EDITORIAL,
  BLOOD_EDITORIAL,
  QUIZ_GUIDES,
} = require('../data/adsense-editorial');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, needle) {
  return String(text).split(needle).length - 1;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function mainTextLength(html) {
  const match = String(html).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return stripHtml(match ? match[1] : html).length;
}

function metaDescription(html) {
  const match = String(html).match(/<meta name="description" content="([^"]*)" \/>/);
  return match ? match[1] : '';
}

function buildRenderStack() {
  const qualityLayer = {
    ...baseRender,
    ...createQualityRenderers({ ...baseRender }),
  };
  const type16Layer = {
    ...qualityLayer,
    ...createType16Renderers({ ...qualityLayer }),
  };
  const shareLayer = {
    ...type16Layer,
    ...createType16ShareRenderers({ ...type16Layer }),
  };
  const growthLayer = {
    ...shareLayer,
    ...createGrowthRenderers({ ...shareLayer }),
  };
  return {
    ...growthLayer,
    ...createAdsenseContentRenderers({ ...growthLayer }),
  };
}

function assertUnique(values, label) {
  const unique = new Set(values);
  assert(unique.size === values.length, `${label} must be unique; got ${unique.size}/${values.length}`);
}

function main() {
  const render = buildRenderStack();

  const home = render.renderHome(quizzes, require('../data/fortune-tools'));
  assert(home.includes('data-content-depth="home-h1"'), 'Home H1 marker is missing');
  assert(home.includes('<h1 class="home-main-title"'), 'Home H1 is missing');
  assert(count(home, '<h1') === 1, 'Home should contain exactly one H1');
  assert(count(home, '/css/adsense-content.css') === 1, 'Home content-depth stylesheet is duplicated');

  const quizLengths = [];
  const quizLeads = [];
  for (const quiz of quizzes) {
    const guide = QUIZ_GUIDES[quiz.id];
    assert(guide, `Missing quiz guide: ${quiz.id}`);
    const html = render.renderQuizPage(quiz);
    assert(
      html.includes(`data-content-depth="quiz-${quiz.id}"`),
      `Quiz guide marker is missing: ${quiz.id}`
    );
    assert(html.includes(guide.heading), `Quiz guide heading is missing: ${quiz.id}`);
    assert(html.includes('答えるときのコツ'), `Quiz answer guidance is missing: ${quiz.id}`);
    assert(html.includes('結果が出たあとに試せること'), `Quiz result usage is missing: ${quiz.id}`);
    assert(html.includes(`${quiz.title}のよくある質問`), `Quiz FAQ is missing: ${quiz.id}`);
    for (const result of Object.values(quiz.results)) {
      assert(html.includes(result.title), `Quiz result preview is missing: ${quiz.id}/${result.title}`);
    }
    const length = mainTextLength(html);
    quizLengths.push(length);
    quizLeads.push(guide.lead);
    assert(length >= 850, `Quiz page remains too shallow for internal review: ${quiz.id} (${length})`);
    assert(count(html, '/css/adsense-content.css') === 1, `Quiz stylesheet duplicated: ${quiz.id}`);
  }
  assertUnique(quizLeads, 'Quiz guide leads');

  const stemThemes = [];
  for (const stemKey of STEM_KEYS) {
    const guide = STEM_EDITORIAL[stemKey];
    assert(guide, `Missing stem editorial: ${stemKey}`);
    const html = render.renderShichuuResult(stemKey);
    assert(
      html.includes(`data-content-depth="stem-${stemKey}"`),
      `Stem editorial marker is missing: ${stemKey}`
    );
    for (const marker of ['強みが出やすい場面', '仕事・学び', '人間関係', '同じ五行の陰陽との違い']) {
      assert(html.includes(marker), `Stem section ${marker} is missing: ${stemKey}`);
    }
    assert(metaDescription(html).length >= 55, `Stem meta description is short: ${stemKey}`);
    const length = mainTextLength(html);
    assert(length >= 750, `Stem result remains too shallow: ${stemKey} (${length})`);
    stemThemes.push(guide.theme);
  }
  assertUnique(stemThemes, 'Stem editorial themes');

  const bloodSummaries = [];
  for (const type of BLOOD_TYPES) {
    const guide = BLOOD_EDITORIAL[type];
    assert(guide, `Missing blood editorial: ${type}`);
    const html = render.renderKetsuekiResult(type, null);
    assert(
      html.includes(`data-content-depth="blood-${type}"`),
      `Blood editorial marker is missing: ${type}`
    );
    for (const marker of ['強みとして表れやすいところ', '疲れやすい場面と整え方', '伝わりやすくする一言']) {
      assert(html.includes(marker), `Blood section ${marker} is missing: ${type}`);
    }
    assert(metaDescription(html).length >= 55, `Blood meta description is short: ${type}`);
    const length = mainTextLength(html);
    assert(length >= 700, `Blood result remains too shallow: ${type} (${length})`);
    bloodSummaries.push(guide.summary);
  }
  assertUnique(bloodSummaries, 'Blood editorial summaries');

  const pair = render.renderKetsuekiResult('A', 'B');
  assert(!pair.includes('data-content-depth="blood-A"'), 'Pair page should not repeat the single-type editorial');
  assert(mainTextLength(pair) >= 700, 'Existing blood-pair page unexpectedly became shallow');

  const ketsueki = render.renderKetsuekiForm();
  assert(ketsueki.includes('data-content-depth="ketsueki-guide"'), 'Blood-type guide is missing');
  assert(ketsueki.includes('血液型占いをどう使う？'), 'Blood-type usage guide is missing');
  assert(ketsueki.includes('採用、人事評価、交際相手の選別'), 'Blood-type limitations are missing');
  assert(mainTextLength(ketsueki) >= 750, `Blood-type form remains too shallow (${mainTextLength(ketsueki)})`);

  const meimei = render.renderMeimeiForm();
  assert(meimei.includes('data-content-depth="meimei-guide"'), 'Name guide is missing');
  for (const marker of ['天格', '人格', '地格', '外格', '総格', '入力した名前と結果URLについて']) {
    assert(meimei.includes(marker), `Name guide is missing ${marker}`);
  }
  assert(meimei.includes('noindex'), 'Name-result index policy is not explained');
  assert(mainTextLength(meimei) >= 850, `Name form remains too shallow (${mainTextLength(meimei)})`);

  assert(CONTENT_DEPTH_VERSION === '2026-09-02-v1', 'Unexpected content-depth version');
  console.log(
    `PASS: home H1, ${quizzes.length} quiz guides, ${STEM_KEYS.length} stem guides, ${BLOOD_TYPES.length} blood guides, name and blood tool explanations validated.`
  );
  console.log(`PASS: internal rendered-depth targets met; quiz minimum ${Math.min(...quizLengths)} characters.`);
}

main();
