'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type ImageUploadProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  coverImage?: string;
  onCoverImageChange?: (coverImage: string | null) => void;
};

// Compress image using Canvas API
const compressImage = async (file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> => {
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

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  coverImage,
  onCoverImageChange 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const uploadImages = async (files: FileList) => {
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Check file size (max 20MB before compression)
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large (max 20MB)`);
        continue;
      }

      try {
        // Compress image
        setUploadProgress(`Compressing ${i + 1}/${files.length}...`);
        const compressedBlob = await compressImage(file);
        const originalSizeKB = (file.size / 1024).toFixed(0);
        const compressedSizeKB = (compressedBlob.size / 1024).toFixed(0);
        console.log(`Compressed ${file.name}: ${originalSizeKB}KB → ${compressedSizeKB}KB`);

        // Generate unique filename
        const fileExt = 'jpg'; // Always use jpg after compression
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(filePath, compressedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg'
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure you've created the "screenshots" bucket in Supabase Storage!`);
      }
    }

    onImagesChange([...images, ...newImageUrls]);
    setUploading(false);
    setUploadProgress('');
  };

  const removeImage = async (imageUrl: string, index: number) => {
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    try {
      // Delete from Supabase Storage
      await supabase.storage
        .from('screenshots')
        .remove([fileName]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }

    // Remove from state
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadImages(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadImages(files);
    }
  };

  // Image reordering handlers
  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleCoverImage = (imageUrl: string) => {
    if (!onCoverImageChange) return;
    
    if (coverImage === imageUrl) {
      // Unstar - remove cover image
      onCoverImageChange(null);
    } else {
      // Star - set as cover image
      onCoverImageChange(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[var(--foreground)]">
          Screenshots ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <label className="px-4 py-2 bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] rounded-lg text-sm font-semibold cursor-pointer hover:bg-opacity-30 transition-colors">
            {uploading ? uploadProgress : '📷 Upload Images'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {uploading && (
        <div className="text-sm text-[var(--accent)] text-center py-2">
          {uploadProgress}
        </div>
      )}

      {/* Drag and Drop Zone */}
      {images.length < maxImages && !uploading && (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center hover:border-[var(--accent)] transition-colors cursor-pointer bg-[var(--background)]"
        >
          <div className="text-4xl mb-2">📸</div>
          <p className="text-[var(--foreground)] font-semibold mb-1">
            Drag & drop images here
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">
            or click the button above to browse
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs text-[var(--foreground-muted)] mb-2">
            💡 Drag to reorder {onCoverImageChange && '• Click ⭐ to set cover image'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => {
              const isCover = coverImage === imageUrl;
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, index)}
                  onDragOver={handleImageDragOver}
                  onDrop={(e) => handleImageDrop(e, index)}
                  onDragEnd={handleImageDragEnd}
                  className={`relative group aspect-video bg-[var(--surface-light)] rounded-lg overflow-hidden border-2 transition-all cursor-move ${
                    draggedIndex === index
                      ? 'border-[var(--accent)] opacity-50 scale-95'
                      : isCover
                      ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-opacity-50'
                      : 'border-[var(--border)] hover:border-[var(--accent-dim)]'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-bold rounded">
                    {index + 1}
                  </div>
                  
                  {/* Star button for cover image */}
                  {onCoverImageChange && (
                    <button
                      type="button"
                      onClick={() => toggleCoverImage(imageUrl)}
                      className={`absolute bottom-2 left-2 p-2 rounded-lg transition-all ${
                        isCover
                          ? 'bg-[var(--accent)] text-[var(--accent-text)] opacity-100'
                          : 'bg-black bg-opacity-70 text-white opacity-0 group-hover:opacity-100'
                      } hover:scale-110`}
                      title={isCover ? 'Unstar (use game art)' : 'Star as cover image'}
                    >
                      {isCover ? '⭐' : '☆'}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => removeImage(imageUrl, index)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--foreground-muted)]">
        You can upload multiple images at once. Max 20MB per image.
        {images.length >= maxImages && ' (Limit reached)'}
      </p>
    </div>
  );
}
