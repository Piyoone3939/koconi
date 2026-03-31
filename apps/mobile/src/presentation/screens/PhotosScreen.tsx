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

      setSuccessToast("投稿しました");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSuccessToast(null), 2500);

      if (photo.aiJobId) {
        onStartPolling?.(photo.id);
      }
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : "Unknown error";
      if (rawMessage.includes("Network request failed")) {
        setError(`ネットワークエラー。APIエンドポイント: ${apiBaseUrl}`);
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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    setError(null);
    setPickedImageUri(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("カメラへのアクセスを許可してください");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.back,
    });

    if (result.canceled || !result.assets[0]) return;

    setError(null);
    setPickedImageUri(result.assets[0].uri);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>写真を投稿</Text>
      <Text style={styles.subTitle}>写真を選んで地図上に3Dモデルを立てよう</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
          <Text style={styles.secondaryButtonText}>ライブラリから選択</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleTakePhoto}>
          <Text style={styles.secondaryButtonText}>カメラで撮影</Text>
        </Pressable>
      </View>

      {pickedImageUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: pickedImageUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>写真が選択されていません</Text>
        </View>
      )}

      <Pressable
        style={[styles.primaryButton, loading ? styles.primaryButtonDisabled : null]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.primaryButtonRow}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>投稿中...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>投稿する</Text>
        )}
      </Pressable>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </Pressable>
        </View>
      ) : null}

      {resolvedCoords ? (
        <Text style={styles.coordText}>
          位置: {resolvedCoords.lat.toFixed(5)}, {resolvedCoords.lng.toFixed(5)}
        </Text>
      ) : null}

      {successToast ? (
        <View style={styles.successCard}>
          <Text style={styles.successText}>{successToast}</Text>
        </View>
      ) : null}

      {(result.photoId || result.topAssetId || result.placementId) && !error ? (
        <View style={styles.resultCard}>
          <View style={styles.resultDot} />
          <View style={styles.resultBody}>
            <Text style={styles.resultTitle}>投稿完了</Text>
            <Text style={styles.resultText}>photo #{result.photoId ?? "-"}</Text>
            <Text style={styles.resultText}>asset: {result.topAssetId ?? "-"}</Text>
            <Text style={styles.resultText}>placement: {result.placementId ?? "pending"}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
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
  scroll: {
    backgroundColor: "#FDFBE5",
  },
  container: {
    padding: 20,
    gap: 14,
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
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#7697A0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8DFC8",
  },
  previewImage: {
    width: "100%",
    height: 220,
  },
  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8DFC8",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#C8BAA8",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#E86F00",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#F0A870",
  },
  primaryButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  errorCard: {
    backgroundColor: "#FFF0EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFCFCA",
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: "#C0392B",
    fontSize: 13,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E86F00",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  coordText: {
    color: "#9A8B78",
    fontSize: 12,
  },
  successCard: {
    backgroundColor: "#EFF7EE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C3DFC0",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successText: {
    color: "#3D7A3D",
    fontSize: 13,
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DFC8",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E86F00",
    marginTop: 4,
  },
  resultBody: {
    flex: 1,
    gap: 3,
  },
  resultTitle: {
    color: "#1A1209",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 2,
  },
  resultText: {
    color: "#6B5E4A",
    fontSize: 12,
  },
});
