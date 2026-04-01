import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
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

type ResultState = {
  photoId?: number;
  topAssetId?: string;
  placementId?: number;
};

export type AlbumPhotoInput = {
  uri: string;
  photoId: number;
  createdAt: string;
};

export function PhotosScreen({
  gateway,
  onPhotoPosted,
  onStartPolling,
}: {
  gateway: KoconiGateway;
  onPhotoPosted?: (item: AlbumPhotoInput) => void;
  onStartPolling?: (photoId: number) => void;
}) {
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({});

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult({});

    try {
      if (!pickedImageUri) {
        throw new Error("先に写真を選択してください");
      }

      const coords = await resolveCoordinates();
      setResolvedCoords(coords);

      const now = new Date();
      const uploadFile = buildUploadFile(pickedImageUri, now);

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
        {
          file: uploadFile,
          lat: coords.lat,
          lng: coords.lng,
          k: 5,
        },
      );

      const placement = await createPlacementFromTopCandidate(
        gateway,
        {
          photoId: photo.id,
          lat: coords.lat,
          lng: coords.lng,
        },
        matchResult,
      );

      setResult({
        photoId: photo.id,
        topAssetId: matchResult.candidates[0]?.assetId,
        placementId: placement?.id,
      });
      onPhotoPosted?.({
        uri: pickedImageUri,
        photoId: photo.id,
        createdAt: now.toISOString(),
      });

      setSuccessToast("地図に追加しました");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setSuccessToast(null);
        setPickedImageUri(null);
        setResult({});
      }, 2500);

      if (photo.aiJobId) {
        onStartPolling?.(photo.id);
      }
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : "Unknown error";
      if (rawMessage.includes("Network request failed")) {
        setError(`ネットワークエラー\n${apiBaseUrl}`);
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("フォトライブラリへのアクセスを許可してください");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (picked.canceled || !picked.assets[0]) return;

    setError(null);
    setResult({});
    setSuccessToast(null);
    setPickedImageUri(picked.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("カメラへのアクセスを許可してください");
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.back,
    });

    if (picked.canceled || !picked.assets[0]) return;

    setError(null);
    setResult({});
    setSuccessToast(null);
    setPickedImageUri(picked.assets[0].uri);
  };

  const isPosted = !!successToast || !!result.photoId;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>記録する</Text>
          <Text style={styles.subtitle}>写真を撮って、場所に刻もう</Text>
        </View>

        {/* 写真エリア */}
        {pickedImageUri ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: pickedImageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            {/* 変更ボタン */}
            <View style={styles.previewOverlay}>
              <Pressable style={styles.changeBtn} onPress={handlePickImage}>
                <Text style={styles.changeBtnText}>ライブラリ</Text>
              </Pressable>
              <Pressable style={styles.changeBtn} onPress={handleTakePhoto}>
                <Text style={styles.changeBtnText}>カメラ</Text>
              </Pressable>
            </View>
            {/* 成功オーバーレイ */}
            {isPosted ? (
              <View style={styles.successOverlay}>
                <Text style={styles.successOverlayText}>地図に追加しました</Text>
              </View>
            ) : null}
          </View>
        ) : (
          /* 写真未選択: 大きなタップエリア */
          <View style={styles.emptyPhotoArea}>
            {/* カメラアイコン (Viewで構成) */}
            <View style={styles.cameraIconOuter}>
              <View style={styles.cameraIconInner} />
              <View style={styles.cameraIconLens} />
              <View style={styles.cameraIconFlash} />
            </View>
            <Text style={styles.emptyTitle}>写真を選ぶ</Text>
            <Text style={styles.emptyHint}>下のボタンから選択してください</Text>

            <View style={styles.emptyActions}>
              <Pressable
                style={({ pressed }) => [styles.emptyActionBtn, pressed && { opacity: 0.7 }]}
                onPress={handlePickImage}
              >
                <Text style={styles.emptyActionBtnText}>ライブラリから選択</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.emptyActionBtnPrimary, pressed && { opacity: 0.7 }]}
                onPress={handleTakePhoto}
              >
                <Text style={styles.emptyActionBtnPrimaryText}>カメラで撮影</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 位置情報 */}
        {resolvedCoords ? (
          <Text style={styles.coordText}>
            {resolvedCoords.lat.toFixed(5)}, {resolvedCoords.lng.toFixed(5)}
          </Text>
        ) : null}

        {/* エラー */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.retryBtnText}>再試行</Text>
            </Pressable>
          </View>
        ) : null}

        {/* 下部ボタン分のスペース */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* 固定投稿ボタン */}
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
  );
}

function buildUploadFile(uri: string, capturedAt: Date): { uri: string; name: string; type: string } {
  const guessedType = uri.endsWith(".png") ? "image/png" : "image/jpeg";
  return {
    uri,
    name: `photo-${capturedAt.getTime()}.${guessedType === "image/png" ? "png" : "jpg"}`,
    type: guessedType,
  };
}

async function resolveCoordinates(): Promise<{ lat: number; lng: number }> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error("位置情報へのアクセスを許可してください");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FDFBE5",
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  // ── ヘッダー ───────────────────────────────────────────
  header: {
    gap: 4,
    paddingBottom: 4,
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
  },
  // ── 写真プレビュー ─────────────────────────────────────
  previewWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#EAE3D0",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 340,
  },
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
  changeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  successOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(42, 31, 18, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  successOverlayText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // ── 写真未選択エリア ────────────────────────────────────
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
  // カメラアイコン (Viewで構成)
  cameraIconOuter: {
    width: 56,
    height: 44,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: "#8A7B68",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  cameraIconInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: "#8A7B68",
  },
  cameraIconLens: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8A7B68",
  },
  cameraIconFlash: {
    position: "absolute",
    top: -8,
    left: 8,
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F0EBD8",
    borderWidth: 2,
    borderColor: "#8A7B68",
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
  emptyActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  emptyActionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  emptyActionBtnText: {
    color: "#4A3E2E",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyActionBtnPrimary: {
    flex: 1,
    backgroundColor: "#4A6B78",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  emptyActionBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // ── 位置情報・エラー ────────────────────────────────────
  coordText: {
    color: "#9A8B78",
    fontSize: 11,
    fontFamily: "monospace",
    textAlign: "center",
  },
  errorCard: {
    backgroundColor: "#FFF4F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFCFCA",
    padding: 14,
    gap: 10,
  },
  errorText: {
    color: "#B03020",
    fontSize: 13,
    lineHeight: 20,
  },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#C85A00",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  // ── 固定投稿ボタン ─────────────────────────────────────
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#DDD3BC",
    backgroundColor: "#FDFBE5",
  },
  submitBtn: {
    backgroundColor: "#C85A00",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#D8956A",
  },
  submitBtnInactive: {
    backgroundColor: "#C8BAA8",
  },
  submitBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
