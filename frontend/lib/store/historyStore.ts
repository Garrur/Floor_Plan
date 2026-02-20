import { create } from 'zustand';
import { FloorPlanMetadata } from '@/types/api';

export interface HistoryEntry {
  jobId: string;
  imageUrl: string;
  metadata?: FloorPlanMetadata;
  createdAt: string;
  constraint?: string;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (jobId: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'floorplan-history';

function loadFromStorage(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: loadFromStorage(),

  addEntry: (entry) => {
    const current = get().entries;
    // Don't add duplicates
    if (current.some(e => e.jobId === entry.jobId)) return;
    const updated = [entry, ...current].slice(0, 50); // Keep max 50
    saveToStorage(updated);
    set({ entries: updated });
  },

  removeEntry: (jobId) => {
    const updated = get().entries.filter(e => e.jobId !== jobId);
    saveToStorage(updated);
    set({ entries: updated });
  },

  clearHistory: () => {
    saveToStorage([]);
    set({ entries: [] });
  },
}));
