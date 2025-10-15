'use client';

import { useState, useEffect } from 'react';
import { supabase, type Game } from '@/lib/supabase';

export default function QuickNoteForm() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setGames(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('quick_notes')
      .insert({
        game_id: selectedGameId,
        content: content.trim(),
      });

    setIsSubmitting(false);

    if (error) {
      alert('Failed to save note');
      return;
    }

    setContent('');
    setSelectedGameId(null);
    setSuccessMessage('Note added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const characterCount = content.length;
  const maxChars = 280;

  return (
    <div className="max-w-2xl">
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Quick Gaming Note
        </h2>
        <p className="text-[var(--foreground-muted)] mb-6">
          Share a quick thought about a game you're playing (max 280 characters).
        </p>

        {successMessage && (
          <div className="mb-4 p-3 bg-[var(--accent)] bg-opacity-20 border border-[var(--accent)] rounded text-[var(--accent)]">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Select Game
            </label>
            <select
              value={selectedGameId || ''}
              onChange={(e) => setSelectedGameId(Number(e.target.value))}
              required
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">Choose a game...</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
            {games.length === 0 && (
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                No games added yet. Add some games first!
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Your Thought
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              placeholder="Just beat the first boss and..."
              required
              rows={4}
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="mt-2 text-right">
              <span className={`text-sm ${characterCount > maxChars * 0.9 ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>
                {characterCount}/{maxChars}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedGameId || !content.trim()}
            className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
