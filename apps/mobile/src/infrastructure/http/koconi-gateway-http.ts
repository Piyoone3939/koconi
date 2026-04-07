import type { components } from "../../types/api.generated";
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
