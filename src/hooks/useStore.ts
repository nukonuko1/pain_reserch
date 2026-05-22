'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Project, Post, PainAnalysis, PainCluster, ProductIdea } from '@/lib/types';
import * as storage from '@/lib/storage';

// ── Projects ──────────────────────────────────────────────────

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setProjects(storage.getProjects());
    setActiveId(storage.getActiveProjectId());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const createProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const p = storage.saveProject(data);
    reload();
    return p;
  }, [reload]);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    const p = storage.updateProject(id, data);
    reload();
    return p;
  }, [reload]);

  const deleteProject = useCallback((id: string) => {
    storage.deleteProject(id);
    reload();
  }, [reload]);

  const setActiveProject = useCallback((id: string | null) => {
    storage.setActiveProjectId(id);
    setActiveId(id);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  return { projects, activeProjectId, activeProject, getProject, createProject, updateProject, deleteProject, setActiveProject, reload };
}

// ── Posts ─────────────────────────────────────────────────────

export function usePosts(projectId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);

  const reload = useCallback(() => {
    if (projectId) setPosts(storage.getPosts(projectId));
    else setPosts([]);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const savePosts = useCallback((data: Omit<Post, 'id' | 'createdAt'>[]) => {
    const saved = storage.savePosts(data);
    reload();
    return saved;
  }, [reload]);

  const deletePost = useCallback((id: string) => {
    storage.deletePost(id);
    reload();
  }, [reload]);

  return { posts, savePosts, deletePost, reload };
}

// ── Analyses ──────────────────────────────────────────────────

export function useAnalyses(projectId: string | null) {
  const [analyses, setAnalyses] = useState<PainAnalysis[]>([]);

  const reload = useCallback(() => {
    if (projectId) setAnalyses(storage.getAnalyses(projectId));
    else setAnalyses([]);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const saveAnalyses = useCallback((data: Omit<PainAnalysis, 'id' | 'createdAt'>[]) => {
    const saved = storage.saveAnalyses(data);
    reload();
    return saved;
  }, [reload]);

  const clearAnalyses = useCallback(() => {
    if (projectId) {
      storage.deleteAnalysesByProject(projectId);
      reload();
    }
  }, [projectId, reload]);

  return { analyses, saveAnalyses, clearAnalyses, reload };
}

// ── Clusters ──────────────────────────────────────────────────

export function useClusters(projectId: string | null) {
  const [clusters, setClusters] = useState<PainCluster[]>([]);

  const reload = useCallback(() => {
    if (projectId) setClusters(storage.getClusters(projectId));
    else setClusters([]);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const saveClusters = useCallback((data: Omit<PainCluster, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    storage.deleteClustersByProject(projectId!);
    const saved = storage.saveClusters(data);
    reload();
    return saved;
  }, [projectId, reload]);

  return { clusters, saveClusters, reload };
}

// ── Ideas ─────────────────────────────────────────────────────

export function useIdeas(projectId: string | null) {
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);

  const reload = useCallback(() => {
    if (projectId) setIdeas(storage.getIdeas(projectId));
    else setIdeas([]);
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const saveIdeas = useCallback((data: Omit<ProductIdea, 'id' | 'createdAt'>[]) => {
    storage.deleteIdeasByProject(projectId!);
    const saved = storage.saveIdeas(data);
    reload();
    return saved;
  }, [projectId, reload]);

  const deleteIdea = useCallback((id: string) => {
    storage.deleteIdea(id);
    reload();
  }, [reload]);

  return { ideas, saveIdeas, deleteIdea, reload };
}
