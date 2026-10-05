import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrencyCode, useOrder } from "@/src/api/hooks";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { fontSize, makeStyles, spacing } from "@/src/theme";
import { Header, Screen } from "@/src/ui/Screen";
import { Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { AmountHeader, LinkRow } from "@/src/ui/detail";

export default function OrderDetail() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();
  const order = useOrder(id);

  if (order.isLoading) {
    return (
      <Screen>
        <Header title="Sipariş" back />
        <LoadingState message="Yükleniyor..." />
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen>
        <Header title="Sipariş" back />
        <ErrorState error={order.error} onRetry={() => order.refetch()} />
      </Screen>
    );
  }

  const o = order.data;
  const code = codeOf(o.currency_id);

  return (
    <Screen>
      <Header title={`Sipariş #${o.order_number}`} back />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing["2xl"] }]} showsVerticalScrollIndicator={false}>
        <AmountHeader amount={formatMoney(o.amount, code)} status={o.status} />

        <View style={styles.section}>
          <SectionTitle title="Sipariş Bilgisi" />
          <Card>
            <FieldRow label="Sipariş No" value={`#${o.order_number}`} />
            <FieldRow label="Durum" valueNode={<StatusPill status={o.status} />} />
            <FieldRow label="Ödeme Yöntemi" value={o.payment_method ?? "-"} />
            <FieldRow label="Müşteri" value={o.client?.full_name} />
            <FieldRow label="Oluşturma" value={formatDateTime(o.created_at)} />
            <FieldRow label="IP" value={o.ip ?? "-"} />
          </Card>
        </View>

        {o.invoice ? (
          <View style={styles.section}>
            <SectionTitle title="Fatura" />
            <Card>
              <LinkRow
                title={`Fatura ${o.invoice.number}`}
                subtitle={formatMoney(o.invoice.total, code)}
                right={<StatusPill status={o.invoice.status} />}
                onPress={() => router.push(`/invoice/${o.invoice.id}`)}
              />
            </Card>
          </View>
        ) : null}

        {Array.isArray(o.items) && o.items.length ? (
          <View style={styles.section}>
            <SectionTitle title="Kalemler" />
            <Card>
              {o.items.map((it: any, i: number) => (
                <View key={i} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {it.product_name ?? it.name ?? "Kalem"}
                    </Text>
                    <Text style={styles.itemSub}>
                      {it.billing_cycle ?? ""} · {it.quantity ?? 1} adet
                      {it.domain ? ` · ${it.domain}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.itemAmount}>{formatMoney(it.total ?? it.price, code)}</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {Array.isArray(o.services) && o.services.length ? (
          <View style={styles.section}>
            <SectionTitle title="Hizmetler" />
            <Card>
              {o.services.map((sv: any, i: number) => (
                <View key={i} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {sv.name}
                    </Text>
                    <Text style={styles.itemSub}>{sv.options?.domain ?? sv.type ?? ""}</Text>
                  </View>
                  <StatusPill status={sv.status} />
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemName: { color: colors.onSurface, fontSize: fontSize.base, fontWeight: "600" },
  itemSub: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  itemAmount: { color: colors.onSurface, fontSize: fontSize.base, fontWeight: "700" },
}));
