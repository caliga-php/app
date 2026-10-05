import { X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Tone } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { toneColors } from "./primitives";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

// Bottom sheet on top of RN Modal (no extra deps). Mounted above all chrome so
// it never sits under the tab bar.
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} testID="sheet-backdrop" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        {title ? (
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} testID="sheet-close">
              <X size={22} color={colors.muted} />
            </Pressable>
          </View>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export interface SheetAction {
  label: string;
  icon?: LucideIcon;
  tone?: Tone;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

export function ActionList({ actions }: { actions: SheetAction[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.actionList}>
      {actions.map((a, i) => {
        const fg = a.tone ? toneColors(colors, a.tone).fg : colors.onSurface;
        return (
          <Pressable
            key={i}
            onPress={a.onPress}
            disabled={a.disabled}
            testID={a.testID}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed, a.disabled && styles.disabled]}
          >
            {a.icon ? <a.icon size={20} color={fg} /> : null}
            <Text style={[styles.actionLabel, { color: fg }]}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  scroll: {
    flexGrow: 0,
  },
  actionList: {
    gap: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  actionLabel: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
  },
  disabled: {
    opacity: 0.4,
  },
}));
