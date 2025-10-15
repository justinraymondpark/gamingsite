'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ImageUpload from './ImageUpload';

type ContentItem = {
  id: number;
  game_id: number;
  created_at: string;
  game?: {
    id: number;
    name: string;
    background_image: string;
  };
  // Quick note fields
  content?: string;
  // Review fields
  title?: string;
  rating?: number;
  platforms_played?: string[];
  playtime_hours?: number;
  pros?: string[];
  cons?: string[];
  // Shared fields
  images?: string[];
  cover_image?: string;
};

type EditMode = {
  type: 'note' | 'review';
  id: number;
  data: ContentItem;
} | null;

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 
  'Xbox One', 'Nintendo Switch', 'Steam Deck', 'Mobile'
];

export default function ManageContent() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<EditMode>(null);
  
  // Edit form state
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCoverImage, setEditCoverImage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRating, setEditRating] = useState(7);
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editPlaytime, setEditPlaytime] = useState('');
  const [editPros, setEditPros] = useState<string[]>(['']);
  const [editCons, setEditCons] = useState<string[]>(['']);
  const [editReviewContent, setEditReviewContent] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  // Handle URL edit parameter
  useEffect(() => {
    const edit = searchParams.get('edit');
    if (edit && (notes.length > 0 || reviews.length > 0)) {
      if (edit.startsWith('note-')) {
        const noteId = parseInt(edit.replace('note-', ''));
        const note = notes.find(n => n.id === noteId);
        if (note) {
          startEdit('note', note);
        }
      } else if (edit.startsWith('review-')) {
        const reviewId = parseInt(edit.replace('review-', ''));
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          startEdit('review', review);
        }
      }
    }
  }, [searchParams, notes, reviews]);

  const loadContent = async () => {
    setLoading(true);
    
    const { data: notesData } = await supabase
      .from('quick_notes')
      .select('*, game:games(*)')
      .order('created_at', { ascending: false });
    
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, game:games(*)')
      .order('created_at', { ascending: false });
    
    setNotes(notesData || []);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  const handleDelete = async (type: 'note' | 'review', id: number) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    const table = type === 'note' ? 'quick_notes' : 'reviews';
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      alert('Failed to delete');
      return;
    }

    loadContent();
  };

  const startEdit = (type: 'note' | 'review', item: ContentItem) => {
    if (type === 'note') {
      setEditContent(item.content || '');
      setEditImages(item.images || []);
      setEditCoverImage(item.cover_image || null);
    } else {
      setEditTitle(item.title || '');
      setEditReviewContent(item.content || '');
      setEditRating(item.rating || 7);
      setEditPlatforms(item.platforms_played || []);
      setEditPlaytime(item.playtime_hours?.toString() || '');
      setEditPros(item.pros && item.pros.length > 0 ? item.pros : ['']);
      setEditCons(item.cons && item.cons.length > 0 ? item.cons : ['']);
      setEditImages(item.images || []);
      setEditCoverImage(item.cover_image || null);
    }
    setEditMode({ type, id: item.id, data: item });
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditContent('');
    setEditImages([]);
    setEditCoverImage(null);
    setEditTitle('');
    setEditReviewContent('');
    setEditRating(7);
    setEditPlatforms([]);
    setEditPlaytime('');
    setEditPros(['']);
    setEditCons(['']);
  };

  const saveEdit = async () => {
    if (!editMode) return;

    if (editMode.type === 'note') {
      const { error } = await supabase
        .from('quick_notes')
        .update({ 
          content: editContent,
          images: editImages,
          cover_image: editCoverImage,
        })
        .eq('id', editMode.id);

      if (error) {
        console.error('Failed to update note:', error);
        alert(`Failed to update note: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase
        .from('reviews')
        .update({
          title: editTitle,
          content: editReviewContent,
          rating: editRating,
          platforms_played: editPlatforms,
          playtime_hours: editPlaytime ? parseFloat(editPlaytime) : null,
          pros: editPros.filter(p => p.trim()),
          cons: editCons.filter(c => c.trim()),
          images: editImages,
          cover_image: editCoverImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editMode.id);

      if (error) {
        console.error('Failed to update review:', error);
        alert(`Failed to update review: ${error.message}`);
        return;
      }
    }

    cancelEdit();
    loadContent();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">Loading content...</p>
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Edit {editMode.type === 'note' ? 'Quick Note' : 'Review'}
          </h2>
          <button
            onClick={cancelEdit}
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors"
          >
            ✕ Cancel
          </button>
        </div>

        {/* Game Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--background)] rounded-lg">
          {editMode.data.game?.background_image && (
            <img
              src={editMode.data.game.background_image}
              alt={editMode.data.game.name}
              className="w-16 h-16 rounded object-cover"
            />
          )}
          <div>
            <h3 className="font-bold text-[var(--foreground)]">
              {editMode.data.game?.name}
            </h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {new Date(editMode.data.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        {editMode.type === 'note' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value.slice(0, 280))}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
              <div className="mt-2 text-right">
                <span className={`text-sm ${editContent.length > 252 ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]'}`}>
                  {editContent.length}/280
                </span>
              </div>
            </div>

            <ImageUpload 
              images={editImages}
              onImagesChange={setEditImages}
              maxImages={5}
              coverImage={editCoverImage || undefined}
              onCoverImageChange={setEditCoverImage}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Rating: {editRating}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={editRating}
                onChange={(e) => setEditRating(Number(e.target.value))}
                className="w-full h-2 bg-[var(--surface-light)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setEditPlatforms(prev =>
                      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
                    )}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editPlatforms.includes(platform)
                        ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                        : 'bg-[var(--surface-light)] text-[var(--foreground)]'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Playtime (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={editPlaytime}
                onChange={(e) => setEditPlaytime(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Pros
              </label>
              {editPros.map((pro, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => {
                      const newPros = [...editPros];
                      newPros[index] = e.target.value;
                      setEditPros(newPros);
                    }}
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {editPros.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEditPros(editPros.filter((_, i) => i !== index))}
                      className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditPros([...editPros, ''])}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                + Add Pro
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Cons
              </label>
              {editCons.map((con, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => {
                      const newCons = [...editCons];
                      newCons[index] = e.target.value;
                      setEditCons(newCons);
                    }}
                    className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {editCons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEditCons(editCons.filter((_, i) => i !== index))}
                      className="px-3 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditCons([...editCons, ''])}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                + Add Con
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Content (Markdown)
              </label>
              <textarea
                value={editReviewContent}
                onChange={(e) => setEditReviewContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-y font-mono text-sm"
              />
            </div>

            <ImageUpload 
              images={editImages}
              onImagesChange={setEditImages}
              maxImages={10}
              coverImage={editCoverImage || undefined}
              onCoverImageChange={setEditCoverImage}
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={saveEdit}
            className="flex-1 px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold hover:bg-[var(--accent-hover)] transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={cancelEdit}
            className="px-6 py-3 bg-[var(--surface-light)] text-[var(--foreground)] rounded-lg font-semibold hover:bg-[var(--border)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Reviews Section */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Your Reviews ({reviews.length})
        </h2>
        
        {reviews.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)] text-center">
            <p className="text-[var(--foreground-muted)]">
              No reviews yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
              >
                <div className="flex gap-4">
                  {review.game?.background_image && (
                    <img
                      src={review.game.background_image}
                      alt={review.game.name}
                      className="w-24 h-24 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
                          {review.title}
                        </h3>
                        <p className="text-sm text-[var(--accent)] font-semibold">
                          {review.game?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] text-sm font-bold rounded">
                          {review.rating}/10
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] mb-3">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit('review', review)}
                        className="px-4 py-2 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded-lg text-sm font-bold hover:bg-opacity-100 transition-colors shadow-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete('review', review.id)}
                        className="px-4 py-2 bg-red-500 bg-opacity-90 text-white rounded-lg text-sm font-bold hover:bg-opacity-100 transition-colors shadow-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Notes Section */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          Your Quick Notes ({notes.length})
        </h2>
        
        {notes.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)] text-center">
            <p className="text-[var(--foreground-muted)]">
              No notes yet. Share your first thought!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-[var(--surface)] rounded-lg p-5 border border-[var(--border)] hover:border-[var(--accent-dim)] transition-colors"
              >
                <div className="flex gap-4">
                  {note.game?.background_image && (
                    <img
                      src={note.game.background_image}
                      alt={note.game.name}
                      className="w-20 h-20 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-[var(--foreground)] mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--accent)] font-semibold">
                          {note.game?.name}
                        </span>
                        <span className="text-[var(--foreground-muted)]">•</span>
                        <span className="text-[var(--foreground-muted)]">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit('note', note)}
                          className="px-3 py-1 bg-[var(--accent)] bg-opacity-90 text-[var(--accent-text)] rounded text-sm font-bold hover:bg-opacity-100 transition-colors shadow-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete('note', note.id)}
                          className="px-3 py-1 bg-red-500 bg-opacity-90 text-white rounded text-sm font-bold hover:bg-opacity-100 transition-colors shadow-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
