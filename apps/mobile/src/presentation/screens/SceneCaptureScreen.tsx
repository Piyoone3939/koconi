import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { PlacementScene } from "../../domain/models/koconi";

type Direction = "N" | "E" | "S" | "W";

const DIRECTIONS: { key: Direction; label: string; desc: string }[] = [
  { key: "N", label: "北 (N)", desc: "正面を向いて撮影" },
  { key: "E", label: "東 (E)", desc: "右を向いて撮影" },
  { key: "S", label: "南 (S)", desc: "後ろを向いて撮影" },
  { key: "W", label: "西 (W)", desc: "左を向いて撮影" },
];

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function SceneCaptureScreen({
  visible,
  placementId,
  deviceId,
  gateway,
  onClose,
  onComplete,
}: {
  visible: boolean;
  placementId: number;
  deviceId: string;
  gateway: KoconiGateway;
  onClose: () => void;
  onComplete: (scenes: PlacementScene[]) => void;
}) {
  const [captured, setCaptured] = useState<Partial<Record<Direction, PlacementScene>>>({});
  const [uploading, setUploading] = useState<Direction | null>(null);

  const handleCapture = async (direction: Direction) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(direction);
    try {
      // 画像をS3にアップロード
      const filename = `scene_${placementId}_${direction}_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: filename, type: "image/jpeg" } as unknown as Blob);
      const uploadRes = await fetch(`${apiBaseUrl}/v1/upload`, {
        method: "POST",
        body: formData,
      });
      let imageKey = filename;
      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        imageKey = uploadJson.key ?? filename;
      }

      const scene = await gateway.createScene({
        deviceId,
        placementId,
        direction,
        imageKey,
      });
      setCaptured((prev) => ({ ...prev, [direction]: scene }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "撮影に失敗しました";
      Alert.alert("エラー", msg);
    } finally {
      setUploading(null);
    }
  };

  const allDone = DIRECTIONS.every((d) => captured[d.key]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <Text style={styles.title}>360°シーン撮影</Text>
        <Text style={styles.subtitle}>4方向それぞれを撮影してください</Text>

        <View style={styles.grid}>
          {DIRECTIONS.map((dir) => {
            const done = !!captured[dir.key];
            const isUploading = uploading === dir.key;
            return (
              <Pressable
                key={dir.key}
                style={[styles.dirButton, done && styles.dirButtonDone]}
                onPress={() => handleCapture(dir.key)}
                disabled={isUploading || done}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.dirLabel}>{done ? "✓ " : ""}{dir.label}</Text>
                    <Text style={styles.dirDesc}>{dir.desc}</Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </Pressable>
          {allDone && (
            <Pressable
              style={styles.completeButton}
              onPress={() => onComplete(Object.values(captured) as PlacementScene[])}
            >
              <Text style={styles.completeText}>完了</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 32,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    alignContent: "center",
  },
  dirButton: {
    width: "44%",
    aspectRatio: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#334155",
  },
  dirButtonDone: {
    backgroundColor: "#065f46",
    borderColor: "#10b981",
  },
  dirLabel: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dirDesc: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  cancelText: {
    color: "#94a3b8",
    fontSize: 16,
  },
  completeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  completeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
