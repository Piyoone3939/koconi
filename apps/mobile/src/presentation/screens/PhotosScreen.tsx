import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
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
}: {
  gateway: KoconiGateway;
  onPhotoPosted?: (item: AlbumPhotoInput) => void;
}) {
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({});

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult({});

    try {
      if (!pickedImageUri) {
        throw new Error("pick or capture an image first");
      }

      const parsedLat = 35.681236;
      const parsedLng = 139.767125;
      const now = new Date();
      const uploadFile = buildUploadFile(pickedImageUri, now);

      const { photo, matchResult } = await createPhotoAndMatch(
        gateway,
        {
          deviceId: "demo-device",
          lat: parsedLat,
          lng: parsedLng,
          capturedAt: now.toISOString(),
          imageKey: `uploads/${now.getTime()}.jpg`,
        },
        {
          file: uploadFile,
          lat: parsedLat,
          lng: parsedLng,
          k: 5,
        },
      );

      const placement = await createPlacementFromTopCandidate(
        gateway,
        {
          photoId: photo.id,
          lat: parsedLat,
          lng: parsedLng,
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

    if (result.canceled || !result.assets[0]) {
      return;
    }

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

    if (result.canceled || !result.assets[0]) {
      return;
    }

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

      {loading ? <ActivityIndicator size="small" color="#5BC0BE" /> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

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
