import type { components } from "../../types/api.generated";
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
  Trip,
  UpdateUserCommand,
} from "../../domain/models/koconi";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import { HttpClient } from "./http-client";

type CreatePhotoResponse = {
  ok: boolean;
  photo: components["schemas"]["Photo"];
  data?: {
    photo?: components["schemas"]["Photo"];
  };
};

type MatchPhotoResponse = {
  ok: boolean;
  result: components["schemas"]["AIMatchResult"];
  data?: {
    result?: components["schemas"]["AIMatchResult"];
  };
};

type CreatePlacementResponse = {
  ok: boolean;
  placement: components["schemas"]["LandmarkPlacement"];
  data?: {
    placement?: components["schemas"]["LandmarkPlacement"];
  };
};

type ListPlacementsResponse = {
  ok: boolean;
  placements: components["schemas"]["LandmarkPlacement"][];
  data?: {
    placements?: components["schemas"]["LandmarkPlacement"][];
  };
};

export class KoconiGatewayHttp implements KoconiGateway {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async createPhoto(command: CreatePhotoCommand): Promise<Photo> {
    let response: CreatePhotoResponse;

    if (command.file) {
      // 画像ファイルあり: multipart送信（サーバー側でAI 3Dモデル生成を自動実行）
      const formData = new FormData();
      formData.append("device_id", command.deviceId);
      formData.append("lat", String(command.lat));
      formData.append("lng", String(command.lng));
      formData.append("captured_at", command.capturedAt);
      formData.append("image_key", command.imageKey);
      formData.append("file", command.file as unknown as Blob);

      response = await this.httpClient.request<CreatePhotoResponse>("/v1/photos", {
        method: "POST",
        body: formData,
      });
    } else {
      // 画像なし: JSON送信（後方互換）
      const requestBody: components["schemas"]["CreatePhotoRequest"] = {
        device_id: command.deviceId,
        lat: command.lat,
        lng: command.lng,
        captured_at: command.capturedAt,
        image_key: command.imageKey,
      };

      response = await this.httpClient.request<CreatePhotoResponse>("/v1/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    }

    const photo = response.photo ?? response.data?.photo;
    if (!photo) {
      throw new Error("Invalid API response: photo is missing");
    }
    const mapped = mapPhoto(photo);
    if (!mapped.id) {
      throw new Error("Invalid API response: photo.id is missing");
    }

    return mapped;
  }

  async matchPhoto(command: MatchPhotoCommand): Promise<AIMatchResult> {
    const formData = new FormData();
    formData.append("file", command.file as unknown as Blob);
    if (typeof command.lat === "number") {
      formData.append("lat", String(command.lat));
    }
    if (typeof command.lng === "number") {
      formData.append("lng", String(command.lng));
    }
    if (typeof command.k === "number") {
      formData.append("k", String(command.k));
    }

    const response = await this.httpClient.request<MatchPhotoResponse>(`/v1/photos/${command.photoId}/match`, {
      method: "POST",
      body: formData,
    });

    const result = response.result ?? response.data?.result;
    if (!result || !Array.isArray(result.candidates)) {
      throw new Error("Invalid API response: result.candidates is missing");
    }

    return {
      candidates: result.candidates.map((candidate) => ({
        assetId: candidate.asset_id,
        matchScore: candidate.match_score,
        suggestedScale: candidate.suggested_scale,
        suggestedRotation: toRotation(candidate.suggested_rotation),
      })),
    };
  }

  async createPlacement(command: CreatePlacementCommand): Promise<LandmarkPlacement> {
    const requestBody: components["schemas"]["CreatePlacementRequest"] = {
      photo_id: command.photoId,
      asset_id: command.assetId,
      lat: command.lat,
      lng: command.lng,
      scale: command.scale,
      rotation: command.rotation,
      match_score: command.matchScore,
    };

    const response = await this.httpClient.request<CreatePlacementResponse>("/v1/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const placement = response.placement ?? response.data?.placement;
    if (!placement) {
      throw new Error("Invalid API response: placement is missing");
    }

    return mapPlacement(placement);
  }

  async getPhoto3DStatus(photoId: number): Promise<Photo3DStatus> {
    const response = await this.httpClient.request<{
      ok: boolean;
      status: string;
      model_url: string;
      placement_id: number;
    }>(`/v1/photos/${photoId}/3d_status`);

    return {
      status: (response.status ?? "failed") as Photo3DStatus["status"],
      modelUrl: response.model_url ?? "",
      placementId: response.placement_id ?? 0,
    };
  }

  async getStats(): Promise<AppStats> {
    const response = await this.httpClient.request<{
      ok: boolean;
      photo_count: number;
      placement_count: number;
    }>("/v1/stats");

    return {
      photoCount: response.photo_count ?? 0,
      placementCount: response.placement_count ?? 0,
    };
  }

  async registerUser(command: RegisterUserCommand): Promise<KoconiUser> {
    const response = await this.httpClient.request<{ ok: boolean; user: RawUser }>("/v1/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId }),
    });
    return mapUser(response.user);
  }

  async searchUser(tag: string): Promise<KoconiUser | null> {
    try {
      const response = await this.httpClient.request<{ ok: boolean; user: RawUser }>("/v1/users/search", {
        query: { tag },
      });
      return mapUser(response.user);
    } catch {
      return null;
    }
  }

  async sendFriendRequest(command: SendFriendRequestCommand): Promise<FriendRequest> {
    const response = await this.httpClient.request<{ ok: boolean; request: RawFriendRequest }>("/v1/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId, to_tag: command.toTag }),
    });
    return mapFriendRequest(response.request);
  }

  async listFriends(deviceId: string): Promise<KoconiUser[]> {
    const response = await this.httpClient.request<{ ok: boolean; friends: RawUser[] }>("/v1/friends", {
      query: { device_id: deviceId },
    });
    return (response.friends ?? []).map(mapUser);
  }

  async listIncomingRequests(deviceId: string): Promise<FriendRequest[]> {
    const response = await this.httpClient.request<{ ok: boolean; requests: RawFriendRequest[] }>(
      "/v1/friends/requests/incoming",
      { query: { device_id: deviceId } },
    );
    return (response.requests ?? []).map(mapFriendRequest);
  }

  async acceptFriendRequest(deviceId: string, requestId: number): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/friends/requests/${requestId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }

  async rejectFriendRequest(deviceId: string, requestId: number): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/friends/requests/${requestId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }

  async listPlacementsByUserTag(userTag: string, limit = 200): Promise<LandmarkPlacement[]> {
    const response = await this.httpClient.request<ListPlacementsResponse>("/v1/placements", {
      query: { user_tag: userTag, limit },
    });
    const placements = response.placements ?? response.data?.placements;
    if (!Array.isArray(placements)) return [];
    return placements.map(mapPlacement);
  }

  async createSharedMap(command: CreateSharedMapCommand): Promise<SharedMap> {
    const response = await this.httpClient.request<{ ok: boolean; map: RawSharedMap }>("/v1/shared-maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId, name: command.name }),
    });
    return mapSharedMap(response.map);
  }

  async listSharedMaps(deviceId: string): Promise<SharedMap[]> {
    const response = await this.httpClient.request<{ ok: boolean; maps: RawSharedMap[] }>("/v1/shared-maps", {
      query: { device_id: deviceId },
    });
    return (response.maps ?? []).map(mapSharedMap);
  }

  async addSharedMapMember(command: AddSharedMapMemberCommand): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/shared-maps/${command.mapId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId, member_tag: command.memberTag }),
    });
  }

  async addSharedMapPlacement(command: AddSharedMapPlacementCommand): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/shared-maps/${command.mapId}/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId, placement_id: command.placementId }),
    });
  }

  async listSharedMapPlacements(deviceId: string, mapId: number): Promise<LandmarkPlacement[]> {
    const response = await this.httpClient.request<ListPlacementsResponse>(
      `/v1/shared-maps/${mapId}/placements`,
      { query: { device_id: deviceId } },
    );
    const placements = response.placements ?? response.data?.placements;
    if (!Array.isArray(placements)) return [];
    return placements.map(mapPlacement);
  }

  async createComment(command: CreateCommentCommand): Promise<Comment> {
    const response = await this.httpClient.request<{ ok: boolean; comment: RawComment }>("/v1/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: command.deviceId,
        target_type: command.targetType,
        target_id: command.targetId,
        body: command.body,
      }),
    });
    return mapComment(response.comment);
  }

  async listComments(targetType: "photo" | "placement" | "trip", targetId: number): Promise<Comment[]> {
    const response = await this.httpClient.request<{ ok: boolean; comments: RawComment[] }>("/v1/comments", {
      query: { target_type: targetType, target_id: targetId },
    });
    return (response.comments ?? []).map(mapComment);
  }

  async deleteComment(command: DeleteCommentCommand): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/comments/${command.commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId }),
    });
  }

  async search(
    query: string,
    types?: Array<"user" | "trip" | "placement">,
    deviceId?: string,
  ): Promise<SearchResult> {
    const params: Record<string, string | number | boolean | null | undefined> = { query };
    if (types && types.length > 0) params.type = types.join(",");
    if (deviceId) params.device_id = deviceId;

    const response = await this.httpClient.request<{
      ok: boolean;
      result: {
        users: RawUser[];
        trips: RawTrip[];
        placements: components["schemas"]["LandmarkPlacement"][];
      };
    }>("/v1/search", { query: params });

    return {
      users: (response.result.users ?? []).map(mapUser),
      trips: (response.result.trips ?? []).map(mapTrip),
      placements: (response.result.placements ?? []).map(mapPlacement),
    };
  }

  async getUser(userId: number): Promise<KoconiUser> {
    const response = await this.httpClient.request<{ ok: boolean; user: RawUser }>(`/v1/users/${userId}`);
    return mapUser(response.user);
  }

  async updateUser(command: UpdateUserCommand): Promise<KoconiUser> {
    const response = await this.httpClient.request<{ ok: boolean; user: RawUser }>(`/v1/users/${command.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: command.deviceId, display_name: command.displayName }),
    });
    return mapUser(response.user);
  }

  async createTrip(command: import("../../domain/models/koconi").CreateTripCommand): Promise<import("../../domain/models/koconi").Trip> {
    const response = await this.httpClient.request<{ ok: boolean; trip: RawTrip }>("/v1/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: command.deviceId,
        title: command.title,
        description: command.description ?? "",
        start_at: command.startAt ?? null,
        end_at: command.endAt ?? null,
        privacy_level: command.privacyLevel ?? "private",
      }),
    });
    return mapTrip(response.trip);
  }

  async updateTrip(deviceId: string, tripId: number, command: Omit<import("../../domain/models/koconi").CreateTripCommand, "deviceId">): Promise<import("../../domain/models/koconi").Trip> {
    const response = await this.httpClient.request<{ ok: boolean; trip: RawTrip }>(`/v1/trips/${tripId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        title: command.title,
        description: command.description ?? "",
        start_at: command.startAt ?? null,
        end_at: command.endAt ?? null,
        privacy_level: command.privacyLevel ?? "private",
      }),
    });
    return mapTrip(response.trip);
  }

  async deleteTrip(deviceId: string, tripId: number): Promise<void> {
    await this.httpClient.request<{ ok: boolean }>(`/v1/trips/${tripId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
  }

  async getTrip(deviceId: string, tripId: number): Promise<import("../../domain/models/koconi").Trip> {
    const response = await this.httpClient.request<{ ok: boolean; trip: RawTrip }>(
      `/v1/trips/${tripId}`,
      { query: { device_id: deviceId } },
    );
    return mapTrip(response.trip);
  }

  async listTrips(deviceId: string): Promise<import("../../domain/models/koconi").Trip[]> {
    const response = await this.httpClient.request<{ ok: boolean; trips: RawTrip[] | null }>(
      "/v1/trips",
      { query: { device_id: deviceId } },
    );
    return (response.trips ?? []).map(mapTrip);
  }

  async createScene(command: import("../../domain/models/koconi").CreateSceneCommand): Promise<import("../../domain/models/koconi").PlacementScene> {
    const response = await this.httpClient.request<{ ok: boolean; scene: RawScene }>(
      `/v1/placements/${command.placementId}/scenes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: command.deviceId,
          direction: command.direction,
          image_key: command.imageKey,
        }),
      },
    );
    return mapScene(response.scene);
  }

  async listScenes(deviceId: string, placementId: number): Promise<import("../../domain/models/koconi").PlacementScene[]> {
    const response = await this.httpClient.request<{ ok: boolean; scenes: RawScene[] | null }>(
      `/v1/placements/${placementId}/scenes`,
      { query: { device_id: deviceId } },
    );
    return (response.scenes ?? []).map(mapScene);
  }

  async setPremium(deviceId: string, userId: number, isPremium: boolean): Promise<KoconiUser> {
    const response = await this.httpClient.request<{ ok: boolean; user: RawUser }>(`/v1/users/${userId}/premium`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, is_premium: isPremium }),
    });
    return mapUser(response.user);
  }

  async listPlacementsByBounds(query: ListPlacementsByBoundsQuery): Promise<LandmarkPlacement[]> {
    const response = await this.httpClient.request<ListPlacementsResponse>("/v1/placements", {
      query: {
        min_lat: query.minLat,
        max_lat: query.maxLat,
        min_lng: query.minLng,
        max_lng: query.maxLng,
        limit: query.limit,
      },
    });

    const placements = response.placements ?? response.data?.placements;
    if (!Array.isArray(placements)) {
      throw new Error("Invalid API response: placements is missing");
    }

    return placements.map(mapPlacement);
  }
}

function mapPhoto(photo: components["schemas"]["Photo"]): Photo {
  const source = photo as unknown as Record<string, unknown>;
  return {
    id: toNumber(source.id ?? source.ID),
    deviceId: toString(source.device_id ?? source.DeviceID),
    lat: toNumber(source.lat ?? source.Lat),
    lng: toNumber(source.lng ?? source.Lng),
    capturedAt: toString(source.captured_at ?? source.CapturedAt),
    imageKey: toString(source.image_key ?? source.ImageKey),
    aiJobId: toString(source.ai_job_id ?? source.AIJobID),
    createdAt: toString(source.created_at ?? source.CreatedAt),
  };
}

function mapPlacement(placement: components["schemas"]["LandmarkPlacement"]): LandmarkPlacement {
  const source = placement as unknown as Record<string, unknown>;
  return {
    id: toNumber(source.id ?? source.ID),
    photoId: toNumber(source.photo_id ?? source.PhotoID),
    assetId: toString(source.asset_id ?? source.AssetID),
    lat: toNumber(source.lat ?? source.Lat),
    lng: toNumber(source.lng ?? source.Lng),
    scale: toNumber(source.scale ?? source.Scale),
    rotation: toRotation((source.rotation ?? source.Rotation ?? []) as number[]),
    matchScore: toNullableNumber(source.match_score ?? source.MatchScore),
    modelUrl: toString(source.model_url ?? source.ModelURL),
    createdAt: toString(source.created_at ?? source.CreatedAt),
  };
}

type RawUser = {
  id: number;
  display_name: string;
  user_tag: string;
  is_premium?: boolean;
};

type RawFriendRequest = {
  id: number;
  from_user: RawUser;
  to_user: RawUser;
  status: "pending" | "accepted" | "rejected";
};

function mapUser(u: RawUser): KoconiUser {
  return {
    id: toNumber(u.id),
    displayName: toString(u.display_name),
    userTag: toString(u.user_tag),
    isPremium: u.is_premium ?? false,
  };
}

function mapFriendRequest(r: RawFriendRequest): FriendRequest {
  return {
    id: toNumber(r.id),
    fromUser: mapUser(r.from_user),
    toUser: mapUser(r.to_user),
    status: r.status ?? "pending",
  };
}

function toRotation(values: number[]): [number, number, number] {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

type RawSharedMap = {
  id: number;
  name: string;
  owner_user_id: number;
  created_at: string;
};

type RawTrip = {
  id: number;
  owner_user_id: number;
  title: string;
  description: string;
  start_at: string | null;
  end_at: string | null;
  privacy_level: string;
  created_at: string;
};

function mapTrip(t: RawTrip): Trip {
  return {
    id: toNumber(t.id),
    ownerUserId: toNumber(t.owner_user_id),
    title: toString(t.title),
    description: toString(t.description),
    startAt: t.start_at ?? null,
    endAt: t.end_at ?? null,
    privacyLevel: toString(t.privacy_level),
    createdAt: toString(t.created_at),
  };
}

type RawComment = {
  id: number;
  user_id: number;
  display_name: string;
  target_type: "photo" | "placement" | "trip";
  target_id: number;
  body: string;
  created_at: string;
};

function mapComment(c: RawComment): Comment {
  return {
    id: toNumber(c.id),
    userId: toNumber(c.user_id),
    displayName: toString(c.display_name),
    targetType: c.target_type,
    targetId: toNumber(c.target_id),
    body: toString(c.body),
    createdAt: toString(c.created_at),
  };
}

type RawScene = {
  id: number;
  placement_id: number;
  user_id: number;
  direction: "N" | "E" | "S" | "W";
  image_key: string;
  created_at: string;
};

function mapScene(s: RawScene): import("../../domain/models/koconi").PlacementScene {
  return {
    id: toNumber(s.id),
    placementId: toNumber(s.placement_id),
    userId: toNumber(s.user_id),
    direction: s.direction,
    imageKey: toString(s.image_key),
    createdAt: toString(s.created_at),
  };
}

function mapSharedMap(m: RawSharedMap): SharedMap {
  return {
    id: toNumber(m.id),
    name: toString(m.name),
    ownerUserId: toNumber(m.owner_user_id),
    createdAt: toString(m.created_at),
  };
}
