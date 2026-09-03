#!/usr/bin/env python3
"""Enable the unified same-type celebrity section in the production renderer."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_server() -> None:
    path = "server.js"
    text = read(path)
    marker = "createType16CelebrityRenderers"
    if marker in text:
        return

    old = """const { createAdsenseContentRenderers } = require('./views/adsense-content-render');
Object.assign(originalRender, createAdsenseContentRenderers({ ...originalRender }));
const {"""
    new = """const { createAdsenseContentRenderers } = require('./views/adsense-content-render');
Object.assign(originalRender, createAdsenseContentRenderers({ ...originalRender }));
const { createType16CelebrityRenderers } = require('./views/type16-celebrity-render');
Object.assign(originalRender, createType16CelebrityRenderers({ ...originalRender }));
const {"""
    text = replace_once(text, old, new, "production renderer")
    write(path, text)


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    scripts = data.setdefault("scripts", {})
    test_command = scripts.get("test", "")
    command = "node scripts/test-type16-celebrities.js"
    if command not in test_command:
        scripts["test"] = f"{command} && {test_command}" if test_command else command
    write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    patch_server()
    patch_package()

    server = read("server.js")
    package = json.loads(read("package.json"))
    assert "createType16CelebrityRenderers" in server
    assert "node scripts/test-type16-celebrities.js" in package["scripts"]["test"]
    print("Enabled the unified same-type celebrity section in server.js and npm test.")


if __name__ == "__main__":
    main()
