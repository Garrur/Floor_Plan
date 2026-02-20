'use client';

import Link from 'next/link';
import { Trash2, ArrowRight, Clock, Layers } from 'lucide-react';
import { useHistoryStore } from '@/lib/store/historyStore';

export default function HistoryPage() {
  const { entries, removeEntry, clearHistory } = useHistoryStore();

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
          <span className="label-sm">GENERATION HISTORY</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="c-reveal">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="label-sm text-[var(--c-accent)] mb-3">ARCHIVE</p>
              <h1 className="heading-lg">
                Your<br />
                <span className="text-[var(--c-text-dim)]">Generations</span>
              </h1>
            </div>
            {entries.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all history?')) clearHistory(); }}
                className="text-xs tracking-widest uppercase border border-[var(--c-border)] px-4 py-2 text-[var(--c-text-muted)] hover:text-[var(--c-danger)] hover:border-[var(--c-danger)] transition-colors flex items-center gap-2"
              >
                <Trash2 size={12} /> CLEAR ALL
              </button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="c-reveal text-center py-24 border border-[var(--c-border)]">
            <Clock size={40} className="mx-auto mb-4 text-[var(--c-text-muted)]" />
            <p className="text-sm text-[var(--c-text-dim)] mb-2">No generations yet</p>
            <p className="text-xs text-[var(--c-text-muted)] mb-8">Generated floor plans will appear here</p>
            <Link href="/generate">
              <button className="c-btn px-6 py-3 text-xs tracking-widest uppercase rounded-none inline-flex items-center gap-2">
                GENERATE FIRST PLAN <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--c-border)] c-stagger">
            {entries.map((entry) => (
              <div key={entry.jobId} className="bg-[var(--c-surface)] group relative">
                {/* Thumbnail */}
                <div className="aspect-square overflow-hidden bg-[var(--c-bg)]">
                  <img
                    src={entry.imageUrl}
                    alt="Floor plan"
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="label-sm text-[var(--c-accent)]">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); removeEntry(entry.jobId); }}
                      className="w-6 h-6 flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-danger)] transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {entry.metadata && (
                    <div className="flex items-center gap-4 text-xs text-[var(--c-text-dim)]">
                      <span className="flex items-center gap-1">
                        <Layers size={10} /> {entry.metadata.rooms?.length || 0} rooms
                      </span>
                      <span>{entry.metadata.total_area_sqft?.toLocaleString()} sq ft</span>
                      {entry.metadata.validation && (
                        <span className="text-[var(--c-accent)]">
                          {Math.round(entry.metadata.validation.spatial_consistency_score * 100)}%
                        </span>
                      )}
                    </div>
                  )}

                  {entry.constraint && (
                    <div className="mt-2 text-[10px] text-[var(--c-text-muted)] tracking-wider uppercase">
                      {entry.constraint}
                    </div>
                  )}
                </div>

                {/* Hover overlay link */}
                <Link
                  href={`/generate/${entry.jobId}`}
                  className="absolute inset-0 z-10"
                  aria-label="View floor plan"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
