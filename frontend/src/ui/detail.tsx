import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { statusTone } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { StatusPill, toneColors } from "./primitives";

// Big amount + status header used on invoice / order detail screens.
export function AmountHeader({ amount, status }: { amount: string; status?: string | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { bg } = toneColors(colors, statusTone(status));
  return (
    <View style={[styles.amountHeader, { backgroundColor: bg }]} testID="amount-header">
      <Text style={styles.amount}>{amount}</Text>
      <StatusPill status={status} />
    </View>
  );
}

export function LinkRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress: () => void;
  icon?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.linkTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.linkSub}>{subtitle}</Text> : null}
      </View>
      {right}
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  amountHeader: {
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  amount: {
    color: colors.onSurface,
    fontSize: fontSize["3xl"],
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  linkTitle: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  linkSub: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
}));
