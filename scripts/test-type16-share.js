'use strict';

const fs = require('fs');
const path = require('path');
const baseRender = require('../views/render');
const { createQualityRenderers } = require('../views/quality-render');
const { createType16Renderers } = require('../views/type16-render');
const {
  SHARE_CARD_VERSION,
  createType16ShareRenderers,
} = require('../views/type16-share-render');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function buildRenderStack() {
  const qualityLayer = {
    ...baseRender,
    ...createQualityRenderers({ ...baseRender }),
  };
  const type16Layer = {
    ...qualityLayer,
    ...createType16Renderers({ ...qualityLayer }),
  };
  return {
    ...type16Layer,
    ...createType16ShareRenderers({ ...type16Layer }),
  };
}

function readPayload(html) {
  const match = html.match(
    /<script type="application\/json" class="type16-share-data">([\s\S]*?)<\/script>/
  );
  assert(match, 'Share payload script is missing');
  return JSON.parse(match[1]);
}

function main() {
  const render = buildRenderStack();

  const typeHtml = render.renderType16Result('ENFP', {
    e: '80',
    s: '20',
    t: '20',
    j: '20',
  });
  assert(typeHtml.includes('data-type16-share-kind="type"'), 'Type share panel is missing');
  assert(
    typeHtml.includes(`data-type16-share-version="${SHARE_CARD_VERSION}"`),
    'Type share version is missing'
  );
  assert(typeHtml.includes('結果を4:5画像でシェア'), 'Type share heading is missing');
  assert(typeHtml.includes('1080×1350px'), 'Share image dimensions are missing');
  assert(typeHtml.includes('id="copy-link-btn"'), 'Type result link-share button is missing');
  assert(typeHtml.includes('/js/result-share.js'), 'Type result link-share script is missing');
  assert(typeHtml.includes('/js/type16-share-card.js'), 'Type image-share script is missing');
  assert(typeHtml.includes('/css/type16-share.css'), 'Type share stylesheet is missing');
  assert(count(typeHtml, '/js/type16-share-card.js') === 1, 'Type share script is duplicated');
  assert(count(typeHtml, '/css/type16-share.css') === 1, 'Type share stylesheet is duplicated');

  const typePayload = readPayload(typeHtml);
  assert(typePayload.kind === 'type', 'Type payload kind is invalid');
  assert(typePayload.code === 'ENFP', 'Type payload code is invalid');
  assert(typePayload.axes.length === 4, 'Type payload must include four axes');
  assert(typePayload.axes[0].leftPct === 80, 'Type payload axis percentage is invalid');
  assert(typePayload.axes[0].rightPct === 20, 'Type payload opposite percentage is invalid');
  assert(
    typePayload.url.endsWith('/16type/r/ENFP?e=80&s=20&t=20&j=20'),
    'Type payload should preserve answer percentages in the shared URL'
  );
  assert(typePayload.filename === 'shindan-lab-16type-ENFP.png', 'Type filename is invalid');

  const canonicalTypeHtml = render.renderType16Result('ISTJ');
  const canonicalPayload = readPayload(canonicalTypeHtml);
  assert(canonicalPayload.axes.length === 0, 'Canonical type page should not invent percentages');
  assert(
    canonicalPayload.url.endsWith('/16type/r/ISTJ'),
    'Canonical type share URL should not contain empty query parameters'
  );

  const compatibilityHtml = render.renderType16Compatibility({
    self: 'ENFP',
    partner: 'ISTJ',
    relation: 'friend',
  });
  assert(
    compatibilityHtml.includes('data-type16-share-kind="compatibility"'),
    'Compatibility share panel is missing'
  );
  assert(
    compatibilityHtml.includes('二人の結果を画像でシェア'),
    'Compatibility share heading is missing'
  );
  assert(
    compatibilityHtml.includes('相性画像を作ってシェア'),
    'Compatibility image-share button is missing'
  );
  assert(
    count(compatibilityHtml, 'id="copy-link-btn"') === 1,
    'Compatibility page must keep exactly one link-share button'
  );
  assert(
    count(compatibilityHtml, '/js/result-share.js') === 1,
    'Compatibility link-share script is duplicated'
  );
  assert(
    count(compatibilityHtml, '/js/type16-share-card.js') === 1,
    'Compatibility image-share script is duplicated'
  );

  const compatibilityPayload = readPayload(compatibilityHtml);
  assert(compatibilityPayload.kind === 'compatibility', 'Compatibility payload kind is invalid');
  assert(compatibilityPayload.self.code === 'ENFP', 'Compatibility self code is invalid');
  assert(compatibilityPayload.partner.code === 'ISTJ', 'Compatibility partner code is invalid');
  assert(compatibilityPayload.relation === 'friend', 'Compatibility relation is invalid');
  assert(
    Number.isInteger(compatibilityPayload.score) &&
      compatibilityPayload.score >= 0 &&
      compatibilityPayload.score <= 100,
    'Compatibility score is invalid'
  );
  assert(compatibilityPayload.mainTip.length >= 10, 'Compatibility main tip is too short');
  assert(
    compatibilityPayload.url.includes('self=ENFP&partner=ISTJ&relation=friend'),
    'Compatibility shared URL is invalid'
  );

  const emptyCompatibility = render.renderType16Compatibility({});
  assert(
    !emptyCompatibility.includes('data-type16-share'),
    'Empty compatibility form must not include a result share card'
  );
  assert(
    !emptyCompatibility.includes('/js/type16-share-card.js'),
    'Empty compatibility form must not load the share-card script'
  );

  const partialCompatibility = render.renderType16Compatibility({ self: 'ENFP' });
  assert(
    !partialCompatibility.includes('data-type16-share'),
    'Partial compatibility input must not include a result share card'
  );

  const clientSource = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'type16-share-card.js'),
    'utf8'
  );
  assert(clientSource.includes('const WIDTH = 1080;'), 'Canvas width must be 1080px');
  assert(clientSource.includes('const HEIGHT = 1350;'), 'Canvas height must be 1350px');
  assert(clientSource.includes("canvas.toBlob"), 'Client must export a PNG blob');
  assert(clientSource.includes("navigator.canShare"), 'Client file sharing capability check is missing');
  assert(clientSource.includes("download_png"), 'Desktop download fallback tracking is missing');
  assert(clientSource.includes("type16_share_card"), 'Share-card analytics event is missing');

  const cssSource = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'css', 'type16-share.css'),
    'utf8'
  );
  assert(cssSource.includes('aspect-ratio: 4 / 5'), 'Preview must use a 4:5 aspect ratio');
  assert(cssSource.includes('@media (max-width: 720px)'), 'Mobile layout is missing');

  console.log(
    `PASS: ${SHARE_CARD_VERSION} type and compatibility share cards, payloads, 1080x1350 PNG generation and fallbacks validated.`
  );
}

main();
