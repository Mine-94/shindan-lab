'use strict';

// 本人・公式が4文字タイプを公表したことを確認できる人物だけを掲載します。
// 推測タイピングは含めません。タイプは再診断で変わることがあるため、出典と確認日を保持します。
const VERIFIED_AT = '2026-09-03';
const TYPE_SOURCE = (code) => `https://futari-no-torisetsu.com/oshi/type/${code.toLowerCase()}`;

const TYPE16_CELEBRITIES = Object.freeze({
  INTJ: Object.freeze([
    { name: 'リュジン', affiliation: 'ITZY', visual: 'リ', sourceUrl: 'https://futari-no-torisetsu.com/oshi/itzy-ryujin', sourceLabel: '本人・公式の公表情報' },
    { name: 'EJ', affiliation: '&TEAM', visual: 'EJ', sourceUrl: 'https://futari-no-torisetsu.com/oshi/andteam-ej', sourceLabel: '本人・公式の公表情報' },
    { name: '林瑠奈', affiliation: '乃木坂46', visual: '林', sourceUrl: TYPE_SOURCE('INTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  INTP: Object.freeze([
    { name: 'ZICO', affiliation: 'アーティスト', visual: 'Z', sourceUrl: 'https://www.tenasia.com/tv/2025071505004', sourceLabel: '本人出演コンテンツの報道' },
    { name: '池田瑛紗', affiliation: '乃木坂46', visual: '池', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ikeda-teresa', sourceLabel: '乃木坂46公式ブログで公表' },
    { name: '高見文寧', affiliation: 'ME:I', visual: '高', sourceUrl: TYPE_SOURCE('INTP'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ENTJ: Object.freeze([
    { name: 'チャン・ウォニョン', affiliation: 'IVE', visual: 'W', sourceUrl: 'https://www.koreastardaily.com/tc/news/156727', sourceLabel: '本人出演インタビューの報道' },
    { name: '田島将吾', affiliation: 'INI', visual: '田', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tajima-shogo', sourceLabel: '本人・公式の公表情報' },
    { name: '清水理央', affiliation: '日向坂46', visual: '清', sourceUrl: 'https://futari-no-torisetsu.com/oshi/shimizu-rio', sourceLabel: '本人出演番組で公表' },
  ]),
  ENTP: Object.freeze([
    { name: '大西流星', affiliation: 'なにわ男子', visual: '大', sourceUrl: 'https://futari-no-torisetsu.com/oshi/onishi-ryusei', sourceLabel: '公式YouTubeで本人が受検' },
    { name: '宇野実彩子', affiliation: 'AAA', visual: '宇', sourceUrl: TYPE_SOURCE('ENTP'), sourceLabel: '本人・公式の公表情報' },
    { name: '岡本信彦', affiliation: '声優', visual: '岡', sourceUrl: 'https://futari-no-torisetsu.com/oshi/okamoto-nobuhiko', sourceLabel: '本人確認情報を公式番組で公表' },
  ]),
  INFJ: Object.freeze([
    { name: '北川景子', affiliation: '俳優', visual: '北', sourceUrl: 'https://futari-no-torisetsu.com/oshi/kitagawa-keiko', sourceLabel: '本人公式SNSで公表' },
    { name: 'IU', affiliation: 'アーティスト・俳優', visual: 'IU', sourceUrl: TYPE_SOURCE('INFJ'), sourceLabel: '本人・公式の公表情報' },
    { name: 'ソン・ヘギョ', affiliation: '俳優', visual: '宋', sourceUrl: 'https://www.dipe.co.kr/2235758', sourceLabel: '本人出演インタビューの報道' },
  ]),
  INFP: Object.freeze([
    { name: 'パク・ソジュン', affiliation: '俳優', visual: '朴', sourceUrl: 'https://www.sportschosun.com/entertainment/2023-02-15/202302160100112600014780', sourceLabel: '本人出演インタビューの報道' },
    { name: '佐々木舞香', affiliation: '=LOVE', visual: '佐', sourceUrl: 'https://mbtix.jp/sasaki-maika-mbti/', sourceLabel: '本人公表情報の整理記事' },
    { name: 'ホシ', affiliation: 'SEVENTEEN', visual: 'H', sourceUrl: 'https://futari-no-torisetsu.com/oshi/seventeen-hoshi', sourceLabel: 'SEVENTEEN公式YouTubeで公表' },
  ]),
  ENFJ: Object.freeze([
    { name: 'イ・ビョンホン', affiliation: '俳優', visual: '李', sourceUrl: 'https://www.osen.co.kr/article/G1112159331', sourceLabel: '本人出演ラジオの報道' },
    { name: 'ミンギュ', affiliation: 'SEVENTEEN', visual: 'M', sourceUrl: TYPE_SOURCE('ENFJ'), sourceLabel: '本人・公式の公表情報' },
    { name: 'ジョシュア', affiliation: 'SEVENTEEN', visual: 'J', sourceUrl: 'https://futari-no-torisetsu.com/oshi/seventeen-joshua', sourceLabel: 'SEVENTEEN公式YouTubeで公表' },
  ]),
  ENFP: Object.freeze([
    { name: '高橋恭平', affiliation: 'なにわ男子', visual: '高', sourceUrl: 'https://futari-no-torisetsu.com/oshi/takahashi-kyohei', sourceLabel: '公式YouTubeで本人が受検' },
    { name: 'ユナ', affiliation: 'ITZY', visual: 'Y', sourceUrl: 'https://futari-no-torisetsu.com/oshi/itzy-yuna', sourceLabel: '本人出演コンテンツで公表' },
    { name: '濱家隆一', affiliation: 'かまいたち', visual: '濱', sourceUrl: 'https://futari-no-torisetsu.com/oshi/hamaie-ryuichi', sourceLabel: '公式YouTubeで本人が受検' },
  ]),
  ISTJ: Object.freeze([
    { name: '石川界人', affiliation: '声優', visual: '石', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ishikawa-kaito', sourceLabel: '本人公式SNSで公表' },
    { name: '筒井あやめ', affiliation: '乃木坂46', visual: '筒', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tsutsui-ayame', sourceLabel: '本人インタビューで公表' },
    { name: 'テギョン', affiliation: '2PM', visual: 'T', sourceUrl: TYPE_SOURCE('ISTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ISFJ: Object.freeze([
    { name: '石井蘭', affiliation: 'ME:I', visual: '蘭', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ishii-ran', sourceLabel: '本人申告プロフィールで公表' },
    { name: '石塚瑶季', affiliation: '日向坂46', visual: '石', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ishizuka-tamaki', sourceLabel: '本人出演番組で公表' },
    { name: 'チャンミン', affiliation: '東方神起', visual: 'C', sourceUrl: TYPE_SOURCE('ISFJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ESTJ: Object.freeze([
    { name: '日高里菜', affiliation: '声優', visual: '日', sourceUrl: 'https://futari-no-torisetsu.com/oshi/hidaka-rina', sourceLabel: '本人出演番組で公表' },
    { name: '篠塚大輝', affiliation: 'timelesz', visual: '篠', sourceUrl: TYPE_SOURCE('ESTJ'), sourceLabel: '本人・公式の公表情報' },
    { name: 'YURI', affiliation: 'HANA', visual: 'Y', sourceUrl: TYPE_SOURCE('ESTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ESFJ: Object.freeze([
    { name: 'j-hope', affiliation: 'BTS', visual: 'JH', sourceUrl: 'https://futari-no-torisetsu.com/oshi/bts-j-hope', sourceLabel: '本人出演コンテンツで再公表' },
    { name: '髙地優吾', affiliation: 'SixTONES', visual: '髙', sourceUrl: 'https://futari-no-torisetsu.com/oshi/kochi-yugo', sourceLabel: '公式YouTubeで本人が受検' },
    { name: '永野芽郁', affiliation: '俳優', visual: '永', sourceUrl: TYPE_SOURCE('ESFJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ISTP: Object.freeze([
    { name: 'ジス', affiliation: 'BLACKPINK', visual: 'J', sourceUrl: 'https://futari-no-torisetsu.com/oshi/jisoo', sourceLabel: '本人公式YouTubeで公表' },
    { name: '道枝駿佑', affiliation: 'なにわ男子', visual: '道', sourceUrl: 'https://futari-no-torisetsu.com/oshi/michieda-shunsuke', sourceLabel: '公式YouTubeで本人が受検' },
    { name: '優里', affiliation: 'アーティスト', visual: '優', sourceUrl: 'https://futari-no-torisetsu.com/oshi/yuuri-singer', sourceLabel: '本人公式YouTubeで公表' },
  ]),
  ISFP: Object.freeze([
    { name: 'パク・ボヨン', affiliation: '俳優', visual: '朴', sourceUrl: 'https://www.osen.co.kr/article/G1112159331', sourceLabel: '本人出演ラジオの報道' },
    { name: '田中樹', affiliation: 'SixTONES', visual: '田', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tanaka-juri', sourceLabel: '公式YouTubeで本人が受検' },
    { name: 'ヨサン', affiliation: 'ATEEZ', visual: 'Y', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ateez-yeosang', sourceLabel: 'ATEEZ公式YouTubeで公表' },
  ]),
  ESTP: Object.freeze([
    { name: 'テヒョン', affiliation: 'TOMORROW X TOGETHER', visual: 'T', sourceUrl: 'https://futari-no-torisetsu.com/oshi/group/txt', sourceLabel: '本人・公式の公表情報' },
    { name: '平尾帆夏', affiliation: '日向坂46', visual: '平', sourceUrl: 'https://futari-no-torisetsu.com/oshi/hirao-honoka', sourceLabel: '本人出演番組で公表' },
    { name: 'ジミン', affiliation: 'BTS', visual: 'J', sourceUrl: TYPE_SOURCE('ESTP'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ESFP: Object.freeze([
    { name: '永瀬廉', affiliation: 'King & Prince', visual: '永', sourceUrl: 'https://futari-no-torisetsu.com/oshi/nagase-ren', sourceLabel: '本人出演コンテンツで公表' },
    { name: '河野純喜', affiliation: 'JO1', visual: '河', sourceUrl: 'https://mbtix.jp/kono-junki-mbti/', sourceLabel: '本人公表情報の整理記事' },
    { name: '出口夏希', affiliation: '俳優', visual: '出', sourceUrl: 'https://futari-no-torisetsu.com/oshi/deguchi-natsuki', sourceLabel: '本人インタビューで公表' },
  ]),
});

function getType16Celebrities(code) {
  return TYPE16_CELEBRITIES[String(code || '').toUpperCase()] || [];
}

module.exports = {
  VERIFIED_AT,
  TYPE16_CELEBRITIES,
  getType16Celebrities,
};
