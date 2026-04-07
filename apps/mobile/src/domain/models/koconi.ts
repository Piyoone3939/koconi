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
  aiJobId: string; // AI 3Dモデル生成ジョブID（空文字の場合は未開始）
  createdAt: string;
};

export type Photo3DStatus = {
  status: "not_started" | "pending" | "processing" | "done" | "failed" | "not_found";
  modelUrl: string;
  placementId: number;
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
  modelUrl: string; // 3DモデルのURL（空文字の場合はモデルなし）
  createdAt: string;
};

export type CreatePhotoCommand = {
  deviceId: string;
  lat: number;
  lng: number;
  capturedAt: string;
  imageKey: string;
  file?: Blob | { uri: string; name: string; type: string }; // 3Dモデル生成用の画像
};

export type MatchPhotoCommand = {
  photoId: number;
  file: Blob | { uri: string; name: string; type: string };
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
  modelUrl?: string;
};

export type AppStats = {
  photoCount: number;
  placementCount: number;
};

export type KoconiUser = {
  id: number;
  displayName: string;
  userTag: string;
};

export type FriendRequest = {
  id: number;
  fromUser: KoconiUser;
  toUser: KoconiUser;
  status: "pending" | "accepted" | "rejected";
};

export type RegisterUserCommand = {
  deviceId: string;
};

export type SendFriendRequestCommand = {
  deviceId: string;
  toTag: string;
};

export type ListPlacementsByBoundsQuery = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  limit?: number;
};
