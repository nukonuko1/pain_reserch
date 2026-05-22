'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects, usePosts, useAnalyses } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { analyzePost } from '@/lib/analyzer';
import { parseCsv } from '@/lib/csvUtils';
import type { DataSource } from '@/lib/types';
import { SOURCE_LABELS } from '@/lib/types';
import Link from 'next/link';

type Tab = 'manual' | 'csv';

export default function InputPage() {
  const router = useRouter();
  const { activeProject } = useProjects();
  const { posts, savePosts, deletePost } = usePosts(activeProject?.id ?? null);
  const { saveAnalyses, clearAnalyses } = useAnalyses(activeProject?.id ?? null);

  const [tab, setTab] = useState<Tab>('manual');
  const [manualText, setManualText] = useState('');
  const [source, setSource] = useState<DataSource>('manual');
  const [url, setUrl] = useState('');
  const [csvRaw, setCsvRaw] = useState('');
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!activeProject) {
    return (
      <EmptyState
        icon="📁"
        title="プロジェクトが選択されていません"
        description="サイドバーからプロジェクトを選択するか、新規作成してください"
        action={<Link href="/projects"><Button>プロジェクトへ</Button></Link>}
      />
    );
  }

  function handleManualAdd() {
    const lines = manualText.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) return;
    savePosts(lines.map((content) => ({
      projectId: activeProject!.id,
      source,
      content: content.trim(),
      url: url.trim() || undefined,
    })));
    setManualText('');
    setUrl('');
  }

  function handleCsvChange(raw: string) {
    setCsvRaw(raw);
    const rows = parseCsv(raw);
    setCsvPreview(rows.slice(0, 3).map((r) => r.content));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCsvChange(ev.target?.result as string ?? '');
    reader.readAsText(file, 'UTF-8');
  }

  function handleCsvImport() {
    const rows = parseCsv(csvRaw);
    if (rows.length === 0) return;
    savePosts(rows.map((row) => ({
      projectId: activeProject!.id,
      source: 'csv' as DataSource,
      content: row.content,
      url: row.url,
      author: row.author,
      platform: row.platform,
    })));
    setCsvRaw('');
    setCsvPreview([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleAnalyzeAll() {
    if (posts.length === 0) return;
    setIsAnalyzing(true);
    clearAnalyses();
    const keywords = activeProject!.keywords;
    const results = posts.map((post) => analyzePost(post, keywords));
    saveAnalyses(results);
    setIsAnalyzing(false);
    router.push('/results');
  }

  return (
    <div>
      <PageHeader
        title="データ入力"
        description={`プロジェクト: ${activeProject.name}`}
        actions={
          posts.length > 0 ? (
            <Button onClick={handleAnalyzeAll} loading={isAnalyzing}>
              {isAnalyzing ? '分析中...' : `${posts.length}件を分析する`}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['manual', 'csv'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors font-medium
              ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'manual' ? '手動入力' : 'CSVインポート'}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          {tab === 'manual' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ソース</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as DataSource)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {(Object.entries(SOURCE_LABELS) as [DataSource, string][])
                    .filter(([s]) => s !== 'csv')
                    .map(([s, label]) => (
                      <option key={s} value={s}>{label}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  テキスト（1行1投稿）
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={`例:\n副業で稼ごうとしたけど確定申告が複雑すぎてわからない\nフリーランスの案件獲得って本当に難しい、何ヶ月もかかった\nクラウドワークスの手数料高すぎ、もっと安いのないのか`}
                  rows={10}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">改行で複数の投稿を一括追加できます</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL（任意）</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <Button
                onClick={handleManualAdd}
                disabled={!manualText.trim()}
                className="w-full"
              >
                追加する
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CSVファイルをアップロード</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  またはCSVをここに貼り付け
                </label>
                <textarea
                  value={csvRaw}
                  onChange={(e) => handleCsvChange(e.target.value)}
                  placeholder={`content,source,url\n副業で稼ごうとしたけど確定申告が複雑すぎてわからない,x,https://x.com/...\nフリーランスの案件獲得って本当に難しい,youtube,`}
                  rows={8}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-mono"
                />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">対応カラム名（1行目はヘッダー）:</p>
                <p><code>content</code> / <code>text</code> / <code>テキスト</code> — 本文（必須）</p>
                <p><code>source</code> / <code>ソース</code> — 媒体</p>
                <p><code>url</code> / <code>link</code> — URL</p>
                <p><code>author</code> / <code>ユーザー</code> — 投稿者</p>
              </div>
              {csvPreview.length > 0 && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-700 mb-2">プレビュー（最初の3件）:</p>
                  {csvPreview.map((c, i) => (
                    <p key={i} className="text-xs text-green-600 truncate">• {c}</p>
                  ))}
                </div>
              )}
              <Button
                onClick={handleCsvImport}
                disabled={!csvRaw.trim() || parseCsv(csvRaw).length === 0}
                className="w-full"
              >
                {parseCsv(csvRaw).length > 0 ? `${parseCsv(csvRaw).length}件をインポート` : 'インポート'}
              </Button>
            </div>
          )}
        </div>

        {/* Posts list */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">追加済み投稿 ({posts.length}件)</h3>
            {posts.length > 0 && (
              <Button
                onClick={handleAnalyzeAll}
                loading={isAnalyzing}
                size="sm"
              >
                全件分析
              </Button>
            )}
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">まだ投稿がありません</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {[...posts].reverse().map((post) => (
                <div key={post.id} className="border border-gray-100 rounded-lg p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-700 flex-1 leading-relaxed line-clamp-3">{post.content}</p>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge size="sm" color="gray">{SOURCE_LABELS[post.source]}</Badge>
                    {post.url && (
                      <a href={post.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate max-w-[120px]">
                        {post.url}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
