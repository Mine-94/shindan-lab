const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const quizzes = require('./data/quizzes');
const fortuneTools = require('./data/fortune-tools');
const { STEM_KEYS, BLOOD_TYPES, calcShichuuStem, calcSeimeiHandan } = require('./lib/fortune');
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
const { createAdsenseContentRenderers } = require('./views/adsense-content-render');
Object.assign(originalRender, createAdsenseContentRenderers({ ...originalRender }));
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
const LEGACY_HOST = 'shindan-lab.onrender.com';
const CANONICAL_HOST = 'shindan24.com';
const SITEMAP_LASTMOD = '2026-09-03';

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('trust proxy', 1);

// Googleの欧州規制メッセージがクロスオリジンの参照元を確認できる設定を明示します。
app.use((req, res, next) => {
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.set('Content-Language', 'ja');
  next();
});

// 旧Render URLとwwwを一つの公式ドメインへ恒久転送します。
app.use((req, res, next) => {
  const hostname = String(req.hostname || '').toLowerCase();
  if (hostname === LEGACY_HOST || hostname === `www.${CANONICAL_HOST}`) {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
  next();
});

// 画像・CSS・JSは短時間キャッシュし、HTMLは更新確認を早くします。
app.use(
  express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('service-worker.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\.(?:css|js|png|ico|json)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
    },
  })
);

// 静的アセットを除くアプリ画面だけにレート制限を適用します。
app.use(limiter);

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

function stripAdSenseLoader(html) {
  return String(html).replace(
    /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]+" crossorigin="anonymous"><\/script>\n?/g,
    ''
  );
}

function sendRendered(res, html, { noindex = false, allowAds = true } = {}) {
  if (noindex) {
    res.set('X-Robots-Tag', 'noindex, follow');
    res.set('Cache-Control', 'private, no-store');
  }
  return res.send(allowAds ? html : stripAdSenseLoader(html));
}

function sendNotFound(res) {
  res.set('X-Robots-Tag', 'noindex, follow');
  res.set('Cache-Control', 'no-store');
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
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
    '/contact.html',
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

  const allPaths = [
    ...staticPaths,
    ...shichuuPaths,
    ...ketsuekiSinglePaths,
    ...ketsuekiPairPaths,
  ];

  const urls = allPaths
    .map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${SITEMAP_LASTMOD}</lastmod></url>`)
    .join('\n');
  res.type('application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// --- タイプ診断（選択式クイズ） ---
app.get('/q/:id', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz) return sendNotFound(res);
  res.send(renderQuizPage(quiz));
});

app.get('/q/:id/r/:resultKey', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz || !quiz.results[req.params.resultKey]) return sendNotFound(res);
  // タイプ+スコア結合型: クライアントで計算した「一致率」(?s=0~100)があれば結果と一緒に表示。
  // 値がない・範囲外の場合は静かに無視し、従来通りにレンダリング(canonical URLはそのまま維持)。
  const scoreRaw = parseInt(req.query.s, 10);
  const matchScore = Number.isInteger(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 100 ? scoreRaw : null;
  return sendRendered(res, renderResultPage(quiz, req.params.resultKey, matchScore), {
    noindex: matchScore !== null,
    allowAds: matchScore === null,
  });
});

// --- 16タイプ診断・相性チェック（公式MBTIとは別の独自コンテンツ） ---
app.get('/16type', (req, res) => {
  res.send(renderType16Hub());
});

app.get('/16type/test', (req, res) => {
  const personalized = Object.keys(req.query).length > 0;
  return sendRendered(res, renderType16Test(req.query), {
    noindex: personalized,
    allowAds: !personalized,
  });
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
  if (!TYPE16_CODES.includes(code)) return sendNotFound(res);
  const personalized = Object.keys(req.query).length > 0;
  return sendRendered(res, renderType16Result(code, req.query), {
    noindex: personalized,
    allowAds: !personalized,
  });
});

app.get('/16type/compatibility', (req, res) => {
  const hasResult = Boolean(req.query.self && req.query.partner);
  return sendRendered(res, renderType16Compatibility(req.query), {
    noindex: hasResult,
    allowAds: !hasResult,
  });
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
  if (!STEM_KEYS.includes(req.params.stemKey)) return sendNotFound(res);
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

  if (!BLOOD_TYPES.includes(type)) return sendNotFound(res);

  if (partner && BLOOD_TYPES.includes(partner)) {
    const [first, second] = canonicalBloodPair(type, partner);
    return res.redirect(`/ketsueki/r/${first}/${second}`);
  }
  res.redirect(`/ketsueki/r/${type}`);
});

app.get('/ketsueki/r/:type', (req, res) => {
  const type = req.params.type.toUpperCase();
  if (!BLOOD_TYPES.includes(type)) return sendNotFound(res);
  res.send(renderKetsuekiResult(type, null));
});

app.get('/ketsueki/r/:type/:partner', (req, res) => {
  const type = req.params.type.toUpperCase();
  const partner = req.params.partner.toUpperCase();
  if (!BLOOD_TYPES.includes(type) || !BLOOD_TYPES.includes(partner)) return sendNotFound(res);

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
  // 任意入力の名前結果は検索対象・広告対象にせず、利用者向け計算結果としてだけ表示します。
  return sendRendered(res, renderMeimeiResult(sei, mei, calcResult), {
    noindex: true,
    allowAds: false,
  });
});

// 不明なURLをホームへ転送するとsoft 404になり得るため、正しい404を返します。
app.get('*', (req, res) => {
  sendNotFound(res);
});

app.listen(PORT, () => {
  console.log(`しんだんラボ サーバーが http://localhost:${PORT} で起動しました`);
});
