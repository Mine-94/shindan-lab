#!/usr/bin/env python3
"""Daily, low-noise trend signal monitor for the Japanese diagnosis site."""

from __future__ import annotations

import datetime as dt
import email.utils
import html
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

USER_AGENT = (
    "Mozilla/5.0 (compatible; ShindanLabTrendMonitor/1.1; "
    "+https://shindan-lab.onrender.com/about.html)"
)
SITE_URL = "https://shindan-lab.onrender.com"
KEYWORDS = (
    "診断",
    "占い",
    "恋愛タイプ",
    "ラブタイプ",
    "恋愛MBTI",
    "相性",
    "推し活",
    "推しタイプ",
    "性格タイプ",
    "MBTI",
    "MBTI診断",
    "MBTI相性",
    "16タイプ",
    "16タイプ診断",
    "16タイプ相性",
    "64タイプ",
    "四柱推命",
    "姓名判断",
    "血液型占い",
    "今日の運勢",
    "前世",
    "顔タイプ",
    "観相",
)


@dataclass(frozen=True)
class Signal:
    source: str
    title: str
    link: str
    detail: str = ""


def fetch(url: str, timeout: int = 30) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        return response.read()


def clean(value: str | None) -> str:
    text = html.unescape(value or "")
    return re.sub(r"\s+", " ", text).strip()


def contains_keyword(text: str) -> bool:
    normalized = text.casefold()
    return any(keyword.casefold() in normalized for keyword in KEYWORDS)


def google_trends_signals() -> tuple[list[Signal], str | None]:
    url = "https://trends.google.co.jp/trending/rss?geo=JP"
    try:
        root = ET.fromstring(fetch(url))
    except Exception as exc:  # Network feeds must not hide site-health results.
        return [], f"Google Trends RSS: {exc}"

    signals: list[Signal] = []
    for item in root.findall("./channel/item"):
        title = clean(item.findtext("title"))
        if not contains_keyword(title):
            continue
        link = clean(item.findtext("link"))
        traffic = ""
        for child in item:
            if child.tag.endswith("approx_traffic"):
                traffic = clean(child.text)
                break
        signals.append(
            Signal(
                source="Google Trends Japan",
                title=title,
                link=link,
                detail=f"概算トラフィック: {traffic}" if traffic else "急上昇ワード",
            )
        )
    return signals, None


def bing_news_urls() -> Iterable[tuple[str, str]]:
    queries = (
        "MBTI診断 OR MBTI相性 OR 恋愛MBTI OR 16タイプ診断 OR 16タイプ相性 OR 64タイプ診断",
        "恋愛タイプ診断 OR ラブタイプ診断 OR 推し活診断 OR 性格診断",
        "姓名判断 OR 四柱推命 OR 血液型占い OR 今日の運勢",
    )
    for query in queries:
        encoded = urllib.parse.quote_plus(query)
        yield query, f"https://www.bing.com/news/search?q={encoded}&format=rss&mkt=ja-JP"


def parse_date(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def bing_news_signals() -> tuple[list[Signal], list[str]]:
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=3)
    signals: list[Signal] = []
    errors: list[str] = []
    seen: set[tuple[str, str]] = set()

    for query, url in bing_news_urls():
        try:
            root = ET.fromstring(fetch(url))
        except Exception as exc:
            errors.append(f"Bing News RSS ({query}): {exc}")
            continue

        for item in root.findall("./channel/item"):
            title = clean(item.findtext("title"))
            link = clean(item.findtext("link"))
            published = parse_date(item.findtext("pubDate"))
            if published and published < cutoff:
                continue
            if not contains_keyword(title):
                continue
            key = (title, link)
            if key in seen:
                continue
            seen.add(key)
            detail = published.strftime("公開: %Y-%m-%d %H:%M UTC") if published else "公開日時不明"
            signals.append(Signal(source="Bing News Japan", title=title, link=link, detail=detail))

    return signals[:12], errors


def site_health() -> tuple[list[str], list[str]]:
    ok: list[str] = []
    errors: list[str] = []
    checks = {
        "ホーム": (f"{SITE_URL}/", "しんだんラボ"),
        "サイトマップ": (f"{SITE_URL}/sitemap.xml", "/16type/r/ENFP</loc>"),
        "運営方針": (f"{SITE_URL}/about.html", "しんだんラボについて"),
        "編集ポリシー": (f"{SITE_URL}/editorial-policy.html", "編集・診断ポリシー"),
        "16タイプ一覧": (f"{SITE_URL}/16type", "16タイプ性格一覧"),
        "16タイプ簡易診断": (f"{SITE_URL}/16type/test", "window.__TYPE16_TEST__"),
        "16タイプ相性": (f"{SITE_URL}/16type/compatibility", "16タイプ相性チェック"),
        "16タイプ詳細": (f"{SITE_URL}/16type/r/ENFP", "恋愛で出やすい傾向"),
    }
    for label, (url, expected) in checks.items():
        try:
            body = fetch(url).decode("utf-8", errors="replace")
            if expected not in body:
                raise RuntimeError(f"expected text not found: {expected}")
            ok.append(f"{label}: 200 / expected content found")
        except Exception as exc:
            errors.append(f"{label}: {exc}")
    return ok, errors


def markdown_link(signal: Signal) -> str:
    title = signal.title.replace("[", "\\[").replace("]", "\\]")
    if signal.link.startswith(("https://", "http://")):
        return f"[{title}]({signal.link})"
    return title


def render_report(signals: list[Signal], health_ok: list[str], errors: list[str]) -> str:
    today_jst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat()
    lines = [
        f"## {today_jst} 日本診断トレンド自動点検",
        "",
        "> Google Trends Japan と Bing News Japan の公開フィード、ならびにサイト稼働状態を機械的に確認した補助レポートです。検索量や競争度の最終判断ではなく、人による追加確認が必要です。",
        "",
        "### 検出シグナル",
    ]
    if signals:
        for signal in signals:
            detail = f" — {signal.detail}" if signal.detail else ""
            lines.append(f"- **{signal.source}**: {markdown_link(signal)}{detail}")
    else:
        lines.append("- 対象キーワードに直接一致する新しい公開シグナルはありませんでした。")

    lines.extend(["", "### サイト稼働確認"])
    lines.extend(f"- {item}" for item in health_ok)
    if not health_ok:
        lines.append("- 正常確認項目なし")

    lines.extend(["", "### エラー・要確認"])
    if errors:
        lines.extend(f"- {item}" for item in errors)
    else:
        lines.append("- なし")

    lines.extend(
        [
            "",
            "### 判断ルール",
            "- 新規診断を自動生成・公開しません。",
            "- 検出語が既存診断と重なる場合は、まず既存ページの説明・結果・共有率を確認します。",
            "- MBTIという検索語を追跡しても、公式MBTI®と無料16タイプ診断を同一のものとして扱いません。",
            "- 16タイプ相性の個別組み合わせページを検索量だけで大量生成せず、利用データと固有解説を確認してから拡張します。",
            "- Yahoo! JAPAN リアルタイム検索、X、Instagram、Threads、YouTube、Naver DataLab は安定した公開APIがないため、この自動点検だけで判断せず手動調査で補完します。",
            "- Firefox はブラウザであり検索エンジンではないため、利用者が選択した検索サービス側のデータとして扱います。",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    signals: list[Signal] = []
    errors: list[str] = []

    google, google_error = google_trends_signals()
    signals.extend(google)
    if google_error:
        errors.append(google_error)

    bing, bing_errors = bing_news_signals()
    signals.extend(bing)
    errors.extend(bing_errors)

    health_ok, health_errors = site_health()
    errors.extend(health_errors)

    report = render_report(signals, health_ok, errors)
    output = Path(os.environ.get("TREND_REPORT_PATH", "/tmp/japan-trend-report.md"))
    output.write_text(report, encoding="utf-8")
    print(report)

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"signal_count={len(signals)}\n")
            handle.write(f"error_count={len(errors)}\n")
            handle.write(f"health_error_count={len(health_errors)}\n")

    # Site-health failures should fail the workflow; external feed failures remain visible but non-fatal.
    return 1 if health_errors else 0


if __name__ == "__main__":
    sys.exit(main())
