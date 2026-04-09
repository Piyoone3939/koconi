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
import * as Clipboard from "expo-clipboard";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { FriendRequest, KoconiUser, SharedMap } from "../../domain/models/koconi";
import { useEffect } from "react";

type Props = {
  gateway: KoconiGateway;
  deviceId: string;
  currentUser: KoconiUser | null;
  sharedMaps: SharedMap[];
  onViewFriendMap: (friend: KoconiUser) => void;
  onViewSharedMap: (map: SharedMap) => void;
  onSharedMapCreated: (map: SharedMap) => void;
};

export function FriendsScreen({
  gateway,
  deviceId,
  currentUser,
  sharedMaps,
  onViewFriendMap,
  onViewSharedMap,
  onSharedMapCreated,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<KoconiUser | null | "not_found">(null);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<KoconiUser[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [newMapName, setNewMapName] = useState("");
  const [creatingMap, setCreatingMap] = useState(false);
  const [showNewMapInput, setShowNewMapInput] = useState(false);

  const userTag = currentUser?.userTag ?? "@koconi_...";

  useEffect(() => {
    if (!deviceId) return;
    void loadFriends();
    void loadIncoming();
  }, [deviceId]);

  const loadFriends = async () => {
    try {
      const list = await gateway.listFriends(deviceId);
      setFriends(list);
    } catch {
      // ignore
    }
  };

  const loadIncoming = async () => {
    try {
      const list = await gateway.listIncomingRequests(deviceId);
      setIncoming(list);
    } catch {
      // ignore
    }
  };

  const handleCopyTag = async () => {
    await Clipboard.setStringAsync(userTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async () => {
    const tag = searchQuery.trim();
    if (!tag) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const user = await gateway.searchUser(tag);
      setSearchResult(user ?? "not_found");
    } catch {
      setSearchResult("not_found");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (toTag: string) => {
    setSendingTo(toTag);
    try {
      await gateway.sendFriendRequest({ deviceId, toTag });
      setSearchResult(null);
      setSearchQuery("");
    } catch {
      // ignore
    } finally {
      setSendingTo(null);
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await gateway.acceptFriendRequest(deviceId, requestId);
      await loadIncoming();
      await loadFriends();
    } catch {
      // ignore
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await gateway.rejectFriendRequest(deviceId, requestId);
      await loadIncoming();
    } catch {
      // ignore
    }
  };

  const handleCreateSharedMap = async () => {
    const name = newMapName.trim();
    if (!name || !deviceId) return;
    setCreatingMap(true);
    try {
      const map = await gateway.createSharedMap({ deviceId, name });
      onSharedMapCreated(map);
      setNewMapName("");
      setShowNewMapInput(false);
    } catch {
      // ignore
    } finally {
      setCreatingMap(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>フレンド</Text>

        {/* タグ共有 */}
        <View style={styles.tagCard}>
          <Text style={styles.tagCardLabel}>あなたのタグ</Text>
          <Pressable
            style={({ pressed }) => [styles.tagPill, pressed && { opacity: 0.7 }]}
            onPress={handleCopyTag}
          >
            <Text style={styles.tagText}>{userTag}</Text>
            <Text style={styles.tagCopyIcon}>{copied ? "✓" : "⧉"}</Text>
          </Pressable>
        </View>

        {/* 検索 */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="タグで検索 (@koconi_xxxxx)"
              placeholderTextColor="#9A8B78"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <Pressable
              style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.7 }]}
              onPress={handleSearch}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FDFBE5" />
              ) : (
                <Text style={styles.searchBtnText}>検索</Text>
              )}
            </Pressable>
          </View>

          {searchResult && searchResult !== "not_found" && (
            <View style={styles.searchResultCard}>
              <View style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{searchResult.displayName[0] ?? "?"}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{searchResult.displayName}</Text>
                  <Text style={styles.userTagText}>{searchResult.userTag}</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handleSendRequest(searchResult.userTag)}
                disabled={sendingTo === searchResult.userTag}
              >
                {sendingTo === searchResult.userTag ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addBtnText}>申請を送る</Text>
                )}
              </Pressable>
            </View>
          )}
          {searchResult === "not_found" && (
            <Text style={styles.notFoundText}>ユーザーが見つかりませんでした</Text>
          )}
        </View>

        {/* 受信した申請 */}
        {incoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>フレンド申請 ({incoming.length})</Text>
            {incoming.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{req.fromUser.displayName[0] ?? "?"}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{req.fromUser.displayName}</Text>
                    <Text style={styles.userTagText}>{req.fromUser.userTag}</Text>
                  </View>
                </View>
                <View style={styles.requestBtns}>
                  <Pressable
                    style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => handleAccept(req.id)}
                  >
                    <Text style={styles.acceptBtnText}>承認</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => handleReject(req.id)}
                  >
                    <Text style={styles.rejectBtnText}>拒否</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* フレンドリスト */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>フレンド ({friends.length})</Text>
          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyFriendsText}>まだフレンドがいません</Text>
              <Text style={styles.emptyFriendsHint}>タグを共有してフレンドを追加しよう</Text>
            </View>
          ) : (
            friends.map((u) => (
              <View key={u.id} style={styles.friendCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.displayName[0] ?? "?"}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userTagText}>{u.userTag}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.mapViewBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => onViewFriendMap(u)}
                >
                  <Text style={styles.mapViewBtnText}>マップを見る</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* 共有マップ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>共有マップ ({sharedMaps.length})</Text>
            <Pressable
              style={({ pressed }) => [styles.newMapToggleBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setShowNewMapInput((v) => !v)}
            >
              <Text style={styles.newMapToggleBtnText}>{showNewMapInput ? "キャンセル" : "+ 新規作成"}</Text>
            </Pressable>
          </View>

          {showNewMapInput && (
            <View style={styles.newMapRow}>
              <TextInput
                style={styles.newMapInput}
                placeholder="マップ名"
                placeholderTextColor="#9A8B78"
                value={newMapName}
                onChangeText={setNewMapName}
                returnKeyType="done"
                onSubmitEditing={handleCreateSharedMap}
              />
              <Pressable
                style={({ pressed }) => [styles.createMapBtn, pressed && { opacity: 0.8 }]}
                onPress={handleCreateSharedMap}
                disabled={creatingMap || !newMapName.trim()}
              >
                {creatingMap ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createMapBtnText}>作成</Text>
                )}
              </Pressable>
            </View>
          )}

          {sharedMaps.length === 0 && !showNewMapInput ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyFriendsText}>共有マップがありません</Text>
              <Text style={styles.emptyFriendsHint}>フレンドと思い出を共有しよう</Text>
            </View>
          ) : (
            sharedMaps.map((m) => (
              <View key={m.id} style={styles.friendCard}>
                <View style={[styles.userAvatar, styles.mapAvatar]}>
                  <Text style={styles.userAvatarText}>🗺</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{m.name}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.mapViewBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => onViewSharedMap(m)}
                >
                  <Text style={styles.mapViewBtnText}>開く</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFBE5" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 120 },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2A1F12",
    letterSpacing: -0.5,
  },

  // タグカード
  tagCard: {
    backgroundColor: "#F0EBD8",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#DDD3BC",
    alignItems: "center",
  },
  tagCardLabel: {
    fontSize: 12,
    color: "#8A7B68",
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2A1F12",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tagText: { color: "#FDFBE5", fontSize: 14, fontWeight: "600" },
  tagCopyIcon: { color: "#E86F00", fontSize: 16 },

  // 検索
  searchSection: { gap: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#2A1F12", paddingVertical: 6 },
  searchBtn: {
    backgroundColor: "#E86F00",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: "center",
  },
  searchBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  searchResultCard: {
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  notFoundText: { color: "#9A8B78", fontSize: 13, textAlign: "center", paddingVertical: 4 },

  // セクション
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A3E2E",
  },

  // ユーザー行
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7697A0",
    alignItems: "center",
    justifyContent: "center",
  },
  mapAvatar: { backgroundColor: "#DDD3BC" },
  userAvatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontWeight: "700", color: "#2A1F12" },
  userTagText: { fontSize: 12, color: "#8A7B68" },

  // 申請ボタン
  addBtn: {
    backgroundColor: "#E86F00",
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // 申請カード
  requestCard: {
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  requestBtns: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#E86F00",
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#EAE3D0",
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  rejectBtnText: { color: "#6B5E4A", fontWeight: "700", fontSize: 13 },

  // フレンドカード
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  mapViewBtn: {
    backgroundColor: "#2A1F12",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapViewBtnText: { color: "#F2C94C", fontWeight: "700", fontSize: 12 },

  // 新規マップ
  newMapToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#E86F00",
    borderRadius: 20,
  },
  newMapToggleBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  newMapRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  newMapInput: { flex: 1, fontSize: 14, color: "#2A1F12", paddingVertical: 6 },
  createMapBtn: {
    backgroundColor: "#E86F00",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: "center",
  },
  createMapBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // 空
  emptyFriends: { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyFriendsText: { fontSize: 14, fontWeight: "600", color: "#6B5E4A" },
  emptyFriendsHint: { fontSize: 12, color: "#9A8B78", textAlign: "center" },
});
