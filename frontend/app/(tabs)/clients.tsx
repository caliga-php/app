import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { flattenPages, useClients } from "@/src/api/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { useAuth } from "@/src/store/connection";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TextField } from "@/src/ui/Input";
import { FilterChips, type ChipItem } from "@/src/ui/FilterChips";
import { Header, Screen } from "@/src/ui/Screen";
import { ClientRow } from "@/src/ui/rows";
import { EmptyState, ErrorState, ListFooter, LoadingState } from "@/src/ui/states";

const STATUS_CHIPS: ChipItem[] = [
  { value: "", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Pasif" },
  { value: "blocked", label: "Engelli" },
];

export default function Clients() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { can } = useAuth();

  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setKeyword(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useClients(keyword, status);
  const items = useMemo(() => flattenPages(query), [query]);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <Screen>
      <Header
        title="Müşteriler"
        subtitle={query.data ? `${query.data.pages[0]?.items.length ? items.length : 0} görüntüleniyor` : undefined}
      />
      <View style={styles.toolbar}>
        <TextField
          placeholder="İsim, e-posta veya telefon ara..."
          value={search}
          onChangeText={setSearch}
          testID="clients-search-input"
          returnKeyType="search"
        />
      </View>
      <FilterChips items={STATUS_CHIPS} selected={status} onSelect={setStatus} />

      {query.isLoading ? (
        <LoadingState message="Müşteriler yükleniyor..." />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ClientRow item={item} />}
          contentContainerStyle={items.length ? { paddingBottom: bottomChrome + spacing["2xl"] } : styles.emptyWrap}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListEmptyComponent={<EmptyState title="Müşteri bulunamadı" subtitle="Arama veya filtreyi değiştirin." />}
          ListFooterComponent={<ListFooter loading={query.isFetchingNextPage} />}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.brandPrimary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {can("Clients/CreateClient") ? (
        <Pressable
          onPress={() => router.push("/client/new")}
          style={[styles.fab, { bottom: bottomChrome + spacing.lg }]}
          testID="client-add-fab"
          accessibilityLabel="Yeni müşteri"
        >
          <Plus size={26} color={colors.onBrandPrimary} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyWrap: {
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
}));
