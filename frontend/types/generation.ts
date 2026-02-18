// Generation Flow Types

export type GenerationStep = 'upload' | 'configure' | 'processing' | 'result';

export interface GenerationState {
  currentStep: GenerationStep;
  uploadedFile: File | null;
  imagePreviewUrl: string | null;
  selectedConstraint: string;
  jobId: string | null;
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}
