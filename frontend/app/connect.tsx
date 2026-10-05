import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { KeyRound, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { messageForError } from "@/src/api/errors";
import { useAuth } from "@/src/store/connection";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TextField } from "@/src/ui/Input";
import { Button } from "@/src/ui/primitives";
import { useToast } from "@/src/ui/Toast";

const BG_LIGHT =
  "https://images.unsplash.com/photo-1600531529272-023c4b821f14?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmx1ZSUyMG9mZmljZSUyMGJ1aWxkaW5nJTIwbW9kZXJuJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc5MTIyMDk1MHww&ixlib=rb-4.1.0&q=85";
const BG_DARK =
  "https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJsdWUlMjBkYXRhJTIwbmV0d29yayUyMHRlY2hub2xvZ3klMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc5MTIyMDk1MHww&ixlib=rb-4.1.0&q=85";

export default function Connect() {
  const styles = useStyles();
  const { scheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { connect } = useAuth();
  const toast = useToast();

  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = async () => {
    setError(null);
    if (!url.trim() || !apiKey.trim()) {
      setError("Panel adresi ve API anahtarı gerekli.");
      return;
    }
    setLoading(true);
    try {
      await connect(url.trim(), apiKey.trim());
      toast.show("Panele bağlanıldı", "success");
      router.replace("/(tabs)");
    } catch (e) {
      setError(messageForError(e));
      toast.show(messageForError(e), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: scheme === "dark" ? BG_DARK : BG_LIGHT }} style={styles.bg} contentFit="cover" />
      <LinearGradient
        colors={["transparent", scheme === "dark" ? "#0F172AEE" : "#0F172AE6"]}
        locations={[0, 0.65]}
        style={styles.scrim}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing["3xl"], paddingBottom: insets.bottom + spacing.xl }]}
        bottomOffset={spacing.xl}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <ShieldCheck size={26} color={colors.onBrandPrimary} />
          </View>
          <Text style={styles.brandText}>WISECP Admin</Text>
        </View>
        <Text style={styles.heroTitle}>Panelinizi bağlayın</Text>
        <Text style={styles.heroSubtitle}>
          Admin API anahtarınızla kurulumunuzu telefonunuzdan yönetin.
        </Text>

        <BlurView intensity={Platform.OS === "android" ? 30 : 50} tint={scheme} style={styles.card}>
          <TextField
            label="Panel Adresi"
            placeholder="https://panel.siteadiniz.com"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCorrect={false}
            testID="connect-url-input"
          />
          <TextField
            label="API Anahtarı"
            placeholder="wak_..."
            value={apiKey}
            onChangeText={setApiKey}
            secure
            autoCorrect={false}
            testID="connect-key-input"
          />
          {error ? (
            <Text style={styles.error} testID="connect-error">
              {error}
            </Text>
          ) : null}
          <Button label="Bağlan" icon={KeyRound} onPress={onConnect} loading={loading} full testID="connect-button" />
          <Text style={styles.hint}>
            Anahtarı panelde Ayarlar → API Kimlik Bilgileri bölümünden oluşturabilirsiniz. Yalnızca ihtiyaç duyduğunuz
            izinleri verin.
          </Text>
        </BlurView>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  bg: {
    ...(Platform.select({ default: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } }) as object),
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: fontSize["3xl"],
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#E2E8F0",
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  hint: {
    color: colors.muted,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
}));
