// SEO ロングテール向けシードデータ
// 出典: 프로젝트 문서 `일본-SEO-키워드-리서치.md`
// - POPULAR_GIVEN_NAMES: 2025年 明治安田生命「生まれ年別の名前調査」上位ランキング（nippon.com 引用）
// - POPULAR_SURNAMES: 日本で圧倒的に多い代表的な苗字（佐藤・鈴木・高橋・田中・伊藤）
// - CELEBRITY_NAMES: 競合サイト(nihon-ikuji.com等)が既に採用している「有名人の姓名判断」パターンを踏襲
// 全て lib/kanji-strokes.json に画数データが存在することを確認済み（未対応文字なし）。

const POPULAR_SURNAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤'];

const POPULAR_GIVEN_NAMES = [
  { mei: '翠', reading: 'スイ' },
  { mei: '陽葵', reading: 'ヒマリ' },
  { mei: '紬', reading: 'ツムギ' },
  { mei: '茉白', reading: 'マシロ' },
  { mei: '凛', reading: 'リン' },
  { mei: '湊', reading: 'ミナト' },
  { mei: '伊織', reading: 'イオリ' },
  { mei: '結翔', reading: 'ユイト' },
  { mei: '琉生', reading: 'ルイ' },
  { mei: '蓮', reading: 'レン' },
];

const CELEBRITY_NAMES = [
  { sei: '大谷', mei: '翔平' },
  { sei: '山崎', mei: '賢人' },
];

// 姓名判断ロングテールURL全件(サイトマップ用) — 姓5 × 名10 = 50 + 有名人2 = 52件
function allMeimeiCombos() {
  const combos = [];
  POPULAR_SURNAMES.forEach((sei) => {
    POPULAR_GIVEN_NAMES.forEach(({ mei }) => {
      combos.push({ sei, mei });
    });
  });
  CELEBRITY_NAMES.forEach((c) => combos.push(c));
  return combos;
}

// フォーム画面に載せるおすすめリンク(全件は多すぎるため抜粋)
const MEIMEI_FEATURED = [
  { sei: '佐藤', mei: '湊' },
  { sei: '鈴木', mei: '陽葵' },
  { sei: '高橋', mei: '凛' },
  { sei: '田中', mei: '蓮' },
  { sei: '伊藤', mei: '紬' },
  { sei: '佐藤', mei: '伊織' },
  { sei: '大谷', mei: '翔平' },
  { sei: '山崎', mei: '賢人' },
];

module.exports = {
  POPULAR_SURNAMES,
  POPULAR_GIVEN_NAMES,
  CELEBRITY_NAMES,
  allMeimeiCombos,
  MEIMEI_FEATURED,
};
