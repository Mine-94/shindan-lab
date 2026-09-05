'use strict';

/**
 * Browser-level quality gate for shindan24.com.
 *
 * This audit complements the existing response/content tests with real Chromium
 * layout checks. It deliberately focuses on the failures that are difficult to
 * catch from HTML alone: horizontal overflow, clipped text, controls escaping
 * cards, overlapping columns, distorted circles/squares and broken user flows.
 *
 * The workflow installs Playwright only for CI; production dependencies remain
 * unchanged. Set QA_BASE_URL to audit the live site. Without it, this script
 * starts the current local server.js and audits the pending commit.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const PORT = Number.parseInt(process.env.QA_PORT || '3022', 10);
const LOCAL_BASE = `http://127.0.0.1:${PORT}`;
const BASE_URL = String(process.env.QA_BASE_URL || LOCAL_BASE).replace(/\/+$/, '');
const START_LOCAL_SERVER = !process.env.QA_BASE_URL;
const OUTPUT_DIR = path.resolve(
  process.env.QA_OUTPUT_DIR || path.join('artifacts', 'browser-quality-gate')
);

const VIEWPORTS = Object.freeze([
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1050 },
]);

const LAYOUT_ROUTES = Object.freeze([
  { path: '/', slug: 'home', screenshot: true },
  { path: '/16type', slug: '16type-hub', screenshot: true },
  { path: '/16type/test', slug: '16type-test', screenshot: true },
  { path: '/16type/compatibility', slug: '16type-compatibility', screenshot: true },
  { path: '/16type/r/ISFP', slug: '16type-isfp', screenshot: true },
  { path: '/q/honto-no-seikaku', slug: 'personality-test', screenshot: false },
  { path: '/q/oshikatsu-type', slug: 'oshi-test', screenshot: false },
  { path: '/meimei', slug: 'name-fortune', screenshot: false },
  { path: '/shichuu', slug: 'ten-stems', screenshot: false },
  { path: '/ketsueki', slug: 'blood-type', screenshot: false },
  { path: '/guide/', slug: 'guide', screenshot: false },
  { path: '/about.html', slug: 'about', screenshot: false },
  { path: '/contact.html', slug: 'contact', screenshot: false },
]);

const CONTROL_SELECTOR = [
  '.site-nav a',
  '.quiz-btn',
  'button:not([hidden])',
  'input:not([type="hidden"])',
  'select',
  'summary',
].join(',');

const TEXT_SELECTOR = [
  '.brand-copy strong',
  '.brand-copy small',
  '.site-nav a',
  '.home-main-title',
  '.home-hero-copy .tagline',
  '.home-priority-heading .section-title',
  '.home-priority-heading p',
  '.home-priority-card h2',
  '.home-priority-card p',
  '.type16-hero h1',
  '.type16-hero .tagline',
  '.type16-intro-card h2',
  '.type16-intro-card p',
  '.type16-axis-card h3',
  '.type16-axis-card p',
  '.type16-celebrity-home-teaser h2',
  '.type16-celebrity-home-teaser p',
  '.quiz-card h2',
  '.quiz-card p',
  '.quiz-btn',
  '.content-kicker',
].join(',');

const SQUARE_SELECTOR = [
  '.brand-mark',
  '.type16-brand-mark',
  '.home-hero-wheel',
  '.quiz-card-badge',
  '.result-badge',
  '.home-priority-badge',
  '.celebrity-teaser-faces span',
].join(',');

const CONTAINMENT_PARENTS = Object.freeze([
  '.type16-celebrity-home-teaser',
  '.home-priority-section',
  '.type16-intro-card',
  '.tool-card',
  '.info-card',
  '.result-card',
]);

const OVERLAP_PAIRS = Object.freeze([
  ['.site-header-row > .logo', '.site-header-row > .site-nav'],
  ['.home-hero-copy', '.home-hero-visual'],
  ['.home-priority-heading', '.home-priority-grid'],
  ['.celebrity-teaser-copy', '.celebrity-teaser-side'],
]);

const SCREENSHOT_VIEWPORTS = new Set(['mobile-390', 'desktop-1440']);
const THIRD_PARTY_HOST_PARTS = Object.freeze([
  'googlesyndication.com',
  'doubleclick.net',
  'googletagmanager.com',
  'google-analytics.com',
  'google.com/pagead',
]);

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeMessage(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function waitForServer(url) {
  let lastError;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Server did not become ready: ${url}`);
}

function startServer() {
  if (!START_LOCAL_SERVER) return null;
  return spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: 'https://shindan24.com',
      GA_MEASUREMENT_ID: '',
      ADSENSE_CLIENT_ID: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function rectsOverlap(left, right) {
  const width = Math.min(left.right, right.right) - Math.max(left.left, right.left);
  const height = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
  return width > 2 && height > 2;
}

async function configureContext(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    locale: 'ja-JP',
  });

  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    let hostname = '';
    try {
      hostname = new URL(requestUrl).hostname;
    } catch (_error) {
      return route.continue();
    }
    if (THIRD_PARTY_HOST_PARTS.some((part) => hostname.includes(part))) {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  return context;
}

async function auditRenderedPage(page, route, viewport) {
  const issues = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = sanitizeMessage(message.text());
    if (/ERR_BLOCKED_BY_CLIENT|Failed to load resource/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(sanitizeMessage(error.message)));

  const response = await page.goto(`${BASE_URL}${route.path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  if (!response || response.status() !== 200) {
    issues.push(`HTTP ${response ? response.status() : 'no response'}`);
    return { issues, consoleErrors, pageErrors };
  }

  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(180);

  const browserFindings = await page.evaluate(
    ({ controlSelector, textSelector, squareSelector, containmentParents, overlapPairs }) => {
      const findings = [];
      const viewportWidth = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;

      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number.parseFloat(style.opacity || '1') > 0.01 &&
          rect.width > 0.5 &&
          rect.height > 0.5
        );
      };

      const describe = (element) => {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = typeof element.className === 'string'
          ? element.className
              .trim()
              .split(/\s+/)
              .slice(0, 3)
              .map((name) => `.${name}`)
              .join('')
          : '';
        const text = String(element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
        return `${tag}${id}${classes}${text ? ` “${text}”` : ''}`;
      };

      const parseRgb = (value) => {
        const match = String(value).match(/rgba?\(([^)]+)\)/i);
        if (!match) return null;
        const parts = match[1]
          .replace(/\//g, ' ')
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number);
        if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) return null;
        return {
          r: parts[0],
          g: parts[1],
          b: parts[2],
          a: Number.isFinite(parts[3]) ? parts[3] : 1,
        };
      };

      const composite = (foreground, background) => {
        const alpha = foreground.a + background.a * (1 - foreground.a);
        if (!alpha) return { r: 255, g: 255, b: 255, a: 1 };
        return {
          r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
          g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
          b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
          a: alpha,
        };
      };

      const effectiveBackground = (element) => {
        const layers = [];
        let current = element;
        while (current && current instanceof HTMLElement) {
          const parsed = parseRgb(getComputedStyle(current).backgroundColor);
          if (parsed && parsed.a > 0) layers.push(parsed);
          current = current.parentElement;
        }
        let color = { r: 255, g: 255, b: 255, a: 1 };
        for (let index = layers.length - 1; index >= 0; index -= 1) {
          color = composite(layers[index], color);
        }
        return color;
      };

      const relativeLuminance = (color) => {
        const convert = (channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
      };

      const contrastRatio = (left, right) => {
        const l1 = relativeLuminance(left);
        const l2 = relativeLuminance(right);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      if (documentWidth > viewportWidth + 3) {
        findings.push(`horizontal overflow: document ${documentWidth}px > viewport ${viewportWidth}px`);
      }

      const h1s = [...document.querySelectorAll('h1')].filter(isVisible);
      if (h1s.length !== 1) findings.push(`expected exactly one visible H1, found ${h1s.length}`);

      for (const element of document.querySelectorAll(controlSelector)) {
        if (!isVisible(element)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.left < -2 || rect.right > viewportWidth + 2) {
          findings.push(`control outside viewport: ${describe(element)} [${Math.round(rect.left)}, ${Math.round(rect.right)}]`);
        }
        const style = getComputedStyle(element);
        const isInlineTextLink = element.tagName === 'A' && style.display === 'inline';
        if (!isInlineTextLink && (rect.width < 24 || rect.height < 24)) {
          findings.push(`interactive target below 24px: ${describe(element)} (${Math.round(rect.width)}×${Math.round(rect.height)})`);
        }
      }

      for (const element of document.querySelectorAll(textSelector)) {
        if (!isVisible(element)) continue;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (rect.left < -2 || rect.right > viewportWidth + 2) {
          findings.push(`text outside viewport: ${describe(element)}`);
        }
        const overflowXAllowed = ['auto', 'scroll'].includes(style.overflowX);
        if (!overflowXAllowed && element.scrollWidth > element.clientWidth + 2) {
          findings.push(`text clipped horizontally: ${describe(element)}`);
        }
        if (style.overflowY === 'hidden' && element.scrollHeight > element.clientHeight + 2) {
          findings.push(`text clipped vertically: ${describe(element)}`);
        }

        const foreground = parseRgb(style.color);
        if (!foreground || foreground.a < 0.9) continue;
        const background = effectiveBackground(element);
        const ratio = contrastRatio(foreground, background);
        const fontSize = Number.parseFloat(style.fontSize || '16');
        const fontWeight = Number.parseInt(style.fontWeight || '400', 10);
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const minimum = isLarge ? 3 : 4.5;
        if (ratio + 0.02 < minimum) {
          findings.push(`low text contrast ${ratio.toFixed(2)}:1: ${describe(element)}`);
        }
      }

      for (const element of document.querySelectorAll(squareSelector)) {
        if (!isVisible(element)) continue;
        const rect = element.getBoundingClientRect();
        if (Math.abs(rect.width - rect.height) > 2) {
          findings.push(`distorted square/circle: ${describe(element)} (${rect.width.toFixed(1)}×${rect.height.toFixed(1)})`);
        }
      }

      for (const parentSelector of containmentParents) {
        for (const parent of document.querySelectorAll(parentSelector)) {
          if (!isVisible(parent)) continue;
          const parentRect = parent.getBoundingClientRect();
          const controls = parent.querySelectorAll('.quiz-btn, button, input, select');
          for (const control of controls) {
            if (!isVisible(control)) continue;
            const rect = control.getBoundingClientRect();
            if (
              rect.left < parentRect.left - 2 ||
              rect.right > parentRect.right + 2 ||
              rect.top < parentRect.top - 2 ||
              rect.bottom > parentRect.bottom + 2
            ) {
              findings.push(`control escapes container ${parentSelector}: ${describe(control)}`);
            }
          }
        }
      }

      const overlap = (left, right) => {
        const width = Math.min(left.right, right.right) - Math.max(left.left, right.left);
        const height = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
        return width > 2 && height > 2;
      };

      for (const [leftSelector, rightSelector] of overlapPairs) {
        const leftElements = [...document.querySelectorAll(leftSelector)].filter(isVisible);
        const rightElements = [...document.querySelectorAll(rightSelector)].filter(isVisible);
        const pairs = Math.min(leftElements.length, rightElements.length);
        for (let index = 0; index < pairs; index += 1) {
          const left = leftElements[index];
          const right = rightElements[index];
          if (overlap(left.getBoundingClientRect(), right.getBoundingClientRect())) {
            findings.push(`layout overlap: ${describe(left)} <> ${describe(right)}`);
          }
        }
      }

      for (const element of document.querySelectorAll('.type16-celebrity-home-teaser .quiz-btn')) {
        if (!isVisible(element)) continue;
        const parent = element.closest('.type16-celebrity-home-teaser');
        if (!parent) continue;
        const rect = element.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        if (rect.right > parentRect.right + 2 || rect.left < parentRect.left - 2) {
          findings.push('celebrity CTA protrudes outside its section');
        }
      }

      return [...new Set(findings)];
    },
    {
      controlSelector: CONTROL_SELECTOR,
      textSelector: TEXT_SELECTOR,
      squareSelector: SQUARE_SELECTOR,
      containmentParents: CONTAINMENT_PARENTS,
      overlapPairs: OVERLAP_PAIRS,
    }
  );

  issues.push(...browserFindings);
  issues.push(...consoleErrors.map((item) => `console error: ${item}`));
  issues.push(...pageErrors.map((item) => `page error: ${item}`));

  if (route.screenshot && SCREENSHOT_VIEWPORTS.has(viewport.name)) {
    const file = path.join(OUTPUT_DIR, `${viewport.name}--${route.slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
  }

  return { issues: [...new Set(issues)], consoleErrors, pageErrors };
}

async function auditSitemap() {
  const response = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!response.ok) throw new Error(`Sitemap returned HTTP ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (!urls.length) throw new Error('Sitemap contains no URLs');

  const issues = [];
  for (const urlValue of urls) {
    const url = new URL(urlValue);
    const responseUrl = `${BASE_URL}${url.pathname}${url.search}`;
    const pageResponse = await fetch(responseUrl, { redirect: 'manual' });
    const html = await pageResponse.text();
    if (pageResponse.status !== 200) issues.push(`${url.pathname}: HTTP ${pageResponse.status}`);
    if (!/<title>[^<]+<\/title>/i.test(html)) issues.push(`${url.pathname}: missing title`);
    if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) issues.push(`${url.pathname}: missing H1`);
    if (!/rel="canonical" href="https:\/\/shindan24\.com\//i.test(html)) {
      issues.push(`${url.pathname}: canonical host is not shindan24.com`);
    }
    if (/\b(?:undefined|null)\b/.test(html.replace(/application\/ld\+json[\s\S]*?<\/script>/gi, ''))) {
      issues.push(`${url.pathname}: visible template token undefined/null detected`);
    }
    if (/\n\s*main>/.test(html)) issues.push(`${url.pathname}: malformed main closing detected`);
  }
  return { urlCount: urls.length, issues };
}

async function runFunctionalFlows(browser) {
  const findings = [];
  const context = await configureContext(browser, { name: 'functional', width: 1280, height: 900 });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);

  async function record(name, action) {
    try {
      await action();
    } catch (error) {
      findings.push(`${name}: ${sanitizeMessage(error.message)}`);
    }
  }

  await record('16-type 20-question completion', async () => {
    await page.goto(`${BASE_URL}/16type/test`, { waitUntil: 'domcontentloaded' });
    await page.locator('#type16-start-btn').click();
    for (let index = 0; index < 20; index += 1) {
      const firstOption = page.locator('#type16-options .quiz-option-btn').first();
      await firstOption.waitFor({ state: 'visible' });
      await firstOption.click();
    }
    await page.waitForURL(/\/16type\/r\/[A-Z]{4}/);
    if (!(await page.locator('h1').isVisible())) throw new Error('result heading is not visible');
  });

  await record('generic psychology-test completion', async () => {
    await page.goto(`${BASE_URL}/q/honto-no-seikaku`, { waitUntil: 'domcontentloaded' });
    await page.locator('#start-btn').click();
    for (let index = 0; index < 14; index += 1) {
      if (/\/q\/honto-no-seikaku\/r\//.test(page.url())) break;
      const firstOption = page.locator('#options-list .quiz-option-btn').first();
      await firstOption.waitFor({ state: 'visible' });
      await firstOption.click();
    }
    await page.waitForURL(/\/q\/honto-no-seikaku\/r\//);
    if (!(await page.locator('.result-card h1').isVisible())) throw new Error('result card is not visible');
  });

  await record('16-type compatibility form', async () => {
    await page.goto(`${BASE_URL}/16type/compatibility`, { waitUntil: 'domcontentloaded' });
    await page.selectOption('select[name="self"]', 'ENFP');
    await page.selectOption('select[name="partner"]', 'ISTJ');
    await page.selectOption('select[name="relation"]', 'friend');
    await Promise.all([
      page.waitForURL(/self=ENFP.*partner=ISTJ.*relation=friend|self=ENFP.*relation=friend.*partner=ISTJ/),
      page.locator('.type16-compat-form button[type="submit"]').click(),
    ]);
    if (!(await page.locator('.type16-compat-result').isVisible())) {
      throw new Error('compatibility result is not visible');
    }
  });

  await record('ten-stems form', async () => {
    await page.goto(`${BASE_URL}/shichuu`, { waitUntil: 'domcontentloaded' });
    await page.selectOption('#year', '1994');
    await page.selectOption('#month', '5');
    await page.selectOption('#day', '12');
    await Promise.all([
      page.waitForURL(/\/shichuu\/r\//),
      page.locator('form[action="/shichuu/compute"] button[type="submit"]').click(),
    ]);
    if (!(await page.locator('.result-card h1').isVisible())) throw new Error('ten-stems result is not visible');
  });

  await record('blood-type compatibility form', async () => {
    await page.goto(`${BASE_URL}/ketsueki`, { waitUntil: 'domcontentloaded' });
    await page.selectOption('#type', 'A');
    await page.selectOption('#partner', 'B');
    await Promise.all([
      page.waitForURL(/\/ketsueki\/r\/A\/B|\/ketsueki\/r\/B\/A/),
      page.locator('form[action="/ketsueki/compute"] button[type="submit"]').click(),
    ]);
    if (!(await page.locator('.result-card h1').isVisible())) throw new Error('blood-type result is not visible');
  });

  await record('name-fortune form', async () => {
    await page.goto(`${BASE_URL}/meimei`, { waitUntil: 'domcontentloaded' });
    await page.fill('#sei', '佐藤');
    await page.fill('#mei', '湊');
    await Promise.all([
      page.waitForURL(/\/meimei\/r\//),
      page.locator('form[action="/meimei/result"] button[type="submit"]').click(),
    ]);
    if (!(await page.locator('.seimei-table').isVisible())) throw new Error('name result table is not visible');
  });

  await context.close();
  return findings;
}

async function main() {
  ensureDirectory(OUTPUT_DIR);
  let server = null;
  let serverStdout = '';
  let serverStderr = '';
  const report = {
    auditedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    sitemap: null,
    pages: [],
    functionalFlows: [],
    failures: [],
  };

  try {
    server = startServer();
    if (server) {
      server.stdout.on('data', (chunk) => { serverStdout += chunk.toString(); });
      server.stderr.on('data', (chunk) => { serverStderr += chunk.toString(); });
    }
    await waitForServer(`${BASE_URL}/`);

    report.sitemap = await auditSitemap();
    report.failures.push(...report.sitemap.issues.map((issue) => `sitemap: ${issue}`));

    const browser = await chromium.launch({ headless: true });
    try {
      for (const viewport of VIEWPORTS) {
        const context = await configureContext(browser, viewport);
        try {
          for (const route of LAYOUT_ROUTES) {
            const page = await context.newPage();
            const result = await auditRenderedPage(page, route, viewport);
            report.pages.push({
              viewport: viewport.name,
              path: route.path,
              issues: result.issues,
            });
            for (const issue of result.issues) {
              report.failures.push(`${viewport.name} ${route.path}: ${issue}`);
            }
            await page.close();
          }
        } finally {
          await context.close();
        }
      }

      report.functionalFlows = await runFunctionalFlows(browser);
      report.failures.push(...report.functionalFlows.map((issue) => `functional: ${issue}`));
    } finally {
      await browser.close();
    }
  } catch (error) {
    report.failures.push(`quality gate crashed: ${sanitizeMessage(error.stack || error.message)}`);
  } finally {
    if (server) {
      server.kill('SIGTERM');
      await Promise.race([
        new Promise((resolve) => server.once('exit', resolve)),
        sleep(3000),
      ]);
    }
    report.serverStdout = sanitizeMessage(serverStdout);
    report.serverStderr = sanitizeMessage(serverStderr);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'quality-report.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
  }

  if (report.failures.length) {
    console.error(`FAIL: browser quality gate found ${report.failures.length} issue(s).`);
    report.failures.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log(
    `PASS: ${report.sitemap.urlCount} sitemap pages, ${LAYOUT_ROUTES.length} key routes across ${VIEWPORTS.length} viewports and 6 user flows passed.`
  );
  console.log(`Screenshots and report: ${OUTPUT_DIR}`);
}

main();
