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

type GenerationStatus = "idle" | "pending" | "processing" | "done" | "failed";

export type AlbumPhotoInput = {
  uri: string;
  photoId: number;
  createdAt: string;
};

export function PhotosScreen({
  gateway,
  onPhotoPosted,
  onMapRefresh,
}: {
  gateway: KoconiGateway;
  onPhotoPosted?: (item: AlbumPhotoInput) => void;
  onMapRefresh?: () => void;
}) {
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationPhotoId, setGenerationPhotoId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({});

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const startPolling = (photoId: number) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setGenerationStatus("pending");
    setGenerationPhotoId(photoId);

    pollTimerRef.current = setInterval(async () => {
      try {
        const s = await gateway.getPhoto3DStatus(photoId);
        if (s.status === "done") {
          clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          setGenerationStatus("done");
          onMapRefresh?.();
        } else if (s.status === "failed" || s.status === "not_found") {
          clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          setGenerationStatus("failed");
        } else {
          setGenerationStatus(s.status as GenerationStatus);
        }
      } catch {
        // ポーリングエラーは無視（次のインターバルで再試行）
      }
    }, 3000);
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult({});
    setGenerationStatus("idle");
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    try {
      if (!pickedImageUri) {
        throw new Error("pick or capture an image first");
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

      setSuccessToast("投稿に成功しました");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSuccessToast(null), 2500);

      // AIジョブが開始されていたらポーリング開始
      if (photo.aiJobId) {
        startPolling(photo.id);
      }
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : "Unknown error";
      if (rawMessage.includes("Network request failed")) {
        setError(`Network request failed. API endpoint: ${apiBaseUrl}`);
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
      setError("media library permission is required");
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
      setError("camera permission is required");
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <Text style={styles.subTitle}>Pick or capture a photo and post it</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
          <Text style={styles.secondaryButtonText}>Pick Image From Library</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleTakePhoto}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </Pressable>
      </View>
      {pickedImageUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: pickedImageUri }} style={styles.previewImage} />
          <Text style={styles.previewLabel}>selected image preview</Text>
        </View>
      ) : null}

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? "Submitting..." : "Post Photo"}</Text>
      </Pressable>

      {error ? (
        <Pressable style={styles.retryButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      ) : null}

      {loading ? <ActivityIndicator size="small" color="#5BC0BE" /> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
      {resolvedCoords ? (
        <Text style={styles.coordText}>
          location: {resolvedCoords.lat.toFixed(5)}, {resolvedCoords.lng.toFixed(5)}
        </Text>
      ) : null}
      {successToast ? <Text style={styles.successToast}>{successToast}</Text> : null}

      {/* 3Dモデル生成ステータス */}
      {generationStatus !== "idle" ? (
        <View
          style={[
            styles.generationCard,
            generationStatus === "done" ? styles.generationCardDone : null,
            generationStatus === "failed" ? styles.generationCardFailed : null,
          ]}
        >
          {generationStatus === "pending" || generationStatus === "processing" ? (
            <View style={styles.generationRow}>
              <ActivityIndicator size="small" color="#5BC0BE" />
              <Text style={styles.generationText}>
                {generationStatus === "pending" ? "3Dモデル生成待機中..." : "3Dモデル生成中..."}
              </Text>
            </View>
          ) : generationStatus === "done" ? (
            <Text style={styles.generationDoneText}>3Dモデル生成完了！マップに反映されました</Text>
          ) : (
            <Text style={styles.generationFailedText}>3Dモデル生成に失敗しました</Text>
          )}
          {generationPhotoId ? (
            <Text style={styles.generationPhotoId}>photo #{generationPhotoId}</Text>
          ) : null}
        </View>
      ) : null}

      {(result.photoId || result.topAssetId || result.placementId) && !error ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Posted</Text>
          <Text style={styles.resultText}>photoId: {result.photoId ?? "-"}</Text>
          <Text style={styles.resultText}>topAssetId: {result.topAssetId ?? "-"}</Text>
          <Text style={styles.resultText}>placementId: {result.placementId ?? "not created"}</Text>
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
    throw new Error("location permission is required");
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
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: "#5BC0BE",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#0B132B",
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: "#2B3659",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#D7E3FF",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#273C75",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#D7E3FF",
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3659",
    padding: 10,
    gap: 6,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  previewLabel: {
    color: "#AFC5CD",
    fontSize: 12,
  },
  error: {
    color: "#FF8FA3",
    fontSize: 13,
  },
  coordText: {
    color: "#AFC5CD",
    fontSize: 12,
  },
  successToast: {
    color: "#B9FBC0",
    fontSize: 13,
    fontWeight: "700",
  },
  generationCard: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B4A6F",
    padding: 12,
    gap: 4,
  },
  generationCardDone: {
    borderColor: "#5BC0BE",
  },
  generationCardFailed: {
    borderColor: "#FF8FA3",
  },
  generationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  generationText: {
    color: "#AFC5CD",
    fontSize: 13,
  },
  generationDoneText: {
    color: "#5BC0BE",
    fontSize: 13,
    fontWeight: "700",
  },
  generationFailedText: {
    color: "#FF8FA3",
    fontSize: 13,
  },
  generationPhotoId: {
    color: "#6B7280",
    fontSize: 11,
  },
  resultCard: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    color: "#5BC0BE",
    fontWeight: "700",
  },
  resultText: {
    color: "#CDE6E5",
    fontSize: 13,
  },
});
