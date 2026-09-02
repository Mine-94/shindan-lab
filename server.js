// Release marker: Japanese acquisition loop 2026-09-02-v2
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const quizzes = require('./data/quizzes');
const fortuneTools = require('./data/fortune-tools');
const { STEM_KEYS, BLOOD_TYPES, calcShichuuStem, calcSeimeiHandan } = require('./lib/fortune');
const { allMeimeiCombos } = require('./data/seo-longtail');
const { TYPE16_CODES, normalizeType16Code } = require('./data/type16');
const originalRender = require('./views/render');
const { createQualityRenderers } = require('./views/quality-render');
Object.assign(originalRender, createQualityRenderers({ ...originalRender }));
const { createType16Renderers } = require('./views/type16-render');
Object.assign(originalRender, createType16Renderers({ ...originalRender }));
const { createType16ShareRenderers } = require('./views/type16-share-render');
Object.assign(originalRender, createType16ShareRenderers({ ...originalRender }));
const { createGrowthRenderers } = require('./views/growth-render');
Object.assign(originalRender, createGrowthRenderers({ ...originalRender }));
const {
  renderHome,
  renderQuizPage,
  renderResultPage,
  renderShichuuForm,
  renderShichuuResult,
  renderKetsuekiForm,
  renderKetsuekiResult,
  renderMeimeiForm,
  renderMeimeiResult,
  renderType16Hub,
  renderType16Test,
  renderType16Result,
  renderType16Compatibility,
  renderType16RelationGuide,
  SITE_URL,
} = originalRender;

const app = express();
const PORT = process.env.PORT || 3000;
const ADSENSE_PUBLISHER_ID = (process.env.ADSENSE_CLIENT_ID || 'ca-pub-8602848692420724').replace(/^ca-/, '');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 静的リソース(css/js)もこのリミッターを通過するため、1ページ閲覧だけで複数リクエストを消費します。
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

// AdSenseの販売者情報をルート直下のtext/plainで返します。
// catch-allリダイレクトより先に定義しないと、Googleが確認できません。
app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`);
});

function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

// --- ホーム ---
app.get('/', (req, res) => {
  res.send(renderHome(quizzes, fortuneTools));
});

// --- SEO: robots.txt / sitemap.xml ---
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const staticPaths = [
    '/',
    '/shichuu',
    '/ketsueki',
    '/meimei',
    ...quizzes.map((q) => `/q/${q.id}`),
    '/16type',
    '/16type/test',
    '/16type/compatibility',
    '/16type/love',
    '/16type/friend',
    '/16type/work',
    '/16type/family',
    ...TYPE16_CODES.map((code) => `/16type/r/${code}`),
    '/about.html',
    '/editorial-policy.html',
    '/privacy.html',
    '/terms.html',
  ];

  // 十干タイプ診断: /shichuu/r/:stemKey (10件) — 既存ルートだが従来sitemapから漏れていた
  const shichuuPaths = STEM_KEYS.map((k) => `/shichuu/r/${k}`);

  // 血液型占い: 単独4件 + 重複を除いた組み合わせ10件
  // A-B と B-A のような逆順URLは同じ検索意図のため、canonical順のURLだけをsitemapに載せます。
  const ketsuekiSinglePaths = BLOOD_TYPES.map((t) => `/ketsueki/r/${t}`);
  const ketsuekiPairPaths = [];
  BLOOD_TYPES.forEach((t, index) => {
    BLOOD_TYPES.slice(index).forEach((partner) => {
      ketsuekiPairPaths.push(`/ketsueki/r/${t}/${partner}`);
    });
  });

  // 姓名判断ロングテール: 人気の姓×名の組合せ + 有名人（52件、data/seo-longtail.js参照）
  const meimeiPaths = allMeimeiCombos().map(
    ({ sei, mei }) => `/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}`
  );

  const allPaths = [
    ...staticPaths,
    ...shichuuPaths,
    ...ketsuekiSinglePaths,
    ...ketsuekiPairPaths,
    ...meimeiPaths,
  ];

  const urls = allPaths
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)
    .join('\n');
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// --- タイプ診断（選択式クイズ） ---
app.get('/q/:id', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz) return res.redirect('/');
  res.send(renderQuizPage(quiz));
});

app.get('/q/:id/r/:resultKey', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz || !quiz.results[req.params.resultKey]) return res.redirect('/');
  // タイプ+スコア結合型: クライアントで計算した「一致率」(?s=0~100)があれば結果と一緒に表示。
  // 値がない・範囲外の場合は静かに無視し、従来通りにレンダリング(canonical URLはそのまま維持)。
  const scoreRaw = parseInt(req.query.s, 10);
  const matchScore = Number.isInteger(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 100 ? scoreRaw : null;
  res.send(renderResultPage(quiz, req.params.resultKey, matchScore));
});

// --- 16タイプ診断・相性チェック（公式MBTIとは別の独自コンテンツ） ---
app.get('/16type', (req, res) => {
  res.send(renderType16Hub());
});

app.get('/16type/test', (req, res) => {
  res.send(renderType16Test(req.query));
});

app.get('/16type/love', (req, res) => {
  res.send(renderType16RelationGuide('love'));
});

app.get('/16type/friend', (req, res) => {
  res.send(renderType16RelationGuide('friend'));
});

app.get('/16type/work', (req, res) => {
  res.send(renderType16RelationGuide('work'));
});

app.get('/16type/family', (req, res) => {
  res.send(renderType16RelationGuide('family'));
});

app.get('/16type/r/:code', (req, res) => {
  const code = normalizeType16Code(req.params.code);
  if (!TYPE16_CODES.includes(code)) return res.redirect('/16type');
  res.send(renderType16Result(code, req.query));
});

app.get('/16type/compatibility', (req, res) => {
  res.send(renderType16Compatibility(req.query));
});

// --- 簡易四柱推命（十干タイプ診断） ---
app.get('/shichuu', (req, res) => {
  res.send(renderShichuuForm());
});

app.get('/shichuu/compute', (req, res) => {
  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10);
  const day = parseInt(req.query.day, 10);

  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (
    !Number.isInteger(year) || year < 1900 || year > 2026 ||
    !Number.isInteger(month) || month < 1 || month > 12 ||
    !Number.isInteger(day) || day < 1 || day > 31 ||
    !isRealDate
  ) {
    return res.redirect('/shichuu');
  }

  const { stemKey } = calcShichuuStem(year, month, day);
  res.redirect(`/shichuu/r/${stemKey}`);
});

app.get('/shichuu/r/:stemKey', (req, res) => {
  if (!STEM_KEYS.includes(req.params.stemKey)) return res.redirect('/shichuu');
  res.send(renderShichuuResult(req.params.stemKey));
});

// --- 血液型占い ---
app.get('/ketsueki', (req, res) => {
  res.send(renderKetsuekiForm());
});

function canonicalBloodPair(type, partner) {
  const typeIndex = BLOOD_TYPES.indexOf(type);
  const partnerIndex = BLOOD_TYPES.indexOf(partner);
  return typeIndex <= partnerIndex ? [type, partner] : [partner, type];
}

app.get('/ketsueki/compute', (req, res) => {
  const type = String(req.query.type || '').toUpperCase();
  const partner = String(req.query.partner || '').toUpperCase();

  if (!BLOOD_TYPES.includes(type)) return res.redirect('/ketsueki');

  if (partner && BLOOD_TYPES.includes(partner)) {
    const [first, second] = canonicalBloodPair(type, partner);
    return res.redirect(`/ketsueki/r/${first}/${second}`);
  }
  res.redirect(`/ketsueki/r/${type}`);
});

app.get('/ketsueki/r/:type', (req, res) => {
  const type = req.params.type.toUpperCase();
  if (!BLOOD_TYPES.includes(type)) return res.redirect('/ketsueki');
  res.send(renderKetsuekiResult(type, null));
});

app.get('/ketsueki/r/:type/:partner', (req, res) => {
  const type = req.params.type.toUpperCase();
  const partner = req.params.partner.toUpperCase();
  if (!BLOOD_TYPES.includes(type) || !BLOOD_TYPES.includes(partner)) return res.redirect('/ketsueki');

  const [first, second] = canonicalBloodPair(type, partner);
  if (type !== first || partner !== second) {
    return res.redirect(301, `/ketsueki/r/${first}/${second}`);
  }

  res.send(renderKetsuekiResult(first, second));
});

// --- 姓名判断 ---
app.get('/meimei', (req, res) => {
  res.send(renderMeimeiForm());
});

app.get('/meimei/result', (req, res) => {
  const sei = String(req.query.sei || '').trim();
  const mei = String(req.query.mei || '').trim();
  if (!sei || !mei) return res.redirect('/meimei');
  res.redirect(`/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}`);
});

app.get('/meimei/r/:sei/:mei', (req, res) => {
  const sei = decodeURIComponent(req.params.sei);
  const mei = decodeURIComponent(req.params.mei);
  const calcResult = calcSeimeiHandan(sei, mei);
  res.send(renderMeimeiResult(sei, mei, calcResult));
});

// 不明なパスはホームへリダイレクト
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`しんだんラボ サーバーが http://localhost:${PORT} で起動しました`);
});
