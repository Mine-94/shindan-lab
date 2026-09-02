#!/usr/bin/env python3
"""Enable Open Graph/Twitter images after generated PNGs are validated."""

from __future__ import annotations

import json
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_base_layout() -> None:
    path = Path("views/render.js")
    text = path.read_text(encoding="utf-8")

    old_signature = (
        "function baseLayout({ title, description, ogUrl, bodyClass, content, themeColor, structuredData }) {\n"
        "  return `<!DOCTYPE html>"
    )
    new_signature = (
        "function baseLayout({ title, description, ogUrl, ogImage, bodyClass, content, themeColor, structuredData }) {\n"
        "  const socialImage = /^https?:\\/\\//.test(ogImage || '')\n"
        "    ? ogImage\n"
        "    : `${SITE_URL}${ogImage || '/og/default.png'}`;\n"
        "  return `<!DOCTYPE html>"
    )
    if "const socialImage =" not in text:
        text = replace_once(text, old_signature, new_signature, "baseLayout social image signature")

    if 'property="og:image"' not in text:
        anchor = '<meta property="og:url" content="${escapeHtml(ogUrl)}" />\n'
        block = (
            anchor
            + '<meta property="og:image" content="${escapeHtml(socialImage)}" />\n'
            + '<meta property="og:image:secure_url" content="${escapeHtml(socialImage)}" />\n'
            + '<meta property="og:image:type" content="image/png" />\n'
            + '<meta property="og:image:width" content="1200" />\n'
            + '<meta property="og:image:height" content="630" />\n'
            + '<meta property="og:image:alt" content="${escapeHtml(`${title}｜${SITE_NAME}`)}" />\n'
        )
        text = replace_once(text, anchor, block, "Open Graph image metadata")

    if 'name="twitter:image"' not in text:
        anchor = '<meta name="twitter:description" content="${escapeHtml(description)}" />\n'
        block = (
            anchor
            + '<meta name="twitter:image" content="${escapeHtml(socialImage)}" />\n'
            + '<meta name="twitter:image:alt" content="${escapeHtml(`${title}｜${SITE_NAME}`)}" />\n'
        )
        text = replace_once(text, anchor, block, "Twitter image metadata")

    required = [
        "ogImage, bodyClass",
        "const socialImage =",
        'property="og:image"',
        'name="twitter:image"',
        "og:image:width",
    ]
    for marker in required:
        if marker not in text:
            raise RuntimeError(f"Missing social preview marker in views/render.js: {marker}")
    path.write_text(text, encoding="utf-8")


def add_preview_after_og_url(text: str, og_url_line: str, image_path: str, label: str) -> str:
    expected = f"{og_url_line}\n      ogImage: '{image_path}',"
    if expected in text:
        return text
    return replace_once(
        text,
        f"{og_url_line}\n",
        f"{og_url_line}\n      ogImage: '{image_path}',\n",
        label,
    )


def patch_type16_pages() -> None:
    path = Path("views/type16-render.js")
    text = path.read_text(encoding="utf-8")

    text = add_preview_after_og_url(
        text,
        "      ogUrl: `${siteUrl}/16type`,",
        "/og/16type.png",
        "16-type hub preview",
    )
    text = add_preview_after_og_url(
        text,
        "      ogUrl: `${siteUrl}/16type/test`,",
        "/og/16type.png",
        "16-type test preview",
    )
    text = add_preview_after_og_url(
        text,
        "      ogUrl: `${siteUrl}/16type/r/${type.code}`,",
        "/og/16type.png",
        "16-type result preview",
    )
    text = add_preview_after_og_url(
        text,
        "      ogUrl: `${siteUrl}/16type/compatibility`,",
        "/og/16type.png",
        "16-type compatibility preview",
    )

    if text.count("ogImage: '/og/16type.png'") != 4:
        raise RuntimeError(
            f"Expected exactly four 16-type preview assignments, found {text.count(\"ogImage: '/og/16type.png'\")}"
        )
    path.write_text(text, encoding="utf-8")


def patch_relation_pages() -> None:
    path = Path("views/growth-render.js")
    text = path.read_text(encoding="utf-8")
    if "ogImage: `/og/${guide.key}.png`," not in text:
        text = replace_once(
            text,
            "      ogUrl: `${siteUrl}${relationGuidePath(guide.key)}`,\n",
            "      ogUrl: `${siteUrl}${relationGuidePath(guide.key)}`,\n"
            "      ogImage: `/og/${guide.key}.png`,\n",
            "relation guide preview",
        )

    # Match high-intent Japanese search wording while keeping the visible and
    # metadata disclaimer that this is not the official MBTI assessment.
    old_title = "      title: `${guide.title}｜16タイプの違いと会話のコツを無料確認`,"
    new_title = "      title: `MBTI関連・${guide.title}｜16タイプの違いと会話のコツ`,"
    if old_title in text:
        text = replace_once(text, old_title, new_title, "relation guide SEO title")

    if "ogImage: `/og/${guide.key}.png`," not in text:
        raise RuntimeError("Relation guide preview image was not installed")
    path.write_text(text, encoding="utf-8")


def patch_package() -> None:
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    current = data.setdefault("scripts", {}).get("test", "")
    command = "node scripts/test-social-previews.js"
    if command not in current:
        data["scripts"]["test"] = f"{command} && {current}" if current else command
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    patch_base_layout()
    patch_type16_pages()
    patch_relation_pages()
    patch_package()
    print("Enabled 1200x630 Open Graph and Twitter preview images on Japanese pages.")


if __name__ == "__main__":
    main()
