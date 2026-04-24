import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { Camera, Loader2, MapPin, RotateCcw, Navigation } from 'lucide-react'
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
import TabBar from '../components/TabBar'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string

type Status = 'idle' | 'uploading' | 'matching' | 'placing'
type Tab = 'map' | 'photo' | 'friends' | 'profile'

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Map<number, mapboxgl.Marker>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [matchResult, setMatchResult] = useState<(MatchResult & { file: File; lat: number; lng: number }) | null>(null)
  const [placementCount, setPlacementCount] = useState(0)

  const addMarker = useCallback((p: LandmarkPlacement) => {
    if (!map.current || markers.current.has(p.id)) return

    const el = document.createElement('div')
    el.style.cssText = `
      width: ${p.model_url ? 16 : 12}px;
      height: ${p.model_url ? 16 : 12}px;
      border-radius: 50%;
      background: ${p.model_url ? '#7697A0' : '#E86F00'};
      border: 2px solid #fff;
      cursor: pointer;
      box-shadow: 0 0 6px rgba(232,111,0,0.5);
    `

    const popup = new mapboxgl.Popup({
      offset: 16,
      closeButton: false,
    }).setHTML(`
      <div style="background:#1e293b;border-radius:10px;padding:10px 14px;min-width:130px;border:1px solid #334155">
        <div style="color:#f8fafc;font-size:13px;font-weight:700">${p.asset_id}</div>
        <div style="color:#94a3b8;font-size:11px;margin-top:3px">score: ${p.match_score?.toFixed(2) ?? '-'}</div>
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
        bounds.getSouth(), bounds.getNorth(),
        bounds.getWest(), bounds.getEast(),
      )
      placements.forEach(addMarker)
    } catch { /* サイレント失敗 */ }
  }, [addMarker])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [139.7454, 35.6586],
      zoom: 14,
      pitch: 50,
      config: { basemap: { lightPreset: 'night' } },
    })

    map.current.on('moveend', loadPlacements)
    map.current.on('load', loadPlacements)

    return () => { map.current?.remove(); map.current = null }
  }, [loadPlacements])

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve) => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          const c = map.current?.getCenter()
          resolve({ lat: c?.lat ?? 35.6586, lng: c?.lng ?? 139.7454 })
        },
      )
    })

  const flyToCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
        pitch: 50,
        duration: 1000,
      })
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

      let result: MatchResult
      try {
        result = await matchPhoto(photo.id, file, lat, lng)
      } catch {
        toast.error('AIサービスが利用できません。しばらくしてから再試行してください。')
        setStatus('idle')
        return
      }

      if (!result.candidates?.length) {
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
      map.current?.flyTo({ center: [placement.lng, placement.lat], zoom: 15 })
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
      {/* マップ */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* ヘッダー */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5"
        style={{
          paddingTop: 20,
          paddingBottom: 40,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <div>
          <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Koconi
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            {placementCount > 0 ? `${placementCount}件のランドマーク` : '地図を動かして読み込む'}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(20,20,20,0.82)',
            border: '1px solid rgba(255,255,255,0.12)',
            pointerEvents: 'auto',
          }}
        >
          <MapPin size={12} color="#E86F00" />
          <span style={{ color: '#F2C94C', fontSize: 12, fontWeight: 700 }}>MAP</span>
        </div>
      </div>

      {/* 右側コントロール */}
      <div
        className="absolute right-4 z-10 flex flex-col gap-3"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <button className="map-control-btn" onClick={flyToCurrentLocation} title="現在地">
          <Navigation size={18} color="#fff" />
        </button>
        <button className="map-control-btn" onClick={loadPlacements} title="再読み込み">
          <RotateCcw size={18} color="#fff" />
        </button>
      </div>

      {/* アップロードボタン */}
      <div
        className="absolute z-10 flex justify-center"
        style={{ bottom: 90, left: 0, right: 0 }}
      >
        <button
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full"
          style={{
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 28,
            paddingRight: 28,
            background: isLoading ? 'rgba(200,186,168,0.8)' : '#E86F00',
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

      {/* タブバー */}
      <TabBar active={activeTab} onChange={setActiveTab} />

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
