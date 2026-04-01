import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  createPhotoAndMatch,
  createPlacementFromTopCandidate,
} from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export type AlbumItem = {
  id: string;
  uri: string;
  photoId: number;
  createdAt: string;
};

export type AlbumPhotoInput = {
  uri: string;
  photoId: number;
  createdAt: string;
};

type GroupedItems = { date: string; items: AlbumItem[] };

export function RecordScreen({
  gateway,
  albumItems,
  highlightedPhotoId,
  onPhotoPosted,
  onStartPolling,
  onDeleteItem,
}: {
  gateway: KoconiGateway;
  albumItems: AlbumItem[];
  highlightedPhotoId?: number | null;
  onPhotoPosted?: (item: AlbumPhotoInput) => void;
  onStartPolling?: (photoId: number) => void;
  onDeleteItem?: (id: string) => void;
}) {
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"record" | "album">("record");

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // highlightedPhotoId → アルバムタブに切り替え + モーダルを開く
  useEffect(() => {
    if (!highlightedPhotoId) return;
    const found = albumItems.find((item) => item.photoId === highlightedPhotoId);
    if (found) {
      setTab("album");
      setSelectedId(found.id);
    }
  }, [highlightedPhotoId, albumItems]);

  const handleSubmit = async () => {
    if (loading || !pickedImageUri) return;

    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("位置情報へのアクセスを許可してください");

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };

      const now = new Date();
      const guessedType = pickedImageUri.endsWith(".png") ? "image/png" : "image/jpeg";
      const uploadFile = {
        uri: pickedImageUri,
        name: `photo-${now.getTime()}.${guessedType === "image/png" ? "png" : "jpg"}`,
        type: guessedType,
      };

      const { photo, matchResult } = await createPhotoAndMatch(
        gateway,
        {
          deviceId: "demo-device",
          lat: coords.lat,
          lng: coords.lng,
          capturedAt: now.toISOString(),
          imageKey: `uploads/${now.getTime()}.jpg`,
          file: uploadFile,
        },
        { file: uploadFile, lat: coords.lat, lng: coords.lng, k: 5 },
      );

      await createPlacementFromTopCandidate(
        gateway,
        { photoId: photo.id, lat: coords.lat, lng: coords.lng },
        matchResult,
      );

      onPhotoPosted?.({ uri: pickedImageUri, photoId: photo.id, createdAt: now.toISOString() });

      setSuccessToast("地図に追加しました");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setSuccessToast(null);
        setPickedImageUri(null);
      }, 2500);

      if (photo.aiJobId) onStartPolling?.(photo.id);
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : "Unknown error";
      setError(rawMessage.includes("Network request failed") ? `ネットワークエラー\n${apiBaseUrl}` : rawMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError("フォトライブラリへのアクセスを許可してください"); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: false });
    if (picked.canceled || !picked.assets[0]) return;
    setError(null); setSuccessToast(null); setPickedImageUri(picked.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { setError("カメラへのアクセスを許可してください"); return; }
    const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: false, cameraType: ImagePicker.CameraType.back });
    if (picked.canceled || !picked.assets[0]) return;
    setError(null); setSuccessToast(null); setPickedImageUri(picked.assets[0].uri);
  };

  // アルバム関連
  const sortedItems = useMemo(() => [...albumItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [albumItems]);

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

  const handleDelete = () => {
    if (!selectedItem) return;
    onDeleteItem?.(selectedItem.id);
    setSelectedId(null);
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー + タブ切り替え */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{tab === "record" ? "記録する" : "アルバム"}</Text>
          {tab === "album" && (
            <Text style={styles.albumCount}>{albumItems.length}枚</Text>
          )}
        </View>
        <View style={styles.tabSwitcher}>
          <Pressable
            style={[styles.tabSwitchBtn, tab === "record" && styles.tabSwitchBtnActive]}
            onPress={() => setTab("record")}
          >
            <Text style={[styles.tabSwitchText, tab === "record" && styles.tabSwitchTextActive]}>
              記録
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabSwitchBtn, tab === "album" && styles.tabSwitchBtnActive]}
            onPress={() => setTab("album")}
          >
            <Text style={[styles.tabSwitchText, tab === "album" && styles.tabSwitchTextActive]}>
              アルバム {albumItems.length > 0 ? `(${albumItems.length})` : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 記録タブ */}
      {tab === "record" ? (
        <View style={styles.recordBody}>
          {/* 写真エリア */}
          {pickedImageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: pickedImageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <Pressable style={styles.changeBtn} onPress={handlePickImage}>
                  <Text style={styles.changeBtnText}>ライブラリ</Text>
                </Pressable>
                <Pressable style={styles.changeBtn} onPress={handleTakePhoto}>
                  <Text style={styles.changeBtnText}>カメラ</Text>
                </Pressable>
              </View>
              {successToast ? (
                <View style={styles.successOverlay}>
                  <Text style={styles.successOverlayText}>地図に追加しました</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyPhotoArea}>
              <View style={styles.cameraIconOuter}>
                <View style={styles.cameraIconInner} />
                <View style={styles.cameraIconLens} />
                <View style={styles.cameraIconFlash} />
              </View>
              <Text style={styles.emptyTitle}>写真を選ぶ</Text>
              <View style={styles.emptyActions}>
                <Pressable style={({ pressed }) => [styles.emptyActionBtn, pressed && { opacity: 0.7 }]} onPress={handlePickImage}>
                  <Text style={styles.emptyActionBtnText}>ライブラリ</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.emptyActionBtnPrimary, pressed && { opacity: 0.7 }]} onPress={handleTakePhoto}>
                  <Text style={styles.emptyActionBtnPrimaryText}>カメラ撮影</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* エラー */}
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.retryBtnText}>再試行</Text>
              </Pressable>
            </View>
          ) : null}

          {/* 投稿ボタン */}
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                loading && styles.submitBtnDisabled,
                !pickedImageUri && styles.submitBtnInactive,
                pressed && pickedImageUri && !loading && { opacity: 0.85 },
              ]}
              onPress={handleSubmit}
              disabled={loading || !pickedImageUri}
            >
              {loading ? (
                <View style={styles.submitBtnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>投稿中...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>
                  {!pickedImageUri ? "写真を選んでください" : "この写真を投稿する"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        /* アルバムタブ */
        sortedItems.length === 0 ? (
          <View style={styles.emptyAlbum}>
            <Text style={styles.emptyAlbumTitle}>まだ記録がありません</Text>
            <Text style={styles.emptyAlbumHint}>「記録」タブから写真を投稿しよう</Text>
            <Pressable style={styles.goRecordBtn} onPress={() => setTab("record")}>
              <Text style={styles.goRecordBtnText}>記録する</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={groupedData}
            keyExtractor={(group) => group.date}
            contentContainerStyle={styles.albumListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: group }) => (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{group.date}</Text>
                <View style={styles.grid}>
                  {group.items.map((item) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                      onPress={() => setSelectedId(item.id)}
                    >
                      <Image source={{ uri: item.uri, cache: "force-cache" }} style={styles.cardImage} resizeMode="cover" />
                      <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
                    </Pressable>
                  ))}
                  {group.items.length % 2 !== 0 ? <View style={styles.cardPlaceholder} /> : null}
                </View>
              </View>
            )}
          />
        )
      )}

      {/* 詳細モーダル */}
      <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectedId(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedItem ? (
              <>
                <Image source={{ uri: selectedItem.uri }} style={styles.modalImage} resizeMode="cover" />
                <View style={styles.modalMeta}>
                  <View>
                    <Text style={styles.modalDate}>{formatDateKey(selectedItem.createdAt)}</Text>
                    <Text style={styles.modalTime}>{formatTime(selectedItem.createdAt)}</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <Pressable style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]} onPress={() => setSelectedId(null)}>
                      <Text style={styles.closeBtnText}>閉じる</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]} onPress={handleDelete}>
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
  container: { flex: 1, backgroundColor: "#FDFBE5" },

  // ヘッダー
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD3BC",
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2A1F12",
    letterSpacing: -0.5,
  },
  albumCount: {
    fontSize: 13,
    color: "#8A7B68",
    marginBottom: 4,
  },

  // タブ切り替え
  tabSwitcher: {
    flexDirection: "row",
    gap: 0,
  },
  tabSwitchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabSwitchBtnActive: {
    borderBottomColor: "#E86F00",
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9A8B78",
  },
  tabSwitchTextActive: {
    color: "#E86F00",
  },

  // 記録タブ
  recordBody: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  // 写真プレビュー
  previewWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EAE3D0",
    position: "relative",
  },
  previewImage: { width: "100%", height: 300 },
  previewOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  changeBtn: {
    backgroundColor: "rgba(26, 18, 9, 0.65)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  changeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  successOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(42, 31, 18, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  successOverlayText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  // 写真未選択
  emptyPhotoArea: {
    backgroundColor: "#F0EBD8",
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#DDD3BC",
    borderStyle: "dashed",
  },
  cameraIconOuter: {
    width: 56, height: 44, borderRadius: 10,
    borderWidth: 2.5, borderColor: "#8A7B68",
    alignItems: "center", justifyContent: "center",
    position: "relative", marginBottom: 4,
  },
  cameraIconInner: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2.5, borderColor: "#8A7B68",
  },
  cameraIconLens: {
    position: "absolute", width: 8, height: 8,
    borderRadius: 4, backgroundColor: "#8A7B68",
  },
  cameraIconFlash: {
    position: "absolute", top: -8, left: 8,
    width: 12, height: 6, borderRadius: 3,
    backgroundColor: "#F0EBD8",
    borderWidth: 2, borderColor: "#8A7B68",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4A3E2E" },
  emptyActions: { flexDirection: "row", gap: 10, marginTop: 4, width: "100%" },
  emptyActionBtn: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
    borderWidth: 1, borderColor: "#DDD3BC",
  },
  emptyActionBtnText: { color: "#4A3E2E", fontSize: 13, fontWeight: "600" },
  emptyActionBtnPrimary: {
    flex: 1, backgroundColor: "#7697A0", borderRadius: 12,
    paddingVertical: 13, alignItems: "center",
  },
  emptyActionBtnPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  // エラー
  errorCard: {
    backgroundColor: "#FFF4F2", borderRadius: 12,
    borderWidth: 1, borderColor: "#EFCFCA", padding: 14, gap: 10,
  },
  errorText: { color: "#B03020", fontSize: 13, lineHeight: 20 },
  retryBtn: {
    alignSelf: "flex-start", backgroundColor: "#E86F00",
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  retryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // 投稿ボタン
  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: "#DDD3BC",
    backgroundColor: "#FDFBE5",
  },
  submitBtn: {
    backgroundColor: "#E86F00", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#D8956A" },
  submitBtnInactive: { backgroundColor: "#C8BAA8" },
  submitBtnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },

  // アルバムタブ
  albumListContent: { paddingTop: 8, paddingBottom: 24 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#9A8B78",
    letterSpacing: 0.8, textTransform: "uppercase",
    paddingVertical: 10, paddingHorizontal: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    width: "48.5%", backgroundColor: "#F8F4E3", borderRadius: 12,
    overflow: "hidden", shadowColor: "#2A1F12",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 6, elevation: 3,
  },
  cardImage: { width: "100%", aspectRatio: 1 },
  cardTime: { color: "#8A7B68", fontSize: 11, paddingHorizontal: 8, paddingVertical: 6 },
  cardPlaceholder: { width: "48.5%" },

  emptyAlbum: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60,
  },
  emptyAlbumTitle: { fontSize: 16, fontWeight: "700", color: "#4A3E2E" },
  emptyAlbumHint: { fontSize: 13, color: "#8A7B68", textAlign: "center" },
  goRecordBtn: {
    backgroundColor: "#E86F00", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  goRecordBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // モーダル
  backdrop: {
    flex: 1, backgroundColor: "rgba(26, 18, 9, 0.6)",
    justifyContent: "flex-end", padding: 16, paddingBottom: 20,
  },
  modalCard: {
    backgroundColor: "#FDFBE5", borderRadius: 20, overflow: "hidden",
    shadowColor: "#2A1F12", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  modalImage: { width: "100%", aspectRatio: 1.2 },
  modalMeta: {
    padding: 16, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
  },
  modalDate: { color: "#2A1F12", fontSize: 15, fontWeight: "700" },
  modalTime: { color: "#8A7B68", fontSize: 13, marginTop: 2 },
  modalActions: { flexDirection: "row", gap: 8 },
  closeBtn: {
    backgroundColor: "#7697A0", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  closeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    backgroundColor: "#FFF4F2", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: "#EFCFCA",
  },
  deleteBtnText: { color: "#B03020", fontWeight: "700", fontSize: 13 },
});
