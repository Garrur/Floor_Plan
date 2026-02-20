'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ConstraintSelector } from '@/components/upload/ConstraintSelector';
import { useUpload } from '@/lib/hooks/useUpload';
import { useGeneration } from '@/lib/hooks/useGeneration';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [constraint, setConstraint] = useState('custom');
  const [numFloors, setNumFloors] = useState<number>(1);
  
  const { uploadImage, uploading, error: uploadError } = useUpload();
  const generateMutation = useGeneration();

  const handleGenerate = async () => {
    if (!file) return;
    try {
      const userId = 'demo-user';
      let imageUrl: string;
      try {
        imageUrl = await uploadImage(file, userId);
      } catch {
        console.warn('Supabase not configured, using placeholder URL');
        imageUrl = URL.createObjectURL(file);
      }
      const job = await generateMutation.mutateAsync({
        image_url: imageUrl,
        user_id: userId,
        options: { 
          constraint,
          num_floors: numFloors
        },
      });
      router.push(`/generate/${job.job_id}`);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to submit generation job. Please ensure the backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] film-grain">
      <div className="fixed inset-0 blueprint-grid opacity-40 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-[var(--c-border)]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[var(--c-accent)] flex items-center justify-center text-[var(--c-accent)] text-xs font-bold tracking-widest">
              FP
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:block">FLOORPLAN</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="label-sm">STEP {step} OF 2</span>
            <div className="flex gap-1.5">
              <div className={`w-8 h-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-border)]'}`} />
              <div className={`w-8 h-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-border)]'}`} />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-16">
        {/* Step 1 */}
        {step === 1 && (
          <div className="c-reveal">
            <p className="label-sm text-[var(--c-accent)] mb-3">STEP 01</p>
            <h1 className="heading-lg mb-2">Upload Exterior</h1>
            <p className="text-sm text-[var(--c-text-dim)] mb-10 max-w-md">
              Drag and drop a photograph of the building. We accept JPG and PNG up to 10MB.
            </p>

            <ImageUpload onImageSelected={setFile} />

            <button
              onClick={() => setStep(2)}
              disabled={!file}
              className="c-btn w-full py-4 mt-8 text-sm tracking-widest uppercase rounded-none flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              CONTINUE <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="c-reveal">
            <p className="label-sm text-[var(--c-accent)] mb-3">STEP 02</p>
            <h1 className="heading-lg mb-2">Layout Preference</h1>
            <p className="text-sm text-[var(--c-text-dim)] mb-10 max-w-md">
              Choose a layout type or let the AI detect the optimal arrangement.
            </p>

            <ConstraintSelector onSelect={setConstraint} defaultValue={constraint} />

            <div className="mt-8">
              <h2 className="label-sm text-[var(--c-text)] mb-3">BUILDING HEIGHT</h2>
              <div className="grid grid-cols-3 gap-px bg-[var(--c-border)]">
                {[1, 2, 3].map(floors => (
                  <button
                    key={floors}
                    onClick={() => setNumFloors(floors)}
                    className={`p-4 text-center transition-all duration-300 ${
                      numFloors === floors 
                        ? 'bg-[var(--c-surface-2)] text-[var(--c-accent)] font-bold' 
                        : 'bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-surface-2)]'
                    }`}
                  >
                    {floors} {floors === 1 ? 'STORY' : 'STORIES'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 text-sm tracking-widest uppercase border border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> BACK
              </button>
              <button
                onClick={handleGenerate}
                disabled={uploading || generateMutation.isPending}
                className="c-btn flex-1 py-4 text-sm tracking-widest uppercase rounded-none flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {uploading || generateMutation.isPending ? (
                  <>
                    <LoadingSpinner size={16} />
                    {uploading ? 'UPLOADING...' : 'SUBMITTING...'}
                  </>
                ) : (
                  'GENERATE'
                )}
              </button>
            </div>

            {(uploadError || generateMutation.error) && (
              <div className="mt-6 p-4 border border-[var(--c-danger)] bg-[var(--c-danger)]/10 text-sm text-[var(--c-danger)]">
                {uploadError || generateMutation.error?.message || 'An error occurred'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
