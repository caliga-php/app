import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { flattenPages, useInvoices, useOrders } from "@/src/api/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { FilterChips, type ChipItem } from "@/src/ui/FilterChips";
import { Header, Screen } from "@/src/ui/Screen";
import { InvoiceRow, OrderRow } from "@/src/ui/rows";
import { EmptyState, ErrorState, ListFooter, LoadingState } from "@/src/ui/states";

type Segment = "invoices" | "orders";

const INVOICE_CHIPS: ChipItem[] = [
  { value: "", label: "Tümü" },
  { value: "unpaid", label: "Ödenmedi" },
  { value: "paid", label: "Ödendi" },
  { value: "refund", label: "İade" },
  { value: "cancelled", label: "İptal" },
];
const ORDER_CHIPS: ChipItem[] = [
  { value: "", label: "Tümü" },
  { value: "pending", label: "Bekliyor" },
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal" },
];

export default function Billing() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>("invoices");
  const [invStatus, setInvStatus] = useState("");
  const [ordStatus, setOrdStatus] = useState("");

  const invoices = useInvoices(invStatus);
  const orders = useOrders(ordStatus);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const query = segment === "invoices" ? invoices : orders;
  const items = useMemo(() => flattenPages(query as any), [query]);

  return (
    <Screen>
      <Header title="Finans" />
      <View style={styles.segmentWrap}>
        <Segmented
          segment={segment}
          onChange={setSegment}
          colors={colors}
        />
      </View>
      <FilterChips
        items={segment === "invoices" ? INVOICE_CHIPS : ORDER_CHIPS}
        selected={segment === "invoices" ? invStatus : ordStatus}
        onSelect={segment === "invoices" ? setInvStatus : setOrdStatus}
      />

      {query.isLoading ? (
        <LoadingState message="Yükleniyor..." />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items as any[]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            segment === "invoices" ? <InvoiceRow item={item} /> : <OrderRow item={item} />
          }
          contentContainerStyle={items.length ? { paddingBottom: bottomChrome + spacing["2xl"] } : styles.emptyWrap}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState title={segment === "invoices" ? "Fatura bulunamadı" : "Sipariş bulunamadı"} />
          }
          ListFooterComponent={<ListFooter loading={query.isFetchingNextPage} />}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.brandPrimary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function Segmented({
  segment,
  onChange,
  colors,
}: {
  segment: Segment;
  onChange: (s: Segment) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const styles = useStyles();
  const options: { key: Segment; label: string }[] = [
    { key: "invoices", label: "Faturalar" },
    { key: "orders", label: "Siparişler" },
  ];
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === segment;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            testID={`segment-${o.key}`}
            style={[styles.segmentItem, active && { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.segmentLabel, { color: active ? colors.onSurface : colors.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segmentLabel: {
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  emptyWrap: {
    flexGrow: 1,
  },
}));
