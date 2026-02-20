'use client';

import { useState } from 'react';
import { FloorPlanMetadata } from '@/types/api';

const TIERS = {
  economy: {
    label: 'Economy',
    desc: 'Basic finishes, standard materials',
    basePerSqft: 1500,
    kitchenAddon: 150000,
    bathAddon: 80000,
  },
  standard: {
    label: 'Standard',
    desc: 'Mid-range finishes, custom touches',
    basePerSqft: 2500,
    kitchenAddon: 300000,
    bathAddon: 150000,
  },
  luxury: {
    label: 'Luxury',
    desc: 'Premium materials, high-end appliances',
    basePerSqft: 4000,
    kitchenAddon: 650000,
    bathAddon: 300000,
  }
};

type TierKey = keyof typeof TIERS;

interface CostEstimatorProps {
  metadata: FloorPlanMetadata;
}

export function CostEstimator({ metadata }: CostEstimatorProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey>('standard');
  
  if (!metadata || !metadata.total_area_sqft) return null;

  const tier = TIERS[selectedTier];
  const totalSqft = metadata.total_area_sqft;
  const numKitchens = metadata.rooms.filter(r => r.type.toLowerCase().includes('kitchen')).length || 1; // Assume at least 1 kitchen if undetected
  const numBaths = metadata.num_bathrooms || 1; // Fallback to 1 if missing
  
  const baseCost = totalSqft * tier.basePerSqft;
  const kitchenCost = numKitchens * tier.kitchenAddon;
  const bathCost = numBaths * tier.bathAddon;
  
  const totalCost = baseCost + kitchenCost + bathCost;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="c-card p-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="label-sm mb-2 block">CONSTRUCTION ESTIMATOR</span>
          <h2 className="text-xl font-bold">Estimated Cost</h2>
        </div>
        
        {/* Tier Selector */}
        <div className="flex bg-[var(--c-surface)] border border-[var(--c-border)] p-1">
          {(Object.keys(TIERS) as TierKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors
                ${selectedTier === t 
                  ? 'bg-[var(--c-bg)] text-[var(--c-accent)] shadow-sm' 
                  : 'text-[var(--c-text-dim)] hover:text-[var(--c-text)]'}`}
            >
              {TIERS[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-[var(--c-text-dim)] mb-6 border-l-2 border-[var(--c-accent)] pl-4">
        {tier.desc}. Estimates are rough calculations for structural builds and may vary by specific region.
      </div>

      {/* Breakdown Table */}
      <div className="bg-[var(--c-bg)] border border-[var(--c-border)]">
        <div className="grid grid-cols-2 p-4 border-b border-[var(--c-border)] hover:bg-[var(--c-surface)] transition-colors">
          <div>
            <div className="font-semibold">Base Structure</div>
            <div className="text-xs text-[var(--c-text-muted)] mt-1">{totalSqft.toLocaleString()} sqft @ ₹{tier.basePerSqft.toLocaleString('en-IN')}/sqft</div>
          </div>
          <div className="text-right font-mono self-center">
            {formatCurrency(baseCost)}
          </div>
        </div>

        <div className="grid grid-cols-2 p-4 border-b border-[var(--c-border)] hover:bg-[var(--c-surface)] transition-colors">
          <div>
            <div className="font-semibold">Kitchen Allowances</div>
            <div className="text-xs text-[var(--c-text-muted)] mt-1">{numKitchens} Kitchen{numKitchens > 1 ? 's' : ''}</div>
          </div>
          <div className="text-right font-mono self-center">
            {formatCurrency(kitchenCost)}
          </div>
        </div>

        <div className="grid grid-cols-2 p-4 border-b border-[var(--c-border)] hover:bg-[var(--c-surface)] transition-colors">
          <div>
            <div className="font-semibold">Bathroom Allowances</div>
            <div className="text-xs text-[var(--c-text-muted)] mt-1">{numBaths} Bathroom{numBaths > 1 ? 's' : ''}</div>
          </div>
          <div className="text-right font-mono self-center">
            {formatCurrency(bathCost)}
          </div>
        </div>

        <div className="grid grid-cols-2 p-5 bg-[var(--c-surface)]">
          <div className="font-bold text-lg text-[var(--c-accent)]">TOTAL ESTIMATE</div>
          <div className="text-right font-bold text-lg text-[var(--c-accent)] font-mono">
            {formatCurrency(totalCost)}
          </div>
        </div>
      </div>
    </div>
  );
}
