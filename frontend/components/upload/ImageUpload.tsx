'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  maxSizeMB?: number;
}

export function ImageUpload({ onImageSelected, maxSizeMB = 10 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size: ${maxSizeMB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onImageSelected(file);
  }, [onImageSelected, maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageSelected(null as any);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative border border-dashed cursor-pointer transition-all duration-500 group
        ${isDragActive 
          ? 'border-[var(--c-accent)] bg-[var(--c-accent-glow)]' 
          : preview 
            ? 'border-[var(--c-border)] bg-[var(--c-surface)]'
            : 'border-[var(--c-border)] hover:border-[var(--c-accent)] hover:bg-[var(--c-surface)]'}`}
    >
      <input {...getInputProps()} />
      
      {preview ? (
        <div className="c-reveal p-6">
          <img src={preview} alt="Preview" className="max-h-64 mx-auto" />
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-danger)] hover:border-[var(--c-danger)] transition-colors"
          >
            <X size={14} />
          </button>
          <p className="text-center mt-4 text-xs text-[var(--c-text-muted)]">Click or drag to replace</p>
        </div>
      ) : (
        <div className="py-16 px-8 text-center">
          <div className={`mx-auto w-12 h-12 border flex items-center justify-center mb-6 transition-all duration-500
            ${isDragActive ? 'border-[var(--c-accent)] text-[var(--c-accent)]' : 'border-[var(--c-border)] text-[var(--c-text-dim)] group-hover:border-[var(--c-accent)] group-hover:text-[var(--c-accent)]'}`}>
            <Upload size={18} />
          </div>
          <p className="text-sm font-medium mb-2">
            {isDragActive ? 'Release to upload' : 'Drag image here'}
          </p>
          <p className="text-xs text-[var(--c-text-muted)]">
            or click to browse · JPG, PNG · max {maxSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
}
