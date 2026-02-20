'use client';

import { useParams } from 'next/navigation';
import { useJobStatus, useJobResult } from '@/lib/hooks/useGeneration';
import { FloorPlanViewer } from '@/components/display/FloorPlanViewer';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';

export default function SharedJobPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { data: job, isLoading, error: jobError } = useJobStatus(jobId);
  const { data: result, error: resultError } = useJobResult(
    job?.status === 'completed' ? jobId : null,
    job?.status === 'completed'
  );

  // Loading
  if (isLoading || job?.status === 'processing' || job?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center film-grain">
        <div className="fixed inset-0 blueprint-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 text-center c-reveal">
          <LoadingSpinner size={32} />
          <p className="mt-6 label-sm uppercase">LOADING FLOOR PLAN</p>
        </div>
      </div>
    );
  }

  // Error or Failed
  if (jobError || job?.status === 'failed') {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center film-grain">
        <div className="fixed inset-0 blueprint-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-md text-center p-12 c-reveal">
          <div className="w-16 h-16 border border-[var(--c-danger)] flex items-center justify-center mx-auto mb-6 text-[var(--c-danger)] text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold mb-3 text-[var(--c-text)]">Link Unavailable</h1>
          <p className="text-sm text-[var(--c-text-dim)] mb-8">
            This floor plan link may have expired or is invalid.
          </p>
          <Link href="/">
            <button className="c-btn px-8 py-3 text-xs tracking-widest uppercase rounded-none">
              GO HOME
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] film-grain pb-20">
      <div className="fixed inset-0 blueprint-grid opacity-40 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[var(--c-accent)] flex items-center justify-center text-[var(--c-accent)] text-xs font-bold tracking-widest">
              FP
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:block">FLOORPLAN</span>
          </div>
          <span className="label-sm px-3 py-1 bg-[var(--c-accent)] text-[var(--c-bg)]">
            VIEW ONLY
          </span>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16">
        {/* Result */}
        {result && (
          <div className="c-reveal">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h1 className="heading-lg mb-2">
                     Shared <span className="text-[var(--c-accent)]">Blueprint</span>
                  </h1>
                  <p className="text-sm text-[var(--c-text-dim)]">
                     You are viewing a shared layout. Editing is disabled.
                  </p>
               </div>
            </div>
            <div className="arch-line mb-12" />

            {/* ReadOnly sets the viewer to disable the editor buttons */}
            <FloorPlanViewer
              imageUrl={result.output_image_url}
              metadata={result.metadata}
              readOnly={true}
            />
            
            <div className="mt-12 text-center">
               <span className="text-xs tracking-widest text-[var(--c-text-muted)] uppercase">Generated with FloorPlan AI</span>
            </div>
          </div>
        )}

        {resultError && (
          <div className="mt-8 p-5 border border-[var(--c-accent)] text-center c-fade">
            <p className="text-xs text-[var(--c-accent)]">
              Job completed but result could not be loaded. Try refreshing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
