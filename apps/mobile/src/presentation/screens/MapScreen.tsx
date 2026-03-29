import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

export function MapScreen({ gateway }: { gateway: KoconiGateway }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    Array<{ id: number; assetId: string; score: number | null; lat: number; lng: number }>
  >([]);

  const handleLoad = async () => {
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

      setItems(
        placements.map((placement) => ({
          id: placement.id,
          assetId: placement.assetId,
          score: placement.matchScore,
          lat: placement.lat,
          lng: placement.lng,
        })),
      );
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Map</Text>
      <Text style={styles.subTitle}>Saved placements list (MVP)</Text>

      <Pressable style={styles.primaryButton} onPress={handleLoad} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? "Loading..." : "Load Placements"}</Text>
      </Pressable>

      {loading ? <ActivityIndicator size="small" color="#5BC0BE" /> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Map Preview</Text>
        <View style={styles.mapCanvas}>
          {items.map((item) => {
            const x = ((item.lng + 180) / 360) * 100;
            const y = (1 - (item.lat + 90) / 180) * 100;
            return (
              <View
                key={`pin-${item.id}`}
                style={[
                  styles.pin,
                  {
                    left: `${Math.max(2, Math.min(98, x))}%`,
                    top: `${Math.max(2, Math.min(98, y))}%`,
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.mapNote}>world bounds: lat -90..90 / lng -180..180</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>#{item.id}</Text>
            <Text style={styles.cardText}>asset: {item.assetId}</Text>
            <Text style={styles.cardText}>score: {item.score ?? "n/a"}</Text>
            <Text style={styles.cardText}>lat/lng: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
          </View>
        ))}
        {!loading && items.length === 0 && !error ? (
          <Text style={styles.empty}>No placements loaded yet.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subTitle: {
    color: "#9CB4BD",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#5BC0BE",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0B132B",
    fontWeight: "700",
  },
  error: {
    color: "#FF8FA3",
    fontSize: 13,
  },
  mapCard: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  mapTitle: {
    color: "#5BC0BE",
    fontWeight: "700",
  },
  mapCanvas: {
    position: "relative",
    height: 180,
    borderRadius: 8,
    backgroundColor: "#12213F",
    borderWidth: 1,
    borderColor: "#2B3659",
    overflow: "hidden",
  },
  pin: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: "#5BC0BE",
  },
  mapNote: {
    color: "#8CA8B1",
    fontSize: 11,
  },
  list: {
    gap: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: "#CDE6E5",
    fontWeight: "700",
  },
  cardText: {
    color: "#AFC5CD",
    fontSize: 13,
  },
  empty: {
    color: "#78909C",
    marginTop: 6,
  },
});
