import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
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
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>アルバム</Text>
          <Text style={styles.subTitle}>{items.length}枚の写真</Text>
        </View>
        <Pressable
          style={styles.sortButton}
          onPress={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
        >
          <Text style={styles.sortButtonText}>
            {sortOrder === "newest" ? "新しい順" : "古い順"}
          </Text>
        </Pressable>
      </View>

      {sortedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>写真がまだありません</Text>
          <Text style={styles.emptyHint}>「写真」タブから投稿してみましょう</Text>
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
                <Text style={styles.modalMeta}>{formatDate(selectedItem.createdAt)}</Text>
                <Text style={styles.modalPhotoId}>photo #{selectedItem.photoId}</Text>
                <View style={styles.modalActions}>
                  <Pressable style={styles.closeButton} onPress={() => setSelectedId(null)}>
                    <Text style={styles.closeButtonText}>閉じる</Text>
                  </Pressable>
                  <Pressable style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>削除</Text>
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
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBE5",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1209",
    letterSpacing: 0.3,
  },
  subTitle: {
    color: "#9A8B78",
    fontSize: 13,
    marginTop: 2,
  },
  sortButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E8DFC8",
  },
  sortButtonText: {
    color: "#7697A0",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8DFC8",
    padding: 24,
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  emptyText: {
    color: "#6B5E4A",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyHint: {
    color: "#9A8B78",
    fontSize: 13,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8DFC8",
    gap: 0,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F5F0E8",
  },
  meta: {
    color: "#9A8B78",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 18, 9, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FDFBE5",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  modalImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F5F0E8",
  },
  modalMeta: {
    color: "#1A1209",
    fontSize: 14,
    fontWeight: "600",
  },
  modalPhotoId: {
    color: "#9A8B78",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  closeButton: {
    flex: 2,
    backgroundColor: "#7697A0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FFF0EE",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFCFCA",
  },
  deleteButtonText: {
    color: "#C0392B",
    fontWeight: "700",
    fontSize: 14,
  },
});
