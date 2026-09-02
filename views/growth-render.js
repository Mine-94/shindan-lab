"use strict";

const {
  TYPE16_CODES,
  TYPE16_TYPES,
  TYPE16_RELATIONS,
  normalizeType16Code,
  normalizeRelation,
  getType16,
} = require('../data/type16');

const GROWTH_VERSION = '2026-09-02-v2';
const LAST_MODIFIED = '2026-09-02';

const RELATION_GUIDES = Object.freeze({
  love: {
    key: 'love',
    shortLabel: '恋愛',
    audienceLabel: '気になる人・恋人',
    emoji: '💗',
    title: '16タイプ恋愛相性ガイド',
    subtitle: '連絡頻度・気持ちの伝え方・デート計画・仲直りの違いを整理',
    description:
      '16タイプの恋愛相性を、単純な順位ではなく、連絡頻度、愛情表現、デート計画、衝突後の修復という4つの場面から整理します。二人のタイプを選ぶと、会話のヒントまで無料で確認できます。',
    intro:
      '恋愛では「好き」の大きさより、連絡の取り方、安心の作り方、予定の決め方が違うことで、すれ違いが起こりやすくなります。このページでは、4文字タイプを関係の良し悪しを決めるラベルではなく、二人が説明し合うための補助線として使います。',
    scenarios: [
      {
        title: '連絡頻度のすれ違い',
        body: '返信の速さを愛情の大きさと結びつけると、E/IやJ/Pの違いが不安に変わりやすくなります。返せない時間帯と、急ぎの連絡方法を先に決める方が実用的です。',
      },
      {
        title: '気持ちの伝え方',
        body: '解決策を示すことが愛情表現になる人と、まず共感してほしい人がいます。相談の最初に「聞いてほしい？一緒に考える？」と確認すると、T/Fの差を強みに変えられます。',
      },
      {
        title: 'デートや将来の計画',
        body: '早く予定を決めたい人と、直前まで選択肢を残したい人では安心の条件が違います。変更できない締切だけ先に決め、残りを自由枠にすると両方が動きやすくなります。',
      },
      {
        title: '喧嘩した後の仲直り',
        body: 'すぐ話したい人と、一人で整理してから話したい人がいます。沈黙を拒絶と決めつけず、「何時にもう一度話すか」だけ約束して距離を取ると修復しやすくなります。',
      },
    ],
    steps: [
      '二人が一番困っている場面を一つだけ選ぶ',
      '相手の行動を性格の欠点ではなく、必要な安心の違いとして言い換える',
      '次の一週間だけ試す具体的なルールを一つ決める',
    ],
    faqs: [
      {
        question: '16タイプが同じカップルは相性が良いですか？',
        answer:
          '似た反応が多く説明は少なくて済みますが、同じ弱点も重なります。同じタイプだから必ず良い、違うタイプだから悪いとは判断できません。',
      },
      {
        question: '恋愛相性の点数が低いと別れやすいですか？',
        answer:
          'いいえ。表示する点数は4つの回答傾向から、説明が必要になりやすい場所を整理した独自の目安です。関係の将来や別れを予測する数値ではありません。',
      },
      {
        question: '相手のタイプを本人に聞かず決めてもいいですか？',
        answer:
          '推測だけで相手を決めつけるのは避けてください。比較したい場合は、一緒に簡易診断を受け、結果よりも回答の違いを話す使い方がおすすめです。',
      },
    ],
  },
  friend: {
    key: 'friend',
    shortLabel: '友達',
    audienceLabel: '友達',
    emoji: '🫶',
    title: '16タイプ友達相性ガイド',
    subtitle: '誘い方・会う頻度・相談・グループ行動の違いを整理',
    description:
      '16タイプの友達相性を、誘い方、会う頻度、相談の仕方、グループでの動き方から整理します。友達同士で診断を送り合い、二人の違いと付き合い方のヒントを無料で確認できます。',
    intro:
      '友達関係は、毎日連絡することが親しさになる人もいれば、久しぶりでも自然に話せることが安心になる人もいます。タイプを使って優劣をつけるのではなく、「自分にとって普通」を相手へ説明する材料にしてください。',
    scenarios: [
      {
        title: '誘うタイミング',
        body: '急な誘いが楽しい人と、早めに予定を知りたい人がいます。「今日どう？」だけでなく「今週と来週ならどちらが楽？」のように選択肢を出すと誘いやすくなります。',
      },
      {
        title: '会う頻度と一人時間',
        body: '会う回数や返信量を友情の深さと同一視すると疲れやすくなります。忙しい時期の連絡ペースを一度共有しておくと、距離が空いても不安が増えにくくなります。',
      },
      {
        title: '相談されたとき',
        body: '答えを一緒に探したい人と、結論より気持ちを聞いてほしい人がいます。「今は共感と作戦会議のどっちがほしい？」と聞くと、善意のすれ違いを減らせます。',
      },
      {
        title: 'グループでの役割',
        body: '盛り上げ役、調整役、観察役、実行役はどれも必要です。目立つ役だけを貢献とせず、誰が何を負担しているかを言葉にするとグループが長続きします。',
      },
    ],
    steps: [
      '会いやすい頻度と連絡しやすい時間を一度だけ共有する',
      '相談の前に、聞いてほしいのか意見がほしいのか確認する',
      '一緒に楽しめることと、別々に楽しんでよいことを分ける',
    ],
    faqs: [
      {
        question: '友達相性は恋愛相性と同じですか？',
        answer:
          '同じ二人でも重視する点が異なります。友達では会う頻度、誘い方、グループ内の役割を中心に見ているため、恋愛とは別のヒントが表示されます。',
      },
      {
        question: '友達と結果が正反対でも仲良くできますか？',
        answer:
          'できます。違いが多いほど自動的に悪いのではなく、役割を補いやすい面もあります。予定や相談の仕方を言葉にする回数が少し増えると考えてください。',
      },
      {
        question: '友達に診断を送るにはどうすればいいですか？',
        answer:
          '自分の16タイプ結果ページにある「友達に診断してもらう」ボタンから比較リンクを送れます。相手が回答すると、二人の友達相性へ進めます。',
      },
    ],
  },
  work: {
    key: 'work',
    shortLabel: '仕事',
    audienceLabel: '同僚',
    emoji: '💼',
    title: '16タイプ仕事相性ガイド',
    subtitle: '報告・意思決定・締切・役割分担の違いを仕事の強みに変える',
    description:
      '16タイプの仕事相性を、報告、意思決定、締切、役割分担の4場面から整理します。同僚やチームとの違いを、評価ではなく具体的な協働ルールへ変えるヒントを確認できます。',
    intro:
      '仕事では、性格そのものより「いつ報告するか」「何を根拠に決めるか」「どこまで決めてから動くか」が成果に直結します。タイプは採用や人事評価に使わず、チーム内の説明方法を見直すためだけに利用してください。',
    scenarios: [
      {
        title: '報告の粒度とタイミング',
        body: '途中経過を細かく共有したい人と、結論が出てから報告したい人がいます。報告の頻度、必要な数字、緊急時の基準を最初に決めると双方の負担が減ります。',
      },
      {
        title: '意思決定の根拠',
        body: '実績や具体例を重視する人と、将来の可能性から考える人がいます。会議では「確認できている事実」と「これから試す仮説」を分けると議論が噛み合います。',
      },
      {
        title: '締切と変更への対応',
        body: '早く計画を固定したい人と、状況に応じて調整したい人では進捗の見え方が違います。変更できない期限と、試行錯誤できる範囲を別々に管理してください。',
      },
      {
        title: '役割分担',
        body: '発案、調整、検証、実行の得意分野は異なります。タイプ名で仕事を固定せず、案件ごとに「誰が決める・誰が確認する・誰が伝える」を明記する方が安全です。',
      },
    ],
    steps: [
      '報告の締切・形式・必要な数字を最初に合わせる',
      '事実、仮説、感情、決定事項を会議メモで分ける',
      'タイプではなく、今回の仕事で必要な役割を具体化する',
    ],
    faqs: [
      {
        question: '16タイプを採用や人事評価に使えますか？',
        answer:
          '使わないでください。このコンテンツは非公式のエンタメ診断で、能力や適性を測定する検査ではありません。採用、配置、昇進などの判断材料には適しません。',
      },
      {
        question: '上司と部下の相性も確認できますか？',
        answer:
          '仕事・同僚の関係として会話のヒントは確認できます。ただし役職による権限差や職場環境はタイプだけでは説明できないため、結果を断定に使わないでください。',
      },
      {
        question: '仕事でタイプが合わないと感じたら？',
        answer:
          'タイプ名を理由にせず、報告頻度、締切、判断基準など困っている行動を具体化してください。変えられる仕事のルールに落とし込む方が実用的です。',
      },
    ],
  },
  family: {
    key: 'family',
    shortLabel: '家族',
    audienceLabel: '家族',
    emoji: '🏠',
    title: '16タイプ家族相性ガイド',
    subtitle: '生活リズム・頼み方・家事・距離感の違いを整理',
    description:
      '16タイプの家族相性を、生活リズム、頼み方、家事分担、距離感の4場面から整理します。近い関係だからこそ省きがちな説明を、具体的な生活ルールへ変えるヒントを確認できます。',
    intro:
      '家族は距離が近いぶん、「言わなくても分かるはず」が積み重なりやすい関係です。タイプは誰かを変える理由ではなく、生活の中で何を明確に伝えると楽になるかを探すために使います。',
    scenarios: [
      {
        title: '生活リズム',
        body: '人と話して回復する人と、家でも一人の時間が必要な人がいます。帰宅後すぐ話すか、少し休んでから話すかを決めるだけでも摩擦が減ります。',
      },
      {
        title: '頼み方と受け取り方',
        body: '曖昧なお願いで察してほしい人と、期限や範囲が分からないと動きにくい人がいます。「今日中に、食器だけ」のように具体化すると責め合いを避けられます。',
      },
      {
        title: '家事と予定管理',
        body: '先に分担を固定すると安心する人と、その日の状況で調整したい人がいます。必ず担当する仕事と、余裕がある人が行う仕事を分けると続けやすくなります。',
      },
      {
        title: '心配の伝え方',
        body: '助言をすることで守ろうとする人と、まず気持ちを認めてほしい人がいます。「心配だから提案してもいい？」と前置きすると、親切が干渉に見えにくくなります。',
      },
    ],
    steps: [
      '家で一人になりたい時間と、話したい時間を共有する',
      '頼みごとは期限・範囲・優先度を具体的にする',
      '不満が大きくなる前に、一週間だけ試す生活ルールを決める',
    ],
    faqs: [
      {
        question: '親子やきょうだいでも16タイプ相性を見られますか？',
        answer:
          '家族の関係として生活上のヒントは確認できます。ただし年齢、発達段階、役割、家庭環境の影響が大きいため、タイプだけで関係を説明しないでください。',
      },
      {
        question: '家族のタイプを勝手に決めてもいいですか？',
        answer:
          '本人の回答なしに決めつけるのは避けてください。診断を使わない場合でも、生活リズムや頼み方のヒントだけを参考にできます。',
      },
      {
        question: '相性結果を家族にどう伝えればいいですか？',
        answer:
          '「あなたはこのタイプだから」ではなく、「私は先に予定が分かると安心する」のように、自分の希望を主語にして伝えてください。',
      },
    ],
  },
});

function fallbackEscapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeInlineJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function insertBefore(html, anchor, block) {
  const index = html.indexOf(anchor);
  if (index === -1) throw new Error(`Missing growth insertion anchor: ${anchor}`);
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function insertAfter(html, anchor, block) {
  const index = html.indexOf(anchor);
  if (index === -1) throw new Error(`Missing growth insertion anchor: ${anchor}`);
  const end = index + anchor.length;
  return `${html.slice(0, end)}\n${block}${html.slice(end)}`;
}

function withGrowthAssets(html) {
  let output = html;
  if (!output.includes('/css/growth.css')) {
    output = output.replace('</head>', '<link rel="stylesheet" href="/css/growth.css" />\n</head>');
  }
  if (!output.includes('/js/growth.js')) {
    output = output.replace('</body>', '<script src="/js/growth.js"></script>\n</body>');
  }
  return output;
}

function noindexQueryPage(html) {
  if (html.includes('name="robots" content="noindex, follow"')) return html;
  return html.replace('</head>', '<meta name="robots" content="noindex, follow" />\n</head>');
}

function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

function faqHtml(faqs, escapeHtml) {
  return faqs
    .map(
      ({ question, answer }) => `
      <details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`
    )
    .join('');
}

function relationGuidePath(relation) {
  return `/16type/${relation}`;
}

function relationGuideCards(current, escapeHtml) {
  return Object.values(RELATION_GUIDES)
    .map(
      (guide) => `
      <a class="growth-relation-card${guide.key === current ? ' is-current' : ''}" href="${relationGuidePath(
        guide.key
      )}" data-relation-guide-link="${guide.key}">
        <span>${guide.emoji}</span>
        <strong>${escapeHtml(guide.shortLabel)}相性</strong>
        <small>${escapeHtml(guide.subtitle)}</small>
      </a>`
    )
    .join('');
}

function typeOptions(selected, escapeHtml) {
  const normalized = normalizeType16Code(selected);
  return TYPE16_CODES.map((code) => {
    const type = TYPE16_TYPES[code];
    return `<option value="${code}"${code === normalized ? ' selected' : ''}>${code}｜${escapeHtml(
      type.name
    )}</option>`;
  }).join('');
}

function officialDisclaimer() {
  return `
    <aside class="type16-disclaimer">
      <strong>公式MBTI®ではありません。</strong>
      <p>このページの16タイプ情報は、しんだんラボが独自に作成した非公式のエンタメコンテンツです。日本MBTI協会およびThe Myers-Briggs Companyとは関係なく、心理検査・医学的診断・採用評価の代わりにはなりません。</p>
    </aside>`;
}

function homeRelationBlock(escapeHtml) {
  return `
    <section class="content-section growth-home-relations" aria-labelledby="growth-relation-title" data-growth-version="${GROWTH_VERSION}">
      <div class="growth-section-heading">
        <div>
          <p class="content-kicker">RELATION GUIDE</p>
          <h2 class="section-title" id="growth-relation-title">関係から相性を探す</h2>
          <p>同じ二人でも、恋愛・友達・仕事・家族では噛み合うポイントが変わります。知りたい関係から、タイプの違いと会話のコツを確認できます。</p>
        </div>
        <a href="/16type/compatibility" class="type16-text-link" data-growth-cta="compatibility">二人のタイプをすぐ比較 →</a>
      </div>
      <div class="growth-relation-grid">${relationGuideCards('', escapeHtml)}</div>
    </section>`;
}

function hubRelationBlock(escapeHtml) {
  return `
    <section class="info-card growth-hub-relations" data-growth-version="${GROWTH_VERSION}">
      <p class="content-kicker">RELATION</p>
      <h2>関係別の16タイプ相性ガイド</h2>
      <p>タイプの組み合わせ一覧だけでなく、実際にすれ違いやすい場面と、試しやすい会話方法を関係別にまとめています。</p>
      <div class="growth-relation-grid">${relationGuideCards('', escapeHtml)}</div>
    </section>`;
}

function inviteRelationLabel(relation) {
  const labels = {
    love: '気になる人・恋人',
    friend: '友達',
    work: '同僚',
    family: '家族',
  };
  return labels[relation] || '相手';
}

function inviteLandingBanner(compareCode, relation, escapeHtml) {
  const sender = getType16(compareCode);
  const relationLabel = inviteRelationLabel(relation);
  return `
    <section class="growth-invite-banner" data-share-landing data-compare-code="${compareCode}" data-compare-relation="${relation}" data-growth-version="${GROWTH_VERSION}">
      <span>${sender ? sender.emoji : '🧩'}</span>
      <div>
        <p class="content-kicker">INVITATION</p>
        <h2>${compareCode}の${escapeHtml(relationLabel)}から届いた比較リンク</h2>
        <p>20問に答えると、自分の16タイプ結果に続いて、${compareCode}との${escapeHtml(
          relationLabel
        )}相性を確認できます。回答内容そのものが相手に送られることはありません。</p>
      </div>
    </section>`;
}

function invitePanel(type, siteUrl, escapeHtml) {
  const friendUrl = `${siteUrl}/16type/test?compare=${type.code}&relation=friend&utm_source=invite&utm_medium=share&utm_campaign=type16_friend_compare`;
  const loveUrl = `${siteUrl}/16type/test?compare=${type.code}&relation=love&utm_source=invite&utm_medium=share&utm_campaign=type16_love_compare`;
  return `
    <section class="growth-invite-panel" data-growth-version="${GROWTH_VERSION}">
      <div>
        <p class="content-kicker">INVITE & COMPARE</p>
        <h2>相手にも診断してもらって、そのまま比較</h2>
        <p>あなたのタイプを入れた専用リンクを送れます。相手が診断を終えると、二人の相性ページへ一回で進めます。</p>
      </div>
      <div class="growth-invite-actions">
        <button class="quiz-btn" type="button" data-type16-invite data-type16-invite-relation="friend" data-inviter-type="${type.code}" data-invite-url="${escapeHtml(
          friendUrl
        )}" data-invite-text="${escapeHtml(
          `私の16タイプは${type.code}。友達相性を比べてみよう！`
        )}">友達に診断してもらう</button>
        <button class="quiz-btn quiz-btn-outline" type="button" data-type16-invite data-type16-invite-relation="love" data-inviter-type="${type.code}" data-invite-url="${escapeHtml(
          loveUrl
        )}" data-invite-text="${escapeHtml(
          `私の16タイプは${type.code}。恋愛相性を比べてみよう！`
        )}">気になる人・恋人に送る</button>
      </div>
      <p class="growth-live-status" data-growth-status aria-live="polite"></p>
    </section>`;
}

function comparisonReadyPanel(compareCode, resultCode, relation, escapeHtml) {
  const relationLabel = inviteRelationLabel(relation);
  const compareType = getType16(compareCode);
  const resultType = getType16(resultCode);
  const url = `/16type/compatibility?self=${compareCode}&partner=${resultCode}&relation=${relation}&utm_source=invite_result&utm_medium=internal&utm_campaign=type16_compare`;
  return `
    <section class="growth-comparison-ready" data-comparison-ready="true" data-self-code="${compareCode}" data-partner-code="${resultCode}" data-relation="${relation}">
      <div class="growth-comparison-pair"><span>${compareType ? compareType.emoji : '🧩'} ${compareCode}</span><b>×</b><span>${
        resultType ? resultType.emoji : '🧩'
      } ${resultCode}</span></div>
      <div>
        <p class="content-kicker">READY TO COMPARE</p>
        <h2>${compareCode}との${escapeHtml(relationLabel)}相性を見る</h2>
        <p>二人分のタイプがそろいました。違いを点数だけで終わらせず、噛み合いやすい部分と会話のコツまで確認できます。</p>
      </div>
      <a class="quiz-btn" href="${escapeHtml(url)}" data-comparison-ready-link>二人の相性結果へ →</a>
    </section>`;
}

function compatibilityGuideNav(escapeHtml) {
  return `
    <section class="info-card growth-compatibility-guides" data-growth-version="${GROWTH_VERSION}">
      <p class="content-kicker">SEARCH BY RELATION</p>
      <h2>関係別の詳しい相性ガイド</h2>
      <p>恋愛相性ガイド、友達相性ガイド、仕事相性ガイド、家族相性ガイドでは、場面ごとのすれ違いと具体的な対処法を詳しく読めます。</p>
      <div class="growth-relation-grid">${relationGuideCards('', escapeHtml)}</div>
    </section>`;
}

function relationScenarioHtml(guide, escapeHtml) {
  return guide.scenarios
    .map(
      (scenario, index) => `
      <article class="growth-scenario-card">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h2>${escapeHtml(scenario.title)}</h2>
        <p>${escapeHtml(scenario.body)}</p>
      </article>`
    )
    .join('');
}

function typeDirectoryHtml(escapeHtml) {
  return TYPE16_CODES.map((code) => {
    const type = TYPE16_TYPES[code];
    return `<a href="/16type/r/${code}" data-growth-type-link="${code}"><strong>${code}</strong><span>${type.emoji} ${escapeHtml(
      type.name
    )}</span></a>`;
  }).join('');
}

function createGrowthRenderers(original) {
  if (!original || typeof original.renderHome !== 'function') {
    throw new TypeError('renderHome is required before enabling the growth layer');
  }
  if (typeof original.renderType16Compatibility !== 'function') {
    throw new TypeError('16-type renderers are required before enabling the growth layer');
  }
  if (typeof original.baseLayout !== 'function') {
    throw new TypeError('baseLayout must be available to render relation guides');
  }

  const escapeHtml = original.escapeHtml || fallbackEscapeHtml;
  const siteUrl = original.SITE_URL;
  const siteName = original.SITE_NAME || 'しんだんラボ';

  function renderHome(quizzes, fortuneTools) {
    let html = original.renderHome(quizzes, fortuneTools);
    html = insertAfter(
      html,
      '<script src="/js/home-priority.js"></script>',
      homeRelationBlock(escapeHtml)
    );
    return withGrowthAssets(html);
  }

  function renderType16Hub() {
    let html = original.renderType16Hub();
    html = insertBefore(html, '<aside class="type16-disclaimer">', hubRelationBlock(escapeHtml));
    return withGrowthAssets(html);
  }

  function renderType16Test(query = {}) {
    const compareCode = normalizeType16Code(query.compare);
    const relation = normalizeRelation(query.relation);
    const hasComparison = TYPE16_CODES.includes(compareCode) && Object.hasOwn(RELATION_GUIDES, relation);
    let html = original.renderType16Test();

    if (hasComparison) {
      html = insertBefore(
        html,
        '<section class="tool-card type16-test-app"',
        inviteLandingBanner(compareCode, relation, escapeHtml)
      );
      html = html.replace(
        '<script src="/js/type16-test.js"></script>',
        `<script>window.__TYPE16_COMPARE__ = ${safeInlineJson({
          compare: compareCode,
          relation,
        })};</script>\n  <script src="/js/type16-test.js"></script>`
      );
      html = noindexQueryPage(html);
    }

    return withGrowthAssets(html);
  }

  function renderType16Result(typeValue, query = {}) {
    const code = normalizeType16Code(typeValue);
    const type = getType16(code);
    let html = original.renderType16Result(typeValue, query);
    if (!type) return html;

    const compareCode = normalizeType16Code(query.compare);
    const relation = normalizeRelation(query.relation);
    const hasComparison =
      TYPE16_CODES.includes(compareCode) && Object.hasOwn(RELATION_GUIDES, relation);
    const comparison = hasComparison
      ? comparisonReadyPanel(compareCode, code, relation, escapeHtml)
      : '';

    html = insertBefore(
      html,
      '<div class="type16-detail-grid">',
      `${comparison}${invitePanel(type, siteUrl, escapeHtml)}`
    );
    return withGrowthAssets(html);
  }

  function renderType16Compatibility(query = {}) {
    let html = original.renderType16Compatibility(query);
    html = insertBefore(
      html,
      '<section class="info-card">\n      <p class="content-kicker">HOW TO READ</p>',
      compatibilityGuideNav(escapeHtml)
    );
    return withGrowthAssets(html);
  }

  function renderType16RelationGuide(relationValue) {
    const relation = normalizeRelation(relationValue);
    const guide = RELATION_GUIDES[relation];
    if (!guide) throw new Error(`Unknown relation guide: ${relationValue}`);

    const content = `
  <header class="site-header quiz-header type16-hero growth-relation-hero" style="--accent:#6f5cd7">
    <div class="container">
      ${original.siteHeaderNav()}
      <div class="quiz-hero-badge">${guide.emoji}</div>
      <h1>${escapeHtml(guide.title)}</h1>
      <p class="tagline">${escapeHtml(guide.subtitle)}</p>
    </div>
  </header>

  <main class="container type16-page growth-relation-page" data-relation-guide="${guide.key}" data-growth-version="${GROWTH_VERSION}">
    <section class="tool-card growth-relation-intro">
      <p class="content-kicker">${guide.key.toUpperCase()} GUIDE</p>
      <h2>タイプの一致より、すれ違う場面を先に知る</h2>
      <p>${escapeHtml(guide.intro)}</p>
      <div class="type16-cta-row">
        <a class="quiz-btn" href="/16type/test?relation=${guide.key}&utm_source=relation_guide&utm_medium=internal&utm_campaign=type16_${guide.key}">自分の16タイプを調べる</a>
        <a class="quiz-btn quiz-btn-outline" href="#relation-check">二人のタイプを選ぶ</a>
      </div>
    </section>

    <section class="growth-scenarios" aria-labelledby="scenario-title">
      <div class="growth-section-heading">
        <div>
          <p class="content-kicker">REAL SCENES</p>
          <h2 id="scenario-title">${escapeHtml(guide.shortLabel)}で差が出やすい4つの場面</h2>
          <p>タイプ名よりも、実際の行動と会話に置き換えて確認してください。</p>
        </div>
      </div>
      <div class="growth-scenario-grid">${relationScenarioHtml(guide, escapeHtml)}</div>
    </section>

    <section class="tool-card growth-relation-check" id="relation-check">
      <p class="content-kicker">CHECK TWO TYPES</p>
      <h2>二人の${escapeHtml(guide.shortLabel)}相性を確認</h2>
      <form class="growth-pair-form" action="/16type/compatibility" method="get" data-relation-guide-form="${guide.key}">
        <div class="form-group">
          <label for="guide-self-${guide.key}">自分のタイプ</label>
          <select id="guide-self-${guide.key}" name="self" required>
            <option value="">選択してください</option>
            ${typeOptions('', escapeHtml)}
          </select>
        </div>
        <span class="growth-pair-symbol">×</span>
        <div class="form-group">
          <label for="guide-partner-${guide.key}">相手のタイプ</label>
          <select id="guide-partner-${guide.key}" name="partner" required>
            <option value="">選択してください</option>
            ${typeOptions('', escapeHtml)}
          </select>
        </div>
        <input type="hidden" name="relation" value="${guide.key}" />
        <input type="hidden" name="utm_source" value="relation_guide" />
        <input type="hidden" name="utm_medium" value="internal" />
        <input type="hidden" name="utm_campaign" value="type16_${guide.key}" />
        <button class="quiz-btn" type="submit">${escapeHtml(guide.shortLabel)}相性を見る</button>
      </form>
    </section>

    <section class="info-card growth-practical-steps">
      <p class="content-kicker">3 STEPS</p>
      <h2>結果を関係改善に使う3つの手順</h2>
      <ol>${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <p class="small-note">点数を相手へ突きつけるのではなく、自分の希望を具体的に伝えるために使ってください。</p>
    </section>

    <section class="info-card growth-other-relations">
      <p class="content-kicker">OTHER RELATIONS</p>
      <h2>別の関係から見る</h2>
      <div class="growth-relation-grid">${relationGuideCards(guide.key, escapeHtml)}</div>
    </section>

    <section class="info-card growth-type-directory">
      <p class="content-kicker">16 TYPE INDEX</p>
      <h2>16タイプの性格・${escapeHtml(guide.shortLabel)}傾向を読む</h2>
      <p>各タイプの強み、注意点、恋愛、友達、仕事、伝え方を個別ページで確認できます。</p>
      <div class="growth-type-grid">${typeDirectoryHtml(escapeHtml)}</div>
    </section>

    ${officialDisclaimer()}

    <section class="info-card faq-list">
      <p class="content-kicker">FAQ</p>
      <h2>${escapeHtml(guide.shortLabel)}相性についてよくある質問</h2>
      ${faqHtml(guide.faqs, escapeHtml)}
    </section>
  </main>`;

    const html = original.baseLayout({
      title: `${guide.title}｜16タイプの違いと会話のコツを無料確認`,
      description: guide.description,
      ogUrl: `${siteUrl}${relationGuidePath(guide.key)}`,
      themeColor: '#6f5cd7',
      content,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: guide.title,
          description: guide.description,
          url: `${siteUrl}${relationGuidePath(guide.key)}`,
          inLanguage: 'ja',
          dateModified: LAST_MODIFIED,
          isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: '16タイプ', item: `${siteUrl}/16type` },
            {
              '@type': 'ListItem',
              position: 3,
              name: guide.title,
              item: `${siteUrl}${relationGuidePath(guide.key)}`,
            },
          ],
        },
        faqJsonLd(guide.faqs),
      ],
    });
    return withGrowthAssets(html);
  }

  return {
    renderHome,
    renderType16Hub,
    renderType16Test,
    renderType16Result,
    renderType16Compatibility,
    renderType16RelationGuide,
  };
}

module.exports = {
  GROWTH_VERSION,
  RELATION_GUIDES,
  createGrowthRenderers,
};
