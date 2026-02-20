'use client';

import { useParams } from 'next/navigation';
import { useJobStatus, useJobResult } from '@/lib/hooks/useGeneration';
import { ProgressTracker } from '@/components/progress/ProgressTracker';
import { FloorPlanViewer } from '@/components/display/FloorPlanViewer';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useHistoryStore } from '@/lib/store/historyStore';

export default function JobPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const { data: job, isLoading, error: jobError } = useJobStatus(jobId);
  const { data: result, error: resultError } = useJobResult(
    job?.status === 'completed' ? jobId : null,
    job?.status === 'completed'
  );

  const addEntry = useHistoryStore(s => s.addEntry);

  useEffect(() => {
    if (result && jobId) {
      addEntry({
        jobId,
        imageUrl: result.output_image_url,
        metadata: result.metadata,
        createdAt: new Date().toISOString(),
      });
    }
  }, [result, jobId, addEntry]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center film-grain">
        <div className="fixed inset-0 blueprint-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 text-center c-reveal">
          <LoadingSpinner size={32} />
          <p className="mt-6 label-sm">LOADING JOB</p>
        </div>
      </div>
    );
  }

  // Error
  if (jobError) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center film-grain">
        <div className="fixed inset-0 blueprint-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-md text-center p-12 c-reveal">
          <div className="w-16 h-16 border border-[var(--c-danger)] flex items-center justify-center mx-auto mb-6 text-[var(--c-danger)] text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold mb-3 text-[var(--c-text)]">Error Loading Job</h1>
          <p className="text-sm text-[var(--c-text-dim)] mb-8">
            {jobError.message || 'Could not load job status.'}
          </p>
          <Link href="/generate">
            <button className="c-btn px-8 py-3 text-xs tracking-widest uppercase rounded-none">
              TRY AGAIN
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Failed
  if (job?.status === 'failed') {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center film-grain">
        <div className="fixed inset-0 blueprint-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-md text-center p-12 c-reveal">
          <div className="w-16 h-16 border border-[var(--c-danger)] flex items-center justify-center mx-auto mb-6 text-[var(--c-danger)] text-2xl font-bold">
            ✕
          </div>
          <h1 className="text-xl font-bold mb-3 text-[var(--c-text)]">Generation Failed</h1>
          <p className="text-sm text-[var(--c-text-dim)] mb-8">
            {job.error || 'An error occurred during generation.'}
          </p>
          <Link href="/generate">
            <button className="c-btn px-8 py-3 text-xs tracking-widest uppercase rounded-none">
              TRY AGAIN
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)] film-grain">
      <div className="fixed inset-0 blueprint-grid opacity-40 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 border-b border-[var(--c-border)]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[var(--c-accent)] flex items-center justify-center text-[var(--c-accent)] text-xs font-bold tracking-widest">
              FP
            </div>
            <span className="text-sm font-semibold tracking-wide hidden sm:block">FLOORPLAN</span>
          </Link>
          <span className="label-sm">
            {job?.status === 'completed' ? 'RESULT READY' : 'GENERATING...'}
          </span>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16">
        {/* In Progress */}
        {job?.status !== 'completed' && (
          <div className="c-reveal">
            <p className="label-sm text-[var(--c-accent)] mb-3">PROCESSING</p>
            <h1 className="heading-lg mb-2">
              Generating<br />
              <span className="text-[var(--c-text-dim)]">your floor plan</span>
            </h1>
            <div className="arch-line mt-4 mb-12" />

            <ProgressTracker
              currentStage={job?.stage || 'pending'}
              progress={job?.progress || 0}
            />

            <div className="mt-10 p-5 border border-[var(--c-border)] text-center">
              <p className="text-xs text-[var(--c-text-dim)] tracking-wide">
                This page updates automatically. Do not close this tab.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="c-reveal">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--c-success)]" />
              <p className="label-sm text-[var(--c-success)]">COMPLETE</p>
            </div>
            <h1 className="heading-lg mb-2">
              Your Blueprint<br />
              <span className="text-[var(--c-accent)]">is Ready</span>
            </h1>
            <div className="arch-line mt-4 mb-12" />

            <FloorPlanViewer
              imageUrl={result.output_image_url}
              metadata={result.metadata}
            />

            {/* Actions */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/generate" className="flex-1">
                <button className="c-btn w-full py-4 text-xs tracking-widest uppercase rounded-none flex items-center justify-center gap-2">
                  GENERATE ANOTHER <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/" className="flex-1">
                <button className="w-full py-4 text-xs tracking-widest uppercase border border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)] transition-colors">
                  BACK TO HOME
                </button>
              </Link>
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
