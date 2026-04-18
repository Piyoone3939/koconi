import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { Trip } from "../../domain/models/koconi";

export function TripScreen({
  gateway,
  deviceId,
}: {
  gateway: KoconiGateway;
  deviceId: string;
}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gateway.listTrips(deviceId);
      setTrips(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gateway, deviceId]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleDelete = useCallback((trip: Trip) => {
    Alert.alert(
      "削除の確認",
      `「${trip.title}」を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await gateway.deleteTrip(deviceId, trip.id);
              setTrips((prev) => prev.filter((t) => t.id !== trip.id));
            } catch {
              Alert.alert("エラー", "削除に失敗しました");
            }
          },
        },
      ],
    );
  }, [gateway, deviceId]);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await gateway.createTrip({ deviceId, title: title.trim(), description: description.trim() });
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      void loadTrips();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [gateway, deviceId, title, description, loadTrips]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>トリップ</Text>
        <Pressable style={styles.addBtn} onPress={() => setCreateOpen(true)}>
          <Text style={styles.addBtnText}>＋ 作成</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {item.startAt && (
                      <Text style={styles.cardDate}>
                        {formatDate(item.startAt)}{item.endAt ? ` 〜 ${formatDate(item.endAt)}` : ""}
                      </Text>
                    )}
                    <Text style={styles.cardPrivacy}>{item.privacyLevel}</Text>
                  </View>
                </View>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>トリップがありません</Text>
              <Text style={styles.emptyHint}>「＋ 作成」で旅行を記録しましょう</Text>
            </View>
          }
        />
      )}

      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setCreateOpen(false)}>
              <Text style={styles.modalCancel}>キャンセル</Text>
            </Pressable>
            <Text style={styles.modalTitle}>新しいトリップ</Text>
            <Pressable onPress={handleCreate} disabled={saving || !title.trim()}>
              {saving ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={[styles.modalSave, !title.trim() && { opacity: 0.4 }]}>保存</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>タイトル *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="例: 京都旅行 2026"
              placeholderTextColor="#475569"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <Text style={styles.fieldLabel}>メモ</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="旅行の概要など..."
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "bold",
  },
  addBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
  },
  emptyHint: {
    color: "#475569",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDesc: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    color: "#64748b",
    fontSize: 12,
  },
  cardPrivacy: {
    color: "#475569",
    fontSize: 11,
    backgroundColor: "#334155",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "bold",
  },
  modalCancel: {
    color: "#94a3b8",
    fontSize: 16,
  },
  modalSave: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 16,
  },
  fieldInputMulti: {
    height: 100,
    textAlignVertical: "top",
  },
});
