export enum AppState {
  IDLE = 'IDLE',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  ITINERARY = 'ITINERARY',
  CONTRIBUTE = 'CONTRIBUTE',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface TourResult {
  landmarkName: string;
  description: string;
  imageUri: string;
  audioData?: string; // Base64 audio or Blob URL
  sources: GroundingChunk[];
}

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export interface ItineraryItem {
  stopName: string;
  description: string;
  duration: string;
}