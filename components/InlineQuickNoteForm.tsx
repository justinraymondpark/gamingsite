'use client';

import { useState, useEffect } from 'react';
import { firestoreHelpers, type Game, type QuickNote } from '@/lib/firebase';

type Props = {
  onNoteCreated: (note: QuickNote) => void;
};

export default function InlineQuickNoteForm({ onNoteCreated }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    firestoreHelpers.getGames().then(setGames);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const note = await firestoreHelpers.addQuickNote({
        game_id: selectedGameId,
        content: content.trim(),
        images: [],
        cover_image: null,
      });
      const game = games.find(g => g.id === selectedGameId) || null;
      onNoteCreated({ ...note, game: game ?? undefined });
      setContent('');
      setSelectedGameId('');
    } catch (error) {
      console.error('Failed to post note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--accent-dim)] mb-6 space-y-3"
    >
      <div className="flex gap-3">
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="flex-shrink-0 w-48 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">Select game...</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 280))}
          placeholder="Quick thought..."
          rows={2}
          className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${content.length > 252 ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>
          {content.length}/280
        </span>
        <button
          type="submit"
          disabled={isSubmitting || !selectedGameId || !content.trim()}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Note'}
        </button>
      </div>
    </form>
  );
}
