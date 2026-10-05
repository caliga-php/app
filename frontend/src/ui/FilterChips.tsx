import { ScrollView, Text, Pressable } from "react-native";

import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export interface ChipItem {
  value: string;
  label: string;
}

interface FilterChipsProps {
  items: ChipItem[];
  selected: string;
  onSelect: (value: string) => void;
}

// Horizontal, single-line scroller. Chips never wrap; extras scroll off-screen.
// Selected chip changes color/border only, never its size.
export function FilterChips({ items, selected, onSelect }: FilterChipsProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {items.map((item) => {
        const active = item.value === selected;
        return (
          <Pressable
            key={item.value}
            onPress={() => onSelect(item.value)}
            testID={`filter-chip-${item.value || "all"}`}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary, fontSize: fontSize.base, fontWeight: "600" }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    maxHeight: 56,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
}));
