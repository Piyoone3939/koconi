import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createKoconiGateway } from "./src/infrastructure/http";
import { AlbumScreen } from "./src/presentation/screens/AlbumScreen";
import { MapScreen } from "./src/presentation/screens/MapScreen";
import { PhotosScreen, type AlbumPhotoInput } from "./src/presentation/screens/PhotosScreen";
import { ProfileScreen } from "./src/presentation/screens/ProfileScreen";

type TabKey = "map" | "photos" | "album" | "profile";

type AlbumItem = {
  id: string;
  uri: string;
  photoId: number;
  createdAt: string;
};

const ALBUM_STORAGE_KEY = "koconi:album";

export default function App() {
  const gateway = useMemo(() => createKoconiGateway(), []);
  const [tab, setTab] = useState<TabKey>("map");
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [albumLoaded, setAlbumLoaded] = useState(false);

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
  };

  const activeLabel =
    tab === "map" ? "Map" : tab === "photos" ? "Photos" : tab === "album" ? "Album" : "Profile";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: tab === "map" ? "#FFFFFF" : "#0B132B" }}
      edges={["top"]}
    >
      <StatusBar style="light" />
      {tab !== "map" ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Koconi Mobile</Text>
          <Text style={styles.headerSubTitle}>Current: {activeLabel}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {tab === "map" ? <MapScreen gateway={gateway} /> : null}
        {tab === "photos" ? <PhotosScreen gateway={gateway} onPhotoPosted={handlePhotoPosted} /> : null}
        {tab === "album" ? <AlbumScreen items={albumItems} /> : null}
        {tab === "profile" ? <ProfileScreen /> : null}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Map" active={tab === "map"} onPress={() => setTab("map")} />
        <TabButton label="Photos" active={tab === "photos"} onPress={() => setTab("photos")} />
        <TabButton label="Album" active={tab === "album"} onPress={() => setTab("album")} />
        <TabButton label="Profile" active={tab === "profile"} onPress={() => setTab("profile")} />
      </View>
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1C2541",
    backgroundColor: "#0F1A33",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubTitle: {
    color: "#89A5B0",
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#1C2541",
    backgroundColor: "#0F1A33",
    padding: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#172546",
  },
  tabButtonActive: {
    backgroundColor: "#5BC0BE",
  },
  tabButtonText: {
    color: "#AFC5CD",
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#0B132B",
  },
});
