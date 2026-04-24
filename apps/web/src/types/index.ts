export type LandmarkPlacement = {
  id: number
  photo_id: number
  asset_id: string
  lat: number
  lng: number
  scale: number
  rotation: number[]
  match_score: number | null
  model_url: string
  created_at: string
}

export type Photo = {
  id: number
  device_id: string
  lat: number
  lng: number
  captured_at: string
  image_key: string
  ai_job_id: string
  created_at: string
}

export type MatchCandidate = {
  asset_id: string
  match_score: number
  suggested_scale: number
  suggested_rotation: number[]
}

export type MatchResult = {
  photo_id: number
  candidates: MatchCandidate[]
}
