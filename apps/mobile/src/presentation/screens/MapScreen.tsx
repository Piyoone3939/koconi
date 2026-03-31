import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={DEFAULT_CENTER}
          pitch={50}
        />

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

        {/* 3Dモデルのピン（ズームアウト時も可視） */}
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

      <View style={styles.overlayTop}>
        <Pressable style={styles.reloadButton} onPress={handleLoad} disabled={loading}>
          <Text style={styles.reloadButtonText}>{loading ? "..." : "Reload"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="small" color="#0B132B" />
        </View>
      ) : null}

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
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E86F00",
    borderWidth: 2,
    borderColor: "#fff",
  },
  tapArea: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  pin3d: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFD700",
    borderWidth: 2,
    borderColor: "#fff",
  },
  overlayTop: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  overlayCenter: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(253, 251, 229, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(253, 251, 229, 0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E8DFC8",
  },
  reloadButton: {
    backgroundColor: "#E86F00",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  errorText: { color: "#C0392B", fontSize: 13 },
  emptyText: { color: "#6B5E4A", fontSize: 13 },
});
