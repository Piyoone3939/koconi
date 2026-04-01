import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";

import MapboxGL from "@rnmapbox/maps";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

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
}: {
  gateway: KoconiGateway;
  refreshSignal?: number;
  onMarkerPhotoPress?: (photoId: number) => void;
}) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PlacementItem[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
      const placements = await listPlacements(gateway, {
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
        limit: 30,
      });

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
  }, [gateway]);

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
            <View style={styles.userLocOuter}>
              <View style={styles.userLocInner} />
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
  userLocOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232, 111, 0, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E86F00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  userLocInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
});
