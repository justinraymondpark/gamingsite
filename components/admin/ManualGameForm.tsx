'use client';

import { useState, useRef } from 'react';
import { firestoreHelpers, type Game, storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase';

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

const compressImage = async (file: Blob, maxWidth = 1920, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Failed to compress')),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export default function ManualGameForm({ onGameAdded, onCancel }: Props) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [released, setReleased] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const uploadImageBlob = async (blob: Blob) => {
    setUploading(true);
    try {
      const compressed = await compressImage(blob);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, `game-covers/${fileName}`);
      await uploadBytes(storageRef, compressed, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=3600',
      });
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      setImagePreview(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImageBlob(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) uploadImageBlob(blob);
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadImageBlob(file);
    }
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            Cover Image (optional)
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Game cover preview"
                className="w-32 h-32 rounded-lg object-cover border border-[var(--border)]"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                X
              </button>
            </div>
          ) : (
            <div
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--accent)] transition-colors cursor-pointer bg-[var(--surface)]"
            >
              {uploading ? (
                <p className="text-sm text-[var(--accent)]">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-[var(--foreground)]">
                    Click to browse, drag & drop, or paste an image
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    or enter a URL below
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
          {!imagePreview && (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) setImagePreview(e.target.value);
              }}
              onBlur={() => { if (imageUrl) setImagePreview(imageUrl); }}
              placeholder="https://example.com/image.jpg"
              className="w-full mt-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}
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
