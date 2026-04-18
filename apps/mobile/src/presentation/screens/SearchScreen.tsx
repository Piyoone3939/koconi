import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { KoconiUser, LandmarkPlacement, Trip } from "../../domain/models/koconi";

type SearchTab = "user" | "trip" | "placement";

export function SearchScreen({
  gateway,
  deviceId,
}: {
  gateway: KoconiGateway;
  deviceId: string;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("user");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<KoconiUser[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [placements, setPlacements] = useState<LandmarkPlacement[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const result = await gateway.search(q, ["user", "trip", "placement"], deviceId);
      setUsers(result.users);
      setTrips(result.trips);
      setPlacements(result.placements);
      setSearched(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gateway, query, deviceId]);

  const TABS: { key: SearchTab; label: string; count: number }[] = [
    { key: "user", label: "ユーザー", count: users.length },
    { key: "trip", label: "トリップ", count: trips.length },
    { key: "placement", label: "ピン", count: placements.length },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="検索..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchBtnText}>検索</Text>
          )}
        </Pressable>
      </View>

      {searched && (
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label} {t.count > 0 ? `(${t.count})` : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!searched && !loading && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>キーワードを入力して検索</Text>
        </View>
      )}

      {activeTab === "user" && (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.rowTitle}>{item.displayName}</Text>
                <Text style={styles.rowSub}>{item.userTag}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={searched ? <Text style={styles.noResult}>該当なし</Text> : null}
        />
      )}

      {activeTab === "trip" && (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>✈️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.rowSub} numberOfLines={1}>{item.description}</Text>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={searched ? <Text style={styles.noResult}>該当なし</Text> : null}
        />
      )}

      {activeTab === "placement" && (
        <FlatList
          data={placements}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>📍</Text>
              <View>
                <Text style={styles.rowTitle}>{item.assetId}</Text>
                <Text style={styles.rowSub}>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={searched ? <Text style={styles.noResult}>該当なし</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  searchBar: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingTop: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#6366f1",
  },
  tabText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  rowIcon: {
    fontSize: 24,
  },
  rowTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "600",
  },
  rowSub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#475569",
    fontSize: 15,
  },
  noResult: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
