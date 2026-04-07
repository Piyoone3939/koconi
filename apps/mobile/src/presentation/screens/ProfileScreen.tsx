import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { KoconiGateway } from "../../domain/ports/koconi-gateway";
import type { KoconiUser } from "../../domain/models/koconi";

type Props = { gateway: KoconiGateway; currentUser: KoconiUser | null; friendCount: number };

export function ProfileScreen({ gateway, currentUser, friendCount }: Props) {
  const [photoCount, setPhotoCount] = useState(0);
  const [placementCount, setPlacementCount] = useState(0);
  const [copied, setCopied] = useState(false);

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
          <Pressable style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}>
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
        >
          <Text style={styles.socialBtnIcon}>🔗</Text>
          <Text style={styles.socialBtnText}>ソーシャルを追加</Text>
        </Pressable>

        {/* アクションボタン行 */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.shareBtnIcon}>↑</Text>
            <Text style={styles.shareBtnText}>シェア</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
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

  // ヘッダー行
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

  // アバター + 名前
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

  // ソーシャルボタン
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

  // アクションボタン行
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

  // 区切り
  divider: {
    height: 1,
    backgroundColor: "#DDD3BC",
  },

  // 統計
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
});
