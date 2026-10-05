import { Inbox, TriangleAlert, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { messageForError } from "@/src/api/errors";
import { fontSize, makeStyles, spacing, useTheme } from "@/src/theme";

import { Button } from "./primitives";

export function LoadingState({ message }: { message?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center} testID="loading-state">
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      {message ? <Text style={styles.subtitle}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center} testID="error-state">
      <TriangleAlert size={40} color={colors.error} />
      <Text style={styles.title}>Bir hata oluştu</Text>
      <Text style={styles.subtitle}>{messageForError(error)}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Tekrar dene" variant="secondary" onPress={onRetry} testID="error-retry-button" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.center} testID="empty-state">
      <Icon size={40} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function ListFooter({ loading }: { loading: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (!loading) return <View style={{ height: spacing.xl }} />;
  return (
    <View style={styles.footer}>
      <ActivityIndicator color={colors.brandPrimary} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["2xl"],
    gap: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.base,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.md,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
}));
