'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3021;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  throw lastError || new Error('Search verification test server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: 'https://shindan24.com',
      GOOGLE_SITE_VERIFICATION: 'google-test-token',
      NAVER_SITE_VERIFICATION: 'naver-test-token',
      BING_SITE_VERIFICATION: 'bing-test-token',
      GA_MEASUREMENT_ID: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer();
    const response = await fetch(`${BASE}/`);
    const html = await response.text();
    assert(response.status === 200, 'Home must return 200');
    assert(
      html.includes('<meta name="google-site-verification" content="google-test-token" />'),
      'Google verification meta is missing'
    );
    assert(
      html.includes('<meta name="naver-site-verification" content="naver-test-token" />'),
      'Naver verification meta is missing'
    );
    assert(
      html.includes('<meta name="msvalidate.01" content="bing-test-token" />'),
      'Bing verification meta is missing'
    );
    assert(
      html.indexOf('google-site-verification') < html.indexOf('</head>') &&
        html.indexOf('naver-site-verification') < html.indexOf('</head>') &&
        html.indexOf('msvalidate.01') < html.indexOf('</head>'),
      'Ownership verification metadata must stay in the head'
    );
    console.log('PASS: Google, Naver and Bing ownership verification metadata is rendered in the homepage head.');
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
