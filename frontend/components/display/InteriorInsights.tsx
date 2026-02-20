import { Lightbulb, Info } from 'lucide-react';
import { FloorPlanMetadata } from '@/types/api';

interface InteriorInsightsProps {
  metadata: FloorPlanMetadata;
}

export function InteriorInsights({ metadata }: InteriorInsightsProps) {
  if (!metadata || !metadata.rooms) return null;

  // Filter for rooms that actually have at least one insight
  const roomsWithInsights = metadata.rooms.filter(room => room.insights && room.insights.length > 0);

  if (roomsWithInsights.length === 0) return null;

  return (
    <div className="c-card mt-6">
      <div className="p-4 sm:p-6 border-b border-[var(--c-border)] flex items-center gap-3">
        <Lightbulb className="text-[var(--c-accent)]" size={20} />
        <div>
          <h3 className="text-lg font-light tracking-wide text-[var(--c-text)]">
            AI INTERIOR <span className="text-[var(--c-accent)] font-medium">INSIGHTS</span>
          </h3>
          <p className="text-sm text-[var(--c-text-dim)] mt-1">
            Smart design & furniture suggestions based on your layout
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 bg-[var(--c-bg)]">
        {roomsWithInsights.map((room, index) => (
          <div key={`insight-${index}`} className="group">
            <h4 className="text-sm tracking-widest uppercase text-[var(--c-text-muted)] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--c-border)] group-hover:bg-[var(--c-accent)] transition-colors" />
              {room.type} ({room.area_sqft} SQFT)
            </h4>
            
            <ul className="space-y-3 pl-4">
              {room.insights!.map((insight, i) => (
                <li key={i} className="text-sm text-[var(--c-text-dim)] flex items-start gap-2">
                  <span className="text-[var(--c-accent)] mt-0.5">•</span>
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-4 bg-[var(--c-bg-subtle)] border-t border-[var(--c-border)] flex items-start gap-3">
        <Info size={16} className="text-[var(--c-text-muted)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--c-text-muted)] leading-relaxed">
          These AI-generated insights act as a starting point. Square footage rules of thumb are based on standard ergonomic spacing.
        </p>
      </div>
    </div>
  );
}
