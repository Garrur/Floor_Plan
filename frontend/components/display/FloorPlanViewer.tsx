'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, Download, FileText, Box } from 'lucide-react';
import { FloorPlanMetadata } from '@/types/api';
import { exportFloorPlanPDF } from '@/lib/utils/pdfExport';
import dynamic from 'next/dynamic';
import { CostEstimator } from './CostEstimator';
import { InteriorInsights } from './InteriorInsights';

const FloorPlan3D = dynamic(() => import('./FloorPlan3D').then(m => m.FloorPlan3D), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center bg-[var(--c-bg)] border border-[var(--c-border)]">
      <span className="label-sm">Loading 3D viewer...</span>
    </div>
  ),
});

const FloorPlanEditor = dynamic(() => import('./FloorPlanEditor').then(m => m.FloorPlanEditor), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center bg-[var(--c-bg)] border border-[var(--c-border)]">
      <span className="label-sm">Loading Editor...</span>
    </div>
  ),
});

interface FloorPlanViewerProps {
  imageUrl: string;
  metadata?: FloorPlanMetadata;
  readOnly?: boolean;
}

export function FloorPlanViewer({ imageUrl, metadata: initialMetadata, readOnly = false }: FloorPlanViewerProps) {
  const [metadata, setMetadata] = useState<FloorPlanMetadata | undefined>(initialMetadata);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<'2d' | 'edit' | '3d'>('2d');
  const [exporting, setExporting] = useState(false);
  const [showFurniture, setShowFurniture] = useState(true);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'floor-plan.png';
    link.click();
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportFloorPlanPDF(imageUrl, metadata);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Viewer */}
      <div className="c-card p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--c-border)] relative">
          {/* View Toggle */}
          <div className="flex">
            <button
              onClick={() => setView('2d')}
              className={`px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors
                ${view === '2d' 
                  ? 'bg-[var(--c-accent)] text-[var(--c-bg)] border-[var(--c-accent)] font-bold' 
                  : 'border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)]'}`}
            >
              2D PLAN
            </button>
            {!readOnly && (
              <button
                onClick={() => setView('edit')}
                className={`px-4 py-2 text-[10px] tracking-widest uppercase border border-l-0 transition-colors
                  ${view === 'edit' 
                    ? 'bg-[var(--c-accent)] text-[var(--c-bg)] border-[var(--c-accent)] font-bold' 
                    : 'border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)]'}`}
              >
                EDIT PLAN
              </button>
            )}
            <button
              onClick={() => setView('3d')}
              className={`px-4 py-2 text-[10px] tracking-widest uppercase border border-l-0 transition-colors flex items-center gap-1.5
                ${view === '3d' 
                  ? 'bg-[var(--c-accent)] text-[var(--c-bg)] border-[var(--c-accent)] font-bold' 
                  : 'border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)]'}`}
            >
              <Box size={10} /> 3D VIEW
            </button>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2">
            {view === '2d' && (
              <>
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
                <div className="w-px h-6 bg-[var(--c-border)] mx-1" />
              </>
            )}
            {view === 'edit' && (
              <button 
                onClick={() => setShowFurniture(!showFurniture)}
                className={`px-4 py-1.5 text-[10px] tracking-widest uppercase border transition-colors flex items-center gap-2
                  ${showFurniture 
                    ? 'border-[var(--c-accent)] text-[var(--c-accent)] bg-[var(--c-accent)]/10' 
                    : 'border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)]'}`}
              >
                Furniture {showFurniture ? 'ON' : 'OFF'}
              </button>
            )}
            {!readOnly && (
              <button className="c-btn px-4 py-1.5 text-[10px] tracking-widest uppercase rounded-none flex items-center gap-2">
                <Download size={11} /> SAVE
              </button>
            )}
            <button 
              onClick={() => {
                const url = window.location.href.replace('/generate/', '/share/');
                navigator.clipboard.writeText(url);
                alert("Shareable link copied to clipboard!");
              }}
              className="px-4 py-1.5 text-[10px] tracking-widest uppercase border border-[var(--c-border)] text-[var(--c-text-dim)] hover:text-[var(--c-text)] hover:border-[var(--c-text-dim)] transition-colors flex items-center gap-2"
            >
              Copy Link
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-1.5 text-[10px] tracking-widest uppercase border border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-[var(--c-bg)] transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <FileText size={11} /> {exporting ? 'EXPORTING...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* 2D View */}
        {view === '2d' && (
          <div className="relative overflow-auto max-h-[550px] bg-[var(--c-bg)] border border-[var(--c-border)]">
            <img
              src={imageUrl}
              alt="Floor plan"
              className="mx-auto transition-transform duration-500"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            />
          </div>
        )}

        {/* Interactive 2D Editor View */}
        {view === 'edit' && metadata && (
          <FloorPlanEditor 
            metadata={metadata} 
            onMetadataChange={setMetadata} 
            showFurniture={showFurniture}
          />
        )}
        
        {view === 'edit' && !metadata && (
          <div className="h-[500px] flex items-center justify-center bg-[var(--c-bg)] border border-[var(--c-border)]">
            <span className="text-sm text-[var(--c-text-dim)]">Metadata required for interactive editor</span>
          </div>
        )}

        {/* 3D View */}
        {view === '3d' && metadata?.rooms && (
          <FloorPlan3D rooms={metadata.rooms} />
        )}

        {view === '3d' && (!metadata?.rooms || metadata.rooms.length === 0) && (
          <div className="h-[500px] flex items-center justify-center bg-[var(--c-bg)] border border-[var(--c-border)]">
            <div className="text-center">
              <Box size={32} className="mx-auto mb-3 text-[var(--c-text-muted)]" />
              <p className="text-sm text-[var(--c-text-dim)]">No room data available for 3D view</p>
            </div>
          </div>
        )}
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
            {metadata.rooms.map((room: any, i: number) => (
              <div key={room.id || i} className="bg-[var(--c-surface)] p-4">
                <div className="text-sm font-semibold text-[var(--c-text)]">{room.label || room.type}</div>
                <div className="text-xs text-[var(--c-text-muted)] mt-1">{room.area_sqft} sq ft</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cost Estimating Panel */}
      {metadata && view === '2d' && (
        <CostEstimator metadata={metadata} />
      )}

      {/* AI Interior Insights */}
      {metadata && view === '2d' && (
        <InteriorInsights metadata={metadata} />
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
