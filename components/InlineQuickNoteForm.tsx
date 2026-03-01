'use client';

import { useState, useEffect } from 'react';
import { firestoreHelpers, type Game, type QuickNote } from '@/lib/firebase';
import { searchGames, type RAWGGame } from '@/lib/rawg';

type Props = {
  onNoteCreated: (note: QuickNote) => void;
};

export default function InlineQuickNoteForm({ onNoteCreated }: Props) {
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveResults, setLiveResults] = useState<RAWGGame[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    firestoreHelpers.getGames().then(games => setRecentGames(games.slice(0, 8)));
  }, []);

  // Live RAWG search as you type
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchGames(searchQuery);
      setLiveResults(results.slice(0, 5));
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectRawgGame = async (rawgGame: RAWGGame) => {
    // Check if already in DB, otherwise add it
    const existing = await firestoreHelpers.getGameByRawgId(rawgGame.id);
    if (existing) {
      setSelectedGame(existing);
    } else {
      const newGame = await firestoreHelpers.addGame({
        rawg_id: rawgGame.id,
        name: rawgGame.name,
        background_image: rawgGame.background_image,
        released: rawgGame.released,
        genres: rawgGame.genres.map(g => g.name),
        platforms: rawgGame.platforms.map(p => p.platform.name),
      });
      setSelectedGame(newGame);
    }
    setSearchQuery('');
    setLiveResults([]);
    setShowDropdown(false);
  };

  const handleSelectRecentGame = (game: Game) => {
    setSelectedGame(game);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const note = await firestoreHelpers.addQuickNote({
        game_id: selectedGame.id,
        content: content.trim(),
        images: [],
        cover_image: null,
      });
      onNoteCreated({ ...note, game: selectedGame });
      setContent('');
      setSelectedGame(null);
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
      {/* Game selection */}
      {!selectedGame ? (
        <div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => liveResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search for a game..."
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            {showDropdown && liveResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--accent)] rounded-lg shadow-lg z-10 overflow-hidden">
                {liveResults.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleSelectRawgGame(game)}
                    className="w-full flex gap-3 p-2.5 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
                  >
                    {game.background_image && (
                      <img src={game.background_image} alt={game.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{game.name}</h4>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {game.released ? new Date(game.released).getFullYear() : 'TBA'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {recentGames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {recentGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleSelectRecentGame(game)}
                  className="px-3 py-1 bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] border border-[var(--border)] hover:border-[var(--accent)] rounded-full text-xs font-medium text-[var(--foreground)] transition-all"
                >
                  {game.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {selectedGame.background_image && (
            <img src={selectedGame.background_image} alt={selectedGame.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-[var(--foreground)] flex-1">{selectedGame.name}</span>
          <button
            type="button"
            onClick={() => setSelectedGame(null)}
            className="text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Note content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 280))}
        placeholder={selectedGame ? "Quick thought..." : "Select a game first..."}
        disabled={!selectedGame}
        rows={2}
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${content.length > 252 ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>
          {content.length}/280
        </span>
        <button
          type="submit"
          disabled={isSubmitting || !selectedGame || !content.trim()}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Note'}
        </button>
      </div>
    </form>
  );
}
