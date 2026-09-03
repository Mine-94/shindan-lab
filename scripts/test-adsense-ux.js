'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3019;
const BASE = `http://127.0.0.1:${PORT}`;
const PUBLISHER_ID = 'ca-pub-8602848692420724';
const ADSENSE_URL = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, needle) {
  return String(text).split(needle).length - 1;
}

async function fetchPage(pathname, options = {}) {
  const response = await fetch(`${BASE}${pathname}`, {
    redirect: 'manual',
    ...options,
  });
  const text = await response.text();
  return { response, text };
}

function requestWithHost(host) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: '/16type?from=www-test',
        method: 'GET',
        headers: { Host: host },
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response));
      }
    );
    request.on('error', reject);
    request.end();
  });
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
  throw lastError || new Error('AdSense UX test server did not become ready');
}

function assertCorePage(page, label) {
  assert(page.response.status === 200, `${label} did not return 200`);
  assert(
    page.response.headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
    `${label} is missing the required referrer policy`
  );
  assert(
    page.text.includes('aria-label="主要メニュー"'),
    `${label} is missing the sitewide navigation`
  );
  assert(page.text.includes('href="/16type"'), `${label} is missing the 16-type link`);
  assert(page.text.includes('href="/contact.html"'), `${label} is missing the contact link`);
  assert(
    !page.text.includes('fonts.googleapis.com'),
    `${label} still loads the remote Google Fonts stylesheet`
  );
  assert(
    count(page.text, ADSENSE_URL) === 1,
    `${label} must load the AdSense script exactly once`
  );
  assert(page.text.includes(PUBLISHER_ID), `${label} is missing the publisher ID`);
}

function assertPrivateResult(page, label) {
  assert(page.response.status === 200, `${label} did not return 200`);
  assert(
    String(page.response.headers.get('x-robots-tag') || '').includes('noindex'),
    `${label} is missing the noindex response header`
  );
  assert(
    String(page.response.headers.get('cache-control') || '').includes('no-store'),
    `${label} is not protected from shared caching`
  );
  assert(!page.text.includes(ADSENSE_URL), `${label} still contains the AdSense loader`);
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: 'https://shindan24.com',
      ADSENSE_CLIENT_ID: '',
      GA_MEASUREMENT_ID: '',
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

    const home = await fetchPage('/');
    assertCorePage(home, 'Home');
    assert(home.text.includes('class="content-review container"'), 'Visible editorial review is missing');
    assert(home.text.includes('最終確認：2026年9月3日'), 'Visible review date is missing');

    const quiz = await fetchPage('/q/honto-no-seikaku');
    assertCorePage(quiz, 'Quiz landing');

    const compatibilityLanding = await fetchPage('/16type/compatibility');
    assertCorePage(compatibilityLanding, 'Compatibility landing');

    const privateCases = [
      ['/q/oshikatsu-type/r/kamiseki?s=75', 'Scored quiz result'],
      ['/16type/test?compare=ENFP&relation=friend&utm_source=invite', 'Invitation test'],
      ['/16type/r/ENFP?e=80&s=20&t=20&j=20', 'Personalized 16-type result'],
      [
        '/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend',
        'Selected compatibility result',
      ],
      ['/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A', 'Name result'],
    ];
    for (const [pathname, label] of privateCases) {
      assertPrivateResult(await fetchPage(pathname), label);
    }

    const privacy = await fetchPage('/privacy.html');
    assert(privacy.response.status === 200, 'Privacy page did not return 200');
    assert(privacy.text.includes('aria-label="主要メニュー"'), 'Privacy page navigation is missing');
    assert(!privacy.text.includes(ADSENSE_URL), 'Privacy page must not contain an AdSense tag');
    assert(!privacy.text.includes('fonts.googleapis.com'), 'Privacy page still loads Google Fonts');
    assert(
      privacy.text.includes('name="referrer" content="strict-origin-when-cross-origin"'),
      'Privacy page is missing referrer metadata'
    );

    const asset = await fetchPage('/css/style.css');
    assert(asset.response.status === 200, 'CSS asset did not return 200');
    assert(
      String(asset.response.headers.get('cache-control') || '').includes('max-age=3600'),
      'Static asset cache header is missing'
    );

    const sitemap = await fetchPage('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap did not return 200');
    assert(count(sitemap.text, '<url>') === 60, 'Sitemap must retain 60 reviewed URLs');
    assert(count(sitemap.text, '<lastmod>2026-09-03</lastmod>') === 60, 'Sitemap lastmod count is wrong');
    assert(!sitemap.text.includes('/meimei/r/'), 'Name result URLs returned to the sitemap');

    const www = await requestWithHost('www.shindan24.com');
    assert(www.statusCode === 301, 'www host must return a permanent redirect');
    assert(
      www.headers.location === 'https://shindan24.com/16type?from=www-test',
      `Unexpected www redirect location: ${www.headers.location}`
    );

    const missing = await fetchPage('/adsense-ux-missing-page');
    assert(missing.response.status === 404, 'Unknown URL must return 404');
    assert(
      String(missing.response.headers.get('x-robots-tag') || '').includes('noindex'),
      '404 response is missing noindex'
    );

    console.log('PASS: AdSense code is limited to publisher-content pages and defaults to the verified publisher ID.');
    console.log('PASS: global navigation, visible editorial review, referrer policy, cache headers, www redirect and 60 lastmod entries validated.');
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
