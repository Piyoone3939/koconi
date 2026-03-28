import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createPhotoAndMatch,
  createPlacementFromTopCandidate,
} from "../../application/usecases/photo-placement-flow";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";

type ResultState = {
  photoId?: number;
  topAssetId?: string;
  placementId?: number;
};

export function PhotosScreen({ gateway }: { gateway: KoconiGateway }) {
  const [deviceId, setDeviceId] = useState("demo-device");
  const [lat, setLat] = useState("35.681236");
  const [lng, setLng] = useState("139.767125");
  const [imageKey, setImageKey] = useState("uploads/demo.jpg");
  const [imageUrl, setImageUrl] = useState("https://picsum.photos/512/512");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>({});

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult({});

    try {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
        throw new Error("lat/lng must be valid numbers");
      }
      if (!imageUrl.trim()) {
        throw new Error("image URL is required for match flow");
      }

      const imageBlob = await fetchImageAsBlob(imageUrl.trim());

      const { photo, matchResult } = await createPhotoAndMatch(
        gateway,
        {
          deviceId: deviceId.trim(),
          lat: parsedLat,
          lng: parsedLng,
          capturedAt: new Date().toISOString(),
          imageKey: imageKey.trim(),
        },
        {
          file: imageBlob,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <Text style={styles.subTitle}>Photo to AI match to placement creation (MVP)</Text>

      <Field label="Device ID" value={deviceId} onChangeText={setDeviceId} />
      <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
      <Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
      <Field label="Image Key" value={imageKey} onChangeText={setImageKey} />
      <Field label="Image URL (for AI match)" value={imageUrl} onChangeText={setImageUrl} />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? "Submitting..." : "Run Full Flow"}</Text>
      </Pressable>

      {loading ? <ActivityIndicator size="small" color="#5BC0BE" /> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}

      {(result.photoId || result.topAssetId || result.placementId) && !error ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultText}>photoId: {result.photoId ?? "-"}</Text>
          <Text style={styles.resultText}>topAssetId: {result.topAssetId ?? "-"}</Text>
          <Text style={styles.resultText}>placementId: {result.placementId ?? "not created"}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }
  return response.blob();
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
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: "#CDE6E5",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3659",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
