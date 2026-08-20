// 占いツール群 — 計算ロジック（フロント/サーバー両方から呼べる純粋関数のみ）
// 出典・方法論は README / 프로젝트 문서 「일본-점술운세진단-SEO-리서치.md」참고

const strokeTable = require('./kanji-strokes.json');

// ---------------------------------------------------------------------------
// 1. 姓名判断（熊崎式・簡易版 / 現代新字体の画数で計算）
// ---------------------------------------------------------------------------

// 81数の吉凶表（研究で確認できた吉数のみをリスト化、それ以外は凶として扱う簡易2値判定）
const LUCKY_NUMBERS = new Set([
  1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 31, 32, 33, 35, 37,
  39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81,
]);

function reduceToRange(n) {
  // 五格の数え上げは81を超えると1に還るとされる周期表現
  while (n > 81) n -= 80;
  return n;
}

function judgeNumber(n) {
  const reduced = reduceToRange(n);
  return LUCKY_NUMBERS.has(reduced) ? 'kichi' : 'kyou';
}

function strokesOf(char) {
  return Object.prototype.hasOwnProperty.call(strokeTable, char) ? strokeTable[char] : null;
}

// 姓・名（漢字のみ）から画数配列を取得。未対応文字があれば invalidChars に集める
function toStrokeArray(text) {
  const chars = Array.from(text || '');
  const strokes = [];
  const invalidChars = [];
  for (const ch of chars) {
    const s = strokesOf(ch);
    if (s === null) {
      invalidChars.push(ch);
    } else {
      strokes.push(s);
    }
  }
  return { chars, strokes, invalidChars };
}

function calcSeimeiHandan(sei, mei) {
  const seiData = toStrokeArray(sei);
  const meiData = toStrokeArray(mei);

  if (
    seiData.chars.length === 0 ||
    meiData.chars.length === 0 ||
    seiData.invalidChars.length > 0 ||
    meiData.invalidChars.length > 0
  ) {
    return {
      ok: false,
      invalidChars: [...seiData.invalidChars, ...meiData.invalidChars],
    };
  }

  const seiSum = seiData.strokes.reduce((a, b) => a + b, 0);
  const meiSum = meiData.strokes.reduce((a, b) => a + b, 0);

  const tenkaku = seiSum + (seiData.strokes.length === 1 ? 1 : 0);
  const chikaku = meiSum + (meiData.strokes.length === 1 ? 1 : 0);
  const jinkaku = seiData.strokes[seiData.strokes.length - 1] + meiData.strokes[0];
  const soukaku = seiSum + meiSum;
  const gaikaku = tenkaku + chikaku - jinkaku;

  const grid = [
    { key: 'tenkaku', label: '天格', value: tenkaku, judge: judgeNumber(tenkaku) },
    { key: 'jinkaku', label: '人格', value: jinkaku, judge: judgeNumber(jinkaku) },
    { key: 'chikaku', label: '地格', value: chikaku, judge: judgeNumber(chikaku) },
    { key: 'gaikaku', label: '外格', value: gaikaku, judge: judgeNumber(gaikaku) },
    { key: 'soukaku', label: '総格', value: soukaku, judge: judgeNumber(soukaku) },
  ];

  const kichiCount = grid.filter((g) => g.judge === 'kichi').length;

  return {
    ok: true,
    sei,
    mei,
    grid,
    kichiCount,
    totalCount: grid.length,
  };
}

// ---------------------------------------------------------------------------
// 2. 簡易四柱推命（生年の十干のみを使う簡易版 — 月柱・日柱は節入り時刻が必要なため扱わない）
// ---------------------------------------------------------------------------

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEM_KEYS = ['kinoe', 'kinoto', 'hinoe', 'hinoto', 'tsuchinoe', 'tsuchinoto', 'kanoe', 'kanoto', 'mizunoe', 'mizunoto'];
const STEM_ELEMENT = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
const STEM_YINYANG = ['陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰', '陽', '陰'];

// 立春（2/4頃）を年の境目として使う簡易ルール。年によって2/3〜2/5でずれる場合がある。
function stemIndexForBirth(year, month, day) {
  let y = year;
  if (month < 2 || (month === 2 && day < 4)) {
    y -= 1;
  }
  const idx = ((y - 4) % 10 + 10) % 10;
  return idx;
}

function calcShichuuStem(year, month, day) {
  const idx = stemIndexForBirth(year, month, day);
  return {
    stemKey: STEM_KEYS[idx],
    stem: STEMS[idx],
    element: STEM_ELEMENT[idx],
    yinyang: STEM_YINYANG[idx],
  };
}

// ---------------------------------------------------------------------------
// 3. 血液型占い（固定データ + 自作の相性目安マトリクス）
// ---------------------------------------------------------------------------

const BLOOD_TYPES = ['A', 'B', 'O', 'AB'];

// 相性目安（◎○△の3段階）。占術的に標準化された唯一の算出法は存在しないため、
// 一般的に流布している傾向を参考にした編集部独自の目安として提供する。
const BLOOD_COMPAT = {
  'A-A': 'good',
  'A-B': 'so-so',
  'A-O': 'good',
  'A-AB': 'best',
  'B-B': 'good',
  'B-O': 'best',
  'B-AB': 'good',
  'O-O': 'best',
  'O-AB': 'so-so',
  'AB-AB': 'so-so',
};

function compatKey(a, b) {
  const idx = (t) => BLOOD_TYPES.indexOf(t);
  return idx(a) <= idx(b) ? `${a}-${b}` : `${b}-${a}`;
}

function getBloodCompat(a, b) {
  const key = compatKey(a, b);
  return BLOOD_COMPAT[key] || 'so-so';
}

module.exports = {
  calcSeimeiHandan,
  calcShichuuStem,
  getBloodCompat,
  compatKey,
  BLOOD_TYPES,
  STEM_KEYS,
};
