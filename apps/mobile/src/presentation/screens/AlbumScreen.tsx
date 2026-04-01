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

type GroupedItems = {
  date: string;
  items: AlbumItem[];
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
    copy.sort((a, b) =>
      sortOrder === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
    return copy;
  }, [items, sortOrder]);

  // 日付ごとにグルーピング
  const groupedData = useMemo<GroupedItems[]>(() => {
    const map = new Map<string, AlbumItem[]>();
    for (const item of sortedItems) {
      const key = formatDateKey(item.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [sortedItems]);

  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [sortedItems, selectedId],
  );

  useEffect(() => {
    if (!highlightedPhotoId) return;
    const found = sortedItems.find((item) => item.photoId === highlightedPhotoId);
    if (found) setSelectedId(found.id);
  }, [highlightedPhotoId, sortedItems]);

  const handleDelete = () => {
    if (!selectedItem) return;
    onDeleteItem?.(selectedItem.id);
    setSelectedId(null);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>アルバム</Text>
          <Text style={styles.subtitle}>{items.length}枚の記録</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
        >
          <Text style={styles.sortBtnText}>
            {sortOrder === "newest" ? "新しい順 ↓" : "古い順 ↑"}
          </Text>
        </Pressable>
      </View>

      {sortedItems.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <View style={styles.emptyIconGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.emptyIconCell} />
              ))}
            </View>
          </View>
          <Text style={styles.emptyTitle}>まだ記録がありません</Text>
          <Text style={styles.emptyHint}>「記録する」タブから{"\n"}写真を投稿してみましょう</Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(group) => group.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={styles.section}>
              {/* 日付ヘッダー */}
              <Text style={styles.sectionLabel}>{group.date}</Text>
              {/* 2列グリッド */}
              <View style={styles.grid}>
                {group.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                    onPress={() => setSelectedId(item.id)}
                  >
                    <Image
                      source={{ uri: item.uri, cache: "force-cache" }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
                  </Pressable>
                ))}
                {/* グリッドの最終行が奇数の場合の埋め合わせ */}
                {group.items.length % 2 !== 0 ? <View style={styles.cardPlaceholder} /> : null}
              </View>
            </View>
          )}
        />
      )}

      {/* 詳細モーダル */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedId(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedId(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedItem ? (
              <>
                <Image
                  source={{ uri: selectedItem.uri }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <View style={styles.modalMeta}>
                  <View>
                    <Text style={styles.modalDate}>{formatDateKey(selectedItem.createdAt)}</Text>
                    <Text style={styles.modalTime}>{formatTime(selectedItem.createdAt)}</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <Pressable
                      style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => setSelectedId(null)}
                    >
                      <Text style={styles.closeBtnText}>閉じる</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                      onPress={handleDelete}
                    >
                      <Text style={styles.deleteBtnText}>削除</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function formatDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBE5",
  },
  // ── ヘッダー ─────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD3BC",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2A1F12",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#8A7B68",
    fontSize: 13,
    marginTop: 2,
  },
  sortBtn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DDD3BC",
    backgroundColor: "#F8F4E3",
  },
  sortBtnText: {
    color: "#4A6B78",
    fontSize: 12,
    fontWeight: "600",
  },
  // ── Empty state ──────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyIconWrap: {
    marginBottom: 8,
  },
  emptyIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 56,
    gap: 5,
  },
  emptyIconCell: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#DDD3BC",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A3E2E",
  },
  emptyHint: {
    fontSize: 13,
    color: "#8A7B68",
    textAlign: "center",
    lineHeight: 20,
  },
  // ── リスト ────────────────────────────────────────────────
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9A8B78",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "48.5%",
    backgroundColor: "#F8F4E3",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#2A1F12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
  },
  cardTime: {
    color: "#8A7B68",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cardPlaceholder: {
    width: "48.5%",
  },
  // ── モーダル ──────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 18, 9, 0.6)",
    justifyContent: "flex-end",
    padding: 16,
    paddingBottom: 20,
  },
  modalCard: {
    backgroundColor: "#FDFBE5",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#2A1F12",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalImage: {
    width: "100%",
    aspectRatio: 1.2,
  },
  modalMeta: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDate: {
    color: "#2A1F12",
    fontSize: 15,
    fontWeight: "700",
  },
  modalTime: {
    color: "#8A7B68",
    fontSize: 13,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  closeBtn: {
    backgroundColor: "#4A6B78",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: "#FFF4F2",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EFCFCA",
  },
  deleteBtnText: {
    color: "#B03020",
    fontWeight: "700",
    fontSize: 13,
  },
});
