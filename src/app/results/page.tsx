'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProjects, usePosts, useAnalyses } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PainBadge, Badge } from '@/components/ui/Badge';
import { TotalScoreBadge, ScoreBar } from '@/components/ui/ScoreBar';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PainCategory, PainAnalysis } from '@/lib/types';
import { PAIN_CATEGORY_LABELS } from '@/lib/types';

type SortKey = 'totalScore' | 'painIntensity' | 'willingnessToPay' | 'category';

const SCORE_LABELS: Record<string, string> = {
  painIntensity: '痛みの強さ',
  frequencySignal: '頻出度',
  willingnessToPay: '支払い意思',
  buildability: '作りやすさ',
  nicheClarity: 'ターゲット明確さ',
};

function AnalysisRow({ analysis, post }: { analysis: PainAnalysis; post?: { content: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4">
          <TotalScoreBadge score={analysis.totalScore} />
        </td>
        <td className="py-3 px-4">
          <PainBadge category={analysis.category} />
        </td>
        <td className="py-3 px-4 max-w-xs">
          <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{analysis.extractedText}</p>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span title="痛み">{analysis.scores.painIntensity}/5</span>
            <span title="頻出">⟳{analysis.scores.frequencySignal}/5</span>
            <span title="WTP">¥{analysis.scores.willingnessToPay}/5</span>
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {analysis.matchedKeywords.slice(0, 3).map((kw) => (
              <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{kw}</span>
            ))}
            {analysis.matchedKeywords.length > 3 && (
              <span className="text-xs text-gray-400">+{analysis.matchedKeywords.length - 3}</span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-right">
          <svg
            className={`w-4 h-4 text-gray-400 inline transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/40">
          <td colSpan={6} className="px-4 pb-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">元テキスト</p>
                <p className="text-xs text-gray-700 bg-white border border-gray-100 rounded-lg p-3 leading-relaxed">
                  {post?.content ?? analysis.extractedText}
                </p>
                <p className="text-xs text-gray-400 mt-2">{analysis.reasoning}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">スコア詳細</p>
                <div className="space-y-1.5 bg-white border border-gray-100 rounded-lg p-3">
                  {Object.entries(SCORE_LABELS).map(([key, label]) => (
                    <ScoreBar
                      key={key}
                      label={label}
                      value={analysis.scores[key as keyof typeof analysis.scores]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResultsPage() {
  const { activeProject } = useProjects();
  const { posts } = usePosts(activeProject?.id ?? null);
  const { analyses } = useAnalyses(activeProject?.id ?? null);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<PainCategory | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('totalScore');
  const [minScore, setMinScore] = useState(0);

  const postMap = useMemo(() => {
    const m: Record<string, { content: string }> = {};
    posts.forEach((p) => { m[p.id] = { content: p.content }; });
    return m;
  }, [posts]);

  const filtered = useMemo(() => {
    return analyses
      .filter((a) => {
        if (filterCat !== 'all' && a.category !== filterCat) return false;
        if (a.totalScore < minScore) return false;
        if (search) {
          const q = search.toLowerCase();
          return a.extractedText.toLowerCase().includes(q) ||
            a.matchedKeywords.some((k) => k.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => {
        if (sortKey === 'category') return a.category.localeCompare(b.category);
        if (sortKey === 'painIntensity') return b.scores.painIntensity - a.scores.painIntensity;
        if (sortKey === 'willingnessToPay') return b.scores.willingnessToPay - a.scores.willingnessToPay;
        return b.totalScore - a.totalScore;
      });
  }, [analyses, filterCat, search, sortKey, minScore]);

  if (!activeProject) {
    return (
      <EmptyState icon="📁" title="プロジェクトが選択されていません"
        action={<Link href="/projects"><Button>プロジェクトへ</Button></Link>} />
    );
  }

  if (analyses.length === 0) {
    return (
      <EmptyState icon="⚡" title="分析データがありません"
        description="入力画面でテキストを追加して「全件分析」ボタンを押してください"
        action={<Link href="/input"><Button>入力画面へ</Button></Link>} />
    );
  }

  // Summary stats
  const avgScore = Math.round(analyses.reduce((s, a) => s + a.totalScore, 0) / analyses.length);
  const highScore = analyses.filter((a) => a.totalScore >= 70).length;

  return (
    <div>
      <PageHeader
        title="痛み分析結果"
        description={`${analyses.length}件の分析結果`}
        actions={
          <Link href="/clusters">
            <Button size="sm">クラスタリングへ →</Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{analyses.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">総分析数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-0.5">平均スコア</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{highScore}</p>
          <p className="text-xs text-gray-500 mt-0.5">高スコア（70+）</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="テキスト・キーワード検索..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-400 w-48"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as PainCategory | 'all')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="all">全カテゴリ</option>
          {(Object.entries(PAIN_CATEGORY_LABELS) as [PainCategory, string][]).map(([cat, label]) => (
            <option key={cat} value={cat}>{label}</option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="totalScore">総合スコア順</option>
          <option value="painIntensity">痛みの強さ順</option>
          <option value="willingnessToPay">支払い意思順</option>
          <option value="category">カテゴリ順</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">最低スコア:</span>
          <input
            type="range" min={0} max={80} step={10}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs font-medium text-gray-700 w-6">{minScore}</span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}件表示</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500">
                <th className="py-3 px-4 text-left w-16">スコア</th>
                <th className="py-3 px-4 text-left">カテゴリ</th>
                <th className="py-3 px-4 text-left">抽出テキスト</th>
                <th className="py-3 px-4 text-left">各スコア</th>
                <th className="py-3 px-4 text-left">キーワード</th>
                <th className="py-3 px-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((analysis) => (
                <AnalysisRow
                  key={analysis.id}
                  analysis={analysis}
                  post={postMap[analysis.postId]}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            フィルター条件に一致するデータがありません
          </div>
        )}
      </div>
    </div>
  );
}
