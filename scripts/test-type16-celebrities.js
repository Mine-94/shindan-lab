'use strict';

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

function validateData() {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(VERIFIED_AT), 'VERIFIED_AT must use YYYY-MM-DD');
  assert(Object.keys(TYPE16_CELEBRITIES).length === 16, 'Celebrity data must contain 16 type keys');

  for (const code of TYPE16_CODES) {
    const people = getType16Celebrities(code);
    assert(people.length === 3, `${code} must contain exactly 3 celebrities`);
    assert(new Set(people.map((person) => person.name)).size === people.length, `${code} has duplicate names`);

    for (const person of people) {
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
}

function validateRendering() {
  const fakeOriginal = {
    escapeHtml,
    renderType16Result(code) {
      return `<!doctype html><html><head></head><body><main><h1>${code}</h1><section class="info-card">\n      <h2>関連する診断</h2><p>links</p></section></main></body></html>`;
    },
  };

  const renderer = createType16CelebrityRenderers(fakeOriginal);
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

    for (const person of people) {
      assert(html.includes(escapeHtml(person.name)), `${code}: missing celebrity ${person.name}`);
      assert(html.includes(escapeHtml(person.affiliation)), `${code}: missing affiliation for ${person.name}`);
      assert(html.includes(person.sourceUrl), `${code}: missing source for ${person.name}`);
    }
  }
}

validateData();
validateRendering();
console.log('PASS: 16 unified same-type celebrity lists, 48 sourced entries and no category grouping validated.');
