import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { LockOverlay } from "@/src/components/LockOverlay";
import { queryClient } from "@/src/query-client";
import { AuthProvider, useAuth } from "@/src/store/connection";
import { useTheme } from "@/src/theme";
import { ToastProvider } from "@/src/ui/Toast";

LogBox.ignoreAllLogs(true);

function RootNavigator() {
  const { colors } = useTheme();
  const { status, locked, lockEnabled } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="connect" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="client/[id]" />
        <Stack.Screen name="client/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="invoice/[id]" />
        <Stack.Screen name="tickets/index" />
        <Stack.Screen name="ticket/[id]" />
      </Stack>
      {status === "connected" && lockEnabled && locked ? <LockOverlay /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <AuthProvider>
                <ToastProvider>
                  <RootNavigator />
                </ToastProvider>
              </AuthProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
