import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL, checkApiReachability, createKoconiGateway } from "./src/infrastructure/http";
import { AlbumScreen } from "./src/presentation/screens/AlbumScreen";
import { MapScreen } from "./src/presentation/screens/MapScreen";
import { PhotosScreen, type AlbumPhotoInput } from "./src/presentation/screens/PhotosScreen";
import { ProfileScreen } from "./src/presentation/screens/ProfileScreen";

type GenerationStatus = "idle" | "pending" | "processing" | "done" | "failed";

type TabKey = "map" | "photos" | "album" | "profile";

type AlbumItem = {
  id: string;
  uri: string;
  photoId: number;
  createdAt: string;
};

const ALBUM_STORAGE_KEY = "koconi:album";

type ApiConnectionState =
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; message: string };

export default function App() {
  const gateway = useMemo(() => createKoconiGateway(), []);
  const [tab, setTab] = useState<TabKey>("map");
  const [apiConnection, setApiConnection] = useState<ApiConnectionState>({ status: "checking" });
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [mapRefreshSignal, setMapRefreshSignal] = useState(0);
  const [albumHighlightedPhotoId, setAlbumHighlightedPhotoId] = useState<number | null>(null);
  const [albumLoaded, setAlbumLoaded] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generationPhotoId, setGenerationPhotoId] = useState<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashScale = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashScale, {
          toValue: 10,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setSplashVisible(false));
    }, 1800);
    return () => clearTimeout(timer);
  }, [splashOpacity, splashScale]);

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
          setMapRefreshSignal((prev) => prev + 1);
        } else if (s.status === "failed" || s.status === "not_found") {
          clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          setGenerationStatus("failed");
        } else {
          setGenerationStatus(s.status as GenerationStatus);
        }
      } catch {
        // ポーリングエラーは無視
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    void handleCheckApiReachability();
  }, []);

  const handleCheckApiReachability = async () => {
    setApiConnection({ status: "checking" });
    const result = await checkApiReachability();
    if (result.ok) {
      setApiConnection({ status: "ok" });
      return;
    }
    setApiConnection({
      status: "error",
      message: result.message ?? "unknown error",
    });
  };

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const raw = await AsyncStorage.getItem(ALBUM_STORAGE_KEY);
        if (!raw) {
          setAlbumLoaded(true);
          return;
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
          setAlbumLoaded(true);
          return;
        }

        const safeItems = parsed.filter((item): item is AlbumItem => {
          if (!item || typeof item !== "object") {
            return false;
          }
          const candidate = item as Record<string, unknown>;
          return (
            typeof candidate.id === "string" &&
            typeof candidate.uri === "string" &&
            typeof candidate.photoId === "number" &&
            typeof candidate.createdAt === "string"
          );
        });

        setAlbumItems(safeItems);
      } catch {
        setAlbumItems([]);
      } finally {
        setAlbumLoaded(true);
      }
    };

    void loadAlbum();
  }, []);

  useEffect(() => {
    if (!albumLoaded) {
      return;
    }

    void AsyncStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(albumItems));
  }, [albumItems, albumLoaded]);

  useEffect(() => {
    if (tab !== "album") {
      setAlbumHighlightedPhotoId(null);
    }
  }, [tab]);

  const handlePhotoPosted = (item: AlbumPhotoInput) => {
    setAlbumItems((prev) => [
      {
        id: `${item.photoId}-${item.createdAt}`,
        uri: item.uri,
        photoId: item.photoId,
        createdAt: item.createdAt,
      },
      ...prev,
    ]);
    setMapRefreshSignal((prev) => prev + 1);
  };

  const handleDeleteAlbumItem = (id: string) => {
    setAlbumItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMarkerPhotoPress = (photoId: number) => {
    setAlbumHighlightedPhotoId(photoId);
    setTab("album");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FDFBE5" }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {tab !== "map" ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Koconi</Text>
        </View>
      ) : null}

      {apiConnection.status !== "ok" ? (
        <View style={styles.apiBanner}>
          <Text style={styles.apiBannerTitle}>
            {apiConnection.status === "checking" ? "API接続を確認中..." : "API接続エラー"}
          </Text>
          {apiConnection.status === "error" ? (
            <>
              <Text style={styles.apiBannerText}>{apiConnection.message}</Text>
              <Text style={styles.apiBannerText}>endpoint: {API_BASE_URL}</Text>
              <Text style={styles.apiBannerGuide}>1) APIサーバーを起動</Text>
              <Text style={styles.apiBannerGuide}>2) スマホとPCを同じWi-Fiに接続</Text>
              <Text style={styles.apiBannerGuide}>3) .env の EXPO_PUBLIC_API_BASE_URL を確認</Text>
              <Pressable style={styles.apiBannerRetry} onPress={handleCheckApiReachability}>
                <Text style={styles.apiBannerRetryText}>再接続</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.content}>
        {tab === "map" ? (
          <MapScreen
            gateway={gateway}
            refreshSignal={mapRefreshSignal}
            onMarkerPhotoPress={handleMarkerPhotoPress}
          />
        ) : null}
        {tab === "photos" ? (
          <PhotosScreen
            gateway={gateway}
            onPhotoPosted={handlePhotoPosted}
            onStartPolling={startPolling}
          />
        ) : null}
        {tab === "album" ? (
          <AlbumScreen
            items={albumItems}
            highlightedPhotoId={albumHighlightedPhotoId}
            onDeleteItem={handleDeleteAlbumItem}
          />
        ) : null}
        {tab === "profile" ? <ProfileScreen /> : null}
      </View>

      {generationStatus !== "idle" ? (
        <View
          style={[
            styles.generationBanner,
            generationStatus === "done" ? styles.generationBannerDone : null,
            generationStatus === "failed" ? styles.generationBannerFailed : null,
          ]}
        >
          {generationStatus === "pending" || generationStatus === "processing" ? (
            <View style={styles.generationBannerRow}>
              <ActivityIndicator size="small" color="#E86F00" />
              <Text style={styles.generationBannerText}>
                {generationStatus === "pending" ? "3Dモデル生成待機中..." : "3Dモデル生成中..."}
              </Text>
            </View>
          ) : generationStatus === "done" ? (
            <Pressable onPress={() => setGenerationStatus("idle")}>
              <Text style={styles.generationBannerDoneText}>3Dモデル生成完了！マップに反映されました  ✕</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setGenerationStatus("idle")}>
              <Text style={styles.generationBannerFailedText}>3Dモデル生成に失敗しました  ✕</Text>
            </Pressable>
          )}
          {generationPhotoId && (generationStatus === "pending" || generationStatus === "processing") ? (
            <Text style={styles.generationBannerPhotoId}>photo #{generationPhotoId}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.tabBar}>
        <TabButton label="地図" active={tab === "map"} onPress={() => setTab("map")} />
        <TabButton label="写真" active={tab === "photos"} onPress={() => setTab("photos")} />
        <TabButton label="アルバム" active={tab === "album"} onPress={() => setTab("album")} />
        <TabButton label="設定" active={tab === "profile"} onPress={() => setTab("profile")} />
      </View>

      {splashVisible ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.splash,
            { opacity: splashOpacity, transform: [{ scale: splashScale }] },
          ]}
          pointerEvents="none"
        >
          <Image
            source={require("./assets/splash.png")}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active ? styles.tabButtonActive : null]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFC8",
    backgroundColor: "#FDFBE5",
  },
  headerTitle: {
    color: "#E86F00",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  apiBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#FFF0EE",
    borderColor: "#EFCFCA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  apiBannerTitle: {
    color: "#C0392B",
    fontSize: 13,
    fontWeight: "700",
  },
  apiBannerText: {
    color: "#8B2A20",
    fontSize: 12,
  },
  apiBannerGuide: {
    color: "#6B4040",
    fontSize: 12,
  },
  apiBannerRetry: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E86F00",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  apiBannerRetryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E8DFC8",
    backgroundColor: "#FDFBE5",
    padding: 8,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: "#E86F00",
  },
  tabButtonText: {
    color: "#7697A0",
    fontWeight: "600",
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  generationBanner: {
    backgroundColor: "#FDFBE5",
    borderTopWidth: 1,
    borderTopColor: "#E8DFC8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 2,
  },
  generationBannerDone: {
    borderTopColor: "#5D8A4E",
    backgroundColor: "#EFF7EE",
  },
  generationBannerFailed: {
    borderTopColor: "#C0392B",
    backgroundColor: "#FFF0EE",
  },
  generationBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  generationBannerText: {
    color: "#6B5E4A",
    fontSize: 13,
  },
  generationBannerDoneText: {
    color: "#3D7A3D",
    fontSize: 13,
    fontWeight: "700",
  },
  generationBannerFailedText: {
    color: "#C0392B",
    fontSize: 13,
  },
  generationBannerPhotoId: {
    color: "#9A8B78",
    fontSize: 11,
  },
  splash: {
    backgroundColor: "#FDFBE5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  splashLogo: {
    width: 260,
    height: 260,
  },
});
