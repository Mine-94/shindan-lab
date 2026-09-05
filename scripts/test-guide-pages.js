'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3020;
const BASE = `http://127.0.0.1:${PORT}`;
const OFFICIAL = 'https://shindan24.com';
const ADSENSE_URL = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, needle) {
  return String(text).split(needle).length - 1;
}

function visibleMainLength(html) {
  const match = String(html).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return String(match ? match[1] : html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, '')
    .length;
}

async function fetchPage(pathname) {
  const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  return { response, text: await response.text() };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Guide test server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: OFFICIAL,
      ADSENSE_CLIENT_ID: 'ca-pub-8602848692420724',
      GA_MEASUREMENT_ID: 'G-TEST1234',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer();

    const guideCases = [
      ['/guide/', 'しんだんラボの使い方ガイド', '知りたいことから選ぶ'],
      ['/guide/16type.html', '16タイプ診断の見方', '4つの回答軸'],
      ['/guide/compatibility.html', '相性結果の読み方', '関係別に確認したいこと'],
      ['/guide/fortune.html', '姓名判断・十干タイプ・血液型占いの使い方', '三つの占いの違い'],
    ];

    for (const [pathname, h1, marker] of guideCases) {
      const page = await fetchPage(pathname);
      assert(page.response.status === 200, `${pathname} must return 200`);
      assert(page.text.includes(`<h1>${h1}</h1>`), `${pathname} is missing its H1`);
      assert(page.text.includes(marker), `${pathname} is missing ${marker}`);
      assert(page.text.includes(`href="${pathname === '/guide/' ? `${OFFICIAL}/guide/` : `${OFFICIAL}${pathname}`}"`), `${pathname} canonical is wrong`);
      assert(page.text.includes('application/ld+json'), `${pathname} structured data is missing`);
      assert(page.text.includes('href="/contact.html"'), `${pathname} contact navigation is missing`);
      assert(page.text.includes('href="/sitemap.html"'), `${pathname} HTML sitemap link is missing`);
      assert(count(page.text, ADSENSE_URL) === 1, `${pathname} must contain one AdSense loader`);
      assert(visibleMainLength(page.text) >= 900, `${pathname} is too shallow for internal review`);
    }

    const updates = await fetchPage('/updates.html');
    assert(updates.response.status === 200, 'Updates page must return 200');
    assert(updates.text.includes('<h1>更新情報</h1>'), 'Updates H1 is missing');
    assert(updates.text.includes('2026.09.05'), 'Current update entry is missing');
    assert(updates.text.includes('/guide/16type.html'), 'Guide release is missing from updates');
    assert(count(updates.text, ADSENSE_URL) === 0, 'Updates page should remain ad-free');
    assert(visibleMainLength(updates.text) >= 900, 'Updates page is too shallow');

    const htmlSitemap = await fetchPage('/sitemap.html');
    assert(htmlSitemap.response.status === 200, 'HTML sitemap must return 200');
    assert(htmlSitemap.text.includes('<h1>サイトマップ</h1>'), 'HTML sitemap H1 is missing');
    for (const link of [
      '/guide/',
      '/guide/16type.html',
      '/guide/compatibility.html',
      '/guide/fortune.html',
      '/16type/r/ISFP',
      '/shichuu/r/kinoe',
      '/ketsueki/r/A/B',
      '/privacy.html',
    ]) {
      assert(htmlSitemap.text.includes(`href="${link}"`), `HTML sitemap is missing ${link}`);
    }
    assert(count(htmlSitemap.text, ADSENSE_URL) === 0, 'HTML sitemap should remain ad-free');
    assert(visibleMainLength(htmlSitemap.text) >= 700, 'HTML sitemap is too shallow');

    const home = await fetchPage('/');
    assert(home.text.includes('使い方・結果の読み方'), 'Home guide discovery block is missing');
    assert(home.text.includes('href="/guide/"'), 'Home guide link is missing');
    assert(home.text.includes('href="/updates.html"'), 'Home updates footer link is missing');
    assert(home.text.includes('href="/sitemap.html"'), 'Home HTML sitemap footer link is missing');

    const sitemap = await fetchPage('/sitemap.xml');
    assert(sitemap.response.status === 200, 'XML sitemap must return 200');
    assert(count(sitemap.text, '<url>') === 66, 'XML sitemap must contain 66 reviewed URLs');
    assert(count(sitemap.text, '<lastmod>') === 66, 'Every XML sitemap URL must have lastmod');
    for (const pathname of [
      '/guide/',
      '/guide/16type.html',
      '/guide/compatibility.html',
      '/guide/fortune.html',
      '/updates.html',
      '/sitemap.html',
    ]) {
      assert(sitemap.text.includes(`${OFFICIAL}${pathname}</loc>`), `XML sitemap is missing ${pathname}`);
    }
    assert(sitemap.text.includes('<lastmod>2026-09-05</lastmod>'), 'Current significant-update date is missing');
    assert(!sitemap.text.includes('/meimei/r/'), 'Private name-result URLs must not enter sitemap');

    console.log('PASS: 4 substantive guide pages, update history, HTML sitemap, home discovery links and 66-URL XML sitemap validated.');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }

  if (stderr.trim()) console.error(stderr.trim());
  if (stdout.trim()) console.log(stdout.trim());
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
