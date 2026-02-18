'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressTrackerProps {
  currentStage: string;
  progress: number;
  estimatedTimeRemaining?: number;
}

const STAGES = [
  { name: 'pending', label: 'PREPARING' },
  { name: 'download', label: 'DOWNLOADING IMAGE' },
  { name: 'feature_extraction', label: 'ANALYZING EXTERIOR' },
  { name: 'layout_generation', label: 'GENERATING LAYOUT' },
  { name: 'post_processing', label: 'REFINING DETAILS' },
  { name: 'upload', label: 'FINALIZING' },
];

export function ProgressTracker({ currentStage, progress }: ProgressTrackerProps) {
  const currentIndex = STAGES.findIndex(s => s.name === currentStage);
  const percent = Math.round(progress * 100);

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <span className="label-sm">PROGRESS</span>
          <span className="text-2xl font-bold text-[var(--c-accent)] tabular-nums">{percent}%</span>
        </div>
        <div className="h-[3px] bg-[var(--c-border)] relative overflow-hidden">
          <div 
            className="c-progress-bar absolute inset-y-0 left-0 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="border-l border-[var(--c-border)] ml-3 c-stagger">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div 
              key={stage.name} 
              className={`relative flex items-center gap-5 py-3.5 pl-8 transition-all duration-500
                ${isCurrent ? 'text-[var(--c-text)]' : isCompleted ? 'text-[var(--c-text-dim)]' : 'text-[var(--c-text-muted)]'}`}
            >
              {/* Dot on the timeline */}
              <div className={`absolute left-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all duration-500
                ${isCompleted ? 'bg-[var(--c-success)]' : isCurrent ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-text-muted)]'}`}
              >
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full bg-[var(--c-accent)] animate-ping opacity-30" />
                )}
              </div>

              {/* Icon */}
              <div className="flex-shrink-0 w-5">
                {isCompleted && <CheckCircle2 size={16} className="text-[var(--c-success)]" />}
                {isCurrent && <Loader2 size={16} className="text-[var(--c-accent)] animate-spin" />}
                {isPending && <Circle size={14} className="text-[var(--c-text-muted)]" />}
              </div>

              {/* Label */}
              <span className={`text-xs tracking-[0.15em] font-medium ${isCurrent ? 'text-[var(--c-accent)]' : ''}`}>
                {stage.label}
              </span>

              {/* Status */}
              {isCompleted && <span className="ml-auto text-[9px] text-[var(--c-success)] tracking-widest">DONE</span>}
              {isCurrent && <span className="ml-auto text-[9px] text-[var(--c-accent)] tracking-widest">ACTIVE</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
