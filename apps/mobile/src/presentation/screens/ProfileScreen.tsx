import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { KoconiUser } from "../../domain/models/koconi";

type Props = {
  gateway: KoconiGateway;
  currentUser: KoconiUser | null;
  friendCount: number;
  deviceId: string;
  onUserUpdated?: (user: KoconiUser) => void;
};

export function ProfileScreen({ gateway, currentUser, friendCount, deviceId, onUserUpdated }: Props) {
  const [photoCount, setPhotoCount] = useState(0);
  const [placementCount, setPlacementCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");

  const displayName = currentUser?.displayName ?? "Koconi User";
  const userTag = currentUser?.userTag ?? "@koconi_...";
  const avatarInitial = displayName[0]?.toUpperCase() ?? "K";

  useEffect(() => {
    gateway.getStats().then((s) => {
      setPhotoCount(s.photoCount);
      setPlacementCount(s.placementCount);
    }).catch(() => {});
  }, [gateway]);

  const handleCopyTag = async () => {
    await Clipboard.setStringAsync(userTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Koconiで私のマップを見てみて！\nユーザータグ: ${userTag}`,
    });
  };

  const handleOpenEdit = () => {
    setEditName(displayName);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert("エラー", "表示名を入力してください");
      return;
    }
    try {
      const updated = await gateway.updateUser({
        deviceId,
        userId: currentUser.id,
        displayName: trimmed,
      });
      onUserUpdated?.(updated);
      setEditModalVisible(false);
    } catch {
      Alert.alert("エラー", "更新に失敗しました");
    }
  };

  const handleSettings = () => {
    Alert.alert("設定", "設定機能は準備中です");
  };

  const handleSocialAdd = () => {
    Alert.alert("ソーシャル連携", "この機能は準備中です");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー行 */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>プロフィール</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}
            onPress={handleSettings}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* アバター + 名前 */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Pressable style={styles.tagRow} onPress={handleCopyTag}>
              <Text style={styles.userTag}>{userTag}</Text>
              <Text style={styles.copyIcon}>{copied ? "✓" : "⧉"}</Text>
            </Pressable>
          </View>
        </View>

        {/* ソーシャル追加ボタン */}
        <Pressable
          style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.75 }]}
          onPress={handleSocialAdd}
        >
          <Text style={styles.socialBtnIcon}>🔗</Text>
          <Text style={styles.socialBtnText}>ソーシャルを追加</Text>
        </Pressable>

        {/* アクションボタン行 */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
            onPress={handleShare}
          >
            <Text style={styles.shareBtnIcon}>↑</Text>
            <Text style={styles.shareBtnText}>シェア</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
            onPress={handleOpenEdit}
          >
            <Text style={styles.editBtnIcon}>✎</Text>
            <Text style={styles.editBtnText}>編集</Text>
          </Pressable>
        </View>

        {/* 区切り */}
        <View style={styles.divider} />

        {/* 統計 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{photoCount}</Text>
            <Text style={styles.statLabel}>記録</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{friendCount}</Text>
            <Text style={styles.statLabel}>フレンド</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{placementCount}</Text>
            <Text style={styles.statLabel}>3Dモデル</Text>
          </View>
        </View>
      </ScrollView>

      {/* 表示名編集モーダル */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>表示名を編集</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="表示名"
              placeholderTextColor="#AAA"
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBE5",
  },
  scroll: { flex: 1 },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2A1F12",
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0EBD8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  settingsIcon: {
    fontSize: 18,
    color: "#6B5E4A",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#7697A0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2A1F12",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  userTag: {
    fontSize: 14,
    color: "#8A7B68",
    fontWeight: "500",
  },
  copyIcon: {
    fontSize: 14,
    color: "#E86F00",
  },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#7697A0",
    borderRadius: 50,
    paddingVertical: 14,
  },
  socialBtnIcon: { fontSize: 16 },
  socialBtnText: {
    color: "#7697A0",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E86F00",
    borderRadius: 50,
    paddingVertical: 14,
  },
  shareBtnIcon: { color: "#FFFFFF", fontSize: 16 },
  shareBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EAE3D0",
    borderRadius: 50,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  editBtnIcon: { color: "#4A3E2E", fontSize: 15 },
  editBtnText: {
    color: "#4A3E2E",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  divider: {
    height: 1,
    backgroundColor: "#DDD3BC",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2A1F12",
  },
  statLabel: {
    fontSize: 12,
    color: "#8A7B68",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#DDD3BC",
  },

  // 編集モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FDFBE5",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2A1F12",
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#DDD3BC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2A1F12",
    backgroundColor: "#FFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DDD3BC",
    backgroundColor: "#EAE3D0",
  },
  modalCancelText: {
    color: "#4A3E2E",
    fontWeight: "700",
    fontSize: 14,
  },
  modalSaveBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: "#E86F00",
  },
  modalSaveText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
