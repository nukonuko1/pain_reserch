'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProjects, usePosts, useAnalyses, useClusters, useIdeas } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PainBadge } from '@/components/ui/Badge';
import { TotalScoreBadge } from '@/components/ui/ScoreBar';
import Link from 'next/link';
import { PAIN_CATEGORY_LABELS } from '@/lib/types';
import type { PainCategory } from '@/lib/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getProject, deleteProject } = useProjects();
  const project = getProject(id);
  const { posts } = usePosts(id);
  const { analyses } = useAnalyses(id);
  const { clusters } = useClusters(id);
  const { ideas } = useIdeas(id);

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">プロジェクトが見つかりません</p>
        <Link href="/projects" className="text-blue-600 text-sm mt-2 inline-block">← プロジェクト一覧</Link>
      </div>
    );
  }

  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((s, a) => s + a.totalScore, 0) / analyses.length)
    : 0;

  const catCounts: Record<string, number> = {};
  analyses.forEach((a) => { catCounts[a.category] = (catCounts[a.category] ?? 0) + 1; });

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description}
        actions={
          <div className="flex gap-2">
            <Link href="/projects">
              <Button variant="secondary" size="sm">← 一覧</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: '投稿数', value: posts.length, href: '/input' },
          { label: '分析数', value: analyses.length, href: '/results' },
          { label: 'クラスター', value: clusters.length, href: '/clusters' },
          { label: 'アイデア', value: ideas.length, href: '/ideas' },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-sm transition-shadow">
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">キーワード</h3>
          {project.keywords.length === 0 ? (
            <p className="text-xs text-gray-400">キーワードが設定されていません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.keywords.map((kw) => (
                <span key={kw} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{kw}</span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">カテゴリ分布</h3>
          {analyses.length === 0 ? (
            <p className="text-xs text-gray-400">分析データがありません</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(catCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <PainBadge category={cat as PainCategory} size="sm" />
                    <span className="text-xs text-gray-500">{count}件</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {analyses.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">スコア上位</h3>
          <div className="space-y-2">
            {[...analyses].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <TotalScoreBadge score={a.totalScore} />
                <div>
                  <p className="text-xs text-gray-700">{a.extractedText}</p>
                  <PainBadge category={a.category} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
