'use strict';

// 既存の計算・ルーティングを変えず、表示層だけを検証済みの品質ラッパーで置き換えます。
const originalRender = require('./views/render');
const { createQualityRenderers } = require('./views/quality-render');

Object.assign(originalRender, createQualityRenderers(originalRender));

require('./server');
