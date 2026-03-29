export type Memory = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
};

export type Photo = {
  id: number;
  deviceId: string;
  lat: number;
  lng: number;
  capturedAt: string;
  imageKey: string;
  createdAt: string;
};

export type AICandidate = {
  assetId: string;
  matchScore: number;
  suggestedScale: number;
  suggestedRotation: [number, number, number];
};

export type AIMatchResult = {
  candidates: AICandidate[];
};

export type LandmarkPlacement = {
  id: number;
  photoId: number;
  assetId: string;
  lat: number;
  lng: number;
  scale: number;
  rotation: [number, number, number];
  matchScore: number | null;
  createdAt: string;
};

export type CreatePhotoCommand = {
  deviceId: string;
  lat: number;
  lng: number;
  capturedAt: string;
  imageKey: string;
};

export type MatchPhotoCommand = {
  photoId: number;
  file: Blob;
  lat?: number;
  lng?: number;
  k?: number;
};

export type CreatePlacementCommand = {
  photoId: number;
  assetId: string;
  lat: number;
  lng: number;
  scale: number;
  rotation: [number, number, number];
  matchScore?: number;
};

export type ListPlacementsByBoundsQuery = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  limit?: number;
};
