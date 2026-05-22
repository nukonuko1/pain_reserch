'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '@/hooks/useStore';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '◼' },
  { href: '/projects', label: 'プロジェクト', icon: '◻' },
  { href: '/input', label: '入力', icon: '✎' },
  { href: '/results', label: '痛み分析', icon: '⚡' },
  { href: '/clusters', label: 'クラスター', icon: '◈' },
  { href: '/ideas', label: 'アイデア', icon: '☆' },
  { href: '/export', label: 'エクスポート', icon: '↓' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { projects, activeProject, setActiveProject } = useProjects();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Hamburger button (mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">痛みリサーチ</h1>
          <p className="text-xs text-gray-400 mt-0.5">Pain Research Tool</p>
        </div>

        {/* Project selector */}
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1.5 px-2">プロジェクト</p>
          {projects.length === 0 ? (
            <Link
              href="/projects"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <span>+ 新規作成</span>
            </Link>
          ) : (
            <select
              value={activeProject?.id ?? ''}
              onChange={(e) => setActiveProject(e.target.value || null)}
              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors
                  ${active
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">MVP v1.0 · ローカル処理</p>
        </div>
      </aside>
    </>
  );
}
