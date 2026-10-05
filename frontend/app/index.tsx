import { Redirect } from "expo-router";
import { View } from "react-native";

import { useAuth } from "@/src/store/connection";
import { useTheme } from "@/src/theme";
import { LoadingState } from "@/src/ui/states";

// Entry gate: route to connect or the dashboard based on connection state.
export default function Index() {
  const { status } = useAuth();
  const { colors } = useTheme();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LoadingState message="Yükleniyor..." />
      </View>
    );
  }
  if (status === "disconnected") return <Redirect href="/connect" />;
  return <Redirect href="/(tabs)" />;
}
