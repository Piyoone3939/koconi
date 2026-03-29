import type {
  AIMatchResult,
  CreatePhotoCommand,
  CreatePlacementCommand,
  LandmarkPlacement,
  ListPlacementsByBoundsQuery,
  MatchPhotoCommand,
  Photo,
} from "../models/koconi";

export interface KoconiGateway {
  createPhoto(command: CreatePhotoCommand): Promise<Photo>;
  matchPhoto(command: MatchPhotoCommand): Promise<AIMatchResult>;
  createPlacement(command: CreatePlacementCommand): Promise<LandmarkPlacement>;
  listPlacementsByBounds(query: ListPlacementsByBoundsQuery): Promise<LandmarkPlacement[]>;
}
