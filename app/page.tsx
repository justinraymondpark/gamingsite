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
  { key: 'guitar', label: 'Guitar', icon: '🎸' },
  { key: 'book', label: 'Books', icon: '📚' },
  { key: 'movie', label: 'Movies', icon: '🎬' },
  { key: 'tv', label: 'TV', icon: '📺' },
];

function getMediaIcon(mediaType?: MediaType): string {
  switch (mediaType) {
    case 'game': return '🎮';
    case 'music': return '🎵';
    case 'guitar': return '🎸';
    case 'book': return '📚';
    case 'movie': return '🎬';
    case 'tv': return '📺';
    default: return '🎮';
  }
}

function getMediaTitle(game: QuickNote['game'] | Review['game']): string {
  if (!game) return '';
  const creator = game.artist || game.author;
  return creator ? `${creator} - ${game.name}` : game.name;
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all');
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // One-time backfill of media_type on legacy documents
  useEffect(() => {
    firestoreHelpers.backfillMediaType().then(count => {
      if (count > 0) console.log(`Backfilled media_type on ${count} documents`);
    });
  }, []);

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
        <div className="loader" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="site-header">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <h1 className="brand text-[var(--foreground)]">
              Media<span className="neon-accent">Log</span>
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
      <nav className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto items-center">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : ''}`}
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
          <div className="text-center py-20 rise">
            <div className="card inline-block p-8">
              <h2 className="section-title text-[var(--foreground)] mb-2">
                {activeTab === 'all' ? 'No content yet!' : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} content yet!`}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-6">
                Start adding content in the admin panel.
              </p>
              <Link
                href="/admin"
                className="btn-primary inline-block px-6 py-3"
              >
                Go to Admin
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Quick Notes Section */}
            {(notes.length > 0 || isAdmin) && (
              <section>
                <p className="section-label mb-1">Journal</p>
                <h2 className="section-title text-[var(--foreground)] mb-6">
                  Quick Notes
                </h2>

                {isAdmin && (
                  <InlineQuickNoteForm onNoteCreated={handleNoteCreated} />
                )}

                <div className="space-y-4">
                  {notes.map((note, i) => (
                    <div
                      key={note.id}
                      className="card card-hover rise p-5"
                      style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                    >
                      <div className="flex gap-4">
                        {note.game?.background_image && (
                          <div className="thumb w-20 h-20 flex-shrink-0">
                            <img
                              src={note.game.background_image}
                              alt={note.game.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <span>{getMediaIcon(note.media_type)}</span>
                            {note.game && (
                              <Link
                                href={`/game/${note.game.id}`}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-semibold"
                              >
                                {getMediaTitle(note.game)}
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
                      className="btn-ghost px-6 py-3"
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
                <p className="section-label mb-1">In depth</p>
                <h2 className="section-title text-[var(--foreground)] mb-6">
                  Recent Reviews
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {reviews.map((review, i) => (
                    <Link
                      key={review.id}
                      href={`/review/${review.id}`}
                      className="block group rise"
                      style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                    >
                      <div className="card card-hover overflow-hidden h-full">
                        {(review.cover_image || review.game?.background_image) && (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={review.cover_image || review.game?.background_image || ''}
                              alt={review.game?.name || 'Media'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{getMediaIcon(review.media_type)}</span>
                            <span className="badge-rating px-2 py-1 text-xs">
                              {review.rating}/10
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)]">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-display text-xl text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                            {review.title}
                          </h3>
                          {review.game && (
                            <p className="text-sm">
                              <span className="text-[var(--accent)] font-semibold">
                                {getMediaTitle(review.game)}
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
