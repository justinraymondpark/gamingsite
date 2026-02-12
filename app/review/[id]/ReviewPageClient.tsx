'use client';

import { firestoreHelpers, Review } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ImageGallery from '@/components/ImageGallery';
import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const params = useParams();
  const reviewId = params.id as string;
  
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchReview() {
      try {
        const fetchedReview = await firestoreHelpers.getReviewById(reviewId);
        if (!fetchedReview) {
          setNotFound(true);
          return;
        }
        setReview(fetchedReview);
      } catch (error) {
        console.error('Error fetching review:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    
    if (reviewId) fetchReview();
  }, [reviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--foreground-muted)]">Loading...</div>
      </div>
    );
  }

  if (notFound || !review) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Review not found</h1>
          <Link href="/" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {(review.cover_image || review.game?.background_image) && (
          <div className="aspect-video rounded-lg overflow-hidden mb-8">
            <img src={review.cover_image || review.game?.background_image || ''} alt={review.game?.name || 'Game'} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">{review.title}</h1>
          {review.game && (
            <Link href={`/game/${review.game.id}`} className="text-2xl text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors inline-block mb-4">
              {review.game.name}
            </Link>
          )}
          
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <div className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] font-bold rounded-lg">{review.rating}/10</div>
            {review.platforms_played?.length > 0 && (
              <div className="flex gap-2">
                {review.platforms_played.map((platform: string) => (
                  <span key={platform} className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)]">{platform}</span>
                ))}
              </div>
            )}
            {review.playtime_hours && <span className="text-[var(--foreground-muted)]">⏱️ {review.playtime_hours} hours</span>}
            <span className="text-[var(--foreground-muted)]">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {((review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0)) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {review.pros && review.pros.length > 0 && (
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
                <h3 className="text-lg font-bold text-[var(--accent)] mb-3">✓ Pros</h3>
                <ul className="space-y-2">
                  {review.pros.map((pro: string, i: number) => (
                    <li key={i} className="text-[var(--foreground)] flex items-start"><span className="text-[var(--accent)] mr-2">+</span>{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.cons && review.cons.length > 0 && (
              <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
                <h3 className="text-lg font-bold text-red-400 mb-3">✗ Cons</h3>
                <ul className="space-y-2">
                  {review.cons.map((con: string, i: number) => (
                    <li key={i} className="text-[var(--foreground)] flex items-start"><span className="text-red-400 mr-2">-</span>{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)]">
          <div className="prose-custom text-[var(--foreground)]">
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-2xl font-bold text-[var(--accent)] mt-8 mb-4 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold text-[var(--foreground)] mt-6 mb-3">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
                strong: ({ children }) => <strong className="font-bold text-[var(--accent)]">{children}</strong>,
                em: ({ children }) => <em className="italic text-[var(--foreground-muted)]">{children}</em>,
              }}
            >
              {review.content}
            </ReactMarkdown>
          </div>
        </div>

        {review.images?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4">Screenshots</h3>
            <ImageGallery images={review.images} />
          </div>
        )}
      </main>
    </div>
  );
}
