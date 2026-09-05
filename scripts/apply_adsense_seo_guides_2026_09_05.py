#!/usr/bin/env python3
"""Enable the 2026-09-05 AdSense content guides and 66-URL sitemap safely."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRENT_DATE_JA = "2026年9月5日"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label}, found {count}")
    return text.replace(old, new, 1)


def replace_if_present(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    return replace_once(text, old, new, label)


OLD_NAV_PAIR = '''          <a href="/ketsueki">占い</a>
          <a href="/about.html">運営情報</a>'''
NEW_NAV_PAIR = '''          <a href="/ketsueki">占い</a>
          <a href="/guide/">使い方</a>
          <a href="/about.html">運営情報</a>'''

OLD_STATIC_FOOTER = '''        <a href="/">ホーム</a>
        <a href="/about.html">しんだんラボについて</a>
        <a href="/editorial-policy.html">編集・診断ポリシー</a>
        <a href="/contact.html">お問い合わせ</a>
        <a href="/privacy.html">プライバシーポリシー</a>
        <a href="/terms.html">利用規約</a>'''
NEW_STATIC_FOOTER = '''        <a href="/">ホーム</a>
        <a href="/guide/">使い方ガイド</a>
        <a href="/updates.html">更新情報</a>
        <a href="/about.html">しんだんラボについて</a>
        <a href="/editorial-policy.html">編集・診断ポリシー</a>
        <a href="/contact.html">お問い合わせ</a>
        <a href="/privacy.html">プライバシーポリシー</a>
        <a href="/terms.html">利用規約</a>
        <a href="/sitemap.html">サイトマップ</a>'''


def patch_render() -> None:
    path = "views/render.js"
    text = read(path)
    text = replace_if_present(text, OLD_NAV_PAIR, NEW_NAV_PAIR, "dynamic navigation guide link")

    old_footer = '''      <a href="/">ホーム</a>
      <a href="/about.html">しんだんラボについて</a>
      <a href="/editorial-policy.html">編集・診断ポリシー</a>
      <a href="/contact.html">お問い合わせ</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>'''
    new_footer = '''      <a href="/">ホーム</a>
      <a href="/guide/">使い方ガイド</a>
      <a href="/updates.html">更新情報</a>
      <a href="/about.html">しんだんラボについて</a>
      <a href="/editorial-policy.html">編集・診断ポリシー</a>
      <a href="/contact.html">お問い合わせ</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>
      <a href="/sitemap.html">サイトマップ</a>'''
    text = replace_if_present(text, old_footer, new_footer, "dynamic footer guide links")

    old_date = "内容確認：しんだんラボ編集部（最終確認：2026年9月3日）"
    new_date = f"内容確認：しんだんラボ編集部（最終確認：{CURRENT_DATE_JA}）"
    text = replace_if_present(text, old_date, new_date, "visible editorial review date")
    write(path, text)


def patch_quality_home() -> None:
    path = "views/quality-render.js"
    text = read(path)
    marker = '''    <section class="info-card faq-list" aria-labelledby="home-faq">'''
    guide_block = '''    <section class="info-card site-guide" aria-labelledby="home-guide-links">
      <p class="content-kicker">HOW TO USE</p>
      <h2 id="home-guide-links">使い方・結果の読み方</h2>
      <p>どの診断を選ぶか迷う方、16タイプの4つの軸や相性点数の意味を確認したい方、姓名判断・十干・血液型占いの計算範囲を知りたい方のために、テーマ別の案内を用意しています。</p>
      <div class="guide-link-list">
        <a href="/guide/"><strong>診断・占いの選び方と基本手順</strong><span>総合ガイド</span></a>
        <a href="/guide/16type.html"><strong>4つの軸・答え方・有名人情報の見方</strong><span>16タイプ</span></a>
        <a href="/guide/compatibility.html"><strong>相性点数を恋愛・友達・仕事・家族で生かす</strong><span>相性ガイド</span></a>
        <a href="/guide/fortune.html"><strong>姓名判断・十干・血液型占いの範囲と注意</strong><span>占いガイド</span></a>
      </div>
    </section>

'''
    if 'id="home-guide-links"' not in text:
        text = replace_once(text, marker, guide_block + marker, "home guide discovery block")
    write(path, text)


def patch_server() -> None:
    path = "server.js"
    text = read(path)

    old_constant = "const SITEMAP_LASTMOD = '2026-09-03';"
    new_constant = '''const DEFAULT_SITEMAP_LASTMOD = '2026-09-03';
const CURRENT_CONTENT_LASTMOD = '2026-09-05';
const CURRENT_CONTENT_PATHS = new Set([
  '/',
  '/16type',
  '/guide/',
  '/guide/16type.html',
  '/guide/compatibility.html',
  '/guide/fortune.html',
  '/updates.html',
  '/sitemap.html',
]);

function sitemapLastmod(pathname) {
  if (CURRENT_CONTENT_PATHS.has(pathname) || pathname.startsWith('/16type/r/')) {
    return CURRENT_CONTENT_LASTMOD;
  }
  return DEFAULT_SITEMAP_LASTMOD;
}'''
    text = replace_if_present(text, old_constant, new_constant, "path-aware sitemap dates")

    old_paths = '''    ...TYPE16_CODES.map((code) => `/16type/r/${code}`),
    '/about.html','''
    new_paths = '''    ...TYPE16_CODES.map((code) => `/16type/r/${code}`),
    '/guide/',
    '/guide/16type.html',
    '/guide/compatibility.html',
    '/guide/fortune.html',
    '/updates.html',
    '/sitemap.html',
    '/about.html','''
    text = replace_if_present(text, old_paths, new_paths, "new guide sitemap paths")

    old_map = ".map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${SITEMAP_LASTMOD}</lastmod></url>`)"
    new_map = ".map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${sitemapLastmod(p)}</lastmod></url>`)"
    text = replace_if_present(text, old_map, new_map, "sitemap lastmod renderer")
    write(path, text)


def patch_static_pages() -> None:
    paths = [
        "public/about.html",
        "public/editorial-policy.html",
        "public/contact.html",
        "public/privacy.html",
        "public/terms.html",
    ]
    for path in paths:
        text = read(path)
        text = replace_if_present(text, OLD_NAV_PAIR, NEW_NAV_PAIR, f"{path} guide navigation")
        text = replace_if_present(text, OLD_STATIC_FOOTER, NEW_STATIC_FOOTER, f"{path} expanded footer")
        write(path, text)

    about_path = "public/about.html"
    about = read(about_path)
    about_anchor = '''    <section class="info-card site-guide">
      <p class="content-kicker">LIMITS</p>'''
    about_block = '''    <section class="info-card site-guide">
      <p class="content-kicker">START GUIDE</p>
      <h2>初めて利用する方へ</h2>
      <p>診断ごとの目的、答え方、結果の読み方、共有時の注意は<a href="/guide/">使い方ガイド</a>にまとめています。16タイプ、相性、姓名判断・十干・血液型占いは結果の範囲が異なるため、初めての方は利用前に該当する案内をご確認ください。</p>
    </section>

'''
    if 'START GUIDE' not in about:
        about = replace_once(about, about_anchor, about_block + about_anchor, "about start-guide block")
    about = about.replace('最終更新：2026年9月2日', '最終更新：2026年9月5日')
    write(about_path, about)

    policy_path = "public/editorial-policy.html"
    policy = read(policy_path)
    policy = policy.replace('最終更新：2026年9月2日', '最終更新：2026年9月5日')
    write(policy_path, policy)


def patch_run_tests() -> None:
    path = "run_tests.sh"
    text = read(path)
    text = text.replace(
        'sitemap内のURL数: $url_count (期待値: 静的36+十干10+血液型単4+血液型ペア10=60)',
        'sitemap内のURL数: $url_count (期待値: 静的42+十干10+血液型単4+血液型ペア10=66)',
    )
    text = text.replace('if [ "$url_count" == "60" ]; then', 'if [ "$url_count" == "66" ]; then')
    text = text.replace('expected 60)', 'expected 66)')

    anchor = 'check_contains "sitemapに/meimei含む" "$BASE/sitemap.xml" "/meimei</loc>"\n'
    additions = '''check_status "使い方ガイド" "$BASE/guide/" 200
check_contains "使い方ガイドに目的別案内" "$BASE/guide/" "知りたいことから選ぶ"
check_status "16タイプガイド" "$BASE/guide/16type.html" 200
check_status "相性結果ガイド" "$BASE/guide/compatibility.html" 200
check_status "占いガイド" "$BASE/guide/fortune.html" 200
check_status "更新情報" "$BASE/updates.html" 200
check_status "HTMLサイトマップ" "$BASE/sitemap.html" 200
check_contains "XMLサイトマップに使い方ガイド" "$BASE/sitemap.xml" "/guide/</loc>"
check_contains "XMLサイトマップに更新情報" "$BASE/sitemap.xml" "/updates.html</loc>"
check_contains "XMLサイトマップにHTMLサイトマップ" "$BASE/sitemap.xml" "/sitemap.html</loc>"
'''
    if 'check_status "使い方ガイド"' not in text:
        text = replace_once(text, anchor, anchor + additions, "shell guide-page tests")
    write(path, text)


def patch_audit() -> None:
    path = "scripts/audit-adsense-content.js"
    text = read(path)
    family_anchor = "  if (pathname === '/') return 'home';\n"
    family_add = "  if (/^\\/guide(?:\\/|$)/.test(pathname)) return 'guide';\n  if (/^\\/(updates|sitemap)\\.html$/.test(pathname)) return 'site-info';\n"
    if "return 'guide';" not in text:
        text = replace_once(text, family_anchor, family_anchor + family_add, "guide audit families")
    text = text.replace('Expected 60 sitemap URLs', 'Expected 66 sitemap URLs')
    text = text.replace('urls.length === 60', 'urls.length === 66')
    text = text.replace('PASS: all 60 sitemap pages', 'PASS: all 66 sitemap pages')
    write(path, text)


def patch_adsense_ux_test() -> None:
    path = "scripts/test-adsense-ux.js"
    text = read(path)
    text = text.replace('最終確認：2026年9月3日', '最終確認：2026年9月5日')
    text = text.replace("count(sitemap.text, '<url>') === 60", "count(sitemap.text, '<url>') === 66")
    text = text.replace('Sitemap must retain 60 reviewed URLs', 'Sitemap must retain 66 reviewed URLs')
    old_lastmod = "    assert(count(sitemap.text, '<lastmod>2026-09-03</lastmod>') === 60, 'Sitemap lastmod count is wrong');"
    new_lastmod = "    assert(count(sitemap.text, '<lastmod>') === 66, 'Every sitemap URL must have lastmod');\n    assert(sitemap.text.includes('<lastmod>2026-09-05</lastmod>'), 'Current sitemap update date is missing');"
    if old_lastmod in text:
        text = replace_once(text, old_lastmod, new_lastmod, "UX sitemap lastmod assertion")
    text = text.replace('60 lastmod entries validated', '66 lastmod entries validated')
    write(path, text)


def patch_growth_test() -> None:
    path = "scripts/test-growth.js"
    text = read(path)
    text = text.replace('length === 60', 'length === 66')
    text = text.replace('60 reviewed URLs', '66 reviewed URLs')
    write(path, text)


def patch_quality_test() -> None:
    path = "scripts/test-quality.js"
    text = read(path)
    text = text.replace('urlCount === 60', 'urlCount === 66')
    text = text.replace('Unexpected reviewed sitemap URL count', 'Unexpected 66-page reviewed sitemap URL count')
    home_anchor = "    assert(home.text.includes('目的から診断を選ぶ'), 'Home guide is missing');\n"
    home_add = "    assert(home.text.includes('使い方・結果の読み方'), 'Home usage-guide section is missing');\n    assert(home.text.includes('href=\"/guide/\"'), 'Home guide link is missing');\n"
    if "Home usage-guide section is missing" not in text:
        text = replace_once(text, home_anchor, home_anchor + home_add, "quality home guide assertions")

    sitemap_anchor = "    assert(!sitemap.text.includes('/meimei/r/'), 'Thin name-result URLs remain in sitemap');\n"
    sitemap_add = "    assert(sitemap.text.includes('/guide/16type.html</loc>'), '16-type guide is missing from sitemap');\n    assert(sitemap.text.includes('/updates.html</loc>'), 'Update history is missing from sitemap');\n    assert(sitemap.text.includes('/sitemap.html</loc>'), 'HTML sitemap is missing from XML sitemap');\n"
    if "16-type guide is missing from sitemap" not in text:
        text = replace_once(text, sitemap_anchor, sitemap_anchor + sitemap_add, "quality sitemap guide assertions")
    write(path, text)


def patch_readiness_test() -> None:
    path = "scripts/test-adsense-readiness.js"
    text = read(path)
    link_anchor = "      '/about.html',\n"
    link_add = "      '/guide/',\n      '/updates.html',\n      '/sitemap.html',\n"
    if "      '/guide/'," not in text:
        text = replace_once(text, link_anchor, link_add + link_anchor, "readiness footer links")

    trust_anchor = "    const privacy = await fetchPage('/privacy.html');\n"
    guide_checks = '''    const guidePages = [
      ['/guide/', '知りたいことから選ぶ'],
      ['/guide/16type.html', '4つの回答軸'],
      ['/guide/compatibility.html', '関係別に確認したいこと'],
      ['/guide/fortune.html', '三つの占いの違い'],
      ['/updates.html', '2026.09.05'],
      ['/sitemap.html', '16タイプの個別解説'],
    ];
    for (const [pathname, marker] of guidePages) {
      const page = await fetchPage(pathname);
      assert(page.response.status === 200, `${pathname} must return 200`);
      assert(page.text.includes(marker), `${pathname} is missing ${marker}`);
      assert(page.text.includes('href="/contact.html"'), `${pathname} lacks contact navigation`);
    }

'''
    if 'const guidePages = [' not in text:
        text = replace_once(text, trust_anchor, guide_checks + trust_anchor, "readiness guide checks")

    text = text.replace('urls.length === 60', 'urls.length === 66')
    text = text.replace('60 reviewed URLs', '66 reviewed URLs')
    text = text.replace('60-page sitemap', '66-page sitemap')
    sitemap_anchor = "    assert(sitemap.text.includes('https://shindan24.com/contact.html</loc>'), 'Contact page missing from sitemap');\n"
    sitemap_add = "    assert(sitemap.text.includes('https://shindan24.com/guide/</loc>'), 'Guide page missing from sitemap');\n    assert(sitemap.text.includes('https://shindan24.com/updates.html</loc>'), 'Updates page missing from sitemap');\n    assert(sitemap.text.includes('https://shindan24.com/sitemap.html</loc>'), 'HTML sitemap missing from XML sitemap');\n"
    if 'Guide page missing from sitemap' not in text:
        text = replace_once(text, sitemap_anchor, sitemap_anchor + sitemap_add, "readiness sitemap guide checks")
    write(path, text)


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    test = data.setdefault("scripts", {}).get("test", "")
    command = "node scripts/test-guide-pages.js"
    if command not in test:
        parts = test.split(" && ") if test else []
        if parts and parts[0] == "node scripts/check-project-scope.js":
            parts.insert(1, command)
        else:
            parts.insert(0, command)
        data["scripts"]["test"] = " && ".join(parts)
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def assert_result() -> None:
    checks = {
        "server.js": ["'/guide/'", "sitemapLastmod(p)", "CURRENT_CONTENT_LASTMOD = '2026-09-05'"],
        "views/render.js": ['href="/guide/"', 'href="/updates.html"', 'href="/sitemap.html"', CURRENT_DATE_JA],
        "views/quality-render.js": ['id="home-guide-links"', '/guide/compatibility.html'],
        "package.json": ["scripts/test-guide-pages.js"],
        "run_tests.sh": ['expected 66', '使い方ガイド'],
    }
    for path, markers in checks.items():
        text = read(path)
        for marker in markers:
            if marker not in text:
                raise RuntimeError(f"{path} is missing marker: {marker}")

    for path in [
        "public/about.html",
        "public/editorial-policy.html",
        "public/contact.html",
        "public/privacy.html",
        "public/terms.html",
    ]:
        text = read(path)
        for marker in ['/guide/', '/updates.html', '/sitemap.html']:
            if marker not in text:
                raise RuntimeError(f"{path} is missing navigation marker: {marker}")

    print("Applied AdSense guide, trust navigation, 66-URL sitemap and test updates.")


def main() -> None:
    patch_render()
    patch_quality_home()
    patch_server()
    patch_static_pages()
    patch_run_tests()
    patch_audit()
    patch_adsense_ux_test()
    patch_growth_test()
    patch_quality_test()
    patch_readiness_test()
    patch_package()
    assert_result()


if __name__ == "__main__":
    main()
