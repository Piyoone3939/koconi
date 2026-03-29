import type {
  CreatePhotoCommand,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
} from "../../domain/models/koconi";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

export async function createPhotoAndMatch(
  gateway: KoconiGateway,
  createPhotoCommand: CreatePhotoCommand,
  matchInput: Omit<MatchPhotoCommand, "photoId">,
) {
  const photo = await gateway.createPhoto(createPhotoCommand);
  const matchResult = await gateway.matchPhoto({
    photoId: photo.id,
    file: matchInput.file,
    lat: matchInput.lat,
    lng: matchInput.lng,
    k: matchInput.k,
  });

  return { photo, matchResult };
}

export async function createPlacementFromTopCandidate(
  gateway: KoconiGateway,
  params: {
    photoId: number;
    lat: number;
    lng: number;
    scale?: number;
  },
  matchResult: Awaited<ReturnType<typeof createPhotoAndMatch>>["matchResult"],
): Promise<LandmarkPlacement | null> {
  const topCandidate = matchResult.candidates[0];
  if (!topCandidate) {
    return null;
  }

  return gateway.createPlacement({
    photoId: params.photoId,
    assetId: topCandidate.assetId,
    lat: params.lat,
    lng: params.lng,
    scale: params.scale ?? topCandidate.suggestedScale,
    rotation: topCandidate.suggestedRotation,
    matchScore: topCandidate.matchScore,
  });
}

export function listPlacements(gateway: KoconiGateway, query: ListPlacementsByBoundsQuery) {
  return gateway.listPlacementsByBounds(query);
}
