'use client';

import Link from 'next/link';
import { useProjects, usePosts, useAnalyses, useClusters, useIdeas } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportAnalysesToCsv, downloadCsv } from '@/lib/csvUtils';
import { PAIN_CATEGORY_LABELS } from '@/lib/types';
import type { PainCategory } from '@/lib/types';

function ExportCard({
  title,
  description,
  count,
  disabled,
  onExport,
}: {
  title: string;
  description: string;
  count: number;
  disabled: boolean;
  onExport: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{count}件</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={onExport}
        className="w-full"
      >
        CSVダウンロード
      </Button>
    </div>
  );
}

export default function ExportPage() {
  const { activeProject } = useProjects();
  const { posts } = usePosts(activeProject?.id ?? null);
  const { analyses } = useAnalyses(activeProject?.id ?? null);
  const { clusters } = useClusters(activeProject?.id ?? null);
  const { ideas } = useIdeas(activeProject?.id ?? null);

  if (!activeProject) {
    return (
      <EmptyState icon="📁" title="プロジェクトが選択されていません"
        action={<Link href="/projects"><Button>プロジェクトへ</Button></Link>} />
    );
  }

  function exportAnalyses() {
    const csv = exportAnalysesToCsv(analyses, posts);
    downloadCsv(csv, `pain_analyses_${activeProject!.name}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportClusters() {
    const header = '分類名,カテゴリ,平均スコア,含む痛み数,代表キーワード,説明';
    const rows = clusters.map((c) =>
      [c.name, PAIN_CATEGORY_LABELS[c.category as PainCategory], c.avgTotalScore,
       c.analysisIds.length, c.representativeKeywords.join(' / '), c.description]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    downloadCsv([header, ...rows].join('\n'),
      `clusters_${activeProject!.name}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportIdeas() {
    const header = '商品名,タグライン,ターゲット,解決する痛み,収益化モデル,MVP機能,推定スコア,X投稿案';
    const rows = ideas.map((i) =>
      [i.title, i.tagline, i.targetUser, i.painSolved, i.monetizationModel,
       i.mvpFeatures.join(' | '), i.estimatedScore, i.xPostDraft]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    downloadCsv([header, ...rows].join('\n'),
      `ideas_${activeProject!.name}_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportAll() {
    exportAnalyses();
    setTimeout(() => exportClusters(), 300);
    setTimeout(() => exportIdeas(), 600);
  }

  // Summary for the page
  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((s, a) => s + a.totalScore, 0) / analyses.length)
    : 0;

  const topCategory = (() => {
    const counts: Record<string, number> = {};
    analyses.forEach((a) => { counts[a.category] = (counts[a.category] ?? 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? PAIN_CATEGORY_LABELS[top[0] as PainCategory] : 'なし';
  })();

  return (
    <div>
      <PageHeader
        title="エクスポート"
        description="分析データをCSVでダウンロード"
        actions={
          analyses.length > 0 ? (
            <Button onClick={exportAll}>全データを一括ダウンロード</Button>
          ) : undefined
        }
      />

      {/* Project summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">プロジェクトサマリー</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{posts.length}</p>
            <p className="text-xs text-gray-500">投稿数</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{analyses.length}</p>
            <p className="text-xs text-gray-500">分析数</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{avgScore}</p>
            <p className="text-xs text-gray-500">平均スコア</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 truncate text-sm mt-1">{topCategory}</p>
            <p className="text-xs text-gray-500">最多カテゴリ</p>
          </div>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <ExportCard
          title="痛み分析結果"
          description="投稿ごとの痛みカテゴリ・スコア・マッチキーワードを含む詳細データ"
          count={analyses.length}
          disabled={analyses.length === 0}
          onExport={exportAnalyses}
        />
        <ExportCard
          title="クラスターデータ"
          description="類似痛みのグループ・代表キーワード・平均スコア"
          count={clusters.length}
          disabled={clusters.length === 0}
          onExport={exportClusters}
        />
        <ExportCard
          title="商品アイデア"
          description="生成された商品アイデア・X投稿案・収益化モデル"
          count={ideas.length}
          disabled={ideas.length === 0}
          onExport={exportIdeas}
        />
      </div>

      {/* CSV format help */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">CSV形式について</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>• UTF-8 BOM付きでエクスポートするため、Excelで直接開けます</p>
          <p>• 日本語文字は正しく表示されます</p>
          <p>• 痛み分析CSVには全スコア項目（painIntensity〜nicheClarity）が含まれます</p>
          <p>• フィールド内の改行・カンマはダブルクォートでエスケープ済みです</p>
        </div>
      </div>

      {analyses.length === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-4">エクスポートできるデータがありません</p>
          <div className="flex justify-center gap-3">
            <Link href="/input"><Button variant="secondary">データ入力</Button></Link>
            <Link href="/results"><Button>分析結果を確認</Button></Link>
          </div>
        </div>
      )}
    </div>
  );
}
