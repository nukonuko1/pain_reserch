/**
 * Template-based product idea and X post generator.
 * No external API required.
 */

import type { PainCluster, PainAnalysis, ProductIdea, PainCategory } from './types';
import { PAIN_CATEGORY_LABELS } from './types';

interface IdeaTemplate {
  titleTemplate: (keywords: string[], category: PainCategory) => string;
  taglineTemplate: (keywords: string[], category: PainCategory) => string;
  solutionTemplate: (keywords: string[], category: PainCategory) => string;
  targetUserTemplate: (keywords: string[], category: PainCategory) => string;
  monetizationTemplate: () => string;
  mvpFeaturesTemplate: (keywords: string[]) => string[];
}

const TEMPLATES: Record<PainCategory, IdeaTemplate> = {
  frustration: {
    titleTemplate: (kw) => `${kw[0] ?? '課題'}を解消する${kw[1] ?? 'ツール'}`,
    taglineTemplate: (kw) => `${kw[0] ?? '問題'}でもう悩まない。シンプルな解決策`,
    solutionTemplate: (kw) => `ユーザーが感じている「${kw[0] ?? '不満'}」を根本から解決するWebサービスまたはアプリ。${kw[1] ? `特に「${kw[1]}」問題にフォーカス。` : ''}`,
    targetUserTemplate: (kw) => `${kw[0] ?? 'その問題'}に不満を感じているユーザー`,
    monetizationTemplate: () => 'フリーミアム（基本無料 + Pro月額980〜1,980円）',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '問題'}を自動検知・通知する機能`,
      'シンプルなダッシュボード',
      'ワンクリック解決アクション',
      'フィードバック収集フォーム',
    ],
  },
  hassle: {
    titleTemplate: (kw) => `${kw[0] ?? '作業'}を自動化するツール`,
    taglineTemplate: (kw) => `面倒な${kw[0] ?? '作業'}を、ボタン一つで完了`,
    solutionTemplate: (kw) => `手間のかかる「${kw[0] ?? '作業'}」を自動化・効率化するツール。人手作業を減らし、本来の仕事に集中できる。`,
    targetUserTemplate: (kw) => `${kw[0] ?? '繰り返し作業'}に追われているビジネスパーソン`,
    monetizationTemplate: () => 'サブスクリプション（月額1,480円〜）',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '作業'}のワンクリック自動化`,
      'テンプレート機能',
      'スケジュール実行',
      '完了通知',
    ],
  },
  time_consuming: {
    titleTemplate: (kw) => `${kw[0] ?? '作業時間'}を10分の1にするツール`,
    taglineTemplate: (kw) => `${kw[0] ?? '時間がかかる処理'}を、秒速で終わらせる`,
    solutionTemplate: (kw) => `「${kw[0] ?? '処理'}に時間がかかりすぎる」という問題をAIと自動化で解決。作業時間を大幅短縮。`,
    targetUserTemplate: (kw) => `${kw[0] ?? '時間'}に追われているフリーランス・中小企業`,
    monetizationTemplate: () => '時間節約に対する従量課金 or 月額定額制',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '処理'}の高速化エンジン`,
      '進捗可視化',
      'バッチ処理機能',
      '時間短縮レポート',
    ],
  },
  expensive: {
    titleTemplate: (kw) => `コスパ最強の${kw[0] ?? 'サービス'}代替ツール`,
    taglineTemplate: (kw) => `${kw[0] ?? '高額サービス'}の機能を、月額○円で`,
    solutionTemplate: (kw) => `高額な${kw[0] ?? 'サービス'}の代替として、必要な機能だけをリーズナブルに提供。`,
    targetUserTemplate: (kw) => `コスト削減を求める個人・スタートアップ`,
    monetizationTemplate: () => '月額980円の低価格サブスク',
    mvpFeaturesTemplate: (kw) => [
      `既存の高額${kw[0] ?? 'サービス'}の主要機能の80%`,
      'シンプルな料金体系',
      '無料トライアル14日',
      'キャンセルいつでも可能',
    ],
  },
  difficult: {
    titleTemplate: (kw) => `${kw[0] ?? '難しい作業'}を誰でもできる学習ツール`,
    taglineTemplate: (kw) => `専門知識ゼロでも${kw[0] ?? '作業'}できる、やさしいガイド`,
    solutionTemplate: (kw) => `「${kw[0] ?? '専門的な作業'}が難しすぎる」という声に応え、ステップバイステップで誰でも実践できるツール＋コンテンツ。`,
    targetUserTemplate: (kw) => `${kw[0] ?? '分野'}の初心者・非エンジニア`,
    monetizationTemplate: () => 'コース販売（5,000〜30,000円）+ ツール月額980円',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '作業'}のステップガイド`,
      'よくあるミスの自動チェック',
      '動画チュートリアル',
      'コミュニティ Q&A',
    ],
  },
  failure: {
    titleTemplate: (kw) => `${kw[0] ?? 'ミス'}を防ぐ自動チェックツール`,
    taglineTemplate: (kw) => `${kw[0] ?? '失敗'}をゼロにする、賢いバリデーション`,
    solutionTemplate: (kw) => `「${kw[0] ?? 'ミス・エラー'}」による損失を防ぐ自動チェック＆修正提案ツール。ヒューマンエラーを最小化。`,
    targetUserTemplate: (kw) => `${kw[0] ?? 'ミス'}コストの高い業務を抱えるチーム`,
    monetizationTemplate: () => 'チームプラン月額3,000円〜（席数課金）',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '作業'}の自動バリデーション`,
      'エラー原因の可視化',
      '修正提案機能',
      'ログ・監査証跡',
    ],
  },
  wanted: {
    titleTemplate: (kw) => `${kw[0] ?? 'ニーズ'}に特化した新サービス`,
    taglineTemplate: (kw) => `「${kw[0] ?? 'ずっと欲しかった機能'}」がついに実現`,
    solutionTemplate: (kw) => `ユーザーが「欲しい」と声を上げていた「${kw[0] ?? '機能・サービス'}」を提供。潜在的な需要が高く、先行者優位を取れる。`,
    targetUserTemplate: (kw) => `「${kw[0] ?? 'これ'}が欲しい」と感じているアクティブユーザー`,
    monetizationTemplate: () => '早期アクセス有料版（3,000円〜） + 量産後サブスク',
    mvpFeaturesTemplate: (kw) => [
      `「${kw[0] ?? '欲しいもの'}」のコア機能のみ`,
      'ウェイティングリスト登録',
      'フィードバック収集',
      'SNSシェア機能',
    ],
  },
  alternative: {
    titleTemplate: (kw) => `${kw[0] ?? '既存サービス'}より使いやすい代替ツール`,
    taglineTemplate: (kw) => `${kw[0] ?? '既存サービス'}の不満点を全部解決した乗り換え先`,
    solutionTemplate: (kw) => `「${kw[0] ?? '既存サービス'}は使いにくい/高い」という声に応え、改善版として開発。移行コストゼロを目指す。`,
    targetUserTemplate: (kw) => `${kw[0] ?? '既存サービス'}に不満を持つ乗り換え検討層`,
    monetizationTemplate: () => '移行支援込みサブスク（月額1,480円〜）',
    mvpFeaturesTemplate: (kw) => [
      `${kw[0] ?? '既存サービス'}からのデータ移行ツール`,
      '主要機能の改善版',
      '比較表ページ',
      'デモ動画',
    ],
  },
};

export function generateIdeasFromClusters(
  clusters: PainCluster[],
  analyses: PainAnalysis[],
  projectId: string,
): Omit<ProductIdea, 'id' | 'createdAt'>[] {
  const analysisMap: Record<string, PainAnalysis> = {};
  analyses.forEach((a) => { analysisMap[a.id] = a; });

  return clusters.slice(0, 10).map((cluster) => {
    const template = TEMPLATES[cluster.category];
    const kw = cluster.representativeKeywords;

    const title = template.titleTemplate(kw, cluster.category);
    const tagline = template.taglineTemplate(kw, cluster.category);
    const solution = template.solutionTemplate(kw, cluster.category);
    const targetUser = template.targetUserTemplate(kw, cluster.category);
    const monetizationModel = template.monetizationTemplate();
    const mvpFeatures = template.mvpFeaturesTemplate(kw);

    const xPost = generateXPost(title, tagline, kw, cluster.category);

    return {
      projectId,
      clusterId: cluster.id,
      title,
      tagline,
      targetUser,
      painSolved: `${PAIN_CATEGORY_LABELS[cluster.category]}に関する痛み（${cluster.analysisIds.length}件の声）`,
      solution,
      monetizationModel,
      mvpFeatures,
      estimatedScore: cluster.avgTotalScore,
      xPostDraft: xPost,
      relatedCategories: [cluster.category],
    };
  });
}

function generateXPost(
  title: string,
  tagline: string,
  keywords: string[],
  category: PainCategory,
): string {
  const kwText = keywords.slice(0, 2).join('・');
  const catLabel = PAIN_CATEGORY_LABELS[category];

  const templates = [
    `【リサーチ結果】\n「${kwText}」に悩む人が多いことがわかりました。\n\n${tagline}\n\n→ ${title}を作ったら使いますか？\n\n#${catLabel.replace('/', '_')} #起業 #スタートアップ`,
    `${kwText}で悩んでいる人へ\n\n${tagline}\n\n「${title}」というサービスのニーズ調査中です。\n\nRT・いいねで応援してもらえると嬉しいです！\n\n#プロダクト開発 #${category}`,
    `実は「${kwText}」って多くの人が悩んでいます。\n\n解決策: ${title}\n→ ${tagline}\n\nこういうの欲しいって人いたらコメントください🙌\n\n#${catLabel} #ビジネス #課題解決`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
