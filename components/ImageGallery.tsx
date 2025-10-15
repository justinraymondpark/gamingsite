'use client';

import { useState } from 'react';
import Lightbox from './Lightbox';

type ImageGalleryProps = {
  images: string[];
};

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((img: string, i: number) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group block w-full text-left cursor-pointer"
          >
            <img
              src={img}
              alt={`Screenshot ${i + 1}`}
              className="w-full rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-all group-hover:scale-[1.02] object-cover"
            />
          </button>
        ))}
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
