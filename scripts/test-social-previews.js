'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3017;
const BASE = `http://127.0.0.1:${PORT}`;
const PREVIEWS = ['default', '16type', 'love', 'friend', 'work', 'family'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert(buffer.subarray(0, 8).equals(signature), 'File is not a PNG');
  assert(buffer.toString('ascii', 12, 16) === 'IHDR', 'PNG IHDR chunk is missing');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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
  throw lastError || new Error('Social preview test server did not become ready');
}

function assertPreviewMeta(html, expectedPath, label) {
  assert(
    html.includes(`<meta property="og:image" content="${BASE}${expectedPath}" />`),
    `${label}: og:image is missing or incorrect`
  );
  assert(
    html.includes(`<meta property="og:image:secure_url" content="${BASE}${expectedPath}" />`),
    `${label}: og:image:secure_url is missing`
  );
  assert(html.includes('property="og:image:width" content="1200"'), `${label}: width is missing`);
  assert(html.includes('property="og:image:height" content="630"'), `${label}: height is missing`);
  assert(
    html.includes(`<meta name="twitter:image" content="${BASE}${expectedPath}" />`),
    `${label}: twitter:image is missing or incorrect`
  );
}

async function main() {
  for (const name of PREVIEWS) {
    const file = path.join(__dirname, '..', 'public', 'og', `${name}.png`);
    assert(fs.existsSync(file), `Preview file is missing: ${name}.png`);
    const buffer = fs.readFileSync(file);
    const dimensions = pngDimensions(buffer);
    assert(dimensions.width === 1200, `${name}.png width is ${dimensions.width}`);
    assert(dimensions.height === 630, `${name}.png height is ${dimensions.height}`);
    assert(buffer.length >= 20_000, `${name}.png is unexpectedly small`);
  }

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
    assertPreviewMeta(home.text, '/og/default.png', 'home');

    const typeHub = await fetchText('/16type');
    assert(typeHub.response.status === 200, '16-type hub did not return 200');
    assertPreviewMeta(typeHub.text, '/og/16type.png', '16-type hub');

    const typeTest = await fetchText('/16type/test');
    assert(typeTest.response.status === 200, '16-type test did not return 200');
    assertPreviewMeta(typeTest.text, '/og/16type.png', '16-type test');

    const typeResult = await fetchText('/16type/r/ENFP');
    assert(typeResult.response.status === 200, '16-type result did not return 200');
    assertPreviewMeta(typeResult.text, '/og/16type.png', '16-type result');

    const compatibility = await fetchText('/16type/compatibility');
    assert(compatibility.response.status === 200, 'Compatibility page did not return 200');
    assertPreviewMeta(compatibility.text, '/og/16type.png', 'compatibility');

    const relations = [
      ['love', 'MBTI関連・16タイプ恋愛相性ガイド'],
      ['friend', 'MBTI関連・16タイプ友達相性ガイド'],
      ['work', 'MBTI関連・16タイプ仕事相性ガイド'],
      ['family', 'MBTI関連・16タイプ家族相性ガイド'],
    ];
    for (const [relation, expectedTitle] of relations) {
      const page = await fetchText(`/16type/${relation}`);
      assert(page.response.status === 200, `${relation} guide did not return 200`);
      assertPreviewMeta(page.text, `/og/${relation}.png`, `${relation} guide`);
      assert(page.text.includes(`<title>${expectedTitle}`), `${relation} SEO title is missing`);
      const image = await fetch(`${BASE}/og/${relation}.png`);
      assert(image.status === 200, `${relation} preview did not return 200`);
      assert(image.headers.get('content-type') === 'image/png', `${relation} preview MIME is wrong`);
    }

    console.log('PASS: 6 social preview PNGs and all Open Graph/Twitter metadata validated.');
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
