'use client';

import { firestoreHelpers, QuickNote, Review, type MediaType } from '@/lib/firebase';
import Link from 'next/link';
import QuickNoteImages from '@/components/QuickNoteImages';
import InlineQuickNoteForm from '@/components/InlineQuickNoteForm';
import SpoilerText from '@/components/SpoilerText';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

const FEED_PAGE_SIZE = 10;

type FeedItem =
  | { type: 'note'; id: string; createdAt: Date; note: QuickNote }
  | { type: 'review'; id: string; createdAt: Date; review: Review };

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

function usesPosterThumbnail(mediaType?: MediaType): boolean {
  return mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv';
}

function getThumbnailImage(game: QuickNote['game'] | Review['game']): string {
  if (!game) return '';
  if (game.media_type === 'movie' || game.media_type === 'tv') {
    return game.poster_image || game.background_image;
  }
  return game.background_image;
}

function getFeedItems(notes: QuickNote[], reviews: Review[]): FeedItem[] {
  return [
    ...notes.map((note) => ({
      type: 'note' as const,
      id: `note-${note.id}`,
      createdAt: new Date(note.created_at),
      note,
    })),
    ...reviews.map((review) => ({
      type: 'review' as const,
      id: `review-${review.id}`,
      createdAt: new Date(review.created_at),
      review,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all');
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
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
        firestoreHelpers.getRecentQuickNotesPaginated(FEED_PAGE_SIZE, undefined, mediaFilter),
        firestoreHelpers.getRecentReviewsPaginated(FEED_PAGE_SIZE, undefined, mediaFilter)
      ]);
      setNotes(fetchedNotes);
      setHasMoreNotes(fetchedNotes.length === FEED_PAGE_SIZE);
      setReviews(fetchedReviews);
      setHasMoreReviews(fetchedReviews.length === FEED_PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  const loadMoreContent = async () => {
    if (loadingMore || (!hasMoreNotes && !hasMoreReviews)) return;
    setLoadingMore(true);
    try {
      const lastNote = notes[notes.length - 1];
      const lastReview = reviews[reviews.length - 1];
      const mediaFilter = activeTab === 'all' ? undefined : activeTab;
      const [moreNotes, moreReviews] = await Promise.all([
        hasMoreNotes
          ? firestoreHelpers.getRecentQuickNotesPaginated(
              FEED_PAGE_SIZE,
              lastNote?.created_at,
              mediaFilter
            )
          : Promise.resolve([]),
        hasMoreReviews
          ? firestoreHelpers.getRecentReviewsPaginated(
              FEED_PAGE_SIZE,
              lastReview?.created_at,
              mediaFilter
            )
          : Promise.resolve([]),
      ]);
      setNotes(prev => [...prev, ...moreNotes]);
      setReviews(prev => [...prev, ...moreReviews]);
      setHasMoreNotes(moreNotes.length === FEED_PAGE_SIZE);
      setHasMoreReviews(moreReviews.length === FEED_PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more content:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNoteCreated = (note: QuickNote) => {
    if (activeTab === 'all' || activeTab === note.media_type) {
      setNotes(prev => [note, ...prev]);
    }
  };

  const feedItems = getFeedItems(notes, reviews);
  const hasMoreContent = hasMoreNotes || hasMoreReviews;
  const activeTabLabel = activeTab === 'all'
    ? 'All Posts'
    : `${TABS.find(t => t.key === activeTab)?.label || 'Posts'} Posts`;

  const renderNoteItem = (note: QuickNote) => (
    <article
      key={`note-${note.id}`}
      className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
    >
      <div className="flex gap-4">
        {getThumbnailImage(note.game) && (
          <img
            src={getThumbnailImage(note.game)}
            alt={note.game?.name || 'Media'}
            className={`rounded flex-shrink-0 ${
              usesPosterThumbnail(note.media_type)
                ? `w-16 sm:w-20 aspect-[2/3] ${
                    note.media_type === 'book'
                      ? 'object-contain bg-[var(--surface-light)]'
                      : 'object-cover'
                  }`
                : 'w-16 h-16 sm:w-20 sm:h-20 object-cover'
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
            <span>{getMediaIcon(note.media_type)}</span>
            {note.game && (
              <Link
                href={`/game/${note.game.id}`}
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors font-semibold truncate"
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
            <SpoilerText>{note.content}</SpoilerText>
          </p>

          {note.images && note.images.length > 0 && (
            <QuickNoteImages images={note.images} />
          )}
        </div>
      </div>
    </article>
  );

  const renderReviewItem = (review: Review) => (
    <article
      key={`review-${review.id}`}
      className="bg-[var(--surface)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
    >
      <div className="flex gap-4 p-5">
        {(review.cover_image || getThumbnailImage(review.game)) && (
          <img
            src={review.cover_image || getThumbnailImage(review.game)}
            alt={review.game?.name || 'Media'}
            className={`rounded flex-shrink-0 ${
              usesPosterThumbnail(review.media_type)
                ? `w-16 sm:w-20 aspect-[2/3] ${
                    review.media_type === 'book'
                      ? 'object-contain bg-[var(--surface-light)]'
                      : 'object-cover'
                  }`
                : 'w-20 h-24 sm:w-24 sm:h-28 object-cover'
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm">{getMediaIcon(review.media_type)}</span>
            <span className="px-2 py-1 bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold rounded">
              {review.rating}/10
            </span>
            <span className="text-xs text-[var(--foreground-muted)]">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1 line-clamp-2">
            <Link
              href={`/review/${review.id}`}
              className="text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors"
            >
              {review.title}
            </Link>
          </h3>
          {review.game && (
            <p className="text-sm text-[var(--accent)] font-semibold mb-2 truncate">
              {getMediaTitle(review.game)}
            </p>
          )}
          {review.content && (
            <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">
              <SpoilerText>{review.content}</SpoilerText>
            </p>
          )}
        </div>
      </div>
    </article>
  );

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
      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {feedItems.length === 0 && !isAdmin ? (
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
          <div className={isAdmin ? 'grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start' : 'max-w-4xl mx-auto'}>
            {isAdmin && (
              <aside className="lg:sticky lg:top-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                  Quick Note
                </h2>
                <InlineQuickNoteForm onNoteCreated={handleNoteCreated} />
              </aside>
            )}

            <section className="min-w-0">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    {activeTabLabel}
                  </h2>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    {feedItems.length} loaded
                  </p>
                </div>
              </div>

              {feedItems.length === 0 ? (
                <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)] text-center">
                  <p className="text-[var(--foreground-muted)]">
                    No posts yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedItems.map((item) =>
                    item.type === 'note'
                      ? renderNoteItem(item.note)
                      : renderReviewItem(item.review)
                  )}
                </div>
              )}

              {hasMoreContent && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMoreContent}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] rounded-lg font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Posts'}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
