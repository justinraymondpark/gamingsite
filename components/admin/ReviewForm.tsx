'use client';

import { useState, useEffect } from 'react';
import { firestoreHelpers, type Game } from '@/lib/firebase';

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 
  'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile'
];

export default function ReviewForm() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(7);
  const [platformsPlayed, setPlatformsPlayed] = useState<string[]>([]);
  const [playtimeHours, setPlaytimeHours] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const data = await firestoreHelpers.getGames();
    setGames(data);
  };

  const handlePlatformToggle = (platform: string) => {
    setPlatformsPlayed(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleProsChange = (index: number, value: string) => {
    const newPros = [...pros];
    newPros[index] = value;
    setPros(newPros);
  };

  const handleConsChange = (index: number, value: string) => {
    const newCons = [...cons];
    newCons[index] = value;
    setCons(newCons);
  };

  const addProField = () => setPros([...pros, '']);
  const addConField = () => setCons([...cons, '']);
  
  const removeProField = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };
  
  const removeConField = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    try {
      await firestoreHelpers.addReview({
        game_id: selectedGameId,
        title: title.trim(),
        content: content.trim(),
        rating,
        platforms_played: platformsPlayed,
        playtime_hours: playtimeHours ? parseFloat(playtimeHours) : null,
        pros: pros.filter(p => p.trim()),
        cons: cons.filter(c => c.trim()),
        images: [],
        cover_image: null,
      });

      // Reset form
      setTitle('');
      setContent('');
      setRating(7);
      setPlatformsPlayed([]);
      setPlaytimeHours('');
      setPros(['']);
      setCons(['']);
      setSelectedGameId(null);
      setSuccessMessage('Review published successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Write a Review
        </h2>
        <p className="text-[var(--foreground-muted)] mb-6">
          Share your in-depth thoughts on a game. Supports Markdown formatting.
        </p>

        {successMessage && (
          <div className="mb-4 p-3 bg-[var(--accent)] bg-opacity-20 border border-[var(--accent)] rounded text-[var(--accent)]">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Select Game *
            </label>
            <select
              value={selectedGameId || ''}
              onChange={(e) => setSelectedGameId(e.target.value || null)}
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
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A masterpiece of storytelling"
              required
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Rating: {rating}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full h-2 bg-[var(--surface-light)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Platform(s) Played
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handlePlatformToggle(platform)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    platformsPlayed.includes(platform)
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--surface-light)] text-[var(--foreground)] hover:bg-[var(--border)]'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Playtime */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Playtime (hours) - Optional
            </label>
            <input
              type="number"
              step="0.5"
              value={playtimeHours}
              onChange={(e) => setPlaytimeHours(e.target.value)}
              placeholder="25.5"
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Pros */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Pros (Optional)
            </label>
            {pros.map((pro, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => handleProsChange(index, e.target.value)}
                  placeholder="Beautiful art direction"
                  className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                {pros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProField(index)}
                    className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addProField}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              + Add Pro
            </button>
          </div>

          {/* Cons */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Cons (Optional)
            </label>
            {cons.map((con, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => handleConsChange(index, e.target.value)}
                  placeholder="Performance issues on older hardware"
                  className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                {cons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeConField(index)}
                    className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addConField}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              + Add Con
            </button>
          </div>

          {/* Review Content */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Review Content * (Markdown supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="## First Impressions&#10;&#10;From the moment I started playing...&#10;&#10;## Gameplay&#10;&#10;The mechanics are..."
              required
              rows={12}
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-y font-mono text-sm"
            />
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Tip: Use ## for headings, **bold**, *italic*, - for lists
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedGameId || !title.trim() || !content.trim()}
            className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
