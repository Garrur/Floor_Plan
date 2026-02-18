'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase/client';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const bucket = 'input-images';

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setProgress(100);
      return publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, progress, error };
}
