// ホーム画面の「占い」セクションに表示するツール一覧
const fortuneTools = [
  {
    id: 'shichuu',
    title: '十干タイプ診断（簡易四柱推命）',
    subtitle: '生まれ年から、あなたの五行タイプを診断',
    emoji: '☯️',
    themeColor: '#8a6fd8',
    href: '/shichuu',
  },
  {
    id: 'ketsueki',
    title: '血液型占い',
    subtitle: 'A型・B型・O型・AB型の性格タイプと相性',
    emoji: '🩸',
    themeColor: '#d64550',
    href: '/ketsueki',
  },
  {
    id: 'meimei',
    title: '姓名判断',
    subtitle: '漢字の画数から五格・吉凶をチェック',
    emoji: '🖋️',
    themeColor: '#3f7d5c',
    href: '/meimei',
  },
];

module.exports = fortuneTools;
