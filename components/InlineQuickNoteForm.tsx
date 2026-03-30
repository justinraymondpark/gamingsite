'use client';

import { useState, useEffect } from 'react';
import { firestoreHelpers, type Game, type QuickNote, type MediaType } from '@/lib/firebase';
import { searchGames, type RAWGGame } from '@/lib/rawg';
import { searchMusic, type MBSearchResult } from '@/lib/musicbrainz';
import { searchMovies, searchTV, type TMDBSearchResult } from '@/lib/tmdb';

type Props = {
  onNoteCreated: (note: QuickNote) => void;
};

const MEDIA_TYPES: { key: MediaType; icon: string; label: string }[] = [
  { key: 'game', icon: '🎮', label: 'Game' },
  { key: 'music', icon: '🎵', label: 'Music' },
  { key: 'movie', icon: '🎬', label: 'Movie' },
  { key: 'tv', icon: '📺', label: 'TV' },
];

export default function InlineQuickNoteForm({ onNoteCreated }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>('game');
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    firestoreHelpers.getGames(mediaType).then(games => setRecentGames(games.slice(0, 8)));
    setSelectedGame(null);
    setSearchQuery('');
  }, [mediaType]);

  // Live search as you type
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      let results: any[] = [];
      if (mediaType === 'game') results = (await searchGames(searchQuery)).slice(0, 5);
      else if (mediaType === 'music') results = (await searchMusic(searchQuery)).slice(0, 5);
      else if (mediaType === 'movie') results = (await searchMovies(searchQuery)).slice(0, 5);
      else if (mediaType === 'tv') results = (await searchTV(searchQuery)).slice(0, 5);
      setLiveResults(results);
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, mediaType]);

  const handleSelectResult = async (result: any) => {
    let item: Game | null = null;

    if (mediaType === 'game') {
      const rawg = result as RAWGGame;
      const existing = await firestoreHelpers.getGameByRawgId(rawg.id);
      if (existing) {
        item = existing;
      } else {
        item = await firestoreHelpers.addGame({
          media_type: 'game',
          rawg_id: rawg.id,
          name: rawg.name,
          background_image: rawg.background_image,
          released: rawg.released,
          genres: rawg.genres.map(g => g.name),
          platforms: rawg.platforms.map(p => p.platform.name),
        });
      }
    } else if (mediaType === 'music') {
      const mb = result as MBSearchResult;
      const existing = await firestoreHelpers.getByMusicBrainzId(mb.releaseGroupId);
      if (existing) {
        item = existing;
      } else {
        item = await firestoreHelpers.addGame({
          media_type: 'music',
          musicbrainz_id: mb.releaseGroupId,
          name: mb.title,
          artist: mb.artist,
          background_image: mb.coverArtUrl || '',
          released: mb.releaseDate,
          genres: mb.genres,
        });
      }
    } else {
      const tmdb = result as TMDBSearchResult;
      const existing = await firestoreHelpers.getByTmdbId(tmdb.id);
      if (existing) {
        item = existing;
      } else {
        item = await firestoreHelpers.addGame({
          media_type: tmdb.type,
          tmdb_id: tmdb.id,
          name: tmdb.title,
          background_image: tmdb.backdropUrl || tmdb.posterUrl || '',
          released: tmdb.releaseDate,
          genres: [],
        });
      }
    }

    if (item) {
      setSelectedGame(item);
      setSearchQuery('');
      setLiveResults([]);
      setShowDropdown(false);
    }
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
        media_type: mediaType,
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

  const renderResultLabel = (result: any): string => {
    if (mediaType === 'game') return (result as RAWGGame).name;
    if (mediaType === 'music') {
      const mb = result as MBSearchResult;
      return `${mb.artist} - ${mb.title}`;
    }
    return (result as TMDBSearchResult).title;
  };

  const renderResultSub = (result: any): string => {
    if (mediaType === 'game') {
      const g = result as RAWGGame;
      return g.released ? new Date(g.released).getFullYear().toString() : 'TBA';
    }
    if (mediaType === 'music') {
      const mb = result as MBSearchResult;
      return `${mb.type} · ${mb.releaseDate ? new Date(mb.releaseDate).getFullYear() : 'TBA'}`;
    }
    const tmdb = result as TMDBSearchResult;
    return tmdb.releaseDate ? new Date(tmdb.releaseDate).getFullYear().toString() : 'TBA';
  };

  const getResultKey = (result: any): string => {
    if (mediaType === 'game') return `game-${(result as RAWGGame).id}`;
    if (mediaType === 'music') return `mb-${(result as MBSearchResult).releaseGroupId}`;
    return `tmdb-${(result as TMDBSearchResult).id}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--accent-dim)] mb-6 space-y-3"
    >
      {/* Media type pills */}
      <div className="flex gap-1.5">
        {MEDIA_TYPES.map((mt) => (
          <button
            key={mt.key}
            type="button"
            onClick={() => setMediaType(mt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              mediaType === mt.key
                ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            {mt.icon} {mt.label}
          </button>
        ))}
      </div>

      {/* Item selection */}
      {!selectedGame ? (
        <div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => liveResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={`Search for ${mediaType === 'music' ? 'an album' : mediaType === 'tv' ? 'a TV show' : `a ${mediaType}`}...`}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            {showDropdown && liveResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--accent)] rounded-lg shadow-lg z-10 overflow-hidden">
                {liveResults.map((result) => (
                  <button
                    key={getResultKey(result)}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex gap-3 p-2.5 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{renderResultLabel(result)}</h4>
                      <p className="text-xs text-[var(--foreground-muted)]">{renderResultSub(result)}</p>
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
                  {game.artist ? `${game.artist} - ${game.name}` : game.name}
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
          <span className="text-sm font-semibold text-[var(--foreground)] flex-1">
            {selectedGame.artist ? `${selectedGame.artist} - ` : ''}{selectedGame.name}
          </span>
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
        onChange={(e) => setContent(e.target.value)}
        placeholder={selectedGame ? "Quick thought..." : "Select something first..."}
        disabled={!selectedGame}
        rows={2}
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
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
