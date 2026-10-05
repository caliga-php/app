import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useCurrencyCode } from "@/src/api/hooks";
import type { ClientListItem, InvoiceListItem, OrderListItem, ServiceListItem } from "@/src/api/types";
import { formatDate, formatMoney, initials } from "@/src/lib/format";
import { fontSize, makeStyles, spacing, useTheme } from "@/src/theme";

import { Avatar, StatusPill } from "./primitives";

export function ClientRow({ item }: { item: ClientListItem }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/client/${item.id}`)}
      testID={`client-row-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar text={initials(item.full_name)} />
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.company_name || item.email || "-"}
        </Text>
      </View>
      <View style={styles.right}>
        <StatusPill status={item.status} />
        <ChevronRight size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export function InvoiceRow({ item }: { item: InvoiceListItem }) {
  const styles = useStyles();
  const router = useRouter();
  const codeOf = useCurrencyCode();
  return (
    <Pressable
      onPress={() => router.push(`/invoice/${item.id}`)}
      testID={`invoice-row-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          Fatura {item.number}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.client?.full_name ?? "-"} · {formatDate(item.created_at)}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatMoney(item.total, codeOf(item.currency_id))}</Text>
        <StatusPill status={item.status} />
      </View>
    </Pressable>
  );
}

export function OrderRow({ item }: { item: OrderListItem }) {
  const styles = useStyles();
  const router = useRouter();
  const codeOf = useCurrencyCode();
  return (
    <Pressable
      onPress={() => router.push(`/order/${item.id}`)}
      testID={`order-row-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          #{item.order_number}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.client?.full_name ?? "-"} · {formatDate(item.created_at)}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatMoney(item.amount, codeOf(item.currency_id))}</Text>
        <StatusPill status={item.status} />
      </View>
    </Pressable>
  );
}

export function ServiceRow({ item }: { item: ServiceListItem }) {
  const styles = useStyles();
  const codeOf = useCurrencyCode();
  return (
    <View style={styles.row} testID={`service-row-${item.id}`}>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.domain || item.type || "-"} · {item.cycle ?? ""}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatMoney(item.amount, codeOf(item.currency_id))}</Text>
        <StatusPill status={item.status} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pressed: {
    backgroundColor: colors.surfaceTertiary,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.onSurface,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  sub: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  amount: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "700",
  },
}));
