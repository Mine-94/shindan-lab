#!/usr/bin/env python3
"""Build and wire the Japanese SEO + invitation acquisition loop.

This script is intentionally idempotent and assertion-heavy. It is executed by
a one-time GitHub Actions workflow so application files are only pushed after
all regression and integration tests pass.
"""

from __future__ import annotations

import json
from pathlib import Path

GROWTH_VERSION = "2026-09-02-v2"
EXPECTED_SITEMAP_COUNT = 111


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


GROWTH_RENDER = r'''"use strict";

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
'''


GROWTH_JS = r'''(() => {
  'use strict';

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  function setStatus(container, message, state) {
    const status = container && container.querySelector('[data-growth-status]');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function attributedUrl(rawUrl, source, medium, campaign) {
    const url = new URL(rawUrl, window.location.origin);
    if (url.origin === window.location.origin) {
      url.searchParams.set('utm_source', source);
      url.searchParams.set('utm_medium', medium);
      url.searchParams.set('utm_campaign', campaign);
    }
    return url.toString();
  }

  async function shareInvitation(button) {
    const container = button.closest('.growth-invite-panel');
    const relation = button.dataset.type16InviteRelation || '';
    const inviterType = button.dataset.inviterType || '';
    const rawUrl = button.dataset.inviteUrl || '';
    const text = button.dataset.inviteText || '16タイプを比べてみよう';
    const url = attributedUrl(
      rawUrl,
      'invite',
      navigator.share ? 'web_share' : 'copy_link',
      `type16_${relation}_compare`
    );
    const originalLabel = button.textContent;
    button.disabled = true;

    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: text, text, url });
          track('type16_invite_share', {
            relation,
            inviter_type: inviterType,
            method: 'web_share',
            page_path: window.location.pathname,
          });
          setStatus(container, '共有メニューを開きました。', 'success');
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') {
            setStatus(container, '共有をキャンセルしました。', 'neutral');
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        track('type16_invite_share', {
          relation,
          inviter_type: inviterType,
          method: 'copy_link',
          page_path: window.location.pathname,
        });
        button.textContent = '比較リンクをコピーしました';
        setStatus(container, '相手へ貼り付けて送ってください。', 'success');
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 2200);
        return;
      }

      window.prompt('下の比較リンクをコピーしてください', url);
      track('type16_invite_share', {
        relation,
        inviter_type: inviterType,
        method: 'manual_copy',
        page_path: window.location.pathname,
      });
      setStatus(container, '表示したリンクをコピーしてください。', 'success');
    } catch (error) {
      console.error(error);
      setStatus(container, 'リンクを共有できませんでした。もう一度お試しください。', 'error');
    } finally {
      button.disabled = false;
    }
  }

  function trackOnce(element, eventName, params) {
    if (!element || element.dataset.analyticsTracked === 'true') return;
    element.dataset.analyticsTracked = 'true';
    track(eventName, params);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const relationPage = document.querySelector('[data-relation-guide]');
    if (relationPage) {
      trackOnce(relationPage, 'relation_guide_view', {
        relation: relationPage.dataset.relationGuide || '',
        page_path: window.location.pathname,
      });
    }

    const landing = document.querySelector('[data-share-landing]');
    if (landing) {
      trackOnce(landing, 'share_landing', {
        compare_type: landing.dataset.compareCode || '',
        relation: landing.dataset.compareRelation || '',
        page_path: window.location.pathname,
      });
    }

    const comparison = document.querySelector('[data-comparison-ready="true"]');
    if (comparison) {
      trackOnce(comparison, 'type16_comparison_ready', {
        self_type: comparison.dataset.selfCode || '',
        partner_type: comparison.dataset.partnerCode || '',
        relation: comparison.dataset.relation || '',
      });
    }

    document.querySelectorAll('[data-relation-guide-form]').forEach((form) => {
      form.addEventListener('submit', () => {
        track('relation_guide_submit', {
          relation: form.dataset.relationGuideForm || '',
          self_type: form.elements.self ? form.elements.self.value : '',
          partner_type: form.elements.partner ? form.elements.partner.value : '',
          page_path: window.location.pathname,
        });
      });
    });

    document.querySelectorAll('[data-type16-invite]').forEach((button) => {
      button.addEventListener('click', () => shareInvitation(button));
    });

    document.querySelectorAll('[data-relation-guide-link]').forEach((link) => {
      link.addEventListener('click', () => {
        track('relation_guide_click', {
          relation: link.dataset.relationGuideLink || '',
          source_path: window.location.pathname,
        });
      });
    });

    const comparisonLink = document.querySelector('[data-comparison-ready-link]');
    if (comparisonLink) {
      comparisonLink.addEventListener('click', () => {
        const panel = comparisonLink.closest('[data-comparison-ready]');
        track('type16_comparison_click', {
          self_type: panel ? panel.dataset.selfCode || '' : '',
          partner_type: panel ? panel.dataset.partnerCode || '' : '',
          relation: panel ? panel.dataset.relation || '' : '',
        });
      });
    }
  });
})();
'''


GROWTH_CSS = r'''/* Japanese SEO landing pages and invitation acquisition loop */

.growth-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 18px;
}

.growth-section-heading h2 {
  margin: 2px 0 8px;
}

.growth-section-heading p:last-child {
  max-width: 760px;
  margin-bottom: 0;
  line-height: 1.8;
}

.growth-home-relations {
  margin-top: 30px;
}

.growth-relation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.growth-relation-card {
  display: grid;
  align-content: start;
  gap: 7px;
  min-height: 150px;
  padding: 17px;
  border: 1px solid #e7e1ef;
  border-radius: 16px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 7px 20px rgba(55, 43, 78, 0.05);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.growth-relation-card:hover,
.growth-relation-card:focus-visible {
  border-color: #8a76d8;
  transform: translateY(-2px);
  box-shadow: 0 11px 28px rgba(55, 43, 78, 0.1);
}

.growth-relation-card.is-current {
  border-color: #9a87df;
  background: #f8f5ff;
}

.growth-relation-card > span {
  font-size: 1.75rem;
}

.growth-relation-card strong {
  font-size: 1.02rem;
}

.growth-relation-card small {
  color: #696271;
  font-size: 0.82rem;
  line-height: 1.55;
}

.growth-hub-relations,
.growth-compatibility-guides,
.growth-other-relations,
.growth-type-directory,
.growth-practical-steps {
  margin-top: 28px;
}

.growth-invite-banner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: start;
  margin: 28px 0 16px;
  padding: 18px 20px;
  border: 1px solid #d9cff3;
  border-radius: 18px;
  background: linear-gradient(135deg, #f7f3ff, #fff7fa);
}

.growth-invite-banner > span {
  font-size: 2.2rem;
}

.growth-invite-banner h2 {
  margin: 2px 0 7px;
  font-size: 1.2rem;
}

.growth-invite-banner p:last-child {
  margin: 0;
  line-height: 1.75;
}

.growth-invite-panel,
.growth-comparison-ready {
  margin: 22px 0;
  padding: 22px;
  border: 1px solid #e2dbee;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 9px 26px rgba(49, 38, 70, 0.06);
}

.growth-invite-panel h2,
.growth-comparison-ready h2 {
  margin: 3px 0 8px;
  font-size: 1.22rem;
}

.growth-invite-panel p,
.growth-comparison-ready p {
  line-height: 1.75;
}

.growth-invite-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.growth-live-status {
  min-height: 1.4em;
  margin: 11px 0 0 !important;
  text-align: center;
  font-size: 0.88rem;
}

.growth-live-status[data-state="success"] {
  color: #2e7650;
}

.growth-live-status[data-state="error"] {
  color: #a43d46;
}

.growth-comparison-ready {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  border-color: #cabcf0;
  background: linear-gradient(135deg, #f4f0ff, #fff);
}

.growth-comparison-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  font-weight: 800;
  white-space: nowrap;
}

.growth-comparison-ready p:last-child {
  margin-bottom: 0;
}

.growth-comparison-ready .quiz-btn {
  white-space: nowrap;
}

.growth-relation-hero {
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.17), transparent 28%),
    linear-gradient(145deg, #6f5cd7, #443a82);
}

.growth-relation-page {
  padding-bottom: 30px;
}

.growth-relation-intro,
.growth-relation-check {
  margin-top: 28px;
}

.growth-relation-intro > p,
.growth-relation-check > p {
  line-height: 1.85;
}

.growth-scenarios {
  margin-top: 30px;
}

.growth-scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.growth-scenario-card {
  position: relative;
  padding: 22px;
  overflow: hidden;
  border: 1px solid #e6e0ed;
  border-radius: 17px;
  background: #fff;
}

.growth-scenario-card > span {
  position: absolute;
  top: 10px;
  right: 16px;
  color: #ece7f5;
  font-size: 2.4rem;
  font-weight: 900;
}

.growth-scenario-card h2 {
  position: relative;
  margin: 0 0 10px;
  padding-right: 44px;
  font-size: 1.12rem;
}

.growth-scenario-card p {
  position: relative;
  margin: 0;
  line-height: 1.82;
}

.growth-pair-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 14px;
  align-items: end;
  margin-top: 18px;
}

.growth-pair-form .form-group {
  margin: 0;
}

.growth-pair-form label {
  display: block;
  margin-bottom: 7px;
  font-weight: 700;
}

.growth-pair-form select {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #d8d1e2;
  border-radius: 12px;
  background: #fff;
  color: inherit;
  font: inherit;
}

.growth-pair-symbol {
  padding-bottom: 12px;
  color: #948b9d;
  font-size: 1.2rem;
  font-weight: 900;
}

.growth-pair-form .quiz-btn {
  grid-column: 1 / -1;
  justify-self: center;
}

.growth-practical-steps ol {
  display: grid;
  gap: 10px;
  margin: 16px 0;
  padding-left: 1.35rem;
}

.growth-practical-steps li {
  padding-left: 5px;
  line-height: 1.75;
}

.growth-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
  margin-top: 17px;
}

.growth-type-grid a {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e5dfec;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}

.growth-type-grid a:hover,
.growth-type-grid a:focus-visible {
  border-color: #8a76d8;
  background: #faf8ff;
}

.growth-type-grid strong {
  color: #6f5cd7;
  letter-spacing: 0.08em;
}

.growth-type-grid span {
  font-size: 0.8rem;
  line-height: 1.45;
}

@media (max-width: 820px) {
  .growth-relation-grid,
  .growth-type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .growth-comparison-ready {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .growth-comparison-pair {
    justify-self: center;
  }
}

@media (max-width: 640px) {
  .growth-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .growth-relation-grid,
  .growth-scenario-grid,
  .growth-type-grid,
  .growth-pair-form {
    grid-template-columns: 1fr;
  }

  .growth-pair-symbol {
    padding: 0;
    text-align: center;
  }

  .growth-invite-banner {
    grid-template-columns: 1fr;
  }

  .growth-invite-actions {
    flex-direction: column;
  }

  .growth-invite-actions .quiz-btn,
  .growth-comparison-ready .quiz-btn {
    width: 100%;
    text-align: center;
  }
}
'''


RESULT_SHARE_JS = r'''document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copy-link-btn');
  if (!btn) return;

  const rawUrl = btn.dataset.url;
  const text = btn.dataset.text;

  function trackShare(method, sharedUrl) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'share_success', {
        method,
        shared_url: sharedUrl,
        page_path: window.location.pathname,
      });
    }
  }

  function attributedUrl(method) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin === window.location.origin) {
        url.searchParams.set('utm_source', 'result_share');
        url.searchParams.set('utm_medium', method);
        url.searchParams.set('utm_campaign', 'organic_share');
      }
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  btn.addEventListener('click', async () => {
    const webShareUrl = attributedUrl('web_share');
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: webShareUrl });
        trackShare('web_share', webShareUrl);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    const copyUrl = attributedUrl('copy_link');
    try {
      await navigator.clipboard.writeText(`${text}\n${copyUrl}`);
      trackShare('copy_link', copyUrl);
      const original = btn.textContent;
      btn.textContent = 'コピー完了！貼り付けてシェアしよう';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    } catch (err) {
      window.prompt('下のリンクをコピーしてシェアしてください', copyUrl);
      trackShare('manual_copy', copyUrl);
    }
  });
});
'''


TEST_GROWTH_JS = r'''"use strict";

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3016;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(pathname) {
  const response = await fetch(`${BASE}${pathname}`, { redirect: 'manual' });
  const text = await response.text();
  return { response, text };
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/`, { redirect: 'manual' });
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Growth test server did not become ready');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), SITE_URL: BASE },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();

    const home = await fetchText('/');
    assert(home.response.status === 200, 'Home did not return 200');
    assert(home.text.includes('data-growth-version="2026-09-02-v2"'), 'Growth marker missing');
    assert(home.text.includes('関係から相性を探す'), 'Relation discovery section missing');
    assert(home.text.includes('/16type/love'), 'Love guide missing from home');
    assert(home.text.includes('/js/growth.js'), 'Growth client missing from home');
    const priorityIndex = home.text.indexOf('data-home-priority-version');
    const growthIndex = home.text.indexOf('data-growth-version');
    const quizIndex = home.text.indexOf('<h2 class="section-title">タイプ診断</h2>');
    assert(priorityIndex < growthIndex && growthIndex < quizIndex, 'Home growth order is invalid');

    const relationCases = [
      ['love', '16タイプ恋愛相性ガイド', '恋愛相性を見る'],
      ['friend', '16タイプ友達相性ガイド', '友達相性を見る'],
      ['work', '16タイプ仕事相性ガイド', '仕事相性を見る'],
      ['family', '16タイプ家族相性ガイド', '家族相性を見る'],
    ];
    for (const [relation, heading, button] of relationCases) {
      const page = await fetchText(`/16type/${relation}`);
      assert(page.response.status === 200, `${relation} guide did not return 200`);
      assert(page.text.includes(heading), `${relation} heading is missing`);
      assert(page.text.includes(`data-relation-guide="${relation}"`), `${relation} marker missing`);
      assert(page.text.includes(`name="relation" value="${relation}"`), `${relation} hidden input missing`);
      assert(page.text.includes(button), `${relation} submit label missing`);
      assert(page.text.includes('"@type":"FAQPage"'), `${relation} FAQ structured data missing`);
      assert(page.text.includes('/css/growth.css'), `${relation} growth styles missing`);
    }

    const inviteTest = await fetchText(
      '/16type/test?compare=ENFP&relation=friend&utm_source=invite'
    );
    assert(inviteTest.response.status === 200, 'Invite test did not return 200');
    assert(inviteTest.text.includes('ENFPの友達から届いた比較リンク'), 'Invite banner missing');
    assert(inviteTest.text.includes('window.__TYPE16_COMPARE__'), 'Invite context missing');
    assert(inviteTest.text.includes('noindex, follow'), 'Invite query noindex missing');

    const comparisonResult = await fetchText('/16type/r/ISFJ?compare=ENFP&relation=friend');
    assert(comparisonResult.response.status === 200, 'Comparison result did not return 200');
    assert(comparisonResult.text.includes('data-comparison-ready="true"'), 'Comparison CTA missing');
    assert(comparisonResult.text.includes('ENFPとの友達相性を見る'), 'Comparison heading missing');
    assert(
      comparisonResult.text.includes('data-type16-invite-relation="friend"'),
      'Friend invitation button missing'
    );
    assert(
      comparisonResult.text.includes('data-type16-invite-relation="love"'),
      'Love invitation button missing'
    );
    assert(
      comparisonResult.text.includes('data-type16-share-kind="type"'),
      'Existing type share card was lost'
    );

    const compatibility = await fetchText(
      '/16type/compatibility?self=ENFP&partner=ISTJ&relation=friend'
    );
    assert(compatibility.response.status === 200, 'Compatibility did not return 200');
    assert(compatibility.text.includes('恋愛相性ガイド'), 'Relation guide nav missing');
    assert(compatibility.text.includes('data-type16-share-kind="compatibility"'), 'Share card lost');

    const sitemap = await fetchText('/sitemap.xml');
    assert(sitemap.response.status === 200, 'Sitemap did not return 200');
    assert((sitemap.text.match(/<url>/g) || []).length === 111, 'Sitemap must contain 111 URLs');
    for (const relation of ['love', 'friend', 'work', 'family']) {
      assert(sitemap.text.includes(`/16type/${relation}</loc>`), `${relation} guide missing from sitemap`);
    }

    const growthSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'growth.js'),
      'utf8'
    );
    assert(growthSource.includes('type16_invite_share'), 'Invitation analytics missing');
    assert(growthSource.includes('share_landing'), 'Share landing analytics missing');
    assert(growthSource.includes('relation_guide_submit'), 'Relation form analytics missing');

    const testSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'type16-test.js'),
      'utf8'
    );
    assert(testSource.includes("params.set('compare'"), 'Comparison preservation missing');
    assert(testSource.includes('window.__TYPE16_COMPARE__'), 'Comparison context read missing');

    const shareSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'type16-share-card.js'),
      'utf8'
    );
    assert(shareSource.includes('attributedShareUrl'), 'Image share attribution missing');
    assert(shareSource.includes('navigator.clipboard.writeText'), 'Download copy fallback missing');

    const linkShareSource = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'js', 'result-share.js'),
      'utf8'
    );
    assert(linkShareSource.includes('utm_source'), 'Link share attribution missing');

    console.log('PASS: 4 SEO relation guides, invite-to-compare loop, attribution and 111 sitemap URLs validated.');
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  if (stderr.trim()) console.error(stderr.trim());
  if (stdout.trim()) console.log(stdout.trim());
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
'''


def patch_type16_test_client() -> None:
    path = Path("public/js/type16-test.js")
    text = path.read_text(encoding="utf-8")

    if "window.__TYPE16_COMPARE__" not in text:
        text = replace_once(
            text,
            "  const root = document.querySelector('[data-type16-test]');\n",
            "  const root = document.querySelector('[data-type16-test]');\n"
            "  const compareContext = window.__TYPE16_COMPARE__ || {};\n",
            "type16 comparison context",
        )

    if "params.set('compare'" not in text:
        old = """    const params = new URLSearchParams({
      e: String(result.e),
      s: String(result.s),
      t: String(result.t),
      j: String(result.j),
    });
    const destination = `${data.resultBase}${encodeURIComponent(result.code)}?${params.toString()}`;"""
        new = """    const params = new URLSearchParams({
      e: String(result.e),
      s: String(result.s),
      t: String(result.t),
      j: String(result.j),
    });
    if (compareContext.compare) params.set('compare', compareContext.compare);
    if (compareContext.relation) params.set('relation', compareContext.relation);
    const destination = `${data.resultBase}${encodeURIComponent(result.code)}?${params.toString()}`;"""
        text = replace_once(text, old, new, "type16 result destination")

    path.write_text(text, encoding="utf-8")


def patch_type16_share_client() -> None:
    path = Path("public/js/type16-share-card.js")
    text = path.read_text(encoding="utf-8")

    if "function attributedShareUrl" not in text:
        text = replace_once(
            text,
            "  function analyticsParams(payload, method) {",
            """  function attributedShareUrl(rawUrl, method) {
    try {
      const url = new URL(rawUrl, window.location.origin);
      if (url.origin === window.location.origin) {
        url.searchParams.set('utm_source', 'share_card');
        url.searchParams.set('utm_medium', method);
        url.searchParams.set('utm_campaign', 'organic_share');
      }
      return url.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  function analyticsParams(payload, method) {""",
            "share-card attributed URL helper",
        )

    old_share = """          await navigator.share({
            files: [file],
            title: payload.title,
            text: payload.shareText,
          });"""
    if old_share in text:
        new_share = """          const sharedUrl = attributedShareUrl(payload.url, 'image_web_share');
          await navigator.share({
            files: [file],
            title: payload.title,
            text: `${payload.shareText}\n${sharedUrl}`,
            url: sharedUrl,
          });"""
        text = replace_once(text, old_share, new_share, "image web share payload")

    old_download = """      downloadBlob(blob, payload.filename);
      track('type16_share_card', analyticsParams(payload, 'download_png'));
      setStatus(panel, '画像を保存しました。Instagram・Threads・Xなどで使えます。', 'success');"""
    if old_download in text:
        new_download = """      downloadBlob(blob, payload.filename);
      const downloadUrl = attributedShareUrl(payload.url, 'download_png');
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(`${payload.shareText}\n${downloadUrl}`);
          copied = true;
        } catch (error) {
          copied = false;
        }
      }
      track('type16_share_card', analyticsParams(payload, 'download_png'));
      setStatus(
        panel,
        copied
          ? '画像を保存し、投稿用の文章とリンクもコピーしました。'
          : '画像を保存しました。Instagram・Threads・Xなどで使えます。',
        'success'
      );"""
        text = replace_once(text, old_download, new_download, "image download attribution")

    if "attributedShareUrl" not in text:
        raise RuntimeError("type16 share attribution was not installed")
    path.write_text(text, encoding="utf-8")


def patch_server() -> None:
    path = Path("server.js")
    text = path.read_text(encoding="utf-8")

    if "createGrowthRenderers" not in text:
        anchor = """const { createType16ShareRenderers } = require('./views/type16-share-render');
Object.assign(originalRender, createType16ShareRenderers({ ...originalRender }));"""
        replacement = anchor + """
const { createGrowthRenderers } = require('./views/growth-render');
Object.assign(originalRender, createGrowthRenderers({ ...originalRender }));"""
        text = replace_once(text, anchor, replacement, "growth renderer stack")

    if "  renderType16RelationGuide," not in text:
        text = replace_once(
            text,
            "  renderType16Compatibility,\n  SITE_URL,",
            "  renderType16Compatibility,\n  renderType16RelationGuide,\n  SITE_URL,",
            "growth renderer destructuring",
        )

    if "'/16type/love'," not in text:
        text = replace_once(
            text,
            "    '/16type/compatibility',\n",
            "    '/16type/compatibility',\n"
            "    '/16type/love',\n"
            "    '/16type/friend',\n"
            "    '/16type/work',\n"
            "    '/16type/family',\n",
            "relation guide sitemap paths",
        )

    text = text.replace(
        "app.get('/16type/test', (req, res) => {\n  res.send(renderType16Test());\n});",
        "app.get('/16type/test', (req, res) => {\n  res.send(renderType16Test(req.query));\n});",
    )

    if "app.get('/16type/love'" not in text:
        routes = """app.get('/16type/love', (req, res) => {
  res.send(renderType16RelationGuide('love'));
});

app.get('/16type/friend', (req, res) => {
  res.send(renderType16RelationGuide('friend'));
});

app.get('/16type/work', (req, res) => {
  res.send(renderType16RelationGuide('work'));
});

app.get('/16type/family', (req, res) => {
  res.send(renderType16RelationGuide('family'));
});

"""
        text = replace_once(
            text,
            "app.get('/16type/r/:code', (req, res) => {",
            routes + "app.get('/16type/r/:code', (req, res) => {",
            "relation guide routes",
        )

    required = [
        "createGrowthRenderers",
        "renderType16RelationGuide",
        "'/16type/love'",
        "renderType16Test(req.query)",
    ]
    for marker in required:
        if marker not in text:
            raise RuntimeError(f"server.js growth marker missing: {marker}")
    path.write_text(text, encoding="utf-8")


def patch_run_tests() -> None:
    path = Path("run_tests.sh")
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "静的31+十干10+血液型単4+血液型ペア10+姓名判断52=107",
        "静的35+十干10+血液型単4+血液型ペア10+姓名判断52=111",
    )
    text = text.replace('if [ "$url_count" == "107" ]; then', 'if [ "$url_count" == "111" ]; then')
    text = text.replace("expected 107", "expected 111")

    if "=== 関係別SEOランディングと招待比較ループ ===" not in text:
        block = '''echo ""
echo "=== 関係別SEOランディングと招待比較ループ ==="
check_status "16タイプ恋愛相性ガイド" "$BASE/16type/love" 200
check_contains "恋愛ガイドに固定relation" "$BASE/16type/love" 'name="relation" value="love"'
check_status "16タイプ友達相性ガイド" "$BASE/16type/friend" 200
check_contains "友達ガイドに固定relation" "$BASE/16type/friend" 'name="relation" value="friend"'
check_status "16タイプ仕事相性ガイド" "$BASE/16type/work" 200
check_status "16タイプ家族相性ガイド" "$BASE/16type/family" 200
check_contains "ホームに関係別導線" "$BASE/" "関係から相性を探す"
check_contains "招待テストに比較元表示" "$BASE/16type/test?compare=ENFP&relation=friend" "ENFPの友達から届いた比較リンク"
check_contains "比較後結果に相性CTA" "$BASE/16type/r/ISFJ?compare=ENFP&relation=friend" "ENFPとの友達相性を見る"
check_contains "結果に友達招待ボタン" "$BASE/16type/r/ISFJ" 'data-type16-invite-relation="friend"'
check_contains "sitemapに恋愛ガイド" "$BASE/sitemap.xml" "/16type/love</loc>"
check_contains "sitemapに家族ガイド" "$BASE/sitemap.xml" "/16type/family</loc>"

'''
        text = replace_once(
            text,
            'echo ""\necho "=== タイプ+一致率結合型(?s=0~100) ==="',
            block + 'echo ""\necho "=== タイプ+一致率結合型(?s=0~100) ==="',
            "growth regression test block",
        )

    if 'if [ "$url_count" == "111" ]; then' not in text:
        raise RuntimeError("run_tests.sh sitemap expectation was not updated")
    path.write_text(text, encoding="utf-8")


def patch_quality_test() -> None:
    path = Path("scripts/test-quality.js")
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "assert(urlCount === 107, `Unexpected sitemap URL count: ${urlCount}`);",
        "assert(urlCount === 111, `Unexpected sitemap URL count: ${urlCount}`);",
    )
    if "Home relation guide section is missing" not in text:
        text = replace_once(
            text,
            "    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');",
            "    assert(home.text.includes('16タイプ・MBTI関連'), 'Home 16-type section is missing');\n"
            "    assert(home.text.includes('関係から相性を探す'), 'Home relation guide section is missing');",
            "quality home growth assertion",
        )
    if "const loveGuide = await fetchText('/16type/love');" not in text:
        anchor = """    assert(type16Compatibility.text.includes('noindex, follow'), 'Query result noindex is missing');

"""
        addition = anchor + """    const loveGuide = await fetchText('/16type/love');
    assert(loveGuide.response.status === 200, 'Love relation guide did not return 200');
    assert(loveGuide.text.includes('16タイプ恋愛相性ガイド'), 'Love relation guide heading is missing');
    assert(loveGuide.text.includes('name=\"relation\" value=\"love\"'), 'Love guide relation input is missing');

"""
        text = replace_once(text, anchor, addition, "quality relation guide assertion")
    if "assert(urlCount === 111" not in text:
        raise RuntimeError("scripts/test-quality.js sitemap expectation was not updated")
    path.write_text(text, encoding="utf-8")


def patch_package() -> None:
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("scripts", {})["test"] = (
        "node scripts/test-growth.js && node scripts/test-type16-share.js && "
        "node scripts/test-home-priority.js && node scripts/test-type16.js && "
        "node scripts/test-quality.js"
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_docs() -> None:
    readme = Path("README.md")
    readme_text = readme.read_text(encoding="utf-8")
    if "## 16タイプ関係別SEO・招待比較ループ" not in readme_text:
        readme_text += """

## 16タイプ関係別SEO・招待比較ループ

日本語検索の関係別意図と、SNS共有後の再訪・比較行動を一つにつなぐため、次の導線を実装しています。

- `/16type/love`・`/friend`・`/work`・`/family`: 関係別の独自解説、FAQ、二人のタイプ選択フォーム
- 16タイプ結果ページ: 友達・恋人へ専用比較リンクを送る招待ボタン
- 招待リンク経由の診断: 回答後、そのまま二人の相性結果へ進めるCTA
- 共有リンク・共有画像: UTMを付与し、GA4で流入元を区別
- GA4: `relation_guide_view`、`relation_guide_submit`、`type16_invite_share`、`share_landing`、`type16_comparison_click`

256組の薄い相性ページは生成せず、検索意図が明確で十分な独自説明を持つ4つの関係ガイドだけをインデックス対象にしています。
"""
        readme.write_text(readme_text, encoding="utf-8")

    log = Path("docs/japan-seo-daily-log.md")
    log_text = log.read_text(encoding="utf-8")
    marker = "## 2026-09-02 — 관계별 검색 랜딩·친구 초대 비교 루프"
    if marker not in log_text:
        entry = f"""{marker}

### 판단

일본판은 16타입 진단·상성 도구·공유 이미지까지 갖췄지만, 검색 사용자가 자주 나누는 `연애·친구·직장·가족` 의도별 랜딩이 없고, 결과를 공유받은 사람이 진단한 뒤 자동으로 두 사람 비교까지 이어지는 흐름도 없었다. 따라서 신규 테스트 수를 늘리지 않고 기존 16타입 자산을 검색 유입과 초대 유입이 반복되는 구조로 연결했다.

### 실행

- `/16type/love`, `/friend`, `/work`, `/family` 4개 고유 검색 랜딩 추가
- 각 랜딩에 관계별 4개 실제 상황, 3단계 활용법, 전용 FAQ, 16타입 내부 링크, 비교 폼 추가
- 16타입 결과에 친구·연인 초대 링크 추가
- 초대받은 사람이 진단하면 초대자의 유형을 유지해 바로 두 사람 상성으로 이동
- 홈·16타입 허브·상성 도구에 관계별 랜딩 내부 링크 추가
- 일반 링크 공유와 이미지 공유 URL에 UTM 적용
- GA4에 초대 공유, 초대 랜딩, 비교 완료, 관계별 폼 제출 이벤트 추가
- 얇은 256개 조합 페이지는 만들지 않고, 충분한 고유 정보가 있는 4개 랜딩만 색인
- 사이트맵 107개에서 {EXPECTED_SITEMAP_COUNT}개로 확장

### 판단 기준

검색 노출만으로 대규모 성장을 보장할 수 없으며, 일본의 대형 성공 사례도 진단 자체만이 아니라 미디어/IP 제휴와 사용자 생성 공유가 결합된 경우였다. 이번 단계는 자체 사이트에서 통제할 수 있는 `검색 랜딩 → 진단 → 결과 → 초대 → 상대 진단 → 비교 → 재공유` 루프를 먼저 완성한 것이다.

---

"""
        first_rule = "---\n\n## 2026-09-02"
        if first_rule in log_text:
            log_text = log_text.replace(first_rule, f"---\n\n{entry}## 2026-09-02", 1)
        else:
            log_text += "\n" + entry
        log.write_text(log_text, encoding="utf-8")


def main() -> None:
    write("views/growth-render.js", GROWTH_RENDER)
    write("public/js/growth.js", GROWTH_JS)
    write("public/css/growth.css", GROWTH_CSS)
    write("public/js/result-share.js", RESULT_SHARE_JS)
    write("scripts/test-growth.js", TEST_GROWTH_JS)

    patch_type16_test_client()
    patch_type16_share_client()
    patch_server()
    patch_run_tests()
    patch_quality_test()
    patch_package()
    append_docs()

    required_files = [
        "views/growth-render.js",
        "public/js/growth.js",
        "public/css/growth.css",
        "scripts/test-growth.js",
    ]
    for filename in required_files:
        if not Path(filename).is_file() or Path(filename).stat().st_size < 200:
            raise RuntimeError(f"Generated file is missing or unexpectedly small: {filename}")

    server = Path("server.js").read_text(encoding="utf-8")
    assert "createGrowthRenderers" in server
    assert "renderType16Test(req.query)" in server
    assert "'/16type/family'" in server
    print(
        f"Japanese growth phase built: 4 relation guides, invite loop, attribution, {EXPECTED_SITEMAP_COUNT} sitemap URLs."
    )


if __name__ == "__main__":
    main()
