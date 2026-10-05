import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { flattenPages, useTickets, useTicketStatusDefs } from "@/src/api/hooks";
import type { TicketListItem } from "@/src/api/types";
import { formatRelative, priorityLabel, priorityTone } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { FilterChips, type ChipItem } from "@/src/ui/FilterChips";
import { Header, Screen } from "@/src/ui/Screen";
import { StatusPill, toneColors } from "@/src/ui/primitives";
import { EmptyState, ErrorState, ListFooter, LoadingState } from "@/src/ui/states";

function TicketRow({ item }: { item: TicketListItem }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const pr = toneColors(colors, priorityTone(item.priority));
  const unread = item.admin_unread;
  return (
    <Pressable
      onPress={() => router.push(`/ticket/${item.id}`)}
      testID={`ticket-row-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.unreadDot, { backgroundColor: unread ? colors.brandPrimary : "transparent" }]} />
      <View style={styles.main}>
        <Text style={[styles.subject, unread && { fontWeight: "800" }]} numberOfLines={1}>
          {item.subject || "(konu yok)"}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.reference} · {item.client?.full_name ?? "-"} · {item.department?.name ?? ""}
        </Text>
        <Text style={styles.time}>{formatRelative(item.last_reply_at ?? item.created_at)}</Text>
      </View>
      <View style={styles.right}>
        <StatusPill status={item.status} />
        <View style={[styles.priorityPill, { backgroundColor: pr.bg }]}>
          <Text style={[styles.priorityText, { color: pr.fg }]}>{priorityLabel(item.priority)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function TicketsList() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState("");

  const statusDefs = useTicketStatusDefs();
  const query = useTickets(status);
  const items = useMemo(() => flattenPages(query), [query]);

  const chips: ChipItem[] = useMemo(() => {
    const base: ChipItem[] = [{ value: "", label: "Tümü" }];
    (statusDefs.data ?? [])
      .filter((d) => d.type === "standard")
      .forEach((d) => base.push({ value: d.key, label: d.name }));
    return base;
  }, [statusDefs.data]);

  return (
    <Screen>
      <Header title="Destek Talepleri" back />
      <FilterChips items={chips} selected={status} onSelect={setStatus} />

      {query.isLoading ? (
        <LoadingState message="Talepler yükleniyor..." />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TicketRow item={item} />}
          contentContainerStyle={items.length ? { paddingBottom: insets.bottom + spacing["2xl"] } : styles.emptyWrap}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListEmptyComponent={<EmptyState title="Talep bulunamadı" subtitle="Seçili filtrede talep yok." />}
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

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pressed: { backgroundColor: colors.surfaceTertiary },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  main: { flex: 1, gap: 2 },
  subject: { color: colors.onSurface, fontSize: fontSize.lg, fontWeight: "600" },
  sub: { color: colors.muted, fontSize: fontSize.sm },
  time: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  right: { alignItems: "flex-end", gap: spacing.xs },
  priorityPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  priorityText: { fontSize: fontSize.sm, fontWeight: "700" },
  emptyWrap: { flexGrow: 1 },
}));
