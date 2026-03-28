import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { listPlacements } from "../../application/usecases/photo-placement-flow";
import { createKoconiGateway } from "../../infrastructure/http";

export function MobileHomeScreen() {
  const gateway = useMemo(() => createKoconiGateway(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const placements = await listPlacements(gateway, {
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
        limit: 20,
      });
      setCount(placements.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setCount(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Koconi Mobile</Text>
      <Text style={styles.subTitle}>Clean Architecture + API integration baseline</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current plan</Text>
        <Text style={styles.cardText}>- Mobile app: full feature set</Text>
        <Text style={styles.cardText}>- Web app: photo + map viewer</Text>
      </View>

      <Pressable style={styles.button} onPress={handleLoad} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Loading..." : "Load My Placements"}</Text>
      </Pressable>

      {loading ? <ActivityIndicator size="small" color="#5BC0BE" /> : null}
      {count !== null ? <Text style={styles.result}>Placements found: {count}</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subTitle: {
    color: "#CDE6E5",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#1C2541",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: "#5BC0BE",
    fontSize: 16,
    fontWeight: "600",
  },
  cardText: {
    color: "#E0FBFC",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#5BC0BE",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#0B132B",
    fontWeight: "700",
    fontSize: 14,
  },
  result: {
    color: "#9FE2BF",
    fontWeight: "600",
  },
  error: {
    color: "#FF8FA3",
    fontSize: 13,
  },
});
