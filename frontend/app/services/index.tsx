import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { flattenPages, useServices } from "@/src/api/hooks";
import { spacing, useTheme } from "@/src/theme";
import { Header, Screen } from "@/src/ui/Screen";
import { ServiceRow } from "@/src/ui/rows";
import { EmptyState, ErrorState, ListFooter, LoadingState } from "@/src/ui/states";

export default function ServicesList() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { client_id } = useLocalSearchParams<{ client_id?: string }>();
  const query = useServices(client_id);
  const items = useMemo(() => flattenPages(query), [query]);

  return (
    <Screen>
      <Header title="Hizmetler" subtitle={client_id ? "Müşteriye ait" : undefined} back />
      {query.isLoading ? (
        <LoadingState message="Hizmetler yükleniyor..." />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ServiceRow item={item} />}
          contentContainerStyle={items.length ? { paddingBottom: insets.bottom + spacing["2xl"] } : { flexGrow: 1 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListEmptyComponent={<EmptyState title="Hizmet bulunamadı" />}
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
