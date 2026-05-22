'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useAnalyses, useClusters, useIdeas } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PainBadge } from '@/components/ui/Badge';
import { TotalScoreBadge } from '@/components/ui/ScoreBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { clusterAnalyses } from '@/lib/clustering';
import { generateIdeasFromClusters } from '@/lib/ideaGenerator';
import type { PainCluster } from '@/lib/types';

function ClusterCard({ cluster, count }: { cluster: PainCluster; count: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{cluster.name}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cluster.description}</p>
        </div>
        <div className="ml-3 shrink-0">
          <TotalScoreBadge score={cluster.avgTotalScore} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <PainBadge category={cluster.category} />
        <span className="text-xs text-gray-400">{count}件の痛み</span>
      </div>

      {cluster.representativeKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cluster.representativeKeywords.slice(0, 5).map((kw) => (
            <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClustersPage() {
  const { activeProject } = useProjects();
  const { analyses } = useAnalyses(activeProject?.id ?? null);
  const { clusters, saveClusters } = useClusters(activeProject?.id ?? null);
  const { saveIdeas } = useIdeas(activeProject?.id ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [ideasGenerated, setIdeasGenerated] = useState(false);

  if (!activeProject) {
    return (
      <EmptyState icon="📁" title="プロジェクトが選択されていません"
        action={<Link href="/projects"><Button>プロジェクトへ</Button></Link>} />
    );
  }

  if (analyses.length === 0) {
    return (
      <EmptyState icon="⚡" title="分析データがありません"
        description="先に入力画面でテキストを分析してください"
        action={<Link href="/input"><Button>入力画面へ</Button></Link>} />
    );
  }

  function handleCluster() {
    setIsLoading(true);
    const result = clusterAnalyses(analyses, activeProject!.id);
    saveClusters(result);
    setIdeasGenerated(false);
    setIsLoading(false);
  }

  function handleGenerateIdeas() {
    if (clusters.length === 0) return;
    const ideas = generateIdeasFromClusters(clusters, analyses, activeProject!.id);
    saveIdeas(ideas);
    setIdeasGenerated(true);
  }

  const sortedClusters = [...clusters].sort((a, b) => b.avgTotalScore - a.avgTotalScore);

  return (
    <div>
      <PageHeader
        title="クラスター"
        description={`${analyses.length}件の痛みをグループ化`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCluster} loading={isLoading}>
              {clusters.length > 0 ? '再クラスタリング' : 'クラスタリング実行'}
            </Button>
            {clusters.length > 0 && (
              <Button onClick={handleGenerateIdeas}>
                商品アイデアを生成
              </Button>
            )}
          </div>
        }
      />

      {ideasGenerated && (
        <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">商品アイデアを生成しました！</p>
            <p className="text-xs text-green-600">アイデア画面で確認できます</p>
          </div>
          <Link href="/ideas">
            <Button size="sm">アイデアを見る →</Button>
          </Link>
        </div>
      )}

      {clusters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-4">◈</p>
          <p className="text-sm font-medium text-gray-700 mb-1">{analyses.length}件の痛みをクラスタリングできます</p>
          <p className="text-xs text-gray-400 mb-6">カテゴリとキーワードの類似度でグループ化します</p>
          <Button onClick={handleCluster} loading={isLoading}>クラスタリング実行</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <span>{clusters.length}クラスター生成済み</span>
            <span>·</span>
            <span>スコア降順</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedClusters.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                count={cluster.analysisIds.length}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
