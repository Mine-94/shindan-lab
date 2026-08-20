// しんだんラボ — 診断データ
// 新しい診断を追加する場合はこの配列にオブジェクトを1つ追加するだけで、
// ホーム画面・ルーティングに自動で反映されます。

const quizzes = [
  {
    id: 'oshikatsu-type',
    title: 'あなたの推し活タイプ診断',
    subtitle: '推しへの愛情表現、あなたはどのタイプ？沼の深さも分かるかも',
    emoji: '💗',
    themeColor: '#ff5c8a',
    intro: '推し活の仕方は人それぞれ。8つの質問で、あなたの推し活タイプをチェックしてみましょう。',
    questions: [
      {
        text: '推しのライブ・イベントのチケットが当たった。まず何をする？',
        options: [
          { text: '速攻で参戦準備（交通・宿・アイテム）を整える', type: 'kamiseki' },
          { text: '友達に「一緒に行こう！」と誘う', type: 'fukyou' },
          { text: '静かに一人で当日を楽しみに待つ', type: 'mattari' },
          { text: '過去の参戦記録やセトリを予習し始める', type: 'numa' },
        ],
      },
      {
        text: '推しの新曲が出た。あなたの反応は？',
        options: [
          { text: '円盤・グッズの発売日をすぐチェックする', type: 'kamiseki' },
          { text: 'すぐSNSで感想を語りたくなる', type: 'fukyou' },
          { text: '良ければ良いなと軽い気持ちで聴く', type: 'mattari' },
          { text: '「絶対良い、履修する」と決めて全力で聴き込む', type: 'numa' },
        ],
      },
      {
        text: '友達に「推し活って何が楽しいの？」と聞かれたら？',
        options: [
          { text: '「現場に行けばわかる」と誘う', type: 'kamiseki' },
          { text: '布教チャンスと思い、丁寧に魅力を語る', type: 'fukyou' },
          { text: '「わかってくれる人にだけわかればいい」と思う', type: 'mattari' },
          { text: '「一緒に沼れ」とライブ映像を見せる', type: 'numa' },
        ],
      },
      {
        text: 'お財布事情、推し活にかける優先度は？',
        options: [
          { text: 'チケット・現場代最優先、そのために節約する', type: 'kamiseki' },
          { text: 'グッズより布教用の「おすそ分け」に使う', type: 'fukyou' },
          { text: '無理のない範囲でまったり楽しむ', type: 'mattari' },
          { text: '気づいたら関連グッズを全部集めている', type: 'numa' },
        ],
      },
      {
        text: '推しのSNS投稿にどう反応する？',
        options: [
          { text: 'コメントよりまずグッズ・イベント情報がないかチェック', type: 'kamiseki' },
          { text: 'すぐリポストして「見て！！」と拡散', type: 'fukyou' },
          { text: 'こっそりいいねだけ押す', type: 'mattari' },
          { text: 'いいねと同時に保存して後で見返す', type: 'numa' },
        ],
      },
      {
        text: '現場（ライブ・イベント）での自分は？',
        options: [
          { text: '誰よりも前で、誰よりも声を出して盛り上げる', type: 'kamiseki' },
          { text: '隣の人にも推しの魅力を語りかけてしまう', type: 'fukyou' },
          { text: '邪魔にならないよう静かに楽しむ', type: 'mattari' },
          { text: '双眼鏡・カメラで細部まで記録する', type: 'numa' },
        ],
      },
      {
        text: '気になる新しい推しができたら？',
        options: [
          { text: '現場に行けるかどうかでまず判断する', type: 'kamiseki' },
          { text: '好きになったらすぐ周りに布教したくなる', type: 'fukyou' },
          { text: '静かに一人でハマっていく', type: 'mattari' },
          { text: '気になったら過去作から全部履修する', type: 'numa' },
        ],
      },
      {
        text: '一言で自分の推し活を表すなら？',
        options: [
          { text: '「現場が全て」', type: 'kamiseki' },
          { text: '「推しは一人じゃ推せない、みんなで推そう」', type: 'fukyou' },
          { text: '「静かに、でも一生推す」', type: 'mattari' },
          { text: '「知れば知るほど沼」', type: 'numa' },
        ],
      },
    ],
    results: {
      kamiseki: {
        title: '神席ハンター',
        emoji: '🎫',
        desc: '現場第一主義。チケット争奪戦もへっちゃら、推しに会えるならどこへでも行くタイプです。今日もどこかで「神席」を求めて戦っています。',
        shareText: '私の推し活タイプは「神席ハンター」🎫 現場が全て！',
      },
      fukyou: {
        title: '布教職人',
        emoji: '📢',
        desc: '好きなものを一人で抱え込まず、みんなに知ってほしいタイプ。あなたのおかげで沼落ちした人、実は結構いるはずです。',
        shareText: '私の推し活タイプは「布教職人」📢 好きなものはみんなで推したい派',
      },
      mattari: {
        title: 'まったり愛でる型',
        emoji: '🌙',
        desc: '騒がしくなくても愛は本物。自分のペースで、静かに長く推し続けるタイプです。',
        shareText: '私の推し活タイプは「まったり愛でる型」🌙 静かに、でも一生推してます',
      },
      numa: {
        title: '沼職人',
        emoji: '🕳️',
        desc: '知れば知るほど深みにハマる研究者気質。気づいたら関連情報を全部把握しているタイプです。',
        shareText: '私の推し活タイプは「沼職人」🕳️ 知れば知るほど沼です',
      },
    },
  },
  {
    id: 'honto-no-seikaku',
    title: '本当の性格タイプ診断',
    subtitle: 'MBTIだけじゃ分からない、あなたの"隠れた性格"をチェック',
    emoji: '🎭',
    themeColor: '#5b8cff',
    intro: '見せている自分と、本当の自分。8つの質問で、そのギャップから"隠れた性格タイプ"を診断します。',
    questions: [
      {
        text: '初対面の人が多い場に行くと？',
        options: [
          { text: '誰とでもすぐ話せて、そのままの自分でいられる', type: 'sunao' },
          { text: '頑張って明るく振る舞うけど、帰ったらどっと疲れる', type: 'kamen' },
          { text: '自分から話しかけないが、内心は特に緊張していない', type: 'jishin' },
          { text: '表面は平気そうに見せているが、内心はかなり気を遣っている', type: 'kakure' },
        ],
      },
      {
        text: 'グループの中での自分の役割は？',
        options: [
          { text: '自然と場を盛り上げる中心にいる', type: 'sunao' },
          { text: '「盛り上げ役」を求められている気がして演じている', type: 'kamen' },
          { text: '聞き役だけど、実は自分の意見にはかなり自信がある', type: 'jishin' },
          { text: '空気を読みすぎて、自分の意見を飲み込みがち', type: 'kakure' },
        ],
      },
      {
        text: '予定がぎっしりだった翌日は？',
        options: [
          { text: 'むしろ元気が出るタイプ', type: 'sunao' },
          { text: '楽しかったけど、次の日は絶対一人時間が必要', type: 'kamen' },
          { text: '予定通り淡々とこなせる', type: 'jishin' },
          { text: '誰にも気づかれないくらい、実はかなり消耗している', type: 'kakure' },
        ],
      },
      {
        text: '友達に指摘やダメ出しをされたら？',
        options: [
          { text: 'あまり気にせず「そうなんだ」で終わる', type: 'sunao' },
          { text: '表では笑って流すけど、後で結構引きずる', type: 'kamen' },
          { text: '一瞬考えるけど、自分の軸があるのですぐ立て直せる', type: 'jishin' },
          { text: '何日も頭の中でリプレイしてしまう', type: 'kakure' },
        ],
      },
      {
        text: '大きな音・強い光・人混みなどの刺激には？',
        options: [
          { text: '特に気にならない', type: 'sunao' },
          { text: '平気なふりはできるけど、実は結構疲れる', type: 'kamen' },
          { text: '苦手だが、それを理由に予定を変えたりはしない', type: 'jishin' },
          { text: 'かなり敏感で、事前に対策を考えてしまう', type: 'kakure' },
        ],
      },
      {
        text: 'SNSでの自分の見え方は？',
        options: [
          { text: 'リアルの自分とほぼ同じ、素のまま投稿する', type: 'sunao' },
          { text: '実際より明るく・楽しそうに見えるように調整している', type: 'kamen' },
          { text: 'あまり投稿しないが、投稿するときは自信を持って出す', type: 'jishin' },
          { text: '明るい投稿の裏で、実はその日結構落ち込んでいたりする', type: 'kakure' },
        ],
      },
      {
        text: '誰かに相談を受けたとき？',
        options: [
          { text: '素直に思ったことをそのまま伝える', type: 'sunao' },
          { text: '相手が求めてそうな答えを優先して言葉を選ぶ', type: 'kamen' },
          { text: '自分の考えをはっきり伝える、ブレない', type: 'jishin' },
          { text: '相手の気持ちを考えすぎて、言葉に詰まることがある', type: 'kakure' },
        ],
      },
      {
        text: '一人の時間について？',
        options: [
          { text: 'なくても平気、人といる方が好き', type: 'sunao' },
          { text: '楽しい時間の後は、一人の時間で"充電"が必須', type: 'kamen' },
          { text: '一人の時間は好きだが、必須というほどでもない', type: 'jishin' },
          { text: '一人の時間がないと、心がすり減っていく感覚がある', type: 'kakure' },
        ],
      },
    ],
    results: {
      sunao: {
        title: '素直外向型',
        emoji: '🌞',
        desc: '見せている自分と本当の自分がほぼ同じ、裏表のないタイプ。エネルギーの源は人との関わりそのものです。',
        shareText: '私の本当の性格タイプは「素直外向型」🌞 裏表なしで生きてます',
      },
      kamen: {
        title: '仮面ムードメーカー型',
        emoji: '🎭',
        desc: '場を盛り上げるのが得意だけど、実はその裏でしっかり消耗しているタイプ。一人の時間でのチャージが欠かせません。',
        shareText: '私の本当の性格タイプは「仮面ムードメーカー型」🎭 実は結構がんばってます',
      },
      jishin: {
        title: '自信内向型',
        emoji: '🌙',
        desc: '物静かに見えても、内側には揺るがない自分の軸があるタイプ。無理に外向的になろうとしなくて大丈夫です。',
        shareText: '私の本当の性格タイプは「自信内向型」🌙 物静かだけど揺るぎません',
      },
      kakure: {
        title: '隠れ繊細さん型',
        emoji: '🍃',
        desc: '周りには気づかれにくいけれど、実はかなり繊細に物事を感じ取っているタイプ。頑張りすぎず、自分のペースを大事にしてください。',
        shareText: '私の本当の性格タイプは「隠れ繊細さん型」🍃 実はかなり繊細さんでした',
      },
    },
  },
  {
    id: 'jinsei-balance-game',
    title: '人生の選択バランスゲーム',
    subtitle: 'AとB、あなたはどっちを選ぶ？8つの二択で価値観をチェック',
    emoji: '⚖️',
    themeColor: '#2ec4b6',
    intro: '正解のない8つの二択に答えて、あなたが「安定」と「挑戦」どちらに価値を置くタイプかを診断します。',
    questions: [
      {
        text: '今の安定した仕事 vs 給料は不安定だけど好きなことができる仕事',
        options: [
          { text: '今の安定した仕事', type: 'antei' },
          { text: '好きなことができる仕事', type: 'chousen' },
        ],
      },
      {
        text: '知ってる店で無難に美味しいもの vs 当たり外れある新しいお店に挑戦',
        options: [
          { text: '知ってる店で無難に美味しいもの', type: 'antei' },
          { text: '新しいお店に挑戦', type: 'chousen' },
        ],
      },
      {
        text: '貯金を堅実に増やす vs 自己投資・経験にどんどん使う',
        options: [
          { text: '貯金を堅実に増やす', type: 'antei' },
          { text: '自己投資・経験にどんどん使う', type: 'chousen' },
        ],
      },
      {
        text: '慣れた行き先の旅行 vs 未知の国へ一人旅',
        options: [
          { text: '慣れた行き先の旅行', type: 'antei' },
          { text: '未知の国へ一人旅', type: 'chousen' },
        ],
      },
      {
        text: '今の人間関係を大事にする vs 新しいコミュニティにどんどん飛び込む',
        options: [
          { text: '今の人間関係を大事にする', type: 'antei' },
          { text: '新しいコミュニティにどんどん飛び込む', type: 'chousen' },
        ],
      },
      {
        text: 'リスクの少ない安全な選択肢 vs リターンは大きいがリスクもある選択肢',
        options: [
          { text: 'リスクの少ない安全な選択肢', type: 'antei' },
          { text: 'リターンは大きいがリスクもある選択肢', type: 'chousen' },
        ],
      },
      {
        text: '計画通りに進める1日 vs 予定を決めずに気の向くまま過ごす1日',
        options: [
          { text: '計画通りに進める1日', type: 'antei' },
          { text: '予定を決めずに気の向くまま過ごす1日', type: 'chousen' },
        ],
      },
      {
        text: '今のポジションで着実にキャリアを積む vs 転職・独立にチャレンジする',
        options: [
          { text: '今のポジションで着実にキャリアを積む', type: 'antei' },
          { text: '転職・独立にチャレンジする', type: 'chousen' },
        ],
      },
    ],
    results: {
      antei: {
        title: '安定追求型',
        emoji: '🛡️',
        desc: '無理な冒険より、着実さと安心感を大事にするタイプ。堅実な選択の積み重ねが、実は一番強い生き方です。',
        shareText: '人生バランスゲームの結果は「安定追求型」🛡️ 着実に生きてます',
      },
      chousen: {
        title: '挑戦追求型',
        emoji: '🔥',
        desc: '安定より可能性にかけるタイプ。リスクを恐れず動けるその行動力が、あなたの一番の武器です。',
        shareText: '人生バランスゲームの結果は「挑戦追求型」🔥 可能性にかけるタイプでした',
      },
    },
  },
];

module.exports = quizzes;
