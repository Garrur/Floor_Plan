'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { submitGenerationJob, getJobStatus, getJobResult } from '@/lib/api/generation';
import { GenerateRequest } from '@/types/api';

/**
 * Hook to submit a generation job
 */
export function useGeneration() {
  return useMutation({
    mutationFn: async (data: GenerateRequest) => {
      return await submitGenerationJob(data);
    },
  });
}

/**
 * Hook to poll job status with automatic refetching
 */
export function useJobStatus(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('No job ID provided');
      return await getJobStatus(jobId);
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

/**
 * Hook to fetch job result
 */
export function useJobResult(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['result', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('No job ID provided');
      return await getJobResult(jobId);
    },
    enabled: enabled && !!jobId,
    retry: 1,
  });
}
