"use strict";

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3016;
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
  throw lastError || new Error('Growth test server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), SITE_URL: BASE },
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
    assert(home.text.includes('data-growth-version="2026-09-02-v2"'), 'Growth marker missing');
    assert(home.text.includes('関係から相性を探す'), 'Relation discovery section missing');
    assert(home.text.includes('/16type/love'), 'Love guide missing from home');
    assert(home.text.includes('/js/growth.js'), 'Growth client missing from home');
    const priorityIndex = home.text.indexOf('data-home-priority-version');
    const growthIndex = home.text.indexOf('data-growth-version');
    const quizIndex = home.text.indexOf('<h2 class="section-title">タイプ診断</h2>');
    assert(priorityIndex < growthIndex && growthIndex < quizIndex, 'Home growth order is invalid');

    const relationCases = [
      ['love', '16タイプ恋愛相性ガイド', '恋愛相性を見る'],
      ['friend', '16タイプ友達相性ガイド', '友達相性を見る'],
      ['work', '16タイプ仕事相性ガイド', '仕事相性を見る'],
      ['family', '16タイプ家族相性ガイド', '家族相性を見る'],
    ];
    for (const [relation, heading, button] of relationCases) {
      const page = await fetchText(`/16type/${relation}`);
      assert(page.response.status === 200, `${relation} guide did not return 200`);
      assert(page.text.includes(heading), `${relation} heading is missing`);
      assert(page.text.includes(`data-relation-guide="${relation}"`), `${relation} marker missing`);
      assert(page.text.includes(`name="relation" value="${relation}"`), `${relation} hidden input missing`);
      assert(page.text.includes(button), `${relation} submit label missing`);
      assert(page.text.includes('"@type":"FAQPage"'), `${relation} FAQ structured data missing`);
      assert(page.text.includes('/css/growth.css'), `${relation} growth styles missing`);
    }

    const inviteTest = await fetchText(
      '/16type/test?compare=ENFP&relation=friend&utm_source=invite'
    );
    assert(inviteTest.response.status === 200, 'Invite test did not return 200');
    assert(inviteTest.text.includes('ENFPの友達から届いた比較リンク'), 'Invite banner missing');
    assert(inviteTest.text.includes('window.__TYPE16_COMPARE__'), 'Invite context missing');
    assert(inviteTest.text.includes('noindex, follow'), 'Invite query noindex missing');

    const comparisonResult = await fetchText('/16type/r/ISFJ?compare=ENFP&relation=friend');
    assert(comparisonResult.response.status === 200, 'Comparison result did not return 200');
    assert(comparisonResult.text.includes('data-comparison-ready="true"'), 'Comparison CTA missing');
    assert(comparisonResult.text.includes('ENFPとの友達相性を見る'), 'Comparison heading missing');
    assert(
      comparisonResult.text.includes('data-type16-invite-relation="friend"'),
      'Friend invitation button missing'
    );
    assert(
      comparisonResult.text.includes('data-type16-invite-relation="love"'),
      'Love invitation button missing'
    );
    assert(
      comparisonResult.text.includes('data-type16-share-kind="type"'),
      'Existing type share card was lost'
    );

    const compatibility = await fetchText(
      '/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend'
    );
    assert(compatibility.response.status === 200, 'Compatibility did not return 200');
    assert(compatibility.text.includes('恋愛相性ガイド'), 'Relation guide nav missing');
    assert(compatibility.text.includes('data-type16-share-kind="compatibility"'), 'Share card lost');

    const sitemap = await fetchText('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap did not return 200');
    assert((sitemap.text.match(/<url>/g) || []).length === 111, 'Sitemap must contain 111 URLs');
    for (const relation of ['love', 'friend', 'work', 'family']) {
      assert(sitemap.text.includes(`/16type/${relation}</loc>`), `${relation} guide missing from sitemap`);
    }

    const growthSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'growth.js'),
      'utf8'
    );
    assert(growthSource.includes('type16_invite_share'), 'Invitation analytics missing');
    assert(growthSource.includes('share_landing'), 'Share landing analytics missing');
    assert(growthSource.includes('relation_guide_submit'), 'Relation form analytics missing');

    const testSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'type16-test.js'),
      'utf8'
    );
    assert(testSource.includes("params.set('compare'"), 'Comparison preservation missing');
    assert(testSource.includes('window.__TYPE16_COMPARE__'), 'Comparison context read missing');

    const shareSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'type16-share-card.js'),
      'utf8'
    );
    assert(shareSource.includes('attributedShareUrl'), 'Image share attribution missing');
    assert(shareSource.includes('navigator.clipboard.writeText'), 'Download copy fallback missing');

    const linkShareSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'result-share.js'),
      'utf8'
    );
    assert(linkShareSource.includes('utm_source'), 'Link share attribution missing');

    console.log('PASS: 4 SEO relation guides, invite-to-compare loop, attribution and 111 sitemap URLs validated.');
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
