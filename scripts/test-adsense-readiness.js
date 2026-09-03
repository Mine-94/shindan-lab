'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3018;
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('AdSense readiness server did not become ready');
}

function count(text, needle) {
  return text.split(needle).length - 1;
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

    const home = await fetchPage('/');
    assert(home.response.status === 200, 'Home must return 200');
    for (const link of [
      '/about.html',
      '/editorial-policy.html',
      '/contact.html',
      '/privacy.html',
      '/terms.html',
    ]) {
      assert(home.text.includes(`href="${link}"`), `Home footer is missing ${link}`);
    }
    assert(home.text.includes('運営・編集：しんだんラボ編集部'), 'Visible operator label is missing');
    assert(home.text.includes('<meta name="author" content="しんだんラボ編集部"'), 'Author metadata is missing');
    assert(
      count(home.text, 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') === 1,
      'AdSense loader must appear exactly once on dynamic pages'
    );

    const trustPages = [
      ['/about.html', '運営者情報'],
      ['/editorial-policy.html', '広告と編集の分離'],
      ['/contact.html', 'issues/new?template=site-contact.yml'],
      ['/privacy.html', '第三者配信事業者'],
      ['/terms.html', '禁止事項'],
    ];
    for (const [pathname, marker] of trustPages) {
      const page = await fetchPage(pathname);
      assert(page.response.status === 200, `${pathname} must return 200`);
      assert(page.text.includes(marker), `${pathname} is missing ${marker}`);
      assert(page.text.includes(`https://shindan24.com${pathname}`), `${pathname} canonical is wrong`);
      assert(!page.text.includes('shindan-lab.onrender.com'), `${pathname} contains legacy hostname`);
      assert(page.text.includes('href="/contact.html"') || pathname === '/contact.html', `${pathname} lacks contact path`);
    }

    const privacy = await fetchPage('/privacy.html');
    for (const marker of [
      'Google AdSense',
      'Cookie',
      'ウェブビーコン',
      'IPアドレス',
      'Google広告設定',
      'policies.google.com/technologies/partner-sites',
    ]) {
      assert(privacy.text.includes(marker), `Privacy policy is missing ${marker}`);
    }

    const contact = await fetchPage('/contact.html');
    assert(contact.text.includes('issues/new?template=site-contact.yml'), 'Working public contact form is missing');
    const unverifiedAlias = 'contact@' + 'shindan24.com';
    assert(!contact.text.includes(unverifiedAlias), 'Unverified contact alias must not be published');
    assert(!contact.text.includes('mailto:'), 'Contact page must not expose a non-working mail link');
    assert(!contact.text.includes('pagead2.googlesyndication.com'), 'Contact page should not load ads');

    const sitemap = await fetchPage('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap must return 200');
    const urls = sitemap.text.match(/<url>/g) || [];
    assert(urls.length === 60, `Sitemap must contain 60 reviewed URLs, got ${urls.length}`);
    assert(sitemap.text.includes('https://shindan24.com/contact.html</loc>'), 'Contact page missing from sitemap');
    assert(!sitemap.text.includes('/meimei/r/'), 'Arbitrary name-result URLs must not be in sitemap');
    assert(!sitemap.text.includes('shindan-lab.onrender.com'), 'Sitemap contains legacy hostname');

    const nameResult = await fetchPage('/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A');
    assert(nameResult.response.status === 200, 'Name result must remain usable');
    assert(
      String(nameResult.response.headers.get('x-robots-tag') || '').includes('noindex'),
      'Name result must carry X-Robots-Tag noindex'
    );

    for (const pathname of [
      '/this-page-does-not-exist',
      '/q/not-a-real-quiz',
      '/q/oshikatsu-type/r/not-a-real-key',
      '/16type/r/XXXX',
      '/shichuu/r/notakey',
      '/ketsueki/r/Z',
    ]) {
      const missing = await fetchPage(pathname);
      assert(missing.response.status === 404, `${pathname} must return 404`);
      assert(!missing.response.headers.get('location'), `${pathname} must not redirect`);
      assert(missing.text.includes('ページが見つかりません'), `${pathname} lacks helpful 404 content`);
      assert(missing.text.includes('noindex, follow'), `${pathname} 404 lacks noindex`);
    }

    const ads = await fetchPage('/ads.txt');
    assert(ads.response.status === 200, 'ads.txt must return 200');
    assert(
      ads.text.trim() === 'google.com, pub-8602848692420724, DIRECT, f08c47fec0942fa0',
      'ads.txt publisher record is invalid'
    );

    const robots = await fetchPage('/robots.txt');
    assert(robots.text.includes('Sitemap: https://shindan24.com/sitemap.xml'), 'robots.txt sitemap is not canonical');

    console.log('PASS: AdSense trust pages, public contact form, privacy disclosure, 60-page sitemap, name-result noindex and real 404 handling validated.');
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
