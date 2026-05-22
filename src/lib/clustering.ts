/**
 * Simple keyword-overlap clustering for pain analyses.
 * Groups analyses by category first, then merges those sharing keywords.
 */

import type { PainAnalysis, PainCluster, PainCategory } from './types';
import { PAIN_CATEGORY_LABELS } from './types';

function keywordOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const common = b.filter((k) => setA.has(k.toLowerCase()));
  return common.length;
}

function topKeywords(analyses: PainAnalysis[]): string[] {
  const freq: Record<string, number> = {};
  analyses.forEach((a) => {
    a.matchedKeywords.forEach((kw) => {
      freq[kw] = (freq[kw] ?? 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);
}

export function clusterAnalyses(
  analyses: PainAnalysis[],
  projectId: string,
): Omit<PainCluster, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (analyses.length === 0) return [];

  // Group by category
  const byCategory: Record<PainCategory, PainAnalysis[]> = {} as Record<PainCategory, PainAnalysis[]>;
  analyses.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  });

  const clusters: Omit<PainCluster, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const [cat, group] of Object.entries(byCategory)) {
    const category = cat as PainCategory;

    // Sub-cluster by keyword overlap within category
    const subGroups: PainAnalysis[][] = [];
    group.forEach((analysis) => {
      const matched = subGroups.findIndex(
        (sg) => keywordOverlap(sg[0].matchedKeywords, analysis.matchedKeywords) >= 1,
      );
      if (matched !== -1) {
        subGroups[matched].push(analysis);
      } else {
        subGroups.push([analysis]);
      }
    });

    // Merge very small sub-groups (< 2) back together
    const merged: PainAnalysis[][] = [];
    const small: PainAnalysis[] = [];
    subGroups.forEach((sg) => {
      if (sg.length >= 2) merged.push(sg);
      else small.push(...sg);
    });
    if (small.length > 0) merged.push(small);

    merged.forEach((sg, idx) => {
      const keywords = topKeywords(sg);
      const avgScore = Math.round(sg.reduce((s, a) => s + a.totalScore, 0) / sg.length);
      const label = PAIN_CATEGORY_LABELS[category];
      const nameSuffix = keywords[0] ? `（${keywords[0]}）` : '';

      clusters.push({
        projectId,
        name: `${label}クラスター${merged.length > 1 ? ` #${idx + 1}` : ''}${nameSuffix}`,
        description: `「${label}」に関連する痛みを${sg.length}件まとめました。代表キーワード: ${keywords.slice(0, 3).join(', ')}`,
        category,
        analysisIds: sg.map((a) => a.id),
        representativeKeywords: keywords,
        avgTotalScore: avgScore,
      });
    });
  }

  return clusters.sort((a, b) => b.avgTotalScore - a.avgTotalScore);
}
