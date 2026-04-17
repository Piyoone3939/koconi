import type {
  AddSharedMapMemberCommand,
  AddSharedMapPlacementCommand,
  AIMatchResult,
  AppStats,
  Comment,
  CreateCommentCommand,
  CreatePhotoCommand,
  CreatePlacementCommand,
  CreateSharedMapCommand,
  DeleteCommentCommand,
  FriendRequest,
  KoconiUser,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
  Photo,
  Photo3DStatus,
  RegisterUserCommand,
  SearchResult,
  SendFriendRequestCommand,
  SharedMap,
  UpdateUserCommand,
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
  getUser(userId: number): Promise<KoconiUser>;
  updateUser(command: UpdateUserCommand): Promise<KoconiUser>;
  createComment(command: CreateCommentCommand): Promise<Comment>;
  listComments(targetType: "photo" | "placement" | "trip", targetId: number): Promise<Comment[]>;
  deleteComment(command: DeleteCommentCommand): Promise<void>;
  search(query: string, types?: Array<"user" | "trip" | "placement">, deviceId?: string): Promise<SearchResult>;
}
