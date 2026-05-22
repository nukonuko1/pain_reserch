'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useIdeas } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { PainBadge, Badge } from '@/components/ui/Badge';
import { TotalScoreBadge } from '@/components/ui/ScoreBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import type { ProductIdea } from '@/lib/types';

function IdeaCard({ idea, onView }: { idea: ProductIdea; onView: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <TotalScoreBadge score={idea.estimatedScore} />
        <div className="flex flex-wrap gap-1 ml-2">
          {idea.relatedCategories.map((cat) => (
            <PainBadge key={cat} category={cat} size="sm" />
          ))}
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mt-3 leading-snug">{idea.title}</h3>
      <p className="text-xs text-gray-500 mt-1 italic">{idea.tagline}</p>

      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
        <div>
          <span className="font-medium text-gray-700">ターゲット: </span>
          {idea.targetUser}
        </div>
        <div>
          <span className="font-medium text-gray-700">収益化: </span>
          {idea.monetizationModel}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {idea.mvpFeatures.slice(0, 2).map((f) => (
          <Badge key={f} size="sm" color="blue">{f}</Badge>
        ))}
        {idea.mvpFeatures.length > 2 && (
          <span className="text-xs text-gray-400">+{idea.mvpFeatures.length - 2}機能</span>
        )}
      </div>

      <button
        onClick={onView}
        className="mt-4 w-full text-xs text-gray-500 hover:text-gray-800 border border-gray-100 hover:border-gray-300 rounded-lg py-2 transition-colors"
      >
        詳細・X投稿案を見る
      </button>
    </div>
  );
}

function IdeaDetailModal({ idea, onClose }: { idea: ProductIdea; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(idea.xPostDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={idea.title}
      size="lg"
      actions={<Button variant="secondary" onClick={onClose}>閉じる</Button>}
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <TotalScoreBadge score={idea.estimatedScore} size="lg" />
          {idea.relatedCategories.map((cat) => <PainBadge key={cat} category={cat} />)}
        </div>

        <p className="text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">{idea.tagline}</p>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">解決する痛み</p>
            <p className="text-gray-700">{idea.painSolved}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ターゲットユーザー</p>
            <p className="text-gray-700">{idea.targetUser}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ソリューション</p>
            <p className="text-gray-700">{idea.solution}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">収益化モデル</p>
            <p className="text-gray-700">{idea.monetizationModel}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">MVP機能</p>
          <ul className="space-y-1">
            {idea.mvpFeatures.map((f) => (
              <li key={f} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">X投稿案</p>
            <button
              onClick={handleCopy}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {copied ? '✓ コピー済み' : 'コピー'}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {idea.xPostDraft}
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function IdeasPage() {
  const { activeProject } = useProjects();
  const { ideas, deleteIdea } = useIdeas(activeProject?.id ?? null);
  const [selectedIdea, setSelectedIdea] = useState<ProductIdea | null>(null);
  const [sortByScore, setSortByScore] = useState(true);

  if (!activeProject) {
    return (
      <EmptyState icon="📁" title="プロジェクトが選択されていません"
        action={<Link href="/projects"><Button>プロジェクトへ</Button></Link>} />
    );
  }

  if (ideas.length === 0) {
    return (
      <EmptyState icon="☆" title="商品アイデアがありません"
        description="クラスター画面で「商品アイデアを生成」ボタンを押してください"
        action={<Link href="/clusters"><Button>クラスター画面へ</Button></Link>} />
    );
  }

  const sorted = [...ideas].sort((a, b) =>
    sortByScore ? b.estimatedScore - a.estimatedScore : 0
  );

  return (
    <div>
      <PageHeader
        title="商品アイデア"
        description={`${ideas.length}件のアイデアを生成`}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={sortByScore}
                onChange={(e) => setSortByScore(e.target.checked)}
                className="rounded"
              />
              スコア順
            </label>
            <Link href="/export">
              <Button variant="secondary" size="sm">エクスポート</Button>
            </Link>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onView={() => setSelectedIdea(idea)}
          />
        ))}
      </div>

      {selectedIdea && (
        <IdeaDetailModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} />
      )}
    </div>
  );
}
