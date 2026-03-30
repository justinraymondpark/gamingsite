'use client';

import { useState, useEffect } from 'react';
import { searchGames, type RAWGGame } from '@/lib/rawg';
import { searchMusic, type MBSearchResult } from '@/lib/musicbrainz';
import { searchMovies, searchTV, getMovieDetails, getTVDetails, getGenreNames, type TMDBSearchResult } from '@/lib/tmdb';
import { firestoreHelpers, type Game, type MediaType } from '@/lib/firebase';
import ImageUpload from './ImageUpload';
import ManualGameForm from './ManualGameForm';

type ContentType = 'note' | 'review' | null;

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S',
  'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile'
];

const MEDIA_TYPE_CONFIG: Record<MediaType, { label: string; icon: string; searchPlaceholder: string; color: string }> = {
  game: { label: 'Games', icon: '🎮', searchPlaceholder: 'Search for a game...', color: 'var(--accent)' },
  music: { label: 'Music', icon: '🎵', searchPlaceholder: 'Search for an album or artist...', color: '#a855f7' },
  movie: { label: 'Movies', icon: '🎬', searchPlaceholder: 'Search for a movie...', color: '#ef4444' },
  tv: { label: 'TV Shows', icon: '📺', searchPlaceholder: 'Search for a TV show...', color: '#3b82f6' },
};

export default function CreateContent() {
  // Media type selection
  const [mediaType, setMediaType] = useState<MediaType | null>(null);

  // Game search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentGames, setRecentGames] = useState<Game[]>([]);

  // Selected game & content type
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [contentType, setContentType] = useState<ContentType>(null);
  const [existingNotes, setExistingNotes] = useState<Array<{ id: number; content: string; created_at: string; game: Game | null }>>([]);
  const [existingReviews, setExistingReviews] = useState<Array<{ id: number; title: string; rating: number; created_at: string; game: Game | null }>>([]);

  // Quick note form
  const [noteContent, setNoteContent] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteCoverImage, setNoteCoverImage] = useState<string | null>(null);

  // Review form
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState<number>(7);
  const [platformsPlayed, setPlatformsPlayed] = useState<string[]>([]);
  const [playtimeHours, setPlaytimeHours] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewCoverImage, setReviewCoverImage] = useState<string | null>(null);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load recent items when media type changes
  useEffect(() => {
    if (mediaType) {
      loadRecentGames();
    }
  }, [mediaType]);

  // Live search as you type (debounced)
  useEffect(() => {
    if (!mediaType || searchQuery.trim().length < 2) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      let results: any[] = [];
      if (mediaType === 'game') {
        results = (await searchGames(searchQuery)).slice(0, 5);
      } else if (mediaType === 'music') {
        results = (await searchMusic(searchQuery)).slice(0, 5);
      } else if (mediaType === 'movie') {
        results = (await searchMovies(searchQuery)).slice(0, 5);
      } else if (mediaType === 'tv') {
        results = (await searchTV(searchQuery)).slice(0, 5);
      }
      setLiveResults(results);
      setShowDropdown(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mediaType]);

  const loadRecentGames = async () => {
    const allGames = await firestoreHelpers.getGames(mediaType || undefined);
    setRecentGames(allGames.slice(0, 10));
  };

  const loadExistingContent = async (gameId: string) => {
    const notes = await firestoreHelpers.getQuickNotesByGameId(gameId);
    const reviews = await firestoreHelpers.getReviewsByGameId(gameId);
    setExistingNotes(notes.map(n => ({ ...n, game: null })) as any);
    setExistingReviews(reviews.map(r => ({ id: r.id, title: r.title, rating: r.rating, created_at: r.created_at.toString(), game: null })) as any);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mediaType) return;

    setIsSearching(true);
    let results: any[] = [];
    if (mediaType === 'game') {
      results = await searchGames(searchQuery);
    } else if (mediaType === 'music') {
      results = await searchMusic(searchQuery);
    } else if (mediaType === 'movie') {
      results = await searchMovies(searchQuery);
    } else if (mediaType === 'tv') {
      results = await searchTV(searchQuery);
    }
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectGame = async (rawgGame: RAWGGame) => {
    const existingGame = await firestoreHelpers.getGameByRawgId(rawgGame.id);
    let selectedGameData: Game;
    if (existingGame) {
      selectedGameData = existingGame;
    } else {
      try {
        selectedGameData = await firestoreHelpers.addGame({
          media_type: 'game',
          rawg_id: rawgGame.id,
          name: rawgGame.name,
          background_image: rawgGame.background_image,
          released: rawgGame.released,
          genres: rawgGame.genres.map(g => g.name),
          platforms: rawgGame.platforms.map(p => p.platform.name),
        });
      } catch (error) {
        alert('Failed to add game');
        return;
      }
    }
    finishSelection(selectedGameData);
  };

  const handleSelectMusic = async (result: MBSearchResult) => {
    const existing = await firestoreHelpers.getByMusicBrainzId(result.releaseGroupId);
    let selectedItem: Game;
    if (existing) {
      selectedItem = existing;
    } else {
      try {
        selectedItem = await firestoreHelpers.addGame({
          media_type: 'music',
          musicbrainz_id: result.releaseGroupId,
          name: `${result.title}`,
          artist: result.artist,
          background_image: result.coverArtUrl || '',
          released: result.releaseDate,
          genres: result.genres,
        });
      } catch (error) {
        alert('Failed to add album');
        return;
      }
    }
    finishSelection(selectedItem);
  };

  const handleSelectTMDB = async (result: TMDBSearchResult) => {
    const existing = await firestoreHelpers.getByTmdbId(result.id);
    let selectedItem: Game;
    if (existing) {
      selectedItem = existing;
    } else {
      try {
        const mt = result.type;
        let genres: string[] = [];
        let director = '';
        let cast: string[] = [];
        let runtime: number | undefined;
        let seasons: number | undefined;

        if (mt === 'movie') {
          const details = await getMovieDetails(result.id);
          if (details) {
            genres = details.genres;
            director = details.director;
            cast = details.cast;
            runtime = details.runtime || undefined;
          }
        } else {
          const details = await getTVDetails(result.id);
          if (details) {
            genres = details.genres;
            cast = details.cast;
            seasons = details.seasons || undefined;
          }
        }

        selectedItem = await firestoreHelpers.addGame({
          media_type: mt,
          tmdb_id: result.id,
          name: result.title,
          background_image: result.backdropUrl || result.posterUrl || '',
          released: result.releaseDate,
          genres,
          director: director || undefined,
          cast: cast.length > 0 ? cast : undefined,
          runtime,
          seasons,
        });
      } catch (error) {
        alert('Failed to add');
        return;
      }
    }
    finishSelection(selectedItem);
  };

  const handleSelectLiveResult = (result: any) => {
    if (!mediaType) return;
    if (mediaType === 'game') handleSelectGame(result);
    else if (mediaType === 'music') handleSelectMusic(result);
    else handleSelectTMDB(result);
  };

  const finishSelection = async (item: Game) => {
    setSelectedGame(item);
    await loadExistingContent(item.id);
    setSearchResults([]);
    setLiveResults([]);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleSelectRecentGame = async (game: Game) => {
    setSelectedGame(game);
    await loadExistingContent(game.id);
  };

  const resetForm = () => {
    setSelectedGame(null);
    setContentType(null);
    setExistingNotes([]);
    setExistingReviews([]);
    setNoteContent('');
    setNoteImages([]);
    setNoteCoverImage(null);
    setReviewTitle('');
    setReviewContent('');
    setRating(7);
    setPlatformsPlayed([]);
    setPlaytimeHours('');
    setPros(['']);
    setCons(['']);
    setReviewImages([]);
    setReviewCoverImage(null);
    setShowManualAdd(false);
  };

  const resetAll = () => {
    resetForm();
    setMediaType(null);
    setSearchQuery('');
    setSearchResults([]);
    setLiveResults([]);
    setRecentGames([]);
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !noteContent.trim() || !mediaType) return;

    setIsSubmitting(true);
    try {
      await firestoreHelpers.addQuickNote({
        game_id: selectedGame.id,
        media_type: mediaType,
        content: noteContent.trim(),
        images: noteImages,
        cover_image: noteCoverImage ?? null,
      });

      setSuccessMessage('Quick note posted!');
      setTimeout(() => {
        setSuccessMessage('');
        resetForm();
        loadRecentGames();
      }, 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !reviewTitle.trim() || !reviewContent.trim() || !mediaType) return;

    setIsSubmitting(true);
    try {
      await firestoreHelpers.addReview({
        game_id: selectedGame.id,
        media_type: mediaType,
        title: reviewTitle.trim(),
        content: reviewContent.trim(),
        rating,
        platforms_played: platformsPlayed,
        playtime_hours: playtimeHours ? parseFloat(playtimeHours) : null,
        pros: pros.filter(p => p.trim()),
        cons: cons.filter(c => c.trim()),
        images: reviewImages,
        cover_image: reviewCoverImage ?? null,
      });
    } catch (error) {
      alert('Failed to save review');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    setSuccessMessage('Review published!');
    setTimeout(() => {
      setSuccessMessage('');
      resetForm();
      loadRecentGames();
    }, 2000);
  };

  const handlePlatformToggle = (platform: string) => {
    setPlatformsPlayed(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  // Render a live search result item based on media type
  const renderLiveResult = (result: any, index: number) => {
    if (!mediaType) return null;

    if (mediaType === 'game') {
      const game = result as RAWGGame;
      return (
        <button
          key={game.id}
          type="button"
          onClick={() => handleSelectLiveResult(result)}
          className="w-full flex gap-3 p-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
        >
          {game.background_image && (
            <img src={game.background_image} alt={game.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{game.name}</h4>
            <p className="text-xs text-[var(--foreground-muted)]">
              {game.released ? new Date(game.released).getFullYear() : 'TBA'}
            </p>
          </div>
        </button>
      );
    }

    if (mediaType === 'music') {
      const mb = result as MBSearchResult;
      return (
        <button
          key={mb.releaseGroupId}
          type="button"
          onClick={() => handleSelectLiveResult(result)}
          className="w-full flex gap-3 p-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
        >
          <div className="w-12 h-12 rounded bg-[var(--surface-light)] flex items-center justify-center flex-shrink-0 text-lg">
            🎵
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{mb.title}</h4>
            <p className="text-xs text-[var(--foreground-muted)] truncate">{mb.artist} · {mb.type}</p>
          </div>
        </button>
      );
    }

    // Movie / TV
    const tmdb = result as TMDBSearchResult;
    return (
      <button
        key={tmdb.id}
        type="button"
        onClick={() => handleSelectLiveResult(result)}
        className="w-full flex gap-3 p-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
      >
        {tmdb.posterUrl ? (
          <img src={tmdb.posterUrl} alt={tmdb.title} className="w-12 h-16 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-16 rounded bg-[var(--surface-light)] flex items-center justify-center flex-shrink-0 text-lg">
            {mediaType === 'movie' ? '🎬' : '📺'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--foreground)] truncate">{tmdb.title}</h4>
          <p className="text-xs text-[var(--foreground-muted)]">
            {tmdb.releaseDate ? new Date(tmdb.releaseDate).getFullYear() : 'TBA'}
          </p>
        </div>
      </button>
    );
  };

  // Render search result card based on media type
  const renderSearchResult = (result: any) => {
    if (!mediaType) return null;

    if (mediaType === 'game') {
      const game = result as RAWGGame;
      return (
        <button
          key={game.id}
          onClick={() => handleSelectLiveResult(result)}
          className="bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all text-left"
        >
          <div className="flex gap-4 p-4">
            {game.background_image && (
              <img src={game.background_image} alt={game.name} className="w-24 h-24 rounded object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 truncate">{game.name}</h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-2">
                {game.released ? new Date(game.released).getFullYear() : 'TBA'}
              </p>
              <div className="flex flex-wrap gap-1">
                {game.genres.slice(0, 3).map((genre) => (
                  <span key={genre.id} className="px-2 py-1 text-xs bg-[var(--surface-light)] text-[var(--foreground)] rounded">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      );
    }

    if (mediaType === 'music') {
      const mb = result as MBSearchResult;
      return (
        <button
          key={mb.releaseGroupId}
          onClick={() => handleSelectLiveResult(result)}
          className="bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[#a855f7] transition-all text-left"
        >
          <div className="flex gap-4 p-4">
            <div className="w-24 h-24 rounded bg-[var(--surface-light)] flex items-center justify-center flex-shrink-0 text-3xl">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 truncate">{mb.title}</h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-1">{mb.artist}</p>
              <p className="text-xs text-[var(--foreground-muted)] mb-2">
                {mb.type} · {mb.releaseDate ? new Date(mb.releaseDate).getFullYear() : 'TBA'}
              </p>
            </div>
          </div>
        </button>
      );
    }

    const tmdb = result as TMDBSearchResult;
    return (
      <button
        key={tmdb.id}
        onClick={() => handleSelectLiveResult(result)}
        className="bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all text-left"
      >
        <div className="flex gap-4 p-4">
          {tmdb.posterUrl ? (
            <img src={tmdb.posterUrl} alt={tmdb.title} className="w-20 h-28 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-28 rounded bg-[var(--surface-light)] flex items-center justify-center flex-shrink-0 text-3xl">
              {mediaType === 'movie' ? '🎬' : '📺'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1 truncate">{tmdb.title}</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-2">
              {tmdb.releaseDate ? new Date(tmdb.releaseDate).getFullYear() : 'TBA'}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">{tmdb.overview}</p>
          </div>
        </div>
      </button>
    );
  };

  const config = mediaType ? MEDIA_TYPE_CONFIG[mediaType] : null;

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 bg-[var(--accent)] bg-opacity-20 border border-[var(--accent)] rounded-lg text-[var(--accent)] text-center font-semibold">
          {successMessage}
        </div>
      )}

      {/* Step 0: Choose media type */}
      {!mediaType && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            What are you logging?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(MEDIA_TYPE_CONFIG) as [MediaType, typeof MEDIA_TYPE_CONFIG[MediaType]][]).map(([type, cfg]) => (
              <button
                key={type}
                onClick={() => setMediaType(type)}
                className="p-6 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all text-center group"
              >
                <div className="text-4xl mb-3">{cfg.icon}</div>
                <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {cfg.label}
                </h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Search for item */}
      {mediaType && !selectedGame && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {config?.icon} Find {mediaType === 'music' ? 'an Album' : mediaType === 'tv' ? 'a TV Show' : `a ${config?.label.slice(0, -1)}`}
            </h2>
            <button
              onClick={resetAll}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Change type
            </button>
          </div>
          <p className="text-[var(--foreground-muted)] mb-6">
            Search {mediaType === 'game' ? 'RAWG' : mediaType === 'music' ? 'MusicBrainz' : 'TMDB'} to find what you want to write about
          </p>

          <div className="relative mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => liveResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder={config?.searchPlaceholder}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                />

                {/* Live Search Dropdown */}
                {showDropdown && liveResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--accent)] rounded-lg shadow-lg z-10 overflow-hidden">
                    {liveResults.map((result, i) => renderLiveResult(result, i))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Recent Items Bubbles */}
          {recentGames.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">
                {config?.icon} Recent {config?.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectRecentGame(game)}
                    className="group relative px-4 py-2 bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] border border-[var(--border)] hover:border-[var(--accent)] rounded-full text-sm font-medium text-[var(--foreground)] transition-all"
                  >
                    {game.artist ? `${game.artist} - ${game.name}` : game.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((result) => renderSearchResult(result))}
            </div>
          )}

          {/* Manual Game Add (game only) */}
          {mediaType === 'game' && (
            <>
              {!showManualAdd ? (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(true)}
                    className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    Can't find it? <span className="underline">Add manually</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <ManualGameForm
                    onGameAdded={(game) => {
                      finishSelection(game);
                      setShowManualAdd(false);
                    }}
                    onCancel={() => setShowManualAdd(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2: Choose content type */}
      {selectedGame && !contentType && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-6">
            {selectedGame.background_image && (
              <img
                src={selectedGame.background_image}
                alt={selectedGame.name}
                className="w-20 h-20 rounded object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {selectedGame.artist ? `${selectedGame.artist} - ` : ''}{selectedGame.name}
              </h2>
              {selectedGame.director && (
                <p className="text-sm text-[var(--foreground-muted)]">Directed by {selectedGame.director}</p>
              )}
              <button
                onClick={resetForm}
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ← Choose different {mediaType || 'item'}
              </button>
            </div>
          </div>

          {/* Existing Content Section */}
          {(existingNotes.length > 0 || existingReviews.length > 0) && (
            <div className="mb-6 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">
                Your Existing Content
              </h3>
              <div className="space-y-3">
                {existingNotes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                      Quick Notes ({existingNotes.length})
                    </p>
                    <div className="space-y-2">
                      {existingNotes.map((note) => (
                        <div key={note.id} className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--foreground)] line-clamp-2">{note.content}</p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                          </div>
                          <a href={`/admin?tab=manage&edit=note-${note.id}`} className="px-3 py-1 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded text-xs font-bold hover:bg-opacity-100 transition-colors whitespace-nowrap shadow-sm">
                            Edit
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {existingReviews.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                      Reviews ({existingReviews.length})
                    </p>
                    <div className="space-y-2">
                      {existingReviews.map((review) => (
                        <div key={review.id} className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{review.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-[var(--accent)] text-[var(--accent-text)] rounded font-bold">{review.rating}/10</span>
                              <span className="text-xs text-[var(--foreground-muted)]">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <a href={`/admin?tab=manage&edit=review-${review.id}`} className="px-3 py-1 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded text-xs font-bold hover:bg-opacity-100 transition-colors whitespace-nowrap shadow-sm">
                            Edit
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-[var(--foreground-muted)] mb-4">What would you like to create?</p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setContentType('note')}
              className="p-6 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all text-left group"
            >
              <div className="text-3xl mb-2">💭</div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                Quick Note
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">Share a quick thought</p>
            </button>

            <button
              onClick={() => setContentType('review')}
              className="p-6 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all text-left group"
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                Full Review
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">Write an in-depth review with ratings</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Quick Note Form */}
      {selectedGame && contentType === 'note' && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-6">
            {selectedGame.background_image && (
              <img src={selectedGame.background_image} alt={selectedGame.name} className="w-16 h-16 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Quick Note: {selectedGame.artist ? `${selectedGame.artist} - ` : ''}{selectedGame.name}
              </h3>
            </div>
            <button onClick={() => setContentType(null)} className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitNote} className="space-y-4">
            <div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={mediaType === 'music' ? 'This album hits different...' : mediaType === 'movie' ? 'Just watched this and...' : 'Just beat the first boss and...'}
                required
                rows={4}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <ImageUpload
              images={noteImages}
              onImagesChange={setNoteImages}
              maxImages={5}
              coverImage={noteCoverImage || undefined}
              onCoverImageChange={setNoteCoverImage}
            />

            <button
              type="submit"
              disabled={isSubmitting || !noteContent.trim()}
              className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post Quick Note'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Review Form */}
      {selectedGame && contentType === 'review' && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-6">
            {selectedGame.background_image && (
              <img src={selectedGame.background_image} alt={selectedGame.name} className="w-16 h-16 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Review: {selectedGame.artist ? `${selectedGame.artist} - ` : ''}{selectedGame.name}
              </h3>
            </div>
            <button onClick={() => setContentType(null)} className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Review Title *</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder={mediaType === 'music' ? 'A genre-defining masterpiece' : 'A masterpiece of storytelling'}
                required
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Rating: {rating}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full h-2 bg-[var(--surface-light)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>

            {/* Platform selection - games only */}
            {mediaType === 'game' && (
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Platform(s) Played</label>
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
            )}

            {/* Playtime - games only */}
            {mediaType === 'game' && (
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Playtime (hours) - Optional</label>
                <input
                  type="number"
                  step="0.5"
                  value={playtimeHours}
                  onChange={(e) => setPlaytimeHours(e.target.value)}
                  placeholder="25.5"
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Pros (Optional)</label>
              {pros.map((pro, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => { const newPros = [...pros]; newPros[index] = e.target.value; setPros(newPros); }}
                    placeholder={mediaType === 'music' ? 'Amazing production' : 'Beautiful art direction'}
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {pros.length > 1 && (
                    <button type="button" onClick={() => setPros(pros.filter((_, i) => i !== index))} className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setPros([...pros, ''])} className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
                + Add Pro
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Cons (Optional)</label>
              {cons.map((con, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => { const newCons = [...cons]; newCons[index] = e.target.value; setCons(newCons); }}
                    placeholder={mediaType === 'music' ? 'Too short' : 'Performance issues'}
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {cons.length > 1 && (
                    <button type="button" onClick={() => setCons(cons.filter((_, i) => i !== index))} className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setCons([...cons, ''])} className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
                + Add Con
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Review Content * (Markdown supported)</label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="## First Impressions&#10;&#10;From the moment I started..."
                required
                rows={12}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-y font-mono text-sm"
              />
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                Tip: Use ## for headings, **bold**, *italic*, - for lists
              </p>
            </div>

            <ImageUpload
              images={reviewImages}
              onImagesChange={setReviewImages}
              maxImages={10}
              coverImage={reviewCoverImage || undefined}
              onCoverImageChange={setReviewCoverImage}
            />

            <button
              type="submit"
              disabled={isSubmitting || !reviewTitle.trim() || !reviewContent.trim()}
              className="w-full px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Review'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
