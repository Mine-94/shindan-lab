#!/usr/bin/env python3
"""Turn the existing AdSense content audit heuristics into a release gate.

The thresholds remain explicitly internal review rules, not Google approval
criteria. The purpose is to stop newly indexed pages when they are thin,
repetitive, structurally incomplete, or poorly linked.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "scripts" / "audit-adsense-content.js"
MARKER = "STRICT_INDEXABLE_CONTENT_GATE_2026_09_05"
START_ANCHOR = "    const hardFailures = pages.filter((page) =>"
END_ANCHOR = "    console.log('\\nPASS: all 66 sitemap pages have 200 status, title, H1, canonical official host and no duplicate AdSense loader.');"


def main() -> None:
    text = TARGET.read_text(encoding="utf-8")
    if MARKER in text:
        print("Strict indexable-content gate is already enabled.")
        return

    start = text.find(START_ANCHOR)
    end_start = text.find(END_ANCHOR, start if start >= 0 else 0)
    if start < 0 or end_start < 0:
        raise RuntimeError(
            "Could not locate the existing content-audit assertion block. "
            f"start={start}, end={end_start}"
        )
    end = end_start + len(END_ANCHOR)

    new = f"""    // {MARKER}
    // These are internal release rules, not Google-published approval thresholds.
    // A new indexable page must satisfy every existing audit signal before it can
    // enter the production sitemap.
    const hardFailures = pages.filter((page) =>
      page.status !== 200 ||
      !page.title ||
      !page.h1 ||
      !page.canonical.startsWith(OFFICIAL) ||
      page.adLoaders > 1
    );
    assert(
      hardFailures.length === 0,
      `Hard page-quality failures: ${{hardFailures.map((page) => page.path).join(', ')}}`
    );
    assert(
      warningPages.length === 0,
      `Indexable page warnings: ${{warningPages
        .map((page) => `${{page.path}} [${{page.warnings.join('; ')}}]`)
        .join(' | ')}}`
    );
    assert(
      lowDepth.length === 0,
      `Indexable pages below the internal 550-character review line: ${{lowDepth
        .map((page) => `${{page.path}} (${{page.mainLength}})`)
        .join(', ')}}`
    );
    assert(
      duplicatePairs.length === 0,
      `High-similarity pages in the same content family: ${{duplicatePairs
        .map((pair) => `${{pair.left}} <> ${{pair.right}} (${{pair.similarity.toFixed(3)}})`)
        .join(' | ')}}`
    );
    console.log(
      '\\nPASS: all 66 sitemap pages satisfy status, metadata, navigation, content-depth, uniqueness and AdSense-loader gates.'
    );"""

    TARGET.write_text(f"{text[:start]}{new}{text[end:]}", encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    required = (
        MARKER,
        "warningPages.length === 0",
        "lowDepth.length === 0",
        "duplicatePairs.length === 0",
        "content-depth, uniqueness and AdSense-loader gates",
    )
    for item in required:
        if item not in updated:
            raise RuntimeError(f"Strict audit output is missing: {item}")

    print("Enabled strict release blocking for thin, repetitive or incomplete indexable pages.")


if __name__ == "__main__":
    main()
