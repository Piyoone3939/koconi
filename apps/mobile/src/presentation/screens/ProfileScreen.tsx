import { ScrollView, StyleSheet, Text, View } from "react-native";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function ProfileScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>設定</Text>
      <Text style={styles.subTitle}>環境情報</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>API エンドポイント</Text>
        <Text style={styles.cardValue}>{apiBaseUrl}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ロードマップ</Text>
        <View style={styles.roadmapList}>
          <View style={styles.roadmapItem}>
            <View style={styles.roadmapDot} />
            <Text style={styles.cardText}>写真投稿・カメラ連携</Text>
          </View>
          <View style={styles.roadmapItem}>
            <View style={styles.roadmapDot} />
            <Text style={styles.cardText}>マップ表示・3Dピン</Text>
          </View>
          <View style={styles.roadmapItem}>
            <View style={[styles.roadmapDot, styles.roadmapDotPending]} />
            <Text style={[styles.cardText, styles.cardTextPending]}>認証・ユーザープロフィール</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#FDFBE5",
  },
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1209",
    letterSpacing: 0.3,
  },
  subTitle: {
    color: "#9A8B78",
    fontSize: 13,
    marginBottom: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8DFC8",
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    color: "#7697A0",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    color: "#1A1209",
    fontSize: 13,
    fontFamily: "monospace",
  },
  cardText: {
    color: "#6B5E4A",
    fontSize: 14,
  },
  cardTextPending: {
    color: "#9A8B78",
  },
  roadmapList: {
    gap: 10,
  },
  roadmapItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roadmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E86F00",
  },
  roadmapDotPending: {
    backgroundColor: "#D8CFC0",
  },
});
