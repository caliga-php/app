import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LifeBuoy, Server, ShoppingCart, Users, Wallet, ReceiptText } from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  flattenPages,
  useClients,
  useClientsStats,
  useInvoices,
  useInvoiceStats,
  useOrdersCount,
  useTicketStats,
} from "@/src/api/hooks";
import { formatMoney } from "@/src/lib/format";
import { usesNativeTabs } from "@/src/navigation";
import { useAuth } from "@/src/store/connection";
import { fontSize, makeStyles, spacing } from "@/src/theme";
import { Header, Screen } from "@/src/ui/Screen";
import { KpiCard, SectionTitle } from "@/src/ui/primitives";
import { ClientRow, InvoiceRow } from "@/src/ui/rows";
import { EmptyState } from "@/src/ui/states";

export default function Dashboard() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { adminName, activeProfile, can } = useAuth();

  const clientsStats = useClientsStats();
  const ticketStats = useTicketStats();
  const ordersCount = useOrdersCount();
  const invoiceStats = useInvoiceStats();
  const recentClients = useClients();
  const recentInvoices = useInvoices();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["clients-stats"] }),
      qc.invalidateQueries({ queryKey: ["ticket-stats"] }),
      qc.invalidateQueries({ queryKey: ["orders-count"] }),
      qc.invalidateQueries({ queryKey: ["invoice-stats"] }),
      qc.invalidateQueries({ queryKey: ["clients"] }),
      qc.invalidateQueries({ queryKey: ["invoices"] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const stats = clientsStats.data;
  const clients = flattenPages(recentClients).slice(0, 5);
  const invoices = flattenPages(recentInvoices).slice(0, 5);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const host = activeProfile?.baseUrl.replace(/^https?:\/\//, "").replace(/\/api\/v1\/admin$/, "");

  return (
    <Screen>
      <Header title="Panel" subtitle={adminName ? `${adminName} · ${host}` : host} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomChrome + spacing["2xl"] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {can("Clients/GetClientsStats") ? (
            <>
              <KpiCard label="Müşteriler" value={num(stats?.total)} icon={Users} tone="info" onPress={() => router.push("/(tabs)/clients")} testID="kpi-clients" />
              <KpiCard label="Aktif Hizmet" value={num(stats?.active_services)} icon={Server} tone="success" testID="kpi-services" />
              <KpiCard label="Ödenmemiş Fatura" value={num(stats?.unpaid_invoices)} icon={ReceiptText} tone="warning" onPress={() => router.push("/(tabs)/billing")} testID="kpi-unpaid" />
              <KpiCard label="Kredi Bakiyesi" value={stats?.credit_balance_formatted ?? formatMoney(stats?.credit_balance)} icon={Wallet} tone="info" testID="kpi-credit" />
            </>
          ) : null}
          {can("Tickets/GetTicketStats") ? (
            <KpiCard label="Açık Talepler" value={num(ticketStats.data?.total)} icon={LifeBuoy} tone="info" onPress={() => router.push("/tickets")} testID="kpi-tickets" />
          ) : null}
          {can("Orders/GetOrders") ? (
            <KpiCard label="Siparişler" value={num(ordersCount.data)} icon={ShoppingCart} tone="info" onPress={() => router.push("/(tabs)/billing")} testID="kpi-orders" />
          ) : null}
        </View>

        {can("Invoices/GetInvoiceStats") && invoiceStats.data ? (
          <View style={styles.banner} testID="unpaid-banner">
            <Text style={styles.bannerLabel}>Bu ay ödenmemiş</Text>
            <Text style={styles.bannerValue}>
              {formatMoney(invoiceStats.data.amount)} · {invoiceStats.data.count} adet
            </Text>
          </View>
        ) : null}

        {can("Clients/GetClients") ? (
          <View style={styles.section}>
            <SectionTitle title="Son Müşteriler" />
            <View style={styles.listCard}>
              {clients.length ? (
                clients.map((c) => <ClientRow key={c.id} item={c} />)
              ) : (
                <EmptyState title="Müşteri yok" />
              )}
            </View>
          </View>
        ) : null}

        {can("Invoices/GetInvoices") ? (
          <View style={styles.section}>
            <SectionTitle title="Son Faturalar" />
            <View style={styles.listCard}>
              {invoices.length ? (
                invoices.map((inv) => <InvoiceRow key={inv.id} item={inv} />)
              ) : (
                <EmptyState title="Fatura yok" />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function num(n?: number | null): string {
  if (n === undefined || n === null) return "-";
  return new Intl.NumberFormat("tr-TR").format(n);
}

const useStyles = makeStyles((colors) => ({
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  banner: {
    backgroundColor: colors.brandTertiary,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerLabel: {
    color: colors.onBrandTertiary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  bannerValue: {
    color: colors.onBrandTertiary,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  section: {
    gap: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
}));
