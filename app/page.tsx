import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { QuickNote, Review } from '@/lib/supabase';
import QuickNoteImages from '@/components/QuickNoteImages';

async function getRecentContent() {
  const { data: notes } = await supabase
    .from('quick_notes')
    .select(`
      *,
      game:games(*)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      game:games(*)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  return { notes: notes || [], reviews: reviews || [] };
}

export default async function Home() {
  const { notes, reviews } = await getRecentContent();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Game<span className="text-[var(--accent)]">Log</span>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {notes.length === 0 && reviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                No content yet!
              </h2>
              <p className="text-[var(--foreground-muted)] mb-6">
                Start adding games and sharing your thoughts in the admin panel.
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
            {/* Reviews Section */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Recent Reviews
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {reviews.map((review: any) => (
                    <Link
                      key={review.id}
                      href={`/review/${review.id}`}
                      className="block group"
                    >
                      <div className="bg-[var(--surface)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:transform hover:scale-[1.02]">
                        {(review.cover_image || review.game?.background_image) && (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={review.cover_image || review.game.background_image}
                              alt={review.game.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
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
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {review.game?.name}
                          </p>
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
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                  Quick Notes
                </h2>
                <div className="space-y-4">
                  {notes.map((note: any) => (
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
                          <p className="text-[var(--foreground)] mb-2">
                            {note.content}
                          </p>
                          
                          {/* User-uploaded screenshots */}
                          {note.images && note.images.length > 0 && (
                            <QuickNoteImages images={note.images} />
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[var(--accent)] font-semibold">
                              {note.game?.name}
                            </span>
                            <span className="text-[var(--foreground-muted)]">•</span>
                            <span className="text-[var(--foreground-muted)]">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
