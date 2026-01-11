import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Game, QuickNote, Review } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QuickNoteImages from '@/components/QuickNoteImages';

// Revalidate every 10 seconds to show fresh content
export const revalidate = 10;

async function getGameContent(gameId: string) {
  // Get game details
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (!gameDoc.exists()) return null;
  const game = { id: gameDoc.id, ...gameDoc.data() } as Game;

  // Get all quick notes for this game
  // Note: Filtering by game_id requires fetching all or using an index.
  // For small scale, fetching all notes and filtering in memory is okay,
  // but better is 'where' query. If index missing, it might error or warn.
  // We'll try 'where' query. If it fails due to missing index, we might need to create it.
  // However, simple equality queries usually don't need composite index unless combined with orderBy.
  // If we want orderBy created_at, we need index (game_id, created_at).
  // Strategy: Query by game_id, sort in memory.

  const notesQuery = query(collection(db, 'quick_notes'), where('game_id', '==', gameId));
  const notesSnapshot = await getDocs(notesQuery);
  const notes = notesSnapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as QuickNote))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach game object to notes
  notes.forEach(note => note.game = game);

  // Get all reviews for this game
  const reviewsQuery = query(collection(db, 'reviews'), where('game_id', '==', gameId));
  const reviewsSnapshot = await getDocs(reviewsQuery);
  const reviews = reviewsSnapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach game object to reviews
  reviews.forEach(review => review.game = game);

  return {
    game,
    notes,
    reviews
  };
}

export default async function GamePage({ params }: { params: { id: string } }) {
  // params.id is already async in Next.js 15, but let's check if we need await params
  // Next.js 15 breaking change: params is a promise.
  // Wait, the provided files show: export default async function GamePage({ params }: { params: { id: string } })
  // In Next.js 15, params is Promise<{ id: string }>.
  // I should double check if the provided code was already Next 15 compliant or if I need to await it.
  // The package.json says "next": "15.5.5".
  // So params is a promise.

  const resolvedParams = await params;
  const data = await getGameContent(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { game, notes, reviews } = data;

  // Calculate average rating if there are reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Game Hero Section */}
      <div className="relative">
        {game.background_image && (
          <div className="h-96 overflow-hidden">
            <img
              src={game.background_image}
              alt={game.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/50 to-transparent" />
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8 shadow-xl">
            <h1 className="text-5xl font-bold text-[var(--foreground)] mb-4">
              {game.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)]">
              {game.released && (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Released:</span> {new Date(game.released).getFullYear()}
                </div>
              )}
              {game.genres && game.genres.length > 0 && (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Genres:</span> {game.genres.join(', ')}
                </div>
              )}
              {avgRating && (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">My Rating:</span>{' '}
                  <span className="text-[var(--accent)] font-bold">{avgRating}/10</span>
                </div>
              )}
            </div>

            {/* Content Stats */}
            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{reviews.length}</div>
                <div className="text-sm text-[var(--foreground-muted)]">
                  {reviews.length === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{notes.length}</div>
                <div className="text-sm text-[var(--foreground-muted)]">
                  {notes.length === 1 ? 'Quick Note' : 'Quick Notes'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Reviews Section */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">
              Reviews
            </h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/review/${review.id}`}
                  className="block group"
                >
                  <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:transform hover:scale-[1.01]">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                        {review.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-bold">
                          {review.rating}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)] mb-3">
                      {review.platforms_played && review.platforms_played.length > 0 && (
                        <span>🎮 {review.platforms_played.join(', ')}</span>
                      )}
                      {review.playtime_hours && review.playtime_hours > 0 && (
                        <span>⏱️ {review.playtime_hours}h played</span>
                      )}
                      <span>📅 {new Date(review.created_at).toLocaleDateString()}</span>
                    </div>

                    {review.content && (
                      <p className="text-[var(--foreground-muted)] line-clamp-2">
                        {review.content.substring(0, 200)}...
                      </p>
                    )}

                    <div className="mt-4 text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors text-sm font-semibold">
                      Read full review →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick Notes Section */}
        {notes.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">
              Quick Notes
            </h2>
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)]"
                >
                  <div className="flex gap-4">
                    {note.images && note.images.length > 0 && (
                      <QuickNoteImages images={note.images} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--foreground)] whitespace-pre-wrap break-words">
                        {note.content}
                      </p>
                      <p className="text-sm text-[var(--foreground-muted)] mt-2">
                        {new Date(note.created_at).toLocaleDateString()} at{' '}
                        {new Date(note.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {reviews.length === 0 && notes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--foreground-muted)] text-lg">
              No content yet for this game.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
