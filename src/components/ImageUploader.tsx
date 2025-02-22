import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { validateImageFile } from '../lib/imageUtils';
import { uploadImage } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  userId: string;
}

export default function ImageUploader({ images, onImagesChange, userId }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !userId) {
      toast.error('Please log in to upload images');
      return;
    }

    try {
      setUploading(true);
      
      // Process files in batches to avoid overwhelming the server
      const MAX_CONCURRENT_UPLOADS = 3;
      const fileArray = Array.from(files);
      const results = [];
      
      for (let i = 0; i < fileArray.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = fileArray.slice(i, i + MAX_CONCURRENT_UPLOADS);
        const uploadPromises = batch.map(async (file) => {
          try {
            const validation = validateImageFile(file);
            if (!validation.valid) {
              toast.error(validation.error);
              return null;
            }

            const url = await uploadImage(file, userId);
            if (url) {
              toast.success(`Uploaded ${file.name}`);
              return url;
            }
            return null;
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            toast.error(`Failed to upload ${file.name}`);
            return null;
          }
        });

        const batchResults = await Promise.all(uploadPromises);
        results.push(...batchResults);
      }

      const validUrls = results.filter((url): url is string => url !== null);
      if (validUrls.length > 0) {
        onImagesChange([...images, ...validUrls]);
        if (validUrls.length === files.length) {
          toast.success('All images uploaded successfully');
        } else {
          toast.success(`Uploaded ${validUrls.length} of ${files.length} images`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  }, []);

  const handleImageDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    // Set drag image
    const img = new Image();
    img.src = images[index];
    e.dataTransfer.setDragImage(img, 20, 20);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-all duration-200 ${
          uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <div className="space-y-1 text-center">
          <Upload className={`mx-auto h-12 w-12 text-gray-400 ${uploading ? 'animate-pulse' : ''}`} />
          <div className="flex text-sm text-gray-600">
            <label className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${
              uploading ? 'cursor-not-allowed opacity-50' : ''
            }`}>
              <span>Upload images</span>
              <input
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                className="sr-only"
                onChange={(e) => {
                  handleFileUpload(e.target.files);
                  e.target.value = ''; // Reset input
                }}
                disabled={uploading}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF, WebP, HEIC up to 10MB
          </p>
          {uploading && (
            <p className="text-sm text-blue-600">Uploading images...</p>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group"
              draggable
              onDragStart={(e) => handleImageDragStart(index, e)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className={`h-24 w-full object-cover rounded-md transition-transform ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${draggedIndex !== null ? 'cursor-move' : ''}`}
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  Featured
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
