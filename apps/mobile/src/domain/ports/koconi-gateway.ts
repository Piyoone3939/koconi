import type {
  AddSharedMapMemberCommand,
  AddSharedMapPlacementCommand,
  AIMatchResult,
  AppStats,
  CreatePhotoCommand,
  CreatePlacementCommand,
  CreateSharedMapCommand,
  FriendRequest,
  KoconiUser,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
  Photo,
  Photo3DStatus,
  RegisterUserCommand,
  SendFriendRequestCommand,
  SharedMap,
} from "../models/koconi";

export interface KoconiGateway {
  createPhoto(command: CreatePhotoCommand): Promise<Photo>;
  matchPhoto(command: MatchPhotoCommand): Promise<AIMatchResult>;
  createPlacement(command: CreatePlacementCommand): Promise<LandmarkPlacement>;
  listPlacementsByBounds(query: ListPlacementsByBoundsQuery): Promise<LandmarkPlacement[]>;
  listPlacementsByUserTag(userTag: string, limit?: number): Promise<LandmarkPlacement[]>;
  getPhoto3DStatus(photoId: number): Promise<Photo3DStatus>;
  getStats(): Promise<AppStats>;
  registerUser(command: RegisterUserCommand): Promise<KoconiUser>;
  searchUser(tag: string): Promise<KoconiUser | null>;
  sendFriendRequest(command: SendFriendRequestCommand): Promise<FriendRequest>;
  listFriends(deviceId: string): Promise<KoconiUser[]>;
  listIncomingRequests(deviceId: string): Promise<FriendRequest[]>;
  acceptFriendRequest(deviceId: string, requestId: number): Promise<void>;
  rejectFriendRequest(deviceId: string, requestId: number): Promise<void>;
  createSharedMap(command: CreateSharedMapCommand): Promise<SharedMap>;
  listSharedMaps(deviceId: string): Promise<SharedMap[]>;
  addSharedMapMember(command: AddSharedMapMemberCommand): Promise<void>;
  addSharedMapPlacement(command: AddSharedMapPlacementCommand): Promise<void>;
  listSharedMapPlacements(deviceId: string, mapId: number): Promise<LandmarkPlacement[]>;
}
