'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, Download } from 'lucide-react';
import { FloorPlanMetadata } from '@/types/api';

interface FloorPlanViewerProps {
  imageUrl: string;
  metadata?: FloorPlanMetadata;
}

export function FloorPlanViewer({ imageUrl, metadata }: FloorPlanViewerProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'floor-plan.png';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Image Viewer */}
      <div className="c-card p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="label-sm">FLOOR PLAN OUTPUT</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="w-8 h-8 border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)] transition-colors"
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-xs text-[var(--c-text-dim)] w-12 text-center tabular-nums font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="w-8 h-8 border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)] transition-colors"
            >
              <ZoomIn size={12} />
            </button>
            <div className="w-px h-6 bg-[var(--c-border)] mx-2" />
            <button 
              onClick={handleDownload}
              className="c-btn px-4 py-1.5 text-[10px] tracking-widest uppercase rounded-none flex items-center gap-2"
            >
              <Download size={11} /> SAVE
            </button>
          </div>
        </div>

        <div className="relative overflow-auto max-h-[550px] bg-[var(--c-bg)] border border-[var(--c-border)]">
          <img
            src={imageUrl}
            alt="Floor plan"
            className="mx-auto transition-transform duration-500"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          />
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[var(--c-border)]">
          <MetricCell label="TOTAL AREA" value={`${metadata.total_area_sqft?.toLocaleString() ?? '—'}`} unit="sq ft" />
          <MetricCell label="ROOMS" value={`${metadata.rooms?.length || '—'}`} />
          <MetricCell label="BEDROOMS" value={`${metadata.num_bedrooms ?? '—'}`} />
          <MetricCell label="BATHROOMS" value={`${metadata.num_bathrooms ?? '—'}`} />
          {metadata.validation && (
            <MetricCell label="QUALITY" value={`${Math.round(metadata.validation.spatial_consistency_score * 100)}%`} accent />
          )}
        </div>
      )}

      {/* Room List */}
      {metadata?.rooms && metadata.rooms.length > 0 && (
        <div className="c-card p-6">
          <span className="label-sm mb-4 block">ROOM BREAKDOWN</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--c-border)]">
            {metadata.rooms.map((room: any) => (
              <div key={room.id} className="bg-[var(--c-surface)] p-4">
                <div className="text-sm font-semibold text-[var(--c-text)]">{room.label}</div>
                <div className="text-xs text-[var(--c-text-muted)] mt-1">{room.area_sqft} sq ft</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value, unit, accent }: { 
  label: string; value: string; unit?: string; accent?: boolean;
}) {
  return (
    <div className="bg-[var(--c-surface)] p-5 text-center">
      <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-[var(--c-accent)]' : 'text-[var(--c-text)]'}`}>
        {value}
        {unit && <span className="text-[10px] text-[var(--c-text-muted)] ml-1 font-normal">{unit}</span>}
      </div>
      <div className="label-sm mt-1.5">{label}</div>
    </div>
  );
}
