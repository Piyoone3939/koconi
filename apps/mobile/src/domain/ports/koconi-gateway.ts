import type {
  AIMatchResult,
  AppStats,
  CreatePhotoCommand,
  CreatePlacementCommand,
  FriendRequest,
  KoconiUser,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
  Photo,
  Photo3DStatus,
  RegisterUserCommand,
  SendFriendRequestCommand,
} from "../models/koconi";

export interface KoconiGateway {
  createPhoto(command: CreatePhotoCommand): Promise<Photo>;
  matchPhoto(command: MatchPhotoCommand): Promise<AIMatchResult>;
  createPlacement(command: CreatePlacementCommand): Promise<LandmarkPlacement>;
  listPlacementsByBounds(query: ListPlacementsByBoundsQuery): Promise<LandmarkPlacement[]>;
  getPhoto3DStatus(photoId: number): Promise<Photo3DStatus>;
  getStats(): Promise<AppStats>;
  registerUser(command: RegisterUserCommand): Promise<KoconiUser>;
  searchUser(tag: string): Promise<KoconiUser | null>;
  sendFriendRequest(command: SendFriendRequestCommand): Promise<FriendRequest>;
  listFriends(deviceId: string): Promise<KoconiUser[]>;
  listIncomingRequests(deviceId: string): Promise<FriendRequest[]>;
  acceptFriendRequest(deviceId: string, requestId: number): Promise<void>;
  rejectFriendRequest(deviceId: string, requestId: number): Promise<void>;
}
