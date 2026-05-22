import type { CsvRow, PainAnalysis, Post } from './types';
import { PAIN_CATEGORY_LABELS, SOURCE_LABELS } from './types';

// ── CSV Parser ──────────────────────────────────────────────────

export function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].trim();
  const headers = splitCsvLine(headerLine).map((h) => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));

  const contentIdx = headers.findIndex((h) => ['content', 'text', 'body', 'テキスト', '内容', '本文'].includes(h));
  const sourceIdx = headers.findIndex((h) => ['source', 'ソース', '媒体'].includes(h));
  const urlIdx = headers.findIndex((h) => ['url', 'link', 'リンク'].includes(h));
  const authorIdx = headers.findIndex((h) => ['author', 'user', 'name', '作者', 'ユーザー', '名前'].includes(h));
  const platformIdx = headers.findIndex((h) => ['platform', 'プラットフォーム'].includes(h));

  const effectiveContentIdx = contentIdx !== -1 ? contentIdx : 0;

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const cols = splitCsvLine(line).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      return {
        content: cols[effectiveContentIdx] ?? '',
        source: sourceIdx !== -1 ? cols[sourceIdx] : undefined,
        url: urlIdx !== -1 ? cols[urlIdx] : undefined,
        author: authorIdx !== -1 ? cols[authorIdx] : undefined,
        platform: platformIdx !== -1 ? cols[platformIdx] : undefined,
      };
    })
    .filter((row) => row.content.length > 0);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ── CSV Exporter ────────────────────────────────────────────────

function escapeCsv(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: (string | number | undefined)[]): string {
  return cells.map(escapeCsv).join(',');
}

export function exportAnalysesToCsv(
  analyses: PainAnalysis[],
  posts: Post[],
): string {
  const postMap: Record<string, Post> = {};
  posts.forEach((p) => { postMap[p.id] = p; });

  const headers = [
    '分析ID', '元投稿ID', 'ソース', '元投稿本文', '抽出テキスト',
    '痛みカテゴリ', '痛みの強さ', '頻出度', '支払い意思', 'MVP作りやすさ', 'ターゲット明確さ',
    '総合スコア', 'マッチキーワード', '判定理由', '分析日時',
  ];

  const rows = analyses.map((a) => {
    const post = postMap[a.postId];
    return toCsvRow([
      a.id,
      a.postId,
      post ? SOURCE_LABELS[post.source] : '',
      post?.content ?? '',
      a.extractedText,
      PAIN_CATEGORY_LABELS[a.category],
      a.scores.painIntensity,
      a.scores.frequencySignal,
      a.scores.willingnessToPay,
      a.scores.buildability,
      a.scores.nicheClarity,
      a.totalScore,
      a.matchedKeywords.join(' / '),
      a.reasoning,
      a.createdAt,
    ]);
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const bom = '﻿'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
