import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View, type ViewStyle } from "react-native";

import { statusLabel, statusTone, type Tone } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme, type ThemeColors } from "@/src/theme";

/* ------------------------------ Tone helper ------------------------------ */

export function toneColors(colors: ThemeColors, tone: Tone): { bg: string; fg: string } {
  switch (tone) {
    case "success":
      return { bg: colors.success + "22", fg: colors.success };
    case "warning":
      return { bg: colors.warning + "22", fg: colors.warning };
    case "error":
      return { bg: colors.error + "22", fg: colors.error };
    case "info":
      return { bg: colors.info + "22", fg: colors.info };
    default:
      return { bg: colors.surfaceTertiary, fg: colors.muted };
  }
}

/* ------------------------------ Button ------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  testID?: string;
  full?: boolean;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, icon: Icon, testID, full }: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "danger"
        ? colors.error
        : variant === "secondary"
          ? colors.surfaceTertiary
          : "transparent";
  const fg =
    variant === "primary" || variant === "danger"
      ? colors.onBrandPrimary
      : variant === "secondary"
        ? colors.onSurface
        : colors.brandPrimary;

  const handlePress = () => {
    if (isDisabled) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        full && { alignSelf: "stretch" },
        variant === "ghost" && styles.ghostButton,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {Icon ? <Icon size={18} color={fg} /> : null}
          <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------ StatusPill ------------------------------ */

export function StatusPill({ status, testID }: { status?: string | null; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tone = statusTone(status);
  const { bg, fg } = toneColors(colors, tone);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]} testID={testID}>
      <Text style={[styles.pillText, { color: fg }]} numberOfLines={1}>
        {statusLabel(status)}
      </Text>
    </View>
  );
}

/* ------------------------------ Avatar ------------------------------ */

export function Avatar({ text, size = 44 }: { text: string; size?: number }) {
  const styles = useStyles();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{text}</Text>
    </View>
  );
}

/* ------------------------------ Card ------------------------------ */

export function Card({ children, style, testID }: { children: ReactNode; style?: ViewStyle; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

/* ------------------------------ FieldRow ------------------------------ */

export function FieldRow({ label, value, valueNode }: { label: string; value?: ReactNode; valueNode?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {valueNode ?? (
        <Text style={styles.fieldValue} numberOfLines={2}>
          {value ?? "-"}
        </Text>
      )}
    </View>
  );
}

/* ------------------------------ SectionTitle ------------------------------ */

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

/* ------------------------------ KpiCard ------------------------------ */

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  onPress?: () => void;
  testID?: string;
}

export function KpiCard({ label, value, icon: Icon, tone = "info", onPress, testID }: KpiCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { bg, fg } = toneColors(colors, tone);
  const content = (
    <View style={styles.kpiCard} testID={testID}>
      {Icon ? (
        <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
          <Icon size={18} color={fg} />
        </View>
      ) : null}
      <Text style={styles.kpiValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.kpiWrap, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.kpiWrap}>{content}</View>;
}

const useStyles = makeStyles((colors) => ({
  button: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  ghostButton: {
    height: 44,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buttonLabel: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  pill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  avatar: {
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.onBrandSecondary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: fontSize.base,
    flexShrink: 0,
  },
  fieldValue: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  kpiWrap: {
    width: "48%",
  },
  kpiCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  kpiValue: {
    color: colors.onSurface,
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
}));
