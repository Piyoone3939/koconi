import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Camera, Loader2, MapPin } from 'lucide-react'
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
  const [placementCount, setPlacementCount] = useState(0)

  const addMarker = useCallback((p: LandmarkPlacement) => {
    if (!map.current || markers.current.has(p.id)) return

    const el = document.createElement('div')
    el.className = p.model_url ? 'pin-marker-3d' : 'pin-marker'

    const popup = new mapboxgl.Popup({
      offset: 16,
      className: 'koconi-popup',
    }).setHTML(`
      <div style="background:#1e293b;border-radius:10px;padding:10px 12px;min-width:120px">
        <div style="color:#f8fafc;font-size:13px;font-weight:700">${p.asset_id}</div>
        <div style="color:#94a3b8;font-size:11px;margin-top:2px">score: ${p.match_score?.toFixed(2) ?? '-'}</div>
      </div>
    `)

    const marker = new mapboxgl.Marker(el)
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map.current)

    markers.current.set(p.id, marker)
    setPlacementCount(c => c + 1)
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
      style: 'mapbox://styles/mapbox/standard',
      center: [139.6917, 35.6895],
      zoom: 10,
      config: {
        basemap: { lightPreset: 'night' },
      },
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
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const center = map.current?.getCenter()
        resolve({ lat: center?.lat ?? 35.6895, lng: center?.lng ?? 139.6917 })
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
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
    <div className="relative w-full h-full" style={{ background: '#0f172a' }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* ヘッダー */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.9) 0%, transparent 100%)' }}
      >
        <div>
          <div style={{ color: '#f8fafc', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Koconi
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>
            {placementCount > 0 ? `${placementCount}件のランドマーク` : '地図を動かして読み込む'}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(20,20,20,0.82)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <MapPin size={12} color="#E86F00" />
          <span style={{ color: '#F2C94C', fontSize: 12, fontWeight: 700 }}>MAP</span>
        </div>
      </div>

      {/* アップロードボタン */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 28,
            paddingRight: 28,
            background: isLoading ? '#C8BAA8' : '#E86F00',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.3,
            boxShadow: isLoading ? 'none' : '0 4px 20px rgba(232,111,0,0.5)',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
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
