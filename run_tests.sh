#!/bin/bash
set -uo pipefail
PORT=3011
BASE="http://localhost:$PORT"
cd "$(dirname "$0")"

echo "=== サーバー起動 ==="
PORT=$PORT SITE_URL="http://localhost:$PORT" node server.js > /tmp/shindan_test_server.log 2>&1 &
SERVER_PID=$!
sleep 1.5
echo "server pid: $SERVER_PID"

pass=0
fail=0

check_status() {
  local desc="$1" url="$2" expected="$3"
  local code
  code=$(curl -s -o /tmp/shindan_resp.html -w '%{http_code}' "$url")
  if [ "$code" == "$expected" ]; then
    echo "PASS  [$code] $desc"
    pass=$((pass+1))
  else
    echo "FAIL  [$code, expected $expected] $desc ($url)"
    fail=$((fail+1))
  fi
}

check_contains() {
  local desc="$1" url="$2" needle="$3"
  curl -s "$url" -o /tmp/shindan_resp.html
  if grep -q "$needle" /tmp/shindan_resp.html; then
    echo "PASS  contains '$needle': $desc"
    pass=$((pass+1))
  else
    echo "FAIL  missing '$needle': $desc ($url)"
    fail=$((fail+1))
  fi
}

check_not_contains() {
  local desc="$1" url="$2" needle="$3"
  curl -s "$url" -o /tmp/shindan_resp.html
  if grep -q "$needle" /tmp/shindan_resp.html; then
    echo "FAIL  unexpectedly contains '$needle': $desc ($url)"
    fail=$((fail+1))
  else
    echo "PASS  does not contain '$needle': $desc"
    pass=$((pass+1))
  fi
}

check_redirect_location() {
  local desc="$1" url="$2" needle="$3"
  loc=$(curl -s -o /dev/null -D - "$url" | grep -i '^location:' | tr -d '\r')
  if echo "$loc" | grep -q "$needle"; then
    echo "PASS  redirect→'$needle': $desc ($loc)"
    pass=$((pass+1))
  else
    echo "FAIL  redirect expected '$needle': $desc (got: $loc)"
    fail=$((fail+1))
  fi
}

check_valid_jsonld() {
  local desc="$1" url="$2"
  curl -s "$url" -o /tmp/shindan_resp.html
  node -e '
    const fs = require("fs");
    const html = fs.readFileSync("/tmp/shindan_resp.html", "utf8");
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) { console.error("NO_MATCH"); process.exit(1); }
    try {
      const data = JSON.parse(m[1]);
      if (!Array.isArray(data) || data.length < 2) { console.error("UNEXPECTED_SHAPE"); process.exit(1); }
      const hasWebPage = data.some((d) => d["@type"] === "WebPage");
      const hasBreadcrumb = data.some((d) => d["@type"] === "BreadcrumbList");
      if (!hasWebPage || !hasBreadcrumb) { console.error("MISSING_TYPE"); process.exit(1); }
      process.exit(0);
    } catch (e) {
      console.error("PARSE_ERROR: " + e.message);
      process.exit(1);
    }
  ' 2>/tmp/shindan_jsonld_err.txt
  if [ $? -eq 0 ]; then
    echo "PASS  valid JSON-LD (WebPage+BreadcrumbList): $desc"
    pass=$((pass+1))
  else
    echo "FAIL  invalid JSON-LD ($(cat /tmp/shindan_jsonld_err.txt)): $desc ($url)"
    fail=$((fail+1))
  fi
}

echo ""
echo "=== 基本ページ ==="
check_status "ホーム" "$BASE/" 200
check_status "robots.txt" "$BASE/robots.txt" 200
check_status "ads.txt" "$BASE/ads.txt" 200
check_contains "ads.txt 販売者情報" "$BASE/ads.txt" "google.com, pub-8602848692420724, DIRECT, f08c47fec0942fa0"
check_contains "robots.txt sitemapリンク" "$BASE/robots.txt" "Sitemap:"
check_status "sitemap.xml" "$BASE/sitemap.xml" 200
check_contains "sitemapに/shichuu含む" "$BASE/sitemap.xml" "/shichuu</loc>"
check_contains "sitemapに/ketsueki含む" "$BASE/sitemap.xml" "/ketsueki</loc>"
check_contains "sitemapに/meimei含む" "$BASE/sitemap.xml" "/meimei</loc>"

echo ""
echo "=== SEO修正: sitemapに動的ページが含まれるか ==="
check_contains "sitemapに/shichuu/r/kinoe含む" "$BASE/sitemap.xml" "/shichuu/r/kinoe"
check_contains "sitemapに/shichuu/r/mizunoto含む(10種の最後)" "$BASE/sitemap.xml" "/shichuu/r/mizunoto"
check_contains "sitemapに/ketsueki/r/A含む" "$BASE/sitemap.xml" "/ketsueki/r/A</loc>"
check_contains "sitemapに/ketsueki/r/A/AB含む(ペア)" "$BASE/sitemap.xml" "/ketsueki/r/A/AB"
check_contains "sitemapに/meimei/r/長尾テール含む(佐藤+湊)" "$BASE/sitemap.xml" "/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A"
check_contains "sitemapに有名人ロングテール含む(大谷翔平)" "$BASE/sitemap.xml" "%E5%A4%A7%E8%B0%B7"

curl -s "$BASE/sitemap.xml" -o /tmp/shindan_resp.html
url_count=$(grep -o '<url>' /tmp/shindan_resp.html | wc -l)
echo "sitemap内のURL数: $url_count (期待値: 静的9+十干10+血液型単4+血液型ペア10+姓名判断52=85)"
if [ "$url_count" == "85" ]; then
  echo "PASS  sitemap URL数が期待通り"
  pass=$((pass+1))
else
  echo "FAIL  sitemap URL数不一致 (got $url_count, expected 85)"
  fail=$((fail+1))
fi

echo ""
echo "=== 十干タイプ診断 ==="
check_status "フォーム" "$BASE/shichuu" 200
check_contains "フォームに内部リンクグリッド" "$BASE/shichuu" "link-grid"
check_redirect_location "compute→結果リダイレクト" "$BASE/shichuu/compute?year=1990&month=5&day=20" "/shichuu/r/"
check_status "結果ページ(甲)" "$BASE/shichuu/r/kinoe" 200
check_status "結果ページ(不正キー→リダイレクト)" "$BASE/shichuu/r/notakey" 302
check_redirect_location "存在しない日付→フォーム" "$BASE/shichuu/compute?year=2026&month=2&day=30" "/shichuu"
check_not_contains "承認URL未設定時はPRカードを隠す" "$BASE/shichuu/r/kinoe" "affiliate-card"

echo ""
echo "=== 血液型占い ==="
check_status "フォーム" "$BASE/ketsueki" 200
check_contains "フォームに内部リンクグリッド" "$BASE/ketsueki" "link-grid"
check_status "単独結果" "$BASE/ketsueki/r/A" 200
check_status "相性結果" "$BASE/ketsueki/r/A/B" 200

echo ""
echo "=== 姓名判断 ==="
check_status "フォーム" "$BASE/meimei" 200
check_contains "フォームに人気の組み合わせリンク" "$BASE/meimei" "人気の組み合わせ"
check_status "結果(佐藤+湊)" "$BASE/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A" 200
check_contains "佐藤+湊が診断成功(エラーでない)" "$BASE/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A" "seimei-table"
check_status "有名人(大谷翔平)診断成功" "$BASE/meimei/r/%E5%A4%A7%E8%B0%B7/%E7%BF%94%E5%B9%B3" 200
check_contains "大谷翔平が診断成功(エラーでない)" "$BASE/meimei/r/%E5%A4%A7%E8%B0%B7/%E7%BF%94%E5%B9%B3" "seimei-table"

echo ""
echo "=== 構造化データ(JSON-LD)拡張 — 十干・血液型単独・姓名判断にも付与 ==="
check_contains "十干結果(甲)にJSON-LD" "$BASE/shichuu/r/kinoe" "application/ld+json"
check_valid_jsonld "十干結果(甲)のJSON-LD妥当性" "$BASE/shichuu/r/kinoe"
check_contains "血液型単独結果(A)にJSON-LD" "$BASE/ketsueki/r/A" "application/ld+json"
check_valid_jsonld "血液型単独結果(A)のJSON-LD妥当性" "$BASE/ketsueki/r/A"
check_contains "血液型相性結果(A/B)にJSON-LD" "$BASE/ketsueki/r/A/B" "application/ld+json"
check_valid_jsonld "血液型相性結果(A/B)のJSON-LD妥当性" "$BASE/ketsueki/r/A/B"
check_contains "姓名判断結果(佐藤+湊)にJSON-LD" "$BASE/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A" "application/ld+json"
check_valid_jsonld "姓名判断結果(佐藤+湊)のJSON-LD妥当性" "$BASE/meimei/r/%E4%BD%90%E8%97%A4/%E6%B9%8A"

echo ""
echo "=== GSC verification meta tag (env var未設定時は出ない) ==="
check_status "ホーム(200確認用)" "$BASE/" 200
if grep -q "google-site-verification" /tmp/shindan_resp.html; then
  echo "FAIL  env未設定なのにgoogle-site-verificationタグが出力されている"
  fail=$((fail+1))
else
  echo "PASS  env未設定時はgoogle-site-verificationタグなし"
  pass=$((pass+1))
fi

echo ""
echo "=== 結果 ==="
echo "PASS: $pass  FAIL: $fail"

kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

if [ "$fail" -gt 0 ]; then
  echo ""
  echo "=== サーバーログ (失敗あり) ==="
  cat /tmp/shindan_test_server.log
  exit 1
fi
exit 0
