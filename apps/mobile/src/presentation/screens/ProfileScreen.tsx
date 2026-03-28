import { ScrollView, StyleSheet, Text, View } from "react-native";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subTitle}>Environment and project status</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API Base URL</Text>
        <Text style={styles.cardText}>{apiBaseUrl}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roadmap</Text>
        <Text style={styles.cardText}>1. Camera picker integration</Text>
        <Text style={styles.cardText}>2. Real map rendering + pin overlay</Text>
        <Text style={styles.cardText}>3. Auth and user profile sync</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subTitle: {
    color: "#9CB4BD",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#1C2541",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: "#5BC0BE",
    fontWeight: "700",
  },
  cardText: {
    color: "#CDE6E5",
    fontSize: 13,
  },
});
