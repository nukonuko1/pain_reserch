/**
 * Storage abstraction layer.
 * Currently uses localStorage, designed for easy Supabase migration.
 * To migrate: replace each function with an async API call.
 */

import type { AppStore, Project, Post, PainAnalysis, PainCluster, ProductIdea } from './types';

const STORAGE_KEY = 'pain_research_store';

const DEFAULT_STORE: AppStore = {
  projects: [],
  posts: [],
  analyses: [],
  clusters: [],
  ideas: [],
  activeProjectId: null,
};

function getStore(): AppStore {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    return { ...DEFAULT_STORE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STORE;
  }
}

function setStore(store: AppStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Projects ──────────────────────────────────────────────────

export function getProjects(): Project[] {
  return getStore().projects;
}

export function getProject(id: string): Project | undefined {
  return getStore().projects.find((p) => p.id === id);
}

export function saveProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
  const store = getStore();
  const now = new Date().toISOString();
  const project: Project = { ...data, id: generateId(), createdAt: now, updatedAt: now };
  store.projects.push(project);
  if (!store.activeProjectId) store.activeProjectId = project.id;
  setStore(store);
  return project;
}

export function updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Project {
  const store = getStore();
  const idx = store.projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  store.projects[idx] = { ...store.projects[idx], ...data, updatedAt: new Date().toISOString() };
  setStore(store);
  return store.projects[idx];
}

export function deleteProject(id: string): void {
  const store = getStore();
  store.projects = store.projects.filter((p) => p.id !== id);
  store.posts = store.posts.filter((p) => p.projectId !== id);
  store.analyses = store.analyses.filter((a) => a.projectId !== id);
  store.clusters = store.clusters.filter((c) => c.projectId !== id);
  store.ideas = store.ideas.filter((i) => i.projectId !== id);
  if (store.activeProjectId === id) {
    store.activeProjectId = store.projects[0]?.id ?? null;
  }
  setStore(store);
}

// ── Active Project ─────────────────────────────────────────

export function getActiveProjectId(): string | null {
  return getStore().activeProjectId;
}

export function setActiveProjectId(id: string | null): void {
  const store = getStore();
  store.activeProjectId = id;
  setStore(store);
}

// ── Posts ─────────────────────────────────────────────────

export function getPosts(projectId: string): Post[] {
  return getStore().posts.filter((p) => p.projectId === projectId);
}

export function getPost(id: string): Post | undefined {
  return getStore().posts.find((p) => p.id === id);
}

export function savePosts(posts: Omit<Post, 'id' | 'createdAt'>[]): Post[] {
  const store = getStore();
  const now = new Date().toISOString();
  const saved: Post[] = posts.map((p) => ({ ...p, id: generateId(), createdAt: now }));
  store.posts.push(...saved);
  setStore(store);
  return saved;
}

export function updatePost(id: string, data: Partial<Post>): Post {
  const store = getStore();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Post not found');
  store.posts[idx] = { ...store.posts[idx], ...data };
  setStore(store);
  return store.posts[idx];
}

export function deletePost(id: string): void {
  const store = getStore();
  store.posts = store.posts.filter((p) => p.id !== id);
  store.analyses = store.analyses.filter((a) => a.postId !== id);
  setStore(store);
}

// ── Analyses ──────────────────────────────────────────────

export function getAnalyses(projectId: string): PainAnalysis[] {
  return getStore().analyses.filter((a) => a.projectId === projectId);
}

export function saveAnalyses(analyses: Omit<PainAnalysis, 'id' | 'createdAt'>[]): PainAnalysis[] {
  const store = getStore();
  const now = new Date().toISOString();
  const saved: PainAnalysis[] = analyses.map((a) => ({ ...a, id: generateId(), createdAt: now }));
  store.analyses.push(...saved);
  setStore(store);
  return saved;
}

export function deleteAnalysesByProject(projectId: string): void {
  const store = getStore();
  store.analyses = store.analyses.filter((a) => a.projectId !== projectId);
  setStore(store);
}

// ── Clusters ──────────────────────────────────────────────

export function getClusters(projectId: string): PainCluster[] {
  return getStore().clusters.filter((c) => c.projectId === projectId);
}

export function saveClusters(clusters: Omit<PainCluster, 'id' | 'createdAt' | 'updatedAt'>[]): PainCluster[] {
  const store = getStore();
  const now = new Date().toISOString();
  const saved: PainCluster[] = clusters.map((c) => ({ ...c, id: generateId(), createdAt: now, updatedAt: now }));
  store.clusters.push(...saved);
  setStore(store);
  return saved;
}

export function deleteClustersByProject(projectId: string): void {
  const store = getStore();
  store.clusters = store.clusters.filter((c) => c.projectId !== projectId);
  setStore(store);
}

// ── Ideas ──────────────────────────────────────────────────

export function getIdeas(projectId: string): ProductIdea[] {
  return getStore().ideas.filter((i) => i.projectId === projectId);
}

export function saveIdeas(ideas: Omit<ProductIdea, 'id' | 'createdAt'>[]): ProductIdea[] {
  const store = getStore();
  const now = new Date().toISOString();
  const saved: ProductIdea[] = ideas.map((i) => ({ ...i, id: generateId(), createdAt: now }));
  store.ideas.push(...saved);
  setStore(store);
  return saved;
}

export function deleteIdea(id: string): void {
  const store = getStore();
  store.ideas = store.ideas.filter((i) => i.id !== id);
  setStore(store);
}

export function deleteIdeasByProject(projectId: string): void {
  const store = getStore();
  store.ideas = store.ideas.filter((i) => i.projectId !== projectId);
  setStore(store);
}

// ── Full export (for CSV download) ───────────────────────

export function exportProjectData(projectId: string) {
  const store = getStore();
  return {
    project: store.projects.find((p) => p.id === projectId),
    posts: store.posts.filter((p) => p.projectId === projectId),
    analyses: store.analyses.filter((a) => a.projectId === projectId),
    clusters: store.clusters.filter((c) => c.projectId === projectId),
    ideas: store.ideas.filter((i) => i.projectId === projectId),
  };
}
