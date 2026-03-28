import type { components } from "../../types/api.generated";
import type {
  AIMatchResult,
  CreatePhotoCommand,
  CreatePlacementCommand,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
  Photo,
} from "../../domain/models/koconi";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import { HttpClient } from "./http-client";

type CreatePhotoResponse = {
  ok: boolean;
  photo: components["schemas"]["Photo"];
};

type MatchPhotoResponse = {
  ok: boolean;
  result: components["schemas"]["AIMatchResult"];
};

type CreatePlacementResponse = {
  ok: boolean;
  placement: components["schemas"]["LandmarkPlacement"];
};

type ListPlacementsResponse = {
  ok: boolean;
  placements: components["schemas"]["LandmarkPlacement"][];
};

export class KoconiGatewayHttp implements KoconiGateway {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async createPhoto(command: CreatePhotoCommand): Promise<Photo> {
    const requestBody: components["schemas"]["CreatePhotoRequest"] = {
      device_id: command.deviceId,
      lat: command.lat,
      lng: command.lng,
      captured_at: command.capturedAt,
      image_key: command.imageKey,
    };

    const response = await this.httpClient.request<CreatePhotoResponse>("/v1/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    return mapPhoto(response.photo);
  }

  async matchPhoto(command: MatchPhotoCommand): Promise<AIMatchResult> {
    const formData = new FormData();
    formData.append("file", command.file);
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

    return {
      candidates: response.result.candidates.map((candidate) => ({
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

    return mapPlacement(response.placement);
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

    return response.placements.map(mapPlacement);
  }
}

function mapPhoto(photo: components["schemas"]["Photo"]): Photo {
  return {
    id: photo.id,
    deviceId: photo.device_id,
    lat: photo.lat,
    lng: photo.lng,
    capturedAt: photo.captured_at,
    imageKey: photo.image_key,
    createdAt: photo.created_at,
  };
}

function mapPlacement(placement: components["schemas"]["LandmarkPlacement"]): LandmarkPlacement {
  return {
    id: placement.id,
    photoId: placement.photo_id,
    assetId: placement.asset_id,
    lat: placement.lat,
    lng: placement.lng,
    scale: placement.scale,
    rotation: toRotation(placement.rotation),
    matchScore: placement.match_score ?? null,
    createdAt: placement.created_at,
  };
}

function toRotation(values: number[]): [number, number, number] {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}
