import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

export function MapScreen({ gateway }: { gateway: KoconiGateway }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ id: number; assetId: string; score: number | null }>>([]);

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

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>#{item.id}</Text>
            <Text style={styles.cardText}>asset: {item.assetId}</Text>
            <Text style={styles.cardText}>score: {item.score ?? "n/a"}</Text>
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
