import { create } from 'zustand';
import { GenerationState } from '@/types/generation';

interface GenerationStore extends GenerationState {
  setStep: (step: GenerationState['currentStep']) => void;
  setUploadedFile: (file: File | null) => void;
  setImagePreviewUrl: (url: string | null) => void;
  setConstraint: (constraint: string) => void;
  setJobId: (jobId: string | null) => void;
  reset: () => void;
}

const initialState: GenerationState = {
  currentStep: 'upload',
  uploadedFile: null,
  imagePreviewUrl: null,
  selectedConstraint: 'custom',
  jobId: null,
};

export const useGenerationStore = create<GenerationStore>((set) => ({
  ...initialState,
  
  setStep: (step) => set({ currentStep: step }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setImagePreviewUrl: (url) => set({ imagePreviewUrl: url }),
  setConstraint: (constraint) => set({ selectedConstraint: constraint }),
  setJobId: (jobId) => set({ jobId }),
  reset: () => set(initialState),
}));
