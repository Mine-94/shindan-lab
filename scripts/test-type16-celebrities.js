'use strict';

const fs = require('fs');
const path = require('path');
const {
  VERIFIED_AT,
  TYPE16_CELEBRITIES,
  getType16Celebrities,
} = require('../data/type16-celebrities');
const { createType16CelebrityRenderers } = require('../views/type16-celebrity-render');
const { TYPE16_CODES } = require('../data/type16');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function occurrences(text, needle) {
  return String(text).split(needle).length - 1;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function metadataHead(title) {
  return `<head><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title><meta name="description" content="old description" /><meta property="og:title" content="old title" /><meta property="og:description" content="old description" /><meta name="twitter:title" content="old title" /><meta name="twitter:description" content="old description" /></head>`;
}

function validateData() {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(VERIFIED_AT), 'VERIFIED_AT must use YYYY-MM-DD');
  assert(Object.keys(TYPE16_CELEBRITIES).length === 16, 'Celebrity data must contain 16 type keys');

  const allNames = [];
  for (const code of TYPE16_CODES) {
    const people = getType16Celebrities(code);
    assert(people.length === 3, `${code} must contain exactly 3 celebrities`);
    assert(new Set(people.map((person) => person.name)).size === people.length, `${code} has duplicate names`);

    for (const person of people) {
      allNames.push(person.name);
      assert(typeof person.name === 'string' && person.name.trim(), `${code} has a missing name`);
      assert(typeof person.affiliation === 'string' && person.affiliation.trim(), `${code}/${person.name} is missing affiliation`);
      assert(typeof person.visual === 'string' && person.visual.trim(), `${code}/${person.name} is missing visual`);
      assert(/^https:\/\//.test(person.sourceUrl), `${code}/${person.name} source must use HTTPS`);
      assert(typeof person.sourceLabel === 'string' && person.sourceLabel.trim(), `${code}/${person.name} is missing source label`);
      assert(!Object.prototype.hasOwnProperty.call(person, 'category'), `${code}/${person.name} must not use categories`);
      assert(!Object.prototype.hasOwnProperty.call(person, 'market'), `${code}/${person.name} must not use market grouping`);
      assert(!Object.prototype.hasOwnProperty.call(person, 'country'), `${code}/${person.name} must not use country grouping`);
    }
  }

  assert(allNames.length === 48, `Expected 48 celebrity entries, found ${allNames.length}`);
  assert(new Set(allNames).size === 48, 'Celebrity names must be unique across the directory');
}

function validateHubAndHome(renderer) {
  const home = renderer.renderHome([], []);
  assert(home.includes('data-type16-celebrity-home-teaser'), 'Home celebrity teaser is missing');
  assert(home.includes('推し・有名人から16タイプを探す'), 'Home teaser heading is missing');
  assert(home.includes('/16type#celebrity-directory'), 'Home teaser destination is missing');
  assert(home.includes('BTS、BIGBANG、BLACKPINK'), 'Home teaser priority names are missing');
  assert(occurrences(home, '/css/type16-celebrities.css') === 1, 'Home celebrity CSS must appear once');
  assert(occurrences(home, '/js/type16-celebrities.js') === 1, 'Home celebrity JS must appear once');
  assert(
    home.indexOf('data-type16-celebrity-home-teaser') > home.indexOf('/js/home-priority.js'),
    'Home celebrity teaser must follow the priority block'
  );

  const hub = renderer.renderType16Hub();
  assert(hub.includes('data-type16-celebrity-directory'), 'Celebrity directory is missing from the 16-type hub');
  assert(hub.includes('id="celebrity-directory"'), 'Celebrity directory anchor is missing');
  assert(hub.includes('推し・有名人から16タイプを探す'), 'Celebrity directory heading is missing');
  assert(hub.includes('名前・グループ名・4文字タイプで検索'), 'Celebrity directory search label is missing');
  assert(hub.includes('data-type16-celebrity-search'), 'Celebrity directory search input is missing');
  assert(hub.includes('data-type16-celebrity-toggle'), 'Celebrity directory expansion control is missing');
  assert(occurrences(hub, 'class="type16-celebrity-directory-grid is-collapsed"') === 1, 'Hub must contain one unified celebrity grid');
  assert(occurrences(hub, 'class="type16-celebrity-directory-card"') === 48, 'Hub must render all 48 celebrity cards');
  assert(occurrences(hub, '/css/type16-celebrities.css') === 1, 'Hub celebrity CSS must appear once');
  assert(occurrences(hub, '/js/type16-celebrities.js') === 1, 'Hub celebrity JS must appear once');
  assert(hub.indexOf('data-type16-celebrity-directory') < hub.indexOf('type16-disclaimer'), 'Celebrity directory must precede the disclaimer');
  assert(hub.includes('<title>16タイプ性格一覧・有名人｜BTS・BLACKPINK・無料診断</title>'), 'Hub SEO title is missing');
  assert(hub.includes('公表済み有名人48人を一つの一覧で紹介'), 'Hub SEO description is missing');
  assert(hub.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'), 'Hub viewport metadata changed');
  assert(!hub.includes('日本の有名人'), 'Hub must not use a Japanese celebrity category heading');
  assert(!hub.includes('韓国の有名人'), 'Hub must not use a Korean celebrity category heading');
  assert(!hub.includes('海外の有名人'), 'Hub must not use an overseas celebrity category heading');

  for (const code of TYPE16_CODES) {
    assert(hub.includes(`href="/16type/r/${code}"`), `Hub is missing a type link for ${code}`);
    for (const person of getType16Celebrities(code)) {
      assert(hub.includes(escapeHtml(person.name)), `Hub is missing celebrity ${person.name}`);
      assert(hub.includes(escapeHtml(person.affiliation)), `Hub is missing affiliation for ${person.name}`);
      assert(hub.includes(person.sourceUrl), `Hub is missing source for ${person.name}`);
    }
  }

  assert(hub.indexOf('JENNIE') < hub.indexOf('リュジン'), 'High-recognition priority ordering was not applied');
  assert(hub.indexOf('G-DRAGON') < hub.indexOf('日高里菜'), 'BIGBANG priority ordering was not applied');
}

function validateResultRendering(renderer) {
  for (const code of TYPE16_CODES) {
    const html = renderer.renderType16Result(code);
    const people = getType16Celebrities(code);

    assert(html.includes('data-type16-celebrity-section'), `${code}: celebrity section is missing`);
    assert(html.includes(`あなたと同じ${code}タイプとして公表された有名人`), `${code}: heading is wrong`);
    assert(occurrences(html, 'class="type16-celebrity-grid"') === 1, `${code}: must render one unified celebrity list`);
    assert(occurrences(html, 'class="type16-celebrity-card"') === 3, `${code}: must render 3 celebrity cards`);
    assert(occurrences(html, '/css/type16-celebrities.css') === 1, `${code}: celebrity CSS must appear once`);
    assert(occurrences(html, '/js/type16-celebrities.js') === 1, `${code}: celebrity JS must appear once`);
    assert(html.indexOf('data-type16-celebrity-section') < html.indexOf('関連する診断'), `${code}: section must precede related tests`);
    assert(!html.includes('日本の有名人'), `${code}: country category heading must not appear`);
    assert(!html.includes('韓国の有名人'), `${code}: country category heading must not appear`);
    assert(!html.includes('海外の有名人'), `${code}: country category heading must not appear`);
    assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0" />'), `${code}: viewport metadata changed`);
    assert(html.includes(`<title>${code}の有名人・芸能人｜性格・恋愛・仕事の16タイプ解説</title>`), `${code}: SEO title is missing`);
    assert(html.includes('<meta name="description" content="'), `${code}: description metadata is missing`);
    assert(html.includes('同じタイプとして公表された有名人を紹介'), `${code}: celebrity description is missing`);

    for (const person of people) {
      assert(html.includes(escapeHtml(person.name)), `${code}: missing celebrity ${person.name}`);
      assert(html.includes(escapeHtml(person.affiliation)), `${code}: missing affiliation for ${person.name}`);
      assert(html.includes(person.sourceUrl), `${code}: missing source for ${person.name}`);
    }
  }
}

function validateClientAssets() {
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'type16-celebrities.js'), 'utf8');
  const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'type16-celebrities.css'), 'utf8');

  for (const eventName of [
    'type16_celebrity_section_view',
    'type16_celebrity_directory_view',
    'type16_celebrity_directory_search',
    'type16_celebrity_profile_click',
    'type16_celebrity_directory_cta_click',
  ]) {
    assert(script.includes(eventName), `Client tracking event is missing: ${eventName}`);
  }
  assert(script.includes('query_length'), 'Search analytics must record length instead of the actual query');
  assert(!script.includes('search_query:'), 'Search analytics must not send the entered celebrity name');
  assert(styles.includes('.type16-celebrity-directory-grid'), 'Directory grid styles are missing');
  assert(styles.includes('.is-collapsed'), 'Directory collapse styles are missing');
  assert(styles.includes('@media (max-width: 520px)'), 'Mobile directory styles are missing');
}

function validateRendering() {
  const fakeOriginal = {
    escapeHtml,
    renderHome() {
      return `<!doctype html><html>${metadataHead('home')}<body><main><section>priority</section><script src="/js/home-priority.js"></script><section>regular content</section></main></body></html>`;
    },
    renderType16Hub() {
      return `<!doctype html><html>${metadataHead('hub')}<body><main><h1>16タイプ</h1><section>types</section><aside class="type16-disclaimer">notice</aside></main></body></html>`;
    },
    renderType16Result(code) {
      return `<!doctype html><html>${metadataHead(`${code} old title`)}<body><main><h1>${code}</h1><section class="info-card">\n      <h2>関連する診断</h2><p>links</p></section></main></body></html>`;
    },
  };

  const renderer = createType16CelebrityRenderers(fakeOriginal);
  validateHubAndHome(renderer);
  validateResultRendering(renderer);
}

validateData();
validateRendering();
validateClientAssets();
console.log('PASS: 16 same-type result lists, one searchable 48-person celebrity directory, homepage discovery CTA, privacy-safe analytics and no category grouping validated.');
