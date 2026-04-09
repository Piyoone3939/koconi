import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";

import MapboxGL from "@rnmapbox/maps";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { KoconiUser, SharedMap } from "../../domain/models/koconi";
import type { MapMode } from "../../../App";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");

type PlacementItem = {
  id: number;
  photoId: number;
  assetId: string;
  score: number | null;
  lat: number;
  lng: number;
  modelUrl: string;
};

const DEFAULT_CENTER: [number, number] = [139.7454, 35.6586];
const STYLE_URL = "mapbox://styles/mapbox/standard";

export function MapScreen({
  gateway,
  refreshSignal,
  onMarkerPhotoPress,
  mapMode,
  onMapModeChange,
  deviceId,
  friends,
  sharedMaps,
}: {
  gateway: KoconiGateway;
  refreshSignal?: number;
  onMarkerPhotoPress?: (photoId: number) => void;
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
  deviceId: string;
  friends: KoconiUser[];
  sharedMaps: SharedMap[];
}) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PlacementItem[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // 現在地追跡
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 5 },
        (loc) => {
          setUserLocation([loc.coords.longitude, loc.coords.latitude]);
        },
      );
    })();
    return () => {
      sub?.remove();
    };
  }, []);

  const handleLoad = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let placements: Awaited<ReturnType<typeof listPlacements>>;
      if (mapMode.type === "self") {
        placements = await listPlacements(gateway, { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180, limit: 30 });
      } else if (mapMode.type === "friend") {
        placements = await gateway.listPlacementsByUserTag(mapMode.userTag, 200);
      } else {
        placements = await gateway.listSharedMapPlacements(deviceId, mapMode.mapId);
      }

      const nextItems: PlacementItem[] = placements.map((p) => ({
        id: p.id,
        photoId: p.photoId,
        assetId: p.assetId,
        score: p.matchScore,
        lat: p.lat,
        lng: p.lng,
        modelUrl: p.modelUrl,
      }));
      setItems(nextItems);

      if (nextItems.length > 0) {
        const lats = nextItems.map((i) => i.lat);
        const lngs = nextItems.map((i) => i.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        cameraRef.current?.setCamera({
          centerCoordinate: [centerLng, centerLat],
          zoomLevel: 15,
          pitch: 50,
          animationDuration: 800,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [gateway, mapMode, deviceId]);

  const handleFlyToUser = useCallback(() => {
    if (!userLocation) return;
    cameraRef.current?.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: 17,
      pitch: 50,
      animationDuration: 800,
    });
  }, [userLocation]);

  const handleResetBearing = useCallback(() => {
    cameraRef.current?.setCamera({
      heading: 0,
      animationDuration: 400,
    });
  }, []);

  useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  useEffect(() => {
    if (refreshSignal !== undefined) void handleLoad();
  }, [refreshSignal, handleLoad]);

  const itemsWithout3D = items.filter((i) => !i.modelUrl);
  const itemsWith3D = items.filter((i) => i.modelUrl);

  const models3D = useMemo(() => {
    const m: Record<string, string> = {};
    itemsWith3D.forEach((item) => {
      m[`koconi-${item.id}`] = item.modelUrl;
    });
    return m;
  }, [itemsWith3D]);

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: itemsWith3D.map((item) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [item.lng, item.lat] },
        properties: { "model-id": `koconi-${item.id}` },
      })),
    }),
    [itemsWith3D],
  );

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        rotateEnabled={false}
      >
        <MapboxGL.StyleImport
          id="basemap"
          existing
          config={{
            lightPreset: "night",
            showPlaceLabels: "false",
            showRoadLabels: "false",
            showPointOfInterestLabels: "false",
            showTransitLabels: "false",
          }}
        />

        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={DEFAULT_CENTER}
          pitch={50}
        />

        {/* 現在地 glow dot */}
        {userLocation ? (
          <MapboxGL.MarkerView coordinate={userLocation} allowOverlap>
            <View style={styles.userLocHalo}>
              <View style={styles.userLocOuter}>
                <View style={styles.userLocInner} />
              </View>
            </View>
          </MapboxGL.MarkerView>
        ) : null}

        {/* 3Dモデル定義 */}
        {itemsWith3D.length > 0 ? <MapboxGL.Models models={models3D} /> : null}

        {/* 3Dモデルレイヤー */}
        {itemsWith3D.length > 0 ? (
          <MapboxGL.ShapeSource id="koconi-models" shape={featureCollection}>
            <MapboxGL.ModelLayer
              id="koconi-model-layer"
              slot="top"
              style={{
                modelId: ["get", "model-id"],
                modelScale: ["interpolate", ["exponential", 2], ["zoom"], 8, [64000, 64000, 64000], 12, [4000, 4000, 4000], 15, [500, 500, 500], 18, [60, 60, 60]],
                modelRotation: [90, 0, 0],
                modelOpacity: 1,
                modelType: "common-3d",
              }}
            />
          </MapboxGL.ShapeSource>
        ) : null}

        {/* 通常ピン（3Dモデルなし） */}
        {itemsWithout3D.map((item) => (
          <MapboxGL.MarkerView
            key={`pin-${item.id}`}
            coordinate={[item.lng, item.lat]}
            allowOverlap
          >
            <Pressable onPress={() => onMarkerPhotoPress?.(item.photoId)}>
              <View style={styles.pin} />
            </Pressable>
          </MapboxGL.MarkerView>
        ))}

        {/* 3Dモデルのタップエリア */}
        {itemsWith3D.map((item) => (
          <MapboxGL.MarkerView
            key={`tap-${item.id}`}
            coordinate={[item.lng, item.lat]}
            allowOverlap
          >
            <Pressable onPress={() => onMarkerPhotoPress?.(item.photoId)}>
              <View style={styles.pin3d} />
            </Pressable>
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      {/* マップモードセレクタ */}
      <View style={styles.selectorArea}>
        <Pressable
          style={({ pressed }) => [styles.selectorPill, pressed && { opacity: 0.8 }]}
          onPress={() => setSelectorOpen((v) => !v)}
        >
          <Text style={styles.selectorPillText} numberOfLines={1}>
            {mapMode.type === "self" ? "自分のマップ" : mapMode.type === "friend" ? mapMode.displayName : mapMode.name}
          </Text>
          <Text style={styles.selectorChevron}>{selectorOpen ? "▲" : "▼"}</Text>
        </Pressable>
        {selectorOpen ? (
          <ScrollView style={styles.selectorDropdown} showsVerticalScrollIndicator={false}>
            <Pressable style={[styles.selectorItem, mapMode.type === "self" && styles.selectorItemActive]}
              onPress={() => { onMapModeChange({ type: "self" }); setSelectorOpen(false); }}>
              <Text style={[styles.selectorItemText, mapMode.type === "self" && styles.selectorItemTextActive]}>自分のマップ</Text>
            </Pressable>
            {friends.length > 0 ? (
              <>
                <Text style={styles.selectorGroupLabel}>フレンド</Text>
                {friends.map((f) => (
                  <Pressable key={f.id} style={[styles.selectorItem, mapMode.type === "friend" && mapMode.userTag === f.userTag && styles.selectorItemActive]}
                    onPress={() => { onMapModeChange({ type: "friend", userTag: f.userTag, displayName: f.displayName }); setSelectorOpen(false); }}>
                    <Text style={[styles.selectorItemText, mapMode.type === "friend" && mapMode.userTag === f.userTag && styles.selectorItemTextActive]}>{f.displayName}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}
            {sharedMaps.length > 0 ? (
              <>
                <Text style={styles.selectorGroupLabel}>共有マップ</Text>
                {sharedMaps.map((m) => (
                  <Pressable key={m.id} style={[styles.selectorItem, mapMode.type === "shared" && mapMode.mapId === m.id && styles.selectorItemActive]}
                    onPress={() => { onMapModeChange({ type: "shared", mapId: m.id, name: m.name }); setSelectorOpen(false); }}>
                    <Text style={[styles.selectorItemText, mapMode.type === "shared" && mapMode.mapId === m.id && styles.selectorItemTextActive]}>{m.name}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </View>

      {/* 右側ボタン列 */}
      <View style={styles.rightButtons}>
        <Pressable
          style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.7 }]}
          onPress={handleResetBearing}
        >
          <Text style={styles.mapBtnText}>⊙</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.mapBtn,
            !userLocation && styles.mapBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleFlyToUser}
          disabled={!userLocation}
        >
          <Text style={styles.mapBtnText}>⊕</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.mapBtn,
            loading && styles.mapBtnLoading,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleLoad}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#E86F00" />
            : <Text style={styles.mapBtnText}>↺</Text>}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.overlayBottom}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loading && items.length === 0 && !error ? (
        <View style={styles.overlayBottom}>
          <Text style={styles.emptyText}>No placements yet</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // 現在地 glow
  userLocHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(232, 111, 0, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E86F00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 0,
  },
  userLocOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(232, 111, 0, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E86F00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  userLocInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E86F00",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },

  // ピン
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E86F00",
    borderWidth: 2,
    borderColor: "#fff",
  },
  pin3d: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7697A0",
    borderWidth: 2,
    borderColor: "#fff",
  },

  // 右側ボタン列
  rightButtons: {
    position: "absolute",
    right: 14,
    bottom: 100,
    gap: 10,
  },
  mapBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(20, 20, 20, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  mapBtnDisabled: {
    opacity: 0.4,
  },
  mapBtnLoading: {
    borderColor: "rgba(232, 111, 0, 0.4)",
  },
  mapBtnText: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
  },

  // 左上オーバーレイ
  topLeft: {
    position: "absolute",
    top: 16,
    left: 16,
    gap: 8,
  },
  cityName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  regionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8B84B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  regionText: {
    color: "#2A1F12",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  regionChevron: {
    color: "#2A1F12",
    fontSize: 12,
  },

  // オーバーレイ
  overlayBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(20, 20, 20, 0.85)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  errorText: { color: "#FF6B6B", fontSize: 13 },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },

  selectorArea: { position: "absolute", top: 14, left: 14, right: 80, zIndex: 10 },
  selectorPill: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    backgroundColor: "rgba(20,20,20,0.88)", borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", maxWidth: "100%",
  },
  selectorPillText: { color: "#F2C94C", fontSize: 13, fontWeight: "700", flexShrink: 1 },
  selectorChevron: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
  selectorDropdown: {
    marginTop: 6, backgroundColor: "rgba(18,18,18,0.96)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", maxHeight: 260,
  },
  selectorGroupLabel: {
    color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
    textTransform: "uppercase",
  },
  selectorItem: { paddingHorizontal: 16, paddingVertical: 12 },
  selectorItemActive: { backgroundColor: "rgba(242,201,76,0.12)" },
  selectorItemText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  selectorItemTextActive: { color: "#F2C94C" },
});
