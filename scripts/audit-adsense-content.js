'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3019;
const BASE = `http://127.0.0.1:${PORT}`;
const OFFICIAL = 'https://shindan24.com';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)));
}

function stripHtml(value) {
  return decodeEntities(
    String(value || '')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOne(html, pattern) {
  const match = String(html).match(pattern);
  return match ? stripHtml(match[1]) : '';
}

function visibleMain(html) {
  const main = String(html).match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return stripHtml(main ? main[1] : html);
}

function normalizedForSimilarity(text) {
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[a-z]{4}/g, 'TYPE')
    .replace(/[0-9０-９]+/g, '#')
    .replace(/[\s、。・「」『』（）()！？!?：:｜|／/\-–—]+/g, '')
    .replace(/しんだんラボ/g, '')
    .slice(0, 12000);
}

function trigrams(text) {
  const normalized = normalizedForSimilarity(text);
  const values = new Set();
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    values.add(normalized.slice(index, index + 3));
  }
  return values;
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = left.size <= right.size ? right : left;
  for (const item of smaller) {
    if (larger.has(item)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function pageFamily(pathname) {
  if (pathname === '/') return 'home';
  if (/^\/guide(?:\/|$)/.test(pathname)) return 'guide';
  if (/^\/(updates|sitemap)\.html$/.test(pathname)) return 'site-info';
  if (/^\/(about|contact|privacy|terms|editorial-policy)\.html$/.test(pathname)) return 'trust';
  if (/^\/16type\/r\//.test(pathname)) return '16type-result';
  if (/^\/16type\/(love|friend|work|family)$/.test(pathname)) return 'relation-guide';
  if (/^\/16type/.test(pathname)) return '16type-tool';
  if (/^\/q\//.test(pathname)) return 'quiz';
  if (/^\/shichuu\/r\//.test(pathname)) return 'stem-result';
  if (/^\/ketsueki\/r\/[^/]+\/[^/]+$/.test(pathname)) return 'blood-pair';
  if (/^\/ketsueki\/r\//.test(pathname)) return 'blood-result';
  if (pathname === '/shichuu' || pathname === '/ketsueki' || pathname === '/meimei') return 'fortune-tool';
  return 'other';
}

function analyze(pathname, html, response) {
  const mainText = visibleMain(html);
  const compactLength = mainText.replace(/\s/g, '').length;
  const title = matchOne(html, /<title>([\s\S]*?)<\/title>/i);
  const h1 = matchOne(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const descriptionMatch = String(html).match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i);
  const description = descriptionMatch ? decodeEntities(descriptionMatch[1]).trim() : '';
  const canonicalMatch = String(html).match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  const h2Count = (String(html).match(/<h2\b/gi) || []).length;
  const paragraphCount = (String(html).match(/<p\b/gi) || []).length;
  const internalLinks = [...String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/')).length;
  const adLoaders = (String(html).match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g) || []).length;
  const noindex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
    String(response.headers.get('x-robots-tag') || '').toLowerCase().includes('noindex');

  const warnings = [];
  if (response.status !== 200) warnings.push(`HTTP ${response.status}`);
  if (!title) warnings.push('missing title');
  if (!h1) warnings.push('missing H1');
  if (description.length < 50) warnings.push('short meta description');
  if (!canonical.startsWith(OFFICIAL)) warnings.push('non-canonical host');
  if (!String(html).includes('href="/contact.html"')) warnings.push('missing contact navigation');
  if (adLoaders > 1) warnings.push('duplicate AdSense loader');
  if (compactLength < 350) warnings.push('very low main-text depth');
  else if (compactLength < 550) warnings.push('low main-text depth');
  if (paragraphCount < 3) warnings.push('few explanatory paragraphs');
  if (internalLinks < 2) warnings.push('weak internal navigation');

  return {
    path: pathname,
    family: pageFamily(pathname),
    status: response.status,
    title,
    h1,
    descriptionLength: description.length,
    mainLength: compactLength,
    h2Count,
    paragraphCount,
    internalLinks,
    adLoaders,
    noindex,
    canonical,
    warnings,
    mainText,
    shingles: trigrams(mainText),
  };
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
  throw lastError || new Error('Audit server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: OFFICIAL,
      ADSENSE_CLIENT_ID: 'ca-pub-8602848692420724',
      GA_MEASUREMENT_ID: 'G-AUDIT1234',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer();
    const sitemapResponse = await fetch(`${BASE}/sitemap.xml`);
    const sitemap = await sitemapResponse.text();
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert(urls.length === 66, `Expected 66 sitemap URLs, got ${urls.length}`);

    const pages = [];
    for (const url of urls) {
      const officialUrl = new URL(url);
      const pathname = `${officialUrl.pathname}${officialUrl.search}`;
      const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
      const html = await response.text();
      pages.push(analyze(officialUrl.pathname, html, response));
    }

    const duplicatePairs = [];
    for (let leftIndex = 0; leftIndex < pages.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < pages.length; rightIndex += 1) {
        const left = pages[leftIndex];
        const right = pages[rightIndex];
        if (left.family !== right.family) continue;
        const similarity = jaccard(left.shingles, right.shingles);
        if (similarity >= 0.78) {
          duplicatePairs.push({ left: left.path, right: right.path, similarity });
        }
      }
    }

    const sorted = [...pages].sort((a, b) => a.mainLength - b.mainLength);
    const warningPages = pages.filter((page) => page.warnings.length);
    const lowDepth = pages.filter((page) => page.mainLength < 550);
    const average = Math.round(pages.reduce((total, page) => total + page.mainLength, 0) / pages.length);
    const median = sorted[Math.floor(sorted.length / 2)].mainLength;

    console.log('=== ADSENSE CONTENT DEPTH AUDIT ===');
    console.log(`Pages: ${pages.length}`);
    console.log(`Average main-text characters: ${average}`);
    console.log(`Median main-text characters: ${median}`);
    console.log(`Pages below internal 550-character review line: ${lowDepth.length}`);
    console.log(`Same-family pairs at or above 0.78 trigram similarity: ${duplicatePairs.length}`);
    console.log('Note: 550 characters and 0.78 similarity are internal audit heuristics, not Google requirements.');

    console.log('\n=== 20 SHORTEST INDEXABLE PAGES ===');
    sorted.slice(0, 20).forEach((page) => {
      console.log(
        `${String(page.mainLength).padStart(5)} chars | ${page.family.padEnd(13)} | ${page.path} | ${page.warnings.join('; ') || 'OK'}`
      );
    });

    console.log('\n=== WARNING PAGES ===');
    if (!warningPages.length) console.log('none');
    warningPages.forEach((page) => {
      console.log(`${page.path}: ${page.warnings.join('; ')}`);
    });

    console.log('\n=== HIGH-SIMILARITY PAIRS ===');
    if (!duplicatePairs.length) console.log('none');
    duplicatePairs
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 40)
      .forEach((pair) => {
        console.log(`${pair.similarity.toFixed(3)} | ${pair.left} <> ${pair.right}`);
      });

    console.log('\n=== FAMILY SUMMARY ===');
    const families = new Map();
    for (const page of pages) {
      const group = families.get(page.family) || [];
      group.push(page.mainLength);
      families.set(page.family, group);
    }
    for (const [family, lengths] of [...families.entries()].sort()) {
      lengths.sort((a, b) => a - b);
      const familyAverage = Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length);
      const familyMedian = lengths[Math.floor(lengths.length / 2)];
      console.log(`${family.padEnd(15)} pages=${String(lengths.length).padStart(2)} min=${String(lengths[0]).padStart(4)} median=${String(familyMedian).padStart(4)} avg=${String(familyAverage).padStart(4)}`);
    }

    const hardFailures = pages.filter((page) =>
      page.status !== 200 ||
      !page.title ||
      !page.h1 ||
      !page.canonical.startsWith(OFFICIAL) ||
      page.adLoaders > 1
    );
    assert(hardFailures.length === 0, `Hard page-quality failures: ${hardFailures.map((page) => page.path).join(', ')}`);
    console.log('\nPASS: all 66 sitemap pages have 200 status, title, H1, canonical official host and no duplicate AdSense loader.');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }

  if (stderr.trim()) console.error(stderr.trim());
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
