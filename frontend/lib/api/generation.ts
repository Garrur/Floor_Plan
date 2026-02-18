import apiClient from './client';
import { GenerateRequest, JobResponse, JobResult } from '@/types/api';

/**
 * Submit a new floor plan generation job
 */
export async function submitGenerationJob(
  data: GenerateRequest
): Promise<JobResponse> {
  const response = await apiClient.post<JobResponse>('/generate', data);
  return response.data;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const response = await apiClient.get<JobResponse>(`/jobs/${jobId}`);
  return response.data;
}

/**
 * Get job result (when completed)
 */
export async function getJobResult(jobId: string): Promise<JobResult> {
  const response = await apiClient.get<JobResult>(`/jobs/${jobId}/result`);
  return response.data;
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId: string): Promise<JobResponse[]> {
  const response = await apiClient.get<JobResponse[]>(`/users/${userId}/jobs`);
  return response.data;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}
