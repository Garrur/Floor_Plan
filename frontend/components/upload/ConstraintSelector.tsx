'use client';

import { useState } from 'react';

interface ConstraintSelectorProps {
  onSelect: (constraint: string) => void;
  defaultValue?: string;
}

const PRESETS = [
  { value: '1bhk', label: '1 BHK', desc: '1 Bedroom, Kitchen, Hall' },
  { value: '2bhk', label: '2 BHK', desc: '2 Bedrooms, Kitchen, Hall' },
  { value: '3bhk', label: '3 BHK', desc: '3 Bedrooms, Kitchen, Hall' },
  { value: 'custom', label: 'AUTO', desc: 'AI determines layout' },
];

export function ConstraintSelector({ onSelect, defaultValue = 'custom' }: ConstraintSelectorProps) {
  const [selected, setSelected] = useState<string>(defaultValue);

  const handleSelect = (value: string) => {
    setSelected(value);
    onSelect(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--c-border)]">
      {PRESETS.map((preset) => {
        const isSelected = selected === preset.value;

        return (
          <button
            key={preset.value}
            onClick={() => handleSelect(preset.value)}
            className={`relative p-6 text-left transition-all duration-300
              ${isSelected 
                ? 'bg-[var(--c-surface-2)]' 
                : 'bg-[var(--c-surface)] hover:bg-[var(--c-surface-2)]'}`}
          >
            {/* Active indicator */}
            {isSelected && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--c-accent)]" />
            )}

            <div className={`text-lg font-bold tracking-wide mb-1 transition-colors ${isSelected ? 'text-[var(--c-accent)]' : 'text-[var(--c-text)]'}`}>
              {preset.label}
            </div>
            <div className="text-[10px] text-[var(--c-text-muted)] tracking-wide uppercase">
              {preset.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}
