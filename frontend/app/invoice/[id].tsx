import { useLocalSearchParams, useRouter } from "expo-router";
import { BadgeCheck, Bell, CreditCard, SlidersHorizontal } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { messageForError } from "@/src/api/errors";
import { useCurrencyCode, useInvoice, useInvoiceAction } from "@/src/api/hooks";
import { formatDateTime, formatMoney, statusLabel } from "@/src/lib/format";
import { useAuth } from "@/src/store/connection";
import { fontSize, makeStyles, spacing, useTheme } from "@/src/theme";
import { TextField } from "@/src/ui/Input";
import { ActionList, Sheet, type SheetAction } from "@/src/ui/Sheet";
import { Header, Screen } from "@/src/ui/Screen";
import { Button, Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { AmountHeader, LinkRow } from "@/src/ui/detail";
import { useToast } from "@/src/ui/Toast";

const INVOICE_STATUSES = ["paid", "unpaid", "cancelled", "refund", "collections"];

export default function InvoiceDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();
  const invoice = useInvoice(id);
  const invAction = useInvoiceAction(id);

  const [sheet, setSheet] = useState(false);
  const [statusSheet, setStatusSheet] = useState(false);
  const [paySheet, setPaySheet] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");

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

  const run = async (fn: () => Promise<unknown>, label: string) => {
    setSheet(false);
    try {
      await fn();
      toast.show(`${label} başarılı`, "success");
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

  const actions: SheetAction[] = [];
  if (can("Invoices/UpdateInvoiceStatus"))
    actions.push({ label: "Durumu Değiştir", icon: BadgeCheck, testID: "inv-status", onPress: () => { setSheet(false); setStatusSheet(true); } });
  if (can("Invoices/AddInvoicePayment"))
    actions.push({ label: "Ödeme Ekle", icon: CreditCard, tone: "success", testID: "inv-payment", onPress: () => { setSheet(false); setPayAmount(String(inv.balance ?? inv.total ?? "")); setPaySheet(true); } });
  if (can("Invoices/RemindInvoice"))
    actions.push({ label: "Hatırlatma Gönder", icon: Bell, testID: "inv-remind", onPress: () => run(() => invAction.remind.mutateAsync(), "Hatırlatma") });
  if (can("Invoices/FormalizeInvoice") && !inv.formalized)
    actions.push({ label: "Resmileştir", icon: BadgeCheck, testID: "inv-formalize", onPress: () => run(() => invAction.formalize.mutateAsync(), "Resmileştirme") });

  return (
    <Screen>
      <Header
        title={`Fatura ${inv.number}`}
        back
        right={
          actions.length ? (
            <Pressable onPress={() => setSheet(true)} hitSlop={10} testID="invoice-actions-button">
              <SlidersHorizontal size={22} color={colors.onSurface} />
            </Pressable>
          ) : undefined
        }
      />
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

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Fatura İşlemleri">
        <ActionList actions={actions} />
      </Sheet>

      <Sheet visible={statusSheet} onClose={() => setStatusSheet(false)} title="Durum Seç">
        <ActionList
          actions={INVOICE_STATUSES.map((st) => ({
            label: statusLabel(st),
            testID: `inv-status-${st}`,
            tone: inv.status === st ? "info" : undefined,
            onPress: async () => {
              setStatusSheet(false);
              try {
                await invAction.setStatus.mutateAsync(st);
                toast.show("Durum güncellendi", "success");
              } catch (e) {
                toast.show(messageForError(e), "error");
              }
            },
          }))}
        />
      </Sheet>

      <Sheet visible={paySheet} onClose={() => setPaySheet(false)} title="Ödeme Ekle">
        <View style={{ gap: spacing.md }}>
          <TextField label="Tutar" value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" testID="pay-amount" />
          <TextField label="Ödeme Yöntemi" value={payMethod} onChangeText={setPayMethod} placeholder="Örn. Havale" testID="pay-method" />
          <Button
            label="Ödemeyi Kaydet"
            onPress={async () => {
              const amount = parseFloat(payAmount.replace(",", "."));
              if (!amount || amount <= 0) {
                toast.show("Geçerli bir tutar girin", "error");
                return;
              }
              try {
                await invAction.addPayment.mutateAsync({ amount, payment_method: payMethod || undefined });
                setPaySheet(false);
                toast.show("Ödeme eklendi", "success");
              } catch (e) {
                toast.show(messageForError(e), "error");
              }
            }}
            loading={invAction.addPayment.isPending}
            full
            testID="pay-submit"
          />
        </View>
      </Sheet>
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
