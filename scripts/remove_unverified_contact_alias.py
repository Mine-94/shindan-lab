#!/usr/bin/env python3
"""Remove a contact alias that failed live delivery and keep only the working public form."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BROKEN_ALIAS = "contact@" + "shindan24.com"
FORM_MARKER = "issues/new?template=site-contact.yml"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def patch_run_tests() -> None:
    path = "run_tests.sh"
    text = read(path)
    old = f'check_contains "お問い合わせに連絡方法" "$BASE/contact.html" "{BROKEN_ALIAS}"'
    new = (
        'check_contains "お問い合わせに公開フォーム" "$BASE/contact.html" "site-contact.yml"\n'
        'check_not_contains "未確認メールアドレスを公開しない" "$BASE/contact.html" "mailto:"'
    )
    if old in text:
        text = replace_once(text, old, new, "run_tests contact assertion")
    write(path, text)


def patch_readiness_test() -> None:
    path = "scripts/test-adsense-readiness.js"
    text = read(path)
    old = f"    assert(!contact.text.includes('{BROKEN_ALIAS}'), 'Unverified contact alias must not be published');"
    new = "    const unverifiedAlias = 'contact@' + 'shindan24.com';\n    assert(!contact.text.includes(unverifiedAlias), 'Unverified contact alias must not be published');"
    if old in text:
        text = replace_once(text, old, new, "readiness alias assertion")
    write(path, text)


def patch_original_migration() -> None:
    path = "scripts/apply_adsense_readiness.py"
    text = read(path)

    old_contact = f"""      <div class=\"contact-actions\">
        <a class=\"quiz-btn\" href=\"mailto:{BROKEN_ALIAS}?subject=%E3%81%97%E3%82%93%E3%81%A0%E3%82%93%E3%83%A9%E3%83%9C%E3%81%B8%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B\">メールで問い合わせる</a>
        <a class=\"quiz-btn quiz-btn-outline\" href=\"https://github.com/Mine-94/shindan-lab/issues/new?template=site-contact.yml\" target=\"_blank\" rel=\"noopener noreferrer\">公開問い合わせフォームを開く</a>
      </div>
      <p><strong>メール：</strong><a href=\"mailto:{BROKEN_ALIAS}\">{BROKEN_ALIAS}</a></p>
      <p class=\"small-note\">メールが利用できない場合は、GitHubの公開問い合わせフォームをご利用ください。公開フォームには氏名、住所、電話番号、メールアドレス、診断に入力した本名などを書かないでください。</p>"""
    new_contact = """      <p>現在は、下記の公開問い合わせフォームで受け付けています。フォームの利用にはGitHubアカウントへのログインが必要です。</p>
      <div class=\"contact-actions\">
        <a class=\"quiz-btn\" href=\"https://github.com/Mine-94/shindan-lab/issues/new?template=site-contact.yml\" target=\"_blank\" rel=\"noopener noreferrer\">公開問い合わせフォームを開く</a>
      </div>
      <p class=\"small-note\">送信内容は公開されます。氏名、住所、電話番号、メールアドレス、診断に入力した本名、本人確認書類などの個人情報は書かないでください。</p>"""
    if old_contact in text:
        text = replace_once(text, old_contact, new_contact, "generated contact block")

    replacements = [
        (
            f'check_contains "お問い合わせに連絡方法" "$BASE/contact.html" "{BROKEN_ALIAS}"',
            'check_contains "お問い合わせに公開フォーム" "$BASE/contact.html" "site-contact.yml"',
            "generated shell test marker",
        ),
        (
            f"['/contact.html', '{BROKEN_ALIAS}'],",
            "['/contact.html', 'issues/new?template=site-contact.yml'],",
            "generated integration-test marker",
        ),
        (
            f"grep -q '{BROKEN_ALIAS}' /tmp/contact.html",
            "grep -q 'issues/new?template=site-contact.yml' /tmp/contact.html",
            "generated live-test marker",
        ),
        (
            f"1. `{BROKEN_ALIAS}`이 실제로 수신되는지 확인하거나 전달 주소를 설정한다.",
            "1. 공개 문의 양식이 정상적으로 열리고 개인정보 경고가 표시되는지 확인한다.",
            "generated project note",
        ),
        (
            f'"public/contact.html": ["{BROKEN_ALIAS}", "site-contact.yml"],',
            '"public/contact.html": ["issues/new?template=site-contact.yml", "送信内容は公開されます"],',
            "generated source assertion",
        ),
    ]
    for old, new, label in replacements:
        if old in text:
            text = replace_once(text, old, new, label)

    write(path, text)


def patch_docs() -> None:
    path = "docs/adsense-approval-readiness-2026-09-02.md"
    text = read(path)
    old = f"1. `{BROKEN_ALIAS}`이 실제로 수신되는지 확인하거나 전달 주소를 설정한다."
    new = "1. 공개 문의 양식이 정상적으로 열리고 개인정보 경고가 표시되는지 확인한다."
    if old in text:
        text = replace_once(text, old, new, "project contact checklist")

    marker = "## 2026-09-03 문의 채널 검증 결과"
    if marker not in text:
        text += """

## 2026-09-03 문의 채널 검증 결과

도메인 메일 별칭으로 실제 테스트 메일을 발송했으나 원격 서버가 `Relay access denied`로 거부했다. 수신이 확인되지 않은 주소를 계속 공개하면 이용자를 오도할 수 있으므로 사이트와 테스트에서 즉시 제거했다. 개인 Gmail은 공개하지 않고, 현재는 개인정보 입력을 금지한 GitHub 공개 문의 양식만 사용한다. 도메인 전달 설정이 실제 송수신 테스트를 통과하기 전에는 이메일 주소를 다시 게시하지 않는다.
"""
    write(path, text)


def assert_clean() -> None:
    forbidden = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or ".github" in path.parts:
            continue
        try:
            value = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if BROKEN_ALIAS in value:
            forbidden.append(str(path.relative_to(ROOT)))
    if forbidden:
        raise RuntimeError(f"Unverified contact alias remains in: {forbidden}")


def main() -> None:
    patch_run_tests()
    patch_readiness_test()
    patch_original_migration()
    patch_docs()
    assert_clean()
    print("Removed the failed contact alias from source, tests and project records.")


if __name__ == "__main__":
    main()
