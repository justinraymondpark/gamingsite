'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CreateContent from '@/components/admin/CreateContent';
import ManageContent from '@/components/admin/ManageContent';

type Tab = 'create' | 'manage';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // Handle URL parameters on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    const edit = searchParams.get('edit');
    
    // If there's an edit parameter, switch to manage tab
    if (edit && (tab === 'manage' || edit.startsWith('note-') || edit.startsWith('review-'))) {
      setActiveTab('manage');
    } else if (tab === 'manage') {
      setActiveTab('manage');
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'create'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            ✍️ Create Content
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            📝 Manage Content
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'create' && <CreateContent />}
        {activeTab === 'manage' && <ManageContent />}
      </div>

      {/* Quick Link to Public Site */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          View Public Site →
        </Link>
      </div>
    </div>
  );
}
