'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Project } from '@/lib/types';

interface ProjectFormData {
  name: string;
  description: string;
  keywords: string;
}

const DEFAULT_FORM: ProjectFormData = { name: '', description: '', keywords: '' };

export default function ProjectsPage() {
  const { projects, activeProjectId, createProject, updateProject, deleteProject, setActiveProject } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditTarget(project);
    setForm({
      name: project.name,
      description: project.description,
      keywords: project.keywords.join(', '),
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (editTarget) {
      updateProject(editTarget.id, { name: form.name, description: form.description, keywords });
    } else {
      const p = createProject({ name: form.name, description: form.description, keywords });
      setActiveProject(p.id);
    }
    setModalOpen(false);
  }

  function handleDelete(project: Project) {
    deleteProject(project.id);
    setConfirmDelete(null);
  }

  return (
    <div>
      <PageHeader
        title="プロジェクト"
        description="リサーチプロジェクトを管理します"
        actions={<Button onClick={openCreate}>+ 新規プロジェクト</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="プロジェクトがありません"
          description="プロジェクトを作成してリサーチを始めましょう"
          action={<Button onClick={openCreate}>プロジェクトを作成</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-sm
                ${activeProjectId === project.id ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100'}`}
              onClick={() => setActiveProject(project.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                </div>
                {activeProjectId === project.id && (
                  <span className="ml-2 text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium shrink-0">使用中</span>
                )}
              </div>

              {project.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.keywords.slice(0, 5).map((kw) => (
                    <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                  {project.keywords.length > 5 && (
                    <span className="text-xs text-gray-400">+{project.keywords.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                  >
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(project); }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'プロジェクトを編集' : '新規プロジェクト'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()}>
              {editTarget ? '更新' : '作成'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">プロジェクト名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例: 副業系SNS痛みリサーチ"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="例: Xで副業・フリーランスに関する不満・要望を収集する"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              キーワード（カンマ区切り）
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="例: 副業, フリーランス, 確定申告, 案件獲得"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">スコアリング時のブーストキーワードになります</p>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="プロジェクトを削除"
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>キャンセル</Button>
            <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              削除する
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          「<strong>{confirmDelete?.name}</strong>」を削除します。関連する投稿・分析・クラスター・アイデアもすべて削除されます。この操作は取り消せません。
        </p>
      </Modal>
    </div>
  );
}
