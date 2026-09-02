(() => {
  'use strict';

  const WIDTH = 1080;
  const HEIGHT = 1350;
  const FONT_FAMILY = '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  function setStatus(panel, message, state) {
    const status = panel.querySelector('[data-type16-share-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function readPayload(panel) {
    const script = panel.querySelector('.type16-share-data');
    if (!script) throw new Error('共有画像データが見つかりません。');
    const payload = JSON.parse(script.textContent || '{}');
    if (!payload.kind || !payload.url || !payload.filename) {
      throw new Error('共有画像データが不完全です。');
    }
    return payload;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    roundedRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function drawDecorations(ctx, palette) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.arc(104, 146, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1006, 1180, 290, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(960, 128, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function wrapText(ctx, text, maxWidth, maxLines) {
    const lines = [];
    const paragraphs = String(text || '').split(/\n/);

    for (const paragraph of paragraphs) {
      let line = '';
      for (const character of paragraph) {
        const candidate = line + character;
        if (line && ctx.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = character;
          if (lines.length >= maxLines) break;
        } else {
          line = candidate;
        }
      }
      if (lines.length >= maxLines) break;
      if (line) lines.push(line);
      if (!paragraph && lines.length < maxLines) lines.push('');
    }

    if (lines.length > maxLines) lines.length = maxLines;
    if (lines.length === maxLines && ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
      while (
        lines[maxLines - 1].length > 1 &&
        ctx.measureText(`${lines[maxLines - 1]}…`).width > maxWidth
      ) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
      }
      lines[maxLines - 1] += '…';
    }
    return lines;
  }

  function drawCenteredLines(ctx, lines, centerX, startY, lineHeight) {
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });
  }

  function drawBrand(ctx, label) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = `700 28px ${FONT_FAMILY}`;
    ctx.fillText('しんだんラボ', 72, 70);

    ctx.textAlign = 'right';
    ctx.font = `700 24px ${FONT_FAMILY}`;
    ctx.fillText(label, WIDTH - 72, 70);
  }

  function drawFooter(ctx, text) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = `500 24px ${FONT_FAMILY}`;
    ctx.fillText(text, WIDTH / 2, 1278);
    ctx.font = `700 22px ${FONT_FAMILY}`;
    ctx.fillText('shindan-lab.onrender.com', WIDTH / 2, 1320);
  }

  function drawAxisRows(ctx, axes, x, y, width) {
    if (!Array.isArray(axes) || !axes.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6b6480';
      ctx.font = `500 27px ${FONT_FAMILY}`;
      ctx.fillText('20問の回答傾向から見る4文字タイプ', WIDTH / 2, y + 30);
      return;
    }

    axes.forEach((axis, index) => {
      const rowY = y + index * 86;
      const leftPct = Math.max(0, Math.min(100, Number(axis.leftPct) || 0));
      const rightPct = 100 - leftPct;

      ctx.textBaseline = 'middle';
      ctx.font = `700 24px ${FONT_FAMILY}`;
      ctx.fillStyle = '#4b4560';
      ctx.textAlign = 'left';
      ctx.fillText(`${axis.left} ${leftPct}%`, x, rowY);
      ctx.textAlign = 'right';
      ctx.fillText(`${rightPct}% ${axis.right}`, x + width, rowY);

      fillRoundedRect(ctx, x, rowY + 25, width, 16, 8, '#e7e2f1');
      if (leftPct > 0) {
        const gradient = ctx.createLinearGradient(x, rowY, x + width, rowY);
        gradient.addColorStop(0, '#6f5cd7');
        gradient.addColorStop(1, '#ad91eb');
        fillRoundedRect(ctx, x, rowY + 25, width * (leftPct / 100), 16, 8, gradient);
      }
    });
  }

  function drawTypeCard(ctx, payload) {
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#6f5cd7');
    background.addColorStop(1, '#352d67');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawDecorations(ctx, { glow: '#cbbcff' });
    drawBrand(ctx, '16 TYPE RESULT');

    fillRoundedRect(ctx, 68, 122, 944, 1090, 48, '#ffffff');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6f5cd7';
    ctx.font = `900 132px ${FONT_FAMILY}`;
    ctx.fillText(payload.code, WIDTH / 2, 300);

    ctx.font = `700 74px ${FONT_FAMILY}`;
    ctx.fillText(payload.emoji || '🧩', WIDTH / 2, 438);

    ctx.fillStyle = '#282336';
    ctx.font = `900 54px ${FONT_FAMILY}`;
    ctx.fillText(payload.name, WIDTH / 2, 540);

    ctx.fillStyle = '#615a70';
    ctx.font = `500 31px ${FONT_FAMILY}`;
    const taglineLines = wrapText(ctx, payload.tagline, 760, 3);
    drawCenteredLines(ctx, taglineLines, WIDTH / 2, 615, 48);

    ctx.strokeStyle = '#eeeaf4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 750);
    ctx.lineTo(920, 750);
    ctx.stroke();

    drawAxisRows(ctx, payload.axes, 175, 810, 730);

    ctx.fillStyle = '#81798e';
    ctx.font = `500 23px ${FONT_FAMILY}`;
    ctx.fillText('数値は性格の強さではなく、今回の回答割合です', WIDTH / 2, 1160);

    drawFooter(ctx, '公式MBTI®ではない独自のエンタメ診断');
  }

  function drawCompatibilityCard(ctx, payload) {
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#e26d8a');
    background.addColorStop(0.55, '#a45e9e');
    background.addColorStop(1, '#564078');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawDecorations(ctx, { glow: '#ffd6e3' });
    drawBrand(ctx, 'COMPATIBILITY');

    fillRoundedRect(ctx, 68, 122, 944, 1090, 48, '#ffffff');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b75476';
    ctx.font = `800 30px ${FONT_FAMILY}`;
    ctx.fillText(`${payload.relationLabel}の相性目安`, WIDTH / 2, 202);

    const leftX = 298;
    const rightX = 782;
    ctx.fillStyle = '#342b42';
    ctx.font = `900 68px ${FONT_FAMILY}`;
    ctx.fillText(payload.self.code, leftX, 350);
    ctx.fillText(payload.partner.code, rightX, 350);

    ctx.font = `700 64px ${FONT_FAMILY}`;
    ctx.fillText(payload.self.emoji || '🧩', leftX, 270);
    ctx.fillText(payload.partner.emoji || '🧩', rightX, 270);

    ctx.fillStyle = '#6d6575';
    ctx.font = `600 25px ${FONT_FAMILY}`;
    const selfName = wrapText(ctx, payload.self.name, 280, 2);
    const partnerName = wrapText(ctx, payload.partner.name, 280, 2);
    drawCenteredLines(ctx, selfName, leftX, 420, 34);
    drawCenteredLines(ctx, partnerName, rightX, 420, 34);

    ctx.fillStyle = '#a45e9e';
    ctx.font = `900 58px ${FONT_FAMILY}`;
    ctx.fillText('×', WIDTH / 2, 340);

    fillRoundedRect(ctx, 260, 510, 560, 250, 36, '#f9f2f7');
    ctx.fillStyle = '#b75476';
    ctx.font = `900 132px ${FONT_FAMILY}`;
    ctx.fillText(String(payload.score), WIDTH / 2 - 12, 616);
    ctx.font = `700 34px ${FONT_FAMILY}`;
    ctx.fillText('/ 100', WIDTH / 2 + 120, 648);
    ctx.fillStyle = '#4f4558';
    ctx.font = `800 31px ${FONT_FAMILY}`;
    ctx.fillText(payload.label, WIDTH / 2, 708);

    ctx.fillStyle = '#342b42';
    ctx.font = `900 34px ${FONT_FAMILY}`;
    ctx.fillText('まず試したい会話のコツ', WIDTH / 2, 840);

    ctx.fillStyle = '#5d5564';
    ctx.font = `500 31px ${FONT_FAMILY}`;
    const tipLines = wrapText(ctx, payload.mainTip, 760, 5);
    drawCenteredLines(ctx, tipLines, WIDTH / 2, 915, 48);

    ctx.fillStyle = '#81798e';
    ctx.font = `500 23px ${FONT_FAMILY}`;
    ctx.fillText(
      `同じ傾向 ${payload.sameCount}個 / 異なる傾向 ${payload.differentCount}個`,
      WIDTH / 2,
      1158
    );

    drawFooter(ctx, '相性は関係の良し悪しを断定するものではありません');
  }

  function createCanvas(payload) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('画像を作成できないブラウザです。');

    if (payload.kind === 'type') {
      drawTypeCard(ctx, payload);
    } else if (payload.kind === 'compatibility') {
      drawCompatibilityCard(ctx, payload);
    } else {
      throw new Error('対応していない共有画像です。');
    }
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画像ファイルを作成できませんでした。'));
      }, 'image/png');
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function attributedShareUrl(rawUrl, method) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin === window.location.origin) {
        url.searchParams.set('utm_source', 'share_card');
        url.searchParams.set('utm_medium', method);
        url.searchParams.set('utm_campaign', 'organic_share');
      }
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  function analyticsParams(payload, method) {
    return {
      share_kind: payload.kind,
      method,
      type_code: payload.code || (payload.self && payload.self.code) || '',
      partner_code: payload.partner ? payload.partner.code : '',
      relation: payload.relation || '',
      page_path: window.location.pathname,
    };
  }

  async function makeAndShare(panel, button) {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '画像を作成中…';
    setStatus(panel, '', '');

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const payload = readPayload(panel);
      const canvas = createCanvas(payload);
      const blob = await canvasToBlob(canvas);
      const file =
        typeof File === 'function'
          ? new File([blob], payload.filename, { type: 'image/png' })
          : null;
      const canShareFile = Boolean(
        file &&
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
      );

      if (canShareFile) {
        try {
          const sharedUrl = attributedShareUrl(payload.url, 'image_web_share');
          await navigator.share({
            files: [file],
            title: payload.title,
            text: `${payload.shareText}
${sharedUrl}`,
            url: sharedUrl,
          });
          track('type16_share_card', analyticsParams(payload, 'web_share_file'));
          track('share_success', {
            method: 'image_web_share',
            page_path: window.location.pathname,
          });
          setStatus(panel, '共有メニューを開きました。', 'success');
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') {
            setStatus(panel, '画像の共有をキャンセルしました。', 'neutral');
            return;
          }
        }
      }

      downloadBlob(blob, payload.filename);
      const downloadUrl = attributedShareUrl(payload.url, 'download_png');
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(`${payload.shareText}
${downloadUrl}`);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      track('type16_share_card', analyticsParams(payload, 'download_png'));
      setStatus(
        panel,
        copied
          ? '画像を保存し、投稿用の文章とリンクもコピーしました。'
          : '画像を保存しました。Instagram・Threads・Xなどで使えます。',
        'success'
      );
    } catch (error) {
      console.error(error);
      setStatus(panel, '画像を作成できませんでした。結果リンクをご利用ください。', 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function setupPanel(panel) {
    const button = panel.querySelector('[data-type16-share-image]');
    if (!button) return;
    button.addEventListener('click', () => makeAndShare(panel, button));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-type16-share]').forEach(setupPanel);
  });
})();
