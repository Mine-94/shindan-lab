'use strict';

// 既存の計算・ルーティングを変えず、表示層だけを検証済みの品質ラッパーで置き換えます。
const express = require('express');
const originalRender = require('./views/render');
const { createQualityRenderers } = require('./views/quality-render');

Object.assign(originalRender, createQualityRenderers(originalRender));

// 既存のsitemap生成ロジックを保ちつつ、今回追加した信頼ページだけを追記します。
const originalSend = express.response.send;
express.response.send = function qualityAwareSend(body) {
  if (
    this.req &&
    this.req.path === '/sitemap.xml' &&
    typeof body === 'string' &&
    body.includes('</urlset>') &&
    !body.includes('/about.html</loc>')
  ) {
    const trustUrls = [
      `  <url><loc>${originalRender.SITE_URL}/about.html</loc></url>`,
      `  <url><loc>${originalRender.SITE_URL}/editorial-policy.html</loc></url>`,
    ].join('\n');
    body = body.replace('</urlset>', `${trustUrls}\n</urlset>`);
  }
  return originalSend.call(this, body);
};

require('./server');
