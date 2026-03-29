import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function MapScreen({ gateway }: { gateway: KoconiGateway }) {
  const mapRef = useRef<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Array<{ id: number; assetId: string; score: number | null; lat: number; lng: number }>
  >([]);

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

      const nextItems = placements.map((placement) => ({
        id: placement.id,
        assetId: placement.assetId,
        score: placement.matchScore,
        lat: placement.lat,
        lng: placement.lng,
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
            title={`#${item.id}`}
            description={`${item.assetId} / score: ${item.score ?? "n/a"}`}
          />
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
