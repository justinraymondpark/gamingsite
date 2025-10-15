'use client';

import { useState } from 'react';
import Lightbox from './Lightbox';

type QuickNoteImagesProps = {
  images: string[];
};

export default function QuickNoteImages({ images }: QuickNoteImagesProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="flex gap-3 mb-3 overflow-x-auto">
        {images.slice(0, 3).map((img: string, i: number) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="h-48 rounded-lg object-cover border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer flex-shrink-0"
          >
            <img
              src={img}
              alt={`Screenshot ${i + 1}`}
              className="h-full w-auto object-cover rounded-lg"
            />
          </button>
        ))}
        {images.length > 3 && (
          <button
            onClick={() => openLightbox(3)}
            className="flex items-center justify-center h-48 w-32 bg-[var(--surface-light)] rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-[var(--foreground-muted)] hover:text-[var(--accent)] text-sm font-semibold cursor-pointer transition-colors"
          >
            +{images.length - 3}
          </button>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
