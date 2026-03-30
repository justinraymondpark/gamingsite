'use client';

import { firestoreHelpers, QuickNote, Review, type MediaType } from '@/lib/firebase';
import Link from 'next/link';
import QuickNoteImages from '@/components/QuickNoteImages';
import InlineQuickNoteForm from '@/components/InlineQuickNoteForm';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 5;

const TABS: { key: MediaType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'game', label: 'Games', icon: '🎮' },
  { key: 'music', label: 'Music', icon: '🎵' },
  { key: 'movie', label: 'Movies', icon: '🎬' },
  { key: 'tv', label: 'TV', icon: '📺' },
];

function getMediaIcon(mediaType?: MediaType): string {
  switch (mediaType) {
    case 'game': return '🎮';
    case 'music': return '🎵';
    case 'movie': return '🎬';
    case 'tv': return '📺';
    default: return '🎮';
  }
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all');
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotes([]);
    setReviews([]);
    fetchContent();
  }, [activeTab]);

  async function fetchContent() {
    try {
      const mediaFilter = activeTab === 'all' ? undefined : activeTab;
      const [fetchedNotes, fetchedReviews] = await Promise.all([
        firestoreHelpers.getRecentQuickNotesPaginated(PAGE_SIZE, undefined, mediaFilter),
        firestoreHelpers.getRecentReviews(5, mediaFilter)
      ]);
      setNotes(fetchedNotes);
      setHasMoreNotes(fetchedNotes.length === PAGE_SIZE);
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  const loadMoreNotes = async () => {
    if (loadingMore || notes.length === 0) return;
    setLoadingMore(true);
    try {
      const lastNote = notes[notes.length - 1];
      const mediaFilter = activeTab === 'all' ? undefined : activeTab;
      const moreNotes = await firestoreHelpers.getRecentQuickNotesPaginated(
        PAGE_SIZE,
        lastNote.created_at,
        mediaFilter
      );
      setNotes(prev => [...prev, ...moreNotes]);
      setHasMoreNotes(moreNotes.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more notes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNoteCreated = (note: QuickNote) => {
    setNotes(prev => [note, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--foreground-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Media<span className="text-[var(--accent)]">Log</span>
            </h1>
            <Link
              href="/admin"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {notes.length === 0 && reviews.length === 0 && !isAdmin ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {activeTab === 'all' ? 'No content yet!' : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} content yet!`}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-6">
                Start adding content in the admin panel.
              </p>
              <Link
                href="/admin"
                className="inline-block px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors"
              >
                Go to Admin
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Notes Section */}
            {(notes.length > 0 || isAdmin) && (
              <section>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Quick Notes
                </h2>

                {isAdmin && (
                  <InlineQuickNoteForm onNoteCreated={handleNoteCreated} />
                )}

                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
                    >
                      <div className="flex gap-4">
                        {note.game?.background_image && (
                          <img
                            src={note.game.background_image}
                            alt={note.game.name}
                            className="w-20 h-20 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <span>{getMediaIcon(note.media_type)}</span>
                            {note.game && (
                              <Link
                                href={`/game/${note.game.id}`}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-semibold"
                              >
                                {note.game.artist ? `${note.game.artist} - ` : ''}{note.game.name}
                              </Link>
                            )}
                            <span className="text-[var(--foreground-muted)]">·</span>
                            <span className="text-[var(--foreground-muted)]">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-[var(--foreground)] whitespace-pre-wrap break-words">
                            {note.content}
                          </p>

                          {note.images && note.images.length > 0 && (
                            <QuickNoteImages images={note.images} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreNotes && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreNotes}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-lg font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Notes'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Recent Reviews
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/review/${review.id}`}
                      className="block group"
                    >
                      <div className="bg-[var(--surface)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:transform hover:scale-[1.02]">
                        {(review.cover_image || review.game?.background_image) && (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={review.cover_image || review.game?.background_image || ''}
                              alt={review.game?.name || 'Media'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{getMediaIcon(review.media_type)}</span>
                            <span className="px-2 py-1 bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold rounded">
                              {review.rating}/10
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)]">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                            {review.title}
                          </h3>
                          {review.game && (
                            <p className="text-sm">
                              <span className="text-[var(--accent)] font-semibold">
                                {review.game.artist ? `${review.game.artist} - ` : ''}{review.game.name}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
