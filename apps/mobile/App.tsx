import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL, checkApiReachability, createKoconiGateway } from "./src/infrastructure/http";
import { FriendsScreen } from "./src/presentation/screens/FriendsScreen";
import { MapScreen } from "./src/presentation/screens/MapScreen";
import { ProfileScreen } from "./src/presentation/screens/ProfileScreen";
import { RecordScreen, type AlbumItem, type AlbumPhotoInput } from "./src/presentation/screens/RecordScreen";
import { SearchScreen } from "./src/presentation/screens/SearchScreen";
import { TripScreen } from "./src/presentation/screens/TripScreen";
import { usePushNotifications } from "./src/application/hooks/usePushNotifications";
import { FriendsIcon, MapIcon, PhotoIcon, ProfileIcon } from "./src/presentation/components/TabIcons";
import type { KoconiUser, SharedMap } from "./src/domain/models/koconi";

const DEVICE_ID_KEY = "koconi:device_id";

function generateDeviceId(): string {
  return "device-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type GenerationStatus = "idle" | "pending" | "processing" | "done" | "failed";
type TabKey = "map" | "record" | "search" | "trip" | "friends" | "profile";

export type MapMode =
  | { type: "self" }
  | { type: "friend"; userTag: string; displayName: string }
  | { type: "shared"; mapId: number; name: string };

const ALBUM_STORAGE_KEY = "koconi:album";

type ApiConnectionState =
  | { status: "checking" }
  | { status: "ok" }
  | { status: "error"; message: string };

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
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
  const [deviceId, setDeviceId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<KoconiUser | null>(null);
  usePushNotifications(deviceId || null);
  const [friends, setFriends] = useState<KoconiUser[]>([]);
  const [sharedMaps, setSharedMaps] = useState<SharedMap[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>({ type: "self" });

  // スプラッシュ
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

  // ポーリング
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

  // API接続確認
  useEffect(() => {
    void handleCheckApiReachability();
  }, []);

  // デバイスID取得 & ユーザー登録
  useEffect(() => {
    const initUser = async () => {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
      try {
        const user = await gateway.registerUser({ deviceId: id });
        setCurrentUser(user);
        const [list, maps] = await Promise.all([
          gateway.listFriends(id),
          gateway.listSharedMaps(id),
        ]);
        setFriends(list);
        setSharedMaps(maps);
      } catch {
        // API未接続時は無視
      }
    };
    void initUser();
  }, [gateway]);

  const handleCheckApiReachability = async () => {
    setApiConnection({ status: "checking" });
    const result = await checkApiReachability();
    if (result.ok) {
      setApiConnection({ status: "ok" });
      return;
    }
    setApiConnection({ status: "error", message: result.message ?? "unknown error" });
  };

  // アルバム読み込み
  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const raw = await AsyncStorage.getItem(ALBUM_STORAGE_KEY);
        if (!raw) { setAlbumLoaded(true); return; }
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) { setAlbumLoaded(true); return; }
        const safeItems = parsed.filter((item): item is AlbumItem => {
          if (!item || typeof item !== "object") return false;
          const c = item as Record<string, unknown>;
          return (
            typeof c.id === "string" &&
            typeof c.uri === "string" &&
            typeof c.photoId === "number" &&
            typeof c.createdAt === "string"
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
    if (!albumLoaded) return;
    void AsyncStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(albumItems));
  }, [albumItems, albumLoaded]);

  // タブ切り替え時にハイライトリセット
  useEffect(() => {
    if (tab !== "record") setAlbumHighlightedPhotoId(null);
  }, [tab]);

  const handlePhotoPosted = (item: AlbumPhotoInput) => {
    setAlbumItems((prev) => [
      { id: `${item.photoId}-${item.createdAt}`, uri: item.uri, photoId: item.photoId, createdAt: item.createdAt },
      ...prev,
    ]);
    setMapRefreshSignal((prev) => prev + 1);
  };

  const handleDeleteAlbumItem = (id: string) => {
    setAlbumItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMarkerPhotoPress = (photoId: number) => {
    setAlbumHighlightedPhotoId(photoId);
    setTab("record");
  };

  const handleViewFriendMap = (friend: KoconiUser) => {
    setMapMode({ type: "friend", userTag: friend.userTag, displayName: friend.displayName });
    setTab("map");
  };

  const handleViewSharedMap = (map: SharedMap) => {
    setMapMode({ type: "shared", mapId: map.id, name: map.name });
    setTab("map");
  };

  const handleSharedMapCreated = (map: SharedMap) => {
    setSharedMaps((prev) => [map, ...prev]);
  };

  const TAB_ITEMS: { key: TabKey; label: string }[] = [
    { key: "map",     label: "Map"     },
    { key: "record",  label: "Photo"   },
    { key: "search",  label: "Search"  },
    { key: "trip",    label: "Trip"    },
    { key: "friends", label: "Friends" },
    { key: "profile", label: "Profile" },
  ];

  const TAB_ICON_SIZE = 22;
  const tabIcon = (key: TabKey, color: string) => {
    switch (key) {
      case "map":     return <MapIcon     color={color} size={TAB_ICON_SIZE} />;
      case "record":  return <PhotoIcon   color={color} size={TAB_ICON_SIZE} />;
      case "search":  return <Text style={{ color, fontSize: TAB_ICON_SIZE, lineHeight: TAB_ICON_SIZE + 2 }}>🔍</Text>;
      case "trip":    return <Text style={{ color, fontSize: TAB_ICON_SIZE, lineHeight: TAB_ICON_SIZE + 2 }}>✈️</Text>;
      case "friends": return <FriendsIcon color={color} size={TAB_ICON_SIZE} />;
      case "profile": return <ProfileIcon color={color} size={TAB_ICON_SIZE} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />

      {/* API接続バナー */}
      {apiConnection.status !== "ok" ? (
        <View style={styles.apiBanner}>
          <Text style={styles.apiBannerTitle}>
            {apiConnection.status === "checking" ? "接続を確認中..." : "接続エラー"}
          </Text>
          {apiConnection.status === "error" ? (
            <>
              <Text style={styles.apiBannerText}>{apiConnection.message}</Text>
              <Text style={styles.apiBannerText}>{API_BASE_URL}</Text>
              <Text style={styles.apiBannerGuide}>① APIサーバーを起動 → ② 同じWi-Fiに接続 → ③ .env を確認</Text>
              <Pressable style={styles.apiBannerRetry} onPress={handleCheckApiReachability}>
                <Text style={styles.apiBannerRetryText}>再接続</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {/* コンテンツ */}
      <View style={styles.content}>
        {tab === "map" ? (
          <MapScreen
            gateway={gateway}
            refreshSignal={mapRefreshSignal}
            onMarkerPhotoPress={handleMarkerPhotoPress}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
            deviceId={deviceId}
            friends={friends}
            sharedMaps={sharedMaps}
            currentUser={currentUser}
          />
        ) : null}
        {tab === "record" ? (
          <RecordScreen
            gateway={gateway}
            albumItems={albumItems}
            highlightedPhotoId={albumHighlightedPhotoId}
            onPhotoPosted={handlePhotoPosted}
            onStartPolling={startPolling}
            onDeleteItem={handleDeleteAlbumItem}
            deviceId={deviceId}
            currentUser={currentUser}
          />
        ) : null}
        {tab === "search" ? (
          <SearchScreen
            gateway={gateway}
            deviceId={deviceId}
          />
        ) : null}
        {tab === "trip" ? (
          <TripScreen
            gateway={gateway}
            deviceId={deviceId}
          />
        ) : null}
        {tab === "friends" ? (
          <FriendsScreen
            gateway={gateway}
            deviceId={deviceId}
            currentUser={currentUser}
            sharedMaps={sharedMaps}
            onViewFriendMap={handleViewFriendMap}
            onViewSharedMap={handleViewSharedMap}
            onSharedMapCreated={handleSharedMapCreated}
          />
        ) : null}
        {tab === "profile" ? (
          <ProfileScreen
            gateway={gateway}
            currentUser={currentUser}
            friendCount={friends.length}
            deviceId={deviceId}
            onUserUpdated={setCurrentUser}
          />
        ) : null}
      </View>

      {/* 3D生成トースト */}
      {generationStatus !== "idle" ? (
        <View
          style={[
            styles.toast,
            generationStatus === "done" && styles.toastDone,
            generationStatus === "failed" && styles.toastFailed,
          ]}
        >
          {generationStatus === "pending" || generationStatus === "processing" ? (
            <View style={styles.toastRow}>
              <ActivityIndicator size="small" color="#E86F00" />
              <Text style={styles.toastText}>
                {generationStatus === "pending" ? "生成待機中" : "3Dモデル生成中"}
              </Text>
              {generationPhotoId ? <Text style={styles.toastSub}>#{generationPhotoId}</Text> : null}
            </View>
          ) : generationStatus === "done" ? (
            <Pressable onPress={() => setGenerationStatus("idle")} style={styles.toastRow}>
              <Text style={styles.toastDoneText}>マップに追加されました  ✕</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setGenerationStatus("idle")} style={styles.toastRow}>
              <Text style={styles.toastFailedText}>生成に失敗しました  ✕</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* タブバー */}
      <View style={[styles.tabBarOuter, { bottom: insets.bottom }]}>
        <View style={styles.tabBar}>
          {TAB_ITEMS.map(({ key, label }) => {
            const active = tab === key;
            const iconColor = active ? "#F2C94C" : "rgba(255,255,255,0.55)";
            return (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.tabItem,
                  active && styles.tabItemActive,
                  pressed && !active && { opacity: 0.6 },
                ]}
                onPress={() => setTab(key)}
              >
                {tabIcon(key, iconColor)}
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* スプラッシュ */}
      {splashVisible ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.splash,
            { opacity: splashOpacity, transform: [{ scale: splashScale }] },
          ]}
          pointerEvents="none"
        >
          <Image source={require("./assets/splash.png")} style={styles.splashLogo} resizeMode="contain" />
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDFBE5",
  },

  // API バナー
  apiBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: "#FFF4F2",
    borderColor: "#EFCFCA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  apiBannerTitle: { color: "#B03020", fontSize: 13, fontWeight: "700" },
  apiBannerText: { color: "#8B2A20", fontSize: 12 },
  apiBannerGuide: { color: "#7A4040", fontSize: 12, lineHeight: 18 },
  apiBannerRetry: {
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "#E86F00", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  apiBannerRetryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },

  content: { flex: 1 },

  // トースト
  toast: {
    marginHorizontal: 32,
    marginBottom: 6,
    backgroundColor: "#FDFBE5",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "center",
    shadowColor: "#2A1F12",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  toastDone: { borderColor: "#B8D8B4", backgroundColor: "#F0F8EE" },
  toastFailed: { borderColor: "#EFCFCA", backgroundColor: "#FFF4F2" },
  toastRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toastText: { color: "#4A3E2E", fontSize: 13, fontWeight: "600" },
  toastSub: { color: "#9A8B78", fontSize: 12 },
  toastDoneText: { color: "#2E6B2E", fontSize: 13, fontWeight: "700" },
  toastFailedText: { color: "#B03020", fontSize: 13, fontWeight: "700" },

  // タブバー
  tabBarOuter: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 36,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 66,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    gap: 3,
    paddingVertical: 4,
  },
  tabItemActive: {
    backgroundColor: "#3C3C3C",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: "#F2C94C",
    fontWeight: "700",
  },

  // スプラッシュ
  splash: {
    backgroundColor: "#FDFBE5",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  splashLogo: { width: 260, height: 260 },
});
