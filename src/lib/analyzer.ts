/**
 * Rule-based pain analysis engine (no external API).
 * Designed to work with Japanese text from X, YouTube, note, BBS, etc.
 * Can be swapped with an LLM-based analyzer later.
 */

import type { PainCategory, PainScores, PainAnalysis, Post } from './types';

// ── Keyword dictionaries ───────────────────────────────────────

const PAIN_KEYWORDS: Record<PainCategory, string[]> = {
  frustration: [
    '不満', '最悪', 'ひどい', 'がっかり', '期待外れ', 'クソ', 'ダメ', '使えない',
    '腹立つ', 'イライラ', '怒り', '許せない', 'ありえない', 'バグだらけ', '最低',
    '失望', '幻滅', '納得いかない', '不親切', '雑', 'ゴミ', '欠陥', 'ひどすぎ',
    '酷い', 'ひどすぎる', '無理', 'おかしい', '変', 'サポート最悪',
  ],
  hassle: [
    '面倒', 'めんどう', 'めんどくさい', '手間', '煩わしい', 'わずらわしい',
    '手間がかかる', '複雑な手順', 'ステップが多い', '何度も', '繰り返し',
    '設定が大変', '入力が多い', 'いちいち', 'わざわざ', 'また', '毎回',
    '面倒くさい', 'めんどい', 'たいへん', '手作業', '手動', 'クリックが多い',
  ],
  time_consuming: [
    '時間がかかる', '遅い', '時間の無駄', '待てない', '待ち時間', '長い',
    '時間ロス', '非効率', '生産性が低い', 'ずっと待っている', '何時間も',
    'hours', '時間がもったいない', 'タイムロス', 'もたもた', 'のろい',
    '応答が遅い', '読み込みが遅い', '処理が遅い', '何日もかかる',
    '時間がない', '間に合わない', 'ギリギリ', '締め切り',
  ],
  expensive: [
    '高い', '高すぎ', '料金が高い', 'コスト', '費用', 'お金がかかる',
    '払えない', '値段が', '月額', '年額', '課金', '有料', '料金体系',
    '費用対効果', 'コスパ', 'コスパが悪い', 'もったいない', '無駄遣い',
    '出費', '節約', '安くしたい', '無料にしてほしい', '高額', 'プレミアム',
  ],
  difficult: [
    '難しい', 'わからない', '難しすぎ', '複雑', '理解できない', '使い方がわからない',
    '初心者には', '敷居が高い', '学習コストが高い', '勉強が必要', '専門知識',
    'むずかしい', '把握できない', 'チンプンカンプン', '意味がわからない',
    '説明不足', 'ドキュメントが', 'マニュアルが', '教えてほしい', '入門',
    'ついていけない', '覚えられない', '忘れてしまう', '混乱',
  ],
  failure: [
    '失敗', 'ミス', '間違い', 'うまくいかない', 'エラー', 'バグ',
    '壊れた', '動かない', '機能しない', 'クラッシュ', '落ちた', 'フリーズ',
    '消えた', 'データが消えた', '保存できない', 'ログインできない', '繋がらない',
    '接続できない', 'リセット', '初期化', '無効', '失敗した', '試したけど',
    'やってみたが', '結局', '諦めた', 'できなかった',
  ],
  wanted: [
    '欲しい', '作って', 'あったらいいな', 'あれば', '〜したい',
    '需要ある', 'ニーズがある', '市場がある', '誰か作って', '売ってほしい',
    '機能があれば', '対応してほしい', '実装してほしい', 'リクエスト',
    '要望', 'こんなサービス', 'こんなアプリ', 'なぜない', 'なぜないの',
    'あったら買う', '課金する', 'お金払う', '探していた', 'ずっと探してた',
    'やっと見つかった', 'こういうの', 'こんな感じの',
  ],
  alternative: [
    'より', '比べて', 'の方が', '代わりに', '乗り換え', '移行',
    '他のサービス', '競合', '〜を使っていたが', '前は〜を使っていた',
    'もっといいのがあれば', '使いやすいのに', '改善してほしい', 'アップデートで',
    '昔は', 'バージョン', '廃止になった', 'サービス終了', 'なくなった',
    'なぜ廃止', 'A社', 'B社', 'の競合', '他社', '他のツール',
  ],
};

// Intensity amplifiers (stronger emotion signals)
const AMPLIFIERS = [
  '！！', '!!' , '!!!', '本当に', 'マジで', 'めちゃ', 'すごく', 'とても',
  '絶対', 'ぜったい', '死ぬほど', '最悪すぎ', 'ひどすぎ', 'やばい', 'やばすぎ',
  '超', '激', '鬼', 'ガチ', 'まじで', '信じられない',
];

// Frequency signals (suggests recurring issue)
const FREQUENCY_SIGNALS = [
  '毎回', '毎日', '毎週', '毎月', 'いつも', 'いつも', 'ずっと', 'また',
  '何度も', '繰り返し', '何回も', '頻繁', 'よく', '常に', 'たびたび',
  '何年も', '長年', 'ずーっと',
];

// Willingness to pay signals
const WTP_SIGNALS = [
  '課金', '有料', 'お金払う', '買う', '購入', '契約', 'サブスク',
  'プレミアム', '月額', '年額', '価格', '値段', 'いくら', 'どのくらい',
  'あったら買う', '課金してでも', 'コスパ',
];

// ── Analysis logic ─────────────────────────────────────────────

function countMatches(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

function detectCategory(text: string, projectKeywords: string[]): {
  category: PainCategory;
  matchedKeywords: string[];
  reasoning: string;
} {
  const scores: Record<PainCategory, number> = {
    frustration: 0,
    hassle: 0,
    time_consuming: 0,
    expensive: 0,
    difficult: 0,
    failure: 0,
    wanted: 0,
    alternative: 0,
  };

  const allMatches: Record<PainCategory, string[]> = {} as Record<PainCategory, string[]>;

  for (const [cat, keywords] of Object.entries(PAIN_KEYWORDS)) {
    const matches = countMatches(text, keywords);
    allMatches[cat as PainCategory] = matches;
    scores[cat as PainCategory] = matches.length;
  }

  // Boost score for project-specific keywords
  projectKeywords.forEach((kw) => {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      // Slight boost across all categories
      Object.keys(scores).forEach((cat) => {
        scores[cat as PainCategory] += 0.5;
      });
    }
  });

  const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as PainCategory;
  const matched = allMatches[topCategory] ?? [];

  const reasoning = matched.length > 0
    ? `「${matched.slice(0, 3).join('」「')}」などのキーワードを検出`
    : 'パターンマッチングによる分類';

  return { category: topCategory, matchedKeywords: matched, reasoning };
}

function calcScores(
  text: string,
  category: PainCategory,
  matchedKeywords: string[],
): PainScores {
  const amplifiers = countMatches(text, AMPLIFIERS);
  const freqSignals = countMatches(text, FREQUENCY_SIGNALS);
  const wtpSignals = countMatches(text, WTP_SIGNALS);
  const exclamationCount = (text.match(/[！!]/g) ?? []).length;

  // painIntensity: keyword hits + amplifiers + exclamations
  const painBase = Math.min(matchedKeywords.length, 5);
  const painBoost = Math.min(amplifiers.length + Math.floor(exclamationCount / 2), 2);
  const painIntensity = Math.max(1, Math.min(5, painBase + painBoost));

  // frequencySignal: frequency words in text
  const frequencySignal = Math.max(1, Math.min(5, freqSignals.length * 2 + 1));

  // willingnessToPay: WTP signals + expensive/wanted categories
  const wtpBase = wtpSignals.length > 0 ? 3 : 1;
  const wtpCatBoost = category === 'expensive' || category === 'wanted' ? 2 : 0;
  const willingnessToPay = Math.max(1, Math.min(5, wtpBase + wtpCatBoost));

  // buildability: hassle/time_consuming/wanted = higher buildability
  const highBuildCats: PainCategory[] = ['hassle', 'time_consuming', 'wanted'];
  const buildability = highBuildCats.includes(category) ? 4 : 3;

  // nicheClarity: frustration/failure = clearer niche
  const highNicheCats: PainCategory[] = ['frustration', 'failure', 'expensive'];
  const nicheClarity = highNicheCats.includes(category) ? 4 : 3;

  return { painIntensity, frequencySignal, willingnessToPay, buildability, nicheClarity };
}

function calcTotalScore(scores: PainScores): number {
  const weighted =
    scores.painIntensity * 0.25 +
    scores.frequencySignal * 0.20 +
    scores.willingnessToPay * 0.25 +
    scores.buildability * 0.15 +
    scores.nicheClarity * 0.15;
  return Math.round(weighted * 20); // → 0-100
}

// ── Public API ─────────────────────────────────────────────────

export function analyzePost(
  post: Post,
  projectKeywords: string[],
): Omit<PainAnalysis, 'id' | 'createdAt'> {
  const { category, matchedKeywords, reasoning } = detectCategory(post.content, projectKeywords);
  const scores = calcScores(post.content, category, matchedKeywords);
  const totalScore = calcTotalScore(scores);

  // Extract the most relevant sentence as the "pain excerpt"
  const sentences = post.content.split(/[。\n！？!?]+/).filter((s) => s.trim().length > 5);
  const extractedText =
    sentences.find((s) =>
      matchedKeywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase())),
    ) ??
    post.content.slice(0, 100);

  return {
    postId: post.id,
    projectId: post.projectId,
    category,
    extractedText: extractedText.trim(),
    scores,
    totalScore,
    matchedKeywords,
    reasoning,
  };
}

export function analyzePosts(
  posts: Post[],
  projectKeywords: string[],
): Omit<PainAnalysis, 'id' | 'createdAt'>[] {
  return posts.map((post) => analyzePost(post, projectKeywords));
}
