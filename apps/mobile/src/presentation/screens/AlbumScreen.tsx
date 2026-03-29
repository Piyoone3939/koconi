import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export type AlbumItem = {
  id: string;
  uri: string;
  photoId: number;
  createdAt: string;
};

export function AlbumScreen({ items }: { items: AlbumItem[] }) {
  const sortedItems = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Album</Text>
      <Text style={styles.subTitle}>Your posted photos</Text>

      {sortedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No photos yet. Post one from Photos tab.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {sortedItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              <Text style={styles.meta}>photoId: {item.photoId}</Text>
              <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
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
  emptyCard: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 14,
  },
  emptyText: {
    color: "#CDE6E5",
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#0F1A33",
  },
  meta: {
    color: "#CDE6E5",
    fontSize: 12,
  },
});
