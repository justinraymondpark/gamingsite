'use client';

import { useState } from 'react';
import { firestoreHelpers, type Game } from '@/lib/firebase';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
  'Puzzle', 'Platformer', 'Shooter', 'Sports', 'Racing',
  'Horror', 'Fighting', 'Indie', 'MMO', 'Visual Novel',
];

const PLATFORM_OPTIONS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S',
  'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile',
];

type Props = {
  onGameAdded: (game: Game) => void;
  onCancel: () => void;
};

export default function ManualGameForm({ onGameAdded, onCancel }: Props) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [released, setReleased] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const game = await firestoreHelpers.addGame({
        rawg_id: 0,
        name: name.trim(),
        background_image: imageUrl.trim(),
        released: released || '',
        genres,
        platforms,
      });
      onGameAdded(game);
    } catch (error) {
      console.error('Failed to add game:', error);
      alert('Failed to add game');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--background)] rounded-lg p-5 border border-[var(--accent-dim)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--foreground)]">Add Game Manually</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
            Game Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter game name"
            required
            className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
            Release Date (optional)
          </label>
          <input
            type="date"
            value={released}
            onChange={(e) => setReleased(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleChip(genre, genres, setGenres)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  genres.includes(genre)
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
            Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => toggleChip(platform, platforms, setPlatforms)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  platforms.includes(platform)
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)]'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full px-4 py-2.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Game'}
        </button>
      </form>
    </div>
  );
}
