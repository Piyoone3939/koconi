import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createKoconiGateway } from "./src/infrastructure/http";
import { MapScreen } from "./src/presentation/screens/MapScreen";
import { PhotosScreen } from "./src/presentation/screens/PhotosScreen";
import { ProfileScreen } from "./src/presentation/screens/ProfileScreen";

type TabKey = "map" | "photos" | "profile";

export default function App() {
  const gateway = useMemo(() => createKoconiGateway(), []);
  const [tab, setTab] = useState<TabKey>("map");

  const activeLabel = tab === "map" ? "Map" : tab === "photos" ? "Photos" : "Profile";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B132B" }}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Koconi Mobile</Text>
        <Text style={styles.headerSubTitle}>Current: {activeLabel}</Text>
      </View>

      <View style={styles.content}>
        {tab === "map" ? <MapScreen gateway={gateway} /> : null}
        {tab === "photos" ? <PhotosScreen gateway={gateway} /> : null}
        {tab === "profile" ? <ProfileScreen /> : null}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Map" active={tab === "map"} onPress={() => setTab("map")} />
        <TabButton label="Photos" active={tab === "photos"} onPress={() => setTab("photos")} />
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
