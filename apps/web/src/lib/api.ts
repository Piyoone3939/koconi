import type { LandmarkPlacement, MatchResult, Photo } from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL as string

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function fetchPlacementsByBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  limit = 100,
): Promise<LandmarkPlacement[]> {
  const params = new URLSearchParams({
    min_lat: String(minLat),
    max_lat: String(maxLat),
    min_lng: String(minLng),
    max_lng: String(maxLng),
    limit: String(limit),
  })
  const res = await fetch(`${BASE}/v1/placements?${params}`)
  const data = await handleResponse<{ placements: LandmarkPlacement[] }>(res)
  return data.placements ?? []
}

export async function createPhoto(
  file: File,
  deviceId: string,
  lat: number,
  lng: number,
): Promise<Photo> {
  const form = new FormData()
  form.append('file', file)
  form.append('device_id', deviceId)
  form.append('lat', String(lat))
  form.append('lng', String(lng))
  form.append('captured_at', new Date().toISOString())
  form.append('image_key', `web/${deviceId}/${Date.now()}_${file.name}`)

  const res = await fetch(`${BASE}/v1/photos`, { method: 'POST', body: form })
  const data = await handleResponse<{ photo: Photo }>(res)
  return data.photo
}

export async function matchPhoto(
  photoId: number,
  file: File,
  lat: number,
  lng: number,
): Promise<MatchResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('lat', String(lat))
  form.append('lng', String(lng))
  form.append('k', '3')

  const res = await fetch(`${BASE}/v1/photos/${photoId}/match`, {
    method: 'POST',
    body: form,
  })
  const data = await handleResponse<{ result: MatchResult }>(res)
  return data.result
}

export async function createPlacement(params: {
  photoId: number
  assetId: string
  lat: number
  lng: number
  scale: number
  rotation: number[]
  matchScore: number | null
  modelUrl: string
}): Promise<LandmarkPlacement> {
  const res = await fetch(`${BASE}/v1/placements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photo_id: params.photoId,
      asset_id: params.assetId,
      lat: params.lat,
      lng: params.lng,
      scale: params.scale,
      rotation: params.rotation,
      match_score: params.matchScore,
      model_url: params.modelUrl,
    }),
  })
  const data = await handleResponse<{ placement: LandmarkPlacement }>(res)
  return data.placement
}
