'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useStore';
import { useAnalyses, usePosts, useClusters, useIdeas } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PainBadge } from '@/components/ui/Badge';
import { TotalScoreBadge } from '@/components/ui/ScoreBar';
import { PAIN_CATEGORY_LABELS } from '@/lib/types';
import type { PainCategory } from '@/lib/types';
import { SAMPLE_TEXTS, SAMPLE_PROJECT } from '@/lib/sampleData';
import { analyzePost } from '@/lib/analyzer';
import * as storage from '@/lib/storage';

function StatCard({ label, value, icon, href }: { label: string; value: number; icon: string; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { activeProject, projects, createProject, setActiveProject } = useProjects();
  const projectId = activeProject?.id ?? null;
  const { posts } = usePosts(projectId);
  const { analyses } = useAnalyses(projectId);
  const { clusters } = useClusters(projectId);
  const { ideas } = useIdeas(projectId);

  function loadSampleData() {
    const p = createProject(SAMPLE_PROJECT);
    setActiveProject(p.id);
    const now = new Date().toISOString();
    const posts = storage.savePosts(
      SAMPLE_TEXTS.map((content) => ({
        projectId: p.id,
        source: 'manual' as const,
        content,
        createdAt: now,
      }))
    );
    const analyses = posts.map((post) => analyzePost(post, SAMPLE_PROJECT.keywords));
    storage.saveAnalyses(analyses);
    router.refresh();
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-6xl mb-5">🔍</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">痛みリサーチツールへようこそ</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          ユーザーの「痛み」を分析し、商品アイデアに変換するツールです。
          まずはプロジェクトを作成するか、サンプルデータで試してください。
        </p>
        <div className="flex gap-3">
          <Link href="/projects">
            <Button size="lg">プロジェクトを作成する</Button>
          </Link>
          <Button size="lg" variant="secondary" onClick={loadSampleData}>
            サンプルデータで試す
          </Button>
        </div>
      </div>
    );
  }

  // Category distribution
  const catCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    catCounts[a.category] = (catCounts[a.category] ?? 0) + 1;
  });
  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top pain analyses by score
  const topAnalyses = [...analyses].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={activeProject ? `${activeProject.name}` : 'ダッシュボード'}
        description={activeProject?.description}
        actions={
          <Link href="/input">
            <Button size="sm">+ データ入力</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="投稿数" value={posts.length} icon="📝" href="/input" />
        <StatCard label="痛み分析" value={analyses.length} icon="⚡" href="/results" />
        <StatCard label="クラスター" value={clusters.length} icon="◈" href="/clusters" />
        <StatCard label="商品アイデア" value={ideas.length} icon="☆" href="/ideas" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">痛みカテゴリ分布</h3>
          {analyses.length === 0 ? (
            <p className="text-sm text-gray-400">分析データがありません</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(PAIN_CATEGORY_LABELS).map(([cat, label]) => {
                const count = catCounts[cat] ?? 0;
                const pct = analyses.length > 0 ? Math.round((count / analyses.length) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <PainBadge category={cat as PainCategory} size="sm" />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gray-700 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{count}件 ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top pain scores */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">スコア上位の痛み</h3>
          {topAnalyses.length === 0 ? (
            <p className="text-sm text-gray-400">分析データがありません</p>
          ) : (
            <div className="space-y-3">
              {topAnalyses.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <TotalScoreBadge score={a.totalScore} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{a.extractedText}</p>
                    <PainBadge category={a.category} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {analyses.length > 5 && (
            <Link href="/results" className="text-xs text-gray-400 hover:text-gray-600 mt-3 block">
              全{analyses.length}件を見る →
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {analyses.length > 0 && clusters.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">次のステップ: クラスタリング</p>
            <p className="text-xs text-blue-600 mt-0.5">{analyses.length}件の痛みをグループ化して商品アイデアを生成できます</p>
          </div>
          <Link href="/clusters">
            <Button size="sm">クラスタリングする</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
