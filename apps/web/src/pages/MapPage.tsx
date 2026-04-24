import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPhoto,
  createPlacement,
  fetchPlacementsByBounds,
  matchPhoto,
} from '../lib/api'
import { getDeviceId } from '../lib/deviceId'
import type { LandmarkPlacement, MatchCandidate, MatchResult } from '../types'
import MatchResultModal from '../components/MatchResultModal'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string

type Status = 'idle' | 'uploading' | 'matching' | 'placing'

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [matchResult, setMatchResult] = useState<(MatchResult & { file: File; lat: number; lng: number }) | null>(null)

  const addMarker = useCallback((p: LandmarkPlacement) => {
    if (!map.current || markers.current.has(p.id)) return

    const el = document.createElement('div')
    el.className = 'w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer'
    el.innerHTML = '<span style="font-size:14px">📍</span>'

    const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
      `<div class="text-xs p-1">
        <div class="font-bold">${p.asset_id}</div>
        <div class="text-gray-500">score: ${p.match_score?.toFixed(2) ?? '-'}</div>
      </div>`
    )

    const marker = new mapboxgl.Marker(el)
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map.current)

    markers.current.set(p.id, marker)
  }, [])

  const loadPlacements = useCallback(async () => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    if (!bounds) return

    try {
      const placements = await fetchPlacementsByBounds(
        bounds.getSouth(),
        bounds.getNorth(),
        bounds.getWest(),
        bounds.getEast(),
      )
      placements.forEach(addMarker)
    } catch {
      // APIが起動していない場合は静かに失敗
    }
  }, [addMarker])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [139.6917, 35.6895],
      zoom: 10,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({ trackUserLocation: true }),
      'top-right',
    )

    map.current.on('moveend', loadPlacements)
    map.current.on('load', loadPlacements)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [loadPlacements])

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('位置情報が使えません'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // GPS失敗時は地図中心を使用
          const center = map.current?.getCenter()
          resolve({ lat: center?.lat ?? 35.6895, lng: center?.lng ?? 139.6917 })
        },
      )
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const { lat, lng } = await getCurrentLocation()

      setStatus('uploading')
      toast('写真をアップロード中...')
      const photo = await createPhoto(file, getDeviceId(), lat, lng)

      setStatus('matching')
      toast('AIがランドマークを判定中...')
      const result = await matchPhoto(photo.id, file, lat, lng)

      if (!result.candidates || result.candidates.length === 0) {
        toast.error('ランドマークが見つかりませんでした')
        setStatus('idle')
        return
      }

      setMatchResult({ ...result, file, lat, lng })
      setStatus('idle')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'エラーが発生しました')
      setStatus('idle')
    }
  }

  const handleSelectCandidate = async (candidate: MatchCandidate) => {
    if (!matchResult) return
    setMatchResult(null)
    setStatus('placing')

    try {
      const placement = await createPlacement({
        photoId: matchResult.photo_id,
        assetId: candidate.asset_id,
        lat: matchResult.lat,
        lng: matchResult.lng,
        scale: candidate.suggested_scale,
        rotation: candidate.suggested_rotation,
        matchScore: candidate.match_score,
        modelUrl: '',
      })

      addMarker(placement)
      map.current?.flyTo({ center: [placement.lng, placement.lat], zoom: 14 })
      toast.success('ランドマークを配置しました！')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '配置に失敗しました')
    } finally {
      setStatus('idle')
    }
  }

  const isLoading = status !== 'idle'

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* アップロードボタン */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full shadow-lg font-medium transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {status === 'uploading' && 'アップロード中...'}
              {status === 'matching' && 'AI判定中...'}
              {status === 'placing' && '配置中...'}
            </>
          ) : (
            <>
              <Camera size={18} />
              写真からピンを立てる
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 候補選択モーダル */}
      {matchResult && (
        <MatchResultModal
          candidates={matchResult.candidates}
          onSelect={handleSelectCandidate}
          onCancel={() => { setMatchResult(null); setStatus('idle') }}
        />
      )}
    </div>
  )
}
