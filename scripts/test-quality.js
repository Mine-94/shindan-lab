'use strict';

const { spawn } = require('child_process');
const path = require('path');
const quizzes = require('../data/quizzes');
const editorial = require('../data/quiz-editorial');

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
    assert(urlCount === 88, `Unexpected sitemap URL count: ${urlCount}`);

    console.log(`PASS: ${quizzes.length} quizzes and all result pages passed quality checks.`);
    console.log('PASS: home, trust pages, structured data, HTML and sitemap checks passed.');
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
