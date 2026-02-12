'use client';

import { useState, useEffect } from 'react';
import { searchGames, type RAWGGame } from '@/lib/rawg';
import { firestoreHelpers, type Game } from '@/lib/firebase';
import ImageUpload from './ImageUpload';

type ContentType = 'note' | 'review' | null;

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 
  'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile'
];

export default function CreateContent() {
  // Game search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RAWGGame[]>([]);
  const [liveResults, setLiveResults] = useState<RAWGGame[]>([]);
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load recent games on mount
  useEffect(() => {
    loadRecentGames();
  }, []);

  // Live search as you type (debounced)
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

  const loadRecentGames = async () => {
    // Get recent games from database
    const allGames = await firestoreHelpers.getGames();
    setRecentGames(allGames.slice(0, 10));
  };

  const loadExistingContent = async (gameId: string) => {
    // Load existing notes for this game
    const notes = await firestoreHelpers.getQuickNotesByGameId(gameId);
    // Load existing reviews for this game
    const reviews = await firestoreHelpers.getReviewsByGameId(gameId);

    setExistingNotes(notes.map(n => ({ ...n, game: null })) as any);
    setExistingReviews(reviews.map(r => ({ id: r.id, title: r.title, rating: r.rating, created_at: r.created_at.toString(), game: null })) as any);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchGames(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectGame = async (rawgGame: RAWGGame) => {
    // First, add game to database if it doesn't exist
    const existingGame = await firestoreHelpers.getGameByRawgId(rawgGame.id);

    let selectedGameData: Game;
    if (existingGame) {
      selectedGameData = existingGame;
      setSelectedGame(existingGame);
    } else {
      try {
        const newGame = await firestoreHelpers.addGame({
          rawg_id: rawgGame.id,
          name: rawgGame.name,
          background_image: rawgGame.background_image,
          released: rawgGame.released,
          genres: rawgGame.genres.map(g => g.name),
          platforms: rawgGame.platforms.map(p => p.platform.name),
        });
        selectedGameData = newGame;
        setSelectedGame(newGame);
      } catch (error) {
        alert('Failed to add game');
        return;
      }
    }
    
    // Load existing content for this game
    await loadExistingContent(selectedGameData.id);
    
    // Clear search and show content type selection
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
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmitNote called', { selectedGame, noteContent: noteContent.trim() });
    if (!selectedGame || !noteContent.trim()) {
      console.log('Validation failed - selectedGame:', selectedGame, 'noteContent:', noteContent);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting note to Firebase...', { game_id: selectedGame.id, content: noteContent.trim() });
      await firestoreHelpers.addQuickNote({
        game_id: selectedGame.id,
        content: noteContent.trim(),
        images: noteImages,
        cover_image: noteCoverImage ?? null,
      });
      console.log('Note submitted successfully!');

      setSuccessMessage('Quick note posted! 🎉');
      setTimeout(() => {
        setSuccessMessage('');
        resetForm();
        loadRecentGames(); // Reload recent games
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
    if (!selectedGame || !reviewTitle.trim() || !reviewContent.trim()) return;

    setIsSubmitting(true);
    try {
      await firestoreHelpers.addReview({
        game_id: selectedGame.id,
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

    setSuccessMessage('Review published! 🎉');
    setTimeout(() => {
      setSuccessMessage('');
      resetForm();
      loadRecentGames(); // Reload recent games
    }, 2000);
  };

  // Helper functions for pros/cons
  const handlePlatformToggle = (platform: string) => {
    setPlatformsPlayed(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 bg-[var(--accent)] bg-opacity-20 border border-[var(--accent)] rounded-lg text-[var(--accent)] text-center font-semibold">
          {successMessage}
        </div>
      )}

      {/* Step 1: Search for game */}
      {!selectedGame && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Step 1: Find a Game
          </h2>
          <p className="text-[var(--foreground-muted)] mb-6">
            Search for the game you want to write about
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
                  placeholder="Start typing a game name..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                
                {/* Live Search Dropdown */}
                {showDropdown && liveResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--accent)] rounded-lg shadow-lg z-10 overflow-hidden">
                    {liveResults.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleSelectGame(game)}
                        className="w-full flex gap-3 p-3 hover:bg-[var(--background)] transition-colors text-left border-b border-[var(--border)] last:border-b-0"
                      >
                        {game.background_image && (
                          <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[var(--foreground)] truncate">
                            {game.name}
                          </h4>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {game.released ? new Date(game.released).getFullYear() : 'TBA'}
                          </p>
                        </div>
                      </button>
                    ))}
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

          {/* Recent Games Bubbles */}
          {recentGames.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">
                🎮 Recent Games
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectRecentGame(game)}
                    className="group relative px-4 py-2 bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] border border-[var(--border)] hover:border-[var(--accent)] rounded-full text-sm font-medium text-[var(--foreground)] transition-all"
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className="bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-all text-left"
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
                      <div className="flex flex-wrap gap-1">
                        {game.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre.id}
                            className="px-2 py-1 text-xs bg-[var(--surface-light)] text-[var(--foreground)] rounded"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
                {selectedGame.name}
              </h2>
              <button
                onClick={resetForm}
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
              >
                ← Choose different game
              </button>
            </div>
          </div>

          {/* Existing Content Section */}
          {(existingNotes.length > 0 || existingReviews.length > 0) && (
            <div className="mb-6 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3">
                📚 Your Existing Content
              </h3>
              
              <div className="space-y-3">
                {/* Existing Quick Notes */}
                {existingNotes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                      Quick Notes ({existingNotes.length})
                    </p>
                    <div className="space-y-2">
                      {existingNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--foreground)] line-clamp-2">
                              {note.content}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={`/admin?tab=manage&edit=note-${note.id}`}
                            className="px-3 py-1 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded text-xs font-bold hover:bg-opacity-100 transition-colors whitespace-nowrap shadow-sm"
                          >
                            ✏️ Edit
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Reviews */}
                {existingReviews.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                      Reviews ({existingReviews.length})
                    </p>
                    <div className="space-y-2">
                      {existingReviews.map((review) => (
                        <div
                          key={review.id}
                          className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                              {review.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-[var(--accent)] text-[var(--accent-text)] rounded font-bold">
                                {review.rating}/10
                              </span>
                              <span className="text-xs text-[var(--foreground-muted)]">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`/admin?tab=manage&edit=review-${review.id}`}
                            className="px-3 py-1 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded text-xs font-bold hover:bg-opacity-100 transition-colors whitespace-nowrap shadow-sm"
                          >
                            ✏️ Edit
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-[var(--foreground-muted)] mb-4">
            What would you like to create?
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setContentType('note')}
              className="p-6 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all text-left group"
            >
              <div className="text-3xl mb-2">💭</div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                Quick Note
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Share a quick thought (up to 280 characters)
              </p>
            </button>

            <button
              onClick={() => setContentType('review')}
              className="p-6 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-all text-left group"
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                Full Review
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Write an in-depth review with ratings and details
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Quick Note Form */}
      {selectedGame && contentType === 'note' && (
        <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-6">
            {selectedGame.background_image && (
              <img
                src={selectedGame.background_image}
                alt={selectedGame.name}
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Quick Note: {selectedGame.name}
              </h3>
            </div>
            <button
              onClick={() => setContentType(null)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitNote} className="space-y-4">
            <div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value.slice(0, 280))}
                placeholder="Just beat the first boss and..."
                required
                rows={4}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
              <div className="mt-2 text-right">
                <span className={`text-sm ${noteContent.length > 252 ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>
                  {noteContent.length}/280
                </span>
              </div>
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
              <img
                src={selectedGame.background_image}
                alt={selectedGame.name}
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Review: {selectedGame.name}
              </h3>
            </div>
            <button
              onClick={() => setContentType(null)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Review Title *
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="A masterpiece of storytelling"
                required
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Pros (Optional)
              </label>
              {pros.map((pro, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => {
                      const newPros = [...pros];
                      newPros[index] = e.target.value;
                      setPros(newPros);
                    }}
                    placeholder="Beautiful art direction"
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {pros.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPros(pros.filter((_, i) => i !== index))}
                      className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPros([...pros, ''])}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                + Add Pro
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Cons (Optional)
              </label>
              {cons.map((con, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => {
                      const newCons = [...cons];
                      newCons[index] = e.target.value;
                      setCons(newCons);
                    }}
                    placeholder="Performance issues"
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {cons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCons(cons.filter((_, i) => i !== index))}
                      className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCons([...cons, ''])}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                + Add Con
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Review Content * (Markdown supported)
              </label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="## First Impressions&#10;&#10;From the moment I started playing...&#10;&#10;## Gameplay&#10;&#10;The mechanics are..."
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
