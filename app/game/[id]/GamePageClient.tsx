'use client';

import { firestoreHelpers, Game, QuickNote, Review } from '@/lib/firebase';
import Link from 'next/link';
import QuickNoteImages from '@/components/QuickNoteImages';
import { useEffect, useState } from 'react';

export default function GamePage() {
  const [game, setGame] = useState<Game | null>(null);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const gameId = window.location.pathname.split('/')[2];
    if (!gameId) return;

    async function fetchGameContent() {
      try {
        const fetchedGame = await firestoreHelpers.getGameById(gameId);

        if (!fetchedGame) {
          setNotFound(true);
          return;
        }

        setGame(fetchedGame);

        const [fetchedNotes, fetchedReviews] = await Promise.all([
          firestoreHelpers.getQuickNotesByGameId(gameId),
          firestoreHelpers.getReviewsByGameId(gameId)
        ]);

        setNotes(fetchedNotes);
        setReviews(fetchedReviews);
      } catch (error) {
        console.error('Error fetching game content:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchGameContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--foreground-muted)]">Loading...</div>
      </div>
    );
  }

  if (notFound || !game) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Not found</h1>
          <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </header>

      <div className="relative">
        {game.background_image && (
          <div className="h-96 overflow-hidden">
            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/50 to-transparent" />
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-8 shadow-xl">
            <h1 className="text-5xl font-bold text-[var(--foreground)] mb-2">
              {game.artist ? `${game.artist} - ` : ''}{game.name}
            </h1>
            {game.director && (
              <p className="text-lg text-[var(--foreground-muted)] mb-2">Directed by {game.director}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)]">
              {game.released && (
                <div><span className="font-semibold text-[var(--foreground)]">Released:</span> {new Date(game.released).getFullYear()}</div>
              )}
              {game.genres && game.genres.length > 0 && (
                <div><span className="font-semibold text-[var(--foreground)]">Genres:</span> {game.genres.join(', ')}</div>
              )}
              {game.platforms && game.platforms.length > 0 && (
                <div><span className="font-semibold text-[var(--foreground)]">Platforms:</span> {game.platforms.join(', ')}</div>
              )}
              {game.cast && game.cast.length > 0 && (
                <div><span className="font-semibold text-[var(--foreground)]">Cast:</span> {game.cast.slice(0, 5).join(', ')}</div>
              )}
              {game.runtime && (
                <div><span className="font-semibold text-[var(--foreground)]">Runtime:</span> {game.runtime} min</div>
              )}
              {game.seasons && (
                <div><span className="font-semibold text-[var(--foreground)]">Seasons:</span> {game.seasons}</div>
              )}
              {game.label && (
                <div><span className="font-semibold text-[var(--foreground)]">Label:</span> {game.label}</div>
              )}
              {avgRating && (
                <div><span className="font-semibold text-[var(--foreground)]">My Rating:</span> <span className="text-[var(--accent)] font-bold">{avgRating}/10</span></div>
              )}
            </div>

            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{reviews.length}</div>
                <div className="text-sm text-[var(--foreground-muted)]">{reviews.length === 1 ? 'Review' : 'Reviews'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{notes.length}</div>
                <div className="text-sm text-[var(--foreground-muted)]">{notes.length === 1 ? 'Quick Note' : 'Quick Notes'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {notes.length === 0 && reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--foreground-muted)] text-lg">No content yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              ...notes.map(n => ({ type: 'note' as const, data: n, date: new Date(n.created_at) })),
              ...reviews.map(r => ({ type: 'review' as const, data: r, date: new Date(r.created_at) })),
            ]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((item) =>
                item.type === 'note' ? (
                  <div key={`note-${item.data.id}`} className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)]">
                    <p className="text-sm text-[var(--foreground-muted)] mb-2">
                      {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[var(--foreground)] whitespace-pre-wrap break-words">{item.data.content}</p>
                    {item.data.images?.length > 0 && (
                      <div className="mt-3">
                        <QuickNoteImages images={item.data.images} />
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={`review-${item.data.id}`} href={`/review/${item.data.id}`} className="block group">
                    <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:transform hover:scale-[1.01]">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{item.data.title}</h3>
                        <span className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-bold flex-shrink-0">{item.data.rating}/10</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)] mb-3">
                        {item.data.platforms_played?.length > 0 && <span>🎮 {item.data.platforms_played.join(', ')}</span>}
                        {item.data.playtime_hours && <span>⏱️ {item.data.playtime_hours}h played</span>}
                        <span>📅 {item.date.toLocaleDateString()}</span>
                      </div>
                      {item.data.content && <p className="text-[var(--foreground-muted)] line-clamp-2">{item.data.content.substring(0, 200)}...</p>}
                      <div className="mt-4 text-[var(--accent)] text-sm font-semibold">Read full review →</div>
                    </div>
                  </Link>
                )
              )}
          </div>
        )}
      </div>
    </div>
  );
}
