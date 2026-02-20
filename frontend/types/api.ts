// API Request and Response Types

export interface FurnitureItem {
  id: string;
  type: string;
  width: number;
  length: number;
  x: number;
  y: number;
  rotation: number;
}

export interface GenerateRequest {
  image_url: string;
  user_id: string;
  options?: {
    constraint?: string;
    num_inference_steps?: number;
    num_floors?: number;
  };
}

export interface JobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage?: string;
  progress?: number;
  created_at: string;
  updated_at?: string;
  error?: string;
}

export interface JobResult {
  job_id: string;
  output_image_url: string;
  metadata: FloorPlanMetadata;
  processing_time: number;
}

export interface RoomMetadata {
  type: string;
  polygon: number[][];
  area_sqft: number;
  dimensions: {
    width_ft: number;
    length_ft: number;
  };
  insights?: string[];
  floor: number;
  furniture?: FurnitureItem[];
}

export interface FloorPlanMetadata {
  total_area_sqft: number;
  rooms: RoomMetadata[];
  num_bedrooms: number;
  num_bathrooms: number;
  validation?: {
    spatial_consistency_score: number;
    structural_integrity: boolean;
  };
}

export interface HealthResponse {
  status: string;
  version?: string;
  timestamp?: string;
}
