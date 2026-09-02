'use strict';

const { spawn } = require('child_process');
const path = require('path');
const quizzes = require('../data/quizzes');
const editorial = require('../data/quiz-editorial');
const { TYPE16_CODES } = require('../data/type16');

const PORT = 3012;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(pathname) {
  const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  const text = await response.text();
  return { response, text };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`, { redirect: 'manual' });
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Server did not become ready');
}

async function main() {
  for (const quiz of quizzes) {
    assert(editorial[quiz.id], `Missing editorial data for quiz: ${quiz.id}`);
    for (const resultKey of Object.keys(quiz.results)) {
      assert(
        editorial[quiz.id].results[resultKey],
        `Missing editorial result data: ${quiz.id}/${resultKey}`
      );
    }
  }

  const child = spawn(process.execPath, [process.env.SERVER_ENTRY || 'server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: BASE,
      ADSENSE_CLIENT_ID: 'ca-pub-8602848692420724',
      GA_MEASUREMENT_ID: 'G-TEST1234',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();

    const home = await fetchText('/');
    assert(home.response.status === 200, 'Home did not return 200');
    assert(home.text.includes('しんだんラボについて'), 'Home explanation is missing');
    assert(home.text.includes('目的から診断を選ぶ'), 'Home guide is missing');
    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');
    assert(home.text.includes('関係から相性を探す'), 'Home relation guide section is missing');

    const priorityIndex = home.text.indexOf('data-home-priority-version="2026-09-02"');
    const quizSectionIndex = home.text.indexOf('<h2 class="section-title">タイプ診断</h2>');
    const fortuneSectionIndex = home.text.indexOf('<h2 class="section-title">占い</h2>');
    assert(
      priorityIndex !== -1 && priorityIndex < quizSectionIndex && quizSectionIndex < fortuneSectionIndex,
      'Homepage priority section must be first, followed by quizzes and fortune'
    );

    const firstPriority = home.text.indexOf('data-home-priority-id="type16-test"');
    const secondPriority = home.text.indexOf('data-home-priority-id="type16-compatibility"');
    const thirdPriority = home.text.indexOf('data-home-priority-id="quiz:oshikatsu-type"');
    assert(
      firstPriority < secondPriority && secondPriority < thirdPriority,
      'Top three homepage priority cards are out of order'
    );
    assert(home.text.includes('/js/home-priority.js'), 'Homepage priority tracking is missing');

    const quizSection = home.text.slice(
      quizSectionIndex,
      home.text.indexOf('</section>', quizSectionIndex)
    );
    assert(
      quizSection.indexOf('/q/oshikatsu-type') < quizSection.indexOf('/q/honto-no-seikaku') &&
        quizSection.indexOf('/q/honto-no-seikaku') < quizSection.indexOf('/q/kakure-chara') &&
        quizSection.indexOf('/q/kakure-chara') < quizSection.indexOf('/q/jinsei-balance-game'),
      'Quiz cards are not rendered in data-priority order'
    );

    const fortuneSection = home.text.slice(
      fortuneSectionIndex,
      home.text.indexOf('</section>', fortuneSectionIndex)
    );
    assert(
      fortuneSection.indexOf('href="/ketsueki"') < fortuneSection.indexOf('href="/shichuu"') &&
        fortuneSection.indexOf('href="/shichuu"') < fortuneSection.indexOf('href="/meimei"'),
      'Fortune cards are not rendered in data-priority order'
    );

    assert(home.text.includes('"@type":"FAQPage"'), 'Home FAQ structured data is missing');
    assert(home.text.includes('/css/quality.css'), 'Quality stylesheet is missing');
    assert(home.text.includes('href="/about.html"'), 'About footer link is missing');
    assert(!/\n\s*main>/.test(home.text), 'Malformed main> remains on home');

    const quizStart = await fetchText('/q/oshikatsu-type');
    assert(quizStart.response.status === 200, 'Push activity quiz did not return 200');
    assert(quizStart.text.includes('現場へ動く行動力'), 'Quiz axes are missing');
    assert(quizStart.text.includes('HOW IT WORKS'), 'Quiz explanation is missing');
    assert(quizStart.text.includes('"@type":"BreadcrumbList"'), 'Quiz breadcrumb data is missing');
    assert(!/\n\s*main>/.test(quizStart.text), 'Malformed main> remains on quiz page');

    const personality = await fetchText('/q/honto-no-seikaku');
    assert(
      personality.text.includes('16タイプ診断だけじゃ分からない'),
      'Generic 16-type wording is missing'
    );
    assert(
      !personality.text.includes('MBTIだけじゃ分からない'),
      'Unnecessary MBTI wording remains'
    );

    const type16Hub = await fetchText('/16type');
    assert(type16Hub.response.status === 200, '16-type hub did not return 200');
    assert(type16Hub.text.includes('16タイプ性格一覧'), '16-type hub heading is missing');
    assert(type16Hub.text.includes('公式MBTI®ではありません'), 'Official MBTI distinction is missing');

    const type16Test = await fetchText('/16type/test');
    assert(type16Test.response.status === 200, '16-type test did not return 200');
    assert(type16Test.text.includes('window.__TYPE16_TEST__'), '16-type test data is missing');

    for (const code of TYPE16_CODES) {
      const typeResult = await fetchText(`/16type/r/${code}`);
      assert(typeResult.response.status === 200, `16-type result did not return 200: ${code}`);
      assert(typeResult.text.includes(code), `16-type code missing from result: ${code}`);
      assert(
        typeResult.text.includes('恋愛で出やすい傾向'),
        `Love guidance missing from 16-type result: ${code}`
      );
    }

    const type16Compatibility = await fetchText(
      '/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend'
    );
    assert(type16Compatibility.response.status === 200, '16-type compatibility did not return 200');
    assert(type16Compatibility.text.includes('友達の相性目安'), 'Compatibility context is missing');
    assert(type16Compatibility.text.includes('noindex, follow'), 'Query result noindex is missing');

    const loveGuide = await fetchText('/16type/love');
    assert(loveGuide.response.status === 200, 'Love relation guide did not return 200');
    assert(loveGuide.text.includes('16タイプ恋愛相性ガイド'), 'Love relation guide heading is missing');
    assert(loveGuide.text.includes('name="relation" value="love"'), 'Love guide relation input is missing');

    for (const quiz of quizzes) {
      for (const resultKey of Object.keys(quiz.results)) {
        const result = await fetchText(`/q/${quiz.id}/r/${resultKey}?s=75`);
        assert(result.response.status === 200, `Result did not return 200: ${quiz.id}/${resultKey}`);
        assert(
          result.text.includes('今日からできること'),
          `Detailed action advice is missing: ${quiz.id}/${resultKey}`
        );
        assert(
          result.text.includes('人との付き合い方'),
          `Relationship guidance is missing: ${quiz.id}/${resultKey}`
        );
        assert(
          result.text.includes('"@type":"WebPage"'),
          `Result structured data is missing: ${quiz.id}/${resultKey}`
        );
      }
    }

    const about = await fetchText('/about.html');
    assert(about.response.status === 200, 'About page did not return 200');
    assert(about.text.includes('結果の限界を隠しません'), 'About limitations section is missing');

    const policy = await fetchText('/editorial-policy.html');
    assert(policy.response.status === 200, 'Editorial policy did not return 200');
    assert(policy.text.includes('他サイトの文章をコピーしません'), 'Originality policy is missing');

    const sitemap = await fetchText('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap did not return 200');
    assert(sitemap.text.includes('/about.html</loc>'), 'About page is missing from sitemap');
    assert(
      sitemap.text.includes('/editorial-policy.html</loc>'),
      'Editorial policy is missing from sitemap'
    );
    const urlCount = (sitemap.text.match(/<url>/g) || []).length;
    assert(urlCount === 111, `Unexpected sitemap URL count: ${urlCount}`);

    console.log(`PASS: ${quizzes.length} quizzes and all result pages passed quality checks.`);
    console.log('PASS: home, trust pages, 16-type pages, structured data, HTML and sitemap checks passed.');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  if (stderr.trim()) console.error(stderr.trim());
  if (stdout.trim()) console.log(stdout.trim());
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
