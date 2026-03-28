import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MobileHomeScreen } from "./src/presentation/screens/MobileHomeScreen";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B132B" }}>
      <StatusBar style="light" />
      <MobileHomeScreen />
    </SafeAreaView>
  );
}
