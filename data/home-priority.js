'use strict';

// Homepage ordering model for the Japanese site.
// Updated 2026-09-02 (JST). This is an editorial decision model, not a claim
// that the numbers are official market shares or this site's own traffic.
const HOME_PRIORITY_VERSION = '2026-09-02';

const HOME_PRIORITY_WEIGHTS = Object.freeze({
  marketDemand: 0.4,
  repeatShare: 0.25,
  seoOpportunity: 0.2,
  firstVisitFit: 0.15,
});

const RAW_ITEMS = {
  'type16-test': {
    label: '16タイプ簡易診断',
    marketDemand: 95,
    repeatShare: 85,
    seoOpportunity: 92,
    firstVisitFit: 100,
    evidence:
      '大学生調査の高い利用経験、一般アプリ調査、16タイプ関連検索意図を総合。自分のタイプが分からない初回訪問者の入口として最適。',
  },
  'type16-compatibility': {
    label: '16タイプ相性チェック',
    marketDemand: 93,
    repeatShare: 97,
    seoOpportunity: 90,
    firstVisitFit: 70,
    evidence:
      '2026年の外部サービス行動ログ14,507件、ユニーク利用者6,245人。友達・恋愛など複数関係で繰り返し使われやすい。',
  },
  'quiz:oshikatsu-type': {
    label: '推し活タイプ診断',
    marketDemand: 88,
    repeatShare: 82,
    seoOpportunity: 72,
    firstVisitFit: 88,
    evidence:
      '2026年公開調査で推し活人口約1,940万人、別調査で推しがいる人40.9%、20代57.4%。若年層との親和性が高い。',
  },
  'type16-guide': {
    label: '16タイプ性格一覧',
    marketDemand: 85,
    repeatShare: 70,
    seoOpportunity: 88,
    firstVisitFit: 75,
    evidence:
      '16個の固有解説ページを持ち検索入口を広げられるが、診断や相性ほど即時行動にはつながりにくい。',
  },
  'fortune:ketsueki': {
    label: '血液型占い',
    marketDemand: 74,
    repeatShare: 60,
    seoOpportunity: 65,
    firstVisitFit: 90,
    evidence:
      '2026年の占い調査で「よく見る占い」24.3%。入力負担が小さく初回訪問者がすぐ使える。',
  },
  'quiz:honto-no-seikaku': {
    label: '本当の性格タイプ診断',
    marketDemand: 70,
    repeatShare: 65,
    seoOpportunity: 65,
    firstVisitFit: 80,
    evidence:
      '2026年の占い調査で「自分自身を知りたい」70.5%。独自診断として相性・16タイプの補助導線に向く。',
  },
  'fortune:shichuu': {
    label: '十干タイプ診断',
    marketDemand: 55,
    repeatShare: 55,
    seoOpportunity: 60,
    firstVisitFit: 70,
    evidence:
      '2026年の占い調査で四柱推命15.5%。継続需要はあるが、簡易年柱版のため表示上の説明が必要。',
  },
  'fortune:meimei': {
    label: '姓名判断',
    marketDemand: 45,
    repeatShare: 60,
    seoOpportunity: 75,
    firstVisitFit: 65,
    evidence:
      '一般調査の上位占術には入らなかった一方、名前別の固有URLを持ちロングテール検索資産として価値がある。',
  },
  'quiz:kakure-chara': {
    label: 'かくれキャラ診断',
    marketDemand: 52,
    repeatShare: 65,
    seoOpportunity: 45,
    firstVisitFit: 75,
    evidence:
      '友達共有との相性はよいが、現時点で同等の外部定量データが少ないため控えめに評価。',
  },
  'quiz:jinsei-balance-game': {
    label: '人生の選択バランスゲーム',
    marketDemand: 45,
    repeatShare: 55,
    seoOpportunity: 40,
    firstVisitFit: 75,
    evidence:
      '参加しやすい二択形式だが、検索意図と外部定量データが他候補より弱い。',
  },
};

function calculatePriorityScore(item) {
  return Number(
    Object.entries(HOME_PRIORITY_WEIGHTS)
      .reduce((total, [key, weight]) => total + item[key] * weight, 0)
      .toFixed(1)
  );
}

const HOME_PRIORITY_ITEMS = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_ITEMS).map(([id, item]) => [
      id,
      Object.freeze({ ...item, id, score: calculatePriorityScore(item) }),
    ])
  )
);

const HOME_PRIORITY_RANKING = Object.freeze(
  Object.values(HOME_PRIORITY_ITEMS)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'ja'))
    .map((item, index) => Object.freeze({ ...item, rank: index + 1 }))
);

function priorityScore(id) {
  return HOME_PRIORITY_ITEMS[id] ? HOME_PRIORITY_ITEMS[id].score : -1;
}

function sortByPriority(items, idForItem) {
  return items
    .map((item, index) => ({ item, index, score: priorityScore(idForItem(item)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

const weightTotal = Object.values(HOME_PRIORITY_WEIGHTS).reduce(
  (total, weight) => total + weight,
  0
);
if (Math.abs(weightTotal - 1) > Number.EPSILON) {
  throw new Error(`Homepage priority weights must total 1. Received ${weightTotal}`);
}

module.exports = {
  HOME_PRIORITY_VERSION,
  HOME_PRIORITY_WEIGHTS,
  HOME_PRIORITY_ITEMS,
  HOME_PRIORITY_RANKING,
  calculatePriorityScore,
  priorityScore,
  sortByPriority,
};
