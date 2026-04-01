import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const userTag = "@koconi_user";

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ヘッダー */}
        <Text style={styles.title}>フレンド</Text>

        {/* 検索バー */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ユーザータグで検索"
            placeholderTextColor="#9A8B78"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* 上部カード2列 */}
        <View style={styles.cardRow}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, styles.actionCardInvite, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.actionCardIcon}>👥</Text>
            <Text style={styles.actionCardTitle}>フレンドを招待</Text>
            <Text style={styles.actionCardSub}>一緒に記録しよう</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, styles.actionCardLeader, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.actionCardIcon}>📊</Text>
            <Text style={styles.actionCardTitle}>ランキング</Text>
            <Text style={styles.actionCardSub}>近日公開予定</Text>
          </Pressable>
        </View>

        {/* 招待カード */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteCardTitle}>フレンドを招待する</Text>
          <Text style={styles.inviteCardSub}>一緒に街を記録しよう</Text>

          {/* ダッシュ丸アイコン列 */}
          <View style={styles.avatarRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.avatarCircle}>
                <Text style={styles.avatarPlus}>+</Text>
              </View>
            ))}
          </View>

          {/* タグ共有 */}
          <Text style={styles.shareTagLabel}>タグをコピーして共有</Text>
          <Pressable
            style={({ pressed }) => [styles.tagPill, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.tagText}>{userTag}</Text>
            <Text style={styles.tagCopyIcon}>⧉</Text>
          </Pressable>

          {/* 共有ボタン */}
          <Pressable
            style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.inviteBtnText}>招待する</Text>
          </Pressable>
        </View>

        {/* フレンドリスト（空） */}
        <View style={styles.emptyFriends}>
          <Text style={styles.emptyFriendsText}>まだフレンドがいません</Text>
          <Text style={styles.emptyFriendsHint}>タグを共有してフレンドを追加しよう</Text>
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

  // ヘッダー
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2A1F12",
    letterSpacing: -0.5,
  },

  // 検索バー
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EBD8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#2A1F12",
  },

  // 上部カード2列
  cardRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  actionCardInvite: {
    backgroundColor: "#E8F0E8",
    borderWidth: 1,
    borderColor: "#C8DAC8",
  },
  actionCardLeader: {
    backgroundColor: "#EFE8D4",
    borderWidth: 1,
    borderColor: "#DDD3BC",
  },
  actionCardIcon: { fontSize: 22, marginBottom: 2 },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2A1F12",
  },
  actionCardSub: {
    fontSize: 11,
    color: "#8A7B68",
  },

  // 招待カード
  inviteCard: {
    backgroundColor: "#F0EBD8",
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#DDD3BC",
    alignItems: "center",
  },
  inviteCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2A1F12",
    textAlign: "center",
  },
  inviteCardSub: {
    fontSize: 12,
    color: "#8A7B68",
    textAlign: "center",
    marginTop: -8,
  },
  avatarRow: {
    flexDirection: "row",
    gap: -8,
    marginVertical: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#C8B89A",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDFBE5",
    marginLeft: -4,
  },
  avatarPlus: {
    color: "#C8B89A",
    fontSize: 18,
    fontWeight: "300",
  },
  shareTagLabel: {
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
  tagText: {
    color: "#FDFBE5",
    fontSize: 14,
    fontWeight: "600",
  },
  tagCopyIcon: {
    color: "#E86F00",
    fontSize: 16,
  },
  inviteBtn: {
    backgroundColor: "#E86F00",
    borderRadius: 50,
    paddingHorizontal: 48,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  inviteBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // フレンドリスト空
  emptyFriends: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  emptyFriendsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B5E4A",
  },
  emptyFriendsHint: {
    fontSize: 12,
    color: "#9A8B78",
    textAlign: "center",
  },
});
