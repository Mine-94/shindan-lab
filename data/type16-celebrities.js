'use strict';

// 本人・公式が4文字タイプを公表したことを確認できる人物だけを掲載します。
// 推測タイピングは含めません。タイプは再診断で変わることがあるため、出典と確認日を保持します。
// 選定時は、日本での認知度、BTS・BIGBANG・BLACKPINKへの関心、本人公表の明確さを優先します。
const VERIFIED_AT = '2026-09-03';
const TYPE_SOURCE = (code) => `https://futari-no-torisetsu.com/oshi/type/${code.toLowerCase()}`;
const BTS_2022_SOURCE = 'https://www.billboard-japan.com/d_news/detail/111814/2';
const BIGBANG_2024_SOURCE = 'https://www.allkpop.com/article/2024/11/g-dragon-humorously-rejects-akmus-lee-chan-hyuks-duet-proposal';

const TYPE16_CELEBRITIES = Object.freeze({
  INTJ: Object.freeze([
    { name: 'リュジン', affiliation: 'ITZY', visual: 'リ', sourceUrl: 'https://futari-no-torisetsu.com/oshi/itzy-ryujin', sourceLabel: '本人・公式の公表情報' },
    { name: 'EJ', affiliation: '&TEAM', visual: 'EJ', sourceUrl: 'https://futari-no-torisetsu.com/oshi/andteam-ej', sourceLabel: '本人・公式の公表情報' },
    { name: '林瑠奈', affiliation: '乃木坂46', visual: '林', sourceUrl: TYPE_SOURCE('INTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  INTP: Object.freeze([
    { name: 'JIN', affiliation: 'BTS', visual: 'J', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: 'JUNG KOOK', affiliation: 'BTS', visual: 'JK', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: '池田瑛紗', affiliation: '乃木坂46', visual: '池', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ikeda-teresa', sourceLabel: '乃木坂46公式ブログで公表' },
  ]),
  ENTJ: Object.freeze([
    { name: 'チャン・ウォニョン', affiliation: 'IVE', visual: 'W', sourceUrl: 'https://www.koreastardaily.com/tc/news/156727', sourceLabel: '本人出演インタビューの報道' },
    { name: '田島将吾', affiliation: 'INI', visual: '田', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tajima-shogo', sourceLabel: '本人・公式の公表情報' },
    { name: '清水理央', affiliation: '日向坂46', visual: '清', sourceUrl: 'https://futari-no-torisetsu.com/oshi/shimizu-rio', sourceLabel: '本人出演番組で公表' },
  ]),
  ENTP: Object.freeze([
    { name: 'G-DRAGON', affiliation: 'BIGBANG', visual: 'GD', sourceUrl: BIGBANG_2024_SOURCE, sourceLabel: '本人出演の公式YouTube企画で公表' },
    { name: '大西流星', affiliation: 'なにわ男子', visual: '大', sourceUrl: 'https://futari-no-torisetsu.com/oshi/onishi-ryusei', sourceLabel: '公式YouTubeで本人が受検' },
    { name: '岡本信彦', affiliation: '声優', visual: '岡', sourceUrl: 'https://futari-no-torisetsu.com/oshi/okamoto-nobuhiko', sourceLabel: '本人確認情報を公式番組で公表' },
  ]),
  INFJ: Object.freeze([
    { name: 'JENNIE', affiliation: 'BLACKPINK', visual: 'JN', sourceUrl: 'https://www.mt.co.kr/entertainment/2025/01/31/2025013109485654446', sourceLabel: '本人出演コンテンツで初公表' },
    { name: 'TAEYANG', affiliation: 'BIGBANG', visual: 'T', sourceUrl: BIGBANG_2024_SOURCE, sourceLabel: '本人出演の公式YouTube企画で公表' },
    { name: '北川景子', affiliation: '俳優', visual: '北', sourceUrl: 'https://futari-no-torisetsu.com/oshi/kitagawa-keiko', sourceLabel: '本人公式SNSで公表' },
  ]),
  INFP: Object.freeze([
    { name: 'V', affiliation: 'BTS', visual: 'V', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: 'パク・ソジュン', affiliation: '俳優', visual: '朴', sourceUrl: 'https://www.sportschosun.com/entertainment/2023-02-15/202302160100112600014780', sourceLabel: '本人出演インタビューの報道' },
    { name: '佐々木舞香', affiliation: '=LOVE', visual: '佐', sourceUrl: 'https://mbtix.jp/sasaki-maika-mbti/', sourceLabel: '本人公表情報の整理記事' },
  ]),
  ENFJ: Object.freeze([
    { name: '藤原丈一郎', affiliation: 'なにわ男子', visual: '藤', sourceUrl: 'https://futari-no-torisetsu.com/oshi/fujiwara-joichiro', sourceLabel: '公式YouTubeで本人が受検' },
    { name: 'イ・ビョンホン', affiliation: '俳優', visual: '李', sourceUrl: 'https://www.osen.co.kr/article/G1112159331', sourceLabel: '本人出演ラジオの報道' },
    { name: 'ミンギュ', affiliation: 'SEVENTEEN', visual: 'M', sourceUrl: TYPE_SOURCE('ENFJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ENFP: Object.freeze([
    { name: 'RM', affiliation: 'BTS', visual: 'RM', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: 'ROSÉ', affiliation: 'BLACKPINK', visual: 'R', sourceUrl: 'https://futari-no-torisetsu.com/oshi/rose-blackpink', sourceLabel: '本人公式YouTubeで公表' },
    { name: '高橋恭平', affiliation: 'なにわ男子', visual: '高', sourceUrl: 'https://futari-no-torisetsu.com/oshi/takahashi-kyohei', sourceLabel: '公式YouTubeで本人が受検' },
  ]),
  ISTJ: Object.freeze([
    { name: '石川界人', affiliation: '声優', visual: '石', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ishikawa-kaito', sourceLabel: '本人公式SNSで公表' },
    { name: '筒井あやめ', affiliation: '乃木坂46', visual: '筒', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tsutsui-ayame', sourceLabel: '本人インタビューで公表' },
    { name: 'テギョン', affiliation: '2PM', visual: 'T', sourceUrl: TYPE_SOURCE('ISTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ISFJ: Object.freeze([
    { name: 'D-LITE', affiliation: 'BIGBANG', visual: 'D', sourceUrl: BIGBANG_2024_SOURCE, sourceLabel: '本人出演の公式YouTube企画で公表' },
    { name: '石井蘭', affiliation: 'ME:I', visual: '蘭', sourceUrl: 'https://futari-no-torisetsu.com/oshi/ishii-ran', sourceLabel: '本人申告プロフィールで公表' },
    { name: 'チャンミン', affiliation: '東方神起', visual: 'C', sourceUrl: TYPE_SOURCE('ISFJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ESTJ: Object.freeze([
    { name: '日高里菜', affiliation: '声優', visual: '日', sourceUrl: 'https://futari-no-torisetsu.com/oshi/hidaka-rina', sourceLabel: '本人出演番組で公表' },
    { name: '篠塚大輝', affiliation: 'timelesz', visual: '篠', sourceUrl: TYPE_SOURCE('ESTJ'), sourceLabel: '本人・公式の公表情報' },
    { name: 'YURI', affiliation: 'HANA', visual: 'Y', sourceUrl: TYPE_SOURCE('ESTJ'), sourceLabel: '本人・公式の公表情報' },
  ]),
  ESFJ: Object.freeze([
    { name: 'j-hope', affiliation: 'BTS', visual: 'JH', sourceUrl: 'https://sports.khan.co.kr/article/202506201445003', sourceLabel: '2025年に本人が再診断結果を公表' },
    { name: '髙地優吾', affiliation: 'SixTONES', visual: '髙', sourceUrl: 'https://futari-no-torisetsu.com/oshi/kochi-yugo', sourceLabel: '公式YouTubeで本人が受検' },
    { name: '齊藤なぎさ', affiliation: '俳優・タレント', visual: '齊', sourceUrl: 'https://futari-no-torisetsu.com/oshi/saito-nagisa', sourceLabel: '本人が舞台挨拶で公表' },
  ]),
  ISTP: Object.freeze([
    { name: 'SUGA', affiliation: 'BTS', visual: 'SG', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: 'JISOO', affiliation: 'BLACKPINK', visual: 'JS', sourceUrl: 'https://futari-no-torisetsu.com/oshi/jisoo', sourceLabel: '本人公式YouTubeで公表' },
    { name: '道枝駿佑', affiliation: 'なにわ男子', visual: '道', sourceUrl: 'https://futari-no-torisetsu.com/oshi/michieda-shunsuke', sourceLabel: '公式YouTubeで本人が受検' },
  ]),
  ISFP: Object.freeze([
    { name: 'LISA', affiliation: 'BLACKPINK', visual: 'L', sourceUrl: 'https://futari-no-torisetsu.com/oshi/lisa', sourceLabel: '本人公式コミュニティで再診断結果を公表' },
    { name: '藤田ニコル', affiliation: 'モデル・タレント', visual: '藤', sourceUrl: 'https://futari-no-torisetsu.com/oshi/fujita-nicole', sourceLabel: '本人公表情報' },
    { name: '田中樹', affiliation: 'SixTONES', visual: '田', sourceUrl: 'https://futari-no-torisetsu.com/oshi/tanaka-juri', sourceLabel: '公式YouTubeで本人が受検' },
  ]),
  ESTP: Object.freeze([
    { name: 'JIMIN', affiliation: 'BTS', visual: 'JM', sourceUrl: BTS_2022_SOURCE, sourceLabel: 'BANGTANTV公式企画で本人が受検' },
    { name: '広瀬すず', affiliation: '俳優', visual: '広', sourceUrl: TYPE_SOURCE('ESTP'), sourceLabel: '本人・公式の公表情報' },
    { name: '平尾帆夏', affiliation: '日向坂46', visual: '平', sourceUrl: 'https://futari-no-torisetsu.com/oshi/hirao-honoka', sourceLabel: '本人出演番組で公表' },
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
