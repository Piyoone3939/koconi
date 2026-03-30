import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type PlacementItem = {
  id: number;
  photoId: number;
  assetId: string;
  score: number | null;
  lat: number;
  lng: number;
  modelUrl: string;
};

export function MapScreen({
  gateway,
  refreshSignal,
  onMarkerPhotoPress,
}: {
  gateway: KoconiGateway;
  refreshSignal?: number;
  onMarkerPhotoPress?: (photoId: number) => void;
}) {
  const mapRef = useRef<MapView | null>(null);
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

      const nextItems: PlacementItem[] = placements.map((placement) => ({
        id: placement.id,
        photoId: placement.photoId,
        assetId: placement.assetId,
        score: placement.matchScore,
        lat: placement.lat,
        lng: placement.lng,
        modelUrl: placement.modelUrl,
      }));
      setItems(nextItems);

      if (nextItems.length > 0) {
        mapRef.current?.fitToCoordinates(
          nextItems.map((item) => ({ latitude: item.lat, longitude: item.lng })),
          {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          },
        );
      }
    } catch (e) {
      setItems([]);
      const rawMessage = e instanceof Error ? e.message : "Unknown error";
      if (rawMessage.includes("Network request failed")) {
        setError(`Network request failed. API endpoint: ${apiBaseUrl}`);
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  useEffect(() => {
    if (refreshSignal === undefined) {
      return;
    }
    void handleLoad();
  }, [refreshSignal, handleLoad]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapCanvas}
        initialRegion={{
          latitude: items[0]?.lat ?? 35.681236,
          longitude: items[0]?.lng ?? 139.767125,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {items.map((item) => (
          <Marker
            key={`pin-${item.id}`}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            onPress={() => onMarkerPhotoPress?.(item.photoId)}
          >
            {/* 3Dモデルありのピンはカスタムビューで区別 */}
            <View style={[styles.pinContainer, item.modelUrl ? styles.pinWith3D : styles.pinWithout3D]}>
              <Text style={styles.pinEmoji}>{item.modelUrl ? "🔷" : "📍"}</Text>
              {item.modelUrl ? (
                <View style={styles.pin3DBadge}>
                  <Text style={styles.pin3DBadgeText}>3D</Text>
                </View>
              ) : null}
            </View>
            <Callout onPress={() => onMarkerPhotoPress?.(item.photoId)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {item.modelUrl ? "🔷 3Dピン" : "📍 写真ピン"} #{item.id}
                </Text>
                {item.modelUrl ? (
                  <Text style={styles.calloutModel} numberOfLines={1}>
                    モデル: {item.modelUrl.split("/").pop()}
                  </Text>
                ) : null}
                <Text style={styles.calloutTap}>タップで写真を表示</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlayTop}>
        <Pressable style={styles.refreshButton} onPress={handleLoad} disabled={loading}>
          <Text style={styles.refreshButtonText}>{loading ? "..." : "Reload"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="small" color="#0B132B" />
        </View>
      ) : null}

      {error ? (
        <View style={styles.overlayBottom}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {!loading && items.length === 0 && !error ? (
        <View style={styles.overlayBottom}>
          <Text style={styles.empty}>No placements yet</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  pinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinWith3D: {
    // 3Dモデルありピン
  },
  pinWithout3D: {
    // 通常ピン
  },
  pinEmoji: {
    fontSize: 32,
  },
  pin3DBadge: {
    position: "absolute",
    bottom: -2,
    right: -6,
    backgroundColor: "#5BC0BE",
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  pin3DBadgeText: {
    color: "#0B132B",
    fontSize: 8,
    fontWeight: "700",
  },
  callout: {
    padding: 8,
    minWidth: 140,
    maxWidth: 220,
    gap: 2,
  },
  calloutTitle: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0B132B",
  },
  calloutModel: {
    fontSize: 11,
    color: "#5BC0BE",
  },
  calloutTap: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
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
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(11, 19, 43, 0.82)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButton: {
    backgroundColor: "rgba(11, 19, 43, 0.82)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  error: {
    color: "#FFD1D9",
    fontSize: 13,
  },
  empty: {
    color: "#E2E8F0",
    fontSize: 13,
  },
});
