import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSize, makeStyles, spacing, useTheme } from "@/src/theme";

interface ScreenProps {
  children: ReactNode;
  // When false, the screen fills under the tab bar; pass true to pad bottom.
  padBottom?: boolean;
}

// Full-bleed screen. Background paints edge to edge; content is positioned by
// insets at the call sites that need them.
export function Screen({ children }: ScreenProps) {
  const styles = useStyles();
  const { scheme } = useTheme();
  return (
    <View style={styles.screen}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      {children}
    </View>
  );
}

interface HeaderProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

// Sticky top header, safe-area aware, with optional back button + right slot.
export function Header({ title, subtitle, back, right }: HeaderProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
            testID="header-back-button"
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <ChevronLeft size={26} color={colors.onSurface} />
          </Pressable>
        ) : null}
        <View style={styles.headerTitles}>
          <Text style={styles.title} numberOfLines={1} testID="header-title">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 36,
  },
  backBtn: {
    marginLeft: -6,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    color: colors.onSurface,
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
}));
