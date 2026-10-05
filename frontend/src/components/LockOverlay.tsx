import { Fingerprint, Lock } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/store/connection";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Button } from "@/src/ui/primitives";

// Full-screen lock shown over everything when the app returns from background
// (if lock is enabled). Uses device biometrics / passcode via expo-local-auth.
export function LockOverlay() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { unlock } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        // No biometrics set up on the device — let the user through.
        unlock();
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "WISECP Admin kilidini aç",
        cancelLabel: "İptal",
      });
      if (res.success) unlock();
      else setError("Doğrulama başarısız. Tekrar deneyin.");
    } catch {
      setError("Doğrulama başlatılamadı.");
    }
  }, [unlock]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]} testID="lock-overlay">
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Lock size={40} color={colors.onBrandPrimary} />
        </View>
        <Text style={styles.title}>Uygulama Kilitli</Text>
        <Text style={styles.subtitle}>Devam etmek için kimliğinizi doğrulayın.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.action}>
          <Button label="Kilidi Aç" icon={Fingerprint} onPress={authenticate} testID="unlock-button" />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    zIndex: 2000,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontSize: fontSize["2xl"],
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.base,
    textAlign: "center",
  },
  error: {
    color: colors.error,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: "stretch",
  },
}));
