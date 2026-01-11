'use client';

import { useState } from 'react';
import { searchGames, type RAWGGame } from '@/lib/rawg';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function GameSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedGames, setAddedGames] = useState<Set<number>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddGame = async (game: RAWGGame) => {
    try {
      const gameId = String(game.id);
      const gameRef = doc(db, 'games', gameId);
      const gameSnap = await getDoc(gameRef);

      if (gameSnap.exists()) {
        // Already exists
        setAddedGames(prev => new Set(prev).add(game.id));
        setTimeout(() => {
          setAddedGames(prev => {
            const next = new Set(prev);
            next.delete(game.id);
            return next;
          });
        }, 2000);
        return;
      }

      await setDoc(gameRef, {
        rawg_id: game.id,
        name: game.name,
        background_image: game.background_image,
        released: game.released,
        genres: game.genres.map(g => g.name),
        platforms: game.platforms.map(p => p.platform.name),
        created_at: new Date().toISOString(),
      });

      setAddedGames(prev => new Set(prev).add(game.id));
      setTimeout(() => {
        setAddedGames(prev => {
          const next = new Set(prev);
          next.delete(game.id);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Search & Add Games
        </h2>
        <p className="text-[var(--foreground-muted)] mb-6">
          Search for games from the RAWG database to add to your collection.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a game..."
            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {searchResults.map((game) => (
            <div
              key={game.id}
              className="bg-[var(--surface)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
            >
              <div className="flex gap-4 p-4">
                {game.background_image && (
                  <img
                    src={game.background_image}
                    alt={game.name}
                    className="w-24 h-24 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 truncate">
                    {game.name}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-2">
                    {game.released ? new Date(game.released).getFullYear() : 'TBA'}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {game.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2 py-1 text-xs bg-[var(--surface-light)] text-[var(--foreground)] rounded"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddGame(game)}
                    disabled={addedGames.has(game.id)}
                    className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addedGames.has(game.id) ? '✓ Added' : 'Add Game'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
