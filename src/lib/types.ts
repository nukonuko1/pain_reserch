// ============================================================
// Core Domain Types
// ============================================================

export type PainCategory =
  | 'frustration'      // 不満
  | 'hassle'           // 面倒
  | 'time_consuming'   // 時間がかかる
  | 'expensive'        // お金がかかる
  | 'difficult'        // 難しい/わからない
  | 'failure'          // 失敗/ミス
  | 'wanted'           // 欲しい/誰か作って
  | 'alternative';     // 比較/代替サービスへの不満

export const PAIN_CATEGORY_LABELS: Record<PainCategory, string> = {
  frustration: '不満',
  hassle: '面倒',
  time_consuming: '時間がかかる',
  expensive: 'お金がかかる',
  difficult: '難しい/わからない',
  failure: '失敗/ミス',
  wanted: '欲しい/誰か作って',
  alternative: '比較/代替への不満',
};

export const PAIN_CATEGORY_COLORS: Record<PainCategory, string> = {
  frustration: 'bg-red-100 text-red-800',
  hassle: 'bg-orange-100 text-orange-800',
  time_consuming: 'bg-yellow-100 text-yellow-800',
  expensive: 'bg-purple-100 text-purple-800',
  difficult: 'bg-blue-100 text-blue-800',
  failure: 'bg-pink-100 text-pink-800',
  wanted: 'bg-green-100 text-green-800',
  alternative: 'bg-indigo-100 text-indigo-800',
};

export type DataSource = 'manual' | 'csv' | 'x' | 'youtube' | 'note' | 'bbs' | 'other';

export const SOURCE_LABELS: Record<DataSource, string> = {
  manual: '手動入力',
  csv: 'CSVインポート',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  note: 'note',
  bbs: '掲示板',
  other: 'その他',
};

// ============================================================
// Project
// ============================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Post (raw input data)
// ============================================================

export interface Post {
  id: string;
  projectId: string;
  source: DataSource;
  content: string;
  url?: string;
  author?: string;
  platform?: string;
  createdAt: string;
  analyzedAt?: string;
}

// ============================================================
// Pain Score Dimensions
// ============================================================

export interface PainScores {
  painIntensity: number;      // 痛みの強さ 1-5
  frequencySignal: number;    // 頻出度 1-5
  willingnessToPay: number;   // 支払い意思 1-5
  buildability: number;       // MVPの作りやすさ 1-5
  nicheClarity: number;       // ターゲットの明確さ 1-5
}

export interface PainAnalysis {
  id: string;
  postId: string;
  projectId: string;
  category: PainCategory;
  extractedText: string;
  scores: PainScores;
  totalScore: number;          // 0-100
  matchedKeywords: string[];
  reasoning: string;
  createdAt: string;
}

// ============================================================
// Cluster
// ============================================================

export interface PainCluster {
  id: string;
  projectId: string;
  name: string;
  description: string;
  category: PainCategory;
  analysisIds: string[];
  representativeKeywords: string[];
  avgTotalScore: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Product Idea
// ============================================================

export interface ProductIdea {
  id: string;
  projectId: string;
  clusterId?: string;
  title: string;
  tagline: string;
  targetUser: string;
  painSolved: string;
  solution: string;
  monetizationModel: string;
  mvpFeatures: string[];
  estimatedScore: number;
  xPostDraft: string;
  relatedCategories: PainCategory[];
  createdAt: string;
}

// ============================================================
// App Store (for persistence abstraction)
// ============================================================

export interface AppStore {
  projects: Project[];
  posts: Post[];
  analyses: PainAnalysis[];
  clusters: PainCluster[];
  ideas: ProductIdea[];
  activeProjectId: string | null;
}

// ============================================================
// CSV Row
// ============================================================

export interface CsvRow {
  content: string;
  source?: string;
  url?: string;
  author?: string;
  platform?: string;
}
