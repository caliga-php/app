import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCurrencyCode, useInvoice } from "@/src/api/hooks";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { fontSize, makeStyles, spacing } from "@/src/theme";
import { Header, Screen } from "@/src/ui/Screen";
import { Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { AmountHeader, LinkRow } from "@/src/ui/detail";

export default function InvoiceDetail() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();
  const invoice = useInvoice(id);

  if (invoice.isLoading) {
    return (
      <Screen>
        <Header title="Fatura" back />
        <LoadingState message="Yükleniyor..." />
      </Screen>
    );
  }
  if (invoice.isError || !invoice.data) {
    return (
      <Screen>
        <Header title="Fatura" back />
        <ErrorState error={invoice.error} onRetry={() => invoice.refetch()} />
      </Screen>
    );
  }

  const inv = invoice.data;
  const code = codeOf(inv.currency_id);

  return (
    <Screen>
      <Header title={`Fatura ${inv.number}`} back />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing["2xl"] }]} showsVerticalScrollIndicator={false}>
        <AmountHeader amount={formatMoney(inv.total, code)} status={inv.status} />

        <View style={styles.section}>
          <SectionTitle title="Özet" />
          <Card>
            <FieldRow label="Durum" valueNode={<StatusPill status={inv.status} />} />
            <FieldRow label="Ara Toplam" value={formatMoney(inv.subtotal, code)} />
            <FieldRow label="Vergi" value={formatMoney(inv.tax, code)} />
            <FieldRow label="Toplam" value={formatMoney(inv.total, code)} />
            <FieldRow label="Ödenen" value={formatMoney(inv.total_paid, code)} />
            <FieldRow label="Bakiye" value={formatMoney(inv.balance, code)} />
            <FieldRow label="Ödeme Yöntemi" value={inv.payment_method ?? "-"} />
            <FieldRow label="Oluşturma" value={formatDateTime(inv.created_at)} />
            <FieldRow label="Vade" value={formatDateTime(inv.due_date)} />
            <FieldRow label="Ödeme Tarihi" value={formatDateTime(inv.paid_at)} />
          </Card>
        </View>

        {inv.client ? (
          <View style={styles.section}>
            <SectionTitle title="Müşteri" />
            <Card>
              <LinkRow
                title={inv.client.full_name}
                subtitle={inv.client.email}
                onPress={() => router.push(`/client/${inv.client.id}`)}
              />
            </Card>
          </View>
        ) : null}

        {Array.isArray(inv.items) && inv.items.length ? (
          <View style={styles.section}>
            <SectionTitle title="Kalemler" />
            <Card>
              {inv.items.map((it: any, i: number) => (
                <View key={i} style={styles.item}>
                  <Text style={styles.itemName} numberOfLines={3}>
                    {it.description ?? "Kalem"}
                  </Text>
                  <Text style={styles.itemAmount}>{formatMoney(it.total_amount ?? it.amount, code)}</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {Array.isArray(inv.payments) && inv.payments.length ? (
          <View style={styles.section}>
            <SectionTitle title="Ödemeler" />
            <Card>
              {inv.payments.map((p: any, i: number) => (
                <View key={i} style={styles.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{p.payment_method ?? "Ödeme"}</Text>
                    <Text style={styles.itemSub}>{formatDateTime(p.paid_at ?? p.created_at)}</Text>
                  </View>
                  <Text style={styles.itemAmount}>{formatMoney(p.amount_in ?? p.amount, code)}</Text>
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
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemName: { color: colors.onSurface, fontSize: fontSize.base, fontWeight: "600", flex: 1 },
  itemSub: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  itemAmount: { color: colors.onSurface, fontSize: fontSize.base, fontWeight: "700" },
}));
