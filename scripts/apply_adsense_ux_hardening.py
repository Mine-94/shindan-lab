#!/usr/bin/env python3
"""Apply the 2026-09-03 AdSense UX, navigation and inventory hardening."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEW_DATE = "2026-09-03"
PUBLISHER_ID = "ca-pub-8602848692420724"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def remove_google_fonts(text: str) -> str:
    lines = (
        '<link rel="preconnect" href="https://fonts.googleapis.com" />\n',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n',
        '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />\n',
        '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n',
        '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n',
        '  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />\n',
    )
    for line in lines:
        text = text.replace(line, "")
    return text


def nav_markup(indent: str = "      ") -> str:
    return "\n".join(
        [
            f'{indent}<div class="site-header-row">',
            f'{indent}  <a href="/" class="logo">しんだんラボ</a>',
            f'{indent}  <nav class="site-nav" aria-label="主要メニュー">',
            f'{indent}    <a href="/16type">16タイプ</a>',
            f'{indent}    <a href="/16type/compatibility">相性</a>',
            f'{indent}    <a href="/q/honto-no-seikaku">心理テスト</a>',
            f'{indent}    <a href="/ketsueki">占い</a>',
            f'{indent}    <a href="/about.html">運営情報</a>',
            f'{indent}    <a href="/contact.html">お問い合わせ</a>',
            f'{indent}  </nav>',
            f'{indent}</div>',
        ]
    )


def patch_render() -> None:
    path = "views/render.js"
    text = read(path)

    old_ads = "const ADSENSE_CLIENT_ID = process.env.ADSENSE_CLIENT_ID || ''; // 例: ca-pub-8602848692420724"
    new_ads = f"""const ADSENSE_CLIENT_ID = /^ca-pub-\\d+$/.test(process.env.ADSENSE_CLIENT_ID || '')
  ? process.env.ADSENSE_CLIENT_ID
  : '{PUBLISHER_ID}';"""
    if new_ads not in text:
        text = replace_once(text, old_ads, new_ads, "AdSense client")

    referrer_meta = '<meta name="referrer" content="strict-origin-when-cross-origin" />'
    if referrer_meta not in text:
        text = replace_once(
            text,
            '<meta name="author" content="しんだんラボ編集部" />\n<meta name="robots" content="max-image-preview:large" />',
            f'<meta name="author" content="しんだんラボ編集部" />\n{referrer_meta}\n<meta name="robots" content="max-image-preview:large" />',
            "referrer meta",
        )

    text = remove_google_fonts(text)

    old_nav = """function siteHeaderNav() {
  return `<a href="/" class="logo">しんだんラボ</a>`;
}"""
    new_nav = """function siteHeaderNav() {
  return `<div class="site-header-row">
    <a href="/" class="logo">しんだんラボ</a>
    <nav class="site-nav" aria-label="主要メニュー">
      <a href="/16type">16タイプ</a>
      <a href="/16type/compatibility">相性</a>
      <a href="/q/honto-no-seikaku">心理テスト</a>
      <a href="/ketsueki">占い</a>
      <a href="/about.html">運営情報</a>
      <a href="/contact.html">お問い合わせ</a>
    </nav>
  </div>`;
}"""
    if new_nav not in text:
        text = replace_once(text, old_nav, new_nav, "site header navigation")

    review_block = f"""<section class="content-review container" aria-label="編集情報">
  <p>内容確認：しんだんラボ編集部（最終確認：2026年9月3日）</p>
  <p><a href="/editorial-policy.html">制作・確認方法</a><span aria-hidden="true"> · </span><a href="/contact.html">訂正を連絡する</a></p>
</section>
"""
    if 'class="content-review container"' not in text:
        text = replace_once(
            text,
            '${content}\n<footer class="site-footer">',
            '${content}\n' + review_block + '<footer class="site-footer">',
            "visible editorial review block",
        )

    write(path, text)


def patch_server() -> None:
    path = "server.js"
    text = read(path)

    constants_old = """const ADSENSE_PUBLISHER_ID = (process.env.ADSENSE_CLIENT_ID || 'ca-pub-8602848692420724').replace(/^ca-/, '');
const LEGACY_HOST = 'shindan-lab.onrender.com';"""
    constants_new = f"""const ADSENSE_PUBLISHER_ID = (process.env.ADSENSE_CLIENT_ID || '{PUBLISHER_ID}').replace(/^ca-/, '');
const LEGACY_HOST = 'shindan-lab.onrender.com';
const CANONICAL_HOST = 'shindan24.com';
const SITEMAP_LASTMOD = '{REVIEW_DATE}';"""
    if constants_new not in text:
        text = replace_once(text, constants_old, constants_new, "server constants")

    old_middlewares = """const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 静的リソース(css/js)もこのリミッターを通過するため、1ページ閲覧だけで複数リクエストを消費します。
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 検索シグナルがRenderの既定アドレスと公式ドメインに分かれないよう一本化します。
app.use((req, res, next) => {
  if (String(req.hostname || '').toLowerCase() === LEGACY_HOST) {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));"""
    new_middlewares = """const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('trust proxy', 1);

// Googleの欧州規制メッセージがクロスオリジンの参照元を確認できる設定を明示します。
app.use((req, res, next) => {
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.set('Content-Language', 'ja');
  next();
});

// 旧Render URLとwwwを一つの公式ドメインへ恒久転送します。
app.use((req, res, next) => {
  const hostname = String(req.hostname || '').toLowerCase();
  if (hostname === LEGACY_HOST || hostname === `www.${CANONICAL_HOST}`) {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
  next();
});

// 画像・CSS・JSは短時間キャッシュし、HTMLは更新確認を早くします。
app.use(
  express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('service-worker.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\\.(?:css|js|png|ico|json)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
    },
  })
);

// 静的アセットを除くアプリ画面だけにレート制限を適用します。
app.use(limiter);"""
    if new_middlewares not in text:
        text = replace_once(text, old_middlewares, new_middlewares, "server middleware block")

    old_helpers = """function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

function sendNotFound(res) {
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
}"""
    new_helpers = r"""function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

function stripAdSenseLoader(html) {
  return String(html).replace(
    /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]+" crossorigin="anonymous"><\/script>\n?/g,
    ''
  );
}

function sendRendered(res, html, { noindex = false, allowAds = true } = {}) {
  if (noindex) {
    res.set('X-Robots-Tag', 'noindex, follow');
    res.set('Cache-Control', 'private, no-store');
  }
  return res.send(allowAds ? html : stripAdSenseLoader(html));
}

function sendNotFound(res) {
  res.set('X-Robots-Tag', 'noindex, follow');
  res.set('Cache-Control', 'no-store');
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
}"""
    if "function stripAdSenseLoader" not in text:
        text = replace_once(text, old_helpers, new_helpers, "render response helpers")

    if "<lastmod>${SITEMAP_LASTMOD}</lastmod>" not in text:
        text = replace_once(
            text,
            ".map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`)",
            ".map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${SITEMAP_LASTMOD}</lastmod></url>`)",
            "sitemap lastmod",
        )
        text = replace_once(
            text,
            "  res.type('application/xml');\n  res.send(`<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "  res.type('application/xml');\n  res.set('Cache-Control', 'public, max-age=3600');\n  res.send(`<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "sitemap cache control",
        )

    route_replacements = [
        (
            "  res.send(renderResultPage(quiz, req.params.resultKey, matchScore));",
            "  return sendRendered(res, renderResultPage(quiz, req.params.resultKey, matchScore), {\n    noindex: matchScore !== null,\n    allowAds: matchScore === null,\n  });",
            "quiz result inventory control",
        ),
        (
            "app.get('/16type/test', (req, res) => {\n  res.send(renderType16Test(req.query));\n});",
            "app.get('/16type/test', (req, res) => {\n  const personalized = Object.keys(req.query).length > 0;\n  return sendRendered(res, renderType16Test(req.query), {\n    noindex: personalized,\n    allowAds: !personalized,\n  });\n});",
            "16-type test inventory control",
        ),
        (
            "  res.send(renderType16Result(code, req.query));",
            "  const personalized = Object.keys(req.query).length > 0;\n  return sendRendered(res, renderType16Result(code, req.query), {\n    noindex: personalized,\n    allowAds: !personalized,\n  });",
            "16-type result inventory control",
        ),
        (
            "app.get('/16type/compatibility', (req, res) => {\n  res.send(renderType16Compatibility(req.query));\n});",
            "app.get('/16type/compatibility', (req, res) => {\n  const hasResult = Boolean(req.query.self && req.query.partner);\n  return sendRendered(res, renderType16Compatibility(req.query), {\n    noindex: hasResult,\n    allowAds: !hasResult,\n  });\n});",
            "compatibility result inventory control",
        ),
        (
            "  // 任意入力の名前結果は利用者向け機能として残し、検索用の大量ページにはしません。\n  res.set('X-Robots-Tag', 'noindex, follow');\n  res.send(renderMeimeiResult(sei, mei, calcResult));",
            "  // 任意入力の名前結果は検索対象・広告対象にせず、利用者向け計算結果としてだけ表示します。\n  return sendRendered(res, renderMeimeiResult(sei, mei, calcResult), {\n    noindex: true,\n    allowAds: false,\n  });",
            "name result inventory control",
        ),
    ]
    for old, new, label in route_replacements:
        if new not in text:
            text = replace_once(text, old, new, label)

    write(path, text)


def patch_css() -> None:
    path = "public/css/style.css"
    text = read(path)
    text = text.replace(
        "font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, \"Hiragino Sans\", \"Yu Gothic\", \"Segoe UI\", sans-serif;",
        "font-family: -apple-system, BlinkMacSystemFont, \"Hiragino Sans\", \"Yu Gothic\", \"Meiryo\", \"Segoe UI\", sans-serif;",
    )

    marker = "/* ADSENSE_UX_2026_09_03 */"
    if marker not in text:
        text += """

/* ADSENSE_UX_2026_09_03 */
.site-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.site-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 14px;
}

.site-nav a {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.site-nav a:hover { color: var(--ink); }

.content-review {
  margin-top: 8px;
  padding-top: 18px;
  padding-bottom: 18px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  text-align: center;
}

.content-review p {
  margin: 3px 0;
  font-size: 0.78rem;
}

.content-review a {
  color: inherit;
  text-underline-offset: 3px;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .site-header-row { flex-direction: column; }
  .site-nav { justify-content: center; }
  .site-nav a { font-size: 0.8rem; }
}
"""
    write(path, text)


def patch_static_pages() -> None:
    targets = [
        "public/about.html",
        "public/editorial-policy.html",
        "public/contact.html",
        "public/privacy.html",
        "public/terms.html",
        "public/404.html",
    ]
    for path in targets:
        text = read(path)
        text = remove_google_fonts(text)

        if '<meta name="referrer" content="strict-origin-when-cross-origin" />' not in text:
            robots_match = re.search(r'(?m)^(\s*)<meta name="robots" content="[^"]+" />$', text)
            if robots_match:
                indent = robots_match.group(1)
                insertion = f'{indent}<meta name="referrer" content="strict-origin-when-cross-origin" />\n'
                text = text[: robots_match.start()] + insertion + text[robots_match.start() :]
            else:
                canonical = re.search(r'(?m)^(\s*)<link rel="canonical"', text)
                if not canonical:
                    raise RuntimeError(f"No referrer-meta insertion point in {path}")
                indent = canonical.group(1)
                insertion = f'{indent}<meta name="referrer" content="strict-origin-when-cross-origin" />\n'
                text = text[: canonical.start()] + insertion + text[canonical.start() :]

        if 'aria-label="主要メニュー"' not in text:
            old_logo = '      <a href="/" class="logo">しんだんラボ</a>'
            if text.count(old_logo) != 1:
                raise RuntimeError(f"Expected one static logo in {path}, found {text.count(old_logo)}")
            text = text.replace(old_logo, nav_markup(), 1)

        write(path, text)


def patch_manifest() -> None:
    path = "public/manifest.json"
    data = json.loads(read(path))
    data["name"] = "しんだんラボ - 16タイプ・心理テスト・占い"
    data["description"] = "無料の16タイプ性格診断・相性チェック、心理テスト、血液型占い、簡易四柱推命、姓名判断を楽しめる日本語サイト"
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    command = data["scripts"]["test"]
    ux_test = "node scripts/test-adsense-ux.js"
    if ux_test not in command:
        command = command.replace(
            "node scripts/test-adsense-content-depth.js",
            f"{ux_test} && node scripts/test-adsense-content-depth.js",
            1,
        )
    data["scripts"]["test"] = command
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def patch_docs() -> None:
    path = "docs/adsense-approval-readiness-2026-09-02.md"
    text = read(path)
    marker = "## 2026-09-03 UX・広告対象ページの追加整理"
    if marker not in text:
        text += f"""

{marker}

- 全動的ページの上部に16タイプ・相性・心理テスト・占い・運営情報・問い合わせへの共通ナビゲーションを追加
- Google Fontsの外部読み込みを廃止し、日本語のシステムフォントへ変更
- 静的アセットの短時間キャッシュ、service workerのno-cache、静的アセットを除外したレート制限へ整理
- `Referrer-Policy: strict-origin-when-cross-origin` を明示し、Googleの欧州規制メッセージが参照元を確認できる状態を準備
- 公式ドメインのwwwと旧Renderホストを `https://shindan24.com` へ301統一
- AdSenseコードは環境変数が欠けても公開済みパブリッシャーIDを使用し、主要コンテンツページで1回だけ読み込む
- 姓名判断の任意入力結果、点数付き結果、招待用診断、選択済み相性結果などのnoindex画面からAdSenseローダーを除外
- noindex画面に `private, no-store` を適用し、利用者固有の結果を共有キャッシュしない
- サイトマップ60件に最終確認日 `{REVIEW_DATE}` を追加
- 全動的ページに編集部と最終確認日を目に見える形で表示

Google CMP自体の作成・公開はAdSenseアカウント内の「プライバシーとメッセージ」で行うため、サイトコード側ではAdSenseコード、プライバシーポリシー、参照元ポリシーまでを準備する。
"""
    write(path, text)


def main() -> None:
    patch_render()
    patch_server()
    patch_css()
    patch_static_pages()
    patch_manifest()
    patch_package()
    patch_docs()
    print("Applied AdSense UX hardening, navigation, inventory controls and performance changes.")


if __name__ == "__main__":
    main()
