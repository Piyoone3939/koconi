import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type AlbumItem = {
  id: string;
  uri: string;
  photoId: number;
  createdAt: string;
};

export function AlbumScreen({
  items,
  highlightedPhotoId,
  onDeleteItem,
}: {
  items: AlbumItem[];
  highlightedPhotoId?: number | null;
  onDeleteItem?: (id: string) => void;
}) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      return sortOrder === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt);
    });
    return copy;
  }, [items, sortOrder]);

  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [sortedItems, selectedId],
  );

  useEffect(() => {
    if (!highlightedPhotoId) {
      return;
    }
    const found = sortedItems.find((item) => item.photoId === highlightedPhotoId);
    if (found) {
      setSelectedId(found.id);
    }
  }, [highlightedPhotoId, sortedItems]);

  const handleDelete = () => {
    if (!selectedItem) {
      return;
    }
    onDeleteItem?.(selectedItem.id);
    setSelectedId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Album</Text>
      <Text style={styles.subTitle}>Your posted photos</Text>

      <View style={styles.toolbar}>
        <Pressable
          style={styles.sortButton}
          onPress={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
        >
          <Text style={styles.sortButtonText}>
            sort: {sortOrder === "newest" ? "newest" : "oldest"}
          </Text>
        </Pressable>
      </View>

      {sortedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No photos yet. Post one from Photos tab.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          initialNumToRender={8}
          removeClippedSubviews
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelectedId(item.id)}>
              <Image
                source={{ uri: item.uri, cache: "force-cache" }}
                style={styles.image}
                resizeMode="cover"
              />
              <Text style={styles.meta}>photoId: {item.photoId}</Text>
              <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedItem ? (
              <>
                <Image source={{ uri: selectedItem.uri }} style={styles.modalImage} resizeMode="cover" />
                <Text style={styles.modalMeta}>photoId: {selectedItem.photoId}</Text>
                <Text style={styles.modalMeta}>{formatDate(selectedItem.createdAt)}</Text>
                <View style={styles.modalActions}>
                  <Pressable style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                  <Pressable style={styles.closeButton} onPress={() => setSelectedId(null)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
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
    flex: 1,
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
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sortButton: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sortButtonText: {
    color: "#D7E3FF",
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    paddingBottom: 24,
    gap: 10,
  },
  column: {
    gap: 10,
  },
  card: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0F1A33",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  modalImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#1C2541",
  },
  modalMeta: {
    color: "#CDE6E5",
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#7A2230",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFE3E8",
    fontWeight: "700",
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#2B3659",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#D7E3FF",
    fontWeight: "700",
  },
});
