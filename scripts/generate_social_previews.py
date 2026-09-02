#!/usr/bin/env python3
"""Generate 1200x630 social preview PNGs for the Japanese diagnosis site.

The workflow installs Noto CJK on the runner, generates the assets, validates
PNG dimensions, and commits only the resulting images. Font files are never
committed to the repository.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

WIDTH = 1200
HEIGHT = 630
OUTPUT_DIR = Path("public/og")

FONT_CANDIDATES = (
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Bold.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)
REGULAR_FONT_CANDIDATES = (
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)

PREVIEWS = (
    {
        "filename": "default.png",
        "eyebrow": "FREE DIAGNOSIS & FORTUNE",
        "title": "無料占い・性格診断",
        "subtitle": "姓名判断・血液型・十干・16タイプを無料でチェック",
        "accent": (117, 91, 216),
    },
    {
        "filename": "16type.png",
        "eyebrow": "16 TYPE",
        "title": "16タイプ簡易診断",
        "subtitle": "20問の性格診断・16タイプ一覧・二人の相性チェック",
        "accent": (111, 92, 215),
    },
    {
        "filename": "love.png",
        "eyebrow": "LOVE COMPATIBILITY",
        "title": "16タイプ 恋愛相性",
        "subtitle": "連絡頻度・愛情表現・デート計画・仲直りの違いを整理",
        "accent": (226, 109, 138),
    },
    {
        "filename": "friend.png",
        "eyebrow": "FRIEND COMPATIBILITY",
        "title": "16タイプ 友達相性",
        "subtitle": "誘い方・会う頻度・相談・グループ行動の違いを整理",
        "accent": (72, 148, 169),
    },
    {
        "filename": "work.png",
        "eyebrow": "WORK COMPATIBILITY",
        "title": "16タイプ 仕事相性",
        "subtitle": "報告・意思決定・締切・役割分担の違いを仕事の強みに",
        "accent": (79, 117, 156),
    },
    {
        "filename": "family.png",
        "eyebrow": "FAMILY COMPATIBILITY",
        "title": "16タイプ 家族相性",
        "subtitle": "生活リズム・頼み方・家事・距離感の違いを整理",
        "accent": (187, 131, 75),
    },
)


def first_existing(candidates: Iterable[str]) -> str:
    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate
    raise FileNotFoundError(f"No supported font was found: {tuple(candidates)}")


def font(size: int, *, regular: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        first_existing(REGULAR_FONT_CANDIDATES if regular else FONT_CANDIDATES),
        size=size,
    )


def interpolate(start: int, end: int, ratio: float) -> int:
    return round(start + (end - start) * ratio)


def gradient_image(accent: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), (247, 245, 251))
    pixels = image.load()
    start = tuple(max(0, component - 30) for component in accent)
    end = tuple(min(255, component + 35) for component in accent)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            ratio = (x / WIDTH) * 0.62 + (y / HEIGHT) * 0.38
            pixels[x, y] = tuple(
                interpolate(start[index], end[index], ratio) for index in range(3)
            )
    return image


def fit_text(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int) -> ImageFont.FreeTypeFont:
    size = start_size
    while size >= 30:
        selected = font(size)
        box = draw.textbbox((0, 0), text, font=selected)
        if box[2] - box[0] <= max_width:
            return selected
        size -= 2
    return font(30)


def render_preview(preview: dict[str, object]) -> None:
    accent = preview["accent"]
    assert isinstance(accent, tuple)
    image = gradient_image(accent)
    draw = ImageDraw.Draw(image)

    # Decorative translucent shapes.
    draw.ellipse((870, -170, 1320, 280), fill=(255, 255, 255, 52))
    draw.ellipse((-160, 410, 260, 830), fill=(255, 255, 255, 34))
    draw.rounded_rectangle((62, 54, 1138, 576), radius=34, fill=(255, 255, 255), outline=(255, 255, 255), width=2)
    draw.rounded_rectangle((86, 82, 296, 126), radius=22, fill=accent)

    eyebrow_font = font(20)
    draw.text((108, 92), str(preview["eyebrow"]), font=eyebrow_font, fill=(255, 255, 255))

    brand_font = font(30)
    draw.text((88, 160), "しんだんラボ", font=brand_font, fill=(70, 62, 84))

    title_text = str(preview["title"])
    title_font = fit_text(draw, title_text, 930, 76)
    draw.text((86, 224), title_text, font=title_font, fill=(42, 37, 50))

    subtitle_font = font(30, regular=True)
    draw.text((90, 346), str(preview["subtitle"]), font=subtitle_font, fill=(82, 75, 92))

    draw.rounded_rectangle((88, 432, 514, 502), radius=35, fill=accent)
    cta_font = font(27)
    draw.text((126, 451), "無料・登録不要ですぐ診断", font=cta_font, fill=(255, 255, 255))

    disclaimer_font = font(19, regular=True)
    draw.text(
        (90, 530),
        "公式MBTI®ではない独自のエンタメコンテンツです",
        font=disclaimer_font,
        fill=(104, 96, 113),
    )

    output = OUTPUT_DIR / str(preview["filename"])
    image.save(output, format="PNG", optimize=True)


def validate() -> None:
    for preview in PREVIEWS:
        path = OUTPUT_DIR / str(preview["filename"])
        with Image.open(path) as image:
            if image.size != (WIDTH, HEIGHT):
                raise RuntimeError(f"Unexpected dimensions for {path}: {image.size}")
            if image.format != "PNG":
                raise RuntimeError(f"Unexpected format for {path}: {image.format}")
            if path.stat().st_size < 20_000:
                raise RuntimeError(f"Generated image is unexpectedly small: {path}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for preview in PREVIEWS:
        render_preview(preview)
    validate()
    print(f"Generated and validated {len(PREVIEWS)} social preview PNGs at {WIDTH}x{HEIGHT}.")


if __name__ == "__main__":
    main()
