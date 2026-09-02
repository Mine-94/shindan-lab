#!/usr/bin/env python3
"""Apply the 2026-09-02 AdSense approval-readiness hardening.

The migration is intentionally assertion-heavy. It updates trust pages, removes
thin name-result URLs from the sitemap while keeping the tool usable, makes
unknown routes return real 404 responses, and installs integration tests.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "ADSENSE_READINESS_2026_09_02"
SITE_URL = "https://shindan24.com"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def trust_footer() -> str:
    return """  <footer class="site-footer">
    <div class="container">
      <p class="disclaimer">当サイトの診断・占いはエンタメ目的です。人生、健康、法律、金銭に関する重要な判断を、一つの診断結果だけで決めないでください。</p>
      <p class="site-operator">運営・編集：しんだんラボ編集部｜<a href="/about.html">運営方針</a>｜<a href="/contact.html">お問い合わせ</a></p>
      <nav class="footer-nav" aria-label="サイト情報">
        <a href="/">ホーム</a>
        <a href="/about.html">しんだんラボについて</a>
        <a href="/editorial-policy.html">編集・診断ポリシー</a>
        <a href="/contact.html">お問い合わせ</a>
        <a href="/privacy.html">プライバシーポリシー</a>
        <a href="/terms.html">利用規約</a>
      </nav>
    </div>
  </footer>"""


def head(title: str, description: str, path: str, page_type: str = "WebPage", noindex: bool = False) -> str:
    robots = "noindex, follow, max-image-preview:large" if noindex else "max-image-preview:large"
    canonical = f"{SITE_URL}{path}"
    return f"""<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="author" content="しんだんラボ編集部" />
  <meta name="robots" content="{robots}" />
  <link rel="canonical" href="{canonical}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#3d3a34" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:site_name" content="しんだんラボ" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE_URL}/og/default.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="{SITE_URL}/og/default.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="stylesheet" href="/css/quality.css" />
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "{page_type}",
    "name": "{title}",
    "url": "{canonical}",
    "inLanguage": "ja",
    "description": "{description}",
    "author": {{
      "@type": "Organization",
      "name": "しんだんラボ編集部",
      "url": "{SITE_URL}/about.html"
    }},
    "isPartOf": {{
      "@type": "WebSite",
      "name": "しんだんラボ",
      "url": "{SITE_URL}/"
    }}
  }}
  </script>
</head>"""


def about_page() -> str:
    title = "しんだんラボについて｜運営者・目的・制作方法"
    description = "しんだんラボの運営主体、サイトの目的、診断・占いコンテンツの制作方法、限界、更新・訂正方針をご案内します。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/about.html', 'AboutPage')}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">自分を知る。違いを楽しむ。結果を会話のきっかけにする。</p>
    </div>
  </header>

  <main class="container">
    <section class="info-card site-guide">
      <p class="content-kicker">ABOUT</p>
      <h1>しんだんラボについて</h1>
      <p>しんだんラボは、姓名判断・血液型占い・十干タイプ診断と、日常の選択から答えるタイプ診断を無料で提供する日本語サイトです。会員登録をせず、その場ですぐ試せることを大切にしています。</p>
      <p>結果で人を決めつけることではなく、自分の考え方を振り返ったり、友達・家族・パートナーとの違いを話したりする入口をつくることが運営目的です。</p>
    </section>

    <section class="info-card site-guide" aria-labelledby="operator-info">
      <p class="content-kicker">WHO</p>
      <h2 id="operator-info">運営者情報</h2>
      <dl class="trust-definition-list">
        <div><dt>サイト名</dt><dd>しんだんラボ</dd></div>
        <div><dt>運営・編集名義</dt><dd>しんだんラボ編集部</dd></div>
        <div><dt>公式URL</dt><dd><a href="https://shindan24.com/">https://shindan24.com/</a></dd></div>
        <div><dt>お問い合わせ</dt><dd><a href="/contact.html">お問い合わせページ</a></dd></div>
        <div><dt>主な対象</dt><dd>日本語で無料の診断・占いを楽しみたい方</dd></div>
      </dl>
      <p>実在しない専門資格や監修者を表示せず、専門家の監修がないコンテンツはその事実を明記します。公開内容の選定、最終確認、訂正判断は運営側が行います。</p>
    </section>

    <section class="info-card site-guide">
      <p class="content-kicker">HOW</p>
      <h2>コンテンツの作り方</h2>
      <p>選択式診断は、先に「何を振り返るための診断か」を定め、日常で想像しやすい質問と結果軸を独自に作成します。結果ページでは、タイプ名だけで終わらず、強み、注意点、人との付き合い方、試せる行動まで説明することを基本にしています。</p>
      <p>姓名判断・十干タイプ診断は、画数や生年月日を入力すると一定のルールで計算します。血液型占いと16タイプの解説は、科学的な判定ではなく、運営側がエンタメ目的で編集した読み物です。制作の詳細は<a href="/editorial-policy.html">編集・診断ポリシー</a>で公開しています。</p>
    </section>

    <section class="info-card site-guide">
      <p class="content-kicker">WHY</p>
      <h2>このサイトを運営する理由</h2>
      <p>無料診断は結果を一瞬見て終わるものになりがちです。しんだんラボでは、結果の根拠と限界を同じページに示し、相手との違いを責める材料ではなく、会話を始める材料として使える状態を目指します。</p>
      <p>検索される言葉だけを理由に似たページを大量生成せず、既存ページの説明不足、誤解を招く表現、操作性を先に改善します。</p>
    </section>

    <section class="info-card site-guide">
      <p class="content-kicker">LIMITS</p>
      <h2>結果の限界を隠しません</h2>
      <p>当サイトのコンテンツは、公式の心理検査、医学的診断、カウンセリング、専門家による個別鑑定ではありません。血液型と性格の関係や、姓名判断・四柱推命の的中性は科学的に証明されたものではなく、流派によって計算方法や解釈も異なります。</p>
      <p>十干タイプ診断は年柱を中心にした簡易版で、姓名判断は現代の新字体を基準にしています。こうした簡略化は、該当する診断ページと結果ページでも説明します。</p>
    </section>

    <section class="info-card site-guide">
      <p class="content-kicker">PRIVACY</p>
      <h2>入力情報の取り扱い</h2>
      <p>入力・選択された内容はその場の計算に使い、診断結果を保存するための会員データベースは設けていません。ただし、姓名判断の結果URLには入力した名前が含まれます。第三者に知られたくない名前の結果リンクは共有しないでください。</p>
      <p>Cookie、アクセス解析、広告配信に関する詳細は<a href="/privacy.html">プライバシーポリシー</a>をご確認ください。</p>
    </section>

    <section class="info-card site-guide">
      <p class="content-kicker">UPDATE</p>
      <h2>更新・訂正</h2>
      <p>誤字、表示崩れ、計算上の不具合、説明と実装の不一致を確認した場合は修正します。訂正依頼、権利に関する連絡、プライバシーに関する連絡は<a href="/contact.html">お問い合わせページ</a>から受け付けます。</p>
      <p class="small-note">制定：2026年9月1日｜最終更新：2026年9月2日</p>
    </section>
  </main>

{trust_footer()}
</body>
</html>"""


def editorial_page() -> str:
    title = "編集・診断ポリシー｜制作・確認・更新の基準"
    description = "しんだんラボの質問、結果文、占い解説をどのように企画、作成、確認、訂正しているかを説明します。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/editorial-policy.html')}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">結果の面白さだけでなく、作り方と限界も分かる診断サイトへ。</p>
    </div>
  </header>

  <main class="container">
    <section class="info-card site-guide">
      <p class="content-kicker">EDITORIAL POLICY</p>
      <h1>編集・診断ポリシー</h1>
      <p>このページでは、しんだんラボの診断・占いコンテンツをどのような基準で作り、どこまでを結果として伝えるかを公開します。検索されやすい言葉を並べることより、訪れた人が内容と限界を理解したうえで利用できることを優先します。</p>
      <p class="article-byline">運営・編集：しんだんラボ編集部｜最終更新：2026年9月2日</p>
    </section>

    <section class="info-card site-guide">
      <h2>1. 他サイトの文章をコピーしません</h2>
      <p>質問、選択肢、タイプ名、結果文、補足解説は、しんだんラボ向けに独自に作成します。利用者の検索意図や話題の形式を調べることはありますが、既存サービスのキャラクター名、説明文、診断軸をそのまま転用しません。</p>
      <p>アニメ、漫画、芸能人、ブランドなど第三者の知的財産を主役にした診断は、正式な許諾がない限り作成しません。</p>
    </section>

    <section class="info-card site-guide">
      <h2>2. タイプ名だけで終わらせません</h2>
      <p>選択式診断では、回答がどの傾向に集まったかをもとに結果を表示します。結果ページには、できるだけ次の四つを用意します。</p>
      <ul class="axis-list">
        <li>その傾向が生きやすい場面</li>
        <li>偏りすぎたときの注意点</li>
        <li>人との違いを扱うヒント</li>
        <li>日常で試せる小さな行動</li>
      </ul>
      <p>肯定的な言葉だけを並べたり、不安をあおって有料サービスへ誘導したりする結果設計は避けます。</p>
    </section>

    <section class="info-card site-guide">
      <h2>3. 占いの計算方法と簡略化を明記します</h2>
      <h3>姓名判断</h3>
      <p>現代の新字体による画数を用いて五格を計算する簡易版です。旧字体を用いる流派などとは画数や結果が異なる場合があります。任意に入力された個別の名前結果は検索流入用の大量ページとして扱わず、検索エンジンには原則としてインデックスを求めません。</p>
      <h3>十干タイプ診断</h3>
      <p>生年月日から年柱の十干を求める簡易版です。本格的な四柱推命に必要な月柱・日柱・時柱、出生時刻、正確な節入り時刻までは扱いません。</p>
      <h3>血液型占い</h3>
      <p>性格傾向と相性文は編集部独自のエンタメ解説です。血液型と性格の関連が科学的に証明されているという前提では作成しません。</p>
    </section>

    <section class="info-card site-guide">
      <h2>4. 心理検査や専門鑑定のように見せません</h2>
      <p>当サイトの選択式診断は、MBTIを含む公式の性格類型検査、医療機関で行う心理検査、カウンセリングを代替しません。「必ず当たる」「性格を正確に証明する」など、根拠以上に断定する表現は使いません。</p>
      <p>心身の不調、生活上の重大な問題、法律・金融上の判断については、診断結果ではなく適切な専門窓口を利用してください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>5. デジタル支援ツールの利用</h2>
      <p>企画の整理、文章の初稿、コードの点検にデジタル支援ツールを利用する場合があります。出力をそのまま大量公開するのではなく、公開前に日本語の自然さ、内容の重複、誇張表現、計算ロジック、表示崩れ、第三者の権利を確認します。公開内容に対する最終判断と訂正責任は、しんだんラボ編集部にあります。</p>
    </section>

    <section class="info-card site-guide">
      <h2>6. 新しい診断を増やす基準</h2>
      <p>検索やSNSで話題になっているという理由だけで、似た診断を大量に追加しません。まず既存診断の説明不足、結果の薄さ、操作性、共有導線を改善します。そのうえで、次の条件を満たす場合に新規追加を検討します。</p>
      <ul>
        <li>日本の利用者に分かりやすい具体的な利用場面がある</li>
        <li>既存診断と検索意図や結果体験が重複しすぎない</li>
        <li>独自の質問・結果・解説を十分に作れる</li>
        <li>商標、著作権、個人情報のリスクを避けられる</li>
        <li>公開後に利用状況を計測し、改善できる</li>
      </ul>
    </section>

    <section class="info-card site-guide">
      <h2>7. 広告と編集の分離</h2>
      <p>広告の有無や広告主の都合を理由に、診断結果を意図的に良くしたり不安を強めたりしません。広告または成果報酬を伴う外部リンクには「広告」「PR」など、利用者が判別できる表示を付けます。</p>
    </section>

    <section class="info-card site-guide">
      <h2>8. 更新・訂正・連絡</h2>
      <p>表示崩れ、誤字、計算上の不具合、説明と実装の不一致を確認した場合は修正します。内容が古くなったページは更新、統合、検索対象からの除外、または公開停止を検討します。</p>
      <p>誤りの指摘、権利侵害の申告、広告表示に関する連絡は<a href="/contact.html">お問い合わせページ</a>から受け付けます。</p>
      <p class="small-note">制定：2026年9月1日｜最終更新：2026年9月2日</p>
    </section>
  </main>

{trust_footer()}
</body>
</html>"""


def privacy_page() -> str:
    title = "プライバシーポリシー｜しんだんラボ"
    description = "しんだんラボにおける入力情報、Cookie、Google Analytics、Google AdSense、第三者配信、問い合わせ情報の取り扱いを説明します。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/privacy.html')}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">入力情報、アクセス解析、広告配信の取り扱いを説明します。</p>
    </div>
  </header>

  <main class="container">
    <section class="info-card site-guide">
      <p class="content-kicker">PRIVACY</p>
      <h1>プライバシーポリシー</h1>
      <p>しんだんラボ（以下「当サイト」）は、利用者の情報を必要以上に集めず、利用目的と外部サービスの使用を分かりやすく説明するよう努めます。</p>
      <p class="article-byline">制定：2026年8月19日｜最終更新：2026年9月2日</p>
    </section>

    <section class="info-card site-guide">
      <h2>1. 診断で入力・選択する情報</h2>
      <p>生年月日、血液型、姓名の漢字、選択式診断の回答は、その場で結果を計算・表示するために利用します。会員登録機能や、診断結果を保存するための利用者データベースは設けていません。</p>
      <p>姓名判断の結果URLには入力した姓名が含まれます。URLを第三者へ送信したり公開したりすると、名前を見られる可能性があります。公開したくない名前の結果リンクは共有しないでください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>2. アクセスログとGoogle Analytics</h2>
      <p>当サイトは、利用状況の把握と改善のためにGoogle Analyticsを使用する場合があります。Google AnalyticsはCookieや端末情報、閲覧ページ、参照元、概略的な地域、ブラウザ情報などを利用して統計を作成します。当サイトは、氏名やメールアドレスなど、個人を直接特定する情報をGoogle Analyticsへ意図的に送信しません。</p>
      <p>Googleによるデータの取り扱いについては、<a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer">Googleのサービスを使用するサイトやアプリから収集した情報の使用</a>をご確認ください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>3. Google AdSenseと広告Cookie</h2>
      <p>当サイトはGoogle AdSenseを利用して広告を掲載する場合があります。Googleを含む第三者配信事業者は、利用者が当サイトまたは他のサイトを過去に閲覧した情報に基づいて広告を配信するため、Cookie、ウェブビーコン、IPアドレス、その他の識別子を使用することがあります。</p>
      <p>Googleの広告Cookieを利用することで、Googleおよびそのパートナーは、当サイトやインターネット上の他のサイトへのアクセス情報に基づく広告を表示できる場合があります。利用者は<a href="https://adssettings.google.com/?hl=ja" target="_blank" rel="noopener noreferrer">Google広告設定</a>でパーソナライズ広告を無効にできます。</p>
      <p>Google以外の第三者配信事業者または広告ネットワークを利用する場合は、利用者が確認できる形で本ポリシーまたは該当ページに追記します。</p>
    </section>

    <section class="info-card site-guide">
      <h2>4. Cookieの管理と同意</h2>
      <p>Cookieはブラウザ設定から削除または無効化できます。ただし、無効化すると一部機能や広告表示が正常に動作しない場合があります。法令またはGoogleの要件により同意が必要な地域では、当サイトが採用する同意管理画面の案内に従って選択してください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>5. 外部リンク</h2>
      <p>当サイトから外部サイトへ移動した後の情報取得、Cookie、決済、サービス提供については、移動先の運営者が定めるポリシーが適用されます。広告または成果報酬を伴うリンクには「広告」「PR」などの表示を付けます。</p>
    </section>

    <section class="info-card site-guide">
      <h2>6. お問い合わせで受け取る情報</h2>
      <p>お問い合わせ時に利用者が送信した連絡先と本文は、質問への回答、権利確認、不具合調査のために利用します。公開問い合わせ窓口を使う場合、投稿内容は第三者から見える可能性があるため、氏名、住所、電話番号、診断に入力した名前などの個人情報を書かないでください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>7. ポリシーの変更とお問い合わせ</h2>
      <p>使用するサービスや法令上の要件が変わった場合、本ポリシーを更新します。情報の取り扱い、削除依頼、広告Cookie、権利に関するお問い合わせは<a href="/contact.html">お問い合わせページ</a>からご連絡ください。</p>
    </section>
  </main>

{trust_footer()}
</body>
</html>"""


def terms_page() -> str:
    title = "利用規約｜しんだんラボ"
    description = "しんだんラボが提供する無料診断・占い・相性チェックの利用条件、免責、禁止事項、知的財産、広告表示について定めます。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/terms.html')}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">無料診断・占いを安心して利用するための条件です。</p>
    </div>
  </header>

  <main class="container">
    <section class="info-card site-guide">
      <p class="content-kicker">TERMS</p>
      <h1>利用規約</h1>
      <p>本規約は、しんだんラボ（以下「当サイト」）が提供する診断、占い、相性チェック、解説コンテンツの利用条件を定めます。</p>
      <p class="article-byline">施行：2026年8月19日｜最終更新：2026年9月2日</p>
    </section>

    <section class="info-card site-guide">
      <h2>第1条（サービスの性質）</h2>
      <p>当サイトの姓名判断、血液型占い、十干タイプ診断、16タイプ、性格診断などは娯楽目的です。公式の心理検査、医学的診断、カウンセリング、専門家による鑑定、採用・人事評価を代替するものではありません。</p>
      <p>診断結果に法的、医学的、科学的な効力はありません。健康、金銭、法律、進学、就職、交際などの重要な判断は、必要に応じて適切な専門家へ相談してください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>第2条（利用上の注意）</h2>
      <p>利用者は、結果を本人または第三者への差別、嫌がらせ、採用判断、能力の断定に使用しないものとします。姓名判断URLを共有する場合、入力した名前がURLに含まれることを理解したうえで共有してください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>第3条（禁止事項）</h2>
      <ul>
        <li>法令または公序良俗に反する利用</li>
        <li>当サイト、サーバー、他の利用者へ過度な負荷や損害を与える行為</li>
        <li>診断文、デザイン、コードを無断で大量転載・再配布する行為</li>
        <li>不正アクセス、脆弱性の悪用、広告表示の不正操作</li>
        <li>第三者になりすまして問い合わせる行為</li>
      </ul>
    </section>

    <section class="info-card site-guide">
      <h2>第4条（知的財産）</h2>
      <p>当サイトが独自に作成した質問、結果文、説明、デザイン、プログラムに関する権利は、当サイト運営者または正当な権利者に帰属します。個人が診断結果をSNS等で共有する通常利用は妨げません。</p>
    </section>

    <section class="info-card site-guide">
      <h2>第5条（広告・外部サービス）</h2>
      <p>当サイトは広告や成果報酬型リンクを掲載する場合があります。該当箇所には「広告」「PR」などの表示を行います。移動先サービスの内容、料金、契約、情報管理については、移動先の規約とポリシーをご確認ください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>第6条（免責と提供変更）</h2>
      <p>当サイトは内容の確認と不具合修正に努めますが、完全性、正確性、継続提供、特定目的への適合を保証しません。保守、障害、法令・サービス仕様の変更等により、予告なく一部機能を変更または停止する場合があります。</p>
    </section>

    <section class="info-card site-guide">
      <h2>第7条（規約変更・お問い合わせ）</h2>
      <p>運営上必要な場合、本規約を更新し、更新日をこのページに表示します。規約、権利、広告、不具合に関する連絡は<a href="/contact.html">お問い合わせページ</a>から受け付けます。</p>
    </section>
  </main>

{trust_footer()}
</body>
</html>"""


def contact_page() -> str:
    title = "お問い合わせ｜しんだんラボ"
    description = "しんだんラボへの不具合報告、内容の訂正依頼、権利・プライバシー・広告に関するお問い合わせ窓口です。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/contact.html', 'ContactPage')}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
      <p class="tagline">不具合、訂正、権利、プライバシーに関する連絡窓口です。</p>
    </div>
  </header>

  <main class="container">
    <section class="info-card site-guide">
      <p class="content-kicker">CONTACT</p>
      <h1>お問い合わせ</h1>
      <p>診断の表示不具合、誤字・内容の訂正、著作権・商標・プライバシー、広告表示、その他の運営に関するお問い合わせを受け付けています。</p>
      <p>診断結果の個別鑑定、医療・法律・金融相談、人生相談には対応していません。緊急性のある問題は、該当する公的機関または専門窓口へご相談ください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>連絡方法</h2>
      <div class="contact-actions">
        <a class="quiz-btn" href="mailto:contact@shindan24.com?subject=%E3%81%97%E3%82%93%E3%81%A0%E3%82%93%E3%83%A9%E3%83%9C%E3%81%B8%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B">メールで問い合わせる</a>
        <a class="quiz-btn quiz-btn-outline" href="https://github.com/Mine-94/shindan-lab/issues/new?template=site-contact.yml" target="_blank" rel="noopener noreferrer">公開問い合わせフォームを開く</a>
      </div>
      <p><strong>メール：</strong><a href="mailto:contact@shindan24.com">contact@shindan24.com</a></p>
      <p class="small-note">メールが利用できない場合は、GitHubの公開問い合わせフォームをご利用ください。公開フォームには氏名、住所、電話番号、メールアドレス、診断に入力した本名などを書かないでください。</p>
    </section>

    <section class="info-card site-guide">
      <h2>連絡時に含めてほしい内容</h2>
      <ul>
        <li>問い合わせの種類（不具合、訂正、権利、プライバシー、広告、その他）</li>
        <li>問題があるページのURL</li>
        <li>発生した内容、正しいと思われる内容、再現手順</li>
        <li>利用端末・ブラウザ名（表示不具合の場合）</li>
      </ul>
      <p>内容を確認し、対応が必要な場合は修正または返信を行います。すべての問い合わせへの個別回答や、希望どおりの変更を保証するものではありません。</p>
    </section>

    <section class="info-card site-guide">
      <h2>権利侵害・削除依頼</h2>
      <p>著作権、商標、肖像、プライバシーに関する申告では、対象URL、該当箇所、権利者との関係、希望する対応をお知らせください。本人確認が必要な場合は、公開フォームへ個人情報を書かず、まず概要のみをご連絡ください。</p>
      <p class="small-note">窓口最終確認：2026年9月2日</p>
    </section>
  </main>

{trust_footer()}
</body>
</html>"""


def not_found_page() -> str:
    title = "ページが見つかりません｜しんだんラボ"
    description = "指定されたページは見つかりませんでした。URLを確認するか、しんだんラボのホームから診断を選んでください。"
    return f"""<!DOCTYPE html>
<html lang="ja">
{head(title, description, '/404.html', noindex=True)}
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="logo">しんだんラボ</a>
    </div>
  </header>
  <main class="container">
    <section class="info-card error-page">
      <p class="content-kicker">404</p>
      <h1>ページが見つかりません</h1>
      <p>URLが間違っているか、ページが移動・公開終了した可能性があります。自動的にホームへ転送せず、このページから次の行き先を選べるようにしています。</p>
      <div class="contact-actions">
        <a class="quiz-btn" href="/">ホームへ戻る</a>
        <a class="quiz-btn quiz-btn-outline" href="/16type/test">16タイプ簡易診断を始める</a>
      </div>
    </section>
  </main>
{trust_footer()}
</body>
</html>"""


def patch_render() -> None:
    path = "views/render.js"
    text = read(path)

    if '<meta name="author" content="しんだんラボ編集部" />' not in text:
        text = replace_once(
            text,
            '<meta name="description" content="${escapeHtml(description)}" />\n',
            '<meta name="description" content="${escapeHtml(description)}" />\n<meta name="author" content="しんだんラボ編集部" />\n',
            "dynamic author meta",
        )

    old_footer = """<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">当サイトの診断・占いコンテンツはエンタメ目的であり、公式の心理検査・医学的診断・専門家による鑑定の代わりになるものではありません。血液型と性格の関連性、姓名判断・四柱推命の的中性は科学的に証明されたものではありません。</p>
    <nav class="footer-nav">
      <a href="/">ホーム</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>
    </nav>
  </div>
</footer>"""
    new_footer = """<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">当サイトの診断・占いコンテンツはエンタメ目的であり、公式の心理検査・医学的診断・専門家による鑑定の代わりになるものではありません。血液型と性格の関連性、姓名判断・四柱推命の的中性は科学的に証明されたものではありません。</p>
    <p class="site-operator">運営・編集：しんだんラボ編集部｜<a href="/about.html">運営方針</a>｜<a href="/contact.html">お問い合わせ</a></p>
    <nav class="footer-nav" aria-label="サイト情報">
      <a href="/">ホーム</a>
      <a href="/about.html">しんだんラボについて</a>
      <a href="/editorial-policy.html">編集・診断ポリシー</a>
      <a href="/contact.html">お問い合わせ</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="/terms.html">利用規約</a>
    </nav>
  </div>
</footer>"""
    if new_footer not in text:
        text = replace_once(text, old_footer, new_footer, "dynamic trust footer")

    old_featured = """            `<a href=\"/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}\" class=\"link-grid-item\">${escapeHtml(sei)} ${escapeHtml(mei)}</a>`"""
    new_featured = """            `<a href=\"/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}\" class=\"link-grid-item\" rel=\"nofollow\">${escapeHtml(sei)} ${escapeHtml(mei)}</a>`"""
    if new_featured not in text:
        text = replace_once(text, old_featured, new_featured, "name example nofollow")

    write(path, text)


def patch_server() -> None:
    path = "server.js"
    text = read(path)

    text = text.replace("const { allMeimeiCombos } = require('./data/seo-longtail');\n", "")

    if "function sendNotFound(res)" not in text:
        text = replace_once(
            text,
            """function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}
""",
            """function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

function sendNotFound(res) {
  return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
}
""",
            "404 helper",
        )

    if "'/contact.html'," not in text:
        text = replace_once(
            text,
            """    '/about.html',
    '/editorial-policy.html',
    '/privacy.html',""",
            """    '/about.html',
    '/editorial-policy.html',
    '/contact.html',
    '/privacy.html',""",
            "contact sitemap entry",
        )

    meimei_block = """  // 姓名判断ロングテール: 人気の姓×名の組合せ + 有名人（52件、data/seo-longtail.js参照）
  const meimeiPaths = allMeimeiCombos().map(
    ({ sei, mei }) => `/meimei/r/${encodeURIComponent(sei)}/${encodeURIComponent(mei)}`
  );

"""
    text = text.replace(meimei_block, "")
    text = text.replace("    ...ketsuekiPairPaths,\n    ...meimeiPaths,\n", "    ...ketsuekiPairPaths,\n")

    replacements = {
        "if (!quiz) return res.redirect('/');": "if (!quiz) return sendNotFound(res);",
        "if (!quiz || !quiz.results[req.params.resultKey]) return res.redirect('/');": "if (!quiz || !quiz.results[req.params.resultKey]) return sendNotFound(res);",
        "if (!TYPE16_CODES.includes(code)) return res.redirect('/16type');": "if (!TYPE16_CODES.includes(code)) return sendNotFound(res);",
        "if (!STEM_KEYS.includes(req.params.stemKey)) return res.redirect('/shichuu');": "if (!STEM_KEYS.includes(req.params.stemKey)) return sendNotFound(res);",
        "if (!BLOOD_TYPES.includes(type)) return res.redirect('/ketsueki');": "if (!BLOOD_TYPES.includes(type)) return sendNotFound(res);",
        "if (!BLOOD_TYPES.includes(type) || !BLOOD_TYPES.includes(partner)) return res.redirect('/ketsueki');": "if (!BLOOD_TYPES.includes(type) || !BLOOD_TYPES.includes(partner)) return sendNotFound(res);",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    old_meimei_result = """app.get('/meimei/r/:sei/:mei', (req, res) => {
  const sei = decodeURIComponent(req.params.sei);
  const mei = decodeURIComponent(req.params.mei);
  const calcResult = calcSeimeiHandan(sei, mei);
  res.send(renderMeimeiResult(sei, mei, calcResult));
});"""
    new_meimei_result = """app.get('/meimei/r/:sei/:mei', (req, res) => {
  const sei = decodeURIComponent(req.params.sei);
  const mei = decodeURIComponent(req.params.mei);
  const calcResult = calcSeimeiHandan(sei, mei);
  // 任意入力の名前結果は利用者向け機能として残し、検索用の大量ページにはしません。
  res.set('X-Robots-Tag', 'noindex, follow');
  res.send(renderMeimeiResult(sei, mei, calcResult));
});"""
    if new_meimei_result not in text:
        text = replace_once(text, old_meimei_result, new_meimei_result, "name-result noindex")

    old_catch = """// 不明なパスはホームへリダイレクト
app.get('*', (req, res) => {
  res.redirect('/');
});"""
    new_catch = """// 不明なURLをホームへ転送するとsoft 404になり得るため、正しい404を返します。
app.get('*', (req, res) => {
  sendNotFound(res);
});"""
    if new_catch not in text:
        text = replace_once(text, old_catch, new_catch, "real 404 catch-all")

    if "allMeimeiCombos" in text or "meimeiPaths" in text:
        raise RuntimeError("Thin name-result sitemap generation remains in server.js")
    write(path, text)


def patch_css() -> None:
    path = "public/css/style.css"
    text = read(path)
    if MARKER not in text:
        text += f"""

/* {MARKER}: trust, contact and error-page presentation */
.site-operator {{
  margin: 14px auto;
  max-width: 860px;
  color: var(--text-muted, #6a655e);
  font-size: 0.88rem;
  line-height: 1.7;
  text-align: center;
}}

.site-operator a,
.trust-definition-list a {{
  color: inherit;
  text-underline-offset: 3px;
}}

.trust-definition-list {{
  display: grid;
  gap: 0;
  margin: 18px 0 20px;
  border: 1px solid #e7e2dc;
  border-radius: 14px;
  overflow: hidden;
}}

.trust-definition-list > div {{
  display: grid;
  grid-template-columns: minmax(130px, 0.35fr) minmax(0, 1fr);
  gap: 16px;
  padding: 13px 16px;
  background: #fff;
  border-bottom: 1px solid #eee9e3;
}}

.trust-definition-list > div:last-child {{ border-bottom: 0; }}
.trust-definition-list dt {{ font-weight: 700; }}
.trust-definition-list dd {{ margin: 0; overflow-wrap: anywhere; }}

.article-byline {{
  margin-top: 18px;
  color: var(--text-muted, #6a655e);
  font-size: 0.88rem;
}}

.contact-actions {{
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 18px 0;
}}

.contact-actions .quiz-btn {{
  width: auto;
  min-width: 220px;
  text-align: center;
}}

.error-page {{
  margin: 42px auto;
  max-width: 760px;
  text-align: center;
}}

.error-page .contact-actions {{ justify-content: center; }}

@media (max-width: 640px) {{
  .trust-definition-list > div {{ grid-template-columns: 1fr; gap: 5px; }}
  .contact-actions {{ flex-direction: column; }}
  .contact-actions .quiz-btn {{ width: 100%; min-width: 0; }}
}}
"""
    write(path, text)


def patch_run_tests() -> None:
    path = "run_tests.sh"
    text = read(path)

    text = text.replace(
        'check_contains "sitemapに/meimei/r/長尾テール含む(佐藤+湊)" "$BASE/sitemap.xml" "/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A"\n'
        'check_contains "sitemapに有名人ロングテール含む(大谷翔平)" "$BASE/sitemap.xml" "%E5%A4%A7%E8%B0%B7"',
        'check_not_contains "sitemapから任意の姓名結果を除外" "$BASE/sitemap.xml" "/meimei/r/"',
    )
    text = text.replace(
        'echo "sitemap内のURL数: $url_count (期待値: 静的35+十干10+血液型単4+血液型ペア10+姓名判断52=111)"',
        'echo "sitemap内のURL数: $url_count (期待値: 静的36+十干10+血液型単4+血液型ペア10=60)"',
    )
    text = text.replace('if [ "$url_count" == "111" ]; then', 'if [ "$url_count" == "60" ]; then')
    text = text.replace(
        'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 111)"',
        'echo "FAIL  sitemap URL数不一致 (got $url_count, expected 60)"',
    )
    text = text.replace(
        'check_status "結果ページ(不正キー→リダイレクト)" "$BASE/shichuu/r/notakey" 302',
        'check_status "結果ページ(不正キー→404)" "$BASE/shichuu/r/notakey" 404',
    )
    text = text.replace(
        'check_redirect_location "存在しない診断ID→ホーム" "$BASE/q/not-a-real-quiz" "/"',
        'check_status "存在しない診断ID→404" "$BASE/q/not-a-real-quiz" 404',
    )
    text = text.replace(
        'check_redirect_location "存在しない結果キー→ホーム" "$BASE/q/oshikatsu-type/r/not-a-real-key" "/"',
        'check_status "存在しない結果キー→404" "$BASE/q/oshikatsu-type/r/not-a-real-key" 404',
    )
    text = text.replace(
        'check_redirect_location "不正な16タイプ→一覧" "$BASE/16type/r/XXXX" "/16type"',
        'check_status "不正な16タイプ→404" "$BASE/16type/r/XXXX" 404',
    )
    if 'check_status "お問い合わせ"' not in text:
        anchor = 'check_status "sitemap.xml" "$BASE/sitemap.xml" 200\n'
        addition = (
            anchor
            + 'check_status "お問い合わせ" "$BASE/contact.html" 200\n'
            + 'check_contains "お問い合わせに連絡方法" "$BASE/contact.html" "contact@shindan24.com"\n'
            + 'check_status "存在しないURLは正しい404" "$BASE/this-page-does-not-exist" 404\n'
        )
        text = replace_once(text, anchor, addition, "basic AdSense pages tests")

    if 'expected 111' in text or '== "111"' in text:
        raise RuntimeError("Old 111 sitemap assertion remains in run_tests.sh")
    write(path, text)


def patch_js_tests() -> None:
    growth_path = "scripts/test-growth.js"
    growth = read(growth_path)
    growth = growth.replace(
        "assert((sitemap.text.match(/<url>/g) || []).length === 111, 'Sitemap must contain 111 URLs');",
        "assert((sitemap.text.match(/<url>/g) || []).length === 60, 'Sitemap must contain 60 reviewed URLs');",
    )
    growth = growth.replace(
        "console.log('PASS: 4 SEO relation guides, invite-to-compare loop, attribution and 111 sitemap URLs validated.');",
        "console.log('PASS: 4 SEO relation guides, invite-to-compare loop, attribution and 60 reviewed sitemap URLs validated.');",
    )
    write(growth_path, growth)

    quality_path = "scripts/test-quality.js"
    quality = read(quality_path)
    quality = quality.replace(
        "assert(urlCount === 111, `Unexpected sitemap URL count: ${urlCount}`);",
        "assert(urlCount === 60, `Unexpected reviewed sitemap URL count: ${urlCount}`);\n"
        "    assert(sitemap.text.includes('/contact.html</loc>'), 'Contact page is missing from sitemap');\n"
        "    assert(!sitemap.text.includes('/meimei/r/'), 'Thin name-result URLs remain in sitemap');",
    )
    write(quality_path, quality)


def readiness_test_source() -> str:
    return r"""'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3018;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchPage(pathname) {
  const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  return { response, text: await response.text() };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('AdSense readiness server did not become ready');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      SITE_URL: 'https://shindan24.com',
      ADSENSE_CLIENT_ID: 'ca-pub-8602848692420724',
      GA_MEASUREMENT_ID: 'G-TEST1234',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    await waitForServer();

    const home = await fetchPage('/');
    assert(home.response.status === 200, 'Home must return 200');
    for (const link of [
      '/about.html',
      '/editorial-policy.html',
      '/contact.html',
      '/privacy.html',
      '/terms.html',
    ]) {
      assert(home.text.includes(`href="${link}"`), `Home footer is missing ${link}`);
    }
    assert(home.text.includes('運営・編集：しんだんラボ編集部'), 'Visible operator label is missing');
    assert(home.text.includes('<meta name="author" content="しんだんラボ編集部"'), 'Author metadata is missing');
    assert(
      count(home.text, 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') === 1,
      'AdSense loader must appear exactly once on dynamic pages'
    );

    const trustPages = [
      ['/about.html', '運営者情報'],
      ['/editorial-policy.html', '広告と編集の分離'],
      ['/contact.html', 'contact@shindan24.com'],
      ['/privacy.html', '第三者配信事業者'],
      ['/terms.html', '禁止事項'],
    ];
    for (const [pathname, marker] of trustPages) {
      const page = await fetchPage(pathname);
      assert(page.response.status === 200, `${pathname} must return 200`);
      assert(page.text.includes(marker), `${pathname} is missing ${marker}`);
      assert(page.text.includes(`https://shindan24.com${pathname}`), `${pathname} canonical is wrong`);
      assert(!page.text.includes('shindan-lab.onrender.com'), `${pathname} contains legacy hostname`);
      assert(page.text.includes('href="/contact.html"') || pathname === '/contact.html', `${pathname} lacks contact path`);
    }

    const privacy = await fetchPage('/privacy.html');
    for (const marker of [
      'Google AdSense',
      'Cookie',
      'ウェブビーコン',
      'IPアドレス',
      'Google広告設定',
      'policies.google.com/technologies/partner-sites',
    ]) {
      assert(privacy.text.includes(marker), `Privacy policy is missing ${marker}`);
    }

    const contact = await fetchPage('/contact.html');
    assert(contact.text.includes('issues/new?template=site-contact.yml'), 'Working public contact fallback is missing');
    assert(!contact.text.includes('pagead2.googlesyndication.com'), 'Contact page should not load ads');

    const sitemap = await fetchPage('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap must return 200');
    const urls = sitemap.text.match(/<url>/g) || [];
    assert(urls.length === 60, `Sitemap must contain 60 reviewed URLs, got ${urls.length}`);
    assert(sitemap.text.includes('https://shindan24.com/contact.html</loc>'), 'Contact page missing from sitemap');
    assert(!sitemap.text.includes('/meimei/r/'), 'Arbitrary name-result URLs must not be in sitemap');
    assert(!sitemap.text.includes('shindan-lab.onrender.com'), 'Sitemap contains legacy hostname');

    const nameResult = await fetchPage('/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A');
    assert(nameResult.response.status === 200, 'Name result must remain usable');
    assert(
      String(nameResult.response.headers.get('x-robots-tag') || '').includes('noindex'),
      'Name result must carry X-Robots-Tag noindex'
    );

    for (const pathname of [
      '/this-page-does-not-exist',
      '/q/not-a-real-quiz',
      '/q/oshikatsu-type/r/not-a-real-key',
      '/16type/r/XXXX',
      '/shichuu/r/notakey',
      '/ketsueki/r/Z',
    ]) {
      const missing = await fetchPage(pathname);
      assert(missing.response.status === 404, `${pathname} must return 404`);
      assert(!missing.response.headers.get('location'), `${pathname} must not redirect`);
      assert(missing.text.includes('ページが見つかりません'), `${pathname} lacks helpful 404 content`);
      assert(missing.text.includes('noindex, follow'), `${pathname} 404 lacks noindex`);
    }

    const ads = await fetchPage('/ads.txt');
    assert(ads.response.status === 200, 'ads.txt must return 200');
    assert(
      ads.text.trim() === 'google.com, pub-8602848692420724, DIRECT, f08c47fec0942fa0',
      'ads.txt publisher record is invalid'
    );

    const robots = await fetchPage('/robots.txt');
    assert(robots.text.includes('Sitemap: https://shindan24.com/sitemap.xml'), 'robots.txt sitemap is not canonical');

    console.log('PASS: AdSense trust pages, privacy disclosure, 60-page sitemap, name-result noindex and real 404 handling validated.');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }

  if (stderr.trim()) console.error(stderr.trim());
  if (stdout.trim()) console.log(stdout.trim());
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
"""


def patch_package() -> None:
    path = "package.json"
    data = json.loads(read(path))
    scripts = data.setdefault("scripts", {})
    current = scripts.get("test", "")
    command = "node scripts/test-adsense-readiness.js"
    if command not in current:
        scripts["test"] = f"{command} && {current}" if current else command
    write(path, json.dumps(data, ensure_ascii=False, indent=2))


def indexnow_workflow() -> str:
    return """name: Submit reviewed Japanese pages to IndexNow

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  submit:
    runs-on: ubuntu-latest
    env:
      SITE_URL: https://shindan24.com
      INDEXNOW_KEY: c43e252ab66ef069ad3bbb37b081739d
    steps:
      - name: Read the deployed reviewed sitemap
        run: |
          set -euo pipefail
          curl -fsS --retry 5 --retry-delay 5 --max-time 60 "$SITE_URL/$INDEXNOW_KEY.txt" | grep -qx "$INDEXNOW_KEY"
          curl -fsS --retry 5 --retry-delay 5 --max-time 60 "$SITE_URL/sitemap.xml" -o /tmp/sitemap.xml
          url_count=$(grep -o '<url>' /tmp/sitemap.xml | wc -l | tr -d ' ')
          [ "$url_count" = '60' ]
          grep -q "$SITE_URL/contact.html</loc>" /tmp/sitemap.xml
          if grep -q '/meimei/r/' /tmp/sitemap.xml; then
            echo 'Thin name-result URLs remain in the deployed sitemap.'
            exit 1
          fi

      - name: Build IndexNow payload
        run: |
          python3 - <<'PY'
          import json
          import os
          import xml.etree.ElementTree as ET

          site_url = os.environ['SITE_URL']
          key = os.environ['INDEXNOW_KEY']
          root = ET.parse('/tmp/sitemap.xml').getroot()
          urls = []
          for element in root.iter():
              if element.tag.endswith('loc') and element.text:
                  value = element.text.strip()
                  if value == site_url or value.startswith(f'{site_url}/'):
                      urls.append(value)
          urls = list(dict.fromkeys(urls))
          if len(urls) != 60:
              raise SystemExit(f'Expected 60 reviewed URLs, found {len(urls)}')
          payload = {
              'host': 'shindan24.com',
              'key': key,
              'keyLocation': f'{site_url}/{key}.txt',
              'urlList': urls,
          }
          with open('/tmp/indexnow.json', 'w', encoding='utf-8') as handle:
              json.dump(payload, handle, ensure_ascii=False)
          PY

      - name: Submit the reviewed URLs
        run: |
          set -euo pipefail
          status=$(curl -sS --max-time 60 -o /tmp/indexnow-response.txt -w '%{http_code}' \
            -H 'Content-Type: application/json; charset=utf-8' \
            --data-binary @/tmp/indexnow.json \
            https://api.indexnow.org/indexnow)
          cat /tmp/indexnow-response.txt || true
          if [ "$status" != '200' ] && [ "$status" != '202' ]; then
            echo "IndexNow returned HTTP $status"
            exit 1
          fi
          echo "IndexNow accepted 60 reviewed shindan24.com URLs with HTTP $status."
"""


def live_workflow() -> str:
    return """name: Verify AdSense-ready shindan24.com release

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify-live:
    runs-on: ubuntu-latest
    env:
      SITE_URL: https://shindan24.com
    steps:
      - name: Verify live trust pages, index controls and 404 handling
        run: |
          set -euo pipefail
          curl -fsS --max-time 60 "$SITE_URL/" -o /tmp/home.html
          curl -fsS --max-time 60 "$SITE_URL/about.html" -o /tmp/about.html
          curl -fsS --max-time 60 "$SITE_URL/editorial-policy.html" -o /tmp/policy.html
          curl -fsS --max-time 60 "$SITE_URL/contact.html" -o /tmp/contact.html
          curl -fsS --max-time 60 "$SITE_URL/privacy.html" -o /tmp/privacy.html
          curl -fsS --max-time 60 "$SITE_URL/terms.html" -o /tmp/terms.html
          curl -fsS --max-time 60 "$SITE_URL/sitemap.xml" -o /tmp/sitemap.xml
          curl -fsSI --max-time 60 "$SITE_URL/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A" -o /tmp/name-headers.txt
          status=$(curl -sS --max-time 60 -o /tmp/404.html -w '%{http_code}' "$SITE_URL/adsense-readiness-missing-page")

          grep -q '運営・編集：しんだんラボ編集部' /tmp/home.html
          grep -q '運営者情報' /tmp/about.html
          grep -q '広告と編集の分離' /tmp/policy.html
          grep -q 'contact@shindan24.com' /tmp/contact.html
          grep -q '第三者配信事業者' /tmp/privacy.html
          grep -q '禁止事項' /tmp/terms.html
          grep -qi '^x-robots-tag:.*noindex' /tmp/name-headers.txt
          [ "$status" = '404' ]
          grep -q 'ページが見つかりません' /tmp/404.html

          url_count=$(grep -o '<url>' /tmp/sitemap.xml | wc -l | tr -d ' ')
          [ "$url_count" = '60' ]
          grep -q "$SITE_URL/contact.html</loc>" /tmp/sitemap.xml
          if grep -q '/meimei/r/' /tmp/sitemap.xml; then
            echo 'Thin name-result URLs remain in sitemap.'
            exit 1
          fi
          if grep -R -q 'shindan-lab.onrender.com' /tmp/about.html /tmp/policy.html /tmp/contact.html /tmp/privacy.html /tmp/terms.html /tmp/sitemap.xml; then
            echo 'Legacy hostname remains in live trust or sitemap content.'
            exit 1
          fi
          echo 'LIVE PASS: trust pages, privacy disclosure, 60 reviewed URLs, noindexed name results and real 404 verified.'
"""


def issue_template() -> str:
    return """name: サイトへのお問い合わせ
description: 表示不具合、訂正、権利、プライバシー、広告に関する公開窓口です
title: "[お問い合わせ] "
labels:
  - contact
body:
  - type: markdown
    attributes:
      value: |
        このフォームの内容は公開されます。氏名、住所、電話番号、メールアドレス、診断に入力した本名などの個人情報を書かないでください。
  - type: dropdown
    id: category
    attributes:
      label: お問い合わせの種類
      options:
        - 表示・動作の不具合
        - 誤字・内容の訂正
        - 著作権・商標などの権利
        - プライバシー・削除依頼
        - 広告表示
        - その他
    validations:
      required: true
  - type: input
    id: url
    attributes:
      label: 対象ページURL
      placeholder: https://shindan24.com/...
  - type: textarea
    id: details
    attributes:
      label: 内容
      description: 個人情報を除き、問題の内容と再現手順を具体的に記載してください。
    validations:
      required: true
"""


def approval_doc() -> str:
    return """# shindan24.com AdSense 승인 준비 기록 — 2026-09-02

## 목표

신규 진단 수를 늘리는 작업을 중단하고, AdSense 사이트 심사에서 확인하기 쉬운 운영 투명성, 개인정보 고지, 탐색성, 실제 404, 색인 품질을 우선 보강한다.

## 이번 변경

- 일본어 문의 페이지와 공개 문의 백업 채널 추가
- 소개 페이지에 운영·편집 주체, Who/How/Why, 수정 책임 명시
- 편집 정책에 광고와 편집의 분리, AI·디지털 도구 사용 범위, 정정 절차 명시
- 개인정보처리방침에 Google AdSense/Analytics, 제3자 Cookie, 웹 비콘, IP 주소, 광고 설정 링크 명시
- 이용약관에 금지 행위, 지식재산, 광고·외부 서비스 조항 추가
- 모든 동적 페이지 푸터에 소개·편집정책·문의·개인정보·이용약관 연결
- 임의 입력으로 생성되는 姓名判断 결과 페이지에 X-Robots-Tag: noindex, follow 적용
- 姓名判断 결과 52개를 sitemap에서 제거하고, 핵심 60개 URL만 유지
- 존재하지 않는 URL의 홈 리디렉션을 중단하고 실제 404 상태를 반환
- 이전 Render 도메인이 남아 있던 정적 신뢰 페이지 canonical을 shindan24.com으로 통일

## 재신청 전에 사람이 확인할 항목

1. `contact@shindan24.com`이 실제로 수신되는지 확인하거나 전달 주소를 설정한다.
2. AdSense의 개인정보 보호 및 메시지에서 EEA·영국·스위스용 Google 인증 CMP 메시지를 설정한다.
3. Render에 최신 main 커밋을 배포한다.
4. 라이브 검증 워크플로를 수동 실행한다.
5. Search Console에서 sitemap.xml을 다시 제출하고 핵심 페이지 색인을 요청한다.
6. AdSense 사이트 화면의 구체적 거절 사유를 다시 확인한 뒤에만 재검토를 요청한다.

## 승인 판단 원칙

고정된 최소 글 수나 글자 수를 맞추는 것이 아니라, 각 핵심 페이지가 독자적인 목적·설명·한계·운영 정보를 제공하는지 확인한다. 임의 조합 결과처럼 이용자 기능으로는 필요하지만 검색 콘텐츠로는 약한 페이지는 색인 대상에서 제외한다.
"""


def main() -> None:
    write("public/about.html", about_page())
    write("public/editorial-policy.html", editorial_page())
    write("public/privacy.html", privacy_page())
    write("public/terms.html", terms_page())
    write("public/contact.html", contact_page())
    write("public/404.html", not_found_page())
    write(".github/ISSUE_TEMPLATE/site-contact.yml", issue_template())
    write("docs/adsense-approval-readiness-2026-09-02.md", approval_doc())
    write("scripts/test-adsense-readiness.js", readiness_test_source())

    patch_render()
    patch_server()
    patch_css()
    patch_run_tests()
    patch_js_tests()
    patch_package()

    write(".github/workflows/indexnow.yml", indexnow_workflow())
    write(".github/workflows/verify-live-quality.yml", live_workflow())

    assertions = {
        "server.js": ["'/contact.html'", "X-Robots-Tag", "sendNotFound", "status(404)"],
        "views/render.js": ["しんだんラボ編集部", 'href="/contact.html"'],
        "public/privacy.html": ["第三者配信事業者", "Google広告設定", "ウェブビーコン"],
        "public/contact.html": ["contact@shindan24.com", "site-contact.yml"],
        "package.json": ["test-adsense-readiness.js"],
    }
    for path, markers in assertions.items():
        text = read(path)
        for marker in markers:
            if marker not in text:
                raise RuntimeError(f"Missing {marker!r} in {path}")

    server = read("server.js")
    if "allMeimeiCombos" in server or "meimeiPaths" in server:
        raise RuntimeError("Thin name-result sitemap generation remains")
    print("Applied AdSense approval-readiness hardening: trust pages, 60-URL sitemap, noindex controls and real 404 handling.")


if __name__ == "__main__":
    main()
