'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3022;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  throw lastError || new Error('Visual refresh test server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: 'https://shindan24.com',
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

    const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'visual-refresh.css'), 'utf8');
    for (const marker of [
      '.home-hero-layout',
      '.home-priority-section',
      '.type16-brand-mark',
      '.type16-celebrity-home-teaser',
      'max-width: 1180px',
      'background: rgba(255, 255, 255, 0.96)',
    ]) {
      assert(css.includes(marker), `Visual design CSS is missing ${marker}`);
    }
    assert(!css.includes('300万人'), 'Visual CSS must not contain invented audience claims');

    const home = await fetchPage('/');
    assert(home.response.status === 200, 'Home must return 200');
    assert(home.text.includes('data-visual-refresh="2026-09-05-v1"'), 'Visual refresh marker is missing');
    assert(home.text.includes('class="site-header home-site-header"'), 'Editorial home hero is missing');
    assert(home.text.includes('class="home-hero-layout"'), 'Home hero grid is missing');
    assert(home.text.includes('見やすく一つに。'), 'Improved home headline is missing');
    assert(home.text.includes('会員登録不要'), 'Trust benefit row is missing');
    assert(home.text.includes('スマホで使いやすい'), 'Mobile benefit is missing');
    assert(home.text.includes('恋愛・友達・仕事に対応'), 'Relationship benefit is missing');
    assert(home.text.includes('class="home-hero-visual"'), 'Purposeful hero visual is missing');
    assert(home.text.includes('class="brand-mark"'), 'New brand mark is missing');
    assert(home.text.includes('class="site-nav-cta"'), 'Clear header CTA is missing');
    assert(home.text.includes('はじめての方におすすめの診断'), 'Natural recommendation title is missing');
    assert(!home.text.includes('日本の公開調査、実サービスの利用行動、検索意図、初めて使う人の始めやすさを点数化'), 'AI-like ranking copy remains');
    assert(home.text.includes('class="celebrity-teaser-copy"'), 'Balanced celebrity copy column is missing');
    assert(home.text.includes('class="celebrity-teaser-side"'), 'Contained celebrity action column is missing');
    assert(home.text.includes('公表情報を確認できた48人を一つの一覧'), 'Unified celebrity-list wording is missing');
    assert(!home.text.includes('カテゴリー分けせず'), 'Awkward negative category wording remains');
    assert(home.text.includes('/css/visual-refresh.css'), 'Visual refresh stylesheet is missing on home');

    const hub = await fetchPage('/16type');
    assert(hub.response.status === 200, '16-type hub must return 200');
    assert(hub.text.includes('page-type16-hub'), '16-type hub page class is missing');
    assert(
      hub.text.includes('<div class="type16-brand-mark service-brand-mark"'),
      'Purposeful 16-type mark is missing'
    );
    assert(hub.text.includes('<span>16</span><small>TYPE</small>'), '16-type mark content is wrong');
    assert(!hub.text.includes('<div class="quiz-hero-badge">🔤</div>'), 'Meaningless alphabet emoji remains');
    assert(hub.text.includes('4つの傾向から、自分の考え方や行動パターンを整理'), 'Improved hub subtitle is missing');
    assert(hub.text.includes('/css/visual-refresh.css'), 'Visual refresh stylesheet is missing on hub');

    const test = await fetchPage('/16type/test');
    assert(test.response.status === 200, '16-type test must return 200');
    assert(test.text.includes('page-type16-test'), '16-type test page class is missing');
    assert(test.text.includes('<span>20</span><small>問</small>'), '20-question visual mark is missing');
    assert(!test.text.includes('<div class="quiz-hero-badge">🧩</div>'), 'Puzzle emoji remains in the hero');

    const purposefulMarks = [
      ['/q/honto-no-seikaku', '<span>診</span><small>テスト</small>'],
      ['/16type/compatibility', '<span>相</span><small>性</small>'],
      ['/shichuu', '<span>十</span><small>干</small>'],
      ['/ketsueki', '<span>血</span><small>型</small>'],
      ['/meimei', '<span>名</span><small>前</small>'],
    ];
    for (const [pathname, marker] of purposefulMarks) {
      const page = await fetchPage(pathname);
      assert(page.response.status === 200, `${pathname} must return 200`);
      assert(page.text.includes('service-brand-mark'), `${pathname} is missing its service mark`);
      assert(page.text.includes(marker), `${pathname} has the wrong service mark content`);
      assert(!page.text.includes('class="quiz-hero-badge"'), `${pathname} still contains an emoji hero badge`);
    }

    const about = await fetchPage('/about.html');
    assert(about.response.status === 200, 'Static about page must return 200');
    assert(about.text.includes('data-visual-refresh="2026-09-05-v1"'), 'Static page visual marker is missing');
    assert(about.text.includes('/css/visual-refresh.css'), 'Static page visual stylesheet is missing');
    assert(about.text.includes('class="brand-mark"'), 'Static page brand mark is missing');
    assert(about.text.includes('class="site-nav-cta"'), 'Static page header CTA is missing');

    const personalized = await fetchPage('/16type/r/ISFP?e=20&s=80&t=20&j=20');
    assert(personalized.response.status === 200, 'Personalized result must remain usable');
    assert(
      String(personalized.response.headers.get('x-robots-tag') || '').includes('noindex'),
      'Personalized result lost noindex protection'
    );
    assert(
      !personalized.text.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),
      'Personalized result unexpectedly gained an ad loader'
    );

    console.log('PASS: actual homepage, purposeful service marks, celebrity teaser, static pages and responsive visual design hooks validated.');
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
